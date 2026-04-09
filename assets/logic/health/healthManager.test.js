/**
 * healthManager.test.js
 * Full test coverage for the central health mutation engine.
 */

'use strict';

const {
  applyHealthMutation,
  isRadiationSick,
  getEffectiveCap,
  RAD_SICKNESS_DEBUFF,
  RAD_SICKNESS_ID
} = require('./healthManager');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeState(overrides) {
  return Object.assign(
    { hp: 100, maxHp: 100, radiation: 0, tempHealth: 0, debuffs: [] },
    overrides
  );
}

// ── getEffectiveCap ────────────────────────────────────────────────────────────

describe('getEffectiveCap', () => {
  test('no rads → cap equals maxHp', () => {
    expect(getEffectiveCap(makeState({ maxHp: 80 }))).toBe(80);
  });

  test('with rads → cap is maxHp minus rads', () => {
    expect(getEffectiveCap(makeState({ maxHp: 100, radiation: 30 }))).toBe(70);
  });

  test('rads equal maxHp → cap is 0', () => {
    expect(getEffectiveCap(makeState({ maxHp: 100, radiation: 100 }))).toBe(0);
  });

  test('rads exceed maxHp → cap floors at 0', () => {
    expect(getEffectiveCap(makeState({ maxHp: 50, radiation: 80 }))).toBe(0);
  });
});

// ── damage ────────────────────────────────────────────────────────────────────

describe('damage', () => {
  test('reduces HP by the full amount when no temp HP', () => {
    const { state } = applyHealthMutation(makeState({ hp: 80 }), 'damage', 20);
    expect(state.hp).toBe(60);
  });

  test('HP floors at 0 (never negative)', () => {
    const { state } = applyHealthMutation(makeState({ hp: 10 }), 'damage', 50);
    expect(state.hp).toBe(0);
  });

  test('emits player_down event when HP reaches 0', () => {
    const { events } = applyHealthMutation(makeState({ hp: 5 }), 'damage', 10);
    expect(events.some(e => e.type === 'player_down')).toBe(true);
  });

  test('temp HP absorbs damage first; real HP untouched if temp covers all', () => {
    const { state, events } = applyHealthMutation(
      makeState({ hp: 60, tempHealth: 15 }), 'damage', 10
    );
    expect(state.tempHealth).toBe(5);
    expect(state.hp).toBe(60);
    expect(events.some(e => e.type === 'temp_absorbed')).toBe(true);
  });

  test('temp HP partially absorbed; remainder hits real HP', () => {
    const { state } = applyHealthMutation(
      makeState({ hp: 60, tempHealth: 5 }), 'damage', 15
    );
    expect(state.tempHealth).toBe(0);
    expect(state.hp).toBe(50);
  });

  test('temp HP depleted exactly; real HP unchanged', () => {
    const { state } = applyHealthMutation(
      makeState({ hp: 50, tempHealth: 20 }), 'damage', 20
    );
    expect(state.tempHealth).toBe(0);
    expect(state.hp).toBe(50);
  });

  test('zero damage is a no-op', () => {
    const s = makeState({ hp: 70, tempHealth: 5 });
    const { state } = applyHealthMutation(s, 'damage', 0);
    expect(state.hp).toBe(70);
    expect(state.tempHealth).toBe(5);
  });

  test('input state is not mutated', () => {
    const s = makeState({ hp: 50 });
    applyHealthMutation(s, 'damage', 10);
    expect(s.hp).toBe(50);
  });
});

// ── heal ─────────────────────────────────────────────────────────────────────

describe('heal', () => {
  test('increases HP up to maxHp', () => {
    const { state } = applyHealthMutation(makeState({ hp: 50, maxHp: 100 }), 'heal', 30);
    expect(state.hp).toBe(80);
  });

  test('healing cannot exceed maxHp', () => {
    const { state } = applyHealthMutation(makeState({ hp: 90, maxHp: 100 }), 'heal', 50);
    expect(state.hp).toBe(100);
  });

  test('healing is capped by effectiveCap when rads present', () => {
    const { state } = applyHealthMutation(
      makeState({ hp: 20, maxHp: 100, radiation: 40 }), 'heal', 100
    );
    expect(state.hp).toBe(60); // effectiveCap = 100 - 40 = 60
  });

  test('heal does nothing when already at effectiveCap', () => {
    const { state } = applyHealthMutation(
      makeState({ hp: 60, maxHp: 100, radiation: 40 }), 'heal', 20
    );
    expect(state.hp).toBe(60);
  });
});

// ── addRads ───────────────────────────────────────────────────────────────────

describe('addRads', () => {
  test('increases radiation by amount', () => {
    const { state } = applyHealthMutation(makeState({ radiation: 20 }), 'addRads', 30);
    expect(state.radiation).toBe(50);
  });

  test('radiation caps at MAX_RADS (1000)', () => {
    const { state } = applyHealthMutation(makeState({ radiation: 950 }), 'addRads', 200);
    expect(state.radiation).toBe(1000);
  });

  test('currentHP clamped to new effectiveCap when rads push cap below currentHP', () => {
    const { state } = applyHealthMutation(
      makeState({ hp: 90, maxHp: 100, radiation: 0 }), 'addRads', 80
    );
    // effectiveCap = 100 - 80 = 20; hp was 90 → clamped to 20
    expect(state.hp).toBe(20);
    expect(state.radiation).toBe(80);
  });

  test('currentHP unchanged when still below new effectiveCap', () => {
    const { state } = applyHealthMutation(
      makeState({ hp: 30, maxHp: 100, radiation: 0 }), 'addRads', 40
    );
    // effectiveCap = 60; hp 30 < 60 → unchanged
    expect(state.hp).toBe(30);
  });

  test('tempHealth clamped when rads push cap below tempHealth', () => {
    const { state, events } = applyHealthMutation(
      makeState({ hp: 20, maxHp: 100, radiation: 0, tempHealth: 50 }), 'addRads', 70
    );
    // effectiveCap = 30; tempHealth 50 → clamped to 30
    expect(state.tempHealth).toBe(30);
    expect(events.some(e => e.type === 'temp_hp_capped')).toBe(true);
  });

  test('tempHealth unchanged when it fits within new cap', () => {
    const { state } = applyHealthMutation(
      makeState({ hp: 50, maxHp: 100, radiation: 0, tempHealth: 10 }), 'addRads', 30
    );
    // effectiveCap = 70; tempHealth 10 < 70 → unchanged
    expect(state.tempHealth).toBe(10);
  });

  test('triggers rad_sickness_onset at 80% threshold', () => {
    const { events, state } = applyHealthMutation(
      makeState({ maxHp: 100, radiation: 0 }), 'addRads', 80
    );
    expect(events.some(e => e.type === 'rad_sickness_onset')).toBe(true);
    expect(isRadiationSick(state)).toBe(true);
  });

  test('no rad_sickness event when rads < 80%', () => {
    const { events } = applyHealthMutation(
      makeState({ maxHp: 100, radiation: 0 }), 'addRads', 79
    );
    expect(events.some(e => e.type === 'rad_sickness_onset')).toBe(false);
  });

  test('no duplicate rad_sickness event if already sick', () => {
    const sick = makeState({
      maxHp: 100, radiation: 80,
      debuffs: [RAD_SICKNESS_DEBUFF]
    });
    const { events } = applyHealthMutation(sick, 'addRads', 5);
    expect(events.filter(e => e.type === 'rad_sickness_onset').length).toBe(0);
  });
});

// ── removeRads ────────────────────────────────────────────────────────────────

describe('removeRads', () => {
  test('decreases radiation by amount', () => {
    const { state } = applyHealthMutation(makeState({ radiation: 60 }), 'removeRads', 30);
    expect(state.radiation).toBe(30);
  });

  test('radiation floors at 0', () => {
    const { state } = applyHealthMutation(makeState({ radiation: 10 }), 'removeRads', 50);
    expect(state.radiation).toBe(0);
  });

  test('currentHP does NOT increase when rads are removed', () => {
    const { state } = applyHealthMutation(
      makeState({ hp: 20, maxHp: 100, radiation: 80 }), 'removeRads', 40
    );
    // effectiveCap raised from 20 to 60, but hp stays at 20
    expect(state.hp).toBe(20);
    expect(state.radiation).toBe(40);
  });

  test('rad_sickness cleared when rads drop below threshold', () => {
    const sick = makeState({
      hp: 20, maxHp: 100, radiation: 80,
      debuffs: [RAD_SICKNESS_DEBUFF]
    });
    const { state, events } = applyHealthMutation(sick, 'removeRads', 5);
    expect(isRadiationSick(state)).toBe(false);
    expect(events.some(e => e.type === 'rad_sickness_cleared')).toBe(true);
  });

  test('rad_sickness NOT cleared when rads still >= 80%', () => {
    const sick = makeState({
      maxHp: 100, radiation: 90,
      debuffs: [RAD_SICKNESS_DEBUFF]
    });
    const { state } = applyHealthMutation(sick, 'removeRads', 5);
    // rads = 85, threshold = 80 → still sick
    expect(isRadiationSick(state)).toBe(true);
  });

  test('no cleared event when player was never sick', () => {
    const { events } = applyHealthMutation(makeState({ radiation: 20 }), 'removeRads', 10);
    expect(events.some(e => e.type === 'rad_sickness_cleared')).toBe(false);
  });
});

// ── setTempHp ─────────────────────────────────────────────────────────────────

describe('setTempHp', () => {
  test('sets temp HP when higher than current', () => {
    const { state } = applyHealthMutation(makeState({ tempHealth: 5 }), 'setTempHp', 15);
    expect(state.tempHealth).toBe(15);
  });

  test('does NOT replace temp HP when current is higher', () => {
    const { state } = applyHealthMutation(makeState({ tempHealth: 20 }), 'setTempHp', 10);
    expect(state.tempHealth).toBe(20);
  });

  test('temp HP capped at effectiveCap', () => {
    const { state } = applyHealthMutation(
      makeState({ maxHp: 100, radiation: 60, tempHealth: 0 }), 'setTempHp', 60
    );
    // effectiveCap = 40; 60 capped to 40
    expect(state.tempHealth).toBe(40);
  });

  test('temp HP of 0 clears temp HP if current is 0', () => {
    const { state } = applyHealthMutation(makeState({ tempHealth: 0 }), 'setTempHp', 0);
    expect(state.tempHealth).toBe(0);
  });

  test('temp HP cannot exceed cap even with no rads', () => {
    const { state } = applyHealthMutation(
      makeState({ maxHp: 50, radiation: 0, tempHealth: 0 }), 'setTempHp', 100
    );
    expect(state.tempHealth).toBe(50);
  });
});

// ── isRadiationSick ───────────────────────────────────────────────────────────

describe('isRadiationSick', () => {
  test('false when debuffs is empty', () => {
    expect(isRadiationSick(makeState())).toBe(false);
  });

  test('true when RAD_SICKNESS_DEBUFF is in debuffs', () => {
    expect(isRadiationSick(makeState({ debuffs: [RAD_SICKNESS_DEBUFF] }))).toBe(true);
  });

  test('works when debuffs contain string entries', () => {
    expect(isRadiationSick(makeState({ debuffs: ['rad_sickness'] }))).toBe(true);
  });

  test('false when other debuffs are present but not rad_sickness', () => {
    expect(isRadiationSick(makeState({ debuffs: [{ id: 'poisoned', name: 'Poisoned' }] }))).toBe(false);
  });
});

// ── Combined / integration edge cases ─────────────────────────────────────────

describe('edge cases', () => {
  test('damage with both temp HP and rads: temp absorbs first, then real HP', () => {
    const { state } = applyHealthMutation(
      makeState({ hp: 30, maxHp: 100, radiation: 50, tempHealth: 10 }), 'damage', 25
    );
    // 10 absorbed by temp, 15 from real HP (30 → 15)
    expect(state.tempHealth).toBe(0);
    expect(state.hp).toBe(15);
  });

  test('addRads then heal: healing stops at new effectiveCap', () => {
    let { state } = applyHealthMutation(
      makeState({ hp: 80, maxHp: 100, radiation: 0 }), 'addRads', 50
    );
    // After rads: cap=50, hp clamped to 50
    expect(state.hp).toBe(50);

    ({ state } = applyHealthMutation(state, 'heal', 100));
    // heal capped at effectiveCap=50
    expect(state.hp).toBe(50);
  });

  test('removeRads then heal: can now heal up to the raised cap', () => {
    let { state } = applyHealthMutation(
      makeState({ hp: 20, maxHp: 100, radiation: 80 }), 'removeRads', 80
    );
    // rads removed; hp stays 20, cap now 100
    expect(state.hp).toBe(20);
    expect(state.radiation).toBe(0);

    ({ state } = applyHealthMutation(state, 'heal', 80));
    expect(state.hp).toBe(100);
  });

  test('tempHP set to 0 after massive rad spike drives cap to 0', () => {
    const { state } = applyHealthMutation(
      makeState({ maxHp: 100, radiation: 0, tempHealth: 40 }), 'addRads', 100
    );
    // effectiveCap = 0; tempHealth → 0
    expect(state.tempHealth).toBe(0);
    expect(state.hp).toBe(0);
  });

  test('rad sickness onset message contains penalty description', () => {
    const { events } = applyHealthMutation(
      makeState({ maxHp: 100, radiation: 79 }), 'addRads', 1
    );
    const onset = events.find(e => e.type === 'rad_sickness_onset');
    expect(onset).toBeDefined();
    expect(onset.message).toMatch(/Strength/i);
    expect(onset.message).toMatch(/Agility/i);
  });

  test('full cycle: damage → heal → addRads → removeRads → clearRads', () => {
    var s = makeState({ hp: 100, maxHp: 100, radiation: 0, tempHealth: 20 });

    // Take 30 damage (temp absorbs 20, real absorbs 10)
    ({ state: s } = applyHealthMutation(s, 'damage', 30));
    expect(s.tempHealth).toBe(0);
    expect(s.hp).toBe(90);

    // Heal 5
    ({ state: s } = applyHealthMutation(s, 'heal', 5));
    expect(s.hp).toBe(95);

    // Add 80 rads → rad sickness; hp clamped to 20
    ({ state: s } = applyHealthMutation(s, 'addRads', 80));
    expect(s.hp).toBe(20);
    expect(isRadiationSick(s)).toBe(true);

    // Heal attempt: capped at 20 (effectiveCap)
    ({ state: s } = applyHealthMutation(s, 'heal', 60));
    expect(s.hp).toBe(20);

    // Remove 40 rads → still >= 80%? 40/100 = 40% → no longer sick
    ({ state: s } = applyHealthMutation(s, 'removeRads', 40));
    expect(s.radiation).toBe(40);
    expect(isRadiationSick(s)).toBe(false);
    expect(s.hp).toBe(20); // hp unchanged

    // Now heal up to new cap (60)
    ({ state: s } = applyHealthMutation(s, 'heal', 50));
    expect(s.hp).toBe(60);

    // Clear remaining rads
    ({ state: s } = applyHealthMutation(s, 'removeRads', 40));
    expect(s.radiation).toBe(0);

    // Heal to full
    ({ state: s } = applyHealthMutation(s, 'heal', 40));
    expect(s.hp).toBe(100);
  });
});
