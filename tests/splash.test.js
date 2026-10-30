import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { drawSplashFrame, SPLASH } from '../js/ui/splash.js';

test('the PanchOS x BurgosCorp intro draws every moment of its timeline without errors', () => {
  const calls = { fillRect: 0, fillText: [] };
  const ctx = new Proxy({}, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'fillRect') return () => { calls.fillRect++; };
      if (key === 'fillText') return value => { calls.fillText.push(value); };
      if (key === 'measureText') return value => ({ width: String(value).length * 8 });
      return () => {};
    },
    set(target, key, value) { target[key] = value; return true; },
  });
  for (let t = 0; t <= SPLASH.end; t += 1 / 30) drawSplashFrame(ctx, t);
  assert.ok(calls.fillRect > 1000, 'pixel art is drawn');
  assert.ok(calls.fillText.includes('PanchOS'));
  assert.ok(calls.fillText.includes('P R E S E N T A N'));
});

test('the page opens on the intro, not on the login screen', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="splashScreen"/);
  // Marca BurgosCorp tal cual el proyecto RN3 (BrandLogo.tsx): escudo, borde rojo, monograma BC y nombre
  assert.ok(html.includes('d="M24 2 43 9v14c0 11.5-8 19.8-19 23C13 42.8 5 34.5 5 23V9Z"'));
  assert.ok(html.includes('stroke="#e11d2e"'));
  assert.ok(html.includes('font-family="Georgia"'));
  assert.ok(html.includes('Burgos<span class="splash-burgos__corp">Corp</span>'));
  assert.doesNotMatch(html, /id="authScreen" class="[^"]*screen--active/);
});
