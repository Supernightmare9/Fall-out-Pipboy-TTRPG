/**
 * playerDataSeed.js
 * -----------------
 * Seeded player data for LOCAL DEVELOPMENT and manual/stat sync testing only.
 *
 * ⚠️  DEV NOTE: The 'test' player defined here is NOT a real player account.
 *     It exists solely to allow developers to:
 *       • Test stat calculations and S.P.E.C.I.A.L. bonus integration
 *       • Verify real-time sync behaviour without a live session
 *       • Exercise UI pages (stats, combat, inventory) with predictable data
 *     DO NOT include this profile in production player lists or real games.
 *
 * Usage: Required by server.js, which seeds SEED_SESSION_CODE / SEED_PLAYER_HANDLE
 * into the in-memory session store before any socket connections are made.
 */

'use strict';

/** Session code used when pre-seeding the test player at startup. */
const SEED_SESSION_CODE   = 'VAULT01';

/** Handle (player ID) for the developer test character. */
const SEED_PLAYER_HANDLE  = 'test';

/**
 * Full player data snapshot for the test character.
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

  // ── Developer meta ───────────────────────────────────────────────────────────
  // Flags this record so future code can skip it in production player lists.
  _devOnly: true,
  _devNote: 'Auto-seeded test character — for local development use only.'
};

module.exports = { SEED_SESSION_CODE, SEED_PLAYER_HANDLE, TEST_PLAYER_DATA };
