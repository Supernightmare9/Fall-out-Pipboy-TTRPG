// assets/logic/combatxp.js
// Combat XP Tracking System
// Tracks damage dealt, determines kill credit, and distributes XP to players

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
function awardEnemyKillXP(combatId, enemyId, killingPlayerId, playerLevels) {
  // playerLevels = { playerId: playerLevel, ... }
  
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
  
  // Get all players who damaged this enemy
  const damageContributors = Object.keys(session.damageTracking[enemyId]).filter(
    playerId => session.damageTracking[enemyId][playerId] > 0
  );
  
  if (damageContributors.length === 0) {
    console.warn(`No damage contributors found for enemy ${enemyId}`);
    return null;
  }
  
  // Get base XP for this enemy and rarity
  const baseEnemyXP = getEnemyXP(playerLevels[killingPlayerId], enemy.rarity);
  
  // Distribute XP to all contributors
  const xpDistribution = {};
  
  if (damageContributors.length === 1) {
    // Solo kill - full XP to killer
    xpDistribution[killingPlayerId] = baseEnemyXP;
  } else {
    // Shared kill - split XP equally among contributors
    const sharedXP = Math.floor(baseEnemyXP / damageContributors.length);
    for (let playerId of damageContributors) {
      xpDistribution[playerId] = sharedXP;
    }
  }
  
  // Record kill credit
  session.killCredits[enemyId] = killingPlayerId;
  
  // Store XP awarded
  session.xpAwarded[enemyId] = xpDistribution;
  
  return {
    enemyId: enemyId,
    enemy: enemy,
    baseXP: baseEnemyXP,
    contributors: damageContributors,
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

// Award XP when enemy dies
// const xpReward = awardEnemyKillXP('combat_001', 'enemy1', 'player1', { player1: 25, player2: 24, player3: 25 });
// Result: { enemyId: 'enemy1', baseXP: 520, contributors: ['player1', 'player2'], xpDistribution: { player1: 260, player2: 260 } }

// const xpReward2 = awardEnemyKillXP('combat_001', 'enemy2', 'player3', { player1: 25, player2: 24, player3: 25 });
// Result: { enemyId: 'enemy2', baseXP: 970, contributors: ['player3'], xpDistribution: { player3: 970 } }

// Get summary
// const summary = endCombatSession('combat_001');
// Result: { combatId: 'combat_001', totalXPByPlayer: { player1: 260, player2: 260, player3: 970 }, ... }
