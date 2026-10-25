import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunState } from '../js/core/runState.js';
import { enemyTypes, Enemy } from '../js/entities/Enemy.js';
import { updateDirector, modes } from '../js/systems/directorSystem.js';
import { updateEnemies } from '../js/systems/enemySystem.js';
import { isOwned, shopItems } from '../js/data/shop.js';
import { ACCESSORIES, resolveAccessory } from '../js/core/accessories.js';

const bounds = { width: 1920, height: 1080 };

test('lava boss is registered with colossal stats and bossStyle colossus', () => {
  const colossus = enemyTypes.find(t => t.id === 'lava_boss');
  assert.ok(colossus, 'Domi Colosal must be defined in enemyTypes');
  assert.equal(colossus.boss, true);
  assert.equal(colossus.bossStyle, 'colossus');
  assert.equal(colossus.radius, 80);
  assert.ok(colossus.hp >= 4000);
});

test('legendary accessory Corona Magmática Imperial is defined and resolved', () => {
  const acc = resolveAccessory('leg_lava_crown');
  assert.ok(acc, 'leg_lava_crown must be resolved');
  assert.equal(acc.tier, 'legendary');
  assert.ok(acc.stats.hp.includes('+50'));
  assert.ok(acc.stats.dmg.includes('+30%'));
});

test('starting run on map lava initializes boss_legendary mode and spawns Domi Colosal', () => {
  const state = createRunState({ mapId: 'lava' });
  assert.equal(state.mapId, 'lava');
  assert.equal(state.modeId, 'boss_legendary');
  assert.equal(modes.boss_legendary.name, '???');
  assert.equal(state.difficulty.name, '???');
  assert.equal(state.nextBossAt, 2);
  assert.equal(state.nextEventAt, Infinity);

  // Advance time to 2.0s to trigger boss spawn
  state.time = 2.1;
  const spawned = updateEnemies(state, 0.016, bounds);
  assert.equal(spawned, true);

  const activeBoss = state.enemies.find(e => e.isBoss);
  assert.ok(activeBoss, 'Boss should be spawned');
  assert.equal(activeBoss.type.id, 'lava_boss');
  assert.equal(activeBoss.type.name, 'Domi Colosal');
  assert.equal(activeBoss.radius, 80);
});

test('Domi Colosal transitions through progressive phases and triggers victory when defeated', () => {
  const state = createRunState({ mapId: 'lava' });
  const colossusType = enemyTypes.find(t => t.id === 'lava_boss');
  const boss = new Enemy({ x: 960, y: 300, type: colossusType, difficulty: state.difficulty });
  boss.spawnTime = 0;
  state.enemies = [boss];

  // Phase 1 -> Phase 2 at 65% HP
  boss.hp = boss.maxHp * 0.60;
  updateEnemies(state, 0.016, bounds);
  assert.equal(boss.phaseTwo, true);
  assert.match(state.directorNotice, /FASE 2/);

  // Phase 2 -> Phase 3 at 30% HP
  boss.hp = boss.maxHp * 0.25;
  updateEnemies(state, 0.016, bounds);
  assert.equal(boss.phaseThree, true);
  assert.match(state.directorNotice, /FURIA TOTAL/);

  // Boss defeat triggers victory in lava map
  boss.hp = 0;
  state.bossesKilled = 1;
  updateDirector(state, 0.016, bounds);
  assert.equal(state.victory, true, 'Defeating Domi Colosal must trigger victory in Caldero de Lava');
});

test('Caldero de Lava and legendary items are marked domiExclusive and recognized in ownership checks', () => {
  const lavaMap = shopItems.find(item => item.id === 'lava' && item.type === 'map');
  assert.ok(lavaMap, 'Caldero de Lava must be in shopItems');
  assert.equal(lavaMap.domiExclusive, true);
  const legItems = shopItems.filter(item => item.id.startsWith('leg_'));
  assert.ok(legItems.length >= 12);
  assert.ok(legItems.every(item => item.domiExclusive === true));
  assert.equal(isOwned({ purchases: ['map:lava'] }, 'map', 'lava'), true);
  assert.equal(isOwned({ purchases: [] }, 'map', 'lava'), false);
  assert.equal(isOwned({ unlockedLava: true }, 'map', 'lava'), true);
});
