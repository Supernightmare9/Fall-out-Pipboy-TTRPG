// assets/logic/ultraenemymodifier.js
// Ultra Enemy Modifier System
// 1% chance for enemies to spawn as Ultra with special properties

const ultraEnemyConfig = {
  spawnChance: 0.01,           // 1% chance to spawn as Ultra
  statMultiplier: 1.5,         // 50% stat increase (HP, damage, etc.)
  xpMultiplier: 1.25,          // 25% bonus XP for defeating Ultra
  guaranteedLegendaryLoot: true // Always drops a legendary item
};

// Function to determine if enemy spawns as Ultra
function rollUltraEnemy() {
  return Math.random() < ultraEnemyConfig.spawnChance;
}

// Function to apply Ultra modifiers to enemy stats
function applyUltraModifiers(enemy) {
  const ultraEnemy = { ...enemy, isUltra: true };
  
  // Multiply relevant stats
  if (ultraEnemy.hp) ultraEnemy.hp = Math.floor(ultraEnemy.hp * ultraEnemyConfig.statMultiplier);
  if (ultraEnemy.damage) ultraEnemy.damage = Math.floor(ultraEnemy.damage * ultraEnemyConfig.statMultiplier);
  if (ultraEnemy.ac) ultraEnemy.ac = Math.ceil(ultraEnemy.ac * ultraEnemyConfig.statMultiplier);
  if (ultraEnemy.abilities) {
    ultraEnemy.abilities = ultraEnemy.abilities.map(ability => ({
      ...ability,
      damage: ability.damage ? Math.floor(ability.damage * ultraEnemyConfig.statMultiplier) : ability.damage
    }));
  }
  
  return ultraEnemy;
}

// Function to modify XP reward for Ultra enemy defeat
function getUltraXPBonus(baseXP) {
  return Math.floor(baseXP * ultraEnemyConfig.xpMultiplier);
}

// Function to add guaranteed legendary to loot pool
function addUltraLegendaryLoot(lootPool) {
  // This will interface with loot.js to add guaranteed legendary
  // Placeholder for now - will connect to actual legendary item pool
  return {
    ...lootPool,
    guaranteedLegendary: true
  };
}

// Example usage:
// if (rollUltraEnemy()) {
//   enemy = applyUltraModifiers(enemy);
//   lootPool = addUltraLegendaryLoot(enemy.lootPool);
// }
