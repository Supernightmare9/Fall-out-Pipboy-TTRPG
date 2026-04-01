/**
 * overseerSync.js — Real-time sync client for the Overseer Console (overseerhub.html)
 *
 * Usage
 * -----
 * Include socket.io client CDN before this script, then call:
 *
 *   OverseerSync.init({
 *     serverUrl:   'https://your-server.onrender.com',
 *     sessionCode: 'VAULT01',
 *     adminCode:   'OVERSEER215',         // must match server ADMIN_CODE
 *     onConnected:     function(players) { ... },   // called with initial player list
 *     onPlayerJoined:  function(handle, data) { ... },
 *     onPlayerUpdate:  function(handle, field, value, snapshot) { ... },
 *     onPlayerLeft:    function(handle) { ... }
 *   });
 *
 *   // Push a change to a specific player:
 *   OverseerSync.updatePlayer('Jade', 'xp', 1500);
 *   OverseerSync.updatePlayer('Jade', 'all', fullDataObject);
 *
 *   // Request a fresh snapshot of all players:
 *   OverseerSync.requestSnapshot();
 */

(function (root) {
  'use strict';

  var _socket    = null;
  var _opts      = {};
  var _connected = false;
  var _statusEl  = null;

  // ── Status Bar UI ────────────────────────────────────────────────────────────
  function _buildStatusBar() {
    var bar = document.getElementById('overseer-sync-bar');
    if (bar) { _statusEl = bar; return; }

    bar = document.createElement('div');
    bar.id = 'overseer-sync-bar';
    bar.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:9999',
      'padding:4px 12px', 'font-family:"Courier New",monospace', 'font-size:10px',
      'letter-spacing:1px', 'text-align:center', 'transition:background 0.4s,color 0.4s',
      'background:#04080f', 'color:#888', 'border-top:1px solid #2a5298'
    ].join(';');
    bar.textContent = '⬤ OVERSEER SYNC: OFFLINE';
    document.body.appendChild(bar);
    _statusEl = bar;
  }

  function _setStatus(state, text) {
    if (!_statusEl) return;
    var colors = {
      connected:    { bg:'#020c1b', color:'#00cc66', border:'#00cc66' },
      disconnected: { bg:'#1a0202', color:'#ff3300', border:'#ff3300' },
      connecting:   { bg:'#0d0e02', color:'#d4a017', border:'#d4a017' },
      syncing:      { bg:'#020918', color:'#60a5fa', border:'#2a5298' }
    };
    var c = colors[state] || colors.disconnected;
    _statusEl.style.background  = c.bg;
    _statusEl.style.color       = c.color;
    _statusEl.style.borderColor = c.border;
    _statusEl.textContent = text;
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  var OverseerSync = {

    /**
     * Initialise the Overseer sync connection.
     * @param {object} opts
     *   serverUrl       {string}   WebSocket server URL (blank = same-origin)
     *   sessionCode     {string}   Session room code
     *   adminCode       {string}   Admin / GM secret code
     *   onConnected     {function} Called with { players } on join
     *   onPlayerJoined  {function} Called with (handle, data) when player connects
     *   onPlayerUpdate  {function} Called with (handle, field, value, snapshot)
     *   onPlayerLeft    {function} Called with (handle) when player disconnects
     *   onSnapshot      {function} Called with { players } on snapshot response
     */
    init: function (opts) {
      _opts = opts || {};

      if (typeof io === 'undefined') {
        console.error('[OverseerSync] socket.io client not loaded. Add the CDN script before overseerSync.js.');
        return;
      }

      var url = _opts.serverUrl
             || localStorage.getItem('PIPBOY_SERVER_URL')
             || window.location.origin;

      _buildStatusBar();
      _setStatus('connecting', '⬤ OVERSEER SYNC: CONNECTING…');

      _socket = io(url, { transports: ['websocket', 'polling'] });

      // ── Socket events ────────────────────────────────────────────────────────
      _socket.on('connect', function () {
        _connected = true;
        _setStatus('connecting', '⬤ OVERSEER SYNC: AUTHENTICATING…');

        _socket.emit('overseer:join', {
          sessionCode: _opts.sessionCode || '',
          adminCode:   _opts.adminCode   || ''
        });
      });

      _socket.on('session:joined', function (payload) {
        _setStatus('connected', '⬤ OVERSEER SYNC: LIVE — session ' + payload.sessionCode + ' (' + (payload.players || []).length + ' players)');
        if (typeof _opts.onConnected === 'function') _opts.onConnected(payload);
      });

      _socket.on('overseer:player-joined', function (payload) {
        _setStatus('syncing', '⬤ OVERSEER SYNC: PLAYER JOINED — ' + payload.handle);
        setTimeout(function () { _restoreConnectedStatus(); }, 1500);
        if (typeof _opts.onPlayerJoined === 'function') _opts.onPlayerJoined(payload.handle, payload.data);
      });

      _socket.on('overseer:player-update', function (payload) {
        _setStatus('syncing', '⬤ OVERSEER SYNC: DATA — ' + payload.handle + ' → ' + (payload.field || ''));
        setTimeout(function () { _restoreConnectedStatus(); }, 800);
        if (typeof _opts.onPlayerUpdate === 'function') {
          _opts.onPlayerUpdate(payload.handle, payload.field, payload.value, payload.snapshot);
        }
      });

      _socket.on('overseer:player-disconnected', function (payload) {
        _setStatus('syncing', '⬤ OVERSEER SYNC: ' + payload.handle + ' OFFLINE');
        setTimeout(function () { _restoreConnectedStatus(); }, 2000);
        if (typeof _opts.onPlayerLeft === 'function') _opts.onPlayerLeft(payload.handle);
      });

      _socket.on('overseer:snapshot', function (payload) {
        if (typeof _opts.onSnapshot === 'function') _opts.onSnapshot(payload);
      });

      _socket.on('overseer:ack', function () {
        _flashSync();
      });

      _socket.on('disconnect', function () {
        _connected = false;
        _setStatus('disconnected', '⬤ OVERSEER SYNC: DISCONNECTED — reconnecting…');
      });

      _socket.on('error:join', function (err) {
        _setStatus('disconnected', '⬤ OVERSEER SYNC: ERROR — ' + (err.message || 'join failed'));
      });

      _socket.on('error:auth', function (err) {
        _setStatus('disconnected', '⬤ OVERSEER SYNC: AUTH FAILED — check admin code');
        console.error('[OverseerSync] Auth error:', err.message);
      });
    },

    /**
     * Push a data change to a specific player.
     * @param {string} playerHandle  Target player name
     * @param {string} field         Field to update, or 'all'
     * @param {*}      value         New value
     */
    updatePlayer: function (playerHandle, field, value) {
      if (!_socket || !_connected) return;
      _socket.emit('overseer:update-player', {
        playerHandle: playerHandle,
        field:        field,
        value:        value
      });
      _flashSync();
    },

    /**
     * Request a fresh snapshot of all player data in the session.
     */
    requestSnapshot: function () {
      if (!_socket || !_connected) return;
      _socket.emit('overseer:request-snapshot');
    },

    /** @returns {boolean} Whether connected */
    isConnected: function () { return _connected; },

    /** Disconnect */
    disconnect: function () {
      if (_socket) _socket.disconnect();
    }
  };

  function _restoreConnectedStatus() {
    if (_connected) {
      _setStatus('connected', '⬤ OVERSEER SYNC: LIVE — session ' + (_opts.sessionCode || ''));
    }
  }

  function _flashSync() {
    if (!_statusEl) return;
    _setStatus('syncing', '⬤ OVERSEER SYNC: SYNCING…');
    setTimeout(_restoreConnectedStatus, 600);
  }

  root.OverseerSync = OverseerSync;

}(window));
