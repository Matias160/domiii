import test from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../js/core/input.js';

test('touchAxis updates getAxis vector and clamps to unit length', () => {
  const input = new Input();

  // Initial axis should be zero
  assert.deepEqual(input.getAxis(), { x: 0, y: 0 });

  // Small movements within deadzone (< 0.05) are ignored
  input.touchAxis = { x: 0.03, y: -0.02 };
  assert.deepEqual(input.getAxis(), { x: 0, y: 0 });

  // Legitimate analog joystick movement
  input.touchAxis = { x: 0.6, y: -0.8 };
  const axis = input.getAxis();
  assert.ok(Math.abs(axis.x - 0.6) < 0.01);
  assert.ok(Math.abs(axis.y - (-0.8)) < 0.01);

  // If vector length exceeds 1, it is normalized to 1
  input.touchAxis = { x: 1.5, y: 1.5 };
  const normAxis = input.getAxis();
  const len = Math.hypot(normAxis.x, normAxis.y);
  assert.ok(Math.abs(len - 1.0) < 0.0001);

  // Clear resets touchAxis
  input.clear();
  assert.deepEqual(input.touchAxis, { x: 0, y: 0 });
  assert.deepEqual(input.getAxis(), { x: 0, y: 0 });
});

test('touchAxis combines smoothly with keyboard input', () => {
  const input = new Input();
  input.keys.add('d'); // moving right with keyboard
  input.touchAxis = { x: 0, y: 0.7 }; // touching down with joystick

  const axis = input.getAxis();
  assert.ok(axis.x > 0);
  assert.ok(axis.y > 0);
  const len = Math.hypot(axis.x, axis.y);
  assert.ok(len <= 1.0001);
});
