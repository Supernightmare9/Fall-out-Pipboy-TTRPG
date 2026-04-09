// xp_system.js
// XP Progression System for Fall-out Pipboy TTRPG

// XP Sources
const XP_SOURCES = ['Quest', 'Combat', 'Exploration', 'Learning', 'Other'];

// Complete XP Table for Levels 1-100
// Each entry: { level, start (cumulative XP to reach this level), needed (XP to advance to next) }
const XP_TABLE = [
    { level: 1,   start: 0,       needed: 320    },
    { level: 2,   start: 320,     needed: 720    },
    { level: 3,   start: 1040,    needed: 1120   },
    { level: 4,   start: 2160,    needed: 1268   },
    { level: 5,   start: 3428,    needed: 1417   },
    { level: 6,   start: 4845,    needed: 1565   },
    { level: 7,   start: 6410,    needed: 1713   },
    { level: 8,   start: 8123,    needed: 1861   },
    { level: 9,   start: 9984,    needed: 2010   },
    { level: 10,  start: 11994,   needed: 2158   },
    { level: 11,  start: 14152,   needed: 2306   },
    { level: 12,  start: 16458,   needed: 2454   },
    { level: 13,  start: 18912,   needed: 2603   },
    { level: 14,  start: 21515,   needed: 2751   },
    { level: 15,  start: 24266,   needed: 2899   },
    { level: 16,  start: 27165,   needed: 3047   },
    { level: 17,  start: 30212,   needed: 3196   },
    { level: 18,  start: 33408,   needed: 3344   },
    { level: 19,  start: 36752,   needed: 3492   },
    { level: 20,  start: 40244,   needed: 3640   },
    { level: 21,  start: 43884,   needed: 3789   },
    { level: 22,  start: 47673,   needed: 3937   },
    { level: 23,  start: 51610,   needed: 4085   },
    { level: 24,  start: 55695,   needed: 4234   },
    { level: 25,  start: 59929,   needed: 4382   },
    { level: 26,  start: 64311,   needed: 4530   },
    { level: 27,  start: 68841,   needed: 4678   },
    { level: 28,  start: 73519,   needed: 4827   },
    { level: 29,  start: 78346,   needed: 4975   },
    { level: 30,  start: 83321,   needed: 5123   },
    { level: 31,  start: 88444,   needed: 5271   },
    { level: 32,  start: 93715,   needed: 5420   },
    { level: 33,  start: 99135,   needed: 5568   },
    { level: 34,  start: 104703,  needed: 5716   },
    { level: 35,  start: 110419,  needed: 5864   },
    { level: 36,  start: 116283,  needed: 6013   },
    { level: 37,  start: 122296,  needed: 6161   },
    { level: 38,  start: 128457,  needed: 6309   },
    { level: 39,  start: 134766,  needed: 6458   },
    { level: 40,  start: 141224,  needed: 6606   },
    { level: 41,  start: 147830,  needed: 6754   },
    { level: 42,  start: 154584,  needed: 6902   },
    { level: 43,  start: 161486,  needed: 7051   },
    { level: 44,  start: 168537,  needed: 7199   },
    { level: 45,  start: 175736,  needed: 7347   },
    { level: 46,  start: 183083,  needed: 7495   },
    { level: 47,  start: 190578,  needed: 7644   },
    { level: 48,  start: 198222,  needed: 7792   },
    { level: 49,  start: 206014,  needed: 7940   },
    { level: 50,  start: 213954,  needed: 8088   },
    { level: 51,  start: 222042,  needed: 8237   },
    { level: 52,  start: 230279,  needed: 8385   },
    { level: 53,  start: 238664,  needed: 8533   },
    { level: 54,  start: 247197,  needed: 8681   },
    { level: 55,  start: 255878,  needed: 8830   },
    { level: 56,  start: 264708,  needed: 8978   },
    { level: 57,  start: 273686,  needed: 9126   },
    { level: 58,  start: 282812,  needed: 9275   },
    { level: 59,  start: 292087,  needed: 9423   },
    { level: 60,  start: 301510,  needed: 9571   },
    { level: 61,  start: 311081,  needed: 9719   },
    { level: 62,  start: 320800,  needed: 9868   },
    { level: 63,  start: 330668,  needed: 10016  },
    { level: 64,  start: 340684,  needed: 10164  },
    { level: 65,  start: 350848,  needed: 10312  },
    { level: 66,  start: 361160,  needed: 10461  },
    { level: 67,  start: 371621,  needed: 10609  },
    { level: 68,  start: 382230,  needed: 10757  },
    { level: 69,  start: 392987,  needed: 10905  },
    { level: 70,  start: 403892,  needed: 11054  },
    { level: 71,  start: 414946,  needed: 11202  },
    { level: 72,  start: 426148,  needed: 11350  },
    { level: 73,  start: 437498,  needed: 11499  },
    { level: 74,  start: 448997,  needed: 11647  },
    { level: 75,  start: 460644,  needed: 11795  },
    { level: 76,  start: 472439,  needed: 11943  },
    { level: 77,  start: 484382,  needed: 12092  },
    { level: 78,  start: 496474,  needed: 12240  },
    { level: 79,  start: 508714,  needed: 12388  },
    { level: 80,  start: 521102,  needed: 12536  },
    { level: 81,  start: 533638,  needed: 12685  },
    { level: 82,  start: 546323,  needed: 12833  },
    { level: 83,  start: 559156,  needed: 12981  },
    { level: 84,  start: 572137,  needed: 13129  },
    { level: 85,  start: 585266,  needed: 13278  },
    { level: 86,  start: 598544,  needed: 13426  },
    { level: 87,  start: 611970,  needed: 13574  },
    { level: 88,  start: 625544,  needed: 13722  },
    { level: 89,  start: 639266,  needed: 13871  },
    { level: 90,  start: 653137,  needed: 14019  },
    { level: 91,  start: 667156,  needed: 14167  },
    { level: 92,  start: 681323,  needed: 14316  },
    { level: 93,  start: 695639,  needed: 14464  },
    { level: 94,  start: 710103,  needed: 14612  },
    { level: 95,  start: 724715,  needed: 14760  },
    { level: 96,  start: 739475,  needed: 14909  },
    { level: 97,  start: 754384,  needed: 15057  },
    { level: 98,  start: 769441,  needed: 15205  },
    { level: 99,  start: 784646,  needed: 15354  },
    // Level 100 is the maximum; 'needed' is cosmetic (no level 101 exists).
    { level: 100, start: 800000,  needed: 816080 },
];

// ─── Core XP Calculations ────────────────────────────────────────────────────

/**
 * Returns the current level for a given total XP amount.
 * @param {number} totalXP
 * @returns {number} level (1–100)
 */
function getLevelFromXP(totalXP) {
    for (let i = XP_TABLE.length - 1; i >= 0; i--) {
        if (totalXP >= XP_TABLE[i].start) {
            return XP_TABLE[i].level;
        }
    }
    return 1;
}

/**
 * Returns XP still needed to reach the next level.
 * Returns 0 if at max level (100).
 * @param {number} totalXP
 * @returns {number}
 */
function getXPForNextLevel(totalXP) {
    const level = getLevelFromXP(totalXP);
    if (level >= 100) return 0;
    const entry = XP_TABLE[level - 1]; // index = level - 1
    return (entry.start + entry.needed) - totalXP;
}

/**
 * Returns progress percentage (0–100) within the current level.
 * @param {number} totalXP
 * @returns {number}
 */
function getLevelProgress(totalXP) {
    const level = getLevelFromXP(totalXP);
    if (level >= 100) return 100;
    const entry = XP_TABLE[level - 1];
    const progressInLevel = totalXP - entry.start;
    return Math.min(100, Math.floor((progressInLevel / entry.needed) * 100));
}

/**
 * Detects whether a level-up occurred between two XP totals.
 * Returns an array of new levels gained (empty if none).
 * @param {number} oldTotal
 * @param {number} newTotal
 * @returns {number[]}
 */
function checkLevelUp(oldTotal, newTotal) {
    const oldLevel = getLevelFromXP(oldTotal);
    const newLevel = getLevelFromXP(newTotal);
    const gained = [];
    for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
        gained.push(lvl);
    }
    return gained;
}

// ─── XP History ──────────────────────────────────────────────────────────────

const XP_HISTORY_KEY = 'pipboyXPHistory';

/**
 * Loads XP history from localStorage.
 * @returns {Array<{amount: number, source: string, description: string, timestamp: string, totalAfter: number}>}
 */
function loadXPHistory() {
    try {
        const raw = localStorage.getItem(XP_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Saves XP history to localStorage.
 * @param {Array} history
 */
function saveXPHistory(history) {
    localStorage.setItem(XP_HISTORY_KEY, JSON.stringify(history));
}

/**
 * Adds an XP event to persistent history.
 * @param {number} amount - XP gained (positive) or lost (negative)
 * @param {string} source - One of XP_SOURCES
 * @param {string} description - Optional note
 * @param {number} totalAfter - Total XP after this event
 */
function addXPToHistory(amount, source, description, totalAfter) {
    const history = loadXPHistory();
    history.unshift({
        amount,
        source: XP_SOURCES.includes(source) ? source : 'Other',
        description: description || '',
        timestamp: new Date().toLocaleString(),
        totalAfter
    });
    // Keep last 100 entries
    if (history.length > 100) history.length = 100;
    saveXPHistory(history);
}

/**
 * Clears all XP history from localStorage.
 */
function clearXPHistory() {
    localStorage.removeItem(XP_HISTORY_KEY);
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Formats a number with comma thousands-separators.
 * @param {number} xp
 * @returns {string}
 */
function formatXP(xp) {
    return Number(xp).toLocaleString();
}

// ── Node.js / CommonJS export (for server.js and tests) ──────────────────────
// In browser contexts `module` is undefined and this block is skipped.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        XP_TABLE,
        XP_SOURCES,
        getLevelFromXP,
        getXPForNextLevel,
        getLevelProgress,
        checkLevelUp,
        loadXPHistory,
        saveXPHistory,
        addXPToHistory,
        clearXPHistory,
        formatXP
    };
}
