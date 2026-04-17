/**
 * playerDataSeed.js
 * -----------------
 * Seeded player data for LOCAL DEVELOPMENT and manual/stat sync testing only.
 *
 * ⚠️  DEV NOTE: The players defined here are NOT real player accounts.
 *     They exist solely to allow developers to:
 *       • Test stat calculations and S.P.E.C.I.A.L. bonus integration
 *       • Verify real-time sync behaviour without a live session
 *       • Exercise UI pages (stats, combat, inventory) with predictable data
 *       • Demo character creation with a pre-built character (Dillon)
 *     DO NOT include these profiles in production player lists or real games.
 *
 * Usage: Required by server.js, which seeds SEED_SESSION_CODE / SEED_PLAYER_HANDLE
 * (and DILLON_PLAYER_HANDLE) into the in-memory session store before any socket
 * connections are made.
 */

'use strict';

/** Session code used when pre-seeding the test players at startup. */
const SEED_SESSION_CODE   = 'VAULT01';

/** Handle (player ID) for the developer test character. */
const SEED_PLAYER_HANDLE  = 'test';

/**
 * Full player data snapshot for the generic test character.
 * All fields match the shape produced by defaultPlayerData() in server.js,
 * with representative values chosen to exercise a variety of game systems.
 */
const TEST_PLAYER_DATA = {
  // ── Identity ────────────────────────────────────────────────────────────────
  name:  'Test Character',

  // ── Progression ─────────────────────────────────────────────────────────────
  xp:    150,
  level: 2,

  // ── Health & Action Points ───────────────────────────────────────────────────
  hp:              110,
  maxHp:           110,
  actionPoints:    12,
  maxActionPoints: 20,

  // ── Derived combat stats ─────────────────────────────────────────────────────
  radiation:  0,
  ac:         10,
  critChance: 5,

  // ── S.P.E.C.I.A.L. ──────────────────────────────────────────────────────────
  // Balanced sample build — good for exercising most stat-bonus code paths.
  special: {
    strength:     5,
    perception:   7,
    endurance:    6,
    charisma:     4,
    intelligence: 5,
    agility:      6,
    luck:         5
  },

  // ── Skills (Fallout 14-skill set) ────────────────────────────────────────────
  // Representative values; tag skills are noted in tagSkills below.
  skills: {
    Barter:           10,
    'Small Guns':     35,   // TAG: firearms
    'Big Guns':        5,
    'Melee Weapons':  30,   // TAG: melee
    'Energy Weapons': 10,
    Explosives:        5,
    Lockpick:         15,
    Medicine:         20,
    Science:          25,   // TAG: science
    Repair:           20,   // proxy for crafting
    Sneak:            15,
    Speech:           10,
    Unarmed:          15,
    Survival:         20
  },

  // Tag skills chosen at character creation
  tagSkills: ['Small Guns', 'Melee Weapons', 'Science'],

  // ── Skill point pool ─────────────────────────────────────────────────────────
  skillPointsAvailable:   0,
  skillsLocked:           true,
  skillsAllocationActive: false,
  skillsLockBaseline:     {},

  // ── Perks ────────────────────────────────────────────────────────────────────
  perks:               [],
  perkPointsAvailable: 0,
  perkSelectionActive: false,

  // ── Status effects ───────────────────────────────────────────────────────────
  debuffs: [],
  boosts:  [],

  // ── Inventory ────────────────────────────────────────────────────────────────
  // Small starter kit representative of a typical Wasteland character.
  inventory: [
    { name: '10mm Pistol', quantity: 1, type: 'weapon'    },
    { name: 'Stimpak',     quantity: 3, type: 'consumable' },
    { name: 'Rad-X',       quantity: 2, type: 'consumable' },
    { name: 'Caps',        quantity: 50, type: 'currency'  }
  ],

  // ── Character creation ────────────────────────────────────────────────────────
  // Race and gene pool are intentionally unset on the generic test character
  // so it exercises the pre-selection code paths.
  raceSelected:            false,
  specialAllocationActive: false,
  baseRace:                null,
  genePool:                null,
  isPureblood:             null,
  specialPointAllocation:  0,

  // ── Developer meta ───────────────────────────────────────────────────────────
  // Flags this record so future code can skip it in production player lists.
  _devOnly: true,
  _devNote: 'Auto-seeded test character — for local development use only.'
};

// ── Dillon — Demo / Campaign Player ──────────────────────────────────────────
/**
 * Handle for the Dillon demo player.
 * Connect with handle 'dillon' + session 'VAULT01' to access this character.
 */
const DILLON_PLAYER_HANDLE = 'dillon';

/**
 * Pre-built demo character for Dillon.
 *
 * Dillon is a Human who opted into the Yao Guai gene pool, granting the
 * "Animal Instinct" perk (1 action surge per long rest).  Because he mixed
 * his DNA he is NOT a pureblood.
 *
 * His S.P.E.C.I.A.L. allocation has been locked in and is ready for play,
 * making this an ideal demo/test character for the full character-creation
 * flow and downstream stat-allocation code paths.
 */
const DILLON_PLAYER_DATA = {
  // ── Identity ────────────────────────────────────────────────────────────────
  name: 'Dillon',

  // ── Progression ─────────────────────────────────────────────────────────────
  xp:    0,
  level: 1,

  // ── Health & Action Points ───────────────────────────────────────────────────
  // HP formula: 100 + 10 × Endurance (END 6 → 160 base HP).
  // Placeholder; the client recalculates maxHp after SPECIAL is confirmed.
  hp:              160,
  maxHp:           160,
  actionPoints:    10,
  maxActionPoints: 20,

  // ── Derived combat stats ─────────────────────────────────────────────────────
  radiation:  0,
  ac:         10,
  critChance: 5,

  // ── S.P.E.C.I.A.L. ──────────────────────────────────────────────────────────
  // Human point pool: 28 points.  Allocating from 0: each stat starts at 0
  // and the player spends 28 total.  Build focuses on balanced combat/charisma:
  // S5 P5 E6 C4 I4 A4 L0 = 28 points spent.
  special: {
    strength:     5,
    perception:   5,
    endurance:    6,
    charisma:     4,
    intelligence: 4,
    agility:      4,
    luck:         0
  },

  // ── Skills ───────────────────────────────────────────────────────────────────
  skills: {
    Barter:           0,
    'Small Guns':     0,
    'Big Guns':       0,
    'Melee Weapons':  0,
    'Energy Weapons': 0,
    Explosives:       0,
    Lockpick:         0,
    Medicine:         0,
    Science:          0,
    Repair:           0,
    Sneak:            0,
    Speech:           0,
    Unarmed:          0,
    Survival:         0
  },

  tagSkills: [],

  // ── Skill point pool ─────────────────────────────────────────────────────────
  skillPointsAvailable:   0,
  skillsLocked:           false,
  skillsAllocationActive: false,
  skillsLockBaseline:     {},

  // ── Perks ────────────────────────────────────────────────────────────────────
  // Race starting perk: "One extra Perk at Level 1" (Human bonus).
  // Gene pool perk: "Animal Instinct — Gain 1 action surge per long rest" (Yao Guai).
  perks: [
    'One extra Perk at Level 1 (Human)',
    'Animal Instinct: Gain 1 action surge per long rest (Yao Guai)'
  ],
  selectedPerks:       [],
  perkPointsAvailable: 1,   // Human race grants +1 perk at level 1
  perkSelectionActive: true,

  // ── Status effects ───────────────────────────────────────────────────────────
  debuffs: [],
  boosts:  [],

  // ── Inventory ────────────────────────────────────────────────────────────────
  inventory: [
    { name: 'Vault Suit',  quantity: 1, type: 'armor'     },
    { name: 'Stimpak',     quantity: 2, type: 'consumable' },
    { name: 'Caps',        quantity: 25, type: 'currency'  }
  ],

  // ── Character creation ────────────────────────────────────────────────────────
  // Race: Human — 28 SPECIAL points, no caps, saving throw free choice.
  // statsLocked: true — SPECIAL allocation is finalized; the stats page treats
  // these values as read-only and does not allow further SPECIAL adjustments.
  raceSelected: true,
  specialAllocationActive: false, // locked in, ready to play
  statsLocked: true,

  baseRace: {
    name: 'Human',
    description: 'The average wastelander, versatile and common throughout the wastes.',
    hitDie: '(1d6) 100 + 10 per Endurance point.',
    startingPerksAndTraits: 'One extra Perk at Level 1',
    specialCaps: {
      enduranceMin: null, enduranceMax: null,
      strengthMin:  null, strengthMax:  null,
      perceptionMin:null, perceptionMax:null,
      charismaMin:  null, charismaMax:  null,
      intelligenceMin:null,intelligenceMax:null,
      agilityMin:   null, agilityMax:   null,
      luckMin:      null, luckMax:      null
    },
    specialPointAllocation: 28,
    savingThrowProf: ['Player may choose both']
  },

  // Gene Pool: Yao Guai — "Animal Instinct" starting perk.
  genePool: {
    name: 'Yao Guai',
    description: 'Mutated black bears that are incredibly territorial and fierce.',
    startingPerk: 'Animal Instinct: Gain 1 action surge per long rest'
  },

  isPureblood:            false, // mixed DNA — not pureblood
  specialPointAllocation: 28,

  // ── Developer meta ───────────────────────────────────────────────────────────
  _devOnly: true,
  _devNote: 'Demo character Dillon — pre-built Human/Yao Guai for dev/demo use only.'
};

module.exports = {
  SEED_SESSION_CODE,
  SEED_PLAYER_HANDLE,
  TEST_PLAYER_DATA,
  DILLON_PLAYER_HANDLE,
  DILLON_PLAYER_DATA
};
