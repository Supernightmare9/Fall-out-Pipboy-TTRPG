// Strength Carry Capacity Bonus: +10 per point of Strength

function getCarryCapacity(baseCarry, strength) {
  return baseCarry + (strength * 10);
}

// Example usage:
const baseCarry = 100;
const playerStrength = 6;
const carryCapacity = getCarryCapacity(baseCarry, playerStrength); // 160
