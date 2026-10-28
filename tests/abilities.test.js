import test from 'node:test';
import assert from 'node:assert/strict';
import { abilities, applyAbility, getAbilityChoices } from '../js/data/abilities.js';
import { skins } from '../js/data/skins.js';
import { weapons } from '../js/data/weapons.js';
import { Player } from '../js/entities/Player.js';
import { Enemy, enemyTypes } from '../js/entities/Enemy.js';
import { updateProjectiles } from '../js/systems/projectileSystem.js';
import { Game } from '../js/game.js';

function player(weapon = weapons.fork) {
  return new Player({ name: 'Pancho', skin: skins.pancho, weapon, x: 100, y: 100 });
}

test('overflow XP grants every earned level', () => {
  const pancho = player();
  assert.equal(pancho.gainXp(100), 2);
  assert.equal(pancho.level, 3);
  assert.equal(pancho.xp, 34);
});

test('ability choices are distinct and capped abilities disappear', () => {
  const pancho = player();
  const choices = getAbilityChoices(pancho, () => 0.5);
  assert.equal(choices.length, 3);
  assert.equal(new Set(choices.map(choice => choice.id)).size, 3);
  const extraShot = abilities.find(ability => ability.id === 'extraShot');
  for (let index = 0; index < extraShot.maxStacks; index += 1) {
    assert.equal(applyAbility(pancho, extraShot), true);
  }
  assert.equal(pancho.extraProjectiles, 6);
  assert.equal(applyAbility(pancho, extraShot), false);
  assert.ok(!getAbilityChoices(pancho, () => 0.5).includes(extraShot));
});

test('attack and defense upgrades change actual player stats', () => {
  const pancho = player();
  pancho.hp = 30;
  for (const id of ['rapidFire', 'hotSauce', 'piercing', 'sneakers', 'extraPortion']) {
    applyAbility(pancho, abilities.find(ability => ability.id === id));
  }
  assert.equal(pancho.fireRateMultiplier, 0.65);
  assert.equal(pancho.damageMultiplier, 1.5);
  assert.equal(pancho.pierceBonus, 2);
  assert.equal(pancho.speed, skins.pancho.speed * 1.30);
  assert.equal(pancho.maxHp, 150);
  assert.equal(pancho.hp, 90);
});

test('piercing projectile hits each enemy only once', () => {
  const pancho = player();
  applyAbility(pancho, abilities.find(ability => ability.id === 'piercing'));
  const type = enemyTypes[0];
  const difficulty = { hp: 1, speed: 1, damage: 1 };
  const first = new Enemy({ x: 100, y: 100, type, difficulty });
  const second = new Enemy({ x: 112, y: 100, type, difficulty });
  const state = { player: pancho, enemies: [first, second], projectiles: [] };
  const originalRandom=Math.random;Math.random=()=>.5;
  try {
    updateProjectiles(state, 0, { width: 960, height: 540 });
    assert.equal(first.hp, first.maxHp - pancho.weapon.damage);
    assert.equal(second.hp, second.maxHp - pancho.weapon.damage);
    updateProjectiles(state, 0, { width: 960, height: 540 });
    assert.equal(first.hp, first.maxHp - pancho.weapon.damage);
    assert.equal(second.hp, second.maxHp - pancho.weapon.damage);
  } finally { Math.random=originalRandom; }
});

test('earned cards are banked one at a time, freeze the run on the game screen and advance after selection', () => {
  const options = {
    dataset: {},
    buttons: [],
    replaceChildren() { this.buttons = []; },
    append(button) { this.buttons.push(button); },
    querySelector() { return this.buttons[0]; },
  };
  const previousDocument = globalThis.document;
  const overlay={classList:{add(){},remove(){}}};
  globalThis.document = {
    querySelector: selector => selector==='#abilityScreen'?overlay:options,
    createElement: () => ({ attributes:{},dataset:{},style:{setProperty(){}},children:[],setAttribute(key,value){this.attributes[key]=value;},addEventListener() {}, focus() {}, append(...n){this.children.push(...n);}, prepend(...n){this.children.unshift(...n);} }),
  };
  try {
    const game = Object.create(Game.prototype);
    game.state = { player: player(), pendingLevels: 0 };
    game.screenId='gameScreen';game.running=true;
    game.hud = { update() {} };
    let buildUpdates=0;game.renderLiveBuild=()=>{buildUpdates++;};
    game.showScreen = id => { game.screenId = id; game.running = id === 'gameScreen'; };
    game.showToast = () => {};
    game.onLevelUp();
    game.onLevelUp();
    assert.equal(game.state.pendingLevels, 1, 'only one earned card waits its turn (no back-to-back cards)');
    game.showAbilityChoices();
    assert.equal(game.screenId, 'gameScreen');
    assert.equal(game.running, true);
    assert.equal(options.buttons.length, 3);
    options.buttons.forEach((button,index)=>{assert.equal(button.attributes['aria-keyshortcuts'],String(index+1));assert.match(button.innerHTML,/pixel-key choice-key/);});
    const first = abilities.find(ability => options.buttons[0].innerHTML.includes(ability.name));
    game.chooseAbility(first);
    assert.equal(game.state.pendingLevels, 0);
    assert.equal(game.screenId, 'gameScreen');
    game.showAbilityChoices();
    const second = abilities.find(ability => options.buttons[0].innerHTML.includes(ability.name));
    game.chooseAbility(second);
    assert.equal(game.state.pendingLevels, 0);
    assert.equal(buildUpdates,2);
    assert.equal(game.screenId, 'gameScreen');
    assert.equal(game.running, true);
  } finally {
    globalThis.document = previousDocument;
  }
});

test('boss cutscenes move the camera to the boss even when the player is far away', () => {
  const game = Object.create(Game.prototype);
  game.view = { w: 960, h: 540 };
  game.state = { camera: { x: 0, y: 0 }, world: { width: 1920, height: 1080 } };
  const boss = { x: 1700, y: 900 };
  for (let i = 0; i < 90; i++) game.focusCameraOn(boss, 1 / 60);
  const cam = game.state.camera;
  assert.ok(boss.x > cam.x && boss.x < cam.x + 960 && boss.y > cam.y && boss.y < cam.y + 540, 'boss inside the view');
  assert.ok(Math.abs(cam.x - (1920 - 960)) < 2 && Math.abs(cam.y - (1080 - 540)) < 2, 'clamped to the world edge');
});

test('reaching a power level pauses once with an explanation, and pressing its key uses it', async () => {
  const { createRunState } = await import('../js/core/runState.js');
  const nodes = new Map();
  const previousDocument = globalThis.document;
  globalThis.document = { querySelector: selector => { if (!nodes.has(selector)) nodes.set(selector, { hidden: true, textContent: '' }); return nodes.get(selector); } };
  try {
    const game = Object.create(Game.prototype);
    game.state = createRunState();
    game.running = true; game.screenId = 'gameScreen';
    game.showToast = () => {};
    game.audio = { play() {} };
    game.checkPrimeUnlocks();
    assert.equal(game.primeIntro, undefined, 'nothing before level 5');
    game.state.player.level = 5;
    game.checkPrimeUnlocks();
    assert.equal(game.primeIntro?.key, 'q');
    assert.equal(nodes.get('#primeIntro').hidden, false);
    assert.match(nodes.get('#primeIntroHint').textContent, /Q/);
    assert.equal(game.triggerPrime('e'), false, 'other keys do nothing while the intro is open');
    assert.equal(game.triggerPrime('q'), true, 'its own key closes the intro and fires the power');
    assert.equal(game.primeIntro, null);
    assert.ok(game.state.primeCooldowns.q > 0);
    game.checkPrimeUnlocks();
    assert.equal(game.primeIntro, null, 'each power is announced only once per run');
  } finally {
    globalThis.document = previousDocument;
  }
});
