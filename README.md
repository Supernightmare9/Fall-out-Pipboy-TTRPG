# Vault 215 TTRPG System

A complete tabletop RPG management system built with vanilla JavaScript, designed for collaborative gameplay with Overseer (Game Master) and Player perspectives.

## Features

- 🎮 **Complete Combat System** - Initiative tracking, turn management, enemy encounters
- 👤 **Character Management** - Player characters with stats, inventory, quests
- 🎯 **Overseer Controls** - Game master tools for campaign management
- 💾 **Data Persistence** - Auto-save system with export/import
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

> **Note (2026-04-09):** Messaging and Settings features have been removed from both the Player and Overseer sides per owner request. These can be re-implemented in a future update if desired.

## LAN / Local Multiplayer — Quickstart

Follow these steps so everyone on the same Wi-Fi network can play together.

### Step 1 — Host: Start the server

```bash
# Clone the repo (first time only)
git clone https://github.com/Supernightmare9/Fall-out-Pipboy-TTRPG.git
cd Fall-out-Pipboy-TTRPG

# Install dependencies (first time only)
npm install

# (Recommended) Create a .env file and set a private admin code
cp .env.example .env        # then open .env and set ADMIN_CODE=YourSecretCode

# Start the server
npm start
# → Vault 215 sync server running on http://localhost:3000
```

The server listens on `0.0.0.0:3000`, so it is reachable from any device on your network.

---

### Step 2 — Host: Find your local IP address

**Windows**
```
Win + R → type cmd → press Enter
ipconfig
```
Look for **IPv4 Address** under your active adapter (e.g. `192.168.1.42`).

**macOS**
```bash
ipconfig getifaddr en0      # Wi-Fi
# or
ipconfig getifaddr en1      # Ethernet (try if en0 is blank)
```

**Linux**
```bash
ip addr show
# or
hostname -I
```
Look for the `inet` address on your active interface (e.g. `192.168.1.42`).

---

### Step 3 — Players: Open the game in a browser

Replace `<HOST_IP>` with the IP address found in Step 2:

| Who | URL |
|-----|-----|
| **Player** | `http://<HOST_IP>:3000/pages/player/stats.html` |
| **Player (Combat)** | `http://<HOST_IP>:3000/pages/player/combat.html` |
| **Overseer** | `http://<HOST_IP>:3000/pages/overseer/overseerhub.html` |

> **Example:** `http://192.168.1.42:3000/pages/player/stats.html`

---

### Step 4 — Configure sync (one-time per browser)

Each player runs these lines in their browser's **DevTools console** (`F12 → Console`), then **reloads the page**:

**Players**
```js
localStorage.setItem('PIPBOY_SERVER_URL',    'http://<HOST_IP>:3000');
localStorage.setItem('PIPBOY_SESSION_CODE',  'VAULT01');   // any code the whole party shares
localStorage.setItem('PIPBOY_PLAYER_HANDLE', 'YourName');  // your character name
```

**Overseer**
```js
localStorage.setItem('PIPBOY_SERVER_URL',   'http://<HOST_IP>:3000');
localStorage.setItem('PIPBOY_SESSION_CODE', 'VAULT01');         // same code as players
localStorage.setItem('PIPBOY_ADMIN_CODE',   'YourSecretCode');  // must match ADMIN_CODE in your .env
```

A status bar at the bottom of each page shows **● LIVE** once connected.

> ⚠️ **Security note:** The steps above use plain `http://` which is fine for a private home/LAN network.
> Do **not** expose the server on the public internet over plain HTTP — use a reverse proxy with TLS (HTTPS) instead.
> Also, change `ADMIN_CODE` in your `.env` from the default `OVERSEER215` to a private value before playing.

---

## Getting Started

### Login
1. Open `http://<HOST_IP>:3000/pages/index.html` (or `pages/index.html` locally)
2. Enter username (no password required)
3. **For Overseer:** Triple-click "VAULT 215" to reveal PIN pad, enter `082998`

### Player View
- View character stats and HP
- See party members and their status
- Update HP with quick buttons
- View inventory and quests

### Overseer View
- Manage campaigns and encounters
- Track initiative and round order
- Add/remove enemies and manage HP
- View combat log
- Export/import campaigns

## File Structure

```
assets/
├── data/              # Game data files
│   ├── accounts.js    # Player accounts & preferences
│   ├── campaigns.js   # Campaign data
│   ├── enemies.js     # Enemy templates
│   ├── items.js       # Item database
│   └── npcs.js        # NPC data
├── logic/             # Game logic & mechanics
│   └── xp.js          # XP system
└── helpers/           # Helper functions
    ├── storageManager.js    # Data persistence
    └── utils.js             # Utility functions
css/
├── style.css          # Main stylesheet (consolidated)
pages/
├── index.html         # Login page
├── character.html     # Player character sheet
└── overseer.html      # Overseer control panel
```

## How to Play

### For Players
1. Login with your username
2. View your character stats
3. Manage your HP with quick buttons
4. See party members' status
5. View quests and inventory

### For Overseer
1. Login with PIN (082998)
2. Select campaign
3. Add enemies to encounter
4. Manage initiative and rounds
5. Track combat with the combat log
6. Export campaign for backup

## Data Persistence

### Server-side autosave (new)

All campaign and player data is now automatically saved to the **`campaigns/`** directory on the server as JSON files — one file per session code (e.g. `campaigns/SAFEHAVEN.json`).

| When data is saved | How |
|--------------------|-----|
| **Server startup** | All `campaigns/*.json` files are loaded back into memory automatically |
| **Every 5 minutes** | Periodic autosave runs in the background |
| **Server shutdown** | All sessions are flushed to disk before the process exits (`SIGINT` / `SIGTERM`) |
| **Manual save** | Click **[💾 SAVE TO SERVER]** in the Overseer console to save immediately |

### First-run / demo campaigns

On the very first run (no `campaigns/*.json` files exist yet), the server seeds two starter campaigns:

| Session code | Campaign | Players |
|---|---|---|
| `VAULT01` | **Demo** | `test` (dev character) |
| `SAFEHAVEN` | **Safe Haven** | David, Moe, Zach, Katie, Jade, Nikki |

Players for the Safe Haven campaign start with default Fallout S.P.E.C.I.A.L. stats.  
Once campaigns exist on disk, the seed step is skipped automatically.

### Backing up campaign data

Campaign files are **not committed to Git** by default (they are in `.gitignore`).  
To back up your live campaigns, copy the `campaigns/` folder somewhere safe:

```bash
# Windows
xcopy campaigns\ backup\campaigns\ /E /I

# macOS / Linux
cp -r campaigns/ ~/Desktop/vault215-backup/
```

You can also use the **[EXPORT CAMPAIGN]** button in the Overseer UI to download a portable JSON snapshot.

### Restoring a campaign

1. Place the `*.json` files back in the `campaigns/` directory.
2. Restart the server — it will load them automatically.

Alternatively, use **[IMPORT CAMPAIGN]** in the Overseer UI to restore a JSON backup into browser localStorage without restarting the server.

### Client-side auto-save (existing)

Each player's device also saves to **browser localStorage** via `StorageManager`:

- Auto-saves every **30 seconds** in the Overseer UI
- Saves on every major combat action
- Saves on page unload (`beforeunload`)

This means player data is doubly protected: once in the server-side `campaigns/` files and once in each browser's local storage.

## Persistent Campaign Resource Pools

Each campaign maintains its own **resource pools** that survive server restarts and page reloads. Pools are stored as part of the campaign's `.json` file in the `campaigns/` directory.

### Available pools

| Pool | Tab | Description |
|---|---|---|
| **Enemies** | Overseer Hub → ENEMIES | Custom enemies the Overseer can create and reuse across encounters |
| **Items** | Overseer Hub → ITEMS | Custom items and weapons available in the campaign |
| **Crafting Recipes** | Overseer Crafting | Master recipe book, auto-synced alongside localStorage |
| **Perks** | Overseer Hub → PERKS | Custom campaign-specific perks and abilities |

### How it works

- **Autosave**: Every add, edit, or delete in a pool immediately calls `PUT /api/campaigns/:code/pools/:type` on the server, which persists the full pool array to the campaign's `.json` file.
- **Autoload**: When a campaign is loaded (via the campaign selector or page load), the Overseer Hub fetches `GET /api/campaigns/:code/pools` and populates each tab with the stored entries.
- **New campaigns** start with empty pools. You can add content from day one and it will persist automatically.
- **Export**: Each pool tab has an "EXPORT POOL" button to download the pool as a standalone `.json` file for backup or sharing.

### REST API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/campaigns/:code/pools` | Return all pools for a campaign session |
| `PUT` | `/api/campaigns/:code/pools/enemies` | Replace the enemies pool array |
| `PUT` | `/api/campaigns/:code/pools/items` | Replace the items pool array |
| `PUT` | `/api/campaigns/:code/pools/recipes` | Replace the crafting recipes pool array |
| `PUT` | `/api/campaigns/:code/pools/perks` | Replace the perks pool array |

---



- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Node.js 18+ (for the real-time sync server)

## Unified Health Bar System

### Overview

All health state — **current HP**, **max HP**, **Radiation (Rads)**, and **Temp HP** — is stored server-side and managed by a central `HealthManager` module. Both the Player (combat.html) and the Overseer (overseerhub.html) display only the server's canonical values, which are pushed in real time via Socket.IO whenever any health mutation occurs.

### Visual Bar Composition

The health bar is a single segmented strip that represents the player's full `maxHP` width:

| Segment | Colour | Position | Represents |
|---------|--------|----------|------------|
| Green fill | 🟢 Green | Left → right | Current HP (capped at `maxHP − Rads`) |
| Blue overlay | 🔵 Blue | Left → right (over green) | Temp HP buffer (consumed first on damage) |
| Red overlay | 🔴 Red | Right → left | Radiation (shrinks available HP) |

### Health Rules

#### Hit Points (HP)
- Current HP is always between `0` and `effectiveCap = maxHP − Rads`.
- Healing can never raise HP above `effectiveCap`.
- When Rads increase and current HP would exceed the new cap, HP is immediately clamped down.

#### Radiation (Rads)
- Rads reduce the available HP cap: `effectiveCap = maxHP − Rads`.
- Taking Rads clamps `currentHP` (and `tempHealth`) to the new cap immediately.
- **Removing Rads raises the cap but does NOT restore HP** — the player must heal separately up to the new cap.
- Rads are capped at `1000`.
- Rad changes are displayed as a red overlay entering from the right side of the bar.

#### Radiation Sickness
- Triggered automatically when `Rads ≥ 80% of maxHP`.
- Penalty debuffs applied: **STR −2**, **AGI −2**, **Move Speed −1**.
- A "☢ RADIATION SICKNESS" banner is shown to the player.
- The Overseer's player card shows a **☢ RAD SICK** badge.
- Automatically revoked (debuffs removed, message shown) when Rads drop below the 80% threshold.

#### Temp HP
- Temp HP acts as a buffer — **all incoming damage hits Temp HP first**.
- Temp HP cap = `effectiveCap` (`maxHP − Rads`). It can never exceed the radiation-adjusted max.
- When setting Temp HP, only the **highest value wins** (same rule as D&D 5e). An effect granting 8 Temp HP does nothing if you already have 10; one granting 15 replaces 10.
- If Rads increase and the current Temp HP exceeds the new cap, Temp HP is immediately reduced to the cap.

### Damage Processing Order

```
Incoming Damage
  └─ Temp HP > 0?
       ├─ Yes: absorb up to Temp HP remaining
       │         └─ remainder (if any) hits real HP
       └─ No: hits real HP directly
                 └─ HP floors at 0
```

### Server Event Flow

| Event | Direction | Purpose |
|-------|-----------|---------|
| `player:health-mutation` | Client → Server | Player requests a health change |
| `overseer:health-mutation` | Overseer → Server | Overseer applies a change to a specific player |
| `player:health-updated` | Server → Player | Canonical new health state + event messages |
| `overseer:player-health-updated` | Server → Overseer | Same update reflected on the Overseer dashboard |

All validation (caps, clamping, Rad Sickness checks) happens in `assets/logic/health/healthManager.js` on the server — never client-side.

### Mutation Types

| Type | Effect |
|------|--------|
| `damage` | Absorb with Temp HP first, then reduce HP. HP floors at 0. |
| `heal` | Increase HP up to `effectiveCap`. |
| `addRads` | Increase Rads; clamp HP and Temp HP to new cap; check Rad Sickness. |
| `removeRads` | Decrease Rads; HP unchanged; check Rad Sickness revocation. |
| `setTempHp` | Set Temp HP to max of (current, requested), capped at `effectiveCap`. |

### Test Coverage

`assets/logic/health/healthManager.test.js` covers all edge cases:
- Damage with / without Temp HP; Temp HP partial absorption
- HP floor at 0; player-down event
- Healing capped at `effectiveCap`
- Rads increasing HP cap below current HP
- Rads increasing Temp HP cap below current Temp HP
- Rad Sickness onset / clearance
- No duplicate Rad Sickness events
- Full cycle: damage → heal → addRads → removeRads → clearRads

Run with:
```bash
npm test
```

---



## Future Enhancements

- Backend database integration
- Dice roller integration
- Character creation wizard
- Campaign templates
- Audio effects
- Mobile app

## License

Created for Vault 215 TTRPG

---

**Last Updated:** 2026-03-19
