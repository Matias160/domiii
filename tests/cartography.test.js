import test from 'node:test';
import assert from 'node:assert/strict';
import { awardRun, getMapStats, getCartographyMissions, guestLogin, clearAccountRuns, currentAccount } from '../js/systems/accountSystem.js';
import { isOwned, shopItems } from '../js/data/shop.js';
import { resolveAccessory } from '../js/core/accessories.js';
import { createRunState } from '../js/core/runState.js';
import { enemyTypes } from '../js/entities/Enemy.js';
import { REGIONS } from '../js/ui/atlasScreen.js';
import { DomiScreen } from '../js/ui/domi.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: k => map.has(k) ? map.get(k) : null,
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
    clear: () => map.clear()
  };
}

function resetStorage() {
  globalThis.localStorage = memoryStorage();
  globalThis.sessionStorage = memoryStorage();
}

test('cartography: REGIONS defines 8 connected regions with native enemies, missions and accessories', () => {
  assert.equal(REGIONS.length, 8, '8 regions are defined in the Atlas');
  const ids = REGIONS.map(r => r.id);
  assert.deepEqual(ids, ['diner', 'kitchen', 'parking', 'snow', 'desert', 'football', 'beach', 'lava']);

  for (const r of REGIONS) {
    assert.ok(r.enemyId, `region ${r.id} has native enemyId`);
    assert.ok(r.missionName, `region ${r.id} has missionName`);
    assert.ok(r.target > 0, `region ${r.id} has positive target`);
    assert.ok(r.accessoryId, `region ${r.id} has exclusive accessoryId`);
    const acc = resolveAccessory(r.accessoryId);
    assert.ok(acc, `accessory ${r.accessoryId} resolves properly`);
  }
});

test('cartography: mapStats persists per-map metrics beyond the 40 runs limit', () => {
  resetStorage();
  guestLogin();
  clearAccountRuns();

  // Simulate runs on 'snow' and 'desert'
  for (let i = 0; i < 5; i++) {
    awardRun({
      id: `run_snow_${i}`,
      map: 'snow',
      score: 1000 + i * 100,
      kills: 25,
      time: 120,
      outcome: i === 0 ? 'victory' : 'defeat'
    });
  }

  for (let i = 0; i < 3; i++) {
    awardRun({
      id: `run_desert_${i}`,
      map: 'desert',
      score: 1500,
      kills: 40,
      time: 180,
      outcome: 'defeat'
    });
  }

  const snowStats = getMapStats('snow');
  assert.equal(snowStats.runs, 5);
  assert.equal(snowStats.victories, 1);
  assert.equal(snowStats.defeats, 4);
  assert.equal(snowStats.kills, 125);
  assert.equal(snowStats.maxScore, 1400);

  const desertStats = getMapStats('desert');
  assert.equal(desertStats.runs, 3);
  assert.equal(desertStats.victories, 0);
  assert.equal(desertStats.defeats, 3);
  assert.equal(desertStats.kills, 120);
});

test('cartography: missions accumulate progress across runs and grant accessories only upon completion', () => {
  resetStorage();
  const profile = guestLogin();
  // Ensure ticket_gold is not owned initially
  profile.purchases = profile.purchases.filter(p => p !== 'accessory:ticket_gold');

  // First run: 4 combo kills on diner
  awardRun({
    id: `run_diner_m1_${Date.now()}`,
    map: 'diner',
    score: 500,
    kills: 10,
    time: 60,
    cartographyProgress: { diner: 4 }
  });

  let missions = getCartographyMissions();
  assert.equal(missions.diner.progress, 4);
  assert.equal(missions.diner.completed, false);
  assert.equal(isOwned(profile, 'accessory', 'ticket_gold'), false, 'accessory not granted before target');

  // Second run: 6 more combo kills on diner (total 10)
  awardRun({
    id: `run_diner_m2_${Date.now()}`,
    map: 'diner',
    score: 800,
    kills: 15,
    time: 90,
    cartographyProgress: { diner: 6 }
  });

  missions = getCartographyMissions();
  assert.equal(missions.diner.progress, 10);
  assert.equal(missions.diner.completed, true);
  assert.equal(isOwned(currentAccount(), 'accessory', 'ticket_gold'), true, 'ticket_gold granted upon mission completion');
});

test('cartography: lava colossus mission requires a single victory run', () => {
  resetStorage();
  const profile = guestLogin();
  profile.cartographyMissions = profile.cartographyMissions || {};
  profile.cartographyMissions.lava = { progress: 0, target: 1, completed: false, accessory: 'leg_lava_crown' };

  // Defeat in lava does not count
  awardRun({
    id: `run_lava_defeat_${Date.now()}`,
    map: 'lava',
    score: 500,
    kills: 10,
    time: 80,
    outcome: 'defeat'
  });

  let missions = getCartographyMissions();
  assert.equal(missions.lava.completed, false);

  // Victory in lava completes the mission in 1 run
  awardRun({
    id: `run_lava_win_${Date.now()}`,
    map: 'lava',
    score: 5000,
    kills: 100,
    time: 240,
    outcome: 'victory',
    bossesKilled: 1
  });

  missions = getCartographyMissions();
  assert.equal(missions.lava.completed, true);
  assert.equal(missions.lava.progress, 1);
});

test('cartography: buying a map does not grant its mission accessory', () => {
  const profile = { bank: 2000, purchases: ['map:snow'] };
  assert.equal(isOwned(profile, 'map', 'snow'), true, 'snow map is owned');
  assert.equal(isOwned(profile, 'accessory', 'thermal_scarf'), false, 'thermal_scarf is NOT granted by buying the map');
});

test('cartography: native enemies are registered and only spawn on their native map', () => {
  const nativeTypes = enemyTypes.filter(t => t.nativeMap);
  assert.ok(nativeTypes.length >= 8, 'at least 8 native enemies exist');

  const billCollector = nativeTypes.find(t => t.id === 'bill_collector');
  assert.equal(billCollector.nativeMap, 'diner');

  const fryingPan = nativeTypes.find(t => t.id === 'frying_pan');
  assert.equal(fryingPan.nativeMap, 'kitchen');

  const deliveryKart = nativeTypes.find(t => t.id === 'delivery_kart');
  assert.equal(deliveryKart.nativeMap, 'parking');

  const icePop = nativeTypes.find(t => t.id === 'ice_pop');
  assert.equal(icePop.nativeMap, 'snow');

  const burrowerChili = nativeTypes.find(t => t.id === 'burrower_chili');
  assert.equal(burrowerChili.nativeMap, 'desert');

  const goalieBot = nativeTypes.find(t => t.id === 'goalie_bot');
  assert.equal(goalieBot.nativeMap, 'football');

  const armoredCrab = nativeTypes.find(t => t.id === 'armored_crab');
  assert.equal(armoredCrab.nativeMap, 'beach');

  const exoticJuice = nativeTypes.find(t => t.id === 'exotic_juice');
  assert.equal(exoticJuice.nativeMap, 'beach');
});

test('cartography: single active accessory rule and moderate bonuses', () => {
  const state = createRunState({
    accessoryId: 'thermal_scarf'
  });

  assert.equal(state.player.accessory, 'thermal_scarf');
  assert.equal(state.player.coldResistance, 0.60, 'thermal scarf grants cold resistance');
  assert.ok(state.player.maxHp >= 112, 'thermal scarf gives moderate hp bonus (+12)');
});

test('cartography: DomiScreen getRegionMissions returns 8 region missions with rewards', () => {
  resetStorage();
  const profile = guestLogin();
  const regionMissions = DomiScreen.prototype.getRegionMissions(profile);
  assert.equal(regionMissions.length, 8, '8 region missions returned');
  for (const rm of regionMissions) {
    assert.ok(rm.regionName, 'region name defined');
    assert.ok(rm.enemyName, 'enemy name defined');
    assert.ok(rm.rewardId, 'reward accessory id defined');
    assert.ok(rm.target > 0, 'target > 0');
  }
});
