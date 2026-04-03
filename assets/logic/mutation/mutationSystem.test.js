/**
 * mutationSystem.test.js
 * Comprehensive tests for the Dynamic Ultra/Mutation Enemy System.
 *
 * Covers:
 *  - rollForMutation: boss immunity, hasMutated immunity, chance gating
 *  - sampleMutationEffects: distinct sampling, count clamping, pool coverage
 *  - applyMutationToEnemy: HP revival, stat changes per effect type, hasMutated flag
 *  - buildMutationAnnouncement: string format for buff / debuff / unique effects
 *  - Edge cases: null / undefined inputs
 */

const {
  MUTATION_EFFECT_POOL,
  mutationConfig,
  rollForMutation,
  sampleMutationEffects,
  applyMutationToEnemy,
  buildMutationAnnouncement
} = require('./mutationSystem');

// ── Helper factories ──────────────────────────────────────────────────────────

function makeEnemy(overrides) {
  return Object.assign(
    { id: 'e1', name: 'Raider', hp: 50, maxHp: 50, currentHp: 50, damage: 10, ac: 12, initiative: 4 },
    overrides || {}
  );
}

// ── rollForMutation ───────────────────────────────────────────────────────────

describe('rollForMutation', () => {
  test('returns false for null/undefined enemy', () => {
    expect(rollForMutation(null)).toBe(false);
    expect(rollForMutation(undefined)).toBe(false);
  });

  test('returns false for boss enemies regardless of RNG', () => {
    const boss = makeEnemy({ isBoss: true });
    // Test multiple times to cover any lucky RNG
    for (let i = 0; i < 50; i++) {
      expect(rollForMutation(boss)).toBe(false);
    }
  });

  test('returns false for already-mutated enemies', () => {
    const mutated = makeEnemy({ hasMutated: true });
    for (let i = 0; i < 50; i++) {
      expect(rollForMutation(mutated)).toBe(false);
    }
  });

  test('always returns true when chance is 1', () => {
    const orig = mutationConfig.chance;
    mutationConfig.chance = 1;
    const enemy = makeEnemy();
    expect(rollForMutation(enemy)).toBe(true);
    mutationConfig.chance = orig;
  });

  test('always returns false when chance is 0', () => {
    const orig = mutationConfig.chance;
    mutationConfig.chance = 0;
    const enemy = makeEnemy();
    expect(rollForMutation(enemy)).toBe(false);
    mutationConfig.chance = orig;
  });

  test('returns a boolean', () => {
    const enemy = makeEnemy();
    const result = rollForMutation(enemy);
    expect(typeof result).toBe('boolean');
  });
});

// ── sampleMutationEffects ─────────────────────────────────────────────────────

describe('sampleMutationEffects', () => {
  test('returns the configured number of effects by default', () => {
    const effects = sampleMutationEffects();
    expect(effects.length).toBe(mutationConfig.effectsOffered);
  });

  test('returns the requested count when specified', () => {
    const effects = sampleMutationEffects(5);
    expect(effects.length).toBe(5);
  });

  test('returns all pool effects (shuffled) when n >= pool size', () => {
    const effects = sampleMutationEffects(999);
    expect(effects.length).toBe(MUTATION_EFFECT_POOL.length);
  });

  test('all returned effects are distinct (no duplicates)', () => {
    const effects = sampleMutationEffects(mutationConfig.effectsOffered);
    const ids = effects.map(e => e.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });

  test('each returned effect is a valid pool member', () => {
    const poolIds = MUTATION_EFFECT_POOL.map(e => e.id);
    const effects = sampleMutationEffects(mutationConfig.effectsOffered);
    effects.forEach(effect => {
      expect(poolIds).toContain(effect.id);
    });
  });

  test('pool contains both buff and debuff types', () => {
    const types = MUTATION_EFFECT_POOL.map(e => e.type);
    expect(types).toContain('buff');
    expect(types).toContain('debuff');
    expect(types).toContain('unique');
  });
});

// ── applyMutationToEnemy ──────────────────────────────────────────────────────

describe('applyMutationToEnemy', () => {
  test('returns enemy unchanged when effect is null', () => {
    const enemy = makeEnemy();
    const result = applyMutationToEnemy(enemy, null);
    expect(result).toBe(enemy); // same reference, not crashed
  });

  test('returns null when enemy is null', () => {
    const result = applyMutationToEnemy(null, MUTATION_EFFECT_POOL[0]);
    expect(result).toBeNull();
  });

  test('restores currentHp to ceil(maxHp / 2)', () => {
    const enemy = makeEnemy({ currentHp: 0, maxHp: 80 });
    const effectNoHpBonus = MUTATION_EFFECT_POOL.find(e => e.stat !== 'hpBonus');
    applyMutationToEnemy(enemy, effectNoHpBonus);
    expect(enemy.currentHp).toBe(Math.ceil(80 / 2)); // 40
  });

  test('rounds up revival HP for odd maxHp', () => {
    const enemy = makeEnemy({ currentHp: 0, maxHp: 51 });
    const effect = MUTATION_EFFECT_POOL.find(e => e.stat !== 'hpBonus');
    applyMutationToEnemy(enemy, effect);
    expect(enemy.currentHp).toBe(Math.ceil(51 / 2)); // 26
  });

  test('sets hasMutated = true', () => {
    const enemy = makeEnemy({ currentHp: 0 });
    const effect = MUTATION_EFFECT_POOL[0];
    applyMutationToEnemy(enemy, effect);
    expect(enemy.hasMutated).toBe(true);
  });

  test('stores mutationEffect on enemy', () => {
    const enemy = makeEnemy({ currentHp: 0 });
    const effect = MUTATION_EFFECT_POOL[0];
    applyMutationToEnemy(enemy, effect);
    expect(enemy.mutationEffect).toBe(effect);
  });

  test('ferocity effect multiplies damage', () => {
    const enemy = makeEnemy({ currentHp: 0, damage: 10 });
    const ferocity = MUTATION_EFFECT_POOL.find(e => e.id === 'ferocity');
    applyMutationToEnemy(enemy, ferocity);
    expect(enemy.damage).toBe(Math.floor(10 * 1.5)); // 15
  });

  test('thick_hide effect increases AC', () => {
    const enemy = makeEnemy({ currentHp: 0, ac: 12 });
    const thickHide = MUTATION_EFFECT_POOL.find(e => e.id === 'thick_hide');
    applyMutationToEnemy(enemy, thickHide);
    expect(enemy.ac).toBe(15);
  });

  test('clumsy effect decreases AC (does not go below 0)', () => {
    const enemy = makeEnemy({ currentHp: 0, ac: 2 });
    const clumsy = MUTATION_EFFECT_POOL.find(e => e.id === 'clumsy');
    applyMutationToEnemy(enemy, clumsy);
    expect(enemy.ac).toBeGreaterThanOrEqual(0);
  });

  test('wasteland_haste increases initiative', () => {
    const enemy = makeEnemy({ currentHp: 0, initiative: 4 });
    const haste = MUTATION_EFFECT_POOL.find(e => e.id === 'wasteland_haste');
    applyMutationToEnemy(enemy, haste);
    expect(enemy.initiative).toBe(9);
  });

  test('hpBonus effect grants extra HP beyond revival', () => {
    const enemy = makeEnemy({ currentHp: 0, maxHp: 100 });
    const hpBonusEffect = MUTATION_EFFECT_POOL.find(e => e.stat === 'hpBonus');
    applyMutationToEnemy(enemy, hpBonusEffect);
    // revive = ceil(100/2) = 50, bonus = ceil(100 * 0.1) = 10, total = 60
    expect(enemy.currentHp).toBe(60);
  });

  test('revived HP cannot exceed maxHp', () => {
    const enemy = makeEnemy({ currentHp: 0, maxHp: 10 });
    const hpBonusEffect = MUTATION_EFFECT_POOL.find(e => e.stat === 'hpBonus');
    if (hpBonusEffect) {
      // Even with bonus, cannot exceed maxHp
      applyMutationToEnemy(enemy, hpBonusEffect);
      expect(enemy.currentHp).toBeLessThanOrEqual(enemy.maxHp);
    }
  });
});

// ── buildMutationAnnouncement ─────────────────────────────────────────────────

describe('buildMutationAnnouncement', () => {
  test('includes enemy name in announcement', () => {
    const effect = MUTATION_EFFECT_POOL.find(e => e.type === 'buff');
    const msg = buildMutationAnnouncement('Deathclaw', effect);
    expect(msg).toContain('Deathclaw');
  });

  test('includes effect name in announcement', () => {
    const effect = MUTATION_EFFECT_POOL.find(e => e.id === 'ferocity');
    const msg = buildMutationAnnouncement('Raider', effect);
    expect(msg).toContain('Ferocity');
  });

  test('includes effect description in announcement', () => {
    const effect = MUTATION_EFFECT_POOL.find(e => e.id === 'ferocity');
    const msg = buildMutationAnnouncement('Raider', effect);
    expect(msg).toContain(effect.description);
  });

  test('buff type uses upward arrow tag', () => {
    const buffEffect = MUTATION_EFFECT_POOL.find(e => e.type === 'buff');
    const msg = buildMutationAnnouncement('Enemy', buffEffect);
    expect(msg).toContain('⬆');
  });

  test('debuff type uses downward arrow tag', () => {
    const debuffEffect = MUTATION_EFFECT_POOL.find(e => e.type === 'debuff');
    const msg = buildMutationAnnouncement('Enemy', debuffEffect);
    expect(msg).toContain('⬇');
  });

  test('unique type uses star tag', () => {
    const uniqueEffect = MUTATION_EFFECT_POOL.find(e => e.type === 'unique');
    const msg = buildMutationAnnouncement('Enemy', uniqueEffect);
    expect(msg).toContain('★');
  });

  test('handles missing enemy name gracefully', () => {
    const effect = MUTATION_EFFECT_POOL[0];
    expect(() => buildMutationAnnouncement(null, effect)).not.toThrow();
    expect(() => buildMutationAnnouncement('', effect)).not.toThrow();
  });

  test('contains the mutation radiation symbol', () => {
    const effect = MUTATION_EFFECT_POOL[0];
    const msg = buildMutationAnnouncement('Ghoul', effect);
    expect(msg).toContain('☢');
  });
});

// ── Pool completeness ─────────────────────────────────────────────────────────

describe('MUTATION_EFFECT_POOL completeness', () => {
  test('pool has at least 10 effects', () => {
    expect(MUTATION_EFFECT_POOL.length).toBeGreaterThanOrEqual(10);
  });

  test('every effect has required fields', () => {
    MUTATION_EFFECT_POOL.forEach(effect => {
      expect(effect).toHaveProperty('id');
      expect(effect).toHaveProperty('name');
      expect(effect).toHaveProperty('type');
      expect(effect).toHaveProperty('description');
      expect(['buff', 'debuff', 'unique']).toContain(effect.type);
    });
  });

  test('effect IDs are all unique', () => {
    const ids = MUTATION_EFFECT_POOL.map(e => e.id);
    const unique = [...new Set(ids)];
    expect(ids.length).toBe(unique.length);
  });
});
