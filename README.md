# Vault 215 TTRPG System

A complete tabletop RPG management system built with vanilla JavaScript, designed for collaborative gameplay with Overseer (Game Master) and Player perspectives.

## Features

- 🎮 **Complete Combat System** - Initiative tracking, turn management, enemy encounters
- 👤 **Character Management** - Player characters with stats, inventory, quests
- 🎯 **Overseer Controls** - Game master tools for campaign management
- ⚙️ **Customization** - Player color customization, display names, themes
- 💾 **Data Persistence** - Auto-save system with export/import
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Getting Started

### Login
1. Open `pages/index.html`
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
- No backend required (all data local)

## Known Features

- ✅ Multi-user support
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
- Real-time multiplayer (WebSockets)
- Dice roller integration
- Character creation wizard
- Campaign templates
- Audio effects
- Mobile app

## License

Created for Vault 215 TTRPG

---

**Last Updated:** 2026-03-19
