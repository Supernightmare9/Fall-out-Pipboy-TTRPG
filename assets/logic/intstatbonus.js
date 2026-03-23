// assets/logic/intstatbonus.js
// Intelligence Stat XP Bonus Multiplier
// Applied to all XP gains based on player's Intelligence stat

const intStatBonus = {
  1: 1.03,    // 3% bonus
  2: 1.06,    // 6% bonus
  3: 1.09,    // 9% bonus
  4: 1.12,    // 12% bonus
  5: 1.15,    // 15% bonus
  6: 1.18,    // 18% bonus
  7: 1.21,    // 21% bonus
  8: 1.24,    // 24% bonus
  9: 1.27,    // 27% bonus
  10: 1.30    // 30% bonus
};

// Function to get XP multiplier based on INT stat
function getIntXPMultiplier(intStat) {
  // Clamp INT between 1 and 10
  const clampedInt = Math.max(1, Math.min(10, intStat));
  return intStatBonus[clampedInt];
}

// Example usage: const multipliedXP = baseXP * getIntXPMultiplier(playerINT);
