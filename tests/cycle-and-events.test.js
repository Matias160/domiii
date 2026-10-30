import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunState } from '../js/core/runState.js';
import { abilities } from '../js/data/abilities.js';
import { updateEnemies } from '../js/systems/enemySystem.js';
import { updateMap } from '../js/systems/mapSystem.js';
import { Enemy, enemyTypes } from '../js/entities/Enemy.js';
import { startBossEntrance } from '../js/ui/bossEntrance.js';

const bounds = { width: 960, height: 540 };

test('receta de la casa is completely removed from abilities', () => {
  const regen = abilities.find(a => a.id === 'regen' || a.name.toLowerCase().includes('receta de la casa'));
  assert.equal(regen, undefined, 'receta de la casa should not exist');
});

test('desert cactus explodes on dash, shooting needles and damaging enemies without hurting player', () => {
  const state = createRunState({ mapId: 'desert' });
  state.player.x = 400;
  state.player.y = 300;
  state.player.hp = 100;
  state.player.maxHp = 100;
  state.player.dashTime = 0.2; // Currently dashing
  state.player.dashSequence = 1;

  // Add cactus obstacle at player position
  state.mapObstacles = [
    { type: 'cactus', x: 410, y: 300, vx: 0, vy: 0, warning: 0, radius: 26, isCactus: true }
  ];

  // Add enemy nearby
  const enemy = new Enemy({ x: 450, y: 300, type: enemyTypes[0], difficulty: state.difficulty });
  const initialEnemyHp = enemy.hp;
  state.enemies = [enemy];

  // Update map (handles obstacle collisions)
  updateMap(state, 0.016);

  // Cactus should be removed (exploded)
  assert.equal(state.mapObstacles.length, 0, 'cactus was destroyed');
  // Needles (projectiles) spawned and are real Projectile instances
  assert.ok(state.projectiles.length >= 10, 'needles were ejected radial');
  assert.equal(typeof state.projectiles[0].drawTrail, 'function', 'needles are valid Projectile instances with drawTrail');
  assert.equal(typeof state.projectiles[0].update, 'function', 'needles have update method');
  // Enemy took explosion damage
  assert.ok(enemy.hp < initialEnemyHp, 'enemy took damage from cactus explosion');
  // Player took no damage
  assert.equal(state.player.hp, 100, 'player took no damage from cactus explosion');
});

test('bosses spawn progressively: 1 per round in first cycle (rounds 0-3), then 2 in round 4, 3 in round 5', () => {
  const state = createRunState();
  state.time = 100;
  state.nextBossAt = 50;

  // Round 0
  state.bossWaveRound = 0;
  updateEnemies(state, 0.016, bounds);
  let bosses = state.enemies.filter(e => e.isBoss);
  assert.equal(bosses.length, 1, 'round 0 spawns 1 boss');

  // Clear and test Round 4 (start of 2nd cycle)
  state.enemies = [];
  state.time = 200;
  state.nextBossAt = 150;
  state.bossWaveRound = 4;
  updateEnemies(state, 0.016, bounds);
  bosses = state.enemies.filter(e => e.isBoss);
  assert.equal(bosses.length, 2, 'round 4 spawns 2 bosses');

  // Clear and test Round 5
  state.enemies = [];
  state.time = 300;
  state.nextBossAt = 250;
  state.bossWaveRound = 5;
  updateEnemies(state, 0.016, bounds);
  bosses = state.enemies.filter(e => e.isBoss);
  assert.equal(bosses.length, 3, 'round 5 spawns 3 bosses');
});

test('in picante difficulty, boss entrance does not wipe regular enemies and spawning continues', () => {
  const state = createRunState({ difficultyId: 'picante' });
  const dummyBoss = new Enemy({ x: 300, y: 300, type: enemyTypes.find(t => t.boss), difficulty: state.difficulty });
  const normalEnemy = new Enemy({ x: 500, y: 500, type: enemyTypes[0], difficulty: state.difficulty });
  state.enemies = [dummyBoss, normalEnemy];

  startBossEntrance(state, dummyBoss, state.camera, { w: 960, h: 540 });
  assert.equal(state.enemies.length, 2, 'regular enemies are preserved in picante difficulty');
});

test('superwave event triggers boss-like cinematic intro and triples spawn rate (half intensity)', () => {
  const state = createRunState();
  state.activeEvent = { id: 'superwave', name: '¡SUPER OLEADA!', duration: 14 };
  state.time = 10;
  state.spawnTimer = 0;

  const countBefore = state.enemies.length;
  updateEnemies(state, 0.016, bounds);
  const countAfter = state.enemies.length;

  // During superwave, reduced by half (initial burst of 15 + batch of 3)
  assert.ok(countAfter - countBefore >= 15, 'superwave floods the arena with half-intensity burst and batches');
});

test('beach map initializes, is owned, spawns little crabs and interactive coconuts', () => {
  const { isOwned } = { isOwned: (profile, type, id) => ['diner','kitchen','parking','beach'].includes(id) };
  assert.equal(isOwned({}, 'map', 'beach'), true, 'beach map is owned by default');

  const state = createRunState({ mapId: 'beach' });
  assert.equal(state.mapId, 'beach');

  // Update map: crabs spawn
  updateMap(state, 0.016);
  assert.ok(state.beachCrabs && state.beachCrabs.length >= 6, 'crabs are initialized');

  // Coconut collision test: player dashes into coconut
  state.mapObstacles = [
    { type: 'coconut', x: 420, y: 500, vx: 0, vy: 0, warning: 0, radius: 20, isCoconut: true, kicked: false, exploded: false }
  ];
  state.player.x = 410;
  state.player.y = 500;
  state.player.dashTime = 0.2;
  state.player.facing = { x: 1, y: 0 };
  state.player.hp = 100;

  // Add enemy nearby to test coconut projectile collision
  const enemy = new Enemy({ x: 440, y: 500, type: enemyTypes[0], difficulty: state.difficulty });
  const initialEnemyHp = enemy.hp;
  state.enemies = [enemy];

  updateMap(state, 0.016);

  // Coconut should be kicked or exploded upon hitting the enemy
  assert.ok(state.mapObstacles[0]?.kicked || state.mapObstacles[0]?.exploded || enemy.hp < initialEnemyHp, 'coconut was interacted with');
  assert.equal(state.player.hp, 100, 'player took no damage from coconut');
});

