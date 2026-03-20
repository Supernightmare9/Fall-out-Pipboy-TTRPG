// ══════════════════════════════════════════════════════════
//  VAULT 215 — Dice Rolling System
// ══════════════════════════════════════════════════════════

var DiceRoller = (function() {
    'use strict';

    // ── CORE DICE FUNCTIONS ──────────────────────────────────

    function roll(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }

    function rollMultiple(quantity, sides) {
        var results = [];
        for (var i = 0; i < quantity; i++) {
            results.push(roll(sides));
        }
        return results;
    }

    function rollWithModifier(quantity, sides, modifier) {
        var rolls = rollMultiple(quantity, sides);
        var total = rolls.reduce(function(a, b) { return a + b; }, 0);
        return {
            rolls: rolls,
            modifier: modifier || 0,
            subtotal: total,
            total: total + (modifier || 0)
        };
    }

    // ── SKILL CHECK ──────────────────────────────────────────

    function skillCheck(skillName, statModifier, proficiencyBonus, isProficient) {
        var d20 = roll(20);
        var modifier = statModifier + (isProficient ? (proficiencyBonus || 2) : 0);
        var total = d20 + modifier;

        return {
            type: 'skillCheck',
            skill: skillName,
            d20: d20,
            statModifier: statModifier,
            proficiencyBonus: isProficient ? (proficiencyBonus || 2) : 0,
            totalModifier: modifier,
            total: total,
            timestamp: new Date().toISOString(),
            description: skillName + ' Check: [d20: ' + d20 + '] + [mod: ' + modifier + '] = ' + total
        };
    }

    // ── ATTACK ROLL ──────────────────────────────────────────

    function attackRoll(attackName, attackModifier, targetAc) {
        var d20 = roll(20);
        var total = d20 + attackModifier;
        var isHit = total >= targetAc;
        var isCritical = d20 === 20;
        var isMiss = d20 === 1;

        return {
            type: 'attackRoll',
            attack: attackName,
            d20: d20,
            modifier: attackModifier,
            total: total,
            targetAc: targetAc,
            isHit: isHit,
            isCritical: isCritical,
            isMiss: isMiss,
            timestamp: new Date().toISOString(),
            description: (isCritical ? '\u26a1 CRITICAL HIT! ' : isMiss ? '\u2717 MISS! ' : isHit ? '\u2713 HIT! ' : '\u2717 MISS! ') +
                        attackName + ' [d20: ' + d20 + '] + [' + attackModifier + '] = ' + total + ' vs AC ' + targetAc
        };
    }

    // ── DAMAGE ROLL ──────────────────────────────────────────

    function damageRoll(weaponName, quantity, damageDie, modifier) {
        var rolls = rollMultiple(quantity, damageDie);
        var subtotal = rolls.reduce(function(a, b) { return a + b; }, 0);
        var total = subtotal + (modifier || 0);

        return {
            type: 'damageRoll',
            weapon: weaponName,
            rolls: rolls,
            damageDie: damageDie,
            subtotal: subtotal,
            modifier: modifier || 0,
            total: total,
            timestamp: new Date().toISOString(),
            description: weaponName + ' damage: [' + rolls.join('+') + '] + [' + (modifier || 0) + '] = ' + total + ' damage'
        };
    }

    // ── SAVING THROW ─────────────────────────────────────────

    function savingThrow(saveName, savingThrowModifier, dc) {
        var d20 = roll(20);
        var total = d20 + savingThrowModifier;
        var isSuccess = total >= dc;

        return {
            type: 'savingThrow',
            save: saveName,
            d20: d20,
            modifier: savingThrowModifier,
            total: total,
            dc: dc,
            isSuccess: isSuccess,
            timestamp: new Date().toISOString(),
            description: saveName + ' [d20: ' + d20 + '] + [' + savingThrowModifier + '] = ' + total + ' vs DC ' + dc + ' (' + (isSuccess ? 'SAVE' : 'FAIL') + ')'
        };
    }

    // ── INITIATIVE ───────────────────────────────────────────

    function initiativeRoll(playerName, dexModifier) {
        var d20 = roll(20);
        var total = d20 + dexModifier;

        return {
            type: 'initiative',
            player: playerName,
            d20: d20,
            modifier: dexModifier,
            total: total,
            timestamp: new Date().toISOString(),
            description: playerName + ' initiative: [d20: ' + d20 + '] + [DEX: ' + dexModifier + '] = ' + total
        };
    }

    // ── GENERIC ROLL ─────────────────────────────────────────

    function genericRoll(rollName, diceString) {
        var match = diceString.match(/^(\d*)d(\d+)([\+\-]\d+)?$/i);
        if (!match) return null;

        var quantity = parseInt(match[1], 10) || 1;
        var sides = parseInt(match[2], 10);
        var modifier = match[3] ? parseInt(match[3], 10) : 0;

        return rollWithModifier(quantity, sides, modifier);
    }

    // ── PUBLIC API ───────────────────────────────────────────

    return {
        roll: roll,
        rollMultiple: rollMultiple,
        rollWithModifier: rollWithModifier,
        skillCheck: skillCheck,
        attackRoll: attackRoll,
        damageRoll: damageRoll,
        savingThrow: savingThrow,
        initiativeRoll: initiativeRoll,
        genericRoll: genericRoll
    };
})();
