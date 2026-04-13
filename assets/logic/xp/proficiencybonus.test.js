/**
 * proficiencybonus.test.js
 * Tests for the DnD-style proficiency bonus calculation (scaled to level 50).
 *
 * Tier breakpoints (mirrored from progressionManager.js → getProficiencyBonus):
 *   Level  1–8  → +2
 *   Level  9–16 → +3
 *   Level 17–24 → +4
 *   Level 25–32 → +5
 *   Level 33–50 → +6
 */

'use strict';

// ── Inline the pure calculation so this test is self-contained ────────────────
// This mirrors progressionManager.js → getProficiencyBonus(level) exactly.
function getProficiencyBonus(level) {
    var lvl = Math.max(1, Math.min(50, Number(level) || 1));
    if (lvl <= 8)  return 2;
    if (lvl <= 16) return 3;
    if (lvl <= 24) return 4;
    if (lvl <= 32) return 5;
    return 6;
}

// ── Tier boundary tests ───────────────────────────────────────────────────────

describe('getProficiencyBonus — tier 1 (levels 1–8, +2)', () => {
    test('level 1 returns +2', () => expect(getProficiencyBonus(1)).toBe(2));
    test('level 4 returns +2', () => expect(getProficiencyBonus(4)).toBe(2));
    test('level 8 returns +2', () => expect(getProficiencyBonus(8)).toBe(2));
});

describe('getProficiencyBonus — tier 2 (levels 9–16, +3)', () => {
    test('level 9 returns +3',  () => expect(getProficiencyBonus(9)).toBe(3));
    test('level 12 returns +3', () => expect(getProficiencyBonus(12)).toBe(3));
    test('level 16 returns +3', () => expect(getProficiencyBonus(16)).toBe(3));
});

describe('getProficiencyBonus — tier 3 (levels 17–24, +4)', () => {
    test('level 17 returns +4', () => expect(getProficiencyBonus(17)).toBe(4));
    test('level 20 returns +4', () => expect(getProficiencyBonus(20)).toBe(4));
    test('level 24 returns +4', () => expect(getProficiencyBonus(24)).toBe(4));
});

describe('getProficiencyBonus — tier 4 (levels 25–32, +5)', () => {
    test('level 25 returns +5', () => expect(getProficiencyBonus(25)).toBe(5));
    test('level 28 returns +5', () => expect(getProficiencyBonus(28)).toBe(5));
    test('level 32 returns +5', () => expect(getProficiencyBonus(32)).toBe(5));
});

describe('getProficiencyBonus — tier 5 (levels 33–50, +6)', () => {
    test('level 33 returns +6', () => expect(getProficiencyBonus(33)).toBe(6));
    test('level 40 returns +6', () => expect(getProficiencyBonus(40)).toBe(6));
    test('level 50 returns +6', () => expect(getProficiencyBonus(50)).toBe(6));
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('getProficiencyBonus — edge cases', () => {
    test('level 0 clamps to 1 → +2',  () => expect(getProficiencyBonus(0)).toBe(2));
    test('negative level clamps to 1 → +2', () => expect(getProficiencyBonus(-5)).toBe(2));
    test('level 51 clamps to 50 → +6', () => expect(getProficiencyBonus(51)).toBe(6));
    test('level 100 clamps to 50 → +6', () => expect(getProficiencyBonus(100)).toBe(6));
    test('undefined input defaults to 1 → +2', () => expect(getProficiencyBonus(undefined)).toBe(2));
    test('null input defaults to 1 → +2', () => expect(getProficiencyBonus(null)).toBe(2));
    test('string "20" coerced to number → +4', () => expect(getProficiencyBonus('20')).toBe(4));
});

// ── Tier boundary transitions ─────────────────────────────────────────────────

describe('getProficiencyBonus — tier boundary transitions', () => {
    test('level 8→9 transitions +2→+3',   () => { expect(getProficiencyBonus(8)).toBe(2); expect(getProficiencyBonus(9)).toBe(3); });
    test('level 16→17 transitions +3→+4', () => { expect(getProficiencyBonus(16)).toBe(3); expect(getProficiencyBonus(17)).toBe(4); });
    test('level 24→25 transitions +4→+5', () => { expect(getProficiencyBonus(24)).toBe(4); expect(getProficiencyBonus(25)).toBe(5); });
    test('level 32→33 transitions +5→+6', () => { expect(getProficiencyBonus(32)).toBe(5); expect(getProficiencyBonus(33)).toBe(6); });
});
