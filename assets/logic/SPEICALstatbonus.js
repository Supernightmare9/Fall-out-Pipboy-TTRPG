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

// You can add more as needed!
