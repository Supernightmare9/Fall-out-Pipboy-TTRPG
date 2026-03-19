// campaigns.js
// Campaign Management System for Fall-out Pipboy TTRPG
// This is the central source of truth for all active and past campaign data.
// status: "active" | "paused" | "ended"

const CAMPAIGNS = [
  {
    id: "campaign_001",
    name: "The Mojave Wasteland",
    overseerId: "Overseer",
    status: "active",
    created: "2025-03-19",
    description: "A new group of vault dwellers emerges into the unforgiving Mojave Desert. Factions vie for power, ancient secrets lie buried in the sand, and every choice carries consequences. Can the party carve out a place in this broken world—or will it swallow them whole?",

    // ── PLAYERS ─────────────────────────────────────────────────────────────
    // References character IDs defined in accounts.js
    players: [
      {
        username: "Jade",
        characterId: "char_jade_1",
        characterName: "Jade",
        currentHp: 100,
        maxHp: 100,
        joinedDate: "2025-03-19"
      },
      {
        username: "Katie",
        characterId: "char_katie_1",
        characterName: "Katie",
        currentHp: 100,
        maxHp: 100,
        joinedDate: "2025-03-19"
      },
      {
        username: "Moe",
        characterId: "char_moe_1",
        characterName: "Moe",
        currentHp: 100,
        maxHp: 100,
        joinedDate: "2025-03-19"
      },
      {
        username: "Nikki",
        characterId: "char_nikki_1",
        characterName: "Nikki",
        currentHp: 100,
        maxHp: 100,
        joinedDate: "2025-03-19"
      },
      {
        username: "Zach",
        characterId: "char_zach_1",
        characterName: "Zach",
        currentHp: 100,
        maxHp: 100,
        joinedDate: "2025-03-19"
      },
      {
        username: "David",
        characterId: "char_david_1",
        characterName: "David",
        currentHp: 100,
        maxHp: 100,
        joinedDate: "2025-03-19"
      }
    ],

    // ── ACTIVE ENCOUNTER ────────────────────────────────────────────────────
    // Populated by the Overseer when a combat encounter begins.
    // Enemy entries here are instances copied from enemies.js with a unique instanceId.
    activeEncounter: {
      enemies: [],      // Active enemy instances (copied from ENEMIES pool)
      combatants: [],   // All combatants in initiative order (players + enemies)
      round: 0,
      status: "inactive" // "inactive" | "active" | "completed"
    },

    // ── CAMPAIGN CONTENT ────────────────────────────────────────────────────
    // NPCs, enemies, and items added to this campaign from the global pools.
    npcs: [],           // NPC IDs from npcs.js assigned to this campaign
    availableEnemies: [],   // Enemy IDs from enemies.js available in this campaign
    availableItems: [],     // Item IDs from items.js available in this campaign

    // ── COMMUNICATION ───────────────────────────────────────────────────────
    // In-game messages between the Overseer and players.
    // Each message: { id, from, to, text, timestamp, read }
    messages: [],

    // ── SESSION HISTORY ─────────────────────────────────────────────────────
    // Log of completed sessions.
    // Each session: { id, date, summary, xpAwarded, lootDistributed }
    sessions: []
  }
];
