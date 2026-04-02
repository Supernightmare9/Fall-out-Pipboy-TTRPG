// S.P.E.C.I.A.L. stat-derived bonuses (Fallout core rules)

// Carry Capacity: Strength
function getCarryCapacity(baseCarry, strength) {
  return baseCarry + (strength * 10);
}

// Action Points: Agility
function getAP(baseAP, agility) {
  return baseAP + (agility * 5);
}

// Health: Endurance (example, typical Fallout is +5, +10, or similar per END)
function getHealth(baseHealth, endurance) {
  return baseHealth + (endurance * 5); // Adjust multiplier per your rules
}

// Perception Initiative Bonus: +1 per point, starting at Perception 5

function getInitiativeBonusFromPerception(perception) {
  return (perception >= 5) ? (perception - 4) : 0;
}

// LUCK BONUSES

// Add Luck as a direct bonus to crafting rolls
function getCraftingBonusFromLuck(luck) {
  return luck;
}

// Luck to legendary crafting chance: +1% per Luck
function getLegendaryCraftChance(luck) {
  return luck * 0.01; // returns chance as 0–0.10 (0–10%)
}

// Luck for extra yield (multiple items): +2% chance per Luck
function getExtraYieldChance(luck) {
  return luck * 0.02; // 0–0.20 (0–20% at 10 Luck)
}

// Luck as a loot roll bonus: e.g. each Luck = +5% to bonus loot
function getLootBonusChance(luck) {
  return luck * 0.05; // 0–0.50 (0–50% at 10 Luck); tune as needed!
}
