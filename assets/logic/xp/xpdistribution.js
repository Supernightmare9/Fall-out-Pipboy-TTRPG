// assets/logic/xp/xpdistribution.js
// Player XP Manager - Centralized system for all XP sources and player leveling
//
// MAINTAINER NOTE: The `intBonus` parameter accepted by every XP-award function
// below should come from getIntXPMultiplier(player.special.intelligence), defined
// in fallout_stat_bonuses.js — the single source of truth for all S.P.E.C.I.A.L.
// derived stats.  Example:
//   const intBonus = getIntXPMultiplier(player.special.intelligence);
//   addCombatXP(player, rawXP, intBonus);
//
// Server-side usage: this file is also required by server.js for XP calculations.
// All XP mutations on the server go through calcXpWithIntBonus() so the INT bonus
// is applied consistently before writing player.data.xp.

// ── Inline INT bonus table (mirrors fallout_stat_bonuses.js intStatBonus) ─────
// This keeps xpdistribution.js self-contained for server-side and test use.
// Duplication with fallout_stat_bonuses.js is intentional: that file is browser-
// only and cannot be require()'d in Node.js (server/test) contexts.
// If the bonus values change, update ALL THREE locations:
//   1. fallout_stat_bonuses.js (intStatBonus) — browser source of truth
//   2. xpdistribution.js (_XD_INT_BONUS) — Node.js / server fallback
//   3. server.js (_intStatBonus) — server-only helper
var _XD_INT_BONUS = { 1:1.03,2:1.06,3:1.09,4:1.12,5:1.15,6:1.18,7:1.21,8:1.24,9:1.27,10:1.30 };

// ── Core INT-bonus calculation ────────────────────────────────────────────────
// Returns the final XP after applying the Intelligence multiplier.
// intStat: the player's Intelligence value (1–10). Falls back to INT 5 if absent.
function calcXpWithIntBonus(rawXp, intStat) {
  var bonus;
  if (typeof getIntXPMultiplier === 'function') {
    // Browser context: use the shared global from fallout_stat_bonuses.js
    bonus = getIntXPMultiplier(intStat != null ? intStat : 5);
  } else {
    // Server / test context: use the inline table
    var intVal = (intStat !== null && intStat !== undefined) ? Number(intStat) : 5;
    var clamped = Math.max(1, Math.min(10, intVal));
    bonus = _XD_INT_BONUS[clamped] || 1.15;
  }
  // Use Math.round to avoid floating-point surprises (e.g. floor(100 * 1.15) = 114)
  return Math.round(rawXp * bonus);
}

// Function to add quest XP to player
function addQuestXP(player, questType, intBonus) {
  // questType = 'mainQuest', 'sideQuest', 'fetchQuest', 'hardSkillCheck', 'easySkillCheck'
  // intBonus = INT stat multiplier from fallout_stat_bonuses.js
  if (intBonus === undefined) intBonus = 1;
  const baseQuestXP = getQuestXP(player.level, questType);
  const modifiedXP = Math.round(baseQuestXP * intBonus);
  
  player.xp += modifiedXP;
  
  return {
    xpGained: modifiedXP,
    source: 'Quest',
    questType: questType,
    totalXP: player.xp
  };
}

// Function to add location XP to player
function addLocationXP(player, intBonus) {
  // Location XP is 'easySkillCheck' value from questxp.js
  if (intBonus === undefined) intBonus = 1;
  const baseLocationXP = getQuestXP(player.level, 'easySkillCheck');
  const modifiedXP = Math.round(baseLocationXP * intBonus);
  
  player.xp += modifiedXP;
  
  return {
    xpGained: modifiedXP,
    source: 'Location Discovery',
    totalXP: player.xp
  };
}

// Function to add task XP to player (lockpicking, terminals, skill checks)
function addTaskXP(player, taskType, intBonus) {
  // taskType = 'hardSkillCheck', 'easySkillCheck', or custom task identifier
  if (intBonus === undefined) intBonus = 1;
  const baseTaskXP = getQuestXP(player.level, taskType);
  const modifiedXP = Math.round(baseTaskXP * intBonus);
  
  player.xp += modifiedXP;
  
  return {
    xpGained: modifiedXP,
    source: 'Task Completion',
    taskType: taskType,
    totalXP: player.xp
  };
}

// Function to add combat XP to player (from combatxp.js result)
function addCombatXP(player, combatXPAmount, intBonus) {
  if (intBonus === undefined) intBonus = 1;
  const modifiedXP = Math.round(combatXPAmount * intBonus);
  
  player.xp += modifiedXP;
  
  return {
    xpGained: modifiedXP,
    source: 'Combat',
    totalXP: player.xp
  };
}

// Function to add crafting XP to player
function addCraftingXP(player, craftingXPAmount, intBonus) {
  if (intBonus === undefined) intBonus = 1;
  const modifiedXP = Math.round(craftingXPAmount * intBonus);
  
  player.xp += modifiedXP;
  
  return {
    xpGained: modifiedXP,
    source: 'Crafting',
    totalXP: player.xp
  };
}

// Function to check if player has leveled up
function checkLevelUp(player, xpTable) {
  // xpTable should define XP requirements per level
  // Example: { 1: 0, 2: 1000, 3: 2500, 4: 4500, ... }
  
  let leveledUp = false;
  const levelUpHistory = [];
  
  while (player.xp >= xpTable[player.level + 1]) {
    player.level += 1;
    leveledUp = true;
    levelUpHistory.push({
      newLevel: player.level,
      totalXP: player.xp,
      xpNeeded: xpTable[player.level]
    });
  }
  
  return {
    leveledUp: leveledUp,
    currentLevel: player.level,
    levelUpHistory: levelUpHistory,
    totalXP: player.xp
  };
}

// Function to get XP progress to next level
function getXPProgress(player, xpTable) {
  const currentLevelXP = xpTable[player.level];
  const nextLevelXP = xpTable[player.level + 1];
  const xpIntoLevel = player.xp - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  const progressPercent = Math.floor((xpIntoLevel / xpNeededForLevel) * 100);
  
  return {
    currentLevel: player.level,
    xpIntoLevel: xpIntoLevel,
    xpNeededForLevel: xpNeededForLevel,
    xpToNextLevel: nextLevelXP - player.xp,
    progressPercent: progressPercent,
    totalXP: player.xp
  };
}

// Function to award all XP at end of session/encounter
function awardSessionXP(players, sessionXPData, xpTable) {
  // sessionXPData = { questXP: {}, combatXP: {}, taskXP: {}, locationXP: {}, craftingXP: {} }
  // Returns summary of all XP awarded
  
  const xpSummary = [];
  
  for (let playerId in players) {
    const player = players[playerId];
    const playerXPLog = [];
    
    // Quest XP
    if (sessionXPData.questXP && sessionXPData.questXP[playerId]) {
      const questLog = addQuestXP(player, sessionXPData.questXP[playerId].type, sessionXPData.questXP[playerId].intBonus || 1);
      playerXPLog.push(questLog);
    }
    
    // Combat XP
    if (sessionXPData.combatXP && sessionXPData.combatXP[playerId]) {
      const combatLog = addCombatXP(player, sessionXPData.combatXP[playerId], sessionXPData.intBonus && sessionXPData.intBonus[playerId] || 1);
      playerXPLog.push(combatLog);
    }
    
    // Task XP
    if (sessionXPData.taskXP && sessionXPData.taskXP[playerId]) {
      const taskLog = addTaskXP(player, sessionXPData.taskXP[playerId].type, sessionXPData.taskXP[playerId].intBonus || 1);
      playerXPLog.push(taskLog);
    }
    
    // Location XP
    if (sessionXPData.locationXP && sessionXPData.locationXP[playerId]) {
      const locationLog = addLocationXP(player, sessionXPData.locationXP[playerId] || 1);
      playerXPLog.push(locationLog);
    }
    
    // Crafting XP
    if (sessionXPData.craftingXP && sessionXPData.craftingXP[playerId]) {
      const craftingLog = addCraftingXP(player, sessionXPData.craftingXP[playerId].amount, sessionXPData.craftingXP[playerId].intBonus || 1);
      playerXPLog.push(craftingLog);
    }
    
    // Check for level ups
    const levelUpInfo = checkLevelUp(player, xpTable);
    
    xpSummary.push({
      playerId: playerId,
      playerName: player.name,
      xpLog: playerXPLog,
      levelUpInfo: levelUpInfo,
      currentLevel: player.level,
      totalXP: player.xp
    });
  }
  
  return xpSummary;
}

// Example usage:
// Player gains quest XP
// const result = addQuestXP(player, 'mainQuest', 1.15); // 15% INT bonus
// Player gains combat XP
// const combatResult = addCombatXP(player, 130, 1.15);
// Check level up
// const levelCheck = checkLevelUp(player, xpTable);
// Get progress
// const progress = getXPProgress(player, xpTable);
// Apply INT bonus directly:
// const finalXP = calcXpWithIntBonus(200, player.special.intelligence);

// ── Node.js / CommonJS export (for server.js and tests) ─────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calcXpWithIntBonus,
    addQuestXP,
    addLocationXP,
    addTaskXP,
    addCombatXP,
    addCraftingXP,
    checkLevelUp,
    getXPProgress,
    awardSessionXP
  };
}
