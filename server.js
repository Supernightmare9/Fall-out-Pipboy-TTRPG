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
      combat: { active: false, round: 1, currentTurnIndex: 0, turnOrder: [] }
    };
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
        io.to(session.overseerSocketId).emit('overseer:player-waiting', {
          handle,
          data: initialData || null
        });
      } else {
        console.log(`[player:join] No Overseer present in session ${code} — ${handle} is pending`);
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
        data:       session.players[handle].data,
        campaignId: session.campaignId || null
      });
    } else {
      console.log(`[player:join] No Overseer present in session ${code} — ${handle} joined but Overseer cannot be notified`);
    }

    console.log(`[player:join] ${handle} → session ${code} (campaignId=${session.campaignId || 'none'})`);
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
