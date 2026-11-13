import test from 'node:test';
import assert from 'node:assert/strict';
import { PrizeMachine } from '../js/ui/prizeMachine.js';
import { guestLogin, currentAccount, mutate } from '../js/systems/accountSystem.js';
import { isOwned } from '../js/data/shop.js';

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

test('PrizeMachine: initialization and cost', () => {
  resetStorage();
  const fakeGame = { audio: { play() {} }, showScreen() {} };
  const machine = new PrizeMachine(fakeGame);
  assert.equal(machine.cost, 150);
  assert.equal(machine.state, 'IDLE');
  assert.ok(machine.capsules.length >= 8);
});

test('PrizeMachine: pull deducts 150 points and grants unowned item', () => {
  resetStorage();
  const profile = guestLogin();
  profile.bank = 500;
  profile.purchases = [];

  const fakeGame = { audio: { play() {} }, showScreen() {} };
  const machine = new PrizeMachine(fakeGame);

  const initialPurchasesCount = profile.purchases.length;
  machine.pull();

  const updated = currentAccount();
  assert.equal(updated.bank, 350, 'Bank should be deducted 150 PT');
  assert.equal(machine.state, 'COIN', 'Animation should advance to COIN state');
  assert.ok(updated.purchases.length > initialPurchasesCount, 'A new item should be granted');
  assert.ok(machine.currentPrize, 'A prize should be selected');
});

test('PrizeMachine: rejects pull if insufficient points', () => {
  resetStorage();
  guestLogin();
  mutate(p => { p.bank = 50; return p; }); // less than 150

  const fakeGame = { audio: { play() {} }, showScreen() {} };
  const machine = new PrizeMachine(fakeGame);

  machine.pull();
  const updated = currentAccount();
  assert.equal(updated.bank, 50, 'Bank remains unchanged');
  assert.equal(machine.state, 'IDLE', 'State stays IDLE on failure');
});

test('PrizeMachine: one pull gives one prize and reveals it after the animation', () => {
  resetStorage();
  guestLogin();
  mutate(p => { p.bank = 500; return p; });

  const machine = new PrizeMachine({ audio: { play() {} }, showScreen() {} });
  machine.pull();
  const awarded = currentAccount().purchases.length;
  machine.pull();
  assert.equal(currentAccount().bank, 350, 'A rapid second click must not charge again');
  assert.equal(currentAccount().purchases.length, awarded);

  for (let i = 0; i < 140 && machine.state !== 'REVEAL'; i++) machine.update(0.05, i * 0.05);
  assert.equal(machine.state, 'REVEAL');
  assert.equal(machine.revealCard.hidden, false);
  assert.ok(machine.particles.length > 0, 'Reveal should launch celebratory particles');
  machine.pull();
  assert.equal(currentAccount().bank, 350, 'A pull behind the reward card must be ignored');
});

test('PrizeMachine never awards Señor Domi (skin:domi is strictly reserved for completing all missions)', () => {
  resetStorage();
  const profile = guestLogin();
  profile.bank = 10000;
  profile.purchases = [];

  const machine = new PrizeMachine({ audio: { play() {} }, showScreen() {} });
  // Verify 50 random prize picks never choose domi
  for (let i = 0; i < 50; i++) {
    const prize = machine.pickPrize(profile);
    assert.notEqual(prize.item?.id, 'domi', 'Señor Domi must never be rolled in the prize machine');
  }
});

test('PrizeMachine only awards common items, never mission or legendary exclusives', () => {
  resetStorage();
  const profile = guestLogin();
  profile.purchases = [];
  const machine = new PrizeMachine({ audio: { play() {} }, showScreen() {} });
  for (let i = 0; i < 100; i++) {
    const item = machine.pickPrize(profile).item;
    assert.ok(item && !item.domiExclusive && !item.cartographyExclusive);
    assert.ok(!String(item.id).startsWith('leg_'));
    assert.equal(item.rarity, 'common');
  }
});
