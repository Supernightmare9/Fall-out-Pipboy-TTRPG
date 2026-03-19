// ═══════════════════════════════════════════════════════════
// VAULT 215 — STORAGE MANAGER
// assets/helpers/storageManager.js
//
// Comprehensive data persistence for campaign data, combat
// state, and game progress. Uses localStorage as the primary
// store with campaigns.js as the source-of-truth fallback.
//
// Key prefix: vault215_
//   vault215_campaign_{id}       - Campaign snapshot (players, HP)
//   vault215_gameState_{id}      - Full game state snapshot
//   vault215_encounter_{id}      - Active encounter / combat state
//   vault215_session_{username}  - Player session (HP, campaign, etc.)
//   vault215_saveHistory_{id}    - Array of recent save metadata
// ═══════════════════════════════════════════════════════════

var StorageManager = {

    // ── Internal constants ────────────────────────────────────
    _PREFIX: 'vault215_',
    _VERSION: '1.0',
    _MAX_HISTORY: 10,
    _autoSaveInterval: null,
    _autoSaveCampaignId: null,
    _lastSaveHash: null,

    // ── Internal key helpers ──────────────────────────────────
    _keys: {
        campaign:    function(id)       { return 'vault215_campaign_'    + id; },
        gameState:   function(id)       { return 'vault215_gameState_'   + id; },
        encounter:   function(id)       { return 'vault215_encounter_'   + id; },
        session:     function(username) { return 'vault215_session_'     + username; },
        saveHistory: function(id)       { return 'vault215_saveHistory_' + id; },
        // Overseer page's internal save key (read-only from StorageManager context)
        overseerCombat: function(id)    { return 'vault215_overseer_campaign_' + id; }
    },

    // ── Low-level localStorage helpers ───────────────────────

    _set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('[StorageManager] Write failed for key "' + key + '":', e);
            return false;
        }
    },

    _get: function(key) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn('[StorageManager] Read/parse failed for key "' + key + '":', e);
            return null;
        }
    },

    _remove: function(key) {
        try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    },

    _log: function(action, detail) {
        console.log('[StorageManager] ' + action + (detail ? ': ' + detail : ''));
    },

    // Cheap hash to detect data changes between auto-save ticks
    _hash: function(data) {
        var str = JSON.stringify(data);
        var h = 0;
        for (var i = 0; i < str.length; i++) {
            h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
        }
        return h;
    },

    // ═════════════════════════════════════════════════════════
    // CAMPAIGN DATA PERSISTENCE
    // ═════════════════════════════════════════════════════════

    /**
     * Save entire campaign state to localStorage.
     * @param {string} campaignId
     * @param {Object} campaignData
     */
    saveCampaign: function(campaignId, campaignData) {
        if (!campaignId || !campaignData) return false;
        var payload = Object.assign({}, campaignData, {
            campaignId: campaignId,
            timestamp:  Date.now(),
            version:    this._VERSION
        });
        var ok = this._set(this._keys.campaign(campaignId), payload);
        if (ok) this._log('saveCampaign', campaignId);
        return ok;
    },

    /**
     * Load campaign state, merging localStorage over campaigns.js base.
     * @param {string} campaignId
     * @returns {Object|null}
     */
    loadCampaign: function(campaignId) {
        if (!campaignId) return null;

        // 1. Try localStorage snapshot
        var stored = this._get(this._keys.campaign(campaignId));

        // 2. Try campaigns.js base data
        var base = null;
        if (typeof CAMPAIGNS !== 'undefined') {
            base = CAMPAIGNS.find(function(c) { return c.id === campaignId; }) || null;
        }

        if (!stored && !base) return null;
        if (!stored) return JSON.parse(JSON.stringify(base));

        // Merge: localStorage overlays on top of base
        var merged = base ? Object.assign(JSON.parse(JSON.stringify(base)), stored) : stored;
        this._log('loadCampaign', campaignId);
        return merged;
    },

    /**
     * Save just the active combat encounter.
     * @param {string} campaignId
     * @param {Object} encounter
     */
    saveEncounter: function(campaignId, encounter) {
        if (!campaignId || !encounter) return false;
        var payload = Object.assign({}, encounter, {
            campaignId: campaignId,
            timestamp:  Date.now()
        });
        var ok = this._set(this._keys.encounter(campaignId), payload);
        if (ok) this._log('saveEncounter', 'campaign=' + campaignId + ' round=' + encounter.round + ' status=' + encounter.status);
        return ok;
    },

    /**
     * Load combat encounter from localStorage.
     * @param {string} campaignId
     * @returns {Object}
     */
    loadEncounter: function(campaignId) {
        if (!campaignId) return this._emptyEncounter();

        // Try the dedicated encounter key first
        var enc = this._get(this._keys.encounter(campaignId));
        if (enc && this._validateEncounter(enc)) {
            this._log('loadEncounter', campaignId);
            return enc;
        }

        // Fall back to the overseer page's own combat save key
        var overseerSave = this._get(this._keys.overseerCombat(campaignId));
        if (overseerSave && overseerSave.activeEncounter) {
            return overseerSave.activeEncounter;
        }

        return this._emptyEncounter();
    },

    _emptyEncounter: function() {
        return { enemies: [], combatants: [], round: 1, status: 'inactive', startTime: null };
    },

    _validateEncounter: function(enc) {
        return enc &&
            Array.isArray(enc.enemies) &&
            Array.isArray(enc.combatants) &&
            typeof enc.round === 'number' &&
            typeof enc.status === 'string';
    },

    // ═════════════════════════════════════════════════════════
    // PLAYER SESSION DATA
    // ═════════════════════════════════════════════════════════

    /**
     * Save player session data (current campaign, HP, combat state).
     * @param {string} username
     * @param {Object} sessionData  { currentCampaign, currentHp, maxHp, inCombat }
     */
    savePlayerSession: function(username, sessionData) {
        if (!username || !sessionData) return false;
        var payload = Object.assign({}, sessionData, {
            username:  username,
            timestamp: Date.now()
        });
        var ok = this._set(this._keys.session(username), payload);
        if (ok) this._log('savePlayerSession', username);
        return ok;
    },

    /**
     * Load player session data.
     * @param {string} username
     * @returns {Object|null}
     */
    loadPlayerSession: function(username) {
        if (!username) return null;
        var session = this._get(this._keys.session(username));
        if (session) this._log('loadPlayerSession', username + ' campaign=' + session.currentCampaign);
        return session;
    },

    // ═════════════════════════════════════════════════════════
    // AUTO-SAVE SYSTEM
    // ═════════════════════════════════════════════════════════

    /**
     * Enable auto-save. Saves the current state every `interval` ms.
     * Only writes if data has actually changed.
     * @param {string} campaignId
     * @param {number} interval  milliseconds (default 30000)
     */
    enableAutoSave: function(campaignId, interval) {
        if (!campaignId) return;
        interval = interval || 30000;

        // Clear any existing interval
        this.disableAutoSave();

        this._autoSaveCampaignId = campaignId;
        var self = this;

        this._autoSaveInterval = setInterval(function() {
            var currentData = self._gatherCurrentState(campaignId);
            var currentHash = self._hash(currentData);

            if (currentHash !== self._lastSaveHash) {
                self.saveGameState(campaignId, currentData);
                self._lastSaveHash = currentHash;
                self._log('autoSave', 'saved campaign=' + campaignId);
            } else {
                self._log('autoSave', 'no changes, skipping campaign=' + campaignId);
            }
        }, interval);

        this._log('enableAutoSave', 'campaign=' + campaignId + ' interval=' + interval + 'ms');
    },

    /**
     * Disable auto-save and perform a final save.
     */
    disableAutoSave: function() {
        if (this._autoSaveInterval) {
            clearInterval(this._autoSaveInterval);
            this._autoSaveInterval = null;
            this._log('disableAutoSave', 'interval cleared');
        }
    },

    /**
     * Manual save on demand.
     * @param {string} campaignId
     * @returns {number} timestamp of save
     */
    manualSave: function(campaignId) {
        if (!campaignId) return null;
        var state = this._gatherCurrentState(campaignId);
        this.saveGameState(campaignId, state);
        var ts = state.timestamp;
        this._log('manualSave', 'campaign=' + campaignId + ' ts=' + ts);
        return ts;
    },

    /**
     * Gather the current game state from all available localStorage sources.
     * Reads the overseer's combat save key and the character page's campaign key.
     * @param {string} campaignId
     * @returns {Object}
     */
    _gatherCurrentState: function(campaignId) {
        var overseerSave = this._get(this._keys.overseerCombat(campaignId)) || {};
        var campaignSave = this._get(this._keys.campaign(campaignId)) || {};
        var encounterSave = this._get(this._keys.encounter(campaignId)) || null;

        // Get base campaign from campaigns.js if available
        var base = null;
        if (typeof CAMPAIGNS !== 'undefined') {
            base = CAMPAIGNS.find(function(c) { return c.id === campaignId; }) || null;
        }

        var activeEncounter = encounterSave ||
            overseerSave.activeEncounter ||
            (base && base.activeEncounter) ||
            this._emptyEncounter();

        return {
            campaignId:      campaignId,
            campaign:        campaignSave.campaign || base || null,
            activeEncounter: activeEncounter,
            combatants:      activeEncounter.combatants || [],
            round:           activeEncounter.round || 1,
            combatLog:       overseerSave._combatLog || [],
            timestamp:       Date.now(),
            version:         this._VERSION
        };
    },

    // ═════════════════════════════════════════════════════════
    // GAME STATE MANAGEMENT
    // ═════════════════════════════════════════════════════════

    /**
     * Save full game state snapshot.
     * @param {string} campaignId
     * @param {Object} state
     */
    saveGameState: function(campaignId, state) {
        if (!campaignId || !state) return false;
        var payload = Object.assign({}, state, {
            campaignId: campaignId,
            timestamp:  state.timestamp || Date.now(),
            version:    this._VERSION
        });
        var ok = this._set(this._keys.gameState(campaignId), payload);
        if (ok) this._addToSaveHistory(campaignId, payload.timestamp, JSON.stringify(payload).length);
        if (ok) this._log('saveGameState', 'campaign=' + campaignId);
        return ok;
    },

    /**
     * Load full game state.
     * @param {string} campaignId
     * @returns {Object|null}
     */
    loadGameState: function(campaignId) {
        if (!campaignId) return null;
        var state = this._get(this._keys.gameState(campaignId));
        if (!state) return null;

        // Version compatibility check
        if (state.version && state.version !== this._VERSION) {
            this._log('loadGameState', 'version mismatch: stored=' + state.version + ' expected=' + this._VERSION);
        }

        this._log('loadGameState', 'campaign=' + campaignId);
        return state;
    },

    // ═════════════════════════════════════════════════════════
    // DATA SYNC & RECOVERY
    // ═════════════════════════════════════════════════════════

    /**
     * Sync localStorage with campaigns.js.
     * If localStorage is newer, it is kept. If campaigns.js is newer (fresh page
     * load without local changes), localStorage is refreshed from it.
     * @param {string} campaignId
     */
    syncWithServer: function(campaignId) {
        if (!campaignId) return;

        var stored = this._get(this._keys.campaign(campaignId));
        var base = null;
        if (typeof CAMPAIGNS !== 'undefined') {
            base = CAMPAIGNS.find(function(c) { return c.id === campaignId; }) || null;
        }

        if (!base) {
            this._log('syncWithServer', 'no base data in campaigns.js for ' + campaignId);
            return;
        }

        if (!stored) {
            // Nothing in localStorage — seed from campaigns.js
            this.saveCampaign(campaignId, base);
            this._log('syncWithServer', 'seeded from campaigns.js campaign=' + campaignId);
            return;
        }

        // Compare timestamps: prefer newer data
        var storedTs = stored.timestamp  || 0;
        var baseTs   = base.lastModified || base.createdAt || 0;

        if (baseTs > storedTs) {
            this.saveCampaign(campaignId, base);
            this._log('syncWithServer', 'campaigns.js is newer, refreshed localStorage campaign=' + campaignId);
        } else {
            this._log('syncWithServer', 'localStorage is newer, keeping existing data campaign=' + campaignId);
        }
    },

    /**
     * Attempt to recover the last known-good state from save history.
     * @param {string} campaignId
     * @returns {Object|null}
     */
    recoverData: function(campaignId) {
        if (!campaignId) return null;

        // Try full game state first
        var gs = this.loadGameState(campaignId);
        if (gs) {
            this._log('recoverData', 'recovered from gameState campaign=' + campaignId);
            return gs;
        }

        // Try campaign snapshot
        var cs = this._get(this._keys.campaign(campaignId));
        if (cs) {
            this._log('recoverData', 'recovered from campaign snapshot campaign=' + campaignId);
            return cs;
        }

        // Fall back to campaigns.js
        if (typeof CAMPAIGNS !== 'undefined') {
            var base = CAMPAIGNS.find(function(c) { return c.id === campaignId; });
            if (base) {
                this._log('recoverData', 'fell back to campaigns.js for campaign=' + campaignId);
                return base;
            }
        }

        this._log('recoverData', 'no recoverable data found for campaign=' + campaignId);
        return null;
    },

    /**
     * Get the list of recent saves (metadata only).
     * @param {string} campaignId
     * @param {number} limit  max entries to return (default 10)
     * @returns {Array}
     */
    getSaveHistory: function(campaignId, limit) {
        if (!campaignId) return [];
        limit = limit || this._MAX_HISTORY;
        var history = this._get(this._keys.saveHistory(campaignId)) || [];
        return history.slice(0, limit);
    },

    _addToSaveHistory: function(campaignId, timestamp, size) {
        var key     = this._keys.saveHistory(campaignId);
        var history = this._get(key) || [];
        history.unshift({ timestamp: timestamp, size: size, version: this._VERSION });
        if (history.length > this._MAX_HISTORY) history = history.slice(0, this._MAX_HISTORY);
        this._set(key, history);
    },

    // ═════════════════════════════════════════════════════════
    // EXPORT / IMPORT
    // ═════════════════════════════════════════════════════════

    /**
     * Export campaign as a JSON download.
     * @param {string} campaignId
     */
    exportCampaign: function(campaignId) {
        if (!campaignId) return;
        var state = this._gatherCurrentState(campaignId);
        state.exportedAt = new Date().toISOString();
        state.version    = this._VERSION;

        var dateStr  = new Date().toISOString().slice(0, 10);
        var filename = 'campaign-' + campaignId + '-' + dateStr + '.json';
        var blob     = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        var url      = URL.createObjectURL(blob);
        var a        = document.createElement('a');
        a.href       = url;
        a.download   = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this._log('exportCampaign', 'downloaded ' + filename);
    },

    /**
     * Import a campaign from a JSON file (File object or input event target).
     * Validates structure then loads into localStorage.
     * @param {File} file
     * @param {Function} [callback]  called with (null, campaignId) on success, (error) on failure
     */
    importCampaign: function(file, callback) {
        var self = this;
        if (!file || !file.name) {
            var msg = '[StorageManager] importCampaign: no file provided';
            console.error(msg);
            if (callback) callback(new Error(msg));
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);

                // Validate required fields
                if (!data.campaignId && !data.id) {
                    throw new Error('Missing campaignId in imported file.');
                }

                var id = data.campaignId || data.id;

                // Version check (warn but continue)
                if (data.version && data.version !== self._VERSION) {
                    console.warn('[StorageManager] Importing version ' + data.version + ' into ' + self._VERSION);
                }

                // Save the imported data into our storage keys
                self._set(self._keys.gameState(id), data);
                if (data.campaign)        self._set(self._keys.campaign(id), data.campaign);
                if (data.activeEncounter) self._set(self._keys.encounter(id), data.activeEncounter);

                self._log('importCampaign', 'imported campaign=' + id);
                if (callback) callback(null, id);
            } catch (err) {
                console.error('[StorageManager] importCampaign parse error:', err);
                if (callback) callback(err);
            }
        };
        reader.onerror = function() {
            var err = new Error('Failed to read file.');
            console.error('[StorageManager] importCampaign read error:', err);
            if (callback) callback(err);
        };
        reader.readAsText(file);
    },

    // ═════════════════════════════════════════════════════════
    // CLEANUP & MAINTENANCE
    // ═════════════════════════════════════════════════════════

    /**
     * Delete localStorage entries older than `daysOld` days.
     * Inspects any stored object with a `timestamp` field.
     * @param {number} daysOld  (default 30)
     */
    clearOldData: function(daysOld) {
        daysOld = (typeof daysOld === 'number') ? daysOld : 30;
        var cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        var removed = 0;
        var prefix  = this._PREFIX;

        for (var i = localStorage.length - 1; i >= 0; i--) {
            var k = localStorage.key(i);
            if (!k || k.indexOf(prefix) !== 0) continue;
            try {
                var v = JSON.parse(localStorage.getItem(k));
                if (v && typeof v.timestamp === 'number' && v.timestamp < cutoff) {
                    localStorage.removeItem(k);
                    removed++;
                }
            } catch (e) { /* skip unparseable entries */ }
        }

        this._log('clearOldData', 'removed ' + removed + ' entries older than ' + daysOld + ' days');
        return removed;
    },

    /**
     * Clear all localStorage entries for a specific campaign.
     * Does NOT remove the base entry in campaigns.js (that is read-only at runtime).
     * @param {string} campaignId
     */
    clearCampaignData: function(campaignId) {
        if (!campaignId) return;
        this._remove(this._keys.campaign(campaignId));
        this._remove(this._keys.gameState(campaignId));
        this._remove(this._keys.encounter(campaignId));
        this._remove(this._keys.saveHistory(campaignId));
        this._remove(this._keys.overseerCombat(campaignId));
        this._log('clearCampaignData', 'cleared all localStorage for campaign=' + campaignId);
    },

    /**
     * Get current localStorage usage statistics.
     * @returns {Object}  { totalSize, campaignsCount, lastSave, availableSpace }
     */
    getStorageStats: function() {
        var totalSize      = 0;
        var campaignsCount = 0;
        var lastSave       = 0;
        var prefix         = this._PREFIX;

        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (!k) continue;
            var v = localStorage.getItem(k);
            totalSize += (k.length + (v ? v.length : 0)) * 2; // UTF-16 bytes
            if (k.indexOf(prefix) === 0) {
                campaignsCount++;
                try {
                    var parsed = JSON.parse(v);
                    if (parsed && typeof parsed.timestamp === 'number' && parsed.timestamp > lastSave) {
                        lastSave = parsed.timestamp;
                    }
                } catch (e) { /* skip */ }
            }
        }

        // Estimate available space (most browsers allow ~5-10 MB)
        var estimatedQuota   = 5 * 1024 * 1024; // 5 MB conservative estimate
        var availableSpace   = Math.max(0, estimatedQuota - totalSize);

        return {
            totalSize:      totalSize,
            campaignsCount: campaignsCount,
            lastSave:       lastSave || null,
            availableSpace: availableSpace
        };
    },

    // ═════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═════════════════════════════════════════════════════════

    /**
     * Check whether data exists for a given raw localStorage key.
     * @param {string} key
     * @returns {boolean}
     */
    hasData: function(key) {
        try {
            return localStorage.getItem(key) !== null;
        } catch (e) {
            return false;
        }
    },

    /**
     * Validate data object against a simple schema.
     * Schema format: { fieldName: 'type' }  e.g. { campaignId: 'string', round: 'number' }
     * @param {Object} data
     * @param {Object} schema
     * @returns {boolean}
     */
    validateData: function(data, schema) {
        if (!data || typeof data !== 'object') return false;
        if (!schema || typeof schema !== 'object') return true;
        var keys = Object.keys(schema);
        for (var i = 0; i < keys.length; i++) {
            var field    = keys[i];
            var expected = schema[field];
            if (typeof data[field] !== expected) return false;
        }
        return true;
    },

    /**
     * Compress data to a Base64-encoded JSON string (lightweight, no external deps).
     * @param {*} data
     * @returns {string}
     */
    compressData: function(data) {
        try {
            return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        } catch (e) {
            console.warn('[StorageManager] compressData failed:', e);
            return JSON.stringify(data);
        }
    },

    /**
     * Decompress data previously compressed with compressData().
     * @param {string} compressed
     * @returns {*}
     */
    decompressData: function(compressed) {
        try {
            return JSON.parse(decodeURIComponent(escape(atob(compressed))));
        } catch (e) {
            // May already be plain JSON
            try { return JSON.parse(compressed); } catch (e2) { return null; }
        }
    }

};
