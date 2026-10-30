import { damageEnemy, burst, impactRing, particlePool, particleRoom, scaledCount } from './effectSystem.js';
import { scoreMultiplier, RUSH_BOSS_GOAL, BOSS_GAP } from './directorSystem.js';
import { gameEvents } from '../core/EventBus.js';
import { spawnBossMinions } from './enemySystem.js';
import { Item } from '../entities/Item.js';
import { items, rarities } from '../data/items.js';

const explosionCandidates = [];

export function spawnThematicEnemyDeath(state, enemy) {
  if (!state.particles) return;
  const id = enemy.type?.id || '';
  const isBoss = enemy.isBoss;

  if (isBoss) {
    state.shake = Math.max(state.shake || 0, 0.4);
    state.rings?.push({ x: enemy.x, y: enemy.y, radius: 120, life: 0.8, maxLife: 0.8, color: '#ffd700' });
    state.rings?.push({ x: enemy.x, y: enemy.y, radius: 70, life: 0.5, maxLife: 0.5, color: '#ff3366' });
    // El final del jefe siempre se festeja completo, sin recorte por calidad
    for (let i = 0; i < 45; i++) {
      const angle = (i / 45) * Math.PI * 2;
      const speed = 120 + Math.random() * 220;
      const life = 0.8 + Math.random() * 0.6;
      emitParticle(state, enemy.x, enemy.y, Math.cos(angle) * speed, Math.sin(angle) * speed, life, '#ffd700', 3 + Math.random() * 5, BOSS_PALETTE, 0.93, 35);
    }
    return;
  }

  let count = 22;
  let colors = ['#fffbe8', '#ffda73', '#ff8a3d'];
  let gravity = 45;
  let size = 3;

  if (id.includes('burger')) {
    count = 26;
    colors = ['#e8a956', '#48a867', '#ffbe3b', '#6d3e2e', '#f5d696'];
    size = 4;
    gravity = 55;
  } else if (id.includes('soda') || id.includes('shake')) {
    count = 28;
    colors = ['#00e5ff', '#ff3377', '#ffffff', '#8ae8ff'];
    size = 3;
    gravity = 25;
    state.rings?.push({ x: enemy.x, y: enemy.y, radius: 36, life: 0.35, maxLife: 0.35, color: '#00e5ffaa' });
  } else if (id.includes('fries')) {
    count = 24;
    colors = ['#ffe066', '#ffae19', '#ffffff', '#ffd166'];
    size = 4;
    gravity = 50;
  } else if (id.includes('hotdog') || id.includes('sausage')) {
    count = 24;
    colors = ['#c73838', '#ffe853', '#8f2828', '#ffd166'];
    size = 3.5;
    gravity = 48;
  } else if (id.includes('pizza')) {
    count = 24;
    colors = ['#e69a47', '#ffcf40', '#d62828', '#40916c'];
    size = 4;
  } else if (id.includes('chili')) {
    count = 26;
    colors = ['#ff4b2b', '#ffb02e', '#ffe066', '#4f9a3c'];
    size = 4;
    gravity = 30;
  } else if (id.includes('onion')) {
    count = 20;
    colors = ['#ffffff', '#e2e8f0', '#cbd5e1', '#a7f3d0'];
  }

  const palettes = deathPalettes(colors);
  const total = scaledCount(count);
  for (let i = 0; i < total && state.particles.length < particleRoom(); i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 90 + Math.random() * 140;
    const life = 0.45 + Math.random() * 0.4;
    emitParticle(state, enemy.x, enemy.y, Math.cos(angle) * speed, Math.sin(angle) * speed, life, colors[i % colors.length], size + (Math.random() - 0.5) * 2, palettes[i % colors.length], 0.91, gravity);
  }
}

const BOSS_PALETTE = ['#ffffff', '#ffd700', '#ff8800', '#ff0055', '#222222'];
// Paletas de muerte cacheadas por juego de colores (evita crear arreglos por partícula)
const paletteCache = new Map();
function deathPalettes(colors) {
  const key = colors.join();
  let list = paletteCache.get(key);
  if (!list) {
    list = colors.map((color, i) => [color, colors[(i + 1) % colors.length], '#111827']);
    paletteCache.set(key, list);
  }
  return list;
}

function emitParticle(state, x, y, vx, vy, life, color, size, palette, drag, gravity) {
  const p = particlePool.acquire();
  p.x = x; p.y = y; p.vx = vx; p.vy = vy;
  p.life = life; p.maxLife = life;
  p.color = color; p.size = size; p.palette = palette;
  p.drag = drag; p.gravity = gravity;
  state.particles.push(p);
}

// Las cartas de mejora tienen su propia barra de progreso con umbral lineal (no siguen la curva de niveles,
// que crece mucho): así salen a un ritmo parejo, unas cada 20-30 s, toda la partida.
// Los niveles siguen dando +12 HP y +50 puntos, y desbloquean poderes y la evolución del arma.
export const CARD_METER = { start: 140, step: 45 };

export function gainCardProgress(player, amount) {
  player.cardXp = (player.cardXp || 0) + amount;
  player.cardXpToNext ??= CARD_METER.start;
  let cards = 0;
  while (player.cardXp >= player.cardXpToNext) {
    player.cardXp -= player.cardXpToNext;
    player.cardXpToNext += CARD_METER.step;
    cards += 1;
  }
  return cards;
}

export function resolveDeaths(state, onLevelUp) {
  const resolved = new Set();
  const queue = state.enemies.filter(enemy => enemy.hp <= 0);
  for (let index = 0; index < queue.length; index++) {
    const enemy = queue[index];
    // Primera vez que un jefe se queda sin vida: pasa a su segunda fase en vez de morir
    // El Coloso de lava tiene sus propias tres fases: no usa la segunda vida de los jefes comunes
    if (enemy.isBoss && !enemy.enraged && enemy.type?.bossStyle !== 'colossus' && enemy.hp <= 0) { enemy.enrage(state); continue; }
    if (resolved.has(enemy)) continue;
    resolved.add(enemy);
    state.combo = (state.combo || 0) + 1; state.comboTime = 3.5;
    applyComboReward(state);
    const multiplier = Math.min(3, 1 + Math.floor(state.combo / 5) * .25);
    if (state.combo % 5 === 0 && state.floaters) {
      state.floaters.push({
        x: state.player.x,
        y: state.player.y - 45,
        text: `COMBO ${state.combo} / x${multiplier.toFixed(2)}`,
        life: 1.25,
        color: '#93ffe0',
        scale: 1.25,
        kind: 'combo',
        comboVal: state.combo,
      });
    }
    const gained = Math.round(enemy.score * state.difficulty.score * multiplier * scoreMultiplier(state));
    state.score += gained;
    if (state.floaters && state.floaters.length < 90) {
      state.floaters.push({
        x: enemy.x,
        y: enemy.y + 8,
        text: `+${gained}`,
        life: .8,
        color: '#91ffda',
        scale: .9,
        kind: 'gain',
      });
    }
    state.peakCombo = Math.max(state.peakCombo || 0, state.combo);
    state.kills += 1;

    // Seguimiento de misiones temáticas de cartografía en tiempo real
    state.cartographyProgress = state.cartographyProgress || {};
    let gainedMission = null;
    let gainedTarget = 10;
    if (state.mapId === 'diner' && (state.combo || 0) >= 10) {
      state.cartographyProgress.diner = (state.cartographyProgress.diner || 0) + 1;
      gainedMission = 'diner'; gainedTarget = 10;
    }
    if (state.mapId === 'kitchen' && (state.hazards?.some(h => h.isOil) || (state.hazards && state.hazards.length > 0) || (state.oilPuddles && state.oilPuddles.length > 0))) {
      state.cartographyProgress.kitchen = (state.cartographyProgress.kitchen || 0) + 1;
      gainedMission = 'kitchen'; gainedTarget = 10;
    }
    if (state.mapId === 'snow' && (state.wasFreezing || (state.snowFreezeTimer !== undefined && state.snowFreezeTimer <= 0))) {
      state.cartographyProgress.snow = (state.cartographyProgress.snow || 0) + 1;
      gainedMission = 'snow'; gainedTarget = 10;
    }
    if (state.mapId === 'parking' && (enemy.hitByDash || enemy.lastDashSequence)) {
      state.cartographyProgress.parking = (state.cartographyProgress.parking || 0) + 1;
      gainedMission = 'parking'; gainedTarget = 12;
    }

    if (gainedMission && state.floaters) {
      const cur = state.cartographyProgress[gainedMission];
      if (cur <= gainedTarget) {
        state.floaters.push({
          x: enemy.x,
          y: enemy.y - 48,
          text: cur === gainedTarget ? '⭐ ¡MISIÓN DE MAPA COMPLETADA!' : `🎯 MISIÓN: ${cur}/${gainedTarget}`,
          life: 1.2,
          color: cur === gainedTarget ? '#facc15' : '#c084fc',
          scale: cur === gainedTarget ? 1.3 : 1.0,
          kind: 'combo'
        });
      }
    }
    if (enemy.isBoss) {
      if (state.mapId === 'lava' || enemy.type?.id === 'lava_boss') {
        // El Coloso Final: la victoria se cuenta al terminar su animación de muerte (game.js)
        state.bossDying = {
          x: enemy.x,
          y: enemy.y,
          radius: enemy.radius,
          type: enemy.type,
          timer: 3.0,
          duration: 3.0,
          explosionTimer: 0
        };
        state.shake = 0.85;
      } else {
        state.bossesKilled = (state.bossesKilled || 0) + 1;
        state.bossDefeated = true;
        const finalRushBoss = state.modeId === 'rush' && state.bossesKilled >= RUSH_BOSS_GOAL;
        if (!finalRushBoss) spawnBossMinions(state, enemy);
        // Respiro antes de la próxima tanda de jefes (solo cuando todos los jefes activos caen)
        const remainingBosses = state.enemies.filter(e => e.isBoss && e.hp > 0 && e !== enemy).length;
        if (remainingBosses === 0 && state.modeId !== 'waves') state.nextBossAt = state.time + BOSS_GAP;
      }
      state.shake = Math.max(state.shake || 0, 0.55);
      state.hitFreeze = 0.22; // Micro cámara lenta / freeze al derrotar un Gran Jefe
      // Onda dorada purificadora que desintegra proyectiles enemigos cercanos
      state.rings?.push({ x: enemy.x, y: enemy.y, radius: 240, life: 0.9, maxLife: 0.9, color: '#ffd700' });
      state.rings?.push({ x: enemy.x, y: enemy.y, radius: 140, life: 0.6, maxLife: 0.6, color: '#ffffff' });
      if (state.enemyProjectiles) {
        state.enemyProjectiles = state.enemyProjectiles.filter(p => Math.hypot(p.x - enemy.x, p.y - enemy.y) > 260);
      }
      if (state.modeId === 'rush') {
        if (state.bossesKilled < RUSH_BOSS_GOAL) {
          state.directorNotice = `¡JEFE ${state.bossesKilled} / ${RUSH_BOSS_GOAL} ABATIDO!`;
        }
      }
    }
    state.audio?.play(enemy.isBoss ? 'boss' : 'kill');

    // EventBus hook: onEnemyKilled for mods and achievements
    gameEvents.emit('onEnemyKilled', { enemy, state, scoreGained: gained });

    // Patrulla de Bromatología: derrotar inspectores otorga propinas gigantescas
    if (enemy.type?.role === 'inspector' || enemy.type?.id === 'inspector') {
      const tipBonus = Math.round(180 * (state.difficulty?.score || 1) * multiplier * scoreMultiplier(state));
      state.score += tipBonus;
      state.shake = Math.max(state.shake || 0, 0.3);
      state.audio?.play('synergy');
      state.rings?.push({ x: enemy.x, y: enemy.y, radius: 90, life: 0.55, maxLife: 0.55, color: '#38bdf8' });
      burst(state, enemy.x, enemy.y, '#38bdf8', 22, 160);
      burst(state, enemy.x, enemy.y, '#ffd700', 18, 140);
      if (state.floaters) {
        state.floaters.push({
          x: enemy.x,
          y: enemy.y - 36,
          text: `📋 ¡PROPINAS GIGANTES! +${tipBonus} PTS`,
          life: 1.5,
          color: '#38bdf8',
          scale: 1.35,
          kind: 'combo'
        });
      }
      if (state.items) {
        state.items.push(new Item({ type: items.burger || items.barbecue || items.ketchup, rarity: rarities[2] || rarities[1], x: enemy.x - 16, y: enemy.y }));
        state.items.push(new Item({ type: items.mayo, rarity: rarities[3] || rarities[2], x: enemy.x + 16, y: enemy.y }));
      }
    }

    if (state.player.explosionDamage > 0) {
      state.rings?.push({ x: enemy.x, y: enemy.y, radius: 72, life: .5, color: '#ff9965' });
      const nearbyEnemies = (state.spatialGrid && state.spatialGrid.totalEntities > 0)
        ? state.spatialGrid.queryRadius(enemy.x, enemy.y, 72, explosionCandidates)
        : state.enemies;
      const nearLen = nearbyEnemies.length;
      for (let n = 0; n < nearLen; n++) {
        const other = nearbyEnemies[n];
        if (other !== enemy && other.hp > 0 && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 72) {
          damageEnemy(state, other, state.player.explosionDamage);
          if (other.hp <= 0) queue.push(other);
        }
      }
    }
    // Ají kamikaze derribado a tiempo: revienta sin lastimar al jugador pero sí a los enemigos de al lado
    if (enemy.type?.kamikaze && !enemy.exploded) {
      enemy.exploded = true;
      state.rings?.push({ x: enemy.x, y: enemy.y, radius: 64, life: .5, maxLife: .5, color: '#ffb02e' });
      const near = (state.spatialGrid && state.spatialGrid.totalEntities > 0)
        ? state.spatialGrid.queryRadius(enemy.x, enemy.y, 64, explosionCandidates)
        : state.enemies;
      for (let n = 0; n < near.length; n++) {
        const other = near[n];
        if (other !== enemy && other.hp > 0 && !other.isBoss && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 64) {
          damageEnemy(state, other, 22, 'fire');
          if (other.hp <= 0) queue.push(other);
        }
      }
    }
    if (enemy.isBoss && state.player.hp > 0) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 25);
    }

    // Efecto de muerte temático según tipo de enemigo
    spawnThematicEnemyDeath(state, enemy);

    const prevLevel = state.player.level;
    const levels = state.player.gainXp(enemy.xp);
    // Mejoras cada 2 niveles: NV 2, 4, 6, 8, 10...
    for (let level = 0; level < levels; level += 1) {
      const reachedLevel = prevLevel + level + 1;
      onLevelUp(reachedLevel % 2 === 0);
    }
  }

  // In-place enemy array compaction (zero GC)
  let aliveEnemies = 0;
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (!resolved.has(e) && e.hp > 0) {
      state.enemies[aliveEnemies++] = e;
    }
  }
  state.enemies.length = aliveEnemies;
}

export function applyComboReward(state) {
  const combo = state.combo || 0, p = state.player;
  let label = '', color = '#91ffda';
  if (combo === 10) { p.buffs.speedMultiplier = Math.max(p.buffs.speedMultiplier, 1.35); p.buffs.speedTime = Math.max(p.buffs.speedTime, 6); label = '¡COMBO 10! / ¡ACELERÓN PICANTE!'; }
  if (combo === 20) { p.buffs.fireRateMultiplier = Math.min(p.buffs.fireRateMultiplier, .55); p.buffs.fireTime = Math.max(p.buffs.fireTime, 6); label = '¡COMBO 20! / ¡EN LLAMAS!'; color = '#ffd75f'; }
  if (combo === 30) { p.buffs.damageMultiplier = Math.max(p.buffs.damageMultiplier, 1.65); p.buffs.damageTime = Math.max(p.buffs.damageTime, 8); p.comboFeverTime = Math.max(p.comboFeverTime, 8); label = '¡COMBO 30! / ¡FIESTA EN LA COCINA!'; color = '#ff5d9e'; }
  if (combo === 50) { p.buffs.damageMultiplier = Math.max(p.buffs.damageMultiplier, 2.0); p.buffs.damageTime = Math.max(p.buffs.damageTime, 10); label = '¡COMBO 50! / ¡MASTER CHEF LEGENDARIO!'; color = '#ffbe3b'; }
  if (!label) return false;
  state.directorNotice = label; state.shake = Math.max(state.shake, .25); state.audio?.play('synergy');
  impactRing(state, p.x, p.y, color); burst(state, p.x, p.y, color, 30, 200);
  state.floaters?.push({
    x: p.x,
    y: p.y - 48,
    text: label,
    life: 1.4,
    color,
    scale: 1.35,
    kind: 'combo',
    comboVal: combo,
  });
  return true;
}

export function addSurvivalScore(state, delta) {
  state.score += delta * 1.5 * state.difficulty.score * scoreMultiplier(state);
}
