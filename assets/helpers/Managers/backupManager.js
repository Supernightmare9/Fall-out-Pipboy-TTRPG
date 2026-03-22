// ═══════════════════════════════════════════════════════════
// VAULT 215 — BACKUP MANAGER
// assets/helpers/backupManager.js
//
// Backup, export, import and statistics system for campaigns.
//
// localStorage keys (prefix: vault215_):
//   vault215_backups_{campaignId}   - Array of snapshot backups
//   vault215_sessions_{campaignId}  - Array of session history
// ═══════════════════════════════════════════════════════════

var BackupManager = (function () {

    var PREFIX      = 'vault215_';
    var MAX_BACKUPS = 10;

    // ── Internal helpers ─────────────────────────────────────

    function _backupKey(campaignId) {
        return PREFIX + 'backups_' + campaignId;
    }

    function _sessionKey(campaignId) {
        return PREFIX + 'sessions_' + campaignId;
    }

    function _get(key) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function _set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('[BackupManager] Write failed for key "' + key + '":', e);
            return false;
        }
    }

    function _generateId() {
        return 'bk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    /**
     * Gather the current campaign state from all localStorage sources.
     * Falls back to the CAMPAIGNS global if nothing is stored.
     * @param {string} campaignId
     * @returns {Object}
     */
    function _gatherState(campaignId) {
        var state = { campaignId: campaignId };

        // Pull from StorageManager keys if available
        var keys = [
            PREFIX + 'campaign_'         + campaignId,
            PREFIX + 'gameState_'        + campaignId,
            PREFIX + 'encounter_'        + campaignId,
            PREFIX + 'overseer_campaign_' + campaignId
        ];
        keys.forEach(function (k) {
            var v = _get(k);
            if (v) Object.assign(state, v);
        });

        // Merge base campaign data from campaigns.js
        if (typeof CAMPAIGNS !== 'undefined') {
            var base = CAMPAIGNS.find(function (c) { return c.id === campaignId; });
            if (base) {
                Object.keys(base).forEach(function (key) {
                    if (state[key] === undefined) state[key] = base[key];
                });
            }
        }

        return state;
    }

    // ═════════════════════════════════════════════════════════
    // BACKUPS
    // ═════════════════════════════════════════════════════════

    /**
     * Create a timestamped snapshot backup for a campaign.
     * Keeps at most MAX_BACKUPS (10) backups per campaign.
     * @param {Object} campaign  - campaign object with at least { id, name }
     * @returns {Object}  the backup entry { id, timestamp, label, data }
     */
    function createBackup(campaign) {
        if (!campaign || !campaign.id) return null;

        var state   = _gatherState(campaign.id);
        var backup  = {
            id:        _generateId(),
            timestamp: Date.now(),
            label:     'Manual Backup — ' + new Date().toLocaleString(),
            campaignId: campaign.id,
            campaignName: campaign.name || campaign.id,
            data:      state
        };

        var key  = _backupKey(campaign.id);
        var list = _get(key) || [];
        list.unshift(backup);
        if (list.length > MAX_BACKUPS) list = list.slice(0, MAX_BACKUPS);
        _set(key, list);

        return backup;
    }

    /**
     * Return the list of backups for a campaign (newest first).
     * @param {string} campaignId
     * @returns {Array}
     */
    function getBackupList(campaignId) {
        if (!campaignId) return [];
        return _get(_backupKey(campaignId)) || [];
    }

    /**
     * Restore campaign state from a saved backup.
     * Writes the backup data back into the StorageManager campaign key.
     * @param {string} backupId   - the backup's `id` field
     * @param {string} campaignId
     * @returns {boolean}  true on success
     */
    function restoreFromBackup(backupId, campaignId) {
        if (!backupId || !campaignId) return false;

        var list   = getBackupList(campaignId);
        var backup = null;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === backupId) { backup = list[i]; break; }
        }
        if (!backup || !backup.data) return false;

        var restoredData = Object.assign({}, backup.data, {
            timestamp: Date.now(),
            restoredFrom: backupId,
            restoredAt: new Date().toISOString()
        });

        _set(PREFIX + 'campaign_'  + campaignId, restoredData);
        _set(PREFIX + 'gameState_' + campaignId, restoredData);

        return true;
    }

    // ═════════════════════════════════════════════════════════
    // EXPORT
    // ═════════════════════════════════════════════════════════

    /**
     * Build a plain-object export payload for the campaign.
     * @param {Object} campaign
     * @returns {Object}
     */
    function exportCampaignJson(campaign) {
        if (!campaign || !campaign.id) return null;

        var state = _gatherState(campaign.id);
        return Object.assign({}, state, {
            exportedAt:  new Date().toISOString(),
            exportedBy:  'BackupManager',
            schemaVersion: '1.0'
        });
    }

    /**
     * Trigger a JSON file download for the campaign.
     * @param {Object} campaign
     */
    function downloadCampaignJson(campaign) {
        var payload  = exportCampaignJson(campaign);
        if (!payload) return;
        var dateStr  = new Date().toISOString().slice(0, 10);
        var filename = 'campaign-' + (campaign.id || 'unknown') + '-' + dateStr + '.json';
        _triggerDownload(JSON.stringify(payload, null, 2), filename, 'application/json');
    }

    /**
     * Build a CSV string of campaign statistics and trigger a download.
     * @param {Object} campaign
     */
    function exportCampaignCSV(campaign) {
        if (!campaign || !campaign.id) return;

        var stats   = calculateCampaignStats(campaign);
        var rows    = [
            ['Stat', 'Value'],
            ['Campaign Name',      campaign.name || campaign.id],
            ['Campaign ID',        campaign.id],
            ['Status',             campaign.status || 'active'],
            ['Total Sessions',     stats.totalSessions],
            ['Total XP Awarded',   stats.totalXP],
            ['Total Loot Items',   stats.totalLoot],
            ['Total Encounters',   stats.totalEncounters],
            ['Total Messages',     stats.totalMessages],
            ['Player Count',       stats.playerCount],
            ['Avg Session (min)',   stats.avgSessionMinutes]
        ];

        var csv      = rows.map(function (r) { return r.map(_csvCell).join(','); }).join('\r\n');
        var dateStr  = new Date().toISOString().slice(0, 10);
        var filename = 'campaign-stats-' + (campaign.id || 'unknown') + '-' + dateStr + '.csv';
        _triggerDownload(csv, filename, 'text/csv');
    }

    function _csvCell(val) {
        var s = String(val === null || val === undefined ? '' : val);
        if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }

    function _triggerDownload(content, filename, mimeType) {
        var blob = new Blob([content], { type: mimeType });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ═════════════════════════════════════════════════════════
    // IMPORT
    // ═════════════════════════════════════════════════════════

    /**
     * Import a campaign from a parsed JSON object.
     * Assigns a new ID to avoid conflicts with existing campaigns.
     * @param {Object}   jsonData  - parsed JSON object
     * @param {Function} [callback]  - called with (null, newId) or (error)
     */
    function importCampaignJson(jsonData, callback) {
        try {
            if (!jsonData || typeof jsonData !== 'object' || Array.isArray(jsonData)) {
                throw new Error('Invalid campaign data: expected a JSON object.');
            }

            var id = jsonData.campaignId || jsonData.id;
            if (!id) {
                throw new Error('Missing campaignId in campaign data.');
            }

            // Assign a new unique ID to avoid conflicts
            var newId   = id + '_imported_' + Date.now();
            var payload = Object.assign({}, jsonData, {
                campaignId: newId,
                id:         newId,
                importedAt: new Date().toISOString(),
                importedFrom: id
            });

            _set(PREFIX + 'campaign_'  + newId, payload);
            _set(PREFIX + 'gameState_' + newId, payload);

            if (callback) callback(null, newId);
        } catch (err) {
            console.error('[BackupManager] importCampaignJson error:', err);
            if (callback) callback(err);
        }
    }

    // ═════════════════════════════════════════════════════════
    // SESSION HISTORY
    // ═════════════════════════════════════════════════════════

    /**
     * Record the start of a play session.
     * @param {Object} campaign
     * @returns {Object}  the new session entry
     */
    function startSession(campaign) {
        if (!campaign || !campaign.id) return null;

        var session = {
            id:         'sess_' + Date.now(),
            campaignId: campaign.id,
            startTime:  Date.now(),
            endTime:    null,
            duration:   null,
            notes:      ''
        };

        var key      = _sessionKey(campaign.id);
        var sessions = _get(key) || [];
        sessions.push(session);
        _set(key, sessions);

        return session;
    }

    /**
     * Mark the end of the most recent open session.
     * @param {Object} campaign
     * @param {string} [notes]  optional session notes
     * @returns {Object|null}  the closed session entry
     */
    function endSession(campaign, notes) {
        if (!campaign || !campaign.id) return null;

        var key      = _sessionKey(campaign.id);
        var sessions = _get(key) || [];
        if (!sessions.length) return null;

        // Find the last open session
        var session = null;
        for (var i = sessions.length - 1; i >= 0; i--) {
            if (!sessions[i].endTime) { session = sessions[i]; break; }
        }
        if (!session) return null;

        session.endTime  = Date.now();
        session.duration = Math.round((session.endTime - session.startTime) / 1000 / 60); // minutes
        session.notes    = notes || '';
        _set(key, sessions);

        return session;
    }

    // ═════════════════════════════════════════════════════════
    // STATISTICS
    // ═════════════════════════════════════════════════════════

    /**
     * Calculate aggregate statistics for a campaign.
     * @param {Object} campaign
     * @returns {Object}  stats object
     */
    function calculateCampaignStats(campaign) {
        if (!campaign || !campaign.id) {
            return { totalSessions: 0, totalXP: 0, totalLoot: 0, totalEncounters: 0, totalMessages: 0, playerCount: 0, avgSessionMinutes: 0 };
        }

        var state    = _gatherState(campaign.id);
        var sessions = _get(_sessionKey(campaign.id)) || [];

        // Session stats
        var completedSessions = sessions.filter(function (s) { return s.endTime; });
        var totalDuration     = completedSessions.reduce(function (sum, s) { return sum + (s.duration || 0); }, 0);
        var avgSession        = completedSessions.length ? Math.round(totalDuration / completedSessions.length) : 0;

        // XP: sum xp from all players
        var players   = state.players || [];
        var totalXP   = players.reduce(function (sum, p) {
            var xp = p.totalXP || p.xp || 0;
            return sum + (typeof xp === 'number' ? xp : 0);
        }, 0);

        // Loot
        var inventory = state.inventory || [];
        var totalLoot = Array.isArray(inventory) ? inventory.length : 0;

        // Encounters from game-state or campaign
        var encounter  = state.activeEncounter || {};
        var enemies    = encounter.enemies || state.enemies || [];
        var totalEnc   = (state.encounterHistory || []).length || (Array.isArray(enemies) ? enemies.length : 0);

        // Messages
        var messages   = state.messages || [];
        var totalMsg   = Array.isArray(messages) ? messages.length : 0;

        return {
            totalSessions:      sessions.length,
            completedSessions:  completedSessions.length,
            totalXP:            totalXP,
            totalLoot:          totalLoot,
            totalEncounters:    totalEnc,
            totalMessages:      totalMsg,
            playerCount:        players.length,
            avgSessionMinutes:  avgSession,
            totalPlayMinutes:   totalDuration
        };
    }

    /**
     * Return a human-readable formatted stats summary string.
     * @param {Object} campaign
     * @returns {string}
     */
    function getStatsSummary(campaign) {
        var s = calculateCampaignStats(campaign);
        return [
            'Campaign: '          + (campaign ? (campaign.name || campaign.id) : 'N/A'),
            'Players: '           + s.playerCount,
            'Sessions: '          + s.totalSessions + ' (' + s.completedSessions + ' completed)',
            'Total Play Time: '   + s.totalPlayMinutes + ' min',
            'Avg Session: '       + s.avgSessionMinutes + ' min',
            'Total XP Awarded: '  + s.totalXP,
            'Inventory Items: '   + s.totalLoot,
            'Encounters: '        + s.totalEncounters,
            'Messages: '          + s.totalMessages
        ].join('\n');
    }

    // ═════════════════════════════════════════════════════════
    // CHARACTER SHEET EXPORT
    // ═════════════════════════════════════════════════════════

    /**
     * Generate an HTML character sheet and trigger a download.
     * @param {Object} character  - player/character object
     */
    function downloadCharacterSheetPdf(character) {
        if (!character) return;

        var name      = character.characterName || character.username || 'Unknown';
        var abilities = character.abilities || [];
        var equipment = character.equipment  || {};
        var stats     = {
            HP:    (character.currentHp  || '?') + '/' + (character.maxHp   || '?'),
            AC:    character.ac       || '?',
            Level: character.level    || 1,
            XP:    character.totalXP  || character.xp || 0
        };

        var abilitiesHtml = abilities.length
            ? abilities.map(function (a) {
                return '<li style="margin:4px 0;">' + _escapeHtml(String(a)) + '</li>';
              }).join('')
            : '<li style="opacity:0.5">None</li>';

        var equipmentHtml = Object.keys(equipment).length
            ? Object.keys(equipment).map(function (slot) {
                var item = equipment[slot];
                return '<tr><td style="padding:4px 8px;border:1px solid #4ade80;opacity:0.7;text-transform:uppercase;font-size:11px;">' +
                    _escapeHtml(slot) + '</td><td style="padding:4px 8px;border:1px solid #4ade80;">' +
                    _escapeHtml(item && item.name ? item.name : String(item)) + '</td></tr>';
              }).join('')
            : '<tr><td colspan="2" style="padding:8px;opacity:0.4;text-align:center;">No equipment</td></tr>';

        var statsHtml = Object.keys(stats).map(function (k) {
            return '<div style="background:rgba(0,0,0,0.4);border:1px solid #4ade80;padding:10px;text-align:center;">' +
                '<div style="font-size:9px;letter-spacing:2px;opacity:0.6;text-transform:uppercase;">' + _escapeHtml(k) + '</div>' +
                '<div style="font-size:18px;font-weight:bold;color:#fbbf24;">' + _escapeHtml(String(stats[k])) + '</div>' +
                '</div>';
        }).join('');

        var html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
            '<title>' + _escapeHtml(name) + ' — Character Sheet</title>' +
            '<style>body{background:#0a0a0a;color:#4ade80;font-family:\'Courier New\',monospace;padding:30px;max-width:800px;margin:0 auto;}' +
            'h1{font-size:24px;letter-spacing:6px;text-transform:uppercase;text-shadow:0 0 15px rgba(74,222,128,0.8);border-bottom:2px solid #4ade80;padding-bottom:12px;margin-bottom:20px;}' +
            'h2{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#fbbf24;margin:20px 0 10px;border-bottom:1px solid rgba(251,191,36,0.3);padding-bottom:6px;}' +
            'table{width:100%;border-collapse:collapse;}' +
            '@media print{body{background:#fff;color:#000;}h1,h2{color:#000;text-shadow:none;}}</style></head>' +
            '<body>' +
            '<h1>&#x1F464; ' + _escapeHtml(name) + '</h1>' +
            '<div style="font-size:10px;letter-spacing:2px;opacity:0.5;margin-bottom:20px;">VAULT 215 — CHARACTER SHEET — Generated ' + new Date().toLocaleString() + '</div>' +
            '<h2>Combat Stats</h2>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:20px;">' + statsHtml + '</div>' +
            '<h2>Abilities</h2>' +
            '<ul style="list-style:none;padding:0;border:1px solid rgba(74,222,128,0.3);padding:12px;">' + abilitiesHtml + '</ul>' +
            '<h2>Equipment</h2>' +
            '<table><tbody>' + equipmentHtml + '</tbody></table>' +
            '</body></html>';

        var filename = 'character-' + (character.characterName || character.username || 'sheet').replace(/\s+/g, '-').toLowerCase() + '.html';
        _triggerDownload(html, filename, 'text/html');
    }

    function _escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ═════════════════════════════════════════════════════════
    // PUBLIC API
    // ═════════════════════════════════════════════════════════

    return {
        createBackup:             createBackup,
        getBackupList:            getBackupList,
        restoreFromBackup:        restoreFromBackup,
        exportCampaignJson:       exportCampaignJson,
        downloadCampaignJson:     downloadCampaignJson,
        exportCampaignCSV:        exportCampaignCSV,
        importCampaignJson:       importCampaignJson,
        startSession:             startSession,
        endSession:               endSession,
        calculateCampaignStats:   calculateCampaignStats,
        getStatsSummary:          getStatsSummary,
        downloadCharacterSheetPdf: downloadCharacterSheetPdf
    };

}());
