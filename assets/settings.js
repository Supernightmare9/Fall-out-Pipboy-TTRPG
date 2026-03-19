// settings.js
// Global Game Settings for Fall-out Pipboy TTRPG
// These settings are controlled by the Overseer only.

const gameSettings = {
  version: "1.0",
  lastUpdated: "2025-03-19",

  // OVERSEER-ONLY SETTINGS
  overseerSettings: {
    difficulty: "medium",        // easy / medium / hard / hardcore
    turnTimer: 60,               // seconds per turn
    autoSave: true,
    enableHouseRules: false,
    criticalHitChance: 5,        // percentage
    minDamage: 1,
    maxLevel: 50,
    experienceScaling: 1.0
  }
};
