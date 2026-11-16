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
  const addBot = button();
  const clearBots = button();
  const slots = { children: [], replaceChildren(...children) { this.children = children; }, append(child) { this.children.push(child); } };
  const makeNode = () => ({ children: [], dataset: {}, append(...children) { this.children.push(...children); } });
  const nodes = {
    '#multiBackButton': button(), '#multiReadyButton': readyButton, '#multiAddBot': addBot, '#multiClearBots': clearBots,
    '#lobbyWelcome': { textContent: 'MATI' }, '#multiTrainButton':button(),
    '#multiPartySummary': { textContent: '' }, '#multiSlots': slots,
    '#multiFeedback': { textContent: '' },
  };
  const previous = globalThis.document;
  globalThis.document = {
    querySelectorAll(selector) { return selector === '[data-multi-mode]' ? modes : classes; },
    querySelector(selector) { return nodes[selector] || null; },
    createElement() { return makeNode(); },
  };
  try {
    const prototype = new MultiplayerPrototype({ showScreen() {} });
    prototype.render();
    assert.equal(nodes['#multiTrainButton'].disabled,true);
    modes[1].listeners.click();
    classes[2].listeners.click();
    readyButton.listeners.click();
    assert.equal(nodes['#multiPartySummary'].textContent, 'Versus · Azul / Guardián');
    assert.equal(slots.children[0].children[1].children[0].textContent,'MATI');
    assert.equal(slots.children[0].children[1].children[1].textContent,'AZUL / GUARDIÁN');
    assert.equal(readyButton.label.textContent, 'LISTO PARA JUGAR');
    assert.match(nodes['#multiFeedback'].textContent, /falta un aliado/i);
    addBot.listeners.click();
    addBot.listeners.click();
    assert.equal(slots.children.length, 4);
    assert.equal(slots.children[1].children[1].children[0].textContent, 'ALIADO DE PRUEBA 1');
    assert.equal(slots.children[1].children[2].textContent, 'B');
    readyButton.listeners.click();
    assert.equal(nodes['#multiTrainButton'].disabled,false);
    clearBots.listeners.click();
    assert.equal(slots.children.length, 4);
    assert.equal(slots.children[1].children[1].children[0].textContent, 'ESPACIO LIBRE');
    assert.equal(nodes['#multiTrainButton'].disabled,true);
  } finally {
    globalThis.document = previous;
  }
});
