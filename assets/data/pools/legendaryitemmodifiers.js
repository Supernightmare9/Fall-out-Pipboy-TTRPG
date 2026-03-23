// assets/logic/legendaryitemmodifiers.js
// Legendary Item Modifiers - Special bonuses for crafted legendary items
// Organized by item type with mechanical values for implementation
// Includes both static modifiers and dynamically created custom modifiers

const weaponModifiers = [
  { name: 'Vicious', description: 'Critical hits deal an additional 1d6 damage.', effect: 'criticalDamage', criticalDamageBonus: '1d6', rarity: 'Uncommon' },
  { name: 'Accurate', description: '+2 bonus to all attack rolls.', effect: 'attackBonus', attackBonus: 2, rarity: 'Common' },
  { name: 'Tactical', description: 'Reduces AP cost of an attack by 1 (Minimum 1).', effect: 'apCostReduction', apReduction: 1, rarity: 'Rare' },
  { name: 'Brutal', description: 'When you roll maximum damage, add another 1d4.', effect: 'maxDamageBonus', maxDamageBonus: '1d4', rarity: 'Rare' },
  { name: 'Reliable', description: 'Natural 1s on attack rolls can be rerolled once per encounter.', effect: 'rerollOnes', rerollsPerEncounter: 1, rarity: 'Uncommon' },
  { name: 'Vampiric', description: 'On a critical hit, the wielder heals 1d8 HP.', effect: 'criticalHeal', healAmount: '1d8', rarity: 'Epic' },
  { name: 'Concussive', description: 'On a hit, target must succeed a DC 13 STR save or be knocked prone.', effect: 'knockProne', saveDC: 13, rarity: 'Uncommon' },
  { name: 'Sighted', description: 'Grants +5 range (short/long) for firearms.', effect: 'rangeBonus', rangeBonus: 5, applicableTo: ['firearm'], rarity: 'Common' },
  { name: 'Balanced', description: '+2 to Initiative while this weapon is equipped.', effect: 'initiativeBonus', initiativeBonus: 2, rarity: 'Uncommon' },
  { name: 'Piercing', description: 'Ignores 2 points of target\'s Damage Threshold (DT).', effect: 'dtIgnore', dtIgnored: 2, rarity: 'Uncommon' },
  { name: 'Dualist\'s', description: 'While dual-wielding, gain +1 to AC.', effect: 'dualWieldAC', acBonus: 1, applicableTo: ['melee'], rarity: 'Rare' },
  { name: 'Thundering', description: 'Deals +1d6 Thunder damage on a natural 20.', effect: 'naturalTwentyDamage', damageType: 'thunder', damageBonus: '1d6', rarity: 'Rare' },
  { name: 'Weighted', description: 'Deals +2 Bludgeoning damage.', effect: 'baseDamageBonus', damageType: 'bludgeoning', damageBonus: 2, applicableTo: ['melee'], rarity: 'Common' },
  { name: 'Serrated', description: 'Target takes 1d4 bleed damage at start of their next 2 turns.', effect: 'bleedDamage', bleedDamage: '1d4', bleedDuration: 2, applicableTo: ['bladed'], rarity: 'Uncommon' },
  { name: 'Swift', description: 'You can make an opportunity attack without using a reaction once per day.', effect: 'opportunityAttack', opportunityAttacksPerDay: 1, applicableTo: ['melee'], rarity: 'Rare' },
  { name: 'Heated', description: 'Deals +1d4 Fire damage.', effect: 'elementalDamage', damageType: 'fire', damageBonus: '1d4', applicableTo: ['melee'], rarity: 'Uncommon' },
  { name: 'Electrified', description: 'Deals +1d4 Shock damage.', effect: 'elementalDamage', damageType: 'shock', damageBonus: '1d4', applicableTo: ['melee'], rarity: 'Uncommon' },
  { name: 'Toxic', description: 'On a hit, DC 12 CON save or be Poisoned.', effect: 'poisonOnHit', saveDC: 12, rarity: 'Rare' },
  { name: 'Chem-Addict\'s', description: '+1d6 damage while suffering from a chem withdrawal.', effect: 'withdrawalDamageBonus', damageBonus: '1d6', rarity: 'Rare' },
  { name: 'Vandal\'s', description: 'Deals double damage to inanimate objects/doors.', effect: 'objectDamageMultiplier', damageMultiplier: 2, rarity: 'Common' },
  { name: 'Quiet', description: 'This weapon makes no noise when fired.', effect: 'silent', rarity: 'Uncommon' },
  { name: 'Heavy', description: '+2 damage, but adds +5 to weapon weight.', effect: 'heavyWeapon', damageBonus: 2, weightPenalty: 5, rarity: 'Common' },
  { name: 'Optimized', description: 'Critical hits cost 2 fewer AP.', effect: 'criticalAPReduction', apReduction: 2, rarity: 'Rare' },
  { name: 'Instigating', description: 'Double damage on the first round of combat.', effect: 'firstRoundBonus', damageMultiplier: 2, rarity: 'Rare' },
  { name: 'Executioner\'s', description: '+50% damage to targets below 25% HP.', effect: 'lowHealthBonus', damageMultiplier: 1.5, healthThreshold: 0.25, rarity: 'Rare' },
  { name: 'Weighted Grip', description: 'Cannot be disarmed.', effect: 'cannotDisarm', rarity: 'Uncommon' },
  { name: 'Apocalyptic', description: 'Deals +2d12 damage, but damages user for 1d6.', effect: 'recoilDamage', damageBonus: '2d12', recoilDamage: '1d6', rarity: 'Epic' },
  { name: 'Omega', description: 'On a natural 20, the target is disintegrated (if below 100 HP).', effect: 'disintegrate', hpThreshold: 100, rarity: 'Legendary' }
];

const armorModifiers = [
  { name: 'Lead-Lined', description: 'Grants +10 Resistance to Radiation damage.', effect: 'radiationResistance', resistanceBonus: 10, rarity: 'Uncommon' },
  { name: 'Padded', description: 'Reduces falling damage taken by 1d10.', effect: 'fallingDamageReduction', damageReduction: '1d10', rarity: 'Common' },
  { name: 'Pocketed', description: 'Increases Carry Weight capacity by +10.', effect: 'carryWeightBonus', carryWeightBonus: 10, rarity: 'Common' },
  { name: 'Deep-Pocketed', description: 'Increases Carry Weight capacity by +25.', effect: 'carryWeightBonus', carryWeightBonus: 25, rarity: 'Uncommon' },
  { name: 'Reinforced', description: '+1 bonus to base AC.', effect: 'acBonus', acBonus: 1, rarity: 'Uncommon' },
  { name: 'Agitator', description: 'Grants Advantage on all Initiative rolls.', effect: 'initiativeAdvantage', rarity: 'Rare' },
  { name: 'Asbestos-Lined', description: 'Immune to the "On Fire" status condition.', effect: 'fireImmunity', rarity: 'Rare' },
  { name: 'Muffled', description: 'Grants Advantage on Stealth (DEX) checks.', effect: 'stealthAdvantage', rarity: 'Uncommon' },
  { name: 'Sprinting', description: 'Increases movement speed by 5 feet.', effect: 'movementSpeedBonus', speedBonus: 5, rarity: 'Uncommon' },
  { name: 'Brawling', description: '+2 to Unarmed damage.', effect: 'unarmedDamageBonus', damageBonus: 2, rarity: 'Common' },
  { name: 'Sturdy', description: 'Reduces damage taken from critical hits by 5.', effect: 'criticalDamageReduction', damageReduction: 5, rarity: 'Rare' },
  { name: 'Hardened', description: '+2 bonus to DT (Damage Threshold).', effect: 'dtBonus', dtBonus: 2, rarity: 'Rare' },
  { name: 'Bio-Comm', description: 'Increases duration of consumed Chems by 2 rounds.', effect: 'chemDurationBonus', durationBonus: 2, rarity: 'Rare' },
  { name: 'Welded', description: '+5 to Energy Resistance.', effect: 'energyResistance', resistanceBonus: 5, rarity: 'Common' },
  { name: 'Stabilizing', description: 'Grants +2 to Hit while in V.A.T.S.', effect: 'vatsBonus', hitBonus: 2, rarity: 'Rare' },
  { name: 'Reflective', description: '5% chance to reflect a melee attack back at the attacker.', effect: 'reflectMelee', reflectChance: 0.05, rarity: 'Epic' },
  { name: 'Defender\'s', description: '+1 AC when adjacent to an ally.', effect: 'allyACBonus', acBonus: 1, rarity: 'Uncommon' },
  { name: 'Riot', description: '+2 DR vs. Shotguns and Melee.', effect: 'damageResistance', drBonus: 2, resistsAgainst: ['shotgun', 'melee'], rarity: 'Uncommon' },
  { name: 'Hazard', description: 'Immune to environmental gas/acid for 1 minute.', effect: 'environmentalImmunity', immuneTo: ['gas', 'acid'], durationMinutes: 1, rarity: 'Rare' },
  { name: 'Dampened', description: 'Reduces damage from explosions by 25%.', effect: 'explosionDamageReduction', damageReduction: 0.25, rarity: 'Rare' },
  { name: 'Sentinel\'s', description: '+2 to AC while standing still.', effect: 'stationaryACBonus', acBonus: 2, rarity: 'Rare' },
  { name: 'Acrobat\'s', description: 'Gain +5 to Acrobatics and Athletics checks.', effect: 'athleticsBonus', skillBonus: 5, skills: ['acrobatics', 'athletics'], rarity: 'Uncommon' },
  { name: 'Commando\'s', description: '+2 to Hit with rifles while using V.A.T.S.', effect: 'rifleVatsBonus', hitBonus: 2, rarity: 'Rare' },
  { name: 'Light-Refracting', description: 'Stealth Boy: Duration is doubled.', effect: 'stealthBoyDuration', durationMultiplier: 2, rarity: 'Epic' },
  { name: 'Ghostly', description: 'Wearer can walk through thin walls once per day.', effect: 'phaseWalk', usesPerDay: 1, rarity: 'Legendary' }
];

const toolModifiers = [
  { name: 'Nimble', description: '+3 bonus to Lockpicking skill checks.', effect: 'lockpickingBonus', skillBonus: 3, rarity: 'Uncommon' },
  { name: 'Precision', description: '+3 bonus to Repair or Science skill checks.', effect: 'repairScienceBonus', skillBonus: 3, skills: ['repair', 'science'], rarity: 'Uncommon' },
  { name: 'Robust', description: 'This tool has double the usual durability points.', effect: 'durabilityMultiplier', multiplier: 2, rarity: 'Common' },
  { name: 'Efficient', description: '15% chance to not consume a component when crafting.', effect: 'componentSavings', saveChance: 0.15, rarity: 'Rare' },
  { name: 'Calibrated', description: 'Reroll any 1s on crafting success checks.', effect: 'rerollOnes', rarity: 'Rare' },
  { name: 'Masterwork', description: 'Grants Advantage on all skill checks using this tool.', effect: 'skillAdvantage', rarity: 'Epic' },
  { name: 'Magnetic', description: '+2 to Sleight of Hand when picking up metal items.', effect: 'metalInteractionBonus', skillBonus: 2, rarity: 'Uncommon' },
  { name: 'Tinker\'s', description: 'Can repair items to 110% of their maximum durability.', effect: 'overrepair', maxDurability: 1.1, rarity: 'Rare' },
  { name: 'Advanced', description: 'Reduces the time required for a task by 25%.', effect: 'timeReduction', timeReduction: 0.25, rarity: 'Rare' },
  { name: 'Engineer\'s', description: 'Grants +5 to Science when used on terminals.', effect: 'terminalBonus', skillBonus: 5, rarity: 'Uncommon' },
  { name: 'Surgeon\'s', description: '+5 to First Aid when stabilizing a downed player.', effect: 'firstAidBonus', skillBonus: 5, rarity: 'Rare' },
  { name: 'Linked', description: 'Multiple tools can be used simultaneously for +5 bonus.', effect: 'multiToolBonus', skillBonus: 5, rarity: 'Rare' },
  { name: 'Automated', description: 'Task continues for 1 round even if user is interrupted.', effect: 'autoComplete', rarity: 'Rare' },
  { name: 'Integrated', description: 'Tool is built into armor; cannot be dropped.', effect: 'integrated', rarity: 'Uncommon' },
  { name: 'Folding', description: 'Weight is reduced to 0.1 lbs.', effect: 'weightReduction', weight: 0.1, rarity: 'Common' },
  { name: 'Holographic', description: 'Creates a distraction, granting +5 to Stealth for 1 min.', effect: 'stealthBonus', skillBonus: 5, durationMinutes: 1, rarity: 'Rare' },
  { name: 'Thermal', description: 'Can cut through metal doors (DC 15 STR/Repair).', effect: 'metalCutting', saveDC: 15, rarity: 'Rare' },
  { name: 'Rechargeable', description: 'Electronic tools regain 1 charge every 24 hours.', effect: 'selfRecharge', chargesPerDay: 1, rarity: 'Epic' },
  { name: 'Universal', description: 'Can act as any tool (Science, Repair, Lockpick).', effect: 'universal', rarity: 'Legendary' },
  { name: 'Chronos', description: 'Allows the user to redo the last turn once per day.', effect: 'undoTurn', usesPerDay: 1, rarity: 'Legendary' },
  { name: 'Unbreakable', description: 'This tool can never be damaged or broken.', effect: 'unbreakable', rarity: 'Legendary' }
];

const consumableModifiers = [
  { name: 'Fortified', description: 'Stimpak: Restores an extra 1d10 HP.', effect: 'extraHealing', healBonus: '1d10', rarity: 'Uncommon' },
  { name: 'Focused', description: 'Stimpak: +2 bonus to next INT or PER skill check.', effect: 'skillBonus', skillBonus: 2, skills: ['int', 'per'], rarity: 'Rare' },
  { name: 'Adrenaline', description: 'Stimpak: +1 bonus to STR and DEX for 3 rounds.', effect: 'statBonus', statBonus: 1, stats: ['str', 'dex'], duration: 3, rarity: 'Rare' },
  { name: 'Purified', description: 'Stimpak: Removes 10 points of Radiation on use.', effect: 'radiationRemoval', radiationRemoved: 10, rarity: 'Uncommon' },
  { name: 'Steady', description: 'Stimpak: Advantage on the next saving throw.', effect: 'savingThrowAdvantage', rarity: 'Rare' },
  { name: 'Nutrient-Rich', description: 'Food/Drink: Heals for double the standard dice amount.', effect: 'healingMultiplier', multiplier: 2, rarity: 'Common' },
  { name: 'Potent', description: 'Buffout: +2 STR bonus instead of +1.', effect: 'strBonus', statBonus: 2, rarity: 'Rare' },
  { name: 'Extended', description: 'Mentats: Bonus lasts for 1 hour instead of 10 mins.', effect: 'durationExtension', durationMinutes: 60, rarity: 'Uncommon' },
  { name: 'Stable', description: 'Psycho: No chance of addiction for this specific item.', effect: 'addictionImmune', rarity: 'Epic' },
  { name: 'Refreshing', description: 'Dirty Water: Removes 1 level of Exhaustion.', effect: 'exhaustionRemoval', levelsRemoved: 1, rarity: 'Rare' },
  { name: 'Ultra-Pure', description: 'Removes all radiation and heals to full.', effect: 'fullHealing', rarity: 'Legendary' },
  { name: 'Caffeinated', description: 'Stimpack: Restores 5 AP immediately.', effect: 'apRestore', apAmount: 5, rarity: 'Rare' },
  { name: 'Numbing', description: 'Stimpack: Grants +2 DR for 1 round.', effect: 'drBonus', drBonus: 2, duration: 1, rarity: 'Uncommon' },
  { name: 'Antiseptic', description: 'Stimpack: Cures any one disease.', effect: 'diseaseCure', rarity: 'Rare' },
  { name: 'Clotting', description: 'Stimpack: Stops all bleed effects immediately.', effect: 'bleedStop', rarity: 'Uncommon' }
];

const miscellaneousModifiers = [
  { name: 'Lucky Charm', description: 'While held, you can reroll one d20 roll per day.', effect: 'reroll', rerollsPerDay: 1, rarity: 'Epic' },
  { name: 'Scholar\'s', description: 'Skill Book: Gain +10% extra XP for 24 hours after reading.', effect: 'xpBonus', xpMultiplier: 1.1, durationHours: 24, rarity: 'Rare' },
  { name: 'Recycled', description: '20% chance to return to inventory after use.', effect: 'recycleChance', recycleChance: 0.2, rarity: 'Epic' },
  { name: 'Glow-in-the-Dark', description: 'Emits dim light in a 5-foot radius.', effect: 'lightEmission', lightRadius: 5, rarity: 'Common' },
  { name: 'Cold-Storage', description: 'Food items in this container never spoil.', effect: 'preventSpoil', rarity: 'Rare' },
  { name: 'Sealed', description: 'Provides +5 DR while in inventory (one item only).', effect: 'drBonus', drBonus: 5, rarity: 'Rare' },
  { name: 'Synthetic', description: 'Provides the same nutrition as food but weighs 0.', effect: 'zeroWeight', rarity: 'Common' },
  { name: 'Solar', description: 'Regenerates 1 HP every round in direct sunlight.', effect: 'sunRegeneration', hpPerRound: 1, rarity: 'Rare' },
  { name: 'Lunar', description: '+2 to PER and AGI during nighttime.', effect: 'nightBonus', statBonus: 2, stats: ['per', 'agi'], rarity: 'Rare' },
  { name: 'Vault-Tec', description: 'Grants +2 to all SPECIAL stats while in a Vault.', effect: 'vaultBonus', statBonus: 2, rarity: 'Rare' },
  { name: 'Divine', description: 'Grants +5 to all stats for 1 round.', effect: 'allStatBonus', statBonus: 5, duration: 1, rarity: 'Legendary' }
];

// Dynamic custom modifiers created by overseer
const customLegendaryModifiers = [];

// Function to get modifiers by type
function getModifiersByType(itemType) {
  const type = itemType.toLowerCase();
  
  switch (type) {
    case 'weapon':
    case 'weapons':
      return weaponModifiers;
    case 'armor':
      return armorModifiers;
    case 'tool':
    case 'tools':
      return toolModifiers;
    case 'consumable':
    case 'consumables':
    case 'stimpak':
    case 'chems':
    case 'food':
    case 'drink':
      return consumableModifiers;
    case 'miscellaneous':
    case 'misc':
    case 'items':
      return miscellaneousModifiers;
    default:
      return [];
  }
}

// Function to add custom modifier (called by overseer interface)
function addCustomLegendaryModifier(modifier) {
  // modifier should include: name, description, effect, applicableTo (item type), and mechanical values
  const newModifier = {
    id: `custom_${Date.now()}`,
    ...modifier,
    rarity: 'Custom',
    createdAt: new Date().toISOString()
  };
  customLegendaryModifiers.push(newModifier);
  return newModifier;
}

// Function to remove custom modifier
function removeCustomLegendaryModifier(modifierId) {
  const index = customLegendaryModifiers.findIndex(mod => mod.id === modifierId);
  if (index !== -1) {
    customLegendaryModifiers.splice(index, 1);
    return true;
  }
  return false;
}

// Function to get all custom modifiers
function getAllCustomModifiers() {
  return customLegendaryModifiers;
}

// Function to get custom modifiers by type
function getCustomModifiersByType(itemType) {
  return customLegendaryModifiers.filter(mod => 
    mod.applicableTo && mod.applicableTo.includes(itemType.toLowerCase())
  );
}

// Function to get random modifier by type (includes both static and custom)
function getRandomModifierByType(itemType) {
  const staticModifiers = getModifiersByType(itemType);
  const customMods = getCustomModifiersByType(itemType);
  const allModifiers = [...staticModifiers, ...customMods];
  
  if (allModifiers.length === 0) return null;
  return allModifiers[Math.floor(Math.random() * allModifiers.length)];
}

// Function to get modifier by name (checks both static and custom)
function getModifierByName(modifierName) {
  const allStaticModifiers = [
    ...weaponModifiers,
    ...armorModifiers,
    ...toolModifiers,
    ...consumableModifiers,
    ...miscellaneousModifiers
  ];
  
  let found = allStaticModifiers.find(mod => mod.name.toLowerCase() === modifierName.toLowerCase());
  
  if (!found) {
    found = customLegendaryModifiers.find(mod => mod.name.toLowerCase() === modifierName.toLowerCase());
  }
  
  return found;
}

// Function to get all modifiers of a specific rarity (static only)
function getModifiersByRarity(rarity) {
  const allModifiers = [
    ...weaponModifiers,
    ...armorModifiers,
    ...toolModifiers,
    ...consumableModifiers,
    ...miscellaneousModifiers
  ];
  return allModifiers.filter(mod => mod.rarity === rarity);
}

// Example usage:
// const weaponMods = getModifiersByType('weapon');
// const randomMod = getRandomModifierByType('armor');
// const viciousMod = getModifierByName('Vicious');
// const legendaryMods = getModifiersByRarity('Legendary');
// const customMod = addCustomLegendaryModifier({ name: 'Overseer\'s Blessing', description: 'Custom modifier', effect: 'customEffect', applicableTo: ['weapon', 'armor'], damageBonus: 5 });
// const allCustom = getAllCustomModifiers();
// const customWeaponMods = getCustomModifiersByType('weapon');
