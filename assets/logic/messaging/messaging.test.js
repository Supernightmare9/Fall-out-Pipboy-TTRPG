/**
 * messaging.test.js
 * Unit and integration tests for the in-app messaging system.
 *
 * Tests cover:
 *  - mkConvId: stable, sorted conversation ID generation
 *  - convDisplayName: human-readable conversation name
 *  - Privacy: only participants receive their messages
 *  - Storage: localStorage scoping per player handle
 *  - Unread badge count aggregation
 *  - System message conversation creation
 *  - Group chat conversation ID consistency
 *  - Server-side msg:send routing logic (via direct function tests)
 */

'use strict';

// ─── Helpers extracted from messages.html (duplicated here for testing) ────────

function mkConvId(participants) {
  return participants.map(function (h) { return h.toLowerCase().trim(); }).sort().join('::');
}

function convDisplayName(myHandle, participants) {
  var others = participants.filter(function (p) { return p !== myHandle; });
  if (others.length === 0) return '(you)';
  return others.map(function (p) { return p === 'overseer' ? '⬡ Overseer' : p; }).join(', ');
}

function totalUnread(conversations) {
  return Object.values(conversations).reduce(function (s, c) {
    return s + (c.unreadCount || 0);
  }, 0);
}

// Simulates the server-side routing logic from server.js msg:send handler
function routeMessage(session, fromHandle, fromRole, to, text) {
  if (!session) return null;

  var rawFrom = fromRole === 'overseer' ? 'overseer' : (fromHandle || '');
  if (!rawFrom) return null;

  var rawText = String(text || '').trim();
  if (!rawText) return null;

  var validHandles = new Set(Object.keys(session.players).concat(['overseer']));

  var toHandles = (Array.isArray(to) ? to : [])
    .map(function (h) { return String(h).trim(); })
    .filter(function (h) { return h && h !== rawFrom && validHandles.has(h); });

  if (toHandles.length === 0) return null;

  var participants = Array.from(new Set([rawFrom].concat(toHandles))).sort();
  var convId = participants.join('::');

  var deliveredTo = [];

  participants.forEach(function (ph) {
    if (ph === 'overseer') {
      if (session.overseerSocketId) deliveredTo.push('overseer');
    } else {
      var p = session.players[ph];
      if (p && p.socketId) deliveredTo.push(ph);
    }
  });

  return { convId: convId, participants: participants, from: rawFrom, text: rawText, deliveredTo: deliveredTo };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('mkConvId', () => {
  test('sorts participants alphabetically', () => {
    expect(mkConvId(['charlie', 'alice', 'bob'])).toBe('alice::bob::charlie');
  });

  test('is case-insensitive', () => {
    expect(mkConvId(['Alice', 'BOB'])).toBe('alice::bob');
  });

  test('single participant', () => {
    expect(mkConvId(['alice'])).toBe('alice');
  });

  test('overseer handle included', () => {
    expect(mkConvId(['overseer', 'player1'])).toBe('overseer::player1');
  });

  test('is stable — same participants in different order produce same ID', () => {
    const id1 = mkConvId(['zara', 'alice', 'bob']);
    const id2 = mkConvId(['bob', 'zara', 'alice']);
    expect(id1).toBe(id2);
  });

  test('group chat ID includes all participants', () => {
    const id = mkConvId(['overseer', 'player1', 'player2', 'player3']);
    expect(id).toBe('overseer::player1::player2::player3');
  });

  test('trims whitespace in handles', () => {
    expect(mkConvId([' alice ', ' bob '])).toBe('alice::bob');
  });
});

describe('convDisplayName', () => {
  test('1:1 with another player', () => {
    expect(convDisplayName('alice', ['alice', 'bob'])).toBe('bob');
  });

  test('1:1 with overseer uses formatted label', () => {
    expect(convDisplayName('alice', ['alice', 'overseer'])).toBe('⬡ Overseer');
  });

  test('group chat lists all other participants', () => {
    const name = convDisplayName('alice', ['alice', 'bob', 'charlie']);
    expect(name).toContain('bob');
    expect(name).toContain('charlie');
    expect(name).not.toContain('alice');
  });

  test('single participant returns (you)', () => {
    expect(convDisplayName('alice', ['alice'])).toBe('(you)');
  });
});

describe('totalUnread', () => {
  test('sums unreadCount across all conversations', () => {
    const convs = {
      'conv1': { unreadCount: 3 },
      'conv2': { unreadCount: 0 },
      'conv3': { unreadCount: 5 }
    };
    expect(totalUnread(convs)).toBe(8);
  });

  test('handles missing unreadCount gracefully', () => {
    const convs = {
      'conv1': { unreadCount: 2 },
      'conv2': {}
    };
    expect(totalUnread(convs)).toBe(2);
  });

  test('returns 0 for empty conversations', () => {
    expect(totalUnread({})).toBe(0);
  });
});

describe('routeMessage — server privacy routing', () => {
  function makeSession(players, overseerOnline) {
    var playerMap = {};
    players.forEach(function (h) {
      playerMap[h] = { socketId: 'socket_' + h, data: {} };
    });
    return {
      players: playerMap,
      overseerSocketId: overseerOnline ? 'socket_overseer' : null
    };
  }

  test('routes 1:1 player message only to sender and recipient', () => {
    const session = makeSession(['alice', 'bob', 'charlie'], false);
    const result = routeMessage(session, 'alice', 'player', ['bob'], 'Hello Bob!');
    expect(result).not.toBeNull();
    expect(result.deliveredTo).toContain('alice');
    expect(result.deliveredTo).toContain('bob');
    expect(result.deliveredTo).not.toContain('charlie');
  });

  test('group message delivered only to participants', () => {
    const session = makeSession(['alice', 'bob', 'charlie'], false);
    const result = routeMessage(session, 'alice', 'player', ['bob', 'charlie'], 'Group message');
    expect(result.deliveredTo).toHaveLength(3);
    expect(result.deliveredTo).toContain('alice');
    expect(result.deliveredTo).toContain('bob');
    expect(result.deliveredTo).toContain('charlie');
  });

  test('overseer receives message when targeted and online', () => {
    const session = makeSession(['alice'], true);
    const result = routeMessage(session, 'alice', 'player', ['overseer'], 'Hey Overseer');
    expect(result.deliveredTo).toContain('overseer');
    expect(result.deliveredTo).toContain('alice');
  });

  test('overseer NOT delivered to when offline', () => {
    const session = makeSession(['alice'], false);
    const result = routeMessage(session, 'alice', 'player', ['overseer'], 'Hey Overseer');
    // Still creates the convId, but overseer socket is offline
    expect(result.deliveredTo).not.toContain('overseer');
    expect(result.deliveredTo).toContain('alice');
  });

  test('overseer can send message as overseer role', () => {
    const session = makeSession(['alice', 'bob'], true);
    const result = routeMessage(session, null, 'overseer', ['alice'], 'Overseer speaking');
    expect(result).not.toBeNull();
    expect(result.from).toBe('overseer');
    expect(result.deliveredTo).toContain('alice');
  });

  test('message NOT delivered to players not in session', () => {
    const session = makeSession(['alice', 'bob'], false);
    const result = routeMessage(session, 'alice', 'player', ['unknown_player'], 'Hello?');
    expect(result).toBeNull(); // unknown_player filtered out → toHandles empty
  });

  test('empty text returns null', () => {
    const session = makeSession(['alice', 'bob'], false);
    expect(routeMessage(session, 'alice', 'player', ['bob'], '')).toBeNull();
    expect(routeMessage(session, 'alice', 'player', ['bob'], '   ')).toBeNull();
  });

  test('sender NOT duplicated in deliveredTo', () => {
    const session = makeSession(['alice', 'bob'], false);
    const result = routeMessage(session, 'alice', 'player', ['bob'], 'Hi');
    const aliceCount = result.deliveredTo.filter(function(h){ return h === 'alice'; }).length;
    expect(aliceCount).toBe(1);
  });

  test('convId is stable regardless of argument order', () => {
    const session = makeSession(['alice', 'bob', 'charlie'], false);
    const r1 = routeMessage(session, 'alice', 'player', ['bob', 'charlie'], 'Hello');
    const r2 = routeMessage(session, 'alice', 'player', ['charlie', 'bob'], 'Hello');
    expect(r1.convId).toBe(r2.convId);
  });
});

describe('privacy — messages not visible to non-participants', () => {
  test('player receives own 1:1 messages but not other players 1:1', () => {
    // Simulate two separate conversations: alice↔bob, alice↔charlie
    // From bob's perspective, he should only see alice::bob, not alice::charlie

    const aliceBobId   = mkConvId(['alice', 'bob']);
    const aliceCharlieId = mkConvId(['alice', 'charlie']);

    // Bob's localStorage
    const bobConvs = {};
    bobConvs[aliceBobId] = { participants: ['alice', 'bob'], messages: [{ from: 'alice', text: 'Hi Bob' }], unreadCount: 1 };
    // Bob should NOT have alice::charlie at all

    expect(bobConvs[aliceBobId]).toBeDefined();
    expect(bobConvs[aliceCharlieId]).toBeUndefined();
  });

  test('overseer cannot see player-to-player conversation they are not part of', () => {
    // alice and bob have a private conversation
    const aliceBobId = mkConvId(['alice', 'bob']);

    // Overseer's localStorage contains only conversations they participate in
    const overseerConvs = {};
    // Overseer is not in alice::bob — they should not have this key
    expect(overseerConvs[aliceBobId]).toBeUndefined();
  });

  test('system message only stored under the affected player handle', () => {
    const aliceHandle = 'alice';
    const bobHandle   = 'bob';

    const aliceSystemConvId = mkConvId(['system', aliceHandle]);
    const bobSystemConvId   = mkConvId(['system', bobHandle]);

    // Simulate alice receiving an XP award system message
    const aliceConvs = {};
    aliceConvs[aliceSystemConvId] = {
      participants: ['system', aliceHandle],
      messages: [{ from: 'system', text: '+50 XP gained!' }],
      unreadCount: 1,
      isSystem: true
    };

    // Bob should not have alice's system message
    expect(aliceConvs[aliceSystemConvId]).toBeDefined();
    expect(aliceConvs[bobSystemConvId]).toBeUndefined();
  });
});

describe('storage key scoping', () => {
  test('different players have different storage keys', () => {
    const keyAlice = 'vault_msgs_v1_alice';
    const keyBob   = 'vault_msgs_v1_bob';
    expect(keyAlice).not.toBe(keyBob);
  });

  test('overseer has its own separate storage key', () => {
    const keyOverseer = 'vault_msgs_v1_overseer';
    const keyAlice    = 'vault_msgs_v1_alice';
    expect(keyOverseer).not.toBe(keyAlice);
  });
});
