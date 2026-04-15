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

    // Base carry weight before the Strength bonus (100 lbs).
    // Uses getCarryCapacity() from fallout_stat_bonuses.js — the single source of
    // truth for all S.P.E.C.I.A.L. derived stats.  Ensure that script is loaded
    // before inventoryManager.js in any HTML that calls this function.
    var BASE_CARRY_CAPACITY = 100;

    function getCarryingCapacity(strengthStat) {
        // Default to 5 (base S.P.E.C.I.A.L. value) only when strengthStat is null/undefined.
        if (strengthStat === null || strengthStat === undefined) { strengthStat = 5; }
        if (typeof getCarryCapacity === 'function') {
            return getCarryCapacity(BASE_CARRY_CAPACITY, strengthStat);
        }
        // Fallback (fallout_stat_bonuses.js not yet loaded): inline formula
        return BASE_CARRY_CAPACITY + (strengthStat * 10);
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

    var SPECIAL_KEYS = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'];
    var SPECIAL_LONG_PATTERN = new RegExp('([+-]?\\d+)\\s*(?:to\\s+)?(' + SPECIAL_KEYS.join('|') + ')', 'i');

    function _emptySpecialBonuses() {
        return {
            strength: 0, perception: 0, endurance: 0, charisma: 0,
            intelligence: 0, agility: 0, luck: 0
        };
    }

    function _toNumber(val, fallback) {
        if (fallback === undefined) fallback = 0;
        var n = Number(val);
        return Number.isFinite(n) ? n : fallback;
    }

    function getEquipmentItemIdentity(slotValue) {
        if (!slotValue) return null;
        if (typeof slotValue === 'string') return slotValue;
        if (typeof slotValue === 'object') {
            return slotValue.uid || slotValue.id || null;
        }
        return null;
    }

    function getEquippedItemIds(equipment) {
        if (!equipment || typeof equipment !== 'object') return [];
        return Object.keys(equipment).map(function(slot) {
            return getEquipmentItemIdentity(equipment[slot]);
        }).filter(Boolean);
    }

    function getEquippedItemForSlot(equipment, slotKey, inventory) {
        if (!equipment || !slotKey || !Array.isArray(inventory)) return null;
        var identity = getEquipmentItemIdentity(equipment[slotKey]);
        if (!identity) return null;
        return inventory.find(function(item) {
            return item && (item.uid === identity || item.id === identity);
        }) || null;
    }

    function _parseSpecialToken(token) {
        var t = String(token || '').trim().toLowerCase();
        if (t === 'str') return 'strength';
        if (t === 'per') return 'perception';
        if (t === 'end') return 'endurance';
        if (t === 'cha') return 'charisma';
        if (t === 'int') return 'intelligence';
        if (t === 'agi') return 'agility';
        if (t === 'luk') return 'luck';
        if (SPECIAL_KEYS.indexOf(t) !== -1) return t;
        return null;
    }

    function _addSpecialBonus(specialBonuses, key, amount) {
        if (!specialBonuses || !key) return;
        specialBonuses[key] = _toNumber(specialBonuses[key], 0) + _toNumber(amount, 0);
    }

    function _extractBonusesFromEffects(item, out) {
        if (!item || !item.effects || typeof item.effects !== 'object') return;
        if (typeof item.effects.ac === 'number') out.ac += item.effects.ac;
        if (typeof item.effects.armorClass === 'number') out.ac += item.effects.armorClass;
        if (typeof item.effects.maxHp === 'number') out.maxHp += item.effects.maxHp;
        if (item.effects.special && typeof item.effects.special === 'object') {
            Object.keys(item.effects.special).forEach(function(rawKey) {
                var key = _parseSpecialToken(rawKey);
                if (!key) return;
                _addSpecialBonus(out.special, key, item.effects.special[rawKey]);
            });
        }
    }

    function _extractBonusesFromProperties(item, out) {
        if (!item || !Array.isArray(item.properties)) return;
        item.properties.forEach(function(propRaw) {
            var prop = String(propRaw || '');
            var acMatch = prop.match(/([+-]\d+)\s*AC/i);
            if (acMatch) out.ac += parseInt(acMatch[1], 10);

            var longMatch = prop.match(SPECIAL_LONG_PATTERN);
            if (longMatch) {
                var longKey = _parseSpecialToken(longMatch[2]);
                if (longKey) _addSpecialBonus(out.special, longKey, parseInt(longMatch[1], 10));
            }

            var shortMatch = prop.match(/([+-]?\d+)\s*(STR|PER|END|CHA|INT|AGI|LUK)\b/i);
            if (shortMatch) {
                var shortKey = _parseSpecialToken(shortMatch[2]);
                if (shortKey) _addSpecialBonus(out.special, shortKey, parseInt(shortMatch[1], 10));
            }

            if (/strength\s*boost/i.test(prop) && !longMatch && !shortMatch) {
                _addSpecialBonus(out.special, 'strength', 1);
            }
        });
    }

    function calculateEquippedBonuses(equipment, inventory) {
        var out = { ac: 0, maxHp: 0, special: _emptySpecialBonuses() };
        if (!equipment || typeof equipment !== 'object' || !Array.isArray(inventory)) return out;
        Object.keys(equipment).forEach(function(slotKey) {
            var item = getEquippedItemForSlot(equipment, slotKey, inventory);
            if (!item) return;
            if (typeof item.armorClass === 'number') out.ac += item.armorClass;
            _extractBonusesFromEffects(item, out);
            _extractBonusesFromProperties(item, out);
        });
        return out;
    }

    function applyEquipmentEffectsToPlayerData(playerData, equipment, inventory) {
        if (!playerData || typeof playerData !== 'object') return null;
        if (!playerData.special || typeof playerData.special !== 'object' || Array.isArray(playerData.special)) {
            playerData.special = _emptySpecialBonuses();
        }
        SPECIAL_KEYS.forEach(function(key) {
            if (typeof playerData.special[key] !== 'number') playerData.special[key] = 0;
        });

        var prev = playerData.inventoryEffectBonuses && typeof playerData.inventoryEffectBonuses === 'object'
            ? playerData.inventoryEffectBonuses
            : { ac: 0, maxHp: 0, special: _emptySpecialBonuses() };
        if (!prev.special || typeof prev.special !== 'object') prev.special = _emptySpecialBonuses();

        var next = calculateEquippedBonuses(equipment, inventory);
        var baseSpecial = {};
        SPECIAL_KEYS.forEach(function(key) {
            baseSpecial[key] = _toNumber(playerData.special[key], 0) - _toNumber(prev.special[key], 0);
            playerData.special[key] = baseSpecial[key] + _toNumber(next.special[key], 0);
        });

        var baseAc = _toNumber(playerData.ac, 10) - _toNumber(prev.ac, 0);
        playerData.ac = baseAc + _toNumber(next.ac, 0);

        var maxHpFallback = _toNumber(playerData.hp, 100);
        var currentMaxHp = _toNumber(playerData.maxHp, maxHpFallback);
        var baseMaxHp = currentMaxHp - _toNumber(prev.maxHp, 0);
        playerData.maxHp = Math.max(1, baseMaxHp + _toNumber(next.maxHp, 0));
        playerData.hp = Math.min(_toNumber(playerData.hp, playerData.maxHp), playerData.maxHp);

        playerData.inventoryEffectBonuses = next;
        return next;
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
        var idx = inventory.findIndex(function(i) { return i.id === itemId || i.uid === itemId; });
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
        calculateEquippedBonuses:  calculateEquippedBonuses,
        applyEquipmentEffectsToPlayerData: applyEquipmentEffectsToPlayerData,
        getEquipmentItemIdentity:  getEquipmentItemIdentity,
        getEquippedItemIds:        getEquippedItemIds,
        getEquippedItemForSlot:    getEquippedItemForSlot,

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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryManager;
}
