import { Projectile } from "../entities/Projectile.js";
import { sweptOverlap, distance } from "../core/collision.js";
import { damageEnemy, explosionBurst, burst } from './effectSystem.js';
import { gameEvents } from '../core/EventBus.js';
import { openDeliveryChest } from './directorSystem.js';

// Pre-allocated buffers for spatial queries
const collisionCandidates = [];
const splashCandidates = [];
const hitsBuffer = [];

export function updateProjectiles(state, delta, canvas) {
  autoFire(state);

  const bounds = state.world || canvas;
  state.enemyProjectiles ||= [];

  // 1. Update Enemy Projectiles with in-place array compaction (zero GC)
  let aliveEnemyShots = 0;
  const enemyShotLen = state.enemyProjectiles.length;
  for (let i = 0; i < enemyShotLen; i++) {
    const shot = state.enemyProjectiles[i];
    shot.previousX = shot.x;
    shot.previousY = shot.y;

    // Trail buffer recycling without object allocation
    if (!shot.trail) {
      shot.trail = [];
    }
    if (shot.trail.length < 8) {
      shot.trail.push({ x: shot.x, y: shot.y });
    } else {
      // Reuse oldest entry instead of shift() + push()
      const oldest = shot.trail[0];
      oldest.x = shot.x;
      oldest.y = shot.y;
      for (let t = 0; t < shot.trail.length - 1; t++) {
        shot.trail[t] = shot.trail[t + 1];
      }
      shot.trail[shot.trail.length - 1] = oldest;
    }

    shot.x += shot.vx * delta;
    shot.y += shot.vy * delta;
    shot.life -= delta;

    if (sweptOverlap(shot, state.player)) {
      shot.life = 0;
      if (state.player.takeDamage(shot.damage)) {
        state.shake = 0.18;
        state.audio?.play('damage');
        gameEvents.emit('onPlayerDamage', { player: state.player, damage: shot.damage, source: shot, state });
      }
    }

    if (shot.life > 0 && shot.x > -60 && shot.x < bounds.width + 60 && shot.y > -60 && shot.y < bounds.height + 60) {
      state.enemyProjectiles[aliveEnemyShots++] = shot;
    }
  }
  state.enemyProjectiles.length = aliveEnemyShots;

  // 2. Update Player Projectiles (boomerang & trail)
  const projLen = state.projectiles.length;
  for (let i = 0; i < projLen; i++) {
    const projectile = state.projectiles[i];
    if (projectile.boomerang && projectile.age + delta > 0.48) {
      if (!projectile.returning) {
        projectile.returning = true;
        projectile.hitEnemies.clear();
        projectile.pierce = Math.max(projectile.pierce, 2);
      }
      const dx = state.player.x - projectile.x;
      const dy = state.player.y - projectile.y;
      const length = Math.hypot(dx, dy) || 1;
      projectile.vx = (dx / length) * 690;
      projectile.vy = (dy / length) * 690;
      if (projectile.age > 1.45 || length < state.player.radius + 14) projectile.dead = true;
    }
    if (typeof projectile.update === 'function') {
      projectile.update(delta);
    } else {
      projectile.previousX = projectile.x; projectile.previousY = projectile.y;
      projectile.x += (projectile.vx || 0) * delta;
      projectile.y += (projectile.vy || 0) * delta;
      projectile.dead = (projectile.life = (projectile.life || 1) - delta) <= 0;
    }

    if (state.particles && !projectile.dead) {
      projectile.trailClock = (projectile.trailClock || 0) + delta * 30;
      const count = Math.min(3, Math.floor(projectile.trailClock));
      if (count > 0) {
        projectile.trailClock -= count;
        const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
        burst(state, projectile.x - (projectile.vx / speed) * projectile.radius * 2, projectile.y - (projectile.vy / speed) * projectile.radius * 2, '#ffe066', count, 20);
      }
    }
  }

  // 3. Collision Check: uses SpatialHashGrid for O(1) broadphase when available
  for (let i = 0; i < projLen; i++) {
    const projectile = state.projectiles[i];
    if (projectile.dead) continue;

    // Daño al Cofre Acorazado del Camión de Reparto
    if (state.deliveryChest && !state.deliveryChest.opened && state.deliveryChest.hp > 0 && !projectile.dead) {
      const chest = state.deliveryChest;
      if (Math.hypot(projectile.x - chest.x, projectile.y - chest.y) < projectile.radius + chest.radius) {
        chest.hp -= projectile.damage;
        chest.hitFlash = 0.12;
        state.audio?.play('hit');
        burst(state, projectile.x, projectile.y, '#f59e0b', 8, 80);
        if (state.floaters && state.floaters.length < 90) {
          state.floaters.push({
            x: chest.x,
            y: chest.y - 15,
            text: `-${Math.round(projectile.damage)}`,
            life: 0.65,
            color: '#f59e0b',
            scale: 0.85,
            kind: 'gain'
          });
        }
        if (chest.hp <= 0) {
          openDeliveryChest(state);
        }
        if (projectile.pierce > 0) {
          projectile.pierce -= 1;
        } else {
          projectile.dead = true;
          continue;
        }
      }
    }

    // Use Spatial Grid if initialized with entities, fallback to linear check
    let candidates;
    if (state.spatialGrid && state.spatialGrid.totalEntities > 0) {
      const minX = Math.min(projectile.previousX, projectile.x) - projectile.radius - 20;
      const maxX = Math.max(projectile.previousX, projectile.x) + projectile.radius + 20;
      const minY = Math.min(projectile.previousY, projectile.y) - projectile.radius - 20;
      const maxY = Math.max(projectile.previousY, projectile.y) + projectile.radius + 20;
      candidates = state.spatialGrid.queryBox(minX, minY, maxX, maxY, collisionCandidates);
    } else {
      candidates = state.enemies;
    }

    hitsBuffer.length = 0;
    const candLen = candidates.length;
    for (let c = 0; c < candLen; c++) {
      const enemy = candidates[c];
      if (enemy.hp > 0 && enemy.spawnTime <= 0 && !projectile.hitEnemies.has(enemy) && sweptOverlap(projectile, enemy)) {
        hitsBuffer.push(enemy);
      }
    }

    if (hitsBuffer.length > 1) {
      const px = projectile.previousX, py = projectile.previousY;
      hitsBuffer.sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py));
    }

    const hitLen = hitsBuffer.length;
    for (let h = 0; h < hitLen; h++) {
      const enemy = hitsBuffer[h];
      if (enemy.hp <= 0) continue;
      projectile.hitEnemies.add(enemy);
      const bossBonus = enemy.isBoss ? (state.player.skin.bossDamageMultiplier || 1) : 1;
      damageEnemy(state, enemy, projectile.damage * bossBonus);

      if (projectile.splash > 0) {
        state.rings?.push({ x: enemy.x, y: enemy.y, radius: projectile.splash, life: 0.5, color: '#ffcc77' });
        explosionBurst(state, enemy.x, enemy.y, projectile.color, 28, 170);

        const splashTargets = (state.spatialGrid && state.spatialGrid.totalEntities > 0)
          ? state.spatialGrid.queryRadius(enemy.x, enemy.y, projectile.splash, splashCandidates)
          : state.enemies;

        const splashLen = splashTargets.length;
        for (let s = 0; s < splashLen; s++) {
          const other = splashTargets[s];
          if (other !== enemy && distance(enemy, other) <= projectile.splash) {
            damageEnemy(state, other, projectile.damage * 0.45);
          }
        }
      }

      if (projectile.cluster) {
        projectile.cluster = false;
        for (let k = 0; k < 6; k++) {
          const angle = (k * Math.PI) / 3;
          state.projectiles.push(
            new Projectile({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angle) * 260,
              vy: Math.sin(angle) * 260,
              damage: projectile.damage * 0.34,
              size: Math.max(3, projectile.radius * 0.5),
              color: '#ffb347',
              pierce: 0,
              kind: 'explosiveBread'
            })
          );
        }
      }

      if (projectile.pierce > 0) {
        projectile.pierce -= 1;
      } else {
        projectile.dead = true;
        break;
      }
    }
  }

  // 4. In-place Projectile Compaction (Zero GC)
  let aliveProjectiles = 0;
  for (let i = 0; i < state.projectiles.length; i++) {
    const p = state.projectiles[i];
    if (!p.dead && p.x >= -60 && p.x <= bounds.width + 60 && p.y >= -60 && p.y <= bounds.height + 60) {
      state.projectiles[aliveProjectiles++] = p;
    }
  }
  state.projectiles.length = aliveProjectiles;
}

export function autoFire(state) {
  const player = state.player;
  let target = null;

  if (state.manualAim) {
    target = state.aimPoint;
  } else {
    // Fast O(N) linear search without array allocation (.filter().reduce() avoided)
    let closestDist = Infinity;
    const len = state.enemies.length;
    for (let i = 0; i < len; i++) {
      const enemy = state.enemies[i];
      if (enemy.hp > 0 && enemy.spawnTime <= 0) {
        const d = distance(player, enemy);
        if (d < closestDist) {
          closestDist = d;
          target = enemy;
        }
      }
    }
    if (state.deliveryChest && !state.deliveryChest.opened && state.deliveryChest.hp > 0) {
      const dChest = distance(player, state.deliveryChest);
      if (dChest < 260 && dChest < closestDist) {
        target = state.deliveryChest;
      }
    }
  }

  state.target = state.manualAim ? null : target;
  if (!target) return;

  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const angle = Math.atan2(dy, dx);
  player.aimAngle = angle;
  if (player.fireCooldown > 0) return;

  player.muzzleTime = 0.09;
  const weapon = player.weapon;
  const evolution = player.weaponEvolution;
  player.shotsFired = (player.shotsFired || 0) + 1;
  const empowered = evolution?.empoweredEvery && player.shotsFired % evolution.empoweredEvery === 0;
  const count = weapon.projectileCount + player.extraProjectiles + (player.comboFeverTime > 0 ? 2 : 0) + (evolution?.extraProjectiles || 0);
  const spread = count > 1 ? (evolution?.spread || 0.36) : 0;

  for (let index = 0; index < count; index += 1) {
    const offset = count === 1 ? 0 : -spread / 2 + (spread * index) / (count - 1);
    const finalAngle = angle + offset;
    state.projectiles.push(
      new Projectile({
        x: player.x,
        y: player.y,
        vx: Math.cos(finalAngle) * weapon.projectileSpeed * (player.projectileSpeedMultiplier || 1),
        vy: Math.sin(finalAngle) * weapon.projectileSpeed * (player.projectileSpeedMultiplier || 1),
        damage: weapon.damage * player.damageMultiplier * player.buffs.damageMultiplier * (evolution?.damageMultiplier || 1) * (empowered ? 2.1 : 1),
        size: weapon.projectileSize * player.projectileScale * (empowered ? 1.75 : 1),
        color: empowered ? '#fff27a' : weapon.color,
        pierce: weapon.pierce + player.pierceBonus + (evolution?.pierceBonus || 0) + (empowered ? 2 : 0),
        splash: Math.max((weapon.splash || 0) * (evolution?.splashMultiplier || 1), evolution?.splash || 0),
        kind: weapon.id,
        boomerang: Boolean(evolution?.boomerang),
        cluster: Boolean(evolution?.cluster),
      })
    );
  }

  player.fireCooldown = weapon.fireRate * player.fireRateMultiplier * player.buffs.fireRateMultiplier;
  if (weapon.fireRate >= 0.3) state.audio?.play('shoot');
}
