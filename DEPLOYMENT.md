# Vault 215 TTRPG — Cloud Deployment Guide

This guide explains how to host the real-time sync server so your whole party can connect their Pip-Boys automatically during a session.

---

## Architecture Overview

```
[Player Browser]  ─── Socket.IO ──►  [Vault 215 Sync Server]  ◄─── Socket.IO ─── [Overseer Browser]
  stats.html                           Node.js / Express                            overseerhub.html
  (playerSync.js)                      (server.js)                                  (overseerSync.js)
```

The server is a lightweight Node.js process. All player state is held in memory per session — no database needed. On reconnect, players re-send their local `playerData` and the server re-syncs everyone.

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

### Player (stats.html)
```js
localStorage.setItem('PIPBOY_SERVER_URL',   'https://your-server.com');  // or http://localhost:3000
localStorage.setItem('PIPBOY_SESSION_CODE', 'VAULT01');   // any shared code the whole party uses
localStorage.setItem('PIPBOY_PLAYER_HANDLE', 'Jade');     // player's display name
```

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

## Socket.IO Event Reference

| Emitted by | Event | Payload | Description |
|-----------|-------|---------|-------------|
| Player | `player:join` | `{ sessionCode, playerHandle, initialData? }` | Join a session |
| Player | `player:update` | `{ field, value }` | Push a field change |
| Overseer | `overseer:join` | `{ sessionCode, adminCode }` | Authenticate and join |
| Overseer | `overseer:update-player` | `{ playerHandle, field, value }` | Push change to a player |
| Overseer | `overseer:request-snapshot` | — | Request full player list |
| Server→Player | `session:joined` | `{ role, sessionCode, playerHandle, data }` | Confirm join |
| Server→Player | `player:updated-by-overseer` | `{ field, value, snapshot }` | Overseer pushed a change |
| Server→Overseer | `session:joined` | `{ role, sessionCode, players[] }` | Confirm join + player list |
| Server→Overseer | `overseer:player-joined` | `{ handle, data }` | New player connected |
| Server→Overseer | `overseer:player-update` | `{ handle, field, value, snapshot }` | Player changed data |
| Server→Overseer | `overseer:player-disconnected` | `{ handle }` | Player went offline |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Status bar stays "OFFLINE" | Check `PIPBOY_SERVER_URL` is set correctly in `localStorage`. Make sure the server is running. |
| "AUTH FAILED" in Overseer status bar | The `PIPBOY_ADMIN_CODE` in localStorage doesn't match `ADMIN_CODE` in the server `.env`. |
| CORS errors in browser console | Set `CORS_ORIGIN` in `.env` to your exact front-end URL (no trailing slash). |
| Data doesn't survive server restart | The server stores state in memory only. Players should reload their pages after a restart to re-push their `localStorage` data. |
| Two players use the same handle | Handles must be unique per session. The second join replaces the first player's socket. |
