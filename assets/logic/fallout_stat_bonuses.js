// ============================================================
// assets/logic/fallout_stat_bonuses.js
// S.P.E.C.I.A.L. stat-derived bonuses — SINGLE SOURCE OF TRUTH
//
// MAINTAINER NOTE: This file is the only authoritative source
// for all S.P.E.C.I.A.L.-based derived-stat formulas in this
// project.  Every page (stats.html, combat.html, overseer,
// crafting, inventory, loot) must import this file and call
// these functions.  Never hard-code or duplicate these
// formulas anywhere else in the codebase.
// ============================================================

// ── STRENGTH ─────────────────────────────────────────────────
// Carry Capacity: base + (Strength × 10)
// Base carry weight (before STR bonus): 100 lbs
// At STR 5  → 150 lbs | At STR 10 → 200 lbs
function getCarryCapacity(baseCarry, strength) {
  return baseCarry + (strength * 10);
}

// ── AGILITY ──────────────────────────────────────────────────
// Action Points: base + (Agility × 5)
// Base AP (before AGI bonus): 10
// At AGI 5  → 35 AP | At AGI 10 → 60 AP
function getAP(baseAP, agility) {
  return baseAP + (agility * 5);
}

// ── ENDURANCE ────────────────────────────────────────────────
// Health: base + (Endurance × 5)
// Base HP (before END bonus): 100
// At END 5  → 125 HP | At END 10 → 150 HP
function getHealth(baseHealth, endurance) {
  return baseHealth + (endurance * 5);
}

// ── PERCEPTION ───────────────────────────────────────────────
// Initiative Bonus: +1 per point of Perception above 4
// (Perception 1-4 → +0 bonus; Perception 5 → +1; Perception 10 → +6)
function getInitiativeBonusFromPerception(perception) {
  return (perception >= 5) ? (perception - 4) : 0;
}

// ── LUCK BONUSES ─────────────────────────────────────────────

// Add Luck as a flat bonus to crafting rolls (+1 per Luck point)
function getCraftingBonusFromLuck(luck) {
  return luck;
}

// Legendary crafting chance: +1% per Luck point (0 %–10 %)
function getLegendaryCraftChance(luck) {
  return luck * 0.01;
}

// Extra yield chance (multiple items per craft): +2% per Luck point (0 %–20 %)
function getExtraYieldChance(luck) {
  return luck * 0.02;
}

// Bonus loot chance (extra item from defeated enemy): +5% per Luck point (0 %–50 %)
function getLootBonusChance(luck) {
  return luck * 0.05;
}

// ── INTELLIGENCE ─────────────────────────────────────────────
// XP multiplier table: each INT point above 0 adds +3 % bonus XP.
// Pass the result of getIntXPMultiplier(player.special.intelligence)
// as the `intBonus` parameter to any XP-award function
// (addQuestXP, addCombatXP, etc.) in Xpdistrubtion.js.
var intStatBonus = {
  1: 1.03,    // +3 %
  2: 1.06,    // +6 %
  3: 1.09,    // +9 %
  4: 1.12,    // +12 %
  5: 1.15,    // +15 %
  6: 1.18,    // +18 %
  7: 1.21,    // +21 %
  8: 1.24,    // +24 %
  9: 1.27,    // +27 %
  10: 1.30    // +30 %
};

function getIntXPMultiplier(intStat) {
  var clampedInt = Math.max(1, Math.min(10, intStat));
  return intStatBonus[clampedInt];
}

// ── USAGE EXAMPLES ───────────────────────────────────────────
// var maxHP  = getHealth(100, player.special.endurance);
// var maxAP  = getAP(10, player.special.agility);
// var carry  = getCarryCapacity(100, player.special.strength);
// var initBn = getInitiativeBonusFromPerception(player.special.perception);
// var xpMult = getIntXPMultiplier(player.special.intelligence);
// var xp     = Math.floor(baseXP * xpMult);
