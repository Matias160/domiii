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
