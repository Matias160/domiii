import test from 'node:test';
import assert from 'node:assert/strict';
import { register, login, logout, currentAccount } from '../js/systems/accountSystem.js';

const KEY = 'domi2pancho.accounts.v1';
function resetStorage() {
  const storage = () => {
    const entries = new Map();
    return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value)), removeItem: key => entries.delete(key) };
  };
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
}

test('valid names matching object properties can register and log in', async () => {
  resetStorage();
  for (const name of ['constructor', '__proto__', 'toString']) {
    await register(name, 'prueba123');
    logout();
    await login(name, 'prueba123');
    assert.equal(currentAccount().name, name);
  }
  assert.equal(Object.keys(JSON.parse(localStorage.getItem(KEY))).length, 3);
});

test('concurrent registrations preserve both accounts and reject duplicate names', async () => {
  resetStorage();
  await Promise.all([register('Primera', 'prueba123'), register('Segunda', 'prueba123')]);
  assert.equal(Object.keys(JSON.parse(localStorage.getItem(KEY))).length, 2);
  const results = await Promise.allSettled([register('Tercera', 'prueba123'), register('tercera', 'otra1234')]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(Object.keys(JSON.parse(localStorage.getItem(KEY))).length, 3);
});

test('damaged account data is never silently overwritten by registration', async () => {
  resetStorage();
  for (const raw of ['{broken', '[]', 'null', '42']) {
    localStorage.setItem(KEY, raw);
    await assert.rejects(register('Nueva', 'prueba123'), /No se pudo leer/);
    assert.equal(localStorage.getItem(KEY), raw);
  }
});

test('storage failures produce actionable messages and allow the login screen to load', async () => {
  resetStorage();
  localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  await assert.rejects(register('Nueva', 'prueba123'), /No se pudo guardar/);
  assert.equal(currentAccount(), null);
  sessionStorage.getItem = () => { throw new Error('SecurityError'); };
  assert.equal(currentAccount(), null);
});

test('invalid credentials never start a session', async () => {
  resetStorage();
  await register('Pancho', 'prueba123');
  logout();
  await assert.rejects(login('Pancho', 'incorrecta'), /incorrectos/);
  await assert.rejects(login('NoExiste', 'prueba123'), /incorrectos/);
  assert.equal(currentAccount(), null);
});
