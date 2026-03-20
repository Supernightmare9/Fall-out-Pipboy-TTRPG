// ══════════════════════════════════════════════════════════
//  VAULT 215 — Combat System (CHUNK 9)
//  Status Conditions, Concentration & Reactions
// ══════════════════════════════════════════════════════════

var CombatSystem = (function () {
    'use strict';

    // ── CONDITION DEFINITIONS ─────────────────────────────────────

    var CONDITIONS = {
        poisoned:    { icon: '☠',  name: 'Poisoned',    acMod:  0, attackMod: -2, description: 'Deals 5 damage/round. -2 to attacks.' },
        stunned:     { icon: '⚡', name: 'Stunned',     acMod: -3, attackMod: -3, description: 'Stunned. -3 to AC and attacks.' },
        paralyzed:   { icon: '🔒', name: 'Paralyzed',   acMod: -4, attackMod: -4, description: 'Cannot act or move. -4 AC and attacks.' },
        blinded:     { icon: '👁',  name: 'Blinded',    acMod: -2, attackMod: -4, description: 'Cannot see. -2 AC, -4 to attacks.' },
        restrained:  { icon: '⛓',  name: 'Restrained', acMod: -1, attackMod: -2, description: 'Movement restricted. -1 AC, -2 attacks.' },
        unconscious: { icon: '💫', name: 'Unconscious', acMod: -5, attackMod:  0, description: 'Unconscious and unable to act.' },
        frightened:  { icon: '😱', name: 'Frightened',  acMod:  0, attackMod: -2, description: 'Frightened of source. -2 to attacks.' },
        prone:       { icon: '⬇',  name: 'Prone',      acMod: -2, attackMod: -2, description: 'On the ground. -2 AC and attacks.' }
    };

    // ── SAVING THROW DCS ──────────────────────────────────────────

    var SAVE_DCS = {
        poisoned:    12,
        stunned:     14,
        paralyzed:   16,
        blinded:     12,
        restrained:  12,
        unconscious: 18,
        frightened:  13,
        prone:       10
    };

    // ── CONDITION MANAGEMENT ──────────────────────────────────────

    // Add a condition to a character; returns true if newly applied, false if refreshed/invalid
    function addCondition(character, type, duration, source) {
        if (!CONDITIONS[type]) return false;
        if (!Array.isArray(character.conditions)) character.conditions = [];

        var idx = character.conditions.findIndex(function (c) { return c.type === type; });
        if (idx !== -1) {
            // Refresh duration only if the new one is longer
            if ((duration || 1) > character.conditions[idx].duration) {
                character.conditions[idx].duration = duration || 1;
            }
            return false;
        }

        character.conditions.push({
            type:      type,
            duration:  duration || 1,
            source:    source  || 'unknown',
            appliedAt: new Date().toISOString()
        });
        return true;
    }

    // Remove a condition; returns true if it was present
    function removeCondition(character, type) {
        if (!Array.isArray(character.conditions)) return false;
        var before = character.conditions.length;
        character.conditions = character.conditions.filter(function (c) { return c.type !== type; });
        return character.conditions.length < before;
    }

    // Roll d20 + CON modifier vs the condition's DC; removes condition on success
    function makeConditionSave(character, type) {
        var conStat = (character.stats && character.stats.con) ? character.stats.con : 10;
        var conMod  = Math.floor((conStat - 10) / 2);
        var dc      = SAVE_DCS[type] || 12;
        var d20     = Math.floor(Math.random() * 20) + 1;
        var total   = d20 + conMod;
        var success = total >= dc;

        if (success) { removeCondition(character, type); }

        return {
            d20:       d20,
            modifier:  conMod,
            total:     total,
            dc:        dc,
            success:   success,
            condition: type
        };
    }

    // Advance one combat round: apply DOT, decrement durations, remove expired conditions
    function advanceConditionRound(character) {
        if (!Array.isArray(character.conditions)) {
            return { expired: [], poisonDamage: 0 };
        }

        var expired      = [];
        var poisonDamage = 0;

        character.conditions = character.conditions.filter(function (c) {
            if (c.type === 'poisoned') { poisonDamage += 5; }
            c.duration = (c.duration || 1) - 1;
            if (c.duration <= 0) {
                expired.push(c.type);
                return false;
            }
            return true;
        });

        return { expired: expired, poisonDamage: poisonDamage };
    }

    // ── CONDITION MODIFIERS ───────────────────────────────────────

    // Returns total AC penalty from all active conditions (negative number)
    function getConditionAcModifier(character) {
        if (!Array.isArray(character.conditions) || character.conditions.length === 0) return 0;
        return character.conditions.reduce(function (sum, c) {
            return sum + (CONDITIONS[c.type] ? CONDITIONS[c.type].acMod : 0);
        }, 0);
    }

    // Returns total attack penalty from all active conditions (negative number)
    function getConditionAttackModifier(character) {
        if (!Array.isArray(character.conditions) || character.conditions.length === 0) return 0;
        return character.conditions.reduce(function (sum, c) {
            return sum + (CONDITIONS[c.type] ? CONDITIONS[c.type].attackMod : 0);
        }, 0);
    }

    // ── CONCENTRATION SYSTEM ──────────────────────────────────────

    // Begin concentrating on an ability spell
    // character.concentration = { ability, duration, startedAt }
    function startConcentration(character, ability, duration) {
        character.concentration = {
            ability:   ability  || 'Unknown',
            duration:  duration || 10,
            startedAt: new Date().toISOString()
        };
    }

    // Check concentration after taking damage; removes concentration on failure
    // Returns { required, d20, modifier, total, dc, success }
    function checkConcentration(character, damageReceived) {
        if (!character.concentration) return { required: false };

        var dc      = Math.max(10, Math.floor((damageReceived || 0) / 2));
        var conStat = (character.stats && character.stats.con) ? character.stats.con : 10;
        var conMod  = Math.floor((conStat - 10) / 2);
        var d20     = Math.floor(Math.random() * 20) + 1;
        var total   = d20 + conMod;
        var success = total >= dc;

        if (!success) { character.concentration = null; }

        return {
            required: true,
            d20:      d20,
            modifier: conMod,
            total:    total,
            dc:       dc,
            success:  success
        };
    }

    // ── REACTION SYSTEM ───────────────────────────────────────────

    // Reset reactions at the start of a new turn
    // character.reactions = { used: [], resetAt: <ISO string> }
    function initializeReactions(character) {
        character.reactions = {
            used:    [],
            resetAt: new Date().toISOString()
        };
    }

    // Spend a named reaction; returns true if available, false if already used
    function useReaction(character, name) {
        if (!character.reactions) { initializeReactions(character); }
        if (character.reactions.used.indexOf(name) !== -1) { return false; }
        character.reactions.used.push(name);
        return true;
    }

    // ── DISPLAY ───────────────────────────────────────────────────

    // Returns a compact formatted string of active conditions
    function getConditionDisplay(character) {
        if (!Array.isArray(character.conditions) || character.conditions.length === 0) {
            return 'None';
        }
        return character.conditions.map(function (c) {
            var def = CONDITIONS[c.type];
            if (!def) return c.type;
            return def.icon + ' ' + def.name + ' (' + c.duration + ' rnd)';
        }).join(', ');
    }

    // ── PUBLIC API ────────────────────────────────────────────────

    return {
        CONDITIONS:                 CONDITIONS,
        SAVE_DCS:                   SAVE_DCS,
        addCondition:               addCondition,
        removeCondition:            removeCondition,
        makeConditionSave:          makeConditionSave,
        advanceConditionRound:      advanceConditionRound,
        getConditionAcModifier:     getConditionAcModifier,
        getConditionAttackModifier: getConditionAttackModifier,
        startConcentration:         startConcentration,
        checkConcentration:         checkConcentration,
        initializeReactions:        initializeReactions,
        useReaction:                useReaction,
        getConditionDisplay:        getConditionDisplay
    };
}());
