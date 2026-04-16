/**
 * terminalxp.test.js
 * Tests for the terminal hacking minigame XP award logic.
 *
 * The terminal awards a flat 50 XP base multiplied by the player's INT bonus
 * via calcXpWithIntBonus(50, intStat). This mirrors the game's standard
 * multiplier table (intStatBonus in fallout_stat_bonuses.js):
 *   INT 1 → ×1.03, INT 5 → ×1.15, INT 10 → ×1.30
 */

'use strict';

require('./xpprogression');
const { calcXpWithIntBonus } = require('./xpdistribution');

const BASE_TERMINAL_XP = 50;

// Helper: compute terminal XP for a given INT stat
function terminalXp(intStat) {
  return calcXpWithIntBonus(BASE_TERMINAL_XP, intStat);
}

describe('Terminal hacking XP award (50 XP base + INT bonus)', () => {
  // Expected values pre-computed with Node.js (Math.round respects float precision):
  //   50 × 1.03 = 51.5         → 52
  //   50 × 1.06 = 53           → 53
  //   50 × 1.09 = 54.50…001   → 55
  //   50 × 1.12 = 56.00…001   → 56
  //   50 × 1.15 = 57.49…999   → 57  (float rounds down)
  //   50 × 1.18 = 59           → 59
  //   50 × 1.21 = 60.5         → 61
  //   50 × 1.24 = 62           → 62
  //   50 × 1.27 = 63.5         → 64
  //   50 × 1.30 = 65           → 65

  test('INT 1 → Math.round(50 × 1.03) = 52', () => {
    expect(terminalXp(1)).toBe(52);
  });

  test('INT 2 → Math.round(50 × 1.06) = 53', () => {
    expect(terminalXp(2)).toBe(53);
  });

  test('INT 3 → Math.round(50 × 1.09) = 55', () => {
    expect(terminalXp(3)).toBe(55);
  });

  test('INT 4 → Math.round(50 × 1.12) = 56', () => {
    expect(terminalXp(4)).toBe(56);
  });

  test('INT 5 → Math.round(50 × 1.15) = 57 (float precision: 57.499…)', () => {
    expect(terminalXp(5)).toBe(57);
  });

  test('INT 6 → Math.round(50 × 1.18) = 59', () => {
    expect(terminalXp(6)).toBe(59);
  });

  test('INT 7 → Math.round(50 × 1.21) = 61', () => {
    expect(terminalXp(7)).toBe(61);
  });

  test('INT 8 → Math.round(50 × 1.24) = 62', () => {
    expect(terminalXp(8)).toBe(62);
  });

  test('INT 9 → Math.round(50 × 1.27) = 64', () => {
    expect(terminalXp(9)).toBe(64);
  });

  test('INT 10 → Math.round(50 × 1.30) = 65', () => {
    expect(terminalXp(10)).toBe(65);
  });

  test('INT 0 is clamped to 1 (same as INT 1)', () => {
    expect(terminalXp(0)).toBe(terminalXp(1));
  });

  test('INT 11 is clamped to 10 (same as INT 10)', () => {
    expect(terminalXp(11)).toBe(terminalXp(10));
  });

  test('null INT falls back to INT 5', () => {
    expect(terminalXp(null)).toBe(terminalXp(5));
  });

  test('reward is always at least the base 50 XP', () => {
    for (let i = 1; i <= 10; i++) {
      expect(terminalXp(i)).toBeGreaterThanOrEqual(BASE_TERMINAL_XP);
    }
  });

  test('higher INT yields more XP than lower INT', () => {
    for (let i = 1; i < 10; i++) {
      expect(terminalXp(i + 1)).toBeGreaterThanOrEqual(terminalXp(i));
    }
  });

  test('INT 10 earns 13 XP more than INT 1 (maximum bonus spread)', () => {
    expect(terminalXp(10) - terminalXp(1)).toBe(13);
  });
});
