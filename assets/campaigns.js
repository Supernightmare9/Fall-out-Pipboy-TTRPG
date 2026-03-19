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
        ac: 14,
        initiative: 0,
        inInitiative: false,
        status: "alive",
        proficiencyBonus: 2,
        stats: { str: 14, dex: 16, con: 13, int: 12, wis: 14, cha: 10 },
        skills: ["Stealth", "Perception", "Acrobatics"],
        abilities: ["Sneak Attack", "Cunning Action"],
        joinedDate: "2025-03-19"
      },
      {
        username: "Katie",
        characterId: "char_katie_1",
        characterName: "Katie",
        currentHp: 100,
        maxHp: 100,
        ac: 16,
        initiative: 0,
        inInitiative: false,
        status: "alive",
        proficiencyBonus: 2,
        stats: { str: 18, dex: 10, con: 16, int: 8, wis: 12, cha: 14 },
        skills: ["Athletics", "Intimidation", "Survival"],
        abilities: ["Second Wind", "Action Surge", "Fighting Style"],
        joinedDate: "2025-03-19"
      },
      {
        username: "Moe",
        characterId: "char_moe_1",
        characterName: "Moe",
        currentHp: 100,
        maxHp: 100,
        ac: 12,
        initiative: 0,
        inInitiative: false,
        status: "alive",
        proficiencyBonus: 2,
        stats: { str: 10, dex: 14, con: 12, int: 16, wis: 13, cha: 15 },
        skills: ["Arcana", "History", "Investigation"],
        abilities: ["Spellcasting", "Arcane Recovery"],
        joinedDate: "2025-03-19"
      },
      {
        username: "Nikki",
        characterId: "char_nikki_1",
        characterName: "Nikki",
        currentHp: 100,
        maxHp: 100,
        ac: 13,
        initiative: 0,
        inInitiative: false,
        status: "alive",
        proficiencyBonus: 2,
        stats: { str: 10, dex: 12, con: 14, int: 13, wis: 17, cha: 16 },
        skills: ["Medicine", "Insight", "Persuasion"],
        abilities: ["Spellcasting", "Divine Domain", "Channel Divinity"],
        joinedDate: "2025-03-19"
      },
      {
        username: "Zach",
        characterId: "char_zach_1",
        characterName: "Zach",
        currentHp: 100,
        maxHp: 100,
        ac: 15,
        initiative: 0,
        inInitiative: false,
        status: "alive",
        proficiencyBonus: 2,
        stats: { str: 12, dex: 15, con: 13, int: 10, wis: 14, cha: 11 },
        skills: ["Nature", "Animal Handling", "Survival"],
        abilities: ["Natural Explorer", "Favored Enemy", "Hunter's Mark"],
        joinedDate: "2025-03-19"
      },
      {
        username: "David",
        characterId: "char_david_1",
        characterName: "David",
        currentHp: 100,
        maxHp: 100,
        ac: 11,
        initiative: 0,
        inInitiative: false,
        status: "alive",
        proficiencyBonus: 2,
        stats: { str: 8, dex: 12, con: 13, int: 15, wis: 13, cha: 18 },
        skills: ["Performance", "Persuasion", "Deception"],
        abilities: ["Bardic Inspiration", "Jack of All Trades", "Song of Rest"],
        joinedDate: "2025-03-19"
      }
    ],

    // ── ACTIVE ENCOUNTER ────────────────────────────────────────────────────
    // Populated by the Overseer when a combat encounter begins.
    // Enemy entries here are instances copied from enemies.js with a unique instanceId.
    activeEncounter: {
      enemies: [],      // Active enemy instances (copied from ENEMIES pool)
      combatants: [],   // All combatants in initiative order (players + enemies)
      round: 1,         // Rounds start at 1; increments each time the initiative order cycles
      status: "inactive", // "inactive" | "active" | "completed"
      startTime: null
    },

    // ── CAMPAIGN CONTENT ────────────────────────────────────────────────────
    // NPCs, enemies, and items added to this campaign from the global pools.
    npcs: [],           // NPC IDs from npcs.js assigned to this campaign
    availableEnemies: [],   // Enemy IDs from enemies.js available in this campaign
    availableItems: [],     // Item IDs from items.js available in this campaign

    // ── INVENTORY ───────────────────────────────────────────────────────────
    // Shared party inventory. Each item: { id, name, quantity, weight, value, type, description }
    // type: "gear" | "weapon" | "armor" | "consumable" | "misc"
    inventory: [
      { id: "item_001", name: "Pip-Boy 3000", quantity: 1, weight: 2, value: 0, type: "gear", description: "Personal Information Processor. Tracks stats, inventory, and quests." },
      { id: "item_002", name: "Stimpak", quantity: 8, weight: 0.5, value: 75, type: "consumable", description: "Healing medication. Restores 30 HP when used." },
      { id: "item_003", name: "Combat Knife", quantity: 2, weight: 1, value: 40, type: "weapon", description: "Standard-issue combat knife. 1d6 piercing damage." },
      { id: "item_004", name: "10mm Pistol", quantity: 1, weight: 2.5, value: 150, type: "weapon", description: "Reliable sidearm. 1d8 piercing damage, range 30/90." },
      { id: "item_005", name: "Leather Armor", quantity: 2, weight: 10, value: 100, type: "armor", description: "Light armor made from brahmin hide. AC 11 + DEX modifier." },
      { id: "item_006", name: "Rad-X", quantity: 5, weight: 0.1, value: 30, type: "consumable", description: "Anti-radiation drug. Grants resistance to radiation damage for 1 hour." },
      { id: "item_007", name: "Nuka-Cola", quantity: 3, weight: 1, value: 10, type: "consumable", description: "Slightly radioactive soft drink. Restores 5 HP, 1 RAD." },
      { id: "item_008", name: "Bobby Pin", quantity: 20, weight: 0, value: 1, type: "misc", description: "Used for lockpicking." },
      { id: "item_009", name: "Caps", quantity: 350, weight: 0, value: 1, type: "misc", description: "Bottle caps — the currency of the wasteland." },
      { id: "item_010", name: "Vault 215 Jumpsuit", quantity: 6, weight: 1, value: 5, type: "armor", description: "Standard-issue Vault-Tec jumpsuit. No armor bonus." }
    ],

    // ── QUESTS ──────────────────────────────────────────────────────────────
    // Active and completed quests. status: "active" | "completed" | "failed"
    quests: [
      {
        id: "quest_001",
        title: "Emerge from the Vault",
        description: "Vault 215 has opened for the first time. Venture into the Mojave Wasteland and establish a base of operations.",
        progress: 100,
        objectives: [
          { text: "Exit Vault 215", completed: true },
          { text: "Survive the first night", completed: true },
          { text: "Find a safe camp", completed: true }
        ],
        reward: { xp: 200, caps: 50, items: [] },
        status: "completed"
      },
      {
        id: "quest_002",
        title: "First Contact",
        description: "Make contact with a local settlement and learn about the political landscape of the Mojave.",
        progress: 60,
        objectives: [
          { text: "Locate Goodsprings", completed: true },
          { text: "Speak to the locals", completed: true },
          { text: "Learn about the NCR and Legion", completed: false },
          { text: "Report back to Overseer", completed: false }
        ],
        reward: { xp: 500, caps: 100, items: ["item_002"] },
        status: "active"
      },
      {
        id: "quest_003",
        title: "Water Supply",
        description: "The settlement is running low on clean water. Find a source or purification method.",
        progress: 10,
        objectives: [
          { text: "Investigate water supply", completed: true },
          { text: "Find a purifier or clean water source", completed: false },
          { text: "Secure the water supply", completed: false },
          { text: "Return to settlement", completed: false }
        ],
        reward: { xp: 750, caps: 200, items: ["item_006", "item_007"] },
        status: "active"
      }
    ],

    // ── COMMUNICATION ───────────────────────────────────────────────────────
    // In-game messages between the Overseer and players.
    // Each message: { id, from, timestamp, text, type }
    // type: "normal" | "important"
    messages: [
      {
        id: "msg_001",
        from: "overseer",
        timestamp: "2026-03-19T12:00:00Z",
        text: "Welcome to The Mojave Wasteland campaign! Session begins at 7PM. Make sure you have reviewed your character sheets.",
        type: "normal"
      },
      {
        id: "msg_002",
        from: "overseer",
        timestamp: "2026-03-19T14:30:00Z",
        text: "IMPORTANT: Tonight's session will include a major combat encounter. Prepare your strategies!",
        type: "important"
      },
      {
        id: "msg_003",
        from: "overseer",
        timestamp: "2026-03-19T18:00:00Z",
        text: "One hour until session start. Remember to track your HP changes in real time.",
        type: "normal"
      }
    ],

    // ── SESSION HISTORY ─────────────────────────────────────────────────────
    // Log of completed sessions.
    // Each session: { id, date, summary, xpAwarded, lootDistributed }
    sessions: [
      {
        id: "session_001",
        date: "2025-03-19",
        summary: "The party emerged from Vault 215 and survived their first night in the Mojave.",
        xpAwarded: 200,
        lootDistributed: ["Stimpaks x3", "Caps x50"]
      }
    ]
  }
];
