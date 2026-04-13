// progressionManager.js
// Character Progression System for Vault 215 TTRPG

var ProgressionManager = (function () {
    var STORAGE_PREFIX = 'vault215_progression_';

    // Fallout-themed abilities unlocked at specific levels
    var LEVEL_ABILITIES = {
        2:  'Vault Survivor',
        4:  'Hardened',
        6:  'Combat Ready',
        8:  'Scavenger',
        10: 'Wastelander',
        12: 'Battle-Hardened',
        14: 'Wasteland Veteran',
        16: 'Iron Will',
        18: 'Elite Operative',
        20: 'Legendary Dweller'
    };

    // ── Storage helpers ──────────────────────────────────────────────

    function _key(campaignId) {
        return STORAGE_PREFIX + campaignId;
    }

    function _load(campaignId) {
        try {
            var raw = localStorage.getItem(_key(campaignId));
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function _save(campaignId, data) {
        localStorage.setItem(_key(campaignId), JSON.stringify(data));
    }

    // ── XP table helpers (delegates to xp.js globals) ───────────────

    function _getLevelFromXP(totalXp) {
        if (typeof getLevelFromXP === 'function') {
            return getLevelFromXP(totalXp);
        }
        // Minimal fallback if xp.js is not loaded
        return 1;
    }

    function _getXPForNextLevel(totalXp) {
        if (typeof getXPForNextLevel === 'function') {
            return getXPForNextLevel(totalXp);
        }
        return 320;
    }

    function _getLevelProgress(totalXp) {
        if (typeof getLevelProgress === 'function') {
            return getLevelProgress(totalXp);
        }
        return 0;
    }

    function _checkLevelUp(oldXp, newXp) {
        if (typeof checkLevelUp === 'function') {
            return checkLevelUp(oldXp, newXp);
        }
        return [];
    }

    function _getXPTableEntry(level) {
        if (typeof XP_TABLE !== 'undefined' && XP_TABLE[level - 1]) {
            return XP_TABLE[level - 1];
        }
        return null;
    }

    // ── Public: player progression CRUD ─────────────────────────────

    function getPlayerProgression(campaignId, username) {
        var all = _load(campaignId);
        if (!all[username]) {
            all[username] = { totalXp: 0, levelHistory: [] };
            _save(campaignId, all);
        }
        return all[username];
    }

    function setProgression(campaignId, username, totalXp) {
        if (!campaignId || !username) return;
        var all = _load(campaignId);
        if (!all[username]) all[username] = { totalXp: 0, levelHistory: [] };
        all[username].totalXp = Math.max(0, Number(totalXp) || 0);
        _save(campaignId, all);
    }

    // ── Public: level info ───────────────────────────────────────────

    function getLevelInfo(totalXp) {
        var xp      = Number(totalXp) || 0;
        var level   = _getLevelFromXP(xp);
        var entry   = _getXPTableEntry(level);
        var xpAtCurrentLevel  = entry ? entry.start  : 0;
        var xpNeededForLevel  = entry ? entry.needed : 0;
        var xpInCurrentLevel  = xp - xpAtCurrentLevel;
        var xpForNext         = _getXPForNextLevel(xp);
        var progressPct       = _getLevelProgress(xp);

        return {
            level:              level,
            totalXp:            xp,
            xpForNext:          xpForNext,
            progressPct:        progressPct,
            xpAtCurrentLevel:   xpAtCurrentLevel,
            xpInCurrentLevel:   xpInCurrentLevel,
            xpNeededForLevel:   xpNeededForLevel,
            abilityBonus:       getAbilityScoreBonus(level),
            proficiencyBonus:   getProficiencyBonus(level),
            unlockedAbilities:  getUnlockedAbilitiesUpToLevel(level)
        };
    }

    function getAbilityScoreBonus(level) {
        return Math.floor((Number(level) || 1) / 4);
    }

    // ── Public: proficiency bonus (DnD-style, scaled to level 50) ────────────
    // Tier breakpoints:
    //   1–8  → +2 | 9–16  → +3 | 17–24 → +4 | 25–32 → +5 | 33–50 → +6
    function getProficiencyBonus(level) {
        var lvl = Math.max(1, Math.min(50, Number(level) || 1));
        if (lvl <= 8)  return 2;
        if (lvl <= 16) return 3;
        if (lvl <= 24) return 4;
        if (lvl <= 32) return 5;
        return 6;
    }

    function getUnlockedAbilitiesUpToLevel(level) {
        var lvl    = Number(level) || 1;
        var result = [];
        Object.keys(LEVEL_ABILITIES).forEach(function (lvlStr) {
            var threshold = parseInt(lvlStr, 10);
            if (threshold <= lvl) {
                result.push({ level: threshold, name: LEVEL_ABILITIES[lvlStr] });
            }
        });
        result.sort(function (a, b) { return a.level - b.level; });
        return result;
    }

    // ── Public: HP increase on level-up (1d8 + CON mod) ─────────────

    function rollHpIncrease(conStat) {
        var con    = Number(conStat) || 10;
        var conMod = Math.floor((con - 10) / 2);
        var roll   = Math.floor(Math.random() * 8) + 1; // 1d8
        return Math.max(1, roll + conMod);
    }

    // ── Public: award XP ─────────────────────────────────────────────

    function awardXp(campaignId, username, amount, source) {
        if (!campaignId || !username || !(Number(amount) > 0)) return null;

        var all = _load(campaignId);
        if (!all[username]) all[username] = { totalXp: 0, levelHistory: [] };

        var prog    = all[username];
        var oldXp   = Number(prog.totalXp) || 0;
        var newXp   = oldXp + Number(amount);
        prog.totalXp = newXp;

        // Detect level-ups
        var levelsGained = _checkLevelUp(oldXp, newXp);
        var levelEvents  = [];

        levelsGained.forEach(function (newLevel) {
            var event = {
                level:     newLevel,
                xpAtLevel: newXp,
                timestamp: new Date().toISOString(),
                source:    source || 'Combat'
            };
            levelEvents.push(event);

            // Add to history, keep last 5
            prog.levelHistory.unshift(event);
            if (prog.levelHistory.length > 5) {
                prog.levelHistory.length = 5;
            }
        });

        _save(campaignId, all);

        return {
            oldXp:        oldXp,
            newXp:        newXp,
            gained:       Number(amount),
            levelsGained: levelsGained,
            levelEvents:  levelEvents
        };
    }

    function awardXpToAll(campaignId, usernames, amount, source) {
        var results = {};
        (usernames || []).forEach(function (username) {
            results[username] = awardXp(campaignId, username, amount, source);
        });
        return results;
    }

    // ── Public: level history ─────────────────────────────────────────

    function getLevelHistory(campaignId, username) {
        var prog = getPlayerProgression(campaignId, username);
        return prog.levelHistory || [];
    }

    // ── Public: format helpers ────────────────────────────────────────

    function formatXpNumber(xp) {
        return Number(xp).toLocaleString();
    }

    // ── Public API ────────────────────────────────────────────────────

    return {
        getPlayerProgression:        getPlayerProgression,
        setProgression:              setProgression,
        getLevelInfo:                getLevelInfo,
        getAbilityScoreBonus:        getAbilityScoreBonus,
        getProficiencyBonus:         getProficiencyBonus,
        getUnlockedAbilitiesUpToLevel: getUnlockedAbilitiesUpToLevel,
        rollHpIncrease:              rollHpIncrease,
        awardXp:                     awardXp,
        awardXpToAll:                awardXpToAll,
        getLevelHistory:             getLevelHistory,
        formatXpNumber:              formatXpNumber,
        LEVEL_ABILITIES:             LEVEL_ABILITIES
    };
}());
