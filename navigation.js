/* ===========================
   VAULT 215 NAVIGATION SYSTEM
   navigation.js
   Shared bottom nav + settings
   =========================== */

(function () {
    'use strict';

    /* ---- Configuration ---- */

    // Pages on which the nav bar should NOT appear
    var SKIP_PAGES = ['index.html', 'login_hub.html', 'terminal.html', ''];

        // Player navigation buttons (left → right)
    var PLAYER_NAV = [
        { id: 'stats',     icon: '📊', label: 'STATS',     href: 'stats.html' },
        { id: 'inventory', icon: '🎒', label: 'INVENTORY', href: 'inventory.html' },
        { id: 'home',      icon: '🏠', label: 'HOME',      href: 'character-dashboard.html', isHome: true },
        { id: 'messages',  icon: '💬', label: 'MESSAGES',  href: 'messages.html' },
        { id: 'settings',  icon: '⚙️', label: 'SETTINGS',  isSettings: true }
    ];

    // Overseer navigation buttons (left → right)
    var OVERSEER_NAV = [
        { id: 'players',  icon: '📊', label: 'PLAYERS',  href: '#overseer-characters', isAnchor: true },
        { id: 'items',    icon: '🎒', label: 'ITEMS',     href: '#overseer-campaign',   isAnchor: true },
        { id: 'home',     icon: '🏠', label: 'HOME',      href: 'overseer.html',        isHome: true },
        { id: 'messages', icon: '💬', label: 'MESSAGES',  href: '#overseer-messages',   isAnchor: true },
        { id: 'settings', icon: '⚙️', label: 'SETTINGS',  isSettings: true }
    ];

    // Map page filename → active button id
    var PLAYER_ACTIVE_MAP = {
        'stats.html':               'stats',
        'inventory.html':           'inventory',
        'character-dashboard.html': 'home',
        'character.html':           'home',
        'data.html':                'home'
    };

    /* ---- Helpers ---- */

    function getCurrentPage() {
        var path = window.location.pathname;
        var parts = path.split('/').filter(Boolean);
        return parts.pop() || 'index.html';
    }

    function getNavType() {
        return getCurrentPage() === 'overseer.html' ? 'overseer' : 'player';
    }

    function getActiveId() {
        var page = getCurrentPage();
        var hash = window.location.hash;

        if (page === 'overseer.html') {
            if (hash === '#overseer-characters') return 'players';
            if (hash === '#overseer-campaign')   return 'items';
            if (hash === '#overseer-messages')   return 'messages';
            return 'home';
        }

        // On stats.html with messages hash → Messages button active
        if (page === 'stats.html' && hash === '#messages') {
            return 'messages';
        }

        return PLAYER_ACTIVE_MAP[page] || null;
    }

    /* ---- Build HTML ---- */

    function escAttr(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function buildNavHTML(items, theme, activeId) {
        var html = '<nav class="pipboy-nav" id="pipboyNav" data-theme="' + escAttr(theme) + '" role="navigation" aria-label="Main navigation">';

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var cls = 'pipboy-nav-btn';
            if (item.isHome)          cls += ' pipboy-nav-home';
            if (item.id === activeId) cls += ' active';

            // data-id is embedded in the HTML so updateNavActiveState can find buttons immediately
            var dataId = ' data-id="' + escAttr(item.id) + '"';

            if (item.isSettings) {
                html += '<button class="' + cls + '"' + dataId + ' id="pipboySettingsBtn" onclick="openPipboySettings()" aria-label="Open Settings">' +
                    '<span class="pipboy-nav-icon" aria-hidden="true">' + item.icon + '</span>' +
                    '<span class="pipboy-nav-label">' + item.label + '</span>' +
                '</button>';
            } else if (item.isAnchor) {
                html += '<button class="' + cls + '"' + dataId + ' onclick="pipboyNavToAnchor(' + JSON.stringify(item.href) + ')" aria-label="Navigate to ' + escAttr(item.label) + '">' +
                    '<span class="pipboy-nav-icon" aria-hidden="true">' + item.icon + '</span>' +
                    '<span class="pipboy-nav-label">' + item.label + '</span>' +
                '</button>';
            } else {
                html += '<button class="' + cls + '"' + dataId + ' onclick="pipboyNavTo(' + JSON.stringify(item.href) + ')" aria-label="Navigate to ' + escAttr(item.label) + '">' +
                    '<span class="pipboy-nav-icon" aria-hidden="true">' + item.icon + '</span>' +
                    '<span class="pipboy-nav-label">' + item.label + '</span>' +
                '</button>';
            }
        }

        html += '</nav>';
        return html;
    }

    function buildSettingsHTML(theme) {
        var t = escAttr(theme);
        return (
            '<div class="pipboy-settings-overlay" id="pipboySettingsOverlay" onclick="handlePipboyOverlayClick(event)">' +
                '<div class="pipboy-settings-panel" id="pipboySettingsPanel" data-theme="' + t + '">' +
                    '<div class="pipboy-settings-header">' +
                        '<span class="pipboy-settings-title">⚙ SETTINGS</span>' +
                        '<button class="pipboy-settings-close" onclick="closePipboySettings()">✕ CLOSE</button>' +
                    '</div>' +
                    '<div class="pipboy-settings-body">' +

                        /* ---- Volume Controls ---- */
                        '<div class="pipboy-settings-section">' +
                            '<div class="pipboy-settings-section-title">◈ Volume Controls</div>' +

                            '<div class="pipboy-settings-row">' +
                                '<span class="pipboy-settings-label">MASTER</span>' +
                                '<input type="range" class="pipboy-settings-slider" id="settingMasterVol" min="0" max="100" value="80" ' +
                                    'oninput="pipboyUpdateSlider(this,\'masterVolVal\')" aria-label="Master Volume">' +
                                '<span class="pipboy-settings-slider-value" id="masterVolVal">80%</span>' +
                            '</div>' +

                            '<div class="pipboy-settings-row">' +
                                '<span class="pipboy-settings-label">MUSIC</span>' +
                                '<input type="range" class="pipboy-settings-slider" id="settingMusicVol" min="0" max="100" value="60" ' +
                                    'oninput="pipboyUpdateSlider(this,\'musicVolVal\')" aria-label="Music Volume">' +
                                '<span class="pipboy-settings-slider-value" id="musicVolVal">60%</span>' +
                            '</div>' +

                            '<div class="pipboy-settings-row">' +
                                '<span class="pipboy-settings-label">SFX</span>' +
                                '<input type="range" class="pipboy-settings-slider" id="settingSfxVol" min="0" max="100" value="75" ' +
                                    'oninput="pipboyUpdateSlider(this,\'sfxVolVal\')" aria-label="SFX Volume">' +
                                '<span class="pipboy-settings-slider-value" id="sfxVolVal">75%</span>' +
                            '</div>' +

                            '<div class="pipboy-settings-row">' +
                                '<span class="pipboy-settings-label">VOICES</span>' +
                                '<input type="range" class="pipboy-settings-slider" id="settingVoiceVol" min="0" max="100" value="85" ' +
                                    'oninput="pipboyUpdateSlider(this,\'voiceVolVal\')" aria-label="Voice Volume">' +
                                '<span class="pipboy-settings-slider-value" id="voiceVolVal">85%</span>' +
                            '</div>' +
                        '</div>' +

                        /* ---- Display Options ---- */
                        '<div class="pipboy-settings-section">' +
                            '<div class="pipboy-settings-section-title">◈ Display Options</div>' +

                            '<div class="pipboy-settings-row">' +
                                '<span class="pipboy-settings-label">BRIGHTNESS</span>' +
                                '<input type="range" class="pipboy-settings-slider" id="settingBrightness" min="50" max="150" value="100" ' +
                                    'oninput="pipboyUpdateBrightness(this)" aria-label="Brightness">' +
                                '<span class="pipboy-settings-slider-value" id="brightnessVal">100%</span>' +
                            '</div>' +

                            '<div class="pipboy-settings-row">' +
                                '<span class="pipboy-settings-label">SCANLINES</span>' +
                                '<button class="pipboy-settings-toggle on" id="settingScanlinesToggle" ' +
                                    'onclick="pipboyToggleScanlines()" aria-pressed="true">ON</button>' +
                            '</div>' +

                            '<div class="pipboy-settings-row">' +
                                '<span class="pipboy-settings-label">COLOR MODE</span>' +
                                '<select class="pipboy-settings-select" id="settingColorMode" ' +
                                    'onchange="pipboyApplyColorMode(this.value)" aria-label="Color Mode">' +
                                    '<option value="normal">NORMAL</option>' +
                                    '<option value="sepia">SEPIA</option>' +
                                    '<option value="blue">BLUE TINT</option>' +
                                    '<option value="amber">AMBER</option>' +
                                '</select>' +
                            '</div>' +

                            '<div class="pipboy-settings-row">' +
                                '<span class="pipboy-settings-label">FONT SIZE</span>' +
                                '<select class="pipboy-settings-select" id="settingFontSize" ' +
                                    'onchange="pipboyApplyFontSize(this.value)" aria-label="Font Size">' +
                                    '<option value="small">SMALL</option>' +
                                    '<option value="medium" selected>MEDIUM</option>' +
                                    '<option value="large">LARGE</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +

                        /* ---- Account ---- */
                        '<div class="pipboy-settings-section">' +
                            '<div class="pipboy-settings-section-title">◈ Account</div>' +
                            '<div class="pipboy-settings-info" id="settingCharName">CHARACTER: —</div>' +
                            '<div class="pipboy-settings-info" id="settingCampaignName">CAMPAIGN: —</div>' +
                            '<br>' +
                            '<button class="pipboy-settings-btn" onclick="pipboyLogout()">⬡ LOGOUT</button>' +
                            '<button class="pipboy-settings-btn danger" onclick="pipboyConfirmDeleteChar()">⚠ DELETE CHARACTER</button>' +
                        '</div>' +

                    '</div>' +
                '</div>' +
            '</div>'
        );
    }

    /* ---- Inject stylesheet ---- */

    function injectStylesheet() {
        if (document.getElementById('pipboyNavCSS')) return;
        // Resolve the path relative to this script's location
        var scripts = document.querySelectorAll('script');
        var base = '';
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || '';
            if (src.indexOf('navigation.js') !== -1) {
                base = src.replace('navigation.js', '');
                break;
            }
        }
        var link = document.createElement('link');
        link.id   = 'pipboyNavCSS';
        link.rel  = 'stylesheet';
        link.href = base + 'navigation.css';
        document.head.appendChild(link);
    }

    /* ---- Navigation handlers (global) ---- */

    window.pipboyNavTo = function (href) {
        window.location.href = href;
    };

    window.pipboyNavToAnchor = function (anchor) {
        // If anchor target is on the current page, smooth-scroll
        var page = getCurrentPage();
        if (page === 'overseer.html' || anchor.charAt(0) === '#') {
            var id = anchor.replace('#', '');
            var target = document.getElementById(id);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.replaceState(window.history.state || {}, '', anchor);
                updateNavActiveState(anchor.split('#')[1] ? getActiveIdFromAnchor(anchor) : null);
                return;
            }
        }
        window.location.href = anchor;
    };

    function getActiveIdFromAnchor(anchor) {
        var map = {
            'overseer-characters': 'players',
            'overseer-campaign':   'items',
            'overseer-messages':   'messages'
        };
        var hash = anchor.replace('#', '');
        return map[hash] || 'home';
    }

    function updateNavActiveState(activeId) {
        var btns = document.querySelectorAll('.pipboy-nav-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.remove('active');
        }
        if (activeId) {
            var active = document.querySelector('.pipboy-nav-btn[data-id="' + activeId + '"]');
            if (active) active.classList.add('active');
        }
    }

    /* ---- Settings Panel (global) ---- */

    window.openPipboySettings = function () {
        var overlay = document.getElementById('pipboySettingsOverlay');
        if (!overlay) return;
        overlay.classList.add('open');
        loadSettingsUI();
    };

    window.closePipboySettings = function () {
        var overlay = document.getElementById('pipboySettingsOverlay');
        if (!overlay) return;
        overlay.classList.remove('open');
        saveSettings();
    };

    window.handlePipboyOverlayClick = function (e) {
        if (e.target && e.target.id === 'pipboySettingsOverlay') {
            closePipboySettings();
        }
    };

    /* ---- Settings controls (global) ---- */

    window.pipboyUpdateSlider = function (slider, valueId) {
        var el = document.getElementById(valueId);
        if (el) el.textContent = slider.value + '%';
        saveSettings();
    };

    window.pipboyUpdateBrightness = function (slider) {
        var el = document.getElementById('brightnessVal');
        if (el) el.textContent = slider.value + '%';
        applyBrightness(Number(slider.value));
        saveSettings();
    };

    window.pipboyToggleScanlines = function () {
        var btn = document.getElementById('settingScanlinesToggle');
        if (!btn) return;
        var on = btn.classList.contains('on');
        if (on) {
            btn.classList.remove('on');
            btn.textContent = 'OFF';
            btn.setAttribute('aria-pressed', 'false');
            document.body.classList.add('no-scanlines');
        } else {
            btn.classList.add('on');
            btn.textContent = 'ON';
            btn.setAttribute('aria-pressed', 'true');
            document.body.classList.remove('no-scanlines');
        }
        saveSettings();
    };

    window.pipboyApplyColorMode = function (mode) {
        document.body.classList.remove('color-sepia', 'color-blue', 'color-amber');
        if (mode !== 'normal') {
            document.body.classList.add('color-' + mode);
        }
        saveSettings();
    };

    window.pipboyApplyFontSize = function (size) {
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add('font-' + size);
        saveSettings();
    };

    window.pipboyLogout = function () {
        if (!confirm('LOG OUT OF VAULT 215?')) return;
        localStorage.removeItem('currentPlayer');
        localStorage.removeItem('playerData');
        var dest = getCurrentPage() === 'overseer.html' ? 'login_hub.html' : 'index.html';
        window.location.href = dest;
    };

    window.pipboyConfirmDeleteChar = function () {
        if (!confirm('DELETE CHARACTER? THIS ACTION CANNOT BE UNDONE.')) return;
        if (!confirm('FINAL WARNING: ARE YOU ABSOLUTELY SURE?')) return;
        var keys = ['characterData', 'characterImage', 'characterBackstory', 'pipboyInventory', 'pipboyData'];
        for (var i = 0; i < keys.length; i++) {
            localStorage.removeItem(keys[i]);
        }
        alert('CHARACTER DATA DELETED. Returning to login terminal.');
        window.location.href = 'index.html';
    };

    /* ---- Brightness ---- */

    function applyBrightness(val) {
        document.documentElement.style.filter = (val === 100) ? '' : 'brightness(' + (val / 100) + ')';
    }

    /* ---- Settings persistence ---- */

    var SETTINGS_KEY = 'pipboySettings';

    var DEFAULT_SETTINGS = {
        masterVol:  80,
        musicVol:   60,
        sfxVol:     75,
        voiceVol:   85,
        brightness: 100,
        scanlines:  true,
        colorMode:  'normal',
        fontSize:   'medium'
    };

    function loadStoredSettings() {
        try {
            var raw = localStorage.getItem(SETTINGS_KEY);
            if (!raw) return copyDefaults();
            var parsed = JSON.parse(raw);
            // Merge with defaults to handle any missing keys
            var s = copyDefaults();
            for (var k in parsed) {
                if (Object.prototype.hasOwnProperty.call(parsed, k) &&
                    Object.prototype.hasOwnProperty.call(s, k)) {
                    s[k] = parsed[k];
                }
            }
            return s;
        } catch (e) {
            return copyDefaults();
        }
    }

    function copyDefaults() {
        var s = {};
        for (var k in DEFAULT_SETTINGS) {
            if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, k)) {
                s[k] = DEFAULT_SETTINGS[k];
            }
        }
        return s;
    }

    function saveSettings() {
        var s = {
            masterVol:  getSliderVal('settingMasterVol',  DEFAULT_SETTINGS.masterVol),
            musicVol:   getSliderVal('settingMusicVol',   DEFAULT_SETTINGS.musicVol),
            sfxVol:     getSliderVal('settingSfxVol',     DEFAULT_SETTINGS.sfxVol),
            voiceVol:   getSliderVal('settingVoiceVol',   DEFAULT_SETTINGS.voiceVol),
            brightness: getSliderVal('settingBrightness', DEFAULT_SETTINGS.brightness),
            scanlines:  !document.body.classList.contains('no-scanlines'),
            colorMode:  getSelectVal('settingColorMode',  DEFAULT_SETTINGS.colorMode),
            fontSize:   getSelectVal('settingFontSize',   DEFAULT_SETTINGS.fontSize)
        };
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
    }

    function applyStoredSettings(s) {
        // Brightness
        applyBrightness(s.brightness);

        // Scanlines
        if (!s.scanlines) {
            document.body.classList.add('no-scanlines');
        } else {
            document.body.classList.remove('no-scanlines');
        }

        // Color mode
        document.body.classList.remove('color-sepia', 'color-blue', 'color-amber');
        if (s.colorMode !== 'normal') {
            document.body.classList.add('color-' + s.colorMode);
        }

        // Font size
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add('font-' + s.fontSize);
    }

    function loadSettingsUI() {
        var s = loadStoredSettings();

        setSlider('settingMasterVol', 'masterVolVal', s.masterVol);
        setSlider('settingMusicVol',  'musicVolVal',  s.musicVol);
        setSlider('settingSfxVol',    'sfxVolVal',    s.sfxVol);
        setSlider('settingVoiceVol',  'voiceVolVal',  s.voiceVol);
        setSlider('settingBrightness','brightnessVal', s.brightness);

        var scanlinesBtn = document.getElementById('settingScanlinesToggle');
        if (scanlinesBtn) {
            if (s.scanlines) {
                scanlinesBtn.classList.add('on');
                scanlinesBtn.textContent = 'ON';
                scanlinesBtn.setAttribute('aria-pressed', 'true');
            } else {
                scanlinesBtn.classList.remove('on');
                scanlinesBtn.textContent = 'OFF';
                scanlinesBtn.setAttribute('aria-pressed', 'false');
            }
        }

        var colorSel = document.getElementById('settingColorMode');
        if (colorSel) colorSel.value = s.colorMode;

        var fontSel = document.getElementById('settingFontSize');
        if (fontSel) fontSel.value = s.fontSize;

        loadAccountInfo();
    }

    function loadAccountInfo() {
        var charEl   = document.getElementById('settingCharName');
        var campEl   = document.getElementById('settingCampaignName');

        if (charEl) {
            try {
                var raw = localStorage.getItem('characterData');
                if (raw) {
                    var cd = JSON.parse(raw);
                    charEl.textContent = 'CHARACTER: ' + (cd.name || 'UNKNOWN DWELLER');
                }
            } catch (e) {}
        }

        if (campEl) {
            try {
                var rawC = localStorage.getItem('campaigns');
                if (rawC) {
                    var camps = JSON.parse(rawC);
                    var active = null;
                    for (var i = 0; i < camps.length; i++) {
                        if (camps[i].isActive) { active = camps[i]; break; }
                    }
                    if (active) campEl.textContent = 'CAMPAIGN: ' + active.name;
                }
            } catch (e) {}
        }
    }

    /* ---- Helpers ---- */

    function getSliderVal(id, def) {
        var el = document.getElementById(id);
        return el ? parseInt(el.value, 10) : def;
    }

    function getSelectVal(id, def) {
        var el = document.getElementById(id);
        return el ? el.value : def;
    }

    function setSlider(sliderId, valueId, val) {
        var s = document.getElementById(sliderId);
        var v = document.getElementById(valueId);
        if (s) s.value = val;
        if (v) v.textContent = val + '%';
    }

    /* ---- Messages hash handler for stats.html ---- */

    function handleMessagesHash() {
        if (getCurrentPage() !== 'stats.html') return;
        if (window.location.hash !== '#messages') return;
        // Attempt to click the messages subtab button
        var btn = document.querySelector('.subtab-button[data-tab="messages"]');
        if (btn) btn.click();
    }

    /* ---- Main init ---- */

    function init() {
        var page = getCurrentPage();

        // Do not inject on login / terminal pages
        if (SKIP_PAGES.indexOf(page) !== -1) return;

        var type     = getNavType();
        var theme    = (type === 'overseer') ? 'overseer' : 'player';
        var navItems = (type === 'overseer') ? OVERSEER_NAV : PLAYER_NAV;
        var activeId = getActiveId();

        // Inject stylesheet
        injectStylesheet();

        // Build + inject nav bar (data-id is embedded in the HTML by buildNavHTML)
        var navFrag = document.createElement('div');
        navFrag.innerHTML = buildNavHTML(navItems, theme, activeId);
        document.body.appendChild(navFrag.firstChild);

        // Build + inject settings panel
        var setFrag = document.createElement('div');
        setFrag.innerHTML = buildSettingsHTML(theme);
        document.body.appendChild(setFrag.firstChild);

        // Apply bottom padding
        document.body.classList.add('has-pipboy-nav');

        // Apply stored settings on load
        var stored = loadStoredSettings();
        applyStoredSettings(stored);

        // Auto-switch to messages tab if hash present
        handleMessagesHash();
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
