# Vault 215 TTRPG System

A complete tabletop RPG management system built with vanilla JavaScript, designed for collaborative gameplay with Overseer (Game Master) and Player perspectives.

## Features

- 🎮 **Complete Combat System** - Initiative tracking, turn management, enemy encounters
- 👤 **Character Management** - Player characters with stats, inventory, quests
- 🎯 **Overseer Controls** - Game master tools for campaign management
- ⚙️ **Customization** - Player color customization, display names, themes
- 💾 **Data Persistence** - Auto-save system with export/import
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

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
- Customize display settings

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
│   ├── xp.js          # XP system
│   └── settings.js    # Settings logic
└── helpers/           # Helper functions
    ├── settingsManager.js   # Settings management
    ├── storageManager.js    # Data persistence
    └── utils.js             # Utility functions
css/
├── style.css          # Main stylesheet (consolidated)
pages/
├── index.html         # Login page
├── character.html     # Player character sheet
├── overseer.html      # Overseer control panel
└── settings.html      # Player settings
```

## How to Play

### For Players
1. Login with your username
2. View your character stats
3. Manage your HP with quick buttons
4. See party members' status
5. View quests and inventory
6. Customize your display in Settings

### For Overseer
1. Login with PIN (082998)
2. Select campaign
3. Add enemies to encounter
4. Manage initiative and rounds
5. Track combat with the combat log
6. Export campaign for backup

## Settings & Customization

- **Display Color:** Customize your character's color theme
- **Display Name:** Set a custom name for your character
- **Theme:** Choose dark or light mode
- **Font:** Select your preferred font
- **Sound/Notifications:** Toggle sound effects

Settings are saved and synced across devices using your username.

## Data Persistence

- **Auto-Save:** Game automatically saves every 30 seconds
- **Export:** Download campaign as JSON backup
- **Import:** Upload JSON to restore campaign
- **Recovery:** System recovers from crashes automatically

## System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Node.js 18+ (for the real-time sync server)

## Known Features

- ✅ Multi-user support
- ✅ Real-time multiplayer (Socket.IO / WebSockets)
- ✅ LAN / local network play
- ✅ Combat tracking
- ✅ HP management
- ✅ Initiative system
- ✅ Enemy management
- ✅ Campaign data
- ✅ Auto-save
- ✅ Export/Import
- ✅ Settings persistence
- ✅ Responsive design

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
