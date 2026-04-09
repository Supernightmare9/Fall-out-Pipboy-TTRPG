/**
 * healthManager.js — Central health mutation engine for the Vault 215 Pip-Boy TTRPG.
 *
 * This module is the single source of truth for all health state changes.
 * All mutations (damage, healing, rads, temp HP) are validated and processed here.
 *
 * Radiation rules:
 *   - Rads reduce available HP cap: effectiveCap = maxHP - rads
 *   - Taking rads clamps currentHP and tempHealth to the new cap immediately
 *   - Removing rads raises the cap but does NOT restore currentHP — player must heal separately
 *   - Rads >= 80% of maxHP triggers Radiation Sickness (debuffs + message); revoked when below threshold
 *
 * Temp HP rules:
 *   - Temp HP is absorbed before real HP on any damage
 *   - Temp HP cap = effectiveCap (maxHP - rads)
 *   - When setting temp HP, only the highest value wins (no stack); still capped
 *
 * Damage rules:
 *   - Damage hits Temp HP first, remainder hits real HP
 *   - Real HP floors at 0
 *
 * Healing rules:
 *   - Healing cannot exceed effectiveCap (maxHP - rads)
 *
 * Usage (Node.js / browser):
 *   const hm = require('./healthManager');
 *   const { state, events } = hm.applyHealthMutation(playerState, 'damage', 25);
 *
 * Mutation types: 'damage' | 'heal' | 'addRads' | 'removeRads' | 'setTempHp'
 */

(function (root) {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────────
  var RAD_SICKNESS_RATIO  = 0.8;    // 80% of maxHP
  var MAX_RADS            = 1000;
  var RAD_SICKNESS_ID     = 'rad_sickness';
  var RAD_SICKNESS_NAME   = 'Radiation Sickness';

  /**
   * Radiation Sickness debuff descriptor.
   * Applied automatically when rads >= 80% of maxHP.
   */
  var RAD_SICKNESS_DEBUFF = {
    id:      RAD_SICKNESS_ID,
    name:    RAD_SICKNESS_NAME,
    effects: {
      strength:  -2,
      agility:   -2,
      moveSpeed: -1
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Clamp value between min and max (inclusive). */
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  /** Compute the HP cap after radiation is applied. */
  function effectiveCap(state) {
    return Math.max(0, (state.maxHp || 0) - (state.radiation || 0));
  }

  /** Returns true if the debuffs array contains the Radiation Sickness debuff. */
  function hasRadSickness(debuffs) {
    return (debuffs || []).some(function (d) {
      return (typeof d === 'object' ? d.id : d) === RAD_SICKNESS_ID;
    });
  }

  /**
   * Check radiation level against the 80% threshold.
   * Adds or removes the Radiation Sickness debuff from the state accordingly.
   * Appends events when the status changes.
   *
   * @param {object} s      Mutable health state copy
   * @param {Array}  events Mutable events array
   * @returns {object} s (mutated in place)
   */
  function _syncRadSickness(s, events) {
    var threshold = Math.floor((s.maxHp || 0) * RAD_SICKNESS_RATIO);
    var sick      = hasRadSickness(s.debuffs);

    if ((s.radiation || 0) >= threshold && threshold > 0) {
      if (!sick) {
        s.debuffs = (s.debuffs || []).concat([RAD_SICKNESS_DEBUFF]);
        events.push({
          type:    'rad_sickness_onset',
          message: '☢ RADIATION SICKNESS: Your body can no longer cope with the radiation. ' +
                   'Strength −2, Agility −2, Move Speed −1.',
          debuffs: [RAD_SICKNESS_DEBUFF]
        });
      }
    } else {
      if (sick) {
        s.debuffs = (s.debuffs || []).filter(function (d) {
          return (typeof d === 'object' ? d.id : d) !== RAD_SICKNESS_ID;
        });
        events.push({
          type:    'rad_sickness_cleared',
          message: '✓ Radiation levels have dropped — Radiation Sickness cleared.'
        });
      }
    }
    return s;
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Apply a single health mutation to a player state object.
   *
   * Input state shape (all fields optional; defaults applied):
   *   { hp, maxHp, radiation, tempHealth, debuffs }
   *
   * @param {object} state  Current player health state (not mutated)
   * @param {string} type   'damage' | 'heal' | 'addRads' | 'removeRads' | 'setTempHp'
   * @param {number} amount Non-negative integer amount
   * @returns {{ state: object, events: Array }} New state + list of events/messages
   */
  function applyHealthMutation(state, type, amount) {
    // Shallow-copy state; deep-copy debuffs to avoid reference sharing
    var s = {
      hp:         typeof state.hp         === 'number' ? state.hp         : 0,
      maxHp:      typeof state.maxHp      === 'number' ? state.maxHp      : 0,
      radiation:  typeof state.radiation  === 'number' ? state.radiation  : 0,
      tempHealth: typeof state.tempHealth === 'number' ? state.tempHealth : 0,
      debuffs:    (state.debuffs || []).map(function (d) { return d; })
    };

    var events = [];
    var a = Math.max(0, Math.floor(amount || 0));
    var cap = effectiveCap(s);

    if (type === 'damage') {
      var damage = a;

      // Absorb with Temp HP first
      if (s.tempHealth > 0) {
        var absorbed = Math.min(s.tempHealth, damage);
        s.tempHealth = s.tempHealth - absorbed;
        damage       = damage - absorbed;
        if (absorbed > 0) {
          events.push({
            type:    'temp_absorbed',
            message: '🛡 ' + absorbed + ' damage absorbed by Temp HP!'
          });
        }
      }

      // Remainder hits real HP
      if (damage > 0) {
        s.hp = Math.max(0, s.hp - damage);
        if (s.hp === 0) {
          events.push({ type: 'player_down', message: '💀 HP is at 0 — player is down!' });
        }
      }

    } else if (type === 'heal') {
      cap     = effectiveCap(s);
      s.hp    = clamp(s.hp + a, 0, cap);

    } else if (type === 'addRads') {
      s.radiation = clamp(s.radiation + a, 0, MAX_RADS);

      // Recalculate cap and clamp HP / tempHealth to it
      cap = effectiveCap(s);
      if (s.hp > cap) {
        s.hp = cap;
      }
      if (s.tempHealth > cap) {
        s.tempHealth = cap;
        events.push({
          type:    'temp_hp_capped',
          message: '☢ Temp HP reduced to fit new radiation cap (' + cap + ').'
        });
      }

      _syncRadSickness(s, events);

    } else if (type === 'removeRads') {
      s.radiation = clamp(s.radiation - a, 0, MAX_RADS);
      // HP does NOT increase — just the cap rises; player must heal separately
      _syncRadSickness(s, events);

    } else if (type === 'setTempHp') {
      cap = effectiveCap(s);
      // Only apply if new value is higher than current (highest-value-wins rule)
      var requested = Math.min(a, cap);
      s.tempHealth = Math.max(s.tempHealth, requested);
    }

    return { state: s, events: events };
  }

  /**
   * Check whether the given health state currently has Radiation Sickness.
   * @param {object} state Player health state
   * @returns {boolean}
   */
  function isRadiationSick(state) {
    return hasRadSickness(state.debuffs || []);
  }

  /**
   * Returns the effective HP cap (maxHP - radiation) for a given state.
   * @param {object} state Player health state
   * @returns {number}
   */
  function getEffectiveCap(state) {
    return effectiveCap(state);
  }

  // ── Module export ─────────────────────────────────────────────────────────────
  var HealthManager = {
    applyHealthMutation: applyHealthMutation,
    isRadiationSick:     isRadiationSick,
    getEffectiveCap:     getEffectiveCap,
    RAD_SICKNESS_DEBUFF: RAD_SICKNESS_DEBUFF,
    RAD_SICKNESS_ID:     RAD_SICKNESS_ID
  };

  // Node.js / CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthManager;
  }

  // Browser global
  if (typeof root !== 'undefined') {
    root.HealthManager = HealthManager;
  }

}(typeof window !== 'undefined' ? window : global));
