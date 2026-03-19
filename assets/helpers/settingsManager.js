// ═══════════════════════════════════════════════════════════
// VAULT 215 — SETTINGS MANAGER
// assets/helpers/settingsManager.js
//
// Manages player preferences with localStorage + accounts.js fallback.
// Preferences are keyed per-user so multiple players share one browser.
// ═══════════════════════════════════════════════════════════

const SettingsManager = {

    // ── Default preferences ──────────────────────────────────────
    _defaults: {
        displayColor:         '#4ade80',
        displayName:          '',
        theme:                'dark',    // dark / light / auto
        font:                 'monospace', // monospace / sans-serif / serif
        soundEnabled:         true,
        notificationsEnabled: true
    },

    // Font family CSS map
    _fontMap: {
        'monospace':  "'Courier New', monospace",
        'sans-serif': "'Segoe UI', Arial, sans-serif",
        'serif':      "'Georgia', 'Times New Roman', serif"
    },

    // ── Internal helpers ─────────────────────────────────────────

    /** Return the localStorage key scoped to the given username. */
    _storageKey: function(username) {
        return 'vaultPrefs_' + (username || 'guest');
    },

    /** Return the currently logged-in username from sessionStorage. */
    _currentUser: function() {
        return sessionStorage.getItem('username') || null;
    },

    // ── Public API ───────────────────────────────────────────────

    /**
     * Get a single preference value, with a default fallback.
     * @param {string} key
     * @param {*} defaultValue
     */
    getSetting: function(key, defaultValue) {
        var all = this.getAllSettings();
        return (all[key] !== undefined) ? all[key] : defaultValue;
    },

    /**
     * Save a single preference to localStorage.
     * @param {string} key
     * @param {*} value
     */
    saveSetting: function(key, value) {
        var all = this.getAllSettings();
        all[key] = value;
        this.saveAllSettings(all);
    },

    /**
     * Save all preferences at once to localStorage.
     * @param {Object} preferencesObj
     */
    saveAllSettings: function(preferencesObj) {
        var username = this._currentUser();
        var key = this._storageKey(username);
        try {
            localStorage.setItem(key, JSON.stringify(preferencesObj));
        } catch(e) {
            console.warn('SettingsManager: could not write to localStorage', e);
        }
    },

    /**
     * Load all preferences for the given username.
     * Falls back to accounts.js preferences, then built-in defaults.
     * @param {string} username
     * @returns {Object}
     */
    loadUserSettings: function(username) {
        // 1. Try localStorage
        try {
            var raw = localStorage.getItem(this._storageKey(username));
            if (raw) {
                return Object.assign({}, this._defaults, JSON.parse(raw));
            }
        } catch(e) { /* ignore */ }

        // 2. Fallback to accounts.js
        if (typeof ACCOUNTS !== 'undefined') {
            var account = ACCOUNTS.find(function(a) { return a.username === username; });
            if (account && account.preferences) {
                return Object.assign({}, this._defaults, account.preferences);
            }
        }

        // 3. Return defaults
        return Object.assign({}, this._defaults);
    },

    /**
     * Apply preferences to the current page via CSS custom properties and
     * body class / font-family changes.
     * @param {Object} preferences
     */
    applySettingsToPage: function(preferences) {
        if (!preferences) return;
        var root = document.documentElement;

        // Player color
        if (preferences.displayColor) {
            root.style.setProperty('--player-color', preferences.displayColor);
        }

        // Theme
        var theme = preferences.theme || 'dark';
        if (theme === 'auto') {
            theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
                ? 'light' : 'dark';
        }
        document.body.classList.toggle('theme-light', theme === 'light');
        document.body.classList.toggle('theme-dark',  theme !== 'light');

        // Font family
        if (preferences.font && this._fontMap[preferences.font]) {
            document.body.style.fontFamily = this._fontMap[preferences.font];
        }
    },

    /**
     * Remove all stored preferences for the current user (reset to defaults).
     */
    clearAllSettings: function() {
        var username = this._currentUser();
        var key = this._storageKey(username);
        localStorage.removeItem(key);
    },

    /**
     * Return all preferences for the currently logged-in user.
     * @returns {Object}
     */
    getAllSettings: function() {
        var username = this._currentUser();
        if (!username) return Object.assign({}, this._defaults);
        return this.loadUserSettings(username);
    }
};

// Auto-apply settings as soon as the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('username')) {
        SettingsManager.applySettingsToPage(SettingsManager.getAllSettings());
    }
});
