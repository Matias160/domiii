import test from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../js/core/input.js';

test('game controls respect menus, keyboard buttons, movement and focus loss', () => {
  const listeners = new Map();
  const previousWindow = globalThis.window;
  globalThis.window = { addEventListener: (type, listener) => listeners.set(type, listener) };
  try {
    const input = new Input();
    const press = (key, target = { closest: () => null }) => {
      const event = { key, target, repeat: false, prevented: false, preventDefault() { this.prevented = true; } };
      listeners.get('keydown')(event);
      return event;
    };
    press('w');
    assert.deepEqual(input.getAxis(), { x: 0, y: 0 });
    input.enabled = true;
    assert.equal(press('ArrowUp').prevented, true);
    assert.equal(input.getAxis().y, -1);
    listeners.get('blur')();
    assert.deepEqual(input.getAxis(), { x: 0, y: 0 });
    const button = { closest: selector => selector === 'button, a, summary' ? {} : null };
    assert.equal(press(' ', button).prevented, false);
    assert.equal(input.consume(' '), false);
    assert.equal(press(' ').prevented, true);
    assert.equal(input.consume(' '), true);
    input.clear();
    press('w', { closest: () => ({}) });
    assert.deepEqual(input.getAxis(), { x: 0, y: 0 });
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
