// assets/logic/legendaryitemmodifiers.js
// Legendary Item Modifiers - Special bonuses applied to legendary-tier crafted items

const legendaryWeaponModifiers = [
  // { name, description, effect, damageBonus, criticalBonus }
  // PLACEHOLDER - TO BE FILLED IN WITH ACTUAL MODIFIERS
];

const legendaryArmorModifiers = [
  // { name, description, effect, acBonus, resistanceBonus, specialEffect }
  // PLACEHOLDER - TO BE FILLED IN WITH ACTUAL MODIFIERS
];

const legendaryToolModifiers = [
  // { name, description, effect, skillBonus, successChanceBonus, specialEffect }
  // PLACEHOLDER - TO BE FILLED IN WITH ACTUAL MODIFIERS
];

// Function to get random weapon modifier
function getRandomWeaponModifier() {
  if (legendaryWeaponModifiers.length === 0) {
    return { name: 'Unefined Weapon Modifier', description: 'Add weapon modifiers to legendaryWeaponModifiers array' };
  }
  return legendaryWeaponModifiers[Math.floor(Math.random() * legendaryWeaponModifiers.length)];
}

// Function to get random armor modifier
function getRandomArmorModifier() {
  if (legendaryArmorModifiers.length === 0) {
    return { name: 'Undefined Armor Modifier', description: 'Add armor modifiers to legendaryArmorModifiers array' };
  }
  return legendaryArmorModifiers[Math.floor(Math.random() * legendaryArmorModifiers.length)];
}

// Function to get random tool modifier
function getRandomToolModifier() {
  if (legendaryToolModifiers.length === 0) {
    return { name: 'Undefined Tool Modifier', description: 'Add tool modifiers to legendaryToolModifiers array' };
  }
  return legendaryToolModifiers[Math.floor(Math.random() * legendaryToolModifiers.length)];
}

// Function to get modifier by type
function getRandomLegendaryModifier(itemType) {
  switch (itemType.toLowerCase()) {
    case 'weapon':
      return getRandomWeaponModifier();
    case 'armor':
      return getRandomArmorModifier();
    case 'tool':
      return getRandomToolModifier();
    default:
      return { name: 'Unknown Modifier', description: 'Item type not recognized' };
  }
}

// Example structure for weapon modifier:
// {
//   name: 'Increased Damage vs. Mutants',
//   description: '+25% damage when attacking mutant enemies',
//   effect: 'damageBonus',
//   damageBonus: 0.25,
//   applicableTo: ['mutant', 'ghoul', 'super_mutant']
// }

// Example structure for armor modifier:
// {
//   name: 'Radiation Resistance',
//   description: '+50 Radiation Resistance',
//   effect: 'resistanceBonus',
//   resistanceType: 'radiation',
//   resistanceBonus: 50
// }

// Example structure for tool modifier:
// {
//   name: 'Master Craftsman',
//   description: '+10% crafting success chance',
//   effect: 'successChanceBonus',
//   successChanceBonus: 0.10
// }
