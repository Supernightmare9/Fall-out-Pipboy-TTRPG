// assets/logic/enemyxp.js
// Enemy XP Rewards by Player Level and Enemy Rarity Tier

const enemyXPTable = {
  1: { common: 15, uncommon: 25, rare: 50, epic: 95, legendary: 190 },
  5: { common: 35, uncommon: 70, rare: 130, epic: 265, legendary: 530 },
  10: { common: 65, uncommon: 135, rare: 250, epic: 505, legendary: 1010 },
  20: { common: 130, uncommon: 260, rare: 490, epic: 985, legendary: 1970 },
  30: { common: 195, uncommon: 390, rare: 730, epic: 1465, legendary: 2930 },
  40: { common: 260, uncommon: 520, rare: 970, epic: 1945, legendary: 3890 },
  50: { common: 325, uncommon: 645, rare: 1210, epic: 2425, legendary: 4850 },
  60: { common: 385, uncommon: 775, rare: 1450, epic: 2905, legendary: 5810 },
  70: { common: 450, uncommon: 900, rare: 1690, epic: 3385, legendary: 6770 },
  80: { common: 515, uncommon: 1030, rare: 1930, epic: 3865, legendary: 7730 },
  90: { common: 580, uncommon: 1160, rare: 2170, epic: 4345, legendary: 8690 },
  100: { common: 645, uncommon: 1285, rare: 2410, epic: 4825, legendary: 9650 }
};

// Rarity tier percentages (for reference)
const rarityPercentages = {
  common: 4,
  uncommon: 8,
  rare: 15,
  epic: 30,
  legendary: 60
};

// Function to get XP for defeating an enemy
function getEnemyXP(playerLevel, enemyRarity) {
  // Find closest player level in table
  const validLevels = Object.keys(enemyXPTable).map(Number).sort((a, b) => a - b);
  let closestLevel = validLevels[0];
  
  for (let level of validLevels) {
    if (level <= playerLevel) {
      closestLevel = level;
    } else {
      break;
    }
  }
  
  // Get XP for that level and rarity
  const xpReward = enemyXPTable[closestLevel][enemyRarity.toLowerCase()];
  return xpReward || 0;
}

// Example usage: const xp = getEnemyXP(25, 'rare'); // Gets XP for level 20 (closest below 25), rare enemy
