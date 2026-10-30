import fs from 'node:fs';
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
  assert.ok(colossus.hp >= 8000, "Domi Colosal must have reinforced HP >= 8000");
  assert.ok(colossus.damage >= 30, "Domi Colosal must have increased damage >= 30");
  assert.ok(colossus.armor >= 1.8, "Domi Colosal must have hardened armor >= 1.8");
});

test('legendary accessory Corona Magmática Imperial is defined and resolved', () => {
  const acc = resolveAccessory('leg_lava_crown');
  assert.ok(acc, 'leg_lava_crown must be resolved');
  assert.equal(acc.tier, 'legendary');
  assert.equal(acc.sheet, 'animated_corona');
  assert.ok(acc.stats.hp.includes('+50'));
  assert.ok(acc.stats.dmg.includes('+30%'));
});

test('starting run on map lava initializes boss_legendary mode, with normal stats and no recipe, and spawns Domi Colosal', () => {
  const state = createRunState({ mapId: 'lava' });
  assert.equal(state.mapId, 'lava');
  assert.equal(state.modeId, 'boss_legendary');
  assert.equal(modes.boss_legendary.name, '???');
  assert.equal(state.difficulty.name, '???');
  assert.equal(state.nextBossAt, 3.5);
  assert.equal(state.nextEventAt, Infinity);
  assert.equal(state.player.level, 1, 'Player must have normal level 1');
  assert.equal(state.player.weaponEvolution, null, 'Weapon must be base without evolution');
  assert.equal(Object.keys(state.player.abilities).length, 0, 'No recipe abilities allowed');

  // Advance time to 3.5s to trigger boss spawn after suspense
  state.time = 3.6;
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


test('victory celebration section is present in index.html with final.gif', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /id="victoryCelebration"/);
  assert.match(html, /id="victoryGif"/);
  assert.match(html, /src="\.\/final\.gif"/);
  assert.match(html, /style="display: none;"/);
});

test('GameOverScreen hides victory celebration on defeat and shows only on lava victory', async () => {
  const { GameOverScreen } = await import('../js/ui/gameOverScreen.js');

  const elements = {
    '#gameOverPhrase': { hidden: false, style: {} },
    '#gameOverStats': { hidden: false, style: {}, innerHTML: '', append() {} },
    '#victoryCelebration': { hidden: true, style: { display: 'none' } },
    '#victoryGif': { src: '' },
    '#retryButton': { addEventListener() {} },
    '#gameOverMenuButton': { addEventListener() {} },
    '#gameOverPixelBanner': { hidden: false, style: {}, textContent: '', className: '' },
    '#resultEyebrow': { hidden: false, style: {}, textContent: '' },
    '#resultTitle': { hidden: false, style: {}, textContent: '' },
    '#newAchievements': { hidden: false, style: {}, replaceChildren() {} },
    '.gameOver-panel-enhanced': {
      classes: new Set(),
      classList: {
        toggle(cls, val) {
          if (val) elements['.gameOver-panel-enhanced'].classes.add(cls);
          else elements['.gameOver-panel-enhanced'].classes.delete(cls);
        }
      }
    }
  };

  const prevDoc = globalThis.document;
  globalThis.document = {
    querySelector: (sel) => elements[sel] || null
  };

  try {
    const screen = new GameOverScreen({ restartLastRun() {}, showScreen() {} });

    // 1. Defeat in lava map after 9 seconds (the exact case the user hit)
    screen.render({ outcome: 'defeat', map: 'lava', time: 9, score: 0, kills: 0, difficulty: '???' }, 100);
    assert.equal(elements['#victoryCelebration'].hidden, true);
    assert.equal(elements['#victoryCelebration'].style.display, 'none');
    assert.equal(elements['.gameOver-panel-enhanced'].classes.has('is-legendary-lava-victory'), false);
    assert.equal(elements['#gameOverStats'].hidden, false);
    assert.notEqual(elements['#gameOverStats'].style.display, 'none');

    // 2. Victory in lava map
    screen.render({ outcome: 'victory', map: 'lava', time: 120, score: 5000, kills: 1, difficulty: '???' }, 100);
    assert.equal(elements['#victoryCelebration'].hidden, false);
    assert.equal(elements['#victoryCelebration'].style.display, 'flex');
    assert.equal(elements['.gameOver-panel-enhanced'].classes.has('is-legendary-lava-victory'), true);
    assert.equal(elements['#gameOverStats'].hidden, true);
    assert.equal(elements['#gameOverStats'].style.display, 'none');
  } finally {
    globalThis.document = prevDoc;
  }
});

test('Domi Colosal charge wall hit triggers stunned state with double damage and item drop', () => {
  const state = createRunState({ mapId: 'lava' });
  const colossusType = enemyTypes.find(t => t.id === 'lava_boss');
  const boss = new Enemy({ x: 100, y: 300, type: colossusType, difficulty: state.difficulty });
  boss.spawnTime = 0;
  boss.bossPhase = 'charge';
  boss.chargeVelocity = { x: -1, y: 0 };
  state.enemies = [boss];
  state.items = [];

  // Boss collides with left boundary
  boss.x = boss.radius + 10;
  boss.update(0.016, state.player, state);

  assert.equal(boss.bossPhase, 'stunned');
  assert.equal(boss.armor, 0.5, 'Stunned boss should receive double damage (armor 0.5)');
  assert.ok(state.items.length >= 1, 'Stunned boss should drop tactical recovery item');
});

test('Domi Colosal falls once (no second life), plays its death sequence and only then wins', async () => {
  const { resolveDeaths } = await import('../js/systems/scoreSystem.js');
  const state = createRunState({ mapId: 'lava' });
  const colossusType = enemyTypes.find(t => t.id === 'lava_boss');
  const boss = new Enemy({ x: 960, y: 300, type: colossusType, difficulty: state.difficulty });
  boss.spawnTime = 0; boss.hp = 0;
  state.enemies = [boss];
  resolveDeaths(state, () => {});
  assert.equal(boss.enraged, undefined, 'the colossus does not get the regular boss second life');
  assert.ok(state.bossDying, 'death sequence starts');
  assert.equal(state.bossesKilled || 0, 0, 'victory waits for the sequence');
  assert.equal(state.enemies.filter(e => !e.isBoss).length, 0, 'no minions released in the final duel');
  updateDirector(state, 0.016, bounds);
  assert.notEqual(state.victory, true);
});
