# Vault 215 TTRPG — Cloud Deployment Guide

This guide explains how to host the real-time sync server so your whole party can connect their Pip-Boys automatically during a session.

---

## Architecture Overview

```
[Player Browser]  ─── Socket.IO ──►  [Vault 215 Sync Server]  ◄─── Socket.IO ─── [Overseer Browser]
  stats.html                           Node.js / Express                            overseerhub.html
  (playerSync.js)                      (server.js)                                  (overseerSync.js)
```

The server is a lightweight Node.js process. All player state is held in memory per session — no database needed. On reconnect, players re-send their local `playerData` and the server re-syncs everyone. **Campaign and player data is now also persisted to disk** in the `campaigns/` directory so it survives server restarts.

---

## Quick Start (Local / LAN)

```bash
# 1. Clone the repo and install dependencies
git clone https://github.com/Supernightmare9/Fall-out-Pipboy-TTRPG.git
cd Fall-out-Pipboy-TTRPG
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum change ADMIN_CODE to something secret

# 3. Start the server
npm start
# → Vault 215 sync server running on http://localhost:3000

# 4. Open pages in a browser served from the same origin
# (the server already serves static files from repo root)
# Player: http://localhost:3000/pages/player/stats.html
# Overseer: http://localhost:3000/pages/overseer/overseerhub.html
```

---

## Configuring the Browser Clients

Before syncing, each browser must know the server URL, session code, and (for Overseer) the admin code.  
Run these lines in the browser's **DevTools console** and then **reload the page**:

### Player (stats.html and combat.html)
```js
localStorage.setItem('PIPBOY_SERVER_URL',   'https://your-server.com');  // or http://localhost:3000
localStorage.setItem('PIPBOY_SESSION_CODE', 'VAULT01');   // any shared code the whole party uses
localStorage.setItem('PIPBOY_PLAYER_HANDLE', 'Jade');     // player's display name
```

Both `stats.html` and `combat.html` read the same localStorage keys — set them once and both pages sync automatically.

### Overseer (overseerhub.html)
```js
localStorage.setItem('PIPBOY_SERVER_URL',   'https://your-server.com');
localStorage.setItem('PIPBOY_SESSION_CODE', 'VAULT01');   // same as players
localStorage.setItem('PIPBOY_ADMIN_CODE',   'OVERSEER215'); // must match server ADMIN_CODE in .env
```

A status bar appears at the bottom of each page showing the live connection state.

---

## Deploying to the Cloud

### Render (recommended — free tier available)

1. Push your repo to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect your GitHub repo.
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add environment variables in the Render dashboard:
   | Key | Value |
   |-----|-------|
   | `ADMIN_CODE` | your secret GM code |
   | `CORS_ORIGIN` | `https://your-render-app.onrender.com` |
6. Click **Deploy**. Render sets `PORT` automatically.

### Heroku

```bash
# Install Heroku CLI, then:
heroku create vault215-ttrpg
heroku config:set ADMIN_CODE=YourSecretCode CORS_ORIGIN=https://vault215-ttrpg.herokuapp.com
git push heroku main
```

### Glitch

1. Go to [glitch.com](https://glitch.com) → **New Project** → **Import from GitHub**.
2. Paste your repo URL.
3. Edit `.env` in the Glitch editor (Glitch keeps `.env` private).
4. Glitch starts the server automatically with `npm start`.
5. Your live URL is `https://your-project.glitch.me`.

### VPS / Bare Metal (Ubuntu example)

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

cd /opt/vault215
npm install

# Run with pm2 for auto-restart
npm install -g pm2
pm2 start server.js --name vault215
pm2 save && pm2 startup

# Optional: nginx reverse proxy so port 80/443 forwards to :3000
# See: https://www.nginx.com/resources/wiki/start/topics/examples/proxy/
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port. Set automatically by Render/Heroku. |
| `ADMIN_CODE` | `OVERSEER215` | Secret code the GM uses to authenticate as Overseer. **Change this!** |
| `CORS_ORIGIN` | `*` | Allowed Socket.IO origin. Use your exact front-end URL in production. |

---

## Session / Room Model

- A **session** is identified by a short code (e.g. `VAULT01`).
- Any player who knows the session code can join.
- The Overseer must supply both the session code **and** the `ADMIN_CODE`.
- Multiple sessions can run on the same server simultaneously.
- Player data persists in memory for the lifetime of the server process.  
  Players who disconnect and reconnect get their data back automatically.

---

## Campaign Persistence (Disk Storage)

Campaign and player data is saved to the **`campaigns/`** directory as JSON files (one per session code).

### When saves happen automatically

| Trigger | Behaviour |
|---------|-----------|
| **Server startup** | Loads all `campaigns/*.json` back into memory |
| **Every 5 minutes** | Periodic autosave runs while the server is running |
| **Server shutdown** (`Ctrl+C` / `SIGTERM`) | All sessions flushed to disk before exit |
| **Manual save** | Click **[💾 SAVE TO SERVER]** in the Overseer UI |

### First-run seed campaigns

On first run (no `*.json` files in `campaigns/`), two starter campaigns are automatically created:

| Session code | Campaign | Players |
|---|---|---|
| `VAULT01` | Demo | `test` (dev character — only in non-production mode) |
| `SAFEHAVEN` | Safe Haven | David, Moe, Zach, Katie, Jade, Nikki |

Players join the Safe Haven campaign using `PIPBOY_SESSION_CODE=SAFEHAVEN` in their browser `localStorage`.

### Backing up campaign data

```bash
# macOS / Linux
cp -r campaigns/ ~/vault215-backup-$(date +%Y%m%d)/

# Windows
xcopy campaigns\ vault215-backup\ /E /I
```

Campaign JSON files are excluded from Git by `.gitignore`.  
Add specific files or the whole folder to a backup medium or a private Git repo if you want version-controlled history.

### Restoring a campaign

1. Copy the `*.json` files back into the `campaigns/` directory.
2. Restart the server — it loads them at startup.

Or use **[IMPORT CAMPAIGN]** in the Overseer UI to restore a JSON backup without restarting.

### Cloud deployment note

Platforms with **ephemeral filesystems** (e.g. Render free tier, Heroku dynos) will lose the `campaigns/` files on every redeploy or sleep/wake cycle.  
For production persistence on these platforms, either:
- Use a persistent disk / mount (Render paid tier, or a VPS)
- Run `pm2` on a VPS (see below) — the filesystem is permanent
- Regularly export campaign backups via the Overseer UI and store them off-server

---

## Socket.IO Event Reference

| Emitted by | Event | Payload | Description |
|-----------|-------|---------|-------------|
| Player | `player:join` | `{ sessionCode, playerHandle, initialData? }` | Join a session |
| Player | `player:update` | `{ field, value }` | Push a field change |
| Overseer | `overseer:join` | `{ sessionCode, adminCode }` | Authenticate and join |
| Overseer | `overseer:update-player` | `{ playerHandle, field, value }` | Push change to a player |
| Overseer | `overseer:request-snapshot` | — | Request full player list |
| Overseer | `combat:start` | `{ turnOrder: string[] }` | Start combat with given handle order |
| Overseer | `combat:end` | — | End combat |
| Overseer | `combat:next-turn` | — | Advance to the next turn |
| Overseer | `combat:prev-turn` | — | Go back to the previous turn |
| Overseer | `combat:set-turn` | `{ index: number }` | Jump to a specific turn index |
| Any | `combat:request-state` | — | Request the current combat state |
| Server→Player | `session:joined` | `{ role, sessionCode, playerHandle, data }` | Confirm join |
| Server→Player | `player:updated-by-overseer` | `{ field, value, snapshot }` | Overseer pushed a change |
| Server→Overseer | `session:joined` | `{ role, sessionCode, players[] }` | Confirm join + player list |
| Server→Overseer | `overseer:player-joined` | `{ handle, data }` | New player connected |
| Server→Overseer | `overseer:player-update` | `{ handle, field, value, snapshot }` | Player changed data |
| Server→Overseer | `overseer:player-disconnected` | `{ handle }` | Player went offline |
| Server→All | `combat:state-updated` | `{ active, round, currentTurnIndex, turnOrder }` | Combat state changed |

---

## Live Combat Feature (combat.html)

The `pages/player/combat.html` page includes a **⚔ Live Combat** panel at the top that activates when the Socket.IO sync is configured.

### What it shows
- **Initiative tracker** with round counter and turn order
- **Player cards** for each connected player showing:
  - HP and AP with live progress bars
  - S.P.E.C.I.A.L. stats (pulled from server — the same values as stats.html)
  - Active status effects (debuffs and boosts)
- **Take Damage / Heal buttons** — enabled only when it is that player's own turn

### How it works
1. Players open `combat.html` — it connects to the server via `PlayerSync` (same session code as `stats.html`)
2. The Overseer opens `overseerhub.html` and sees the **Live Combat — Real-Time Sync** panel
3. The Overseer clicks **[▶ START COMBAT]** to begin; this broadcasts turn order to all clients
4. The current player's card **glows gold** on every connected page simultaneously
5. Players can apply damage or healing on their own turn via the action buttons
6. The Overseer can edit HP/AP for any player at any time from the sync panel

---

## Multi-Tab / Multi-Device QA Checklist

Use this checklist to verify the real-time sync works across devices before a session.

### Setup
- [ ] Server deployed and accessible (confirm `/health` endpoint returns `{"status":"ok"}`)
- [ ] At least 2 player browser tabs and 1 Overseer tab open (can be same device for solo testing)
- [ ] All tabs have `PIPBOY_SERVER_URL`, `PIPBOY_SESSION_CODE` set; overseer has `PIPBOY_ADMIN_CODE` set
- [ ] All tabs show **● LIVE** or **● STANDBY** in their sync status bar

### Player Sync (stats.html ↔ server)
- [ ] Open `stats.html` in Tab A as player "Alice", open `stats.html` in Tab B as player "Bob"
- [ ] Change Alice's HP on the Overseer → Alice's stats.html reflects the new value instantly
- [ ] Change Bob's XP on the Overseer → Bob's stats.html updates instantly
- [ ] Modify Alice's S.P.E.C.I.A.L. on her stats.html → Overseer console reflects the change

### Combat Sync (combat.html)
- [ ] Open `combat.html` as player "Alice" — Live Combat panel shows "STANDBY"
- [ ] On the Overseer, click **[▶ START COMBAT]** → all combat.html tabs switch to "COMBAT ACTIVE"
- [ ] Alice's card glows on both Alice's combat.html AND the Overseer console (Alice is first in order)
- [ ] Alice's S.P.E.C.I.A.L. stats in combat.html match her stats.html values exactly (no drift)
- [ ] Alice's "Take Damage" and "Heal" buttons are enabled; Bob's are disabled (not Alice's turn)
- [ ] Alice clicks "Take Damage" → enters amount → HP decreases on all tabs simultaneously
- [ ] Overseer clicks **[NEXT ▶]** → Bob's card glows, Alice's stops; Bob's buttons become active
- [ ] Overseer edits Bob's HP from the sync panel → Bob's combat.html and stats.html both update
- [ ] Overseer clicks **[■ END COMBAT]** → all cards return to normal, round counter resets
- [ ] Reload Alice's combat.html tab → panel reconnects, shows correct current combat state and HP

### Cross-Page Data Consistency
- [ ] Damage dealt in combat.html → HP on stats.html is updated to match
- [ ] Overseer sets a player's special stat → same value shows in combat.html grid
- [ ] Status effect applied via Overseer → appears in player's combat.html card

### Disconnect / Reconnect
- [ ] Close a player tab; Overseer console shows the player offline
- [ ] Reopen the same player's page → player reconnects, data is restored from server

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Status bar stays "OFFLINE" | Check `PIPBOY_SERVER_URL` is set correctly in `localStorage`. Make sure the server is running. |
| "AUTH FAILED" in Overseer status bar | The `PIPBOY_ADMIN_CODE` in localStorage doesn't match `ADMIN_CODE` in the server `.env`. |
| CORS errors in browser console | Set `CORS_ORIGIN` in `.env` to your exact front-end URL (no trailing slash). |
| Data doesn't survive server restart | Campaigns are auto-saved to `campaigns/*.json`. If files are missing, the server may be running on a platform with an ephemeral filesystem (see *Cloud deployment note* above). Use **[💾 SAVE TO SERVER]** before restarting, or deploy on a VPS with a persistent disk. |
| Two players use the same handle | Handles must be unique per session. The second join replaces the first player's socket. |
