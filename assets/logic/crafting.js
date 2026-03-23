// assets/logic/crafting.js
// Crafting System - Recipe crafting, success calculations, and legendary item generation

const craftingRarityTable = {
  common: { min: 80, max: 100 },
  uncommon: { min: 50, max: 79 },
  rare: { min: 20, max: 49 },
  epic: { min: 5, max: 19 },
  legendary: { min: 1, max: 1 }
};

const legendaryChance = 0.01; // 1% chance for all items to become legendary

// Function to calculate average rarity from components (weighted by quantity)
function calculateComponentRarity(components) {
  // components = [ { rarity: 'common', quantity: 2 }, { rarity: 'rare', quantity: 1 } ]
  // Rarity values: common=1, uncommon=2, rare=3, epic=4, legendary=5
  
  const rarityValues = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5
  };
  
  let totalRarityScore = 0;
  let totalQuantity = 0;
  
  for (let component of components) {
    const rarityScore = rarityValues[component.rarity.toLowerCase()] || 1;
    totalRarityScore += rarityScore * component.quantity;
    totalQuantity += component.quantity;
  }
  
  const averageRarity = totalRarityScore / totalQuantity;
  
  // Convert back to rarity tier
  if (averageRarity <= 1.5) return 'common';
  if (averageRarity <= 2.5) return 'uncommon';
  if (averageRarity <= 3.5) return 'rare';
  if (averageRarity <= 4.5) return 'epic';
  return 'legendary';
}

// Function to calculate crafting success chance
function calculateSuccessChance(rarity, playerStats) {
  // playerStats = { intelligence: 7, repairSkill: 75, hasTools: true, skillBooks: ['electronics', 'weaponsmithing'] }
  
  let baseSuccessMin = craftingRarityTable[rarity.toLowerCase()].min;
  let baseSuccessMax = craftingRarityTable[rarity.toLowerCase()].max;
  
  // Intelligence modifier: +2% per point above 5 (or -2% per point below 5)
  const intModifier = (playerStats.intelligence - 5) * 2;
  
  // Repair skill modifier: +0.5% per skill point
  const skillModifier = playerStats.repairSkill * 0.5;
  
  // Tool bonus: +10% if player has appropriate tools
  const toolBonus = playerStats.hasTools ? 10 : 0;
  
  // Skill book bonus: +5% per relevant skill book
  const bookBonus = playerStats.skillBooks ? playerStats.skillBooks.length * 5 : 0;
  
  // Calculate final success range
  const successMin = Math.max(1, baseSuccessMin + intModifier + skillModifier + toolBonus + bookBonus);
  const successMax = Math.min(100, baseSuccessMax + intModifier + skillModifier + toolBonus + bookBonus);
  
  return { min: Math.floor(successMin), max: Math.floor(successMax) };
}

// Function to attempt crafting
function attemptCraft(recipeOrCustomItem, playerStats, playerInventory) {
  // recipeOrCustomItem = { name, components: [], rarity }
  // Returns: { success: boolean, legendary: boolean, result: itemObject, xpGained: number, componentsConsumed: array }
  
  const rarity = recipeOrCustomItem.rarity || calculateComponentRarity(recipeOrCustomItem.components);
  const successChance = calculateSuccessChance(rarity, playerStats);
  const craftRoll = Math.floor(Math.random() * 100) + 1; // Roll 1-100
  
  // Check if craft succeeds (components consumed regardless)
  const success = craftRoll >= successChance.min && craftRoll <= successChance.max;
  
  // Check for legendary upgrade (1% chance on any successful craft)
  const isLegendary = success && Math.random() < legendaryChance;
  
  // Consume components from player inventory (pass or fail)
  const consumedComponents = consumeComponents(recipeOrCustomItem.components, playerInventory);
  
  // Build result item
  let resultItem = null;
  if (success) {
    resultItem = {
      name: recipeOrCustomItem.name,
      rarity: isLegendary ? 'legendary' : rarity,
      itemType: recipeOrCustomItem.itemType || 'miscellaneous',
      components: recipeOrCustomItem.components
    };
    
    // Add legendary modifier if applicable
    if (isLegendary) {
      resultItem.legendaryModifier = getRandomLegendaryModifier(recipeOrCustomItem.itemType);
    }
  }
  
  return {
    success: success,
    legendary: isLegendary,
    result: resultItem,
    xpGained: success ? getQuestXP(playerStats.level, 'easySkillCheck') : 0, // XP only on success
    componentsConsumed: consumedComponents,
    craftRoll: craftRoll,
    successRange: successChance
  };
}

// Function to consume components from inventory
function consumeComponents(components, playerInventory) {
  // components = [ { itemId: 'ductTape', quantity: 1 }, ... ]
  // Remove items from playerInventory and return consumed items
  
  const consumed = [];
  
  for (let component of components) {
    // Find item in inventory
    const inventoryIndex = playerInventory.findIndex(item => item.id === component.itemId);
    
    if (inventoryIndex !== -1) {
      const item = playerInventory[inventoryIndex];
      const consumedQty = Math.min(component.quantity, item.quantity);
      
      consumed.push({
        itemId: component.itemId,
        itemName: item.name,
        quantityConsumed: consumedQty
      });
      
      // Remove from inventory
      item.quantity -= consumedQty;
      if (item.quantity <= 0) {
        playerInventory.splice(inventoryIndex, 1);
      }
    }
  }
  
  return consumed;
}

// Function to get random legendary modifier
function getRandomLegendaryModifier(itemType) {
  // This will pull from legendaryitemmodifiers.js based on item type
  // Placeholder for now
  return {
    type: itemType || 'weapon',
    modifier: `[LEGENDARY MODIFIER - TO BE DEFINED IN legendaryitemmodifiers.js]`,
    description: 'Special bonus effect'
  };
}

// Example usage:
// const craftResult = attemptCraft(customItem, playerStats, playerInventory);
// if (craftResult.success) {
//   playerInventory.push(craftResult.result);
//   playerXP += craftResult.xpGained;
// }
// Console.log(`Components consumed: ${craftResult.componentsConsumed.map(c => c.itemName).join(', ')}`);
