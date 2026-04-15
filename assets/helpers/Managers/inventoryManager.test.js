const InventoryManager = require('./inventoryManager');

describe('InventoryManager equipment effect application', () => {
  test('applies and removes AC and SPECIAL bonuses from equipped items', () => {
    const playerData = {
      hp: 100,
      maxHp: 100,
      ac: 10,
      special: {
        strength: 5,
        perception: 5,
        endurance: 5,
        charisma: 5,
        intelligence: 5,
        agility: 5,
        luck: 5
      }
    };

    const inventory = [
      {
        uid: 'armor_1',
        id: 'item_power_armor_1',
        type: 'armor',
        armorClass: 4,
        properties: ['Strength Boost', '+4 AC']
      }
    ];

    const equipment = {
      body: { uid: 'armor_1', id: 'item_power_armor_1', name: 'T-51 Power Armor' }
    };

    InventoryManager.applyEquipmentEffectsToPlayerData(playerData, equipment, inventory);
    expect(playerData.ac).toBe(18);
    expect(playerData.special.strength).toBe(6);

    equipment.body = null;
    InventoryManager.applyEquipmentEffectsToPlayerData(playerData, equipment, inventory);
    expect(playerData.ac).toBe(10);
    expect(playerData.special.strength).toBe(5);
  });

  test('supports object and string equipment identities', () => {
    const inventory = [{ uid: 'u1', id: 'i1', armorClass: 1 }];
    expect(InventoryManager.getEquippedItemForSlot({ head: { uid: 'u1' } }, 'head', inventory)).toBeTruthy();
    expect(InventoryManager.getEquippedItemForSlot({ head: 'u1' }, 'head', inventory)).toBeTruthy();
    expect(InventoryManager.getEquippedItemForSlot({ head: 'i1' }, 'head', inventory)).toBeTruthy();
  });
});
