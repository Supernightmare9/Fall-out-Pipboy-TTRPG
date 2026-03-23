// assets/logic/questxp.js
// Quest XP Rewards by Player Level and Quest Type

const questXPTable = {
  1: { mainQuest: 130, sideQuest: 65, fetchQuest: 30, hardSkillCheck: 15, easySkillCheck: 5 },
  5: { mainQuest: 350, sideQuest: 175, fetchQuest: 90, hardSkillCheck: 45, easySkillCheck: 20 },
  10: { mainQuest: 670, sideQuest: 335, fetchQuest: 170, hardSkillCheck: 85, easySkillCheck: 35 },
  20: { mainQuest: 1310, sideQuest: 655, fetchQuest: 330, hardSkillCheck: 165, easySkillCheck: 65 },
  30: { mainQuest: 1950, sideQuest: 975, fetchQuest: 490, hardSkillCheck: 245, easySkillCheck: 100 },
  40: { mainQuest: 2590, sideQuest: 1295, fetchQuest: 650, hardSkillCheck: 325, easySkillCheck: 130 },
  50: { mainQuest: 3230, sideQuest: 1615, fetchQuest: 810, hardSkillCheck: 405, easySkillCheck: 160 },
  60: { mainQuest: 3870, sideQuest: 1935, fetchQuest: 970, hardSkillCheck: 485, easySkillCheck: 195 },
  70: { mainQuest: 4510, sideQuest: 2255, fetchQuest: 1130, hardSkillCheck: 565, easySkillCheck: 225 },
  80: { mainQuest: 5150, sideQuest: 2575, fetchQuest: 1290, hardSkillCheck: 645, easySkillCheck: 260 },
  90: { mainQuest: 5790, sideQuest: 2895, fetchQuest: 1450, hardSkillCheck: 725, easySkillCheck: 290 },
  100: { mainQuest: 6430, sideQuest: 3215, fetchQuest: 1610, hardSkillCheck: 805, easySkillCheck: 320 }
};

// Quest type percentages (for reference)
const questTypePercentages = {
  mainQuest: 40,
  sideQuest: 20,
  fetchQuest: 10,
  hardSkillCheck: 5,
  easySkillCheck: 2
};

// Function to get XP for completing a quest
function getQuestXP(playerLevel, questType) {
  // Find highest level in table that is <= playerLevel (never round up)
  const validLevels = Object.keys(questXPTable).map(Number).sort((a, b) => a - b);
  let closestLevel = validLevels[0];
  
  for (let level of validLevels) {
    if (level <= playerLevel) {
      closestLevel = level;
    }
  }
  
  // Get XP for that level and quest type
  const questTypeKey = questType.charAt(0).toLowerCase() + questType.slice(1); // Normalize to camelCase
  const xpReward = questXPTable[closestLevel][questTypeKey];
  return xpReward || 0;
}

// Example usage: const xp = getQuestXP(45, 'mainQuest'); // Gets XP for level 40 (highest <= 45), main quest
