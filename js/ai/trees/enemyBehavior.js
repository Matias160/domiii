import { SelectorNode, SequenceNode, ActionNode, ConditionNode, NodeStatus } from '../BehaviorTree.js';
import { gameEvents } from '../../core/EventBus.js';

/**
 * Creates a Behavior Tree for Bosses in domiii.
 * Handles Phase 2 enrage, bullet volleys, telegraphed special attacks, and charge attacks.
 */
export function createBossBehaviorTree() {
  return new SelectorNode([
    // 1. Phase 2 Enrage Transition
    new SequenceNode([
      new ConditionNode(boss => !boss.phaseTwo && boss.hp <= boss.maxHp * 0.5),
      new ActionNode((boss, state) => {
        boss.phaseTwo = true;
        boss.speed *= 1.12;
        boss.volleyTimer = Math.min(boss.volleyTimer, 1.2);
        if (state) {
          state.directorNotice = `${boss.type.name.toUpperCase()} / FASE 2`;
          state.shake = Math.max(state.shake, 0.35);
          state.rings?.push({ x: boss.x, y: boss.y, radius: boss.radius + 70, life: 0.7, maxLife: 0.7, color: '#ff4f9a' });
        }
        gameEvents.emit('boss:phaseTwo', { boss, state });
        return NodeStatus.SUCCESS;
      })
    ]),

    // 2. Telegraphed Bullet Volley
    new SequenceNode([
      new ConditionNode(boss => boss.volleyTimer <= 0),
      new ActionNode((boss, state) => {
        if (!state) return NodeStatus.FAILURE;
        state.rings?.push({ x: boss.x, y: boss.y, radius: boss.radius + 38, life: 0.45, maxLife: 0.45, color: '#ff879e' });
        boss.volleyTimer = boss.type.bossStyle === 'ranged' ? (boss.phaseTwo ? 2.05 : 2.7) :
                           boss.type.bossStyle === 'heavy' ? (boss.phaseTwo ? 2.8 : 3.8) :
                           boss.type.bossStyle === 'frost' ? (boss.phaseTwo ? 2.4 : 3.2) :
                           boss.phaseTwo ? 3.5 : 5;

        const count = boss.type.bossStyle === 'ranged' ? 14 :
                      boss.type.bossStyle === 'heavy' ? 18 :
                      boss.type.bossStyle === 'frost' ? 12 : 10;
        const bulletSpeed = boss.type.bossStyle === 'heavy' ? 110 : boss.type.bossStyle === 'frost' ? 130 : 145;
        const bulletColor = boss.type.bossStyle === 'frost' ? '#a855f7' : boss.type.bossStyle === 'heavy' ? '#ffaa00' : undefined;

        for (let i = 0; i < count; i++) {
          const angle = (i * Math.PI * 2) / count + (state.time || 0) * 0.4;
          state.enemyProjectiles.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(angle) * bulletSpeed,
            vy: Math.sin(angle) * bulletSpeed,
            radius: 6,
            damage: boss.damage * 0.45,
            life: 4,
            color: bulletColor
          });
        }
        return NodeStatus.SUCCESS;
      })
    ]),

    // 3. Phase 2 Special Area Attack (Snipe / Rain / Freeze / Meteor / Shockwave)
    new SequenceNode([
      new ConditionNode(boss => boss.phaseTwo && boss.specialTimer <= 0),
      new ActionNode((boss, state) => {
        if (!state) return NodeStatus.FAILURE;
        const player = state.player;
        const kind = boss.type.bossStyle === 'ranged' ? 'snipe' :
                     boss.type.bossStyle === 'fast' ? 'rain' :
                     boss.type.bossStyle === 'frost' ? 'freeze' :
                     boss.type.bossStyle === 'heavy' ? 'meteor' : 'shockwave';

        boss.specialTimer = kind === 'snipe' ? 3.6 : kind === 'rain' ? 3.1 : kind === 'freeze' ? 3.4 : 4.8;
        state.bossZones.push({
          kind,
          x: boss.x,
          y: boss.y,
          targetX: player.x,
          targetY: player.y,
          radius: kind === 'shockwave' ? 145 : kind === 'meteor' ? 85 : kind === 'freeze' ? 120 : 40,
          delay: kind === 'snipe' ? 0.8 : kind === 'meteor' ? 1.1 : 0.9,
          life: kind === 'shockwave' ? 1.15 : 1.25,
          damage: boss.damage * (kind === 'snipe' ? 0.65 : kind === 'meteor' ? 1.2 : 0.75),
          triggered: false
        });
        return NodeStatus.SUCCESS;
      })
    ]),

    // 4. Default Boss Movement (Ranged Kiting vs Stalk/Charge)
    new ActionNode((boss, state, bb) => {
      const delta = state.delta || 0.016;
      const player = state.decoy || state.player;
      if (boss.type.bossStyle === 'ranged') {
        const dx = player.x - boss.x;
        const dy = player.y - boss.y;
        const length = Math.hypot(dx, dy) || 1;
        const approach = length < 185 ? -0.5 : length > 280 ? 1 : 0;
        boss.x += (dx / length * approach - dy / length * 0.5) * boss.speed * delta;
        boss.y += (dy / length * approach + dx / length * 0.5) * boss.speed * delta;
      } else {
        boss.updateBoss(delta, player);
      }
      return NodeStatus.RUNNING;
    })
  ]);
}
