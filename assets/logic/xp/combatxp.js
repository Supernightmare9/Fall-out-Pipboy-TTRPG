// assets/logic/xp/combatxp.js
// Combat XP Tracking System
// Tracks damage dealt, determines kill credit, and distributes XP to players
//
// Depends on:
//   - getEnemyXP(playerLevel, enemyRarity)        from enemyxp.js
//   - getIntXPMultiplier(intStat)                  from fallout_stat_bonuses.js
//
// Ultra enemies (enemy.isUltra === true) and boss enemies (enemy.isBoss === true)
// skip the XP distribution entirely — no XP is awarded when they are defeated.

// Active combat session tracker
const activeCombatSessions = {};

// Function to initialize a new combat session
function initializeCombatSession(combatId, enemies, players) {
  // combatId = unique identifier for this combat
  // enemies = [ { id: 'enemy1', rarity: 'uncommon', hp: 100 }, ... ]
  // players = [ { id: 'player1', level: 25 }, { id: 'player2', level: 24 }, ... ]
  
  activeCombatSessions[combatId] = {
    combatId: combatId,
    enemies: enemies,
    players: players,
    damageTracking: {}, // { enemyId: { playerId: damageDealt, ... }, ... }
    killCredits: {}, // { enemyId: playerId }
    xpAwarded: {} // { playerId: totalXP }
  };
  
  // Initialize damage tracking for each enemy
  for (let enemy of enemies) {
    activeCombatSessions[combatId].damageTracking[enemy.id] = {};
    for (let player of players) {
      activeCombatSessions[combatId].damageTracking[enemy.id][player.id] = 0;
    }
    activeCombatSessions[combatId].xpAwarded[enemy.id] = {};
  }
  
  return activeCombatSessions[combatId];
}

// Function to track damage dealt by a player to an enemy
function recordDamage(combatId, playerId, enemyId, damageAmount) {
  if (!activeCombatSessions[combatId]) {
    console.error(`Combat session ${combatId} not found`);
    return false;
  }
  
  const session = activeCombatSessions[combatId];
  
  if (!session.damageTracking[enemyId]) {
    console.error(`Enemy ${enemyId} not found in combat session`);
    return false;
  }
  
  // Add damage to player's total against this enemy (minimum 1 damage counts)
  if (damageAmount >= 1) {
    session.damageTracking[enemyId][playerId] += damageAmount;
  }
  
  return true;
}

// Function to award XP when an enemy is killed
//
// playerLevels       = { playerId: playerLevel, ... }
// playerIntelligences = { playerId: intStat (1-10), ... }  (optional; defaults to 5)
//
// Returns null if:
//   - Session or enemy not found
//   - No damage contributors exist
//   - Enemy is flagged as isUltra or isBoss (XP skipped — future mutation logic hooks here)
function awardEnemyKillXP(combatId, enemyId, killingPlayerId, playerLevels, playerIntelligences) {
  if (!activeCombatSessions[combatId]) {
    console.error(`Combat session ${combatId} not found`);
    return null;
  }

  const session = activeCombatSessions[combatId];
  const enemy = session.enemies.find(e => e.id === enemyId);

  if (!enemy) {
    console.error(`Enemy ${enemyId} not found`);
    return null;
  }

  // Ultra enemies and bosses do not award XP — future mutation-event logic hooks here
  if (enemy.isUltra || enemy.isBoss) {
    console.info(`Enemy ${enemyId} is ${enemy.isUltra ? 'Ultra' : 'Boss'} — XP skipped`);
    return null;
  }

  // Get all players who dealt at least 1 point of damage to this enemy
  const damageContributors = Object.keys(session.damageTracking[enemyId]).filter(
    playerId => session.damageTracking[enemyId][playerId] > 0
  );

  if (damageContributors.length === 0) {
    console.warn(`No damage contributors found for enemy ${enemyId}`);
    return null;
  }

  // Use the killer's level as the benchmark for the enemy XP tier
  const killerLevel = (playerLevels && playerLevels[killingPlayerId]) || 1;
  const enemyRarity = enemy.rarity || enemy.difficulty || 'common';
  const baseEnemyXP = typeof getEnemyXP === 'function'
    ? getEnemyXP(killerLevel, enemyRarity)
    : 0;

  // ── Split XP evenly; excess (remainder) goes to the killing-blow player ──
  const perPlayerBase = Math.floor(baseEnemyXP / damageContributors.length);
  const excess = baseEnemyXP % damageContributors.length;

  const xpDistribution = {};

  for (const playerId of damageContributors) {
    // Killing-blow player receives the remainder on top of their equal share
    const rawShare = perPlayerBase + (playerId === killingPlayerId ? excess : 0);

    // Apply Intelligence XP multiplier (from fallout_stat_bonuses.js)
    const intStat = (playerIntelligences?.[playerId] != null)
      ? playerIntelligences[playerId]
      : 5;
    const intBonus = typeof getIntXPMultiplier === 'function'
      ? getIntXPMultiplier(intStat)
      : 1.15; // fallback: INT 5 default multiplier

    xpDistribution[playerId] = Math.floor(rawShare * intBonus);
  }

  // Record kill credit
  session.killCredits[enemyId] = killingPlayerId;

  // Store XP awarded per enemy (indexed by enemyId)
  session.xpAwarded[enemyId] = xpDistribution;

  return {
    enemyId: enemyId,
    enemy: enemy,
    baseXP: baseEnemyXP,
    contributors: damageContributors,
    killingPlayerId: killingPlayerId,
    xpDistribution: xpDistribution
  };
}

// Function to get XP distribution for a specific enemy
function getEnemyXPDistribution(combatId, enemyId) {
  if (!activeCombatSessions[combatId]) {
    return null;
  }
  
  return activeCombatSessions[combatId].xpAwarded[enemyId] || null;
}

// Function to get all XP earned in a combat session
function getCombatSessionXPSummary(combatId) {
  if (!activeCombatSessions[combatId]) {
    return null;
  }
  
  const session = activeCombatSessions[combatId];
  const totalXPByPlayer = {};
  
  // Aggregate XP from all enemy kills
  for (let enemyId in session.xpAwarded) {
    const xpDistribution = session.xpAwarded[enemyId];
    for (let playerId in xpDistribution) {
      if (!totalXPByPlayer[playerId]) {
        totalXPByPlayer[playerId] = 0;
      }
      totalXPByPlayer[playerId] += xpDistribution[playerId];
    }
  }
  
  return {
    combatId: combatId,
    totalXPByPlayer: totalXPByPlayer,
    killCredits: session.killCredits,
    damageTracking: session.damageTracking
  };
}

// Function to end combat session and clean up
function endCombatSession(combatId) {
  if (!activeCombatSessions[combatId]) {
    return false;
  }
  
  const summary = getCombatSessionXPSummary(combatId);
  delete activeCombatSessions[combatId];
  return summary;
}

// Function to get damage dealt by a player to an enemy
function getDamageDealt(combatId, playerId, enemyId) {
  if (!activeCombatSessions[combatId]) {
    return 0;
  }
  
  return activeCombatSessions[combatId].damageTracking[enemyId][playerId] || 0;
}

// Function to get all damage contributors to an enemy
function getDamageContributors(combatId, enemyId) {
  if (!activeCombatSessions[combatId]) {
    return [];
  }
  
  const damageData = activeCombatSessions[combatId].damageTracking[enemyId];
  return Object.keys(damageData).filter(playerId => damageData[playerId] > 0);
}

// Example usage:
// Initialize combat
// const combat = initializeCombatSession('combat_001',
//   [ { id: 'enemy1', rarity: 'uncommon', hp: 100 }, { id: 'enemy2', rarity: 'rare', hp: 150 } ],
//   [ { id: 'player1', level: 25 }, { id: 'player2', level: 24 }, { id: 'player3', level: 25 } ]
// );

// Track damage during combat
// recordDamage('combat_001', 'player1', 'enemy1', 25);
// recordDamage('combat_001', 'player2', 'enemy1', 20);
// recordDamage('combat_001', 'player3', 'enemy2', 50);

// Award XP when enemy dies (includes INT bonus; excess goes to killer)
// const xpReward = awardEnemyKillXP(
//   'combat_001', 'enemy1', 'player1',
//   { player1: 40, player2: 40, player3: 40 },   // player levels
//   { player1: 7,  player2: 5,  player3: 8  }    // player INT stats
// );
// Result: { enemyId: 'enemy1', baseXP: 520, contributors: ['player1','player2'],
//           killingPlayerId: 'player1', xpDistribution: { player1: 315, player2: 299 } }
//   (520/2=260 each; excess 0; player1 INT 7 → ×1.21=314.6→314; player2 INT 5 → ×1.15=299)

// Ultra / boss enemies are skipped (returns null, no XP awarded):
// const ultraReward = awardEnemyKillXP('combat_001', 'ultraEnemy', 'player1', levels, ints);
// → null  (because enemy.isUltra === true)

// Get summary
// const summary = endCombatSession('combat_001');
// Result: { combatId: 'combat_001', totalXPByPlayer: { player1: ..., player2: ..., player3: ... }, ... }

// ── Node.js / CommonJS export (for automated tests) ──────────────────────────
// In browser contexts, `module` is undefined and this block is skipped.
// In Node.js (e.g. Jest), the functions and the shared session map are exported
// so tests can require() this file directly.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    activeCombatSessions,
    initializeCombatSession,
    recordDamage,
    awardEnemyKillXP,
    getEnemyXPDistribution,
    getCombatSessionXPSummary,
    endCombatSession,
    getDamageDealt,
    getDamageContributors
  };
}
