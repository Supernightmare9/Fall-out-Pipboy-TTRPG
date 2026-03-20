// encounterBuilder.js
// Encounter Management System for Fall-out Pipboy TTRPG
// Provides custom enemy creation, encounter difficulty calculation,
// XP rewards, preset encounter templates, and loot management.

var EncounterBuilder = (function () {
    'use strict';

    // ── DIFFICULTY WEIGHTS ────────────────────────────────────────
    var DIFFICULTY_WEIGHTS = { common: 1, uncommon: 3, rare: 8, legendary: 20 };

    // ── BASE XP PER ENEMY DIFFICULTY ─────────────────────────────
    var XP_VALUES = { common: 50, uncommon: 150, rare: 400, legendary: 1000 };

    // ── DEFAULT ENEMY STATS ───────────────────────────────────────
    var DEFAULT_ENEMY_HP   = 20;
    var DEFAULT_ENEMY_AC   = 10;
    var DEFAULT_INITIATIVE = 5;

    // ── THREAT CALCULATION CONSTANTS ──────────────────────────────
    var HP_SCALE_FACTOR         = 20;  // HP is divided by this to get a scaling factor
    var AC_SCALE_FACTOR         = 6;   // AC is divided by this to get a scaling factor
    var PARTY_CAPACITY_MULTIPLIER = 2; // Multiplier applied to partySize * partyLevel for baseline capacity

    // ── PRESET ENCOUNTER TEMPLATES ────────────────────────────────
    var TEMPLATES = [
        {
            id: 'template_trash',
            name: 'Trash Mob',
            description: 'A pack of weak common enemies. Good for clearing rooms or roadblocks.',
            icon: '\uD83D\uDC00',
            buildRoster: function (enemies) {
                var pool = enemies.filter(function (e) { return e.difficulty === 'common'; });
                if (pool.length === 0) pool = enemies.slice();
                if (pool.length === 0) return [];
                var count = 4 + Math.floor(Math.random() * 3);
                var roster = [];
                for (var i = 0; i < count; i++) {
                    roster.push(pool[Math.floor(Math.random() * pool.length)]);
                }
                return roster;
            }
        },
        {
            id: 'template_ambush',
            name: 'Ambush',
            description: 'Coordinated attackers with leaders and footsoldiers. Initiative is crucial.',
            icon: '\u26A1',
            buildRoster: function (enemies) {
                var commons = enemies.filter(function (e) { return e.difficulty === 'common'; });
                var uncommons = enemies.filter(function (e) { return e.difficulty === 'uncommon'; });
                var roster = [];
                var leaders = uncommons.length > 0 ? uncommons.slice(0, 2) : [];
                leaders.forEach(function (l) { roster.push(l); });
                var pool = commons.length > 0 ? commons : enemies;
                if (pool.length === 0) return roster;
                var footCount = 2 + Math.floor(Math.random() * 2);
                for (var i = 0; i < footCount; i++) {
                    roster.push(pool[Math.floor(Math.random() * pool.length)]);
                }
                return roster;
            }
        },
        {
            id: 'template_dungeon',
            name: 'Dungeon Crawl',
            description: 'A rare threat with uncommon support. Resource-draining and dangerous.',
            icon: '\uD83C\uDFDA',
            buildRoster: function (enemies) {
                var rares = enemies.filter(function (e) { return e.difficulty === 'rare'; });
                var uncommons = enemies.filter(function (e) { return e.difficulty === 'uncommon'; });
                var roster = [];
                if (rares.length > 0) {
                    roster.push(rares[Math.floor(Math.random() * rares.length)]);
                }
                var pool = uncommons.length > 0 ? uncommons : enemies;
                if (pool.length === 0) return roster;
                var count = 2 + Math.floor(Math.random() * 2);
                for (var i = 0; i < count; i++) {
                    roster.push(pool[Math.floor(Math.random() * pool.length)]);
                }
                return roster;
            }
        },
        {
            id: 'template_boss',
            name: 'Boss Fight',
            description: 'A legendary threat with common minions. High stakes, high rewards.',
            icon: '\uD83D\uDC80',
            buildRoster: function (enemies) {
                var legendaries = enemies.filter(function (e) { return e.difficulty === 'legendary'; });
                var commons = enemies.filter(function (e) { return e.difficulty === 'common'; });
                var bossPool = legendaries.length > 0 ? legendaries : enemies;
                if (bossPool.length === 0) return [];
                var roster = [bossPool[Math.floor(Math.random() * bossPool.length)]];
                var minionPool = commons.length > 0 ? commons : enemies;
                var count = 2 + Math.floor(Math.random() * 2);
                for (var i = 0; i < count; i++) {
                    roster.push(minionPool[Math.floor(Math.random() * minionPool.length)]);
                }
                return roster;
            }
        }
    ];

    // ── CUSTOM ENEMY STORAGE ──────────────────────────────────────

    function _key(campaignId) {
        return 'vault215_custom_enemies_' + campaignId;
    }

    function getCustomEnemies(campaignId) {
        if (!campaignId) return [];
        try { return JSON.parse(localStorage.getItem(_key(campaignId))) || []; } catch (e) { return []; }
    }

    function saveCustomEnemies(campaignId, enemies) {
        if (!campaignId) return false;
        try { localStorage.setItem(_key(campaignId), JSON.stringify(enemies)); return true; } catch (e) { return false; }
    }

    function createCustomEnemy(campaignId, data) {
        if (!campaignId || !data || !String(data.name || '').trim()) return null;
        var abils = Array.isArray(data.abilities)
            ? data.abilities
            : String(data.abilities || '').split(',').map(function (a) { return a.trim(); }).filter(Boolean);
        var hp = Math.max(1, parseInt(data.hp, 10) || DEFAULT_ENEMY_HP);
        var enemy = {
            id: 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
            name: String(data.name).trim(),
            type: String(data.type || 'custom').trim(),
            hp: hp,
            maxHp: hp,
            ac: Math.max(1, parseInt(data.ac, 10) || DEFAULT_ENEMY_AC),
            initiative: parseInt(data.initiative, 10) || DEFAULT_INITIATIVE,
            description: String(data.description || '').trim(),
            abilities: abils,
            loot: Array.isArray(data.loot) ? data.loot : [],
            notes: String(data.notes || '').trim(),
            difficulty: data.difficulty || 'common',
            isCustom: true,
            createdAt: new Date().toISOString()
        };
        var all = getCustomEnemies(campaignId);
        all.push(enemy);
        saveCustomEnemies(campaignId, all);
        return enemy;
    }

    function updateCustomEnemy(campaignId, enemyId, data) {
        var all = getCustomEnemies(campaignId);
        var idx = -1;
        for (var i = 0; i < all.length; i++) { if (all[i].id === enemyId) { idx = i; break; } }
        if (idx === -1) return null;
        var e = all[idx];
        if (data.name !== undefined) e.name = String(data.name).trim();
        if (data.type !== undefined) e.type = String(data.type).trim();
        if (data.hp !== undefined) {
            e.hp = Math.max(1, parseInt(data.hp, 10) || e.hp);
            e.maxHp = e.hp;
        }
        if (data.ac !== undefined) e.ac = Math.max(1, parseInt(data.ac, 10) || e.ac);
        if (data.initiative !== undefined) e.initiative = parseInt(data.initiative, 10) || e.initiative;
        if (data.description !== undefined) e.description = String(data.description).trim();
        if (data.abilities !== undefined) {
            e.abilities = Array.isArray(data.abilities)
                ? data.abilities
                : String(data.abilities).split(',').map(function (a) { return a.trim(); }).filter(Boolean);
        }
        if (data.notes !== undefined) e.notes = String(data.notes).trim();
        if (data.difficulty !== undefined) e.difficulty = data.difficulty;
        e.updatedAt = new Date().toISOString();
        all[idx] = e;
        saveCustomEnemies(campaignId, all);
        return e;
    }

    function deleteCustomEnemy(campaignId, enemyId) {
        var all = getCustomEnemies(campaignId);
        var filtered = all.filter(function (e) { return e.id !== enemyId; });
        if (filtered.length === all.length) return false;
        saveCustomEnemies(campaignId, filtered);
        return true;
    }

    // ── DIFFICULTY CALCULATOR ─────────────────────────────────────

    function _threat(enemy) {
        var base = DIFFICULTY_WEIGHTS[enemy.difficulty] || 1;
        var hpF = Math.max(1, Math.ceil((enemy.maxHp || enemy.hp || DEFAULT_ENEMY_HP) / HP_SCALE_FACTOR));
        var acF = Math.max(1, Math.ceil((enemy.ac || DEFAULT_ENEMY_AC) / AC_SCALE_FACTOR));
        return base * hpF * acF;
    }

    function calculateEncounterDifficulty(enemies, partySize, partyLevel) {
        partySize = Math.max(1, partySize || 4);
        partyLevel = Math.max(1, partyLevel || 1);
        if (!enemies || enemies.length === 0) {
            return { rating: 'trivial', totalThreat: 0, label: 'No enemies in encounter', xp: { total: 0, perPlayer: 0 } };
        }
        var totalThreat = enemies.reduce(function (s, e) { return s + _threat(e); }, 0);
        var capacity = partySize * partyLevel * PARTY_CAPACITY_MULTIPLIER;
        var ratio = totalThreat / capacity;
        var rating;
        if (ratio < 0.5) rating = 'trivial';
        else if (ratio < 1.0) rating = 'easy';
        else if (ratio < 1.75) rating = 'balanced';
        else if (ratio < 2.75) rating = 'hard';
        else rating = 'deadly';
        var ratingLabels = {
            trivial: 'TRIVIAL \u2014 Party will breeze through this',
            easy: 'EASY \u2014 Minor challenge, minimal risk',
            balanced: 'BALANCED \u2014 Fair challenge with real risk',
            hard: 'HARD \u2014 Dangerous, resource-draining',
            deadly: 'DEADLY \u2014 Party may not survive'
        };
        return {
            rating: rating,
            totalThreat: totalThreat,
            partyCapacity: capacity,
            label: ratingLabels[rating] || rating,
            xp: calculateXpReward(enemies, partySize)
        };
    }

    function calculateXpReward(enemies, partySize) {
        partySize = Math.max(1, partySize || 4);
        if (!enemies || enemies.length === 0) return { total: 0, perPlayer: 0 };
        var base = enemies.reduce(function (s, e) { return s + (XP_VALUES[e.difficulty] || 50); }, 0);
        var n = enemies.length;
        var mult = n >= 7 ? 2.5 : n >= 4 ? 2.0 : n >= 2 ? 1.5 : 1.0;
        var total = Math.round(base * mult);
        return { total: total, perPlayer: Math.round(total / partySize) };
    }

    // ── ENCOUNTER TEMPLATES ───────────────────────────────────────

    function getTemplates() {
        return TEMPLATES.map(function (t) {
            return { id: t.id, name: t.name, description: t.description, icon: t.icon };
        });
    }

    function buildEncounterFromTemplate(templateId, allEnemies) {
        var t = null;
        for (var i = 0; i < TEMPLATES.length; i++) {
            if (TEMPLATES[i].id === templateId) { t = TEMPLATES[i]; break; }
        }
        if (!t) return [];
        return t.buildRoster(allEnemies || []);
    }

    // ── LOOT ──────────────────────────────────────────────────────

    function getLootFromEnemy(enemy) {
        if (!enemy || !Array.isArray(enemy.loot)) return [];
        return enemy.loot.filter(function () { return Math.random() < 0.7; });
    }

    function collectEncounterLoot(enemies) {
        var loot = [];
        (enemies || []).forEach(function (e) {
            getLootFromEnemy(e).forEach(function (item) {
                loot.push({ enemyName: e.name, itemId: item });
            });
        });
        return loot;
    }

    // ── PUBLIC API ────────────────────────────────────────────────

    return {
        getCustomEnemies: getCustomEnemies,
        saveCustomEnemies: saveCustomEnemies,
        createCustomEnemy: createCustomEnemy,
        updateCustomEnemy: updateCustomEnemy,
        deleteCustomEnemy: deleteCustomEnemy,
        calculateEncounterDifficulty: calculateEncounterDifficulty,
        calculateXpReward: calculateXpReward,
        getTemplates: getTemplates,
        buildEncounterFromTemplate: buildEncounterFromTemplate,
        getLootFromEnemy: getLootFromEnemy,
        collectEncounterLoot: collectEncounterLoot
    };
})();
