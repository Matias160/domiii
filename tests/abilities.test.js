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
  assert.equal(pancho.extraProjectiles, 3);
  assert.equal(applyAbility(pancho, extraShot), false);
  assert.ok(!getAbilityChoices(pancho, () => 0.5).includes(extraShot));
});

test('attack and defense upgrades change actual player stats', () => {
  const pancho = player();
  pancho.hp = 30;
  for (const id of ['rapidFire', 'hotSauce', 'piercing', 'sneakers', 'extraPortion']) {
    applyAbility(pancho, abilities.find(ability => ability.id === id));
  }
  assert.equal(pancho.fireRateMultiplier, 0.82);
  assert.equal(pancho.damageMultiplier, 1.25);
  assert.equal(pancho.pierceBonus, 1);
  assert.equal(pancho.speed, skins.pancho.speed * 1.15);
  assert.equal(pancho.maxHp, 125);
  assert.equal(pancho.hp, 65);
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

test('queued level choices stay beside active play and advance after selection', () => {
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
    createElement: () => ({ attributes:{},setAttribute(key,value){this.attributes[key]=value;},addEventListener() {}, focus() {} }),
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
    game.showAbilityChoices();
    assert.equal(game.screenId, 'gameScreen');
    assert.equal(game.running, true);
    assert.equal(options.buttons.length, 3);
    options.buttons.forEach((button,index)=>{assert.equal(button.attributes['aria-keyshortcuts'],String(index+1));assert.match(button.innerHTML,/pixel-key choice-key/);});
    const first = abilities.find(ability => options.buttons[0].innerHTML.includes(ability.name));
    game.chooseAbility(first);
    assert.equal(game.state.pendingLevels, 1);
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
