import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunState } from '../js/core/runState.js';
import { skins } from '../js/data/skins.js';
import { shopItems } from '../js/data/shop.js';

test('Cosmo is a selectable skin with directional sprite assets', () => {
  assert.equal(shopItems.find(item => item.id === 'cosmo')?.type, 'skin');
  assert.ok(skins.cosmo.animatedAsset);
});

test('Cosmo uses the last horizontal direction while moving vertically and at rest', () => {
  const player = createRunState({ skinId: 'cosmo' }).player;
  let axis = { x: -1, y: 0 };
  const input = { getAxis: () => axis, consume: () => false };
  const bounds = { width: 1920, height: 1080 };
  player.update(0.016, input, bounds);
  assert.equal(player.spriteState, 'left');
  axis = { x: 0, y: -1 };
  player.update(0.016, input, bounds);
  assert.equal(player.spriteState, 'left');
  axis = { x: 0, y: 0 };
  player.update(0.016, input, bounds);
  assert.equal(player.spriteState, 'idle-left');
  axis = { x: 1, y: 0 };
  player.update(0.016, input, bounds);
  assert.equal(player.spriteState, 'right');
  axis = { x: 0, y: 0 };
  player.update(0.016, input, bounds);
  assert.equal(player.spriteState, 'idle-right');
});
