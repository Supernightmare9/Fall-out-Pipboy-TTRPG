// assets/logic/playerxpmanager.js
// Player XP Manager - Centralized system for all XP sources and player leveling

// Function to add quest XP to player
function addQuestXP(player, questType, intBonus = 1) {
  // questType = 'mainQuest', 'sideQuest', 'fetchQuest', 'hardSkillCheck', 'easySkillCheck'
  // intBonus = INT stat multiplier from intstatbonus.js
  
  const baseQuestXP = getQuestXP(player.level, questType);
  const modifiedXP = Math.floor(baseQuestXP * intBonus);
  
  player.xp += modifiedXP;
  
  return {
    xpGained: modifiedXP,
    source: 'Quest',
    questType: questType,
    totalXP: player.xp
  };
}

// Function to add location XP to player
function addLocationXP(player, intBonus = 1) {
  // Location XP is 'easySkillCheck' value from questxp.js
  const baseLocationXP = getQuestXP(player.level, 'easySkillCheck');
  const modifiedXP = Math.floor(baseLocationXP * intBonus);
  
  player.xp += modifiedXP;
  
  return {
    xpGained: modifiedXP,
    source: 'Location Discovery',
    totalXP: player.xp
  };
}

// Function to add task XP to player (lockpicking, terminals, skill checks)
function addTaskXP(player, taskType, intBonus = 1) {
  // taskType = 'hardSkillCheck', 'easySkillCheck', or custom task identifier
  const baseTaskXP = getQuestXP(player.level, taskType);
  const modifiedXP = Math.floor(baseTaskXP * intBonus);
  
  player.xp += modifiedXP;
  
  return {
    xpGained: modifiedXP,
    source: 'Task Completion',
    taskType: taskType,
    totalXP: player.xp
  };
}

// Function to add combat XP to player (from combatxp.js result)
function addCombatXP(player, combatXPAmount, intBonus = 1) {
  const modifiedXP = Math.floor(combatXPAmount * intBonus);
  
  player.xp += modifiedXP;
  
  return {
    xpGained: modifiedXP,
    source: 'Combat',
    totalXP: player.xp
  };
}

// Function to add crafting XP to player
function addCraftingXP(player, craftingXPAmount, intBonus = 1) {
  const modifiedXP = Math.floor(craftingXPAmount * intBonus);
  
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
      const combatLog = addCombatXP(player, sessionXPData.combatXP[playerId], sessionXPData.intBonus?.[playerId] || 1);
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
