/**
 * playerSync.js — Real-time sync client for the Player Pip-Boy (stats.html)
 *
 * Usage
 * -----
 * Include socket.io client CDN before this script, then call:
 *
 *   PlayerSync.init({
 *     serverUrl:    'https://your-server.onrender.com',  // or leave blank for same-origin
 *     sessionCode:  'VAULT01',
 *     playerHandle: 'Jade',
 *     onConnected:         function(data) { ... },   // called when server confirms join
 *     onUpdate:            function(field, value, snapshot) { ... }, // overseer pushed a change
 *     onDisconnect:        function() { ... },
 *     onCampaignWaiting:   function() { ... },       // called when no campaign is active yet
 *     onCampaignStarted:   function() { ... }        // called when campaign becomes active
 *   });
 *
 *   // Push a changed field to the server:
 *   PlayerSync.push('xp', 1500);
 *   PlayerSync.push('skills', { Barter: 25, Speech: 30, ... });
 *   PlayerSync.pushAll(playerData);   // send full playerData object
 *
 * The module reads PIPBOY_SERVER_URL from localStorage if serverUrl is omitted,
 * falling back to same-origin (works when the Express server serves the HTML).
 *
 * When no campaign is active the module automatically injects a full-screen
 * "Waiting for Overseer" overlay, which is removed once the campaign starts.
 */

(function (root) {
  'use strict';

  var _socket     = null;
  var _opts       = {};
  var _connected  = false;
  var _statusEl   = null;   // injected status bar element
  var _waitingEl  = null;   // injected "waiting for campaign" overlay

  // ── Status Bar UI ────────────────────────────────────────────────────────────
  function _buildStatusBar() {
    var bar = document.getElementById('pipboy-sync-bar');
    if (bar) { _statusEl = bar; return; }

    bar = document.createElement('div');
    bar.id = 'pipboy-sync-bar';
    bar.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:9999',
      'padding:4px 12px', 'font-family:"Courier New",monospace', 'font-size:10px',
      'letter-spacing:1px', 'text-align:center', 'transition:background 0.4s,color 0.4s',
      'background:#1a1a1a', 'color:#888', 'border-top:1px solid #333'
    ].join(';');
    bar.textContent = '⬤ SYNC: OFFLINE';
    document.body.appendChild(bar);
    _statusEl = bar;
  }

  function _setStatus(state, text) {
    if (!_statusEl) return;
    var colors = {
      connected:    { bg:'#0a1a0a', color:'#4ade80', border:'#4ade80' },
      disconnected: { bg:'#1a0a0a', color:'#ff6b6b', border:'#ff6b6b' },
      connecting:   { bg:'#1a1508', color:'#fbbf24', border:'#fbbf24' },
      syncing:      { bg:'#0a0f1a', color:'#60a5fa', border:'#60a5fa' }
    };
    var c = colors[state] || colors.disconnected;
    _statusEl.style.background  = c.bg;
    _statusEl.style.color       = c.color;
    _statusEl.style.borderColor = c.border;
    _statusEl.textContent = text;
  }

  // ── Waiting-for-Campaign Overlay ─────────────────────────────────────────────
  function _showWaitingOverlay(msg) {
    // If overlay exists just update the message
    if (_waitingEl) {
      var sub = document.getElementById('pipboy-waiting-msg');
      if (sub) sub.textContent = msg || 'Waiting for the Overseer to start the campaign…';
      return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'pipboy-campaign-waiting';
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0', 'z-index:10000',
      'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
      'background:rgba(0,0,0,0.92)',
      'font-family:"Courier New",monospace', 'color:#d4a017',
      'letter-spacing:2px', 'text-align:center', 'padding:32px'
    ].join(';');

    var icon = document.createElement('div');
    icon.style.cssText = 'font-size:48px;margin-bottom:24px;animation:pipboy-pulse 2s infinite;';
    icon.textContent = '⬡';

    var title = document.createElement('div');
    title.style.cssText = 'font-size:20px;font-weight:bold;margin-bottom:12px;color:#fbbf24;';
    title.textContent = 'AWAITING OVERSEER';

    var sub = document.createElement('div');
    sub.id = 'pipboy-waiting-msg';
    sub.style.cssText = 'font-size:13px;color:#d4a017;opacity:0.8;max-width:380px;line-height:1.6;';
    sub.textContent = msg || 'Waiting for the Overseer to start the campaign…';

    var style = document.createElement('style');
    style.textContent = '@keyframes pipboy-pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}';

    overlay.appendChild(style);
    overlay.appendChild(icon);
    overlay.appendChild(title);
    overlay.appendChild(sub);
    document.body.appendChild(overlay);
    _waitingEl = overlay;
  }

  function _hideWaitingOverlay() {
    if (_waitingEl && _waitingEl.parentNode) {
      _waitingEl.parentNode.removeChild(_waitingEl);
    }
    _waitingEl = null;
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  var PlayerSync = {

    /**
     * Initialise the sync connection.
     * @param {object} opts
     *   serverUrl          {string}   WebSocket server URL (blank = same-origin)
     *   sessionCode        {string}   Session room code
     *   playerHandle       {string}   Player name/handle
     *   onConnected        {function} Called with { data } when session join is confirmed
     *   onUpdate           {function} Called with (field, value, snapshot) on overseer push
     *   onPrivateMessage   {function} Called with payload when a private message is received
     *                                 (e.g. XP award: { type: 'xp_award', xp, message })
     *   onDisconnect       {function} Called on socket disconnect
     *   onCampaignWaiting  {function} Called when server reports no active campaign
     *   onCampaignStarted  {function} Called when campaign becomes active and join is completed
     */
    init: function (opts) {
      _opts = opts || {};

      // Require socket.io client
      if (typeof io === 'undefined') {
        console.error('[PlayerSync] socket.io client not loaded. Add the CDN script before playerSync.js.');
        return;
      }

      var url = _opts.serverUrl
             || localStorage.getItem('PIPBOY_SERVER_URL')
             || window.location.origin;

      _buildStatusBar();
      _setStatus('connecting', '⬤ SYNC: CONNECTING…');

      _socket = io(url, { transports: ['websocket', 'polling'] });

      // ── Socket events ────────────────────────────────────────────────────────
      _socket.on('connect', function () {
        _connected = true;
        _setStatus('connected', '⬤ SYNC: CONNECTED — joining session ' + (_opts.sessionCode || '?'));

        _socket.emit('player:join', {
          sessionCode:  _opts.sessionCode  || '',
          playerHandle: _opts.playerHandle || 'Player',
          initialData:  _opts.initialData  || null
        });
      });

      _socket.on('session:joined', function (payload) {
        _hideWaitingOverlay();
        _setStatus('connected', '⬤ SYNC: LIVE — ' + payload.playerHandle + ' @ ' + payload.sessionCode);
        if (typeof _opts.onConnected === 'function') _opts.onConnected(payload);
      });

      // Server: no campaign is active yet — show waiting overlay
      _socket.on('campaign:waiting', function (payload) {
        var msg = (payload && payload.message) || 'Waiting for the Overseer to start the campaign…';
        _setStatus('connecting', '⬤ SYNC: WAITING FOR OVERSEER…');
        _showWaitingOverlay(msg);
        if (typeof _opts.onCampaignWaiting === 'function') _opts.onCampaignWaiting(payload);
      });

      // Server: campaign just started — hide overlay; session:joined will follow shortly
      _socket.on('campaign:started', function () {
        _hideWaitingOverlay();
        _setStatus('connected', '⬤ SYNC: CAMPAIGN STARTING…');
        if (typeof _opts.onCampaignStarted === 'function') _opts.onCampaignStarted();
      });

      // Server: campaign ended
      _socket.on('campaign:ended', function (payload) {
        var msg = (payload && payload.message) || 'The Overseer has ended the session.';
        _showWaitingOverlay(msg);
        _setStatus('connecting', '⬤ SYNC: SESSION ENDED');
      });

      _socket.on('player:ack', function (payload) {
        // Silent acknowledgement – optionally show a brief flash
        _flashSync();
      });

      // Private message from Overseer (e.g. XP award notification)
      _socket.on('player:private-message', function (payload) {
        _setStatus('syncing', '⬤ SYNC: MESSAGE RECEIVED');
        setTimeout(function () {
          if (_connected) {
            _setStatus('connected', '⬤ SYNC: LIVE — ' + (_opts.playerHandle || '') + ' @ ' + (_opts.sessionCode || ''));
          }
        }, 1200);
        if (typeof _opts.onPrivateMessage === 'function') {
          _opts.onPrivateMessage(payload || {});
        }
      });

      // Overseer pushed a change to this player
      _socket.on('player:updated-by-overseer', function (payload) {
        _setStatus('syncing', '⬤ SYNC: UPDATE FROM OVERSEER');
        setTimeout(function () {
          _setStatus('connected', '⬤ SYNC: LIVE — ' + (_opts.playerHandle || '') + ' @ ' + (_opts.sessionCode || ''));
        }, 1200);
        if (typeof _opts.onUpdate === 'function') {
          _opts.onUpdate(payload.field, payload.value, payload.snapshot);
        }
      });

      _socket.on('overseer:offline', function () {
        _setStatus('connected', '⬤ SYNC: LIVE (Overseer offline)');
      });

      // Combat state broadcast from server
      _socket.on('combat:state-updated', function (combatState) {
        if (typeof _opts.onCombatUpdate === 'function') {
          _opts.onCombatUpdate(combatState);
        }
      });

      // Mutation event broadcast from Overseer — enemy survived and mutated
      _socket.on('enemy:mutation-event', function (payload) {
        if (typeof _opts.onMutationEvent === 'function') {
          _opts.onMutationEvent(payload || {});
        }
      });

      _socket.on('disconnect', function () {
        _connected = false;
        _setStatus('disconnected', '⬤ SYNC: DISCONNECTED — reconnecting…');
        if (typeof _opts.onDisconnect === 'function') _opts.onDisconnect();
      });

      _socket.on('error:join', function (err) {
        _setStatus('disconnected', '⬤ SYNC: ERROR — ' + (err.message || 'join failed'));
      });

      _socket.on('error:auth', function (err) {
        _setStatus('disconnected', '⬤ SYNC: AUTH ERROR — ' + (err.message || 'check admin code'));
      });
    },

    /**
     * Push a single field update to the server.
     * @param {string} field  e.g. 'xp', 'skills', 'perks', 'debuffs', 'hp'
     * @param {*}      value  New value
     */
    push: function (field, value) {
      if (!_socket || !_connected) return;
      _socket.emit('player:update', { field: field, value: value });
      _flashSync();
    },

    /**
     * Push the entire playerData object at once.
     * @param {object} data  Full player data snapshot
     */
    pushAll: function (data) {
      if (!_socket || !_connected) return;
      _socket.emit('player:update', { field: 'all', value: data });
      _flashSync();
    },

    /**
     * Request the current combat state from the server.
     * The response arrives via the onCombatUpdate callback.
     */
    requestCombatState: function () {
      if (!_socket || !_connected) return;
      _socket.emit('combat:request-state');
    },

    /** @returns {boolean} Whether the socket is currently connected */
    isConnected: function () { return _connected; },

    /** Disconnect (e.g. on page unload) */
    disconnect: function () {
      if (_socket) _socket.disconnect();
    }
  };

  function _flashSync() {
    if (!_statusEl) return;
    _setStatus('syncing', '⬤ SYNC: SYNCING…');
    setTimeout(function () {
      if (_connected) {
        _setStatus('connected', '⬤ SYNC: LIVE — ' + (_opts.playerHandle || '') + ' @ ' + (_opts.sessionCode || ''));
      }
    }, 600);
  }

  // Expose globally
  root.PlayerSync = PlayerSync;

}(window));
