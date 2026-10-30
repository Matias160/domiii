import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { 
  MODES_DATA, 
  MAPS_DATA, 
  PETS_DATA, 
  DIFFICULTIES_DATA, 
  getModePixelSvg, 
  getDifficultySkullSvgByTier,
  MenuScreen
} from '../js/ui/menuScreen.js';

test('setup menu: definitions contain 4 independent categories with real content', () => {
  assert.equal(MODES_DATA.length, 3, '3 game modes');
  assert.deepEqual(MODES_DATA.map(m => m.id), ['survival', 'waves', 'rush']);

  assert.equal(MAPS_DATA.length, 8, '8 maps available');
  assert.deepEqual(MAPS_DATA.map(m => m.id), ['diner', 'kitchen', 'parking', 'snow', 'desert', 'football', 'lava', 'beach']);

  assert.equal(PETS_DATA.length, 6, '6 companion options');
  assert.deepEqual(PETS_DATA.map(p => p.id), ['none', 'ketchup', 'drone', 'taco', 'soda', 'parrilla']);

  assert.equal(DIFFICULTIES_DATA.length, 4, '4 progressive difficulty tiers');
  assert.deepEqual(DIFFICULTIES_DATA.map(d => d.id), ['suave', 'picante', 'extra', 'quemado']);
});

test('setup menu: SVGs and skull colors evolve progressively', () => {
  // Modes pixel illustrations
  for (const mode of MODES_DATA) {
    const svg = getModePixelSvg(mode.id);
    assert.match(svg, /<svg viewBox="0 0 24 24"/, `Mode ${mode.id} has pixel SVG`);
  }

  // Difficulty skulls progress from green (suave) to yellow/amber (picante) to orange (extra) to red (quemado)
  const suaveSvg = getDifficultySkullSvgByTier('suave');
  assert.match(suaveSvg, /#4ade80|#22c55e/, 'Suave skull has green tones');

  const picanteSvg = getDifficultySkullSvgByTier('picante');
  assert.match(picanteSvg, /#facc15|#eab308/, 'Picante skull has yellow/amber tones');

  const extraSvg = getDifficultySkullSvgByTier('extra');
  assert.match(extraSvg, /#fb923c|#f97316/, 'Extra skull has orange tones');

  const quemadoSvg = getDifficultySkullSvgByTier('quemado');
  assert.match(quemadoSvg, /#ef4444|#dc2626/, 'Quemado skull has red tones');
});

test('setup menu: HTML preserves 4 horizontal bars, badges and lower reward/briefing section', () => {
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');

  // 4 category bars in 2x2 grid
  assert.match(indexHtml, /class="setup-categories-grid"/, 'Has setup-categories-grid container');
  assert.match(indexHtml, /id="catBarMode"/, 'Has Modo category bar');
  assert.match(indexHtml, /id="catBarMap"/, 'Has Mapas category bar');
  assert.match(indexHtml, /id="catBarCompanion"/, 'Has Mascotas category bar');
  assert.match(indexHtml, /id="catBarDifficulty"/, 'Has Dificultad category bar');

  // Independent horizontal rows
  assert.match(indexHtml, /id="rowMode"/, 'Has rowMode');
  assert.match(indexHtml, /id="rowMap"/, 'Has rowMap');
  assert.match(indexHtml, /id="rowCompanion"/, 'Has rowCompanion');
  assert.match(indexHtml, /id="rowDifficulty"/, 'Has rowDifficulty');

  // Category badges
  assert.match(indexHtml, /id="badgeMode"/, 'Has badgeMode');
  assert.match(indexHtml, /id="badgeMap"/, 'Has badgeMap');
  assert.match(indexHtml, /id="badgeCompanion"/, 'Has badgeCompanion');
  assert.match(indexHtml, /id="badgeDifficulty"/, 'Has badgeDifficulty');

  // Reward briefing section preserved in lower area
  assert.match(indexHtml, /id="setupMapBriefing"/, 'Preserves map briefing in lower area');
  assert.match(indexHtml, /class="setup-accessory-bar"/, 'Preserves accessory bar');
});

test('setup menu: independent selection logic does not affect other categories', () => {
  const mockInputs = {
    mode: { value: 'waves', dispatchEvent() {} },
    map: { value: 'diner', dispatchEvent() {} },
    companion: { value: 'none', dispatchEvent() {} },
    difficulty: { value: 'picante', dispatchEvent() {} }
  };

  const fakeInstance = {
    modeInput: mockInputs.mode,
    mapInput: mockInputs.map,
    companionInput: mockInputs.companion,
    difficultyInput: mockInputs.difficulty,
    game: { audio: { play() {} } },
    syncCards() {}
  };

  // Change mode to survival -> only modeInput changes
  MenuScreen.prototype.selectCategoryOption.call(fakeInstance, 'mode', 'survival');
  assert.equal(fakeInstance.modeInput.value, 'survival');
  assert.equal(fakeInstance.mapInput.value, 'diner');
  assert.equal(fakeInstance.companionInput.value, 'none');
  assert.equal(fakeInstance.difficultyInput.value, 'picante');

  // Change difficulty to extra -> only difficultyInput changes
  MenuScreen.prototype.selectCategoryOption.call(fakeInstance, 'difficulty', 'extra');
  assert.equal(fakeInstance.modeInput.value, 'survival');
  assert.equal(fakeInstance.mapInput.value, 'diner');
  assert.equal(fakeInstance.companionInput.value, 'none');
  assert.equal(fakeInstance.difficultyInput.value, 'extra');
});

test('lobby portal: label and action say JUGAR and portal/cuadro size is increased by 50%', () => {
  const lobbySrc = fs.readFileSync(path.resolve('js/ui/lobby.js'), 'utf8');
  const lobbyArtSrc = fs.readFileSync(path.resolve('js/ui/lobbyArt.js'), 'utf8');

  // Verify portal station says JUGAR
  assert.match(lobbySrc, /id:\s*'portal',\s*x:\s*960,\s*y:\s*240,\s*label:\s*'JUGAR',\s*action:\s*'JUGAR'/, 'Portal station is configured as JUGAR');

  // Verify expanded portal hitboxes (rx=135 vs 85, maxDist=210 vs 140)
  assert.match(lobbySrc, /const rx=\(s\.id==='portal'\)\?135:85/, 'Portal click/hover radius expanded');
  assert.match(lobbySrc, /maxDist=\(station\?\.id==='portal'\)\?210:140/, 'Portal interaction range expanded');

  // Verify portal graphic is 240x240 (160 * 1.5)
  assert.match(lobbyArtSrc, /pw\s*=\s*240,\s*ph\s*=\s*240/, 'Portal sprite graphic is 240x240 (50% larger than 160)');

  // Verify marquee sign frame ("cuadro") is 260x63 (174 * 1.5 = 261, 42 * 1.5 = 63)
  assert.match(lobbyArtSrc, /signW\s*=\s*isPortal\s*\?\s*260\s*:\s*174/, 'Cuadro width is 260 for portal (50% larger than 174)');
  assert.match(lobbyArtSrc, /signH\s*=\s*isPortal\s*\?\s*63\s*:\s*42/, 'Cuadro height is 63 for portal (50% larger than 42)');

  // Verify font size is 16px (10 * 1.5 = 15-16)
  assert.match(lobbyArtSrc, /isPortal\?16:10/, 'Label font size is scaled up 50% for portal');
});


test('hud & pause: top-left portrait/weapon/abilities removed and streak moved to pause menu', () => {
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
  const hudSrc = fs.readFileSync(path.resolve('js/ui/hud.js'), 'utf8');
  const hudCanvasSrc = fs.readFileSync(path.resolve('js/ui/hudCanvas.js'), 'utf8');
  const gameSrc = fs.readFileSync(path.resolve('js/game.js'), 'utf8');

  // Verify removed elements in index.html
  assert.ok(!indexHtml.includes('id="hudPortrait"'), 'hudPortrait canvas removed from index.html');
  assert.ok(!indexHtml.includes('id="hudWeapon"'), 'hudWeapon removed from index.html');
  assert.ok(!indexHtml.includes('id="weaponEvolutionStatus"'), 'weaponEvolutionStatus removed from index.html');
  assert.ok(!indexHtml.includes('id="hudName"'), 'hudName removed from index.html');

  // Verify pause screen contains RACHA stat
  assert.match(indexHtml, /id="pauseCombo"/, 'pauseCombo element is in pause summary');

  // Verify hud.js does not update removed elements
  assert.ok(!hudSrc.includes("'hudWeapon'"), 'hud.js does not track hudWeapon');
  assert.ok(!hudSrc.includes("'weaponEvolutionStatus'"), 'hud.js does not track weaponEvolutionStatus');
  assert.ok(!hudSrc.includes('#hudPortrait'), 'hud.js does not query hudPortrait');

  // Verify hudCanvas.js removed drawCombo from render loop
  assert.ok(!hudCanvasSrc.includes('this.drawCombo(ctx, combo'), 'drawCombo is not called in combat render loop');

  // Verify game.js populates pauseCombo
  assert.match(gameSrc, /pauseCombo:\s*combo\s*>\s*0/, 'game.js populates pauseCombo with streak/multiplier');
});

test('combat mechanics: mini health bar above player, superwave halved, continuous spawning during boss', () => {
  const playerSrc = fs.readFileSync(path.resolve('js/entities/Player.js'), 'utf8');
  const enemySystemSrc = fs.readFileSync(path.resolve('js/systems/enemySystem.js'), 'utf8');

  // Verify mini health bar drawn in Player.js
  assert.ok(playerSrc.includes('barW = 34, barH = 4'), 'Mini health bar dimensions defined in Player.js');
  assert.ok(playerSrc.includes("hpRatio > 0.5 ? '#35d9aa'"), 'Health bar has reactive color');

  // Verify superwave halved
  assert.ok(enemySystemSrc.includes('Math.min(15,'), 'Superwave initial swarm reduced to 15 (half of 30)');
  assert.ok(enemySystemSrc.includes('batch = isSuperwave ? 3 :'), 'Superwave batch reduced to 3 (half of 6)');

  // Verify continuous spawning during boss
  assert.ok(!enemySystemSrc.includes('(activeBossCount > 0 && !isPicante) ? false'), 'Spawning is not stopped when boss is alive');
});

test('upgrade progression: ability choices unlocked strictly every 2 levels (even levels)', () => {
  const scoreSrc = fs.readFileSync(path.resolve('js/systems/scoreSystem.js'), 'utf8');
  const gameSrc = fs.readFileSync(path.resolve('js/game.js'), 'utf8');

  // Verify reachedLevel % 2 === 0 in scoreSystem.js
  assert.ok(scoreSrc.includes('reachedLevel % 2 === 0'), 'scoreSystem grants ability flag on even levels');

  // Verify game.js handles isAbilityLevel without returning early from stats
  assert.ok(gameSrc.includes('this.state.pendingLevels = Math.min(1,'), 'game.js banks pending levels on ability levels');
});
