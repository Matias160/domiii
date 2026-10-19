import test from 'node:test';
import assert from 'node:assert/strict';
import { bindAuth } from '../js/ui/authScreen.js';
import { currentAccount, logout } from '../js/systems/accountSystem.js';

test('registration, duplicate submits, password visibility and login errors work together', async () => {
  const previousDocument = globalThis.document;
  const elements = new Map();
  const element = () => ({
    value: '', type: 'password', hidden: true, disabled: false, readOnly: false,
    attributes: {}, handlers: {}, textContent: '',
    addEventListener(type, callback) { this.handlers[type] = callback; },
    setAttribute(key, value) { this.attributes[key] = value; },
    focus() { this.focused = true; },
    fire(type, extra = {}) { return this.handlers[type]?.({ preventDefault() {}, ...extra }); },
  });
  const storage = () => {
    const entries = new Map();
    return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
  };
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
  globalThis.document = { querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, element());
    return elements.get(selector);
  } };
  const get = id => elements.get('#' + id);
  const screens = [];
  try {
    bindAuth({ menu: { prepareAccount() {} }, showScreen: screen => screens.push(screen) });
    get('authSwitch').fire('click');
    assert.equal(get('authPassword').autocomplete, 'new-password');
    assert.equal(get('authNameHint').hidden, false);
    get('authName').value = 'PruebaUI';
    get('authPassword').value = 'claveDePrueba';
    get('authPasswordToggle').fire('click');
    assert.equal(get('authPassword').type, 'text');
    get('authPassword').fire('keydown', { getModifierState: () => true });
    assert.equal(get('authCapsLock').hidden, false);

    const pending = get('authForm').fire('submit');
    assert.equal(get('authSubmit').disabled, true);
    assert.equal(get('authName').readOnly, true);
    get('authSwitch').fire('click');
    await get('authForm').fire('submit');
    await pending;
    assert.deepEqual(screens, ['lobbyScreen']);
    assert.equal(currentAccount().name, 'PruebaUI');
    assert.equal(get('authPassword').value, '');
    assert.equal(get('authPassword').type, 'password');
    assert.equal(get('authSubmit').disabled, false);

    logout();
    get('authSwitch').fire('click');
    assert.equal(get('authPassword').autocomplete, 'current-password');
    get('authPassword').value = 'incorrecta';
    await get('authForm').fire('submit');
    assert.equal(currentAccount(), null);
    assert.match(get('authError').textContent, /incorrectos/);
    assert.equal(get('authError').hidden, false);
    assert.equal(get('authError').focused, true);
    assert.equal(get('authSubmit').disabled, false);
    assert.equal(get('authForm').attributes['aria-busy'], 'false');
    get('authForm').fire('input');
    assert.equal(get('authError').hidden, true);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
