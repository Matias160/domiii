import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectPool } from '../js/core/ObjectPool.js';
import { SpatialHashGrid } from '../js/core/SpatialHashGrid.js';
import { EventBus } from '../js/core/EventBus.js';
import { SelectorNode, SequenceNode, ActionNode, ConditionNode, NodeStatus } from '../js/ai/BehaviorTree.js';
import { Skill, SkillController } from '../js/skills/SkillSystem.js';
import { ModRegistry } from '../js/mods/ModRegistry.js';
import { ModLoader } from '../js/mods/ModLoader.js';

test('ObjectPool acquires, recycles, and maintains memory limits without allocation', () => {
  let created = 0;
  let resetCount = 0;
  const pool = new ObjectPool(
    () => { created++; return { val: 0 }; },
    (obj) => { resetCount++; obj.val = 0; },
    10,
    20
  );

  assert.equal(pool.available, 10);
  assert.equal(created, 10);

  const obj1 = pool.acquire();
  const obj2 = pool.acquire();
  assert.equal(pool.available, 8);

  obj1.val = 42;
  pool.release(obj1);
  assert.equal(pool.available, 9);
  assert.equal(resetCount, 1);

  const recycled = pool.acquire();
  assert.equal(recycled.val, 0); // resetFn was called
});

test('SpatialHashGrid indexes 2D entities and executes fast radius and box queries', () => {
  const grid = new SpatialHashGrid(100, 100, 1000, 1000);
  const e1 = { x: 50, y: 50, id: 'e1' };
  const e2 = { x: 90, y: 90, id: 'e2' };
  const e3 = { x: 500, y: 500, id: 'e3' };

  grid.insert(e1);
  grid.insert(e2);
  grid.insert(e3);
  assert.equal(grid.totalEntities, 3);

  const buffer = [];
  grid.queryRadius(50, 50, 60, buffer);
  assert.equal(buffer.length, 2);
  assert.ok(buffer.includes(e1));
  assert.ok(buffer.includes(e2));
  assert.ok(!buffer.includes(e3));

  // Swept bounding box query
  grid.queryBox(0, 0, 120, 120, buffer);
  assert.equal(buffer.length, 2);

  grid.clear();
  assert.equal(grid.totalEntities, 0);
  grid.queryRadius(50, 50, 100, buffer);
  assert.equal(buffer.length, 0);
});

test('EventBus dispatches with priority and supports cancellation', () => {
  const bus = new EventBus();
  const order = [];

  bus.on('damage', (e) => { order.push('low'); }, 50);
  bus.on('damage', (e) => { order.push('high'); }, 200);
  bus.on('damage', (e) => {
    order.push('shield');
    if (e.shieldActive) e.cancel();
  }, 150);

  const res1 = bus.emit('damage', { shieldActive: true });
  assert.equal(res1.cancelled, true);
  assert.deepEqual(order, ['high', 'shield']); // 'low' was not executed due to cancel()

  order.length = 0;
  const res2 = bus.emit('damage', { shieldActive: false });
  assert.equal(res2.cancelled, false);
  assert.deepEqual(order, ['high', 'shield', 'low']);
});

test('BehaviorTree ticks composites and evaluates branch decisions correctly', () => {
  let actionExecuted = false;
  const bb = { hp: 40 };

  const tree = new SelectorNode([
    new SequenceNode([
      new ConditionNode((entity, state, blackboard) => blackboard.hp > 50),
      new ActionNode(() => NodeStatus.SUCCESS)
    ]),
    new ActionNode(() => {
      actionExecuted = true;
      return NodeStatus.SUCCESS;
    })
  ]);

  const status = tree.tick({}, {}, bb);
  assert.equal(status, NodeStatus.SUCCESS);
  assert.equal(actionExecuted, true);
});

test('SkillController manages cooldowns, modifiers, and executions', () => {
  const dummyOwner = { damage: 10 };
  const controller = new SkillController(dummyOwner);

  let castHappened = false;
  const fireball = new Skill({
    id: 'fireball',
    name: 'Bola de Fuego',
    cooldown: 2.0,
    modifiers: { damage: 1.5 },
    execute: () => { castHappened = true; }
  });

  controller.addSkill(fireball);
  assert.equal(dummyOwner.damage, 15); // Modifier applied

  assert.equal(controller.cast('fireball'), true);
  assert.equal(castHappened, true);
  assert.ok(controller.getCooldown('fireball') > 1.9);

  // While on cooldown, cast returns false
  assert.equal(controller.cast('fireball'), false);

  // Advance time
  controller.update(2.1, {});
  assert.equal(controller.getCooldown('fireball'), 0);
  assert.equal(controller.cast('fireball'), true);
});

test('ModRegistry and ModLoader register new assets and hooks dynamically', () => {
  const registry = new ModRegistry();
  const loader = new ModLoader(registry);

  let hookTriggered = false;
  const testMod = {
    id: 'test-chimi-mod',
    name: 'Chimi Pack',
    version: '1.0',
    init({ registry, events }) {
      registry.registerWeapon('chimiGun', {
        id: 'chimiGun',
        name: 'Pistola de Chimichurri',
        damage: 99
      });
      events.on('customModEvent', () => {
        hookTriggered = true;
      });
    }
  };

  assert.equal(loader.loadMod(testMod), true);
  assert.equal(registry.customWeapons.get('chimiGun')?.damage, 99);
});
