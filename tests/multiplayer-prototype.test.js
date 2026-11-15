import test from 'node:test';
import assert from 'node:assert/strict';
import { MultiplayerPrototype } from '../js/ui/multiplayerPrototype.js';

function button(dataset = {}) {
  const listeners = {};
  const classes = new Set();
  return {
    dataset,
    listeners,
    classList: { toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name), contains: name => classes.has(name) },
    setAttribute(name, value) { this[name] = value; },
    addEventListener(name, callback) { listeners[name] = callback; },
    querySelector() { return this.label ||= { textContent: '' }; },
  };
}

test('multiplayer prototype lets the player switch mode, support class and ready state', () => {
  const modes = [button({ multiMode: 'coop' }), button({ multiMode: 'versus' })];
  const classes = [button({ supportClass: 'red' }), button({ supportClass: 'green' }), button({ supportClass: 'blue' })];
  const readyButton = button();
  const nodes = {
    '#multiBackButton': button(), '#multiReadyButton': readyButton,
    '#lobbyWelcome': { textContent: 'MATI' }, '#multiPlayerName': { textContent: '' },
    '#multiPlayerClass': { textContent: '' }, '#multiPartySummary': { textContent: '' },
    '#multiFeedback': { textContent: '' },
  };
  const previous = globalThis.document;
  globalThis.document = {
    querySelectorAll(selector) { return selector === '[data-multi-mode]' ? modes : classes; },
    querySelector(selector) { return nodes[selector]; },
  };
  try {
    const prototype = new MultiplayerPrototype({ showScreen() {} });
    prototype.render();
    modes[1].listeners.click();
    classes[2].listeners.click();
    readyButton.listeners.click();
    assert.equal(nodes['#multiPartySummary'].textContent, 'Versus · Azul / Guardián');
    assert.equal(nodes['#multiPlayerName'].textContent, 'MATI');
    assert.equal(nodes['#multiPlayerClass'].textContent, 'AZUL / GUARDIÁN');
    assert.equal(readyButton.label.textContent, 'LISTO PARA JUGAR');
    assert.match(nodes['#multiFeedback'].textContent, /todavía no está implementada/i);
  } finally {
    globalThis.document = previous;
  }
});
