/**
 * combatxp.test.js
 * Comprehensive tests for the Combat XP distribution system.
 *
 * Covers:
 *  - Damage tracking (recordDamage)
 *  - Solo kill — full XP to single contributor
 *  - Shared kill — even split; excess to killing-blow player
 *  - INT bonus applied per player
 *  - Ultra enemy skip (no XP awarded)
 *  - Boss enemy skip (no XP awarded)
 *  - No damage contributors → no XP
 *  - Missing session / enemy guards
 *  - getCombatSessionXPSummary aggregation
 *  - endCombatSession cleanup
 *  - getDamageDealt / getDamageContributors helpers
 */

// ─── Shim dependencies that are normally loaded via HTML <script> tags ────────

// Stub getEnemyXP: always return a predictable value based on rarity
global.getEnemyXP = function (playerLevel, enemyRarity) {
  const table = {
    common: 100, uncommon: 200, rare: 400, epic: 800, legendary: 1600
  };
  // Level scaling: multiply by Math.floor(playerLevel / 10) + 1  (level 1-9 → ×1, 10-19 → ×2 …)
  const scale = Math.floor((playerLevel || 1) / 10) + 1;
  return (table[(enemyRarity || 'common').toLowerCase()] || 100) * scale;
};

// Stub getIntXPMultiplier: mirrors fallout_stat_bonuses.js exactly (no || default so 0 clamps to 1)
global.getIntXPMultiplier = function (intStat) {
  const bonuses = { 1:1.03,2:1.06,3:1.09,4:1.12,5:1.15,6:1.18,7:1.21,8:1.24,9:1.27,10:1.30 };
  const clamped = Math.max(1, Math.min(10, Number(intStat)));
  return bonuses[clamped];
};

// ─── Load the module under test ───────────────────────────────────────────────
const {
  activeCombatSessions,
  initializeCombatSession,
  recordDamage,
  awardEnemyKillXP,
  getEnemyXPDistribution,
  getCombatSessionXPSummary,
  endCombatSession,
  getDamageDealt,
  getDamageContributors
} = require('./combatxp');

// ─── Helper ───────────────────────────────────────────────────────────────────
let _sessionCounter = 0;

function makeEnemy(overrides) {
  return Object.assign(
    { id: 'e1', name: 'Ghoul', rarity: 'common', difficulty: 'common', hp: 50, maxHp: 50, isUltra: false, isBoss: false },
    overrides
  );
}

function makePlayers(...ids) {
  return ids.map(id => ({ id }));
}

function setupSession(enemies, players) {
  const id = 'combat_' + (++_sessionCounter);
  initializeCombatSession(id, enemies, players);
  return id;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('initializeCombatSession', () => {
  test('creates session with empty damage tracking', () => {
    const id = setupSession([makeEnemy()], makePlayers('p1', 'p2'));
    const session = activeCombatSessions[id];
    expect(session).toBeDefined();
    expect(session.damageTracking['e1']['p1']).toBe(0);
    expect(session.damageTracking['e1']['p2']).toBe(0);
  });
});

describe('recordDamage', () => {
  test('accumulates damage for a player', () => {
    const id = setupSession([makeEnemy()], makePlayers('p1'));
    recordDamage(id, 'p1', 'e1', 30);
    recordDamage(id, 'p1', 'e1', 20);
    expect(getDamageDealt(id, 'p1', 'e1')).toBe(50);
  });

  test('ignores zero and negative damage', () => {
    const id = setupSession([makeEnemy()], makePlayers('p1'));
    recordDamage(id, 'p1', 'e1', 0);
    recordDamage(id, 'p1', 'e1', -10);
    expect(getDamageDealt(id, 'p1', 'e1')).toBe(0);
  });

  test('tracks multiple players independently', () => {
    const id = setupSession([makeEnemy()], makePlayers('p1', 'p2'));
    recordDamage(id, 'p1', 'e1', 15);
    recordDamage(id, 'p2', 'e1', 35);
    expect(getDamageDealt(id, 'p1', 'e1')).toBe(15);
    expect(getDamageDealt(id, 'p2', 'e1')).toBe(35);
  });

  test('returns false for unknown session', () => {
    expect(recordDamage('NOPE', 'p1', 'e1', 5)).toBe(false);
  });
});

describe('getDamageContributors', () => {
  test('returns only players who dealt > 0 damage', () => {
    const id = setupSession([makeEnemy()], makePlayers('p1', 'p2', 'p3'));
    recordDamage(id, 'p1', 'e1', 10);
    recordDamage(id, 'p3', 'e1', 5);
    const contributors = getDamageContributors(id, 'e1');
    expect(contributors).toContain('p1');
    expect(contributors).toContain('p3');
    expect(contributors).not.toContain('p2');
  });

  test('returns empty array for unknown session', () => {
    expect(getDamageContributors('NOPE', 'e1')).toEqual([]);
  });
});

describe('awardEnemyKillXP — solo kill', () => {
  test('full XP (with INT bonus) goes to the single contributor', () => {
    const id = setupSession([makeEnemy()], makePlayers('p1'));
    recordDamage(id, 'p1', 'e1', 50);

    const result = awardEnemyKillXP(id, 'e1', 'p1',
      { p1: 1 },  // level 1
      { p1: 5 }   // INT 5 → ×1.15
    );

    expect(result).not.toBeNull();
    expect(result.contributors).toEqual(['p1']);
    expect(result.baseXP).toBe(100);            // getEnemyXP(1, 'common') = 100
    // solo: 100 * 1.15 = 114.999… → floor = 114 (JS floating-point)
    expect(result.xpDistribution['p1']).toBe(Math.floor(100 * 1.15));
  });
});

describe('awardEnemyKillXP — shared kill, even split', () => {
  test('splits XP evenly; each contributor gets INT bonus applied', () => {
    const enemy = makeEnemy({ rarity: 'uncommon' });
    const id = setupSession([enemy], makePlayers('p1', 'p2'));
    recordDamage(id, 'p1', 'e1', 40);
    recordDamage(id, 'p2', 'e1', 10);

    // Level 1 common: getEnemyXP(1,'uncommon') = 200
    const result = awardEnemyKillXP(id, 'e1', 'p1',
      { p1: 1, p2: 1 },
      { p1: 7, p2: 5 }   // p1 INT 7 → ×1.21, p2 INT 5 → ×1.15
    );

    // 200 / 2 = 100 each; 200 % 2 = 0 excess
    expect(result.baseXP).toBe(200);
    expect(result.xpDistribution['p1']).toBe(Math.floor(100 * 1.21)); // 121
    expect(result.xpDistribution['p2']).toBe(Math.floor(100 * 1.15)); // 115
  });
});

describe('awardEnemyKillXP — excess XP to killing blow', () => {
  test('remainder of integer division goes to the killer', () => {
    // Make enemy give 101 XP so 101/2 = 50 with remainder 1
    // We'll use level 1, rarity that maps to 101 — not directly possible,
    // so we override getEnemyXP for this test only.
    const origGetEnemyXP = global.getEnemyXP;
    global.getEnemyXP = () => 101;

    const id = setupSession([makeEnemy()], makePlayers('p1', 'p2'));
    recordDamage(id, 'p1', 'e1', 30);
    recordDamage(id, 'p2', 'e1', 71); // p2 is the killer

    const result = awardEnemyKillXP(id, 'e1', 'p2',
      { p1: 1, p2: 1 },
      { p1: 5, p2: 5 }   // INT 5 → ×1.15 for both
    );

    // 101 / 2 = 50 remainder 1
    // p1 share = 50; p2 share = 50 + 1 = 51 (killing blow)
    // After INT ×1.15: p1 = floor(57.5) = 57, p2 = floor(58.65) = 58
    expect(result.xpDistribution['p1']).toBe(Math.floor(50 * 1.15)); // 57
    expect(result.xpDistribution['p2']).toBe(Math.floor(51 * 1.15)); // 58

    global.getEnemyXP = origGetEnemyXP;
  });
});

describe('awardEnemyKillXP — three players, uneven split', () => {
  test('200 XP among 3 players: floor(200/3)=66 each, excess=2 → killer gets 68', () => {
    const origGetEnemyXP = global.getEnemyXP;
    global.getEnemyXP = () => 200;

    const id = setupSession([makeEnemy()], makePlayers('p1', 'p2', 'p3'));
    recordDamage(id, 'p1', 'e1', 10);
    recordDamage(id, 'p2', 'e1', 10);
    recordDamage(id, 'p3', 'e1', 180); // killer

    const result = awardEnemyKillXP(id, 'e1', 'p3',
      { p1: 1, p2: 1, p3: 1 },
      { p1: 5, p2: 5, p3: 5 }  // INT 5 → ×1.15
    );

    // 200 / 3 = 66 each; 200 % 3 = 2 excess → p3 gets 66+2=68
    expect(result.xpDistribution['p1']).toBe(Math.floor(66 * 1.15)); // 75
    expect(result.xpDistribution['p2']).toBe(Math.floor(66 * 1.15)); // 75
    expect(result.xpDistribution['p3']).toBe(Math.floor(68 * 1.15)); // 78

    global.getEnemyXP = origGetEnemyXP;
  });
});

describe('awardEnemyKillXP — ultra / boss skip', () => {
  test('ultra enemy returns null (no XP)', () => {
    const enemy = makeEnemy({ isUltra: true });
    const id = setupSession([enemy], makePlayers('p1'));
    recordDamage(id, 'p1', 'e1', 50);
    const result = awardEnemyKillXP(id, 'e1', 'p1', { p1: 1 }, { p1: 5 });
    expect(result).toBeNull();
  });

  test('boss enemy returns null (no XP)', () => {
    const enemy = makeEnemy({ isBoss: true });
    const id = setupSession([enemy], makePlayers('p1'));
    recordDamage(id, 'p1', 'e1', 50);
    const result = awardEnemyKillXP(id, 'e1', 'p1', { p1: 1 }, { p1: 5 });
    expect(result).toBeNull();
  });
});

describe('awardEnemyKillXP — guards', () => {
  test('returns null for unknown session', () => {
    const result = awardEnemyKillXP('NOPE', 'e1', 'p1', {}, {});
    expect(result).toBeNull();
  });

  test('returns null when no damage contributors', () => {
    const id = setupSession([makeEnemy()], makePlayers('p1'));
    // No recordDamage call
    const result = awardEnemyKillXP(id, 'e1', 'p1', { p1: 1 }, { p1: 5 });
    expect(result).toBeNull();
  });

  test('returns null for unknown enemy', () => {
    const id = setupSession([makeEnemy()], makePlayers('p1'));
    const result = awardEnemyKillXP(id, 'NO_SUCH_ENEMY', 'p1', { p1: 1 }, { p1: 5 });
    expect(result).toBeNull();
  });
});

describe('awardEnemyKillXP — INT bonus edge cases', () => {
  test('clamps INT below 1 to 1', () => {
    const origGetEnemyXP = global.getEnemyXP;
    global.getEnemyXP = () => 100;
    const id = setupSession([makeEnemy()], makePlayers('p1'));
    recordDamage(id, 'p1', 'e1', 50);
    const result = awardEnemyKillXP(id, 'e1', 'p1', { p1: 1 }, { p1: 0 }); // 0 → clamp to 1 → 1.03
    expect(result.xpDistribution['p1']).toBe(Math.floor(100 * 1.03));
    global.getEnemyXP = origGetEnemyXP;
  });

  test('clamps INT above 10 to 10', () => {
    const origGetEnemyXP = global.getEnemyXP;
    global.getEnemyXP = () => 100;
    const id = setupSession([makeEnemy()], makePlayers('p1'));
    recordDamage(id, 'p1', 'e1', 50);
    const result = awardEnemyKillXP(id, 'e1', 'p1', { p1: 1 }, { p1: 15 }); // 15 → clamp to 10 → 1.30
    expect(result.xpDistribution['p1']).toBe(Math.floor(100 * 1.30));
    global.getEnemyXP = origGetEnemyXP;
  });

  test('defaults missing INT to 5 (×1.15)', () => {
    const origGetEnemyXP = global.getEnemyXP;
    global.getEnemyXP = () => 100;
    const id = setupSession([makeEnemy()], makePlayers('p1'));
    recordDamage(id, 'p1', 'e1', 50);
    // Pass undefined for playerIntelligences
    const result = awardEnemyKillXP(id, 'e1', 'p1', { p1: 1 }, undefined);
    expect(result.xpDistribution['p1']).toBe(Math.floor(100 * 1.15));
    global.getEnemyXP = origGetEnemyXP;
  });
});

describe('getCombatSessionXPSummary', () => {
  test('aggregates XP from multiple enemies', () => {
    const e1 = makeEnemy({ id: 'ea' });
    const e2 = makeEnemy({ id: 'eb', rarity: 'uncommon' });
    const id = setupSession([e1, e2], makePlayers('p1', 'p2'));

    recordDamage(id, 'p1', 'ea', 50);
    recordDamage(id, 'p2', 'ea', 50);
    awardEnemyKillXP(id, 'ea', 'p1', { p1: 1, p2: 1 }, { p1: 5, p2: 5 });

    recordDamage(id, 'p2', 'eb', 200);
    awardEnemyKillXP(id, 'eb', 'p2', { p1: 1, p2: 1 }, { p1: 5, p2: 5 });

    const summary = getCombatSessionXPSummary(id);
    expect(summary.combatId).toBe(id);
    expect(typeof summary.totalXPByPlayer['p1']).toBe('number');
    expect(typeof summary.totalXPByPlayer['p2']).toBe('number');
    // p2 dealt to both enemies so should have more total XP
    expect(summary.totalXPByPlayer['p2']).toBeGreaterThan(summary.totalXPByPlayer['p1']);
  });

  test('returns null for unknown session', () => {
    expect(getCombatSessionXPSummary('NOPE')).toBeNull();
  });
});

describe('endCombatSession', () => {
  test('returns summary and removes session', () => {
    const id = setupSession([makeEnemy()], makePlayers('p1'));
    recordDamage(id, 'p1', 'e1', 50);
    awardEnemyKillXP(id, 'e1', 'p1', { p1: 1 }, { p1: 5 });

    const summary = endCombatSession(id);
    expect(summary).not.toBe(false);
    expect(summary.combatId).toBe(id);
    expect(activeCombatSessions[id]).toBeUndefined();
  });

  test('returns false for unknown session', () => {
    expect(endCombatSession('NOPE')).toBe(false);
  });
});

describe('awardEnemyKillXP — rarity falls back to difficulty field', () => {
  test('uses difficulty when rarity is absent', () => {
    const origGetEnemyXP = global.getEnemyXP;
    let capturedRarity;
    global.getEnemyXP = function (level, rarity) { capturedRarity = rarity; return 100; };

    const enemy = { id: 'e1', name: 'Mutant', difficulty: 'rare', hp: 100, maxHp: 100 };
    const id = setupSession([enemy], makePlayers('p1'));
    recordDamage(id, 'p1', 'e1', 100);
    awardEnemyKillXP(id, 'e1', 'p1', { p1: 1 }, { p1: 5 });

    expect(capturedRarity).toBe('rare');
    global.getEnemyXP = origGetEnemyXP;
  });
});
