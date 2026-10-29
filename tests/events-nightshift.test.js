import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunState } from '../js/core/runState.js';
import { updateDirector, scoreMultiplier, openDeliveryChest } from '../js/systems/directorSystem.js';
import { updateProjectiles } from '../js/systems/projectileSystem.js';
import { updateMap } from '../js/systems/mapSystem.js';
import { resolveDeaths } from '../js/systems/scoreSystem.js';
import { Enemy, enemyTypes } from '../js/entities/Enemy.js';
import { Projectile } from '../js/entities/Projectile.js';

const bounds = { width: 960, height: 540 };

test('delivery_truck event spawns armored delivery chest with escort, takes damage and drops loot on break', () => {
  const state = createRunState();
  state.time = 32;
  state.nextEventAt = 32;

  // Force delivery_truck event (index 4 in events array: 4/6 = ~0.67)
  updateDirector(state, 0.016, bounds, () => 0.68);
  assert.equal(state.activeEvent.id, 'delivery_truck');
  assert.ok(state.deliveryChest, 'armored delivery chest was spawned');
  assert.equal(state.deliveryChest.hp, 60);
  assert.equal(state.deliveryChest.opened, false);
  assert.ok(state.enemies.length >= 5, 'guard escort spawned around chest');

  const chest = state.deliveryChest;
  const initialHp = chest.hp;

  // 1. Damage via player projectile
  const proj = new Projectile({
    x: chest.x - 5,
    y: chest.y,
    vx: 100,
    vy: 0,
    size: 6,
    damage: 25,
    color: '#fff',
    pierce: 1,
    kind: 'fork'
  });
  state.projectiles = [proj];
  updateProjectiles(state, 0.016, bounds);

  assert.ok(chest.hp < initialHp, 'chest took projectile damage');

  // 2. Damage via player dash
  state.player.x = chest.x - 10;
  state.player.y = chest.y;
  state.player.dashTime = 0.18;
  state.player.dashSequence = 99;
  updateMap(state, 0.016);

  assert.ok(chest.hp < initialHp - 25, 'chest took additional dash damage');

  // 3. Breaking the chest awards 500 bonus points and golden loot
  const scoreBefore = state.score || 0;
  chest.hp = 0;
  openDeliveryChest(state);

  assert.equal(state.deliveryChest, null, 'chest is removed after opening');
  assert.ok((state.score || 0) >= scoreBefore + 500, 'awarded 500+ score bonus');
  assert.ok(state.items.length >= 5, 'chest dropped bath of supplies');
});

test('health_inspection event spawns inspector squad and defeating them awards propinas gigantes', () => {
  const state = createRunState();
  state.time = 32;
  state.nextEventAt = 32;

  // Force health_inspection event (index 5 in events array: 5/6 = ~0.84)
  updateDirector(state, 0.016, bounds, () => 0.88);
  assert.equal(state.activeEvent.id, 'health_inspection');

  const inspectors = state.enemies.filter(e => e.type.id === 'inspector');
  assert.ok(inspectors.length >= 5, 'spawned squad of 5 health inspectors');

  // Defeat an inspector and check for propinas gigantes
  const inspector = inspectors[0];
  inspector.hp = 0;
  const scoreBefore = state.score;
  const itemsBefore = state.items.length;

  resolveDeaths(state, () => {});

  assert.ok(state.score > scoreBefore + 180, 'earned huge tip bonus points');
  assert.ok(state.items.length >= itemsBefore + 2, 'dropped tip items on death');
  const floater = state.floaters.find(f => f.text.includes('PROPINAS GIGANTES'));
  assert.ok(floater, 'floater announced PROPINAS GIGANTES');
});

test('turno nocturno 24hs activates at 15 minutes (900s) with infinite scaling and score multiplier', () => {
  const state = createRunState();
  state.nextEventAt = Infinity; // isolate from random events
  state.time = 899;

  updateDirector(state, 0.5, bounds);
  assert.equal(state.nightShift, false, 'not active before 900s');

  state.time = 900;
  updateDirector(state, 0.5, bounds);
  assert.equal(state.nightShift, true, 'activates at 900s (15 min)');
  assert.equal(state.nightShiftLevel, 1);
  assert.ok(state.bossIntro, 'triggered cinematic announcement');
  assert.ok(state.bossIntro.bossName.includes('TURNO NOCTURNO'));

  // Multiplier without events: 1 * 1.5 = 1.5
  assert.equal(scoreMultiplier(state), 1.5, 'level 1 night shift gives 1.5x score');

  // Stacks with events: if PROMO 2x1 is active, 2 * 1.5 = 3x!
  state.activeEvent = { id: 'promo', duration: 18 };
  assert.equal(scoreMultiplier(state), 3.0, 'stacks with promo for 3.0x score');
  state.activeEvent = null;

  // Advance 60s to test infinite scaling level 2
  updateDirector(state, 61, bounds);
  assert.equal(state.nightShiftLevel, 2, 'escalates to level 2 after 60s');
  assert.equal(scoreMultiplier(state), 2.0, 'level 2 night shift gives 2.0x score');
});
