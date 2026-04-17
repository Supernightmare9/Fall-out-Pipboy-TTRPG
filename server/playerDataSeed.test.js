/**
 * playerDataSeed.test.js
 * Validates the shape and key fields of the seeded player data so that
 * regressions (e.g. missing statsLocked, broken SPECIAL values) are caught
 * before they reach the live server.
 */

'use strict';

const {
  SEED_SESSION_CODE,
  SEED_PLAYER_HANDLE,
  TEST_PLAYER_DATA,
  DILLON_PLAYER_HANDLE,
  DILLON_PLAYER_DATA
} = require('./playerDataSeed');

// ── Constants ─────────────────────────────────────────────────────────────────

const SPECIAL_KEYS = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'];

// ── SEED_SESSION_CODE ─────────────────────────────────────────────────────────

describe('SEED_SESSION_CODE', () => {
  test('is a non-empty string', () => {
    expect(typeof SEED_SESSION_CODE).toBe('string');
    expect(SEED_SESSION_CODE.length).toBeGreaterThan(0);
  });
});

// ── DILLON_PLAYER_HANDLE ──────────────────────────────────────────────────────

describe('DILLON_PLAYER_HANDLE', () => {
  test('is "dillon"', () => {
    expect(DILLON_PLAYER_HANDLE).toBe('dillon');
  });
});

// ── TEST_PLAYER_DATA S.P.E.C.I.A.L. ──────────────────────────────────────────

describe('TEST_PLAYER_DATA special', () => {
  test('has all seven S.P.E.C.I.A.L. keys as numbers', () => {
    SPECIAL_KEYS.forEach(function (key) {
      expect(typeof TEST_PLAYER_DATA.special[key]).toBe('number');
    });
  });

  test('no SPECIAL value is negative', () => {
    SPECIAL_KEYS.forEach(function (key) {
      expect(TEST_PLAYER_DATA.special[key]).toBeGreaterThanOrEqual(0);
    });
  });
});

// ── DILLON_PLAYER_DATA ────────────────────────────────────────────────────────

describe('DILLON_PLAYER_DATA identity', () => {
  test('name is Dillon', () => {
    expect(DILLON_PLAYER_DATA.name).toBe('Dillon');
  });

  test('raceSelected is true', () => {
    expect(DILLON_PLAYER_DATA.raceSelected).toBe(true);
  });

  test('specialAllocationActive is false', () => {
    expect(DILLON_PLAYER_DATA.specialAllocationActive).toBe(false);
  });

  test('statsLocked is true (SPECIAL is finalised, not editable)', () => {
    expect(DILLON_PLAYER_DATA.statsLocked).toBe(true);
  });
});

describe('DILLON_PLAYER_DATA special', () => {
  test('has all seven S.P.E.C.I.A.L. keys as numbers', () => {
    SPECIAL_KEYS.forEach(function (key) {
      expect(typeof DILLON_PLAYER_DATA.special[key]).toBe('number');
    });
  });

  test('luck is exactly 0 (valid minimum)', () => {
    // This exercises the zero-value path: `sp.luck || 5` would silently
    // upgrade luck to 5, which is wrong.
    expect(DILLON_PLAYER_DATA.special.luck).toBe(0);
  });

  test('endurance is 6 (drives the 160 HP calculation)', () => {
    expect(DILLON_PLAYER_DATA.special.endurance).toBe(6);
  });

  test('total SPECIAL points equal specialPointAllocation (28)', () => {
    var total = SPECIAL_KEYS.reduce(function (sum, k) {
      return sum + DILLON_PLAYER_DATA.special[k];
    }, 0);
    expect(total).toBe(DILLON_PLAYER_DATA.specialPointAllocation);
  });

  test('no SPECIAL value is negative', () => {
    SPECIAL_KEYS.forEach(function (key) {
      expect(DILLON_PLAYER_DATA.special[key]).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('DILLON_PLAYER_DATA hp', () => {
  test('hp matches maxHp (160)', () => {
    expect(DILLON_PLAYER_DATA.hp).toBe(160);
    expect(DILLON_PLAYER_DATA.maxHp).toBe(160);
  });
});

describe('DILLON_PLAYER_DATA perks', () => {
  test('has Human race perk and Yao Guai gene pool perk', () => {
    var perks = DILLON_PLAYER_DATA.perks;
    var hasHuman   = perks.some(function (p) { return /human/i.test(p); });
    var hasYaoGuai = perks.some(function (p) { return /yao guai/i.test(p); });
    expect(hasHuman).toBe(true);
    expect(hasYaoGuai).toBe(true);
  });
});
