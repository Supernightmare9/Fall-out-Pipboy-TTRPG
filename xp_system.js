// xp_system.js

// XP Progression System for Fall-out Pipboy TTRPG

// Level Table (1-100)
const levelTable = [
    { level: 1, xp: 0 },
    { level: 2, xp: 100 },
    { level: 3, xp: 300 },
    { level: 4, xp: 600 },
    { level: 5, xp: 1000 },
    // ... Fill in the rest up to level 100
    { level: 100, xp: 1000000 }
];

function getXPForLevel(level) {
    const entry = levelTable.find(e => e.level === level);
    return entry ? entry.xp : null;
}

function calculateLevels(xp) {
    for (let i = 0; i < levelTable.length; i++) {
        if (xp < levelTable[i].xp) {
            return levelTable[i - 1].level;
        }
    }
    return 100; // max level
}

function levelUpNotification(currentLevel, newLevel) {
    if (newLevel > currentLevel) {
        console.log(`Congratulations! You've leveled up to level ${newLevel}!`);
    }
}

function trackXP(sources) {
    let totalXP = 0;
    sources.forEach(source => {
        totalXP += source.xp;
    });
    return totalXP;
}

function calculateXPRequired(currentLevel) {
    const currentXP = getXPForLevel(currentLevel);
    const nextXP = getXPForLevel(currentLevel + 1);
    return nextXP - currentXP;
}

// Usage
const userXP = trackXP([{ xp: 150 }, { xp: 200 }]); // Example sources
const currentLevel = calculateLevels(userXP);
const xpRequired = calculateXPRequired(currentLevel);

levelUpNotification(currentLevel, calculateLevels(userXP + xpRequired));