import test from 'node:test';
import assert from 'node:assert/strict';
import { drawCombatFeedback } from '../js/ui/combatFeedback.js';
import { createRunState } from '../js/core/runState.js';

// Canvas falso: acepta cualquier propiedad y cualquier método de dibujo
function fakeContext() {
  const gradient = { addColorStop() {} };
  return new Proxy({}, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'createRadialGradient' || key === 'createLinearGradient') return () => gradient;
      if (key === 'measureText') return () => ({ width: 40 });
      return () => {};
    },
    set(target, key, value) { target[key] = value; return true; },
  });
}

test('every boss attack zone draws while warning and while hitting (regresión: meteorito de queso)', () => {
  const state = createRunState();
  const ctx = fakeContext();
  for (const kind of ['snipe', 'rain', 'freeze', 'meteor', 'shockwave']) {
    for (const delay of [0.6, 0]) {
      state.bossZones = [{ kind, x: 300, y: 300, targetX: 420, targetY: 320, radius: 90, delay, life: 1, damage: 1, triggered: delay <= 0 }];
      assert.doesNotThrow(() => drawCombatFeedback(ctx, state, false), `${kind} con delay ${delay}`);
    }
  }
});
