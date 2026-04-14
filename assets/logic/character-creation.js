// ============================================================================
//  character-creation.js
//  Vault 215 — Character Creation Logic
//
//  Manages the two-step race + gene pool selection that gates every subsequent
//  character-creation step (S.P.E.C.I.A.L. allocation, skills, perks, etc.).
//
//  Depends on:
//    window.baseRaces  (assets/data/pools/base-race.js)
//    window.genePool   (assets/data/pools/gene-pool.js)
//
//  Exposes:
//    window.CharacterCreation — public API used by character-creation.html and
//                               any future page that needs to query creation state.
// ============================================================================

(function (global) {
  'use strict';

  // ── localStorage key helpers ──────────────────────────────────────────────
  // Mirror the lsKey() convention used in stats.html so keys stay consistent
  // across pages for the same player handle.
  function _playerHandle() {
    return (
      sessionStorage.getItem('username') ||
      localStorage.getItem('PIPBOY_PLAYER_HANDLE') ||
      'player'
    ).toLowerCase();
  }

  function lsKey(k) {
    return k + '_' + _playerHandle();
  }

  // ── Persistence helpers ───────────────────────────────────────────────────

  /** Load full playerData from localStorage (same key as stats.html). */
  function loadPlayerData() {
    try {
      var raw = localStorage.getItem(lsKey('pipboyPlayerData'));
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  /** Persist a playerData object back to localStorage. */
  function savePlayerData(pd) {
    try {
      localStorage.setItem(lsKey('pipboyPlayerData'), JSON.stringify(pd));
    } catch (e) {}
  }

  // ── Core API ──────────────────────────────────────────────────────────────

  /**
   * Apply a chosen base race to a playerData object.
   * Sets baseRace, specialPointAllocation, raceSelected, and resets
   * specialAllocationActive so the SPECIAL panel refreshes correctly.
   *
   * @param {object} pd         - playerData (mutated in-place)
   * @param {object} raceEntry  - entry from window.baseRaces
   */
  function applyBaseRace(pd, raceEntry) {
    pd.baseRace               = raceEntry;
    pd.raceSelected           = true;
    pd.specialAllocationActive = true; // open SPECIAL allocation upon race pick
    pd.specialPointAllocation  = raceEntry.specialPointAllocation || 25;

    // Enforce any hard caps from the race onto existing SPECIAL values.
    // This matters when race is changed after stats were already entered.
    _enforceSpecialCaps(pd);
  }

  /**
   * Apply a chosen gene pool entry to a playerData object.
   * Sets genePool and isPureblood = false.
   *
   * @param {object} pd        - playerData (mutated in-place)
   * @param {object} geneEntry - entry from window.genePool
   */
  function applyGenePool(pd, geneEntry) {
    pd.genePool    = geneEntry;
    pd.isPureblood = false;
  }

  /**
   * Mark the player as a pureblood (no gene pool chosen).
   * Clears genePool and sets isPureblood = true.
   *
   * Pureblood bonuses (extra perk point every 5 levels, extra short-rest hit
   * die) are applied in the level-up and rest logic respectively; this flag
   * is the single source of truth that those systems should check.
   *
   * @param {object} pd - playerData (mutated in-place)
   */
  function applyPureblood(pd) {
    pd.genePool    = null;
    pd.isPureblood = true;
  }

  /**
   * Clamp every SPECIAL value to the caps declared by the chosen base race.
   * Values that violate a min are raised; values that violate a max are lowered.
   *
   * @param {object} pd - playerData (mutated in-place)
   */
  function _enforceSpecialCaps(pd) {
    if (!pd.baseRace || !pd.baseRace.specialCaps) return;
    var caps = pd.baseRace.specialCaps;
    var sp   = pd.special || {};

    var attrs = ['strength', 'perception', 'endurance', 'charisma',
                 'intelligence', 'agility', 'luck'];

    attrs.forEach(function (key) {
      var minKey = key + 'Min';
      var maxKey = key + 'Max';
      var val    = typeof sp[key] === 'number' ? sp[key] : 0;

      if (caps[minKey] !== null && caps[minKey] !== undefined) {
        val = Math.max(val, caps[minKey]);
      }
      if (caps[maxKey] !== null && caps[maxKey] !== undefined) {
        val = Math.min(val, caps[maxKey]);
      }
      sp[key] = val;
    });

    pd.special = sp;
  }

  /**
   * Return the number of SPECIAL points still available to spend.
   * = specialPointAllocation − sum of all current SPECIAL values
   * (values of 0 mean "unset" and count as 0 spent).
   *
   * @param {object} pd - playerData
   * @returns {number}
   */
  function getRemainingSpecialPoints(pd) {
    var pool = pd.specialPointAllocation || 0;
    var sp   = pd.special || {};
    var spent = 0;
    ['strength', 'perception', 'endurance', 'charisma',
     'intelligence', 'agility', 'luck'].forEach(function (k) {
      spent += (typeof sp[k] === 'number' ? sp[k] : 0);
    });
    return pool - spent;
  }

  /**
   * Check whether a player has completed character creation.
   * Required: race selected.  Gene pool is optional (pureblood if absent).
   *
   * @param {object} pd - playerData
   * @returns {boolean}
   */
  function isCreationComplete(pd) {
    return !!pd.raceSelected;
  }

  /**
   * Full initialisation helper used by character-creation.html on first load.
   * Loads localStorage, ensures creation-related fields exist (backward compat),
   * and returns the playerData object ready for use.
   *
   * @returns {object} playerData
   */
  function initPlayerData() {
    var pd = loadPlayerData();
    if (!pd) {
      pd = _defaultCreationData();
    }

    // Backward-compat migration
    if (pd.raceSelected === undefined)           pd.raceSelected           = false;
    if (pd.specialAllocationActive === undefined) pd.specialAllocationActive = false;
    if (pd.baseRace === undefined)               pd.baseRace               = null;
    if (pd.genePool === undefined)               pd.genePool               = null;
    if (pd.isPureblood === undefined)            pd.isPureblood            = null; // null = not yet decided
    if (pd.specialPointAllocation === undefined) pd.specialPointAllocation = 0;
    if (!pd.special || typeof pd.special !== 'object') {
      pd.special = { strength:0, perception:0, endurance:0, charisma:0,
                     intelligence:0, agility:0, luck:0 };
    }

    return pd;
  }

  /** Minimal default playerData shape for brand-new characters. */
  function _defaultCreationData() {
    return {
      xp: 0, level: 1,
      hp: 0, maxHp: 0,
      actionPoints: 10, maxActionPoints: 20,
      radiation: 0, tempHealth: 0,
      ac: 10, critChance: 5,
      special: { strength:0, perception:0, endurance:0, charisma:0,
                 intelligence:0, agility:0, luck:0 },
      skills: {
        Barter:0, 'Small Guns':0, 'Big Guns':0, 'Melee Weapons':0,
        'Energy Weapons':0, Explosives:0, Lockpick:0, Medicine:0,
        Science:0, Repair:0, Sneak:0, Speech:0, Unarmed:0, Survival:0
      },
      tagSkills: [],
      skillPointsAvailable: 0,
      skillsLocked: false,
      skillsAllocationActive: false,
      skillsLockBaseline: {},
      perks: [],
      selectedPerks: [],
      perkPointsAvailable: 0,
      perkSelectionActive: false,
      debuffs: [],
      boosts: [],
      // Creation-specific fields
      raceSelected: false,
      specialAllocationActive: false,
      baseRace: null,
      genePool: null,
      isPureblood: null,
      specialPointAllocation: 0
    };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  global.CharacterCreation = {
    initPlayerData:           initPlayerData,
    loadPlayerData:           loadPlayerData,
    savePlayerData:           savePlayerData,
    applyBaseRace:            applyBaseRace,
    applyGenePool:            applyGenePool,
    applyPureblood:           applyPureblood,
    getRemainingSpecialPoints: getRemainingSpecialPoints,
    isCreationComplete:       isCreationComplete,
    // Exposed for testing / advanced use
    _enforceSpecialCaps:      _enforceSpecialCaps,
    _defaultCreationData:     _defaultCreationData,
    lsKey:                    lsKey
  };

}(window));
