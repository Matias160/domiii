import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunState } from '../js/core/runState.js';
import { updateEnemies, SPAWN_REFILL } from '../js/systems/enemySystem.js';

const bounds = { width: 1920, height: 1080 };

test('while the start tutorial is running no enemies or bosses enter the arena', () => {
  const state = createRunState();
  state.holdSpawns = true;
  state.nextBossAt = 0;
  for (let i = 0; i < 60 * 30; i++) { state.time += 1 / 60; updateEnemies(state, 1 / 60, bounds); }
  assert.equal(state.enemies.length, 0);
  state.holdSpawns = false;
  state.nextBossAt = Infinity;
  for (let i = 0; i < 30; i++) { state.time += 1 / 60; updateEnemies(state, 1 / 60, bounds); }
  assert.ok(state.enemies.length > 0, 'enemies arrive as soon as the tutorial ends');
});

test('after killing the last enemy new ones arrive right away and close to the screen (regresión: arena vacía)', () => {
  const state = createRunState();
  state.nextBossAt = Infinity;
  state.time = 120;
  state.camera = { x: 480, y: 270 };
  state.view = { w: 960, h: 540 };
  state.player.x = 960; state.player.y = 540;
  state.enemies = [];
  state.spawnTimer = 5; // aunque el reloj normal estuviera lejos
  updateEnemies(state, 1 / 60, bounds);
  assert.equal(state.enemies.length, SPAWN_REFILL.emptyBurst, 'an empty arena gets a small burst at once');
  for (const enemy of state.enemies) {
    const outside = Math.max(state.camera.x - enemy.x, enemy.x - (state.camera.x + 960), state.camera.y - enemy.y, enemy.y - (state.camera.y + 540), 0);
    assert.ok(outside <= 110, 'they spawn just outside the edge of the screen, not far away');
  }
  let t = 0;
  while (state.enemies.length < 6 && t < 3) { state.time += 1 / 60; t += 1 / 60; updateEnemies(state, 1 / 60, bounds); }
  assert.ok(t < 1.5, 'the arena refills to the minimum quickly');
});
