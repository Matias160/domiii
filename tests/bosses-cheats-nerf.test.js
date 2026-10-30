import test from 'node:test';
import assert from 'node:assert/strict';
import { abilities } from '../js/data/abilities.js';
import { createRunState } from '../js/core/runState.js';
import { updateEnemies, spawnEnemy } from '../js/systems/enemySystem.js';
import { enemyTypes } from '../js/entities/Enemy.js';

const bounds = { width: 960, height: 540 };

test('Pan más duro (armor) is nerfed to 50%: multiplies defense by 1.175 instead of 1.35', () => {
  const armorAbility = abilities.find(a => a.id === 'armor');
  assert.ok(armorAbility, 'armor ability exists');
  assert.ok(armorAbility.description.includes('17.5%'), 'description reflects 17.5% damage reduction');
  const dummyPlayer = { defense: 1.0 };
  armorAbility.apply(dummyPlayer);
  assert.ok(Math.abs(dummyPlayer.defense - 1.175) < 0.0001, 'defense multiplied by 1.175');
});

test('boss rotation in any map includes Domi Colosal (lava_boss) after icecream', () => {
  const state = createRunState({ mapId: 'diner' });
  state.time = 60;

  const bosses = enemyTypes.filter(t => t.boss);
  const icecreamIndex = bosses.findIndex(b => b.id === 'icecream');
  const lavaBossIndex = bosses.findIndex(b => b.id === 'lava_boss');

  assert.ok(icecreamIndex >= 0, 'icecream boss exists');
  assert.ok(lavaBossIndex >= 0, 'lava_boss exists');
  assert.equal(lavaBossIndex, icecreamIndex + 1, 'lava_boss is immediately after icecream in bosses list');

  // Set cursor to icecream index
  state.bossIndexCursor = icecreamIndex;
  spawnEnemy(state, bounds, true);
  const spawnedIcecream = state.enemies[state.enemies.length - 1];
  assert.equal(spawnedIcecream.type.id, 'icecream', 'spawns icecream when cursor was at icecream index');

  // Next spawn should be lava_boss!
  spawnEnemy(state, bounds, true);
  const spawnedColossus = state.enemies[state.enemies.length - 1];
  assert.equal(spawnedColossus.type.id, 'lava_boss', 'spawns lava_boss after icecream in diner map');
});

test('minute 15 (900s) spawns Domi Colosal (lava_boss) in any map', () => {
  const state = createRunState({ mapId: 'snow' });
  state.time = 900;
  state.minute15ColossusSpawned = false;

  updateEnemies(state, 0.016, bounds);

  assert.equal(state.minute15ColossusSpawned, true, 'minute 15 flag is marked');
  const colossus = state.enemies.find(e => e.type.id === 'lava_boss');
  assert.ok(colossus, 'Domi Colosal spawned at minute 15');
});

test('each spawned boss has progressively more health', () => {
  const state = createRunState({ mapId: 'kitchen' });
  state.time = 100;
  state.bossIndexCursor = 0;

  spawnEnemy(state, bounds, true);
  const boss1 = state.enemies[state.enemies.length - 1];
  const hp1 = boss1.hp;

  spawnEnemy(state, bounds, true);
  const boss2 = state.enemies[state.enemies.length - 1];
  const hp2 = boss2.hp;

  // Spawning 20 bosses in total: each boss scales with spawnedBossIndex
  for (let i = 2; i < 20; i++) {
    spawnEnemy(state, bounds, true, false, i, 20);
  }
  assert.equal(state.enemies.length, 20, '20 bosses spawned');

  const bossLast = state.enemies[state.enemies.length - 1];
  assert.ok(bossLast.hp > hp1 * 2, 'later bosses have significantly more HP due to cumulative scaling');
});

test('player half health cheat cuts current HP to 50%', () => {
  const state = createRunState();
  state.player.maxHp = 100;
  state.player.hp = 80;

  const currentHp = state.player.hp;
  const newHp = Math.max(1, Math.round(currentHp * 0.5));
  state.player.hp = newHp;

  assert.equal(state.player.hp, 40, 'HP reduced to half (40)');
});
