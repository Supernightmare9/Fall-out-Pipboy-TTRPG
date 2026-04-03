/**
 * Vault 215 TTRPG — Real-Time Sync Server
 * Node.js / Express / Socket.IO backend
 *
 * Features:
 *  - Session-based rooms: players and the Overseer join by session code
 *  - Overseer authenticates with ADMIN_CODE from .env
 *  - In-memory player state (XP, skills, perks, effects, HP)
 *  - All clients receive live updates when any value changes
 *  - Players receive only their own data; Overseer receives all players
 *  - Static file serving so you can open pages/ directly from this server
 *
 * Environment variables (see .env.example):
 *   PORT        – HTTP port (default 3000)
 *   ADMIN_CODE  – Secret code the Overseer must supply when joining
 *   CORS_ORIGIN – Allowed origin for Socket.IO (default *)
 */

'use strict';

require('dotenv').config();

const express   = require('express');
const http      = require('http');
const path      = require('path');
const { Server } = require('socket.io');

const PORT       = process.env.PORT       || 3000;
const ADMIN_CODE = process.env.ADMIN_CODE || 'OVERSEER215';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// ── Dev-only: test player seed ────────────────────────────────────────────────
// Only loaded outside of production to keep the test character out of live games.
const {
  SEED_SESSION_CODE,
  SEED_PLAYER_HANDLE,
  TEST_PLAYER_DATA
} = (process.env.NODE_ENV !== 'production')
  ? require('./server/playerDataSeed')
  : { SEED_SESSION_CODE: null, SEED_PLAYER_HANDLE: null, TEST_PLAYER_DATA: null };

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// ── Serve static files from the repo root so browsers can open pages/ ─────────
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Health-check endpoint (used by Render / Heroku uptime monitors)
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

// ── Campaign discovery endpoint ────────────────────────────────────────────────
// Returns all sessions that currently have an active campaign so that the login
// page can show players which campaigns they can join right now.
app.get('/api/campaigns', (_req, res) => {
  const active = Object.entries(sessions)
    .filter(([, s]) => s.campaignActive)
    .map(([code, s]) => ({
      code:        code,
      campaignId:  s.campaignId || code,
      playerCount: Object.keys(s.players || {}).length
    }));
  res.json({ campaigns: active });
});

// ── In-memory session store ────────────────────────────────────────────────────
//
// sessions = {
//   [sessionCode]: {
//     overseerSocketId : string | null,
//     players          : {
//       [playerHandle]: {
//         socketId : string,
//         data     : { xp, level, skills, perks, effects, hp, actionPoints, special }
//       }
//     }
//   }
// }
const sessions = {};

function getOrCreateSession(code) {
  if (!sessions[code]) {
    sessions[code] = {
      overseerSocketId: null,
      campaignActive: false,
      campaignId: null,
      players: {},
      combat: { active: false, round: 1, currentTurnIndex: 0, turnOrder: [] },
      craftRequests: {}   // { [requestId]: craftRequestObject }
    };
  } else if (!sessions[code].craftRequests) {
    // Back-fill for sessions created before this field existed
    sessions[code].craftRequests = {};
  }
  return sessions[code];
}

/** Return an array of { handle, data } objects for all players in a session */
function allPlayersSnapshot(session) {
  return Object.entries(session.players).map(([handle, p]) => ({
    handle,
    data: p.data
  }));
}

/** Default player data shape */
function defaultPlayerData() {
  return {
    xp: 0,
    level: 1,
    hp: 100,
    maxHp: 100,
    actionPoints: 10,
    maxActionPoints: 20,
    radiation: 0,
    ac: 10,
    critChance: 5,
    special: { strength:5, perception:5, endurance:5, charisma:5, intelligence:5, agility:5, luck:5 },
    skills: {
      Barter:0, 'Small Guns':0, 'Big Guns':0, 'Melee Weapons':0,
      'Energy Weapons':0, Explosives:0, Lockpick:0, Medicine:0,
      Science:0, Repair:0, Sneak:0, Speech:0, Unarmed:0, Survival:0
    },
    tagSkills: [],
    skillPointsAvailable: 0,
    skillsLocked: false,
    skillsAllocationActive: false,
    skillsLockBaseline: {},
    perks: [],
    perkPointsAvailable: 0,
    perkSelectionActive: false,
    debuffs: [],
    boosts: []
  };
}

// ── Pre-seed the 'test' developer player ─────────────────────────────────────
// Inserts the test character into the default session at startup so that any
// client connecting with playerHandle 'test' / sessionCode VAULT01 gets a
// fully populated data object without needing a prior join payload.
// ⚠️  DEV ONLY — skipped in production (NODE_ENV=production).
(function seedTestPlayer() {
  if (!SEED_PLAYER_HANDLE || !TEST_PLAYER_DATA) return; // production guard
  const session = getOrCreateSession(SEED_SESSION_CODE);
  if (!session.players[SEED_PLAYER_HANDLE]) {
    const defaults = defaultPlayerData();
    session.players[SEED_PLAYER_HANDLE] = {
      socketId: null,
      data: Object.assign(defaults, TEST_PLAYER_DATA, {
        // Deep-merge nested objects so any future keys added to defaultPlayerData()
        // are preserved even when TEST_PLAYER_DATA only partially defines them.
        special: Object.assign({}, defaults.special, TEST_PLAYER_DATA.special),
        skills:  Object.assign({}, defaults.skills,  TEST_PLAYER_DATA.skills)
      })
    };
    console.log(`[dev] Seeded test player '${SEED_PLAYER_HANDLE}' into session '${SEED_SESSION_CODE}'`);
  }
}());

// ── Socket.IO connection handling ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[connect] socket ${socket.id}`);

  // ── PLAYER: join session ───────────────────────────────────────────────────
  // Payload: { sessionCode: string, playerHandle: string, initialData?: object }
  socket.on('player:join', ({ sessionCode, playerHandle, initialData } = {}) => {
    if (!sessionCode || !playerHandle) {
      socket.emit('error:join', { message: 'sessionCode and playerHandle are required.' });
      return;
    }

    const code    = String(sessionCode).toUpperCase().trim();
    const handle  = String(playerHandle).trim();
    const session = getOrCreateSession(code);

    // If no campaign is active, hold the player in a waiting state.
    // Store their socket in a pending map on the session so we can
    // automatically complete the join once the Overseer starts the campaign.
    if (!session.campaignActive) {
      socket.join(code);
      socket.data.role        = 'player';
      socket.data.sessionCode = code;
      socket.data.handle      = handle;

      // Keep a pending socket reference so start-campaign can promote them
      if (!session.pendingPlayers) session.pendingPlayers = {};
      session.pendingPlayers[handle] = { socketId: socket.id, initialData: initialData || null };

      socket.emit('campaign:waiting', {
        message: 'Waiting for Overseer to start the campaign…',
        sessionCode: code
      });

      if (session.overseerSocketId) {
        io.to(session.overseerSocketId).emit('overseer:player-waiting', { handle });
      }

      console.log(`[player:join] ${handle} → session ${code} (waiting for campaign)`);
      return;
    }

    // Re-joining: keep existing data unless fresh initialData is provided
    if (!session.players[handle]) {
      session.players[handle] = {
        socketId: socket.id,
        data: Object.assign(defaultPlayerData(), initialData || {})
      };
    } else {
      session.players[handle].socketId = socket.id;
      if (initialData) {
        Object.assign(session.players[handle].data, initialData);
      }
    }

    socket.join(code);
    socket.data.role        = 'player';
    socket.data.sessionCode = code;
    socket.data.handle      = handle;

    // Confirm join + send back current data
    socket.emit('session:joined', {
      role: 'player',
      sessionCode: code,
      playerHandle: handle,
      data: session.players[handle].data
    });

    // Notify Overseer (if present) that a player connected
    if (session.overseerSocketId) {
      io.to(session.overseerSocketId).emit('overseer:player-joined', {
        handle,
        data: session.players[handle].data
      });
    }

    console.log(`[player:join] ${handle} → session ${code}`);
  });

  // ── OVERSEER: join session ─────────────────────────────────────────────────
  // Payload: { sessionCode: string, adminCode: string }
  socket.on('overseer:join', ({ sessionCode, adminCode } = {}) => {
    if (!sessionCode || !adminCode) {
      socket.emit('error:join', { message: 'sessionCode and adminCode are required.' });
      return;
    }

    if (String(adminCode).trim() !== ADMIN_CODE) {
      socket.emit('error:auth', { message: 'Invalid admin code.' });
      return;
    }

    const code    = String(sessionCode).toUpperCase().trim();
    const session = getOrCreateSession(code);

    session.overseerSocketId = socket.id;
    socket.join(code);
    socket.data.role        = 'overseer';
    socket.data.sessionCode = code;

    // Send full session snapshot to Overseer (including campaign status)
    socket.emit('session:joined', {
      role: 'overseer',
      sessionCode: code,
      campaignActive: session.campaignActive,
      campaignId: session.campaignId,
      players: allPlayersSnapshot(session)
    });

    // Send any pending craft requests so the Overseer sees them immediately
    const pendingRequests = Object.values(session.craftRequests || {});
    if (pendingRequests.length > 0) {
      socket.emit('craft:pending-requests-sync', { requests: pendingRequests });
    }

    console.log(`[overseer:join] → session ${code}`);
  });

  // ── OVERSEER: start campaign ───────────────────────────────────────────────
  // Payload: { campaignId: string, playerData?: { [handle]: dataObject } }
  // The Overseer sends the authoritative campaign state (loaded from their
  // localStorage).  The server marks the session as active, merges all player
  // data, and broadcasts `campaign:started` + each player's data to every
  // connected player socket (including those held in the pending queue).
  socket.on('overseer:start-campaign', ({ campaignId, playerData } = {}) => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;

    const session = sessions[sessionCode];
    if (!session) return;

    session.campaignActive = true;
    session.campaignId     = campaignId || null;

    // Merge any supplied player data into authoritative server state
    if (playerData && typeof playerData === 'object') {
      Object.entries(playerData).forEach(([handle, data]) => {
        if (!session.players[handle]) {
          session.players[handle] = { socketId: null, data: Object.assign(defaultPlayerData(), data) };
        } else {
          Object.assign(session.players[handle].data, data);
        }
      });
    }

    // Promote pending players: complete their join now that campaign is live.
    // Track which sockets we already sent session:joined so we don't double-send.
    const promotedSockets = new Set();
    const pending = session.pendingPlayers || {};
    Object.entries(pending).forEach(([handle, info]) => {
      if (!session.players[handle]) {
        session.players[handle] = {
          socketId: info.socketId,
          data: Object.assign(defaultPlayerData(), info.initialData || {})
        };
      } else {
        session.players[handle].socketId = info.socketId;
        if (info.initialData) Object.assign(session.players[handle].data, info.initialData);
      }

      const playerSocket = io.sockets.sockets.get(info.socketId);
      if (playerSocket) {
        playerSocket.emit('session:joined', {
          role:         'player',
          sessionCode:  sessionCode,
          playerHandle: handle,
          data:         session.players[handle].data
        });
        promotedSockets.add(info.socketId);
      }
    });
    session.pendingPlayers = {};

    // Broadcast campaign:started to all room members (players receive the event
    // but their primary join confirmation is session:joined, sent below).
    io.to(sessionCode).emit('campaign:started', {
      campaignId: session.campaignId,
      message:    'Campaign started by Overseer.'
    });

    // Send session:joined + authoritative data to every already-connected player
    // that was NOT in the pending queue (they missed the initial join).
    Object.entries(session.players).forEach(([handle, p]) => {
      if (p.socketId && !promotedSockets.has(p.socketId)) {
        io.to(p.socketId).emit('session:joined', {
          role:         'player',
          sessionCode:  sessionCode,
          playerHandle: handle,
          data:         p.data
        });
      }
    });

    // Confirm to Overseer with current snapshot
    socket.emit('overseer:campaign-started', {
      campaignId: session.campaignId,
      players:    allPlayersSnapshot(session)
    });

    console.log(`[overseer:start-campaign] campaignId=${campaignId} session=${sessionCode}`);
  });

  // ── OVERSEER: end campaign ─────────────────────────────────────────────────
  socket.on('overseer:end-campaign', () => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;

    const session = sessions[sessionCode];
    if (!session) return;

    session.campaignActive = false;

    // Broadcast to all players so their UIs can show "campaign ended"
    io.to(sessionCode).emit('campaign:ended', {
      message: 'The Overseer has ended the campaign session.'
    });

    // Confirm to Overseer with final snapshot for localStorage persistence
    socket.emit('overseer:campaign-ended', {
      players: allPlayersSnapshot(session)
    });

    console.log(`[overseer:end-campaign] session=${sessionCode}`);
  });

  // ── OVERSEER: sync campaign (resync after reconnect) ──────────────────────
  // Payload: { campaignId: string, playerData?: { [handle]: dataObject } }
  socket.on('overseer:sync-campaign', ({ campaignId, playerData } = {}) => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;

    const session = sessions[sessionCode];
    if (!session) return;

    // Re-apply campaign ID and player data from Overseer's localStorage
    if (campaignId) session.campaignId = campaignId;
    if (playerData && typeof playerData === 'object') {
      Object.entries(playerData).forEach(([handle, data]) => {
        if (!session.players[handle]) {
          session.players[handle] = { socketId: null, data: Object.assign(defaultPlayerData(), data) };
        } else {
          Object.assign(session.players[handle].data, data);
        }
        // Push updated data to the player if connected
        const p = session.players[handle];
        if (p.socketId) {
          io.to(p.socketId).emit('player:updated-by-overseer', {
            field:    'all',
            value:    p.data,
            snapshot: p.data
          });
        }
      });
    }

    socket.emit('overseer:sync-ack', {
      campaignId: session.campaignId,
      players:    allPlayersSnapshot(session)
    });

    console.log(`[overseer:sync-campaign] campaignId=${campaignId} session=${sessionCode}`);
  });


  // Payload: { field: string, value: any }
  // field can be 'xp','skills','perks','debuffs','boosts','hp','actionPoints',
  //              'special','radiation','ac','critChance','skillPointsAvailable',
  //              'perkPointsAvailable','perkSelectionActive','skillsLocked',
  //              'skillsAllocationActive','tagSkills','selectedPerks','level', ...
  // or pass field='all' with value = full data object to replace everything
  socket.on('player:update', ({ field, value } = {}) => {
    const { role, sessionCode, handle } = socket.data || {};
    if (role !== 'player' || !sessionCode || !handle) return;

    const session = sessions[sessionCode];
    if (!session || !session.players[handle]) return;

    const player = session.players[handle];
    if (field === 'all' && value && typeof value === 'object') {
      Object.assign(player.data, value);
    } else if (field) {
      player.data[field] = value;
    }

    // Echo updated field back to the player as confirmation
    socket.emit('player:ack', { field, value: player.data[field] });

    // Forward update to Overseer
    if (session.overseerSocketId) {
      io.to(session.overseerSocketId).emit('overseer:player-update', {
        handle,
        field,
        value: field === 'all' ? player.data : player.data[field],
        snapshot: player.data
      });
    }
  });

  // ── OVERSEER: push update to a specific player ────────────────────────────
  // Payload: { playerHandle: string, field: string, value: any }
  socket.on('overseer:update-player', ({ playerHandle, field, value } = {}) => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;

    const session = sessions[sessionCode];
    if (!session) return;

    const handle = String(playerHandle).trim();
    const player = session.players[handle];
    if (!player) {
      socket.emit('error:update', { message: `Player "${handle}" not found in session.` });
      return;
    }

    if (field === 'all' && value && typeof value === 'object') {
      Object.assign(player.data, value);
    } else if (field) {
      player.data[field] = value;
    }

    // Push to the player's socket
    io.to(player.socketId).emit('player:updated-by-overseer', {
      field,
      value: field === 'all' ? player.data : player.data[field],
      snapshot: player.data
    });

    // Confirm to Overseer
    socket.emit('overseer:ack', { handle, field });
  });

  // ── OVERSEER: request full session snapshot ────────────────────────────────
  socket.on('overseer:request-snapshot', () => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;
    const session = sessions[sessionCode];
    if (!session) return;
    socket.emit('overseer:snapshot', { players: allPlayersSnapshot(session) });
  });

  // ── OVERSEER: award combat XP to individual players ───────────────────────
  // Payload: { awards: [{ playerHandle, xp, message }] }
  // Immediately delivers per-player XP grants mid-combat.  Each eligible player
  // receives a private 'player:private-message' socket event with their XP amount
  // so they can apply it to ProgressionManager and see a level-up if they cross
  // the threshold.  Ultra / boss enemies are excluded upstream before calling this.
  socket.on('overseer:award-combat-xp', ({ awards } = {}) => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;

    const session = sessions[sessionCode];
    if (!session) return;

    if (!Array.isArray(awards) || awards.length === 0) return;

    awards.forEach(({ playerHandle, xp, message }) => {
      const handle = String(playerHandle || '').trim();
      if (!handle) return;
      const player = session.players[handle];
      if (!player) return;

      // Keep server-side XP tally in sync for the Overseer overview panel
      if (typeof xp === 'number' && xp > 0) {
        player.data.xp = (player.data.xp || 0) + xp;
      }

      // Send private XP notification directly to the player's socket
      if (player.socketId) {
        io.to(player.socketId).emit('player:private-message', {
          type:    'xp_award',
          message: message || `+${xp} XP gained!`,
          xp:      typeof xp === 'number' ? xp : 0
        });
      }
    });

    // Notify Overseer with fresh snapshot so the player overview stays current
    socket.emit('overseer:ack', { action: 'combat-xp-awarded', count: awards.length });
    if (session.overseerSocketId) {
      socket.emit('overseer:snapshot', { players: allPlayersSnapshot(session) });
    }

    console.log(`[overseer:award-combat-xp] session ${sessionCode} | ${awards.length} award(s)`);
  });

  // ── OVERSEER: broadcast mutation event to all players ─────────────────────
  // Payload: { enemyName, effectName, effectDescription }
  // The Overseer calls this after selecting a mutation effect.  The server
  // broadcasts `enemy:mutation-event` to every socket in the session room so
  // all players see the dramatic mutation announcement in their combat feed.
  socket.on('overseer:announce-mutation', ({ enemyName, effectName, effectDescription } = {}) => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;
    const session = sessions[sessionCode];
    if (!session) return;

    const payload = {
      enemyName:         String(enemyName         || '').trim(),
      effectName:        String(effectName        || '').trim(),
      effectDescription: String(effectDescription || '').trim()
    };

    io.to(sessionCode).emit('enemy:mutation-event', payload);
    console.log(`[overseer:announce-mutation] session ${sessionCode} | ${payload.enemyName} → ${payload.effectName}`);
  });

  // ── MESSAGING: roster ──────────────────────────────────────────────────────
  // Returns the list of player handles in the session and whether the Overseer
  // is currently connected.  Any authenticated role may call this.
  socket.on('msg:get-roster', () => {
    const { sessionCode } = socket.data || {};
    if (!sessionCode) return;
    const session = sessions[sessionCode];
    if (!session) return;
    socket.emit('msg:roster', {
      players: Object.keys(session.players),
      overseerOnline: !!session.overseerSocketId
    });
  });

  // ── MESSAGING: send ────────────────────────────────────────────────────────
  // Payload: { to: string[], text: string }
  // Routes a private message to every participant (sender + `to` list).
  // `to` may include player handles and/or the special handle 'overseer'.
  // The server enforces session membership before delivery; it does NOT store
  // messages — each client persists its own log in localStorage.
  socket.on('msg:send', ({ to, text } = {}) => {
    const { role, sessionCode, handle } = socket.data || {};
    if (!sessionCode) return;

    const session = sessions[sessionCode];
    if (!session) return;

    const fromHandle = role === 'overseer' ? 'overseer' : (handle || '');
    if (!fromHandle) return;

    const rawText = String(text || '').trim();
    if (!rawText) return;

    // All valid handles in this session (players + overseer sentinel)
    const validHandles = new Set([...Object.keys(session.players), 'overseer']);

    // Filter recipients: must be valid, non-empty, and not the sender
    const toHandles = (Array.isArray(to) ? to : [])
      .map(h => String(h).trim())
      .filter(h => h && h !== fromHandle && validHandles.has(h));

    if (toHandles.length === 0) return;

    // Sorted participant list → stable, deterministic conversation ID
    const participants = [...new Set([fromHandle, ...toHandles])].sort();
    const convId = participants.join('::');

    const payload = {
      convId,
      participants,
      from:      fromHandle,
      text:      rawText,
      timestamp: Date.now()
    };

    // Deliver only to participants — uninvolved sockets never receive this event
    participants.forEach(ph => {
      if (ph === 'overseer') {
        if (session.overseerSocketId) {
          io.to(session.overseerSocketId).emit('msg:incoming', payload);
        }
      } else {
        const p = session.players[ph];
        if (p && p.socketId) {
          io.to(p.socketId).emit('msg:incoming', payload);
        }
      }
    });

    console.log(`[msg:send] ${fromHandle} → [${toHandles.join(', ')}] session=${sessionCode}`);
  });

  // ── COMBAT: request current state (any connected role) ────────────────────
  socket.on('combat:request-state', () => {
    const { sessionCode } = socket.data || {};
    if (!sessionCode) return;
    const session = sessions[sessionCode];
    if (!session) return;
    socket.emit('combat:state-updated', session.combat);
  });

  // ── COMBAT: overseer starts combat ────────────────────────────────────────
  // Payload: { turnOrder: [handle, handle, ...] }
  socket.on('combat:start', ({ turnOrder } = {}) => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;
    const session = sessions[sessionCode];
    if (!session) return;

    const order = Array.isArray(turnOrder) && turnOrder.length > 0
      ? turnOrder
      : Object.keys(session.players);

    session.combat = { active: true, round: 1, currentTurnIndex: 0, turnOrder: order };
    io.to(sessionCode).emit('combat:state-updated', session.combat);
    console.log(`[combat:start] session ${sessionCode} | order: ${order.join(', ')}`);
  });

  // ── COMBAT: overseer ends combat ──────────────────────────────────────────
  socket.on('combat:end', () => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;
    const session = sessions[sessionCode];
    if (!session) return;

    session.combat = { active: false, round: 1, currentTurnIndex: 0, turnOrder: [] };
    io.to(sessionCode).emit('combat:state-updated', session.combat);
    console.log(`[combat:end] session ${sessionCode}`);
  });

  // ── COMBAT: overseer advances to next turn ────────────────────────────────
  socket.on('combat:next-turn', () => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;
    const session = sessions[sessionCode];
    if (!session || !session.combat.active) return;

    const len = session.combat.turnOrder.length;
    if (len === 0) return;
    session.combat.currentTurnIndex = (session.combat.currentTurnIndex + 1) % len;
    if (session.combat.currentTurnIndex === 0) session.combat.round += 1;
    io.to(sessionCode).emit('combat:state-updated', session.combat);
  });

  // ── COMBAT: overseer goes to previous turn ────────────────────────────────
  socket.on('combat:prev-turn', () => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;
    const session = sessions[sessionCode];
    if (!session || !session.combat.active) return;

    const len = session.combat.turnOrder.length;
    if (len === 0) return;
    if (session.combat.currentTurnIndex === 0) {
      session.combat.round = Math.max(1, session.combat.round - 1);
      session.combat.currentTurnIndex = len - 1;
    } else {
      session.combat.currentTurnIndex -= 1;
    }
    io.to(sessionCode).emit('combat:state-updated', session.combat);
  });

  // ── COMBAT: overseer sets a specific turn index ───────────────────────────
  // Payload: { index: number }
  socket.on('combat:set-turn', ({ index } = {}) => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;
    const session = sessions[sessionCode];
    if (!session || !session.combat.active) return;

    const len = session.combat.turnOrder.length;
    if (len === 0) return;
    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || idx >= len) return;
    session.combat.currentTurnIndex = idx;
    io.to(sessionCode).emit('combat:state-updated', session.combat);
  });

  // ── CRAFTING: player submits custom item for Overseer approval ────────────
  // Payload: { name, description, type, ingredients, totalWeight, totalValue }
  // Creates a pending request stored in session.craftRequests and notifies
  // the Overseer in real-time.
  socket.on('craft:submit-request', ({ name, description, type, ingredients, totalWeight, totalValue } = {}) => {
    const { role, sessionCode, handle } = socket.data || {};
    if (role !== 'player' || !sessionCode || !handle) return;

    const session = sessions[sessionCode];
    if (!session) return;

    const itemName = String(name || '').trim();
    if (!itemName) return;

    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const request = {
      requestId,
      fromHandle:  handle,
      name:        itemName,
      description: String(description || '').trim(),
      type:        String(type || 'misc').trim(),
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      totalWeight: Number(totalWeight) || 0,
      totalValue:  Number(totalValue)  || 0,
      timestamp:   Date.now(),
      status:      'pending'
    };

    session.craftRequests[requestId] = request;

    // Notify Overseer immediately if connected
    if (session.overseerSocketId) {
      io.to(session.overseerSocketId).emit('craft:pending-request', request);
    }

    // Acknowledge to player
    socket.emit('craft:request-submitted', { requestId, message: 'Custom craft request sent to Overseer for approval.' });
    console.log(`[craft:submit-request] ${handle} → "${itemName}" (${requestId}) session=${sessionCode}`);
  });

  // ── CRAFTING: Overseer approves a pending request ─────────────────────────
  // Payload: { requestId, name, description, type, totalWeight, totalValue, notes }
  // Delivers the approved item to the player and saves the recipe for both.
  socket.on('craft:approve', ({ requestId, name, description, type, totalWeight, totalValue, notes } = {}) => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;

    const session = sessions[sessionCode];
    if (!session) return;

    const request = session.craftRequests[requestId];
    if (!request || request.status !== 'pending') return;

    // Build final recipe with any Overseer edits
    const finalName        = String(name        || request.name).trim()        || request.name;
    const finalDescription = String(description || request.description).trim() || request.description;
    const finalType        = String(type        || request.type).trim()        || request.type;
    const finalWeight      = isNaN(Number(totalWeight)) ? request.totalWeight : Number(totalWeight);
    const finalValue       = isNaN(Number(totalValue))  ? request.totalValue  : Number(totalValue);

    const recipe = {
      recipeId:    'recipe_custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name:        finalName,
      description: finalDescription,
      type:        finalType,
      ingredients: request.ingredients,
      weight:      finalWeight,
      value:       finalValue,
      createdBy:   request.fromHandle,
      notes:       String(notes || '').trim(),
      approvedAt:  Date.now()
    };

    request.status = 'approved';
    request.recipe = recipe;

    // Deliver approval + item + recipe to the player
    const playerEntry = session.players[request.fromHandle];
    if (playerEntry && playerEntry.socketId) {
      io.to(playerEntry.socketId).emit('craft:request-approved', {
        requestId,
        recipe,
        message: 'Your custom craft request was approved!'
      });
    }

    // Also send recipe to Overseer for their master recipe book
    socket.emit('craft:recipe-saved', { recipe, source: 'approved-request' });

    // Clean up
    delete session.craftRequests[requestId];
    console.log(`[craft:approve] requestId=${requestId} for ${request.fromHandle} → "${finalName}" session=${sessionCode}`);
  });

  // ── CRAFTING: Overseer rejects a pending request ──────────────────────────
  // Payload: { requestId, reason }
  socket.on('craft:reject', ({ requestId, reason } = {}) => {
    const { role, sessionCode } = socket.data || {};
    if (role !== 'overseer' || !sessionCode) return;

    const session = sessions[sessionCode];
    if (!session) return;

    const request = session.craftRequests[requestId];
    if (!request || request.status !== 'pending') return;

    request.status = 'rejected';

    const playerEntry = session.players[request.fromHandle];
    if (playerEntry && playerEntry.socketId) {
      io.to(playerEntry.socketId).emit('craft:request-rejected', {
        requestId,
        itemName: request.name,
        reason:   String(reason || 'Request was not approved.').trim()
      });
    }

    // Clean up
    delete session.craftRequests[requestId];
    console.log(`[craft:reject] requestId=${requestId} for ${request.fromHandle} session=${sessionCode}`);
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const { role, sessionCode, handle } = socket.data || {};
    if (!sessionCode) return;

    const session = sessions[sessionCode];
    if (!session) return;

    if (role === 'player' && handle) {
      // Keep player data in memory; just mark socket gone
      if (session.players[handle]) {
        session.players[handle].socketId = null;
      }
      if (session.overseerSocketId) {
        io.to(session.overseerSocketId).emit('overseer:player-disconnected', { handle });
      }
      console.log(`[disconnect] player ${handle} left session ${sessionCode}`);
    } else if (role === 'overseer') {
      session.overseerSocketId = null;
      io.to(sessionCode).emit('overseer:offline', {});
      console.log(`[disconnect] overseer left session ${sessionCode}`);
    }
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`Vault 215 sync server running on http://localhost:${PORT}`);
  console.log(`Admin code loaded: ${ADMIN_CODE ? '✓ (set)' : '✗ (using default)'}`);
});
