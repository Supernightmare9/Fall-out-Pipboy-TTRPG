/**
 * xpdistribution.test.js
 * Tests for centralized XP distribution logic (calcXpWithIntBonus and friends).
 */

'use strict';

// ── Load dependencies in Node context ─────────────────────────────────────────
// xpprogression.js defines XP_TABLE and level-calculation functions
require('./xpprogression');

// xpdistribution.js exports calcXpWithIntBonus and helpers.
// It includes an inline INT bonus table so it is self-contained for Node.js use
// without needing to load the browser-only fallout_stat_bonuses.js.
const xpDist = require('./xpdistribution');
const {
  calcXpWithIntBonus,
  addCombatXP,
  addQuestXP,
  addCraftingXP
} = xpDist;

// ── Helpers ────────────────────────────────────────────────────────────────────
function makePlayer(xp = 0, level = 1, intelligence = 5) {
  return { xp, level, special: { intelligence } };
}

// ── calcXpWithIntBonus ─────────────────────────────────────────────────────────

describe('calcXpWithIntBonus', () => {
  test('INT 5 applies 1.15× multiplier', () => {
    // Math.round(100 * 1.15) = Math.round(114.9999...) = 115
    expect(calcXpWithIntBonus(100, 5)).toBe(115);
  });

  test('INT 1 applies 1.03× multiplier', () => {
    expect(calcXpWithIntBonus(100, 1)).toBe(103);
  });

  test('INT 10 applies 1.30× multiplier', () => {
    expect(calcXpWithIntBonus(100, 10)).toBe(130);
  });

  test('INT 0 is clamped to 1 (1.03× multiplier)', () => {
    expect(calcXpWithIntBonus(100, 0)).toBe(103);
  });

  test('INT 11 is clamped to 10 (1.30× multiplier)', () => {
    expect(calcXpWithIntBonus(100, 11)).toBe(130);
  });

  test('result is rounded to nearest integer', () => {
    // 333 * 1.15 = 382.95 → round → 383
    expect(calcXpWithIntBonus(333, 5)).toBe(383);
  });

  test('null intStat falls back to INT 5', () => {
    expect(calcXpWithIntBonus(200, null)).toBe(230);
  });

  test('undefined intStat falls back to INT 5', () => {
    expect(calcXpWithIntBonus(200, undefined)).toBe(230);
  });

  test('zero rawXp gives zero', () => {
    expect(calcXpWithIntBonus(0, 7)).toBe(0);
  });
});

// ── addCombatXP ────────────────────────────────────────────────────────────────

describe('addCombatXP', () => {
  test('adds modified XP to player.xp', () => {
    const player = makePlayer(0);
    const result = addCombatXP(player, 100, 1.15);
    // Math.round(100 * 1.15) = 115
    expect(result.xpGained).toBe(115);
    expect(player.xp).toBe(115);
  });

  test('uses intBonus=1 when omitted', () => {
    const player = makePlayer(0);
    addCombatXP(player, 100);
    expect(player.xp).toBe(100);
  });

  test('accumulates XP across multiple calls', () => {
    const player = makePlayer(0);
    addCombatXP(player, 100, 1.0);
    addCombatXP(player, 200, 1.0);
    expect(player.xp).toBe(300);
  });

  test('source is recorded in result', () => {
    const player = makePlayer(0);
    const result = addCombatXP(player, 50, 1.0);
    expect(result.source).toBe('Combat');
  });
});

// ── addQuestXP ─────────────────────────────────────────────────────────────────
// questxp.js defines getQuestXP() — it must be loaded for addQuestXP to work.
// We provide a minimal mock when questxp.js is not loaded.

describe('addQuestXP', () => {
  beforeAll(() => {
    // Provide a minimal getQuestXP stub if not already defined
    if (typeof global.getQuestXP === 'undefined') {
      global.getQuestXP = function (level, type) {
        const table = { mainQuest: 500, sideQuest: 200, fetchQuest: 100 };
        return (table[type] || 100) + (level - 1) * 25;
      };
    }
  });

  test('adds quest XP with INT bonus', () => {
    const player = makePlayer(0, 1);
    const result = addQuestXP(player, 'mainQuest', 1.15);
    // getQuestXP(1, 'mainQuest') = 500; 500 * 1.15 = 575
    expect(result.xpGained).toBe(575);
    expect(player.xp).toBe(575);
  });

  test('returns correct source label', () => {
    const player = makePlayer(0, 1);
    const result = addQuestXP(player, 'sideQuest', 1.0);
    expect(result.source).toBe('Quest');
    expect(result.questType).toBe('sideQuest');
  });

  test('uses intBonus=1 when omitted', () => {
    const player = makePlayer(0, 1);
    const result = addQuestXP(player, 'fetchQuest');
    // no bonus applied
    expect(result.xpGained).toBe(getQuestXP(1, 'fetchQuest'));
  });
});

// ── addCraftingXP ──────────────────────────────────────────────────────────────

describe('addCraftingXP', () => {
  test('adds crafting XP with INT bonus', () => {
    const player = makePlayer(0);
    const result = addCraftingXP(player, 80, 1.12);
    // Math.round(80 * 1.12) = Math.round(89.6) = 90
    expect(result.xpGained).toBe(90);
    expect(player.xp).toBe(90);
  });

  test('source is Crafting', () => {
    const player = makePlayer(0);
    const result = addCraftingXP(player, 50, 1.0);
    expect(result.source).toBe('Crafting');
  });
});

// ── INT bonus edge cases ───────────────────────────────────────────────────────

describe('INT bonus edge cases', () => {
  test('high INT player earns 27% more XP than INT 1 player on same event', () => {
    const lowInt  = calcXpWithIntBonus(1000, 1);  // round(1030) = 1030
    const highInt = calcXpWithIntBonus(1000, 10); // round(1300) = 1300
    expect(highInt).toBeGreaterThan(lowInt);
    expect(highInt - lowInt).toBe(270);
  });

  test('all INT values 1–10 produce valid positive multiplied XP', () => {
    for (var i = 1; i <= 10; i++) {
      var result = calcXpWithIntBonus(100, i);
      expect(result).toBeGreaterThanOrEqual(100);
      expect(result).toBeLessThanOrEqual(200);
    }
  });

  test('INT 5 result is strictly greater than INT 4 result', () => {
    expect(calcXpWithIntBonus(1000, 5)).toBeGreaterThan(calcXpWithIntBonus(1000, 4));
  });
});
