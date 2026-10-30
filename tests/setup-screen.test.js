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
