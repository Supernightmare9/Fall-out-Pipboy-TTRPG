// accounts.js
// User Account System for Fall-out Pipboy TTRPG
// Each player account links to one or more characters and a campaign.
// No passwords are stored here — authentication is handled separately.

const DEFAULT_PLAYER_SETTINGS = {
  theme: "dark",             // dark / light
  fontSize: "medium",        // small / medium / large
  fontFamily: "courier-new", // courier-new / courier / roboto-mono / ibm-plex-mono / jetbrains-mono
  uiColors: {
    primary:   "#4ade80",    // Main color (RGB adjustable)
    secondary: "#fbbf24",    // Secondary color (RGB adjustable)
    accent:    "#c084fc"     // Accent color (RGB adjustable)
  },
  soundEnabled: true,
  notificationsEnabled: true,
  volumeLevel: 70            // 0-100
};

const ACCOUNTS = [
  {
    username: "Jade",
    role: "player",
    characters: [
      {
        id: "char_jade_1",
        name: "Jade",
        campaignId: "campaign_001",
        currentHp: 100,
        maxHp: 100,
        displayColor: "#4ade80"
      }
    ],
    settings: { ...DEFAULT_PLAYER_SETTINGS }
  },
  {
    username: "Katie",
    role: "player",
    characters: [
      {
        id: "char_katie_1",
        name: "Katie",
        campaignId: "campaign_001",
        currentHp: 100,
        maxHp: 100,
        displayColor: "#fbbf24"
      }
    ],
    settings: { ...DEFAULT_PLAYER_SETTINGS }
  },
  {
    username: "Moe",
    role: "player",
    characters: [
      {
        id: "char_moe_1",
        name: "Moe",
        campaignId: "campaign_001",
        currentHp: 100,
        maxHp: 100,
        displayColor: "#c084fc"
      }
    ],
    settings: { ...DEFAULT_PLAYER_SETTINGS }
  },
  {
    username: "Nikki",
    role: "player",
    characters: [
      {
        id: "char_nikki_1",
        name: "Nikki",
        campaignId: "campaign_001",
        currentHp: 100,
        maxHp: 100,
        displayColor: "#fb923c"
      }
    ],
    settings: { ...DEFAULT_PLAYER_SETTINGS }
  },
  {
    username: "Zach",
    role: "player",
    characters: [
      {
        id: "char_zach_1",
        name: "Zach",
        campaignId: "campaign_001",
        currentHp: 100,
        maxHp: 100,
        displayColor: "#38bdf8"
      }
    ],
    settings: { ...DEFAULT_PLAYER_SETTINGS }
  },
  {
    username: "David",
    role: "player",
    characters: [
      {
        id: "char_david_1",
        name: "David",
        campaignId: "campaign_001",
        currentHp: 100,
        maxHp: 100,
        displayColor: "#f87171"
      }
    ],
    settings: { ...DEFAULT_PLAYER_SETTINGS }
  },
  {
    username: "Overseer",
    role: "admin",
    // Admin manages campaigns rather than playing characters
    characters: [],
    settings: { ...DEFAULT_PLAYER_SETTINGS }
  }
];
