// assets/logic/mutation/mutationSystem.js
// Dynamic Ultra/Mutation Enemy System
//
// When a non-boss enemy is reduced to 0 HP, there is a configurable chance
// (default 15%) for them to mutate instead of dying:
//   - The Overseer is shown 3 randomly sampled mutation effects to pick from.
//   - The chosen effect is applied immediately; the enemy revives with half
//     their max HP (rounded up) and is marked as hasMutated.
//   - The mutation event is broadcast to all players.
//   - No XP is distributed during mutation — XP comes on true defeat.
//   - Each enemy can mutate at most ONCE per combat encounter.
//   - Bosses (isBoss === true) are immune to mutation.

// ── Configuration ─────────────────────────────────────────────────────────────
var mutationConfig = {
  chance: 0.15,         // 15% roll chance per non-boss enemy defeat
  effectsOffered: 3     // number of random effects presented to Overseer
};

// ── Effect Pool ────────────────────────────────────────────────────────────────
// Each effect has: id, name, type ('buff'|'debuff'|'unique'), description, and
// any stat fields relevant to the Overseer when describing the change in combat.
var MUTATION_EFFECT_POOL = [
  // ── BUFFS ──────────────────────────────────────────────────────────────────
  {
    id: 'ferocity',
    name: 'Ferocity',
    type: 'buff',
    description: 'Mutated muscles snap with explosive force. Damage increased by 50%.',
    stat: 'damage',
    multiplier: 1.5
  },
  {
    id: 'thick_hide',
    name: 'Thick Hide',
    type: 'buff',
    description: 'Flesh hardens into natural plating. AC increased by 3, harder to wound.',
    stat: 'ac',
    bonus: 3
  },
  {
    id: 'regeneration',
    name: 'Regeneration',
    type: 'buff',
    description: 'Rapid cellular regeneration heals the creature. Regains 10% of max HP at the start of each of its turns.',
    stat: 'regen',
    value: 0.1
  },
  {
    id: 'berserk',
    name: 'Berserk',
    type: 'buff',
    description: 'A primal rage takes hold. Attacks twice per turn but cannot disengage.',
    stat: 'attacks',
    bonus: 1
  },
  {
    id: 'ironskin',
    name: 'Iron Skin',
    type: 'buff',
    description: 'The creature\'s hide becomes partially metallic. Resistant to ballistic damage.',
    stat: 'resistance',
    value: 'ballistic'
  },
  {
    id: 'wasteland_haste',
    name: 'Wasteland Haste',
    type: 'buff',
    description: 'Mutated muscles fire at double speed. Initiative increased by 5.',
    stat: 'initiative',
    bonus: 5
  },
  {
    id: 'adrenaline_surge',
    name: 'Adrenaline Surge',
    type: 'buff',
    description: 'A massive flood of mutated adrenaline. HP restored beyond the revival amount — gains an extra 10% max HP on top.',
    stat: 'hpBonus',
    value: 0.1
  },
  // ── DEBUFFS (rare negative outcomes) ────────────────────────────────────────
  {
    id: 'clumsy',
    name: 'Mutant Clumsiness',
    type: 'debuff',
    description: 'Uncontrolled growth throws off coordination. AC reduced by 3 — much easier to hit.',
    stat: 'ac',
    bonus: -3
  },
  {
    id: 'unstable',
    name: 'Unstable Mutation',
    type: 'debuff',
    description: 'The mutation burns as fast as it heals. Takes 5 damage at the start of each of its turns.',
    stat: 'selfDmg',
    value: 5
  },
  {
    id: 'frenzy',
    name: 'Frenzied Confusion',
    type: 'debuff',
    description: 'The creature lashes out blindly. 25% chance each turn of attacking a random target — including allies.',
    stat: 'confusion',
    value: 0.25
  },
  // ── UNIQUE / SPECIAL ────────────────────────────────────────────────────────
  {
    id: 'rad_aura',
    name: 'Radiation Aura',
    type: 'unique',
    description: 'Emits a continuous radioactive pulse. All adjacent players receive 5 rads per round.',
    stat: 'radAura',
    value: 5
  },
  {
    id: 'rad_burst',
    name: 'Radiation Burst',
    type: 'unique',
    description: 'On its next attack, detonates with a radiation burst — all players take 8 rads.',
    stat: 'radBurst',
    value: 8
  },
  {
    id: 'spore_cloud',
    name: 'Spore Cloud',
    type: 'unique',
    description: 'Releases a toxic spore cloud. All players must pass an Endurance check or become poisoned.',
    stat: 'sporeCloud',
    value: true
  },
  {
    id: 'feral_howl',
    name: 'Feral Howl',
    type: 'unique',
    description: 'A blood-curdling scream fills the air. All players are shaken — -1 to all rolls on their next turn.',
    stat: 'feralHowl',
    value: true
  },
  {
    id: 'leech',
    name: 'Life Leech',
    type: 'unique',
    description: 'Each successful attack drains life force. Heals the creature for 25% of damage dealt.',
    stat: 'lifeLeech',
    value: 0.25
  }
];

// ── Core Functions ─────────────────────────────────────────────────────────────

/**
 * Roll to see if a mutation occurs when an enemy is defeated.
 * Always returns false for bosses (isBoss) or already-mutated enemies (hasMutated).
 *
 * @param {object} enemy - Enemy object with optional isBoss / hasMutated flags.
 * @returns {boolean}
 */
function rollForMutation(enemy) {
  if (!enemy || enemy.isBoss || enemy.hasMutated) return false;
  return Math.random() < mutationConfig.chance;
}

/**
 * Randomly sample n distinct effects from the mutation effect pool.
 * If n is greater than the pool size, returns the full pool shuffled.
 *
 * @param {number} n - Number of effects to sample (defaults to mutationConfig.effectsOffered).
 * @returns {object[]} Array of effect objects.
 */
function sampleMutationEffects(n) {
  var count = (typeof n === 'number' && n > 0) ? n : mutationConfig.effectsOffered;
  // Fisher-Yates shuffle on a copy, then take the first `count`
  var pool = MUTATION_EFFECT_POOL.slice();
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/**
 * Apply a mutation to an enemy object.
 * - Restores currentHp to ceil(maxHp / 2).
 * - Applies the chosen effect's stat changes where applicable.
 * - Marks the enemy as hasMutated = true.
 *
 * The function mutates the enemy object in place and returns it.
 *
 * @param {object} enemy  - Enemy instance (will be mutated in place).
 * @param {object} effect - Effect object from MUTATION_EFFECT_POOL.
 * @returns {object} The updated enemy object.
 */
function applyMutationToEnemy(enemy, effect) {
  if (!enemy || !effect) return enemy;

  // Restore half max HP (rounded up)
  var reviveHp = Math.ceil((enemy.maxHp || 1) / 2);

  // Some effects grant additional HP on top of the revival
  if (effect.stat === 'hpBonus' && typeof effect.value === 'number') {
    reviveHp += Math.ceil((enemy.maxHp || 1) * effect.value);
  }

  enemy.currentHp = Math.min(reviveHp, enemy.maxHp);

  // Apply direct stat modifications
  switch (effect.stat) {
    case 'damage':
      if (typeof effect.multiplier === 'number' && typeof enemy.damage === 'number') {
        enemy.damage = Math.floor(enemy.damage * effect.multiplier);
      }
      break;
    case 'ac':
      if (typeof effect.bonus === 'number' && typeof enemy.ac === 'number') {
        enemy.ac = Math.max(0, enemy.ac + effect.bonus);
      }
      break;
    case 'initiative':
      if (typeof effect.bonus === 'number' && typeof enemy.initiative === 'number') {
        enemy.initiative = enemy.initiative + effect.bonus;
      }
      break;
    // regen, berserk, resistance, selfDmg, confusion, radAura, radBurst,
    // sporeCloud, feralHowl, lifeLeech are mechanical reminders for the Overseer
    // and do not directly alter numeric stats on the object here.
    default:
      break;
  }

  // Mark mutation state
  enemy.hasMutated    = true;
  enemy.mutationEffect = effect;

  return enemy;
}

/**
 * Build the announcement string sent to all players when a mutation occurs.
 *
 * @param {string} enemyName  - Display name of the mutated enemy.
 * @param {object} effect     - Chosen mutation effect object.
 * @returns {string}
 */
function buildMutationAnnouncement(enemyName, effect) {
  var tag = effect.type === 'buff'   ? '⬆'
           : effect.type === 'debuff' ? '⬇'
           : '★';
  return (
    '☢ ' + (enemyName || 'The enemy') + ' MUTATES! ' +
    'Rising with renewed strength — ' + tag + ' ' + effect.name + ': ' +
    effect.description
  );
}

// ── CommonJS export (Jest / Node.js) ─────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MUTATION_EFFECT_POOL,
    mutationConfig,
    rollForMutation,
    sampleMutationEffects,
    applyMutationToEnemy,
    buildMutationAnnouncement
  };
}
