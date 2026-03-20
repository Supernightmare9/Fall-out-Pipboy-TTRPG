// Vault 215 Inventory Management System
// ══════════════════════════════════════════════════════════

var InventoryManager = (function() {
    'use strict';

    // ── EQUIPMENT SLOTS ──────────────────────────────────────
    var EQUIPMENT_SLOTS = [
        'head',
        'chest',
        'hands',
        'legs',
        'feet',
        'mainHand',
        'offHand'
    ];

    // ── WEIGHT MANAGEMENT ────────────────────────────────────
    function calculateTotalWeight(inventory) {
        if (!inventory || !Array.isArray(inventory)) return 0;
        var total = 0;
        inventory.forEach(function(item) {
            var itemWeight = item.weight || 0;
            var quantity = item.quantity || 1;
            total += (itemWeight * quantity);
        });
        return Math.round(total * 10) / 10;
    }

    function getCarryingCapacity(strengthStat) {
        strengthStat = strengthStat || 10;
        var strModifier = Math.max(0, strengthStat - 10);
        return 150 + (strModifier * 10);
    }

    function getEncumbranceStatus(totalWeight, capacity) {
        var percentage = (totalWeight / capacity) * 100;
        if (percentage <= 50) return 'light';
        if (percentage <= 75) return 'moderate';
        if (percentage <= 100) return 'heavy';
        return 'over';
    }

    function getEncumbrancePenalty(status) {
        var penalties = {
            'light':    { speed: 1.0,  acPenalty: 0,  attackPenalty: 0 },
            'moderate': { speed: 0.75, acPenalty: -1, attackPenalty: -1 },
            'heavy':    { speed: 0.5,  acPenalty: -2, attackPenalty: -2 },
            'over':     { speed: 0,    acPenalty: -4, attackPenalty: -4 }
        };
        return penalties[status] || penalties['light'];
    }

    // ── EQUIPMENT SYSTEM ─────────────────────────────────────
    function getEquippedItems(character) {
        if (!character.equipment) character.equipment = {};
        return character.equipment;
    }

    function equipItem(character, itemId, slotType, inventory) {
        if (!character.equipment) character.equipment = {};
        var item = inventory.find(function(i) { return i.id === itemId; });
        if (!item) return false;
        var validSlots = getValidSlotsForItem(item);
        if (validSlots.indexOf(slotType) === -1) return false;
        character.equipment[slotType] = itemId;
        return true;
    }

    function unequipItem(character, slotType) {
        if (!character.equipment) character.equipment = {};
        character.equipment[slotType] = null;
    }

    function getValidSlotsForItem(item) {
        var slotMap = {
            'armor':     ['head', 'chest', 'hands', 'legs', 'feet'],
            'weapon':    ['mainHand', 'offHand'],
            'accessory': ['head', 'chest']
        };
        return slotMap[item.type] || [];
    }

    // ── AC CALCULATION ───────────────────────────────────────
    function calculateArmorClass(character, inventory) {
        var baseAc = character.ac || 10;
        var equipped = getEquippedItems(character);
        var acBonus = 0;
        Object.keys(equipped).forEach(function(slot) {
            var itemId = equipped[slot];
            if (!itemId) return;
            var item = inventory.find(function(i) { return i.id === itemId; });
            if (item && item.armorClass) {
                acBonus += item.armorClass;
            }
        });
        return baseAc + acBonus;
    }

    // ── CONSUMABLE USAGE ─────────────────────────────────────
    function useConsumable(item, character) {
        if (!item || item.type !== 'consumable') {
            return { success: false, message: 'Not a consumable' };
        }
        var effects = item.effects || {};
        var result = {
            success: true,
            message: 'Used ' + item.name,
            hpRestored: 0
        };
        if (effects.healing) {
            var oldHp = character.currentHp;
            character.currentHp = Math.min(character.maxHp, character.currentHp + effects.healing);
            result.hpRestored = character.currentHp - oldHp;
            result.message += ' — Restored ' + result.hpRestored + ' HP';
        }
        if (effects.curePoison) {
            if (character.status === 'poisoned') {
                character.status = 'alive';
                result.message += ' — Poison cured';
            }
        }
        if (effects.cureRadiation) {
            character.radiationLevel = Math.max(0, (character.radiationLevel || 0) - effects.cureRadiation);
            result.message += ' — Radiation reduced';
        }
        return result;
    }

    // ── ITEM EFFECTS ─────────────────────────────────────────
    function getWeaponDamageBonus(weapon) {
        if (!weapon || !weapon.damage) return 0;
        var match = String(weapon.damage).match(/\+(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }

    function getItemValue(item) {
        return item.value || 0;
    }

    function getTotalInventoryValue(inventory) {
        var total = 0;
        inventory.forEach(function(item) {
            total += (item.value || 0) * (item.quantity || 1);
        });
        return total;
    }

    // ── ITEM RARITY ──────────────────────────────────────────
    function getRarityColor(rarity) {
        var colors = {
            'common':    '#b0b0b0',
            'uncommon':  '#4ade80',
            'rare':      '#3b82f6',
            'epic':      '#a855f7',
            'legendary': '#fbbf24'
        };
        return colors[rarity] || colors['common'];
    }

    function getRarityLabel(rarity) {
        var labels = {
            'common':    'Common',
            'uncommon':  'Uncommon',
            'rare':      'Rare',
            'epic':      'Epic',
            'legendary': 'Legendary'
        };
        return labels[rarity] || 'Unknown';
    }

    // ── INVENTORY MANAGEMENT ─────────────────────────────────
    function addItemToInventory(inventory, itemData) {
        if (!inventory) inventory = [];
        var existing = inventory.find(function(i) { return i.id === itemData.id; });
        if (existing) {
            existing.quantity = (existing.quantity || 1) + (itemData.quantity || 1);
        } else {
            itemData.quantity = itemData.quantity || 1;
            inventory.push(itemData);
        }
        return inventory;
    }

    function removeItemFromInventory(inventory, itemId, quantity) {
        quantity = quantity || 1;
        var idx = inventory.findIndex(function(i) { return i.id === itemId; });
        if (idx === -1) return false;
        inventory[idx].quantity = (inventory[idx].quantity || 1) - quantity;
        if (inventory[idx].quantity <= 0) {
            inventory.splice(idx, 1);
        }
        return true;
    }

    function dropItem(inventory, itemId, quantity) {
        return removeItemFromInventory(inventory, itemId, quantity);
    }

    // ── PERSONAL vs PARTY INVENTORY ──────────────────────────
    function getCharacterPersonalItems(character) {
        if (!character.personalInventory) character.personalInventory = [];
        return character.personalInventory;
    }

    function transferItemToCharacter(partyInventory, characterInventory, itemId, quantity) {
        var item = partyInventory.find(function(i) { return i.id === itemId; });
        if (!item) return false;
        removeItemFromInventory(partyInventory, itemId, quantity);
        var itemCopy = JSON.parse(JSON.stringify(item));
        itemCopy.quantity = quantity || 1;
        addItemToInventory(characterInventory, itemCopy);
        return true;
    }

    // ── LOOT NOTIFICATION ────────────────────────────────────
    function createLootNotification(items) {
        var summary = items.map(function(item) {
            return (item.quantity || 1) + '× ' + item.name;
        }).join(', ');
        return '🎁 Loot received: ' + summary;
    }

    // ── PUBLIC API ───────────────────────────────────────────
    return {
        calculateTotalWeight:      calculateTotalWeight,
        getCarryingCapacity:       getCarryingCapacity,
        getEncumbranceStatus:      getEncumbranceStatus,
        getEncumbrancePenalty:     getEncumbrancePenalty,

        getEquippedItems:          getEquippedItems,
        equipItem:                 equipItem,
        unequipItem:               unequipItem,
        getValidSlotsForItem:      getValidSlotsForItem,
        calculateArmorClass:       calculateArmorClass,

        useConsumable:             useConsumable,
        getWeaponDamageBonus:      getWeaponDamageBonus,

        getItemValue:              getItemValue,
        getTotalInventoryValue:    getTotalInventoryValue,
        getRarityColor:            getRarityColor,
        getRarityLabel:            getRarityLabel,

        addItemToInventory:        addItemToInventory,
        removeItemFromInventory:   removeItemFromInventory,
        dropItem:                  dropItem,

        getCharacterPersonalItems: getCharacterPersonalItems,
        transferItemToCharacter:   transferItemToCharacter,

        createLootNotification:    createLootNotification,

        EQUIPMENT_SLOTS:           EQUIPMENT_SLOTS
    };
})();
