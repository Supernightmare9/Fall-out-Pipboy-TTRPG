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
 *     onConnected:    function(data) { ... },   // called when server confirms join
 *     onUpdate:       function(field, value, snapshot) { ... }, // overseer pushed a change
 *     onDisconnect:   function() { ... }
 *   });
 *
 *   // Push a changed field to the server:
 *   PlayerSync.push('xp', 1500);
 *   PlayerSync.push('skills', { Barter: 25, Speech: 30, ... });
 *   PlayerSync.pushAll(playerData);   // send full playerData object
 *
 * The module reads PIPBOY_SERVER_URL from localStorage if serverUrl is omitted,
 * falling back to same-origin (works when the Express server serves the HTML).
 */

(function (root) {
  'use strict';

  var _socket     = null;
  var _opts       = {};
  var _connected  = false;
  var _statusEl   = null;   // injected status bar element

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

  // ── Public API ────────────────────────────────────────────────────────────────
  var PlayerSync = {

    /**
     * Initialise the sync connection.
     * @param {object} opts
     *   serverUrl    {string}   WebSocket server URL (blank = same-origin)
     *   sessionCode  {string}   Session room code
     *   playerHandle {string}   Player name/handle
     *   onConnected  {function} Called with { data } when session join is confirmed
     *   onUpdate     {function} Called with (field, value, snapshot) on overseer push
     *   onDisconnect {function} Called on socket disconnect
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
        _setStatus('connected', '⬤ SYNC: LIVE — ' + payload.playerHandle + ' @ ' + payload.sessionCode);
        if (typeof _opts.onConnected === 'function') _opts.onConnected(payload);
      });

      _socket.on('player:ack', function (payload) {
        // Silent acknowledgement – optionally show a brief flash
        _flashSync();
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
    var prev = _statusEl.textContent;
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
