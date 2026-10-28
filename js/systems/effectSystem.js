import { ObjectPool } from '../core/ObjectPool.js';
import { gameEvents } from '../core/EventBus.js';
import { quality } from '../core/quality.js';

// Tope duro de partículas vivas: deja pasar ráfagas nuevas un poco por encima del límite de calidad,
// y updateEffects recorta las más viejas para que siempre se vean los impactos recientes
export const particleRoom = () => Math.round(quality.maxParticles * 1.25);
export const scaledCount = count => Math.max(1, Math.round(count * quality.particleFactor));

// Pre-allocated object pools for high-frequency effects
export const particlePool = new ObjectPool(
  () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 3, color: '#fff', palette: null, drag: 0.92, gravity: 45 }),
  (p) => { p.life = 0; p.palette = null; },
  512,
  2048
);

export const floaterPool = new ObjectPool(
  () => ({ x: 0, y: 0, text: '', life: 0, maxLife: 0, color: '#fff', scale: 1, kind: 'normal' }),
  (f) => { f.life = 0; f.maxLife = undefined; f.tilt = undefined; f.originY = undefined; f.comboVal = undefined; f.enemyRef = null; f.value = 0; },
  128,
  512
);

export const ringPool = new ObjectPool(
  () => ({ x: 0, y: 0, radius: 20, life: 0.5, maxLife: 0.5, color: '#fff' }),
  (r) => { r.life = 0; },
  64,
  256
);

// Spawn partículas con velocidad y tamaño variables utilizando el ObjectPool
export function burst(state, x, y, color, count = 8, power = 100) {
  if (!state.particles) return;
  const currentCount = state.particles.length;
  const toSpawn = Math.min(scaledCount(count), particleRoom() - currentCount);
  if (toSpawn <= 0) return;

  const defaultPalette = ['#fffbe8', color, '#ff8a3d', '#ff3535'];
  for (let i = 0; i < toSpawn; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = power * (0.3 + Math.random() * 0.7);
    const life = 0.25 + Math.random() * 0.4;
    const p = particlePool.acquire();
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.life = life;
    p.maxLife = life;
    p.size = 2 + Math.random() * 4;
    p.color = color;
    p.palette = defaultPalette;
    p.drag = 0.92;
    p.gravity = 45;
    state.particles.push(p);
  }
}

export function explosionBurst(state, x, y, color = '#ff7048', count = 26, power = 180) {
  burst(state, x, y, color, count, power);
  const smokePalette = ['#ffd487', '#8b6d63', '#596169', '#29333c'];
  const smoke = scaledCount(9);
  for (let i = 0; i < smoke && state.particles.length < particleRoom(); i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 45;
    const life = 0.65 + Math.random() * 0.55;
    const p = particlePool.acquire();
    p.x = x + (Math.random() - 0.5) * 18;
    p.y = y + (Math.random() - 0.5) * 12;
    p.vx = Math.cos(angle) * speed;
    p.vy = -25 + Math.sin(angle) * speed * 0.35;
    p.life = life;
    p.maxLife = life;
    p.color = '#697078';
    p.size = 5 + Math.random() * 7;
    p.palette = smokePalette;
    p.drag = 0.965;
    p.gravity = -10;
    state.particles.push(p);
  }
}

// Partículas en forma de estrella para críticos
export function critBurst(state, x, y) {
  if (!state.particles) return;
  const colors = ['#fff7a0', '#ffe54d', '#ffffff', '#ffd700'];
  const stars = Math.max(8, scaledCount(16));
  for (let i = 0; i < stars && state.particles.length < particleRoom(); i++) {
    const angle = (i / stars) * Math.PI * 2;
    const speed = 90 + Math.random() * 160;
    const life = 0.4 + Math.random() * 0.3;
    const color = colors[i % colors.length];
    const p = particlePool.acquire();
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.life = life;
    p.maxLife = life;
    p.color = color;
    p.size = 3 + Math.random() * 4;
    p.palette = ['#ffffff', color, '#ff9c33', '#4b525b'];
    p.drag = 0.98;
    p.gravity = 38;
    state.particles.push(p);
  }
}

// Onda de impacto visual al golpear
export function impactRing(state, x, y, color = '#ffffff88') {
  if (!state.rings || state.rings.length >= 100) return;
  const r = ringPool.acquire();
  r.x = x;
  r.y = y;
  r.radius = 32;
  r.life = 0.38;
  r.maxLife = 0.38;
  r.color = color;
  state.rings.push(r);
}

// Colores de floaters según tipo de daño
const DAMAGE_COLORS = {
  crit:   '#fff500',
  fire:   '#ff7a1a',
  ice:    '#7fd6ff',
  poison: '#a3ff6f',
  dash:   '#9fffe0',
  heal:   '#7bffb0',
  normal: '#ffe8a1',
};

export function damageEnemy(state, enemy, damage, type = 'normal') {
  if (enemy.hp <= 0 || enemy.spawnTime > 0) return;

  // EventBus hook: beforeEnemyDamage allows mods or skills to modify incoming damage
  const beforeEvent = gameEvents.emit('beforeEnemyDamage', { state, enemy, damage, type });
  if (beforeEvent.cancelled) return;
  damage = beforeEvent.damage;

  damage /= (enemy.armor || 1);
  // Las mayonesas médicas (healers) caen de un solo golpe para que no se acumulen
  if (enemy.role === 'healer' && !enemy.isBoss) damage = Math.max(damage, enemy.hp + 1);
  const critRoll = (state?.player?.critChance > 0) && (Math.random() < state.player.critChance);
  const isCrit = type === 'crit' || damage > 85 || critRoll;
  const finalDamage = isCrit ? damage * 1.35 : damage;
  enemy.hp -= finalDamage;
  enemy.hitFlash = isCrit ? 0.20 : 0.10;
  if (isCrit) state.shake = Math.max(state.shake || 0, 0.08);

  // Filtrado de floaters: mostrar siempre críticos, curaciones y dash; para daño normal sólo 1 de cada 3 para evitar saturar el canvas
  const shouldSpawnFloater = isCrit || type === 'heal' || type === 'dash' || (state.enemies.length < 25) || (Math.random() < 0.35);

  const floaterKind = isCrit ? 'crit' : type;
  // Golpes seguidos al mismo enemigo se suman en un solo número que vuelve a "saltar" (contador arcade)
  const merged = state.floaters?.find(f => f.enemyRef === enemy && f.kind === floaterKind && f.life > f.maxLife * 0.35);
  if (merged) {
    merged.value += finalDamage;
    merged.text = isCrit ? `✦${Math.ceil(merged.value)}` : String(Math.ceil(merged.value));
    merged.life = merged.maxLife;
    merged.x = enemy.x + (Math.random() - 0.5) * 6;
    merged.y = Math.min(merged.y, enemy.y - 20);
  } else if (state.floaters && shouldSpawnFloater) {
    const color = isCrit ? DAMAGE_COLORS.crit : (DAMAGE_COLORS[type] || DAMAGE_COLORS.normal);
    const floater = floaterPool.acquire();
    floater.x = enemy.x + (Math.random() - 0.5) * 14;
    floater.y = enemy.y - 20;
    floater.text = isCrit ? `✦${Math.ceil(finalDamage)}` : String(Math.ceil(finalDamage));
    floater.life = isCrit ? 0.75 : 0.5;
    floater.maxLife = floater.life;
    floater.color = color;
    floater.scale = isCrit ? 1.4 : 0.95;
    floater.kind = floaterKind;
    floater.enemyRef = enemy;
    floater.value = finalDamage;
    state.floaters.push(floater);
  }

  // Partículas de impacto reducidas para mantener 60 FPS estables
  const particleColor = isCrit ? '#fff700' : (DAMAGE_COLORS[type] || '#ffd468');
  burst(state, enemy.x, enemy.y, particleColor, isCrit ? 10 : 4, isCrit ? 130 : 85);
  if (isCrit) {
    critBurst(state, enemy.x, enemy.y);
    impactRing(state, enemy.x, enemy.y, '#ffe500aa');
    state.audio?.play('crit');
  } else if (Math.random() < 0.25) {
    impactRing(state, enemy.x, enemy.y, particleColor + '66');
  }

  // EventBus hook: onEnemyDamage
  gameEvents.emit('onEnemyDamage', { state, enemy, damage: finalDamage, isCrit, type });
}

// Recorta los elementos más viejos (al principio del arreglo) sin crear arreglos nuevos
function trimOldest(list, max, pool) {
  const extra = list.length - max;
  if (extra <= 0) return;
  for (let i = 0; i < extra; i++) pool.release(list[i]);
  list.copyWithin(0, extra);
  list.length = max;
}

// Prioridad al recortar textos: combos y críticos se quedan; los números de daño comunes ceden primero
const FLOATER_PRIORITY = { combo: 3, crit: 2, heal: 2, dash: 1 };
function trimFloaters(list, max) {
  while (list.length > max) {
    let worst = 0, worstScore = Infinity;
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const score = (FLOATER_PRIORITY[f.kind] || 0) * 10 + f.life / (f.maxLife || 1);
      if (score < worstScore) { worstScore = score; worst = i; }
    }
    floaterPool.release(list[worst]);
    list.splice(worst, 1);
  }
}

// Aplica los topes de calidad; se llama también al final del cuadro porque las muertes
// (textos "+puntos", explosiones temáticas) se resuelven después de updateEffects
export function capEffects(state) {
  if (state.particles) trimOldest(state.particles, Math.round(quality.maxParticles * 1.25), particlePool);
  if (state.floaters) trimFloaters(state.floaters, quality.maxFloaters);
  // Balas enemigas: si una salva enorme supera el tope, se van primero las más viejas
  const shots = state.enemyProjectiles;
  if (shots && shots.length > quality.maxEnemyShots) shots.splice(0, shots.length - quality.maxEnemyShots);
}

export function updateEffects(state, delta) {
  const player = state.player;
  state.dashGhosts ||= [];

  // 1. Dash ghosts update with in-place compaction
  let ghostAlive = 0;
  for (let i = 0; i < state.dashGhosts.length; i++) {
    const ghost = state.dashGhosts[i];
    ghost.life -= delta;
    if (ghost.life > 0) {
      state.dashGhosts[ghostAlive++] = ghost;
    }
  }
  state.dashGhosts.length = ghostAlive;
  if (player.dashTime > 0) state.dashGhosts.push({ x: player.x, y: player.y, life: 0.18 });

  state.comboTime = Math.max(0, state.comboTime - delta);
  if (state.comboTime <= 0) state.combo = 0;

  // 2. High-performance Particles Update with ObjectPool and in-place compaction (Zero GC)
  const dragFactor = Math.pow(0.92, delta * 60);
  let pAlive = 0;
  const pLen = state.particles.length;
  for (let i = 0; i < pLen; i++) {
    const p = state.particles[i];
    p.life -= delta;
    if (p.life > 0) {
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      const drag = p.drag ? Math.pow(p.drag, delta * 60) : dragFactor;
      p.vx *= drag;
      p.vy *= drag;
      p.vy += (p.gravity ?? 45) * delta;
      state.particles[pAlive++] = p;
    } else {
      particlePool.release(p);
    }
  }
  state.particles.length = pAlive;
  trimOldest(state.particles, quality.maxParticles, particlePool);

  // 3. Floaters Update with in-place compaction
  let fAlive = 0;
  const fLen = state.floaters.length;
  for (let i = 0; i < fLen; i++) {
    const p = state.floaters[i];
    p.maxLife ??= p.life;
    p.life -= delta;
    if (p.life > 0) {
      p.y -= delta * (p.scale > 1 ? 55 : 38);
      state.floaters[fAlive++] = p;
    } else {
      floaterPool.release(p);
    }
  }
  state.floaters.length = fAlive;
  trimFloaters(state.floaters, quality.maxFloaters);

  // 4. Rings Update with in-place compaction
  let rAlive = 0;
  const rLen = state.rings.length;
  for (let i = 0; i < rLen; i++) {
    const ring = state.rings[i];
    ring.maxLife ??= ring.life;
    ring.life -= delta;
    if (ring.life > 0) {
      state.rings[rAlive++] = ring;
    } else {
      ringPool.release(ring);
    }
  }
  state.rings.length = rAlive;

  if (player.dashTime > 0) burst(state, player.x - player.facing.x * 15, player.y, '#86e3bf', 2, 30);

  // Rising energy pixels around character
  const auraColor = player.comboFeverTime > 0 ? '#ff5d9e' :
                    player.buffs.fireTime > 0 ? '#ffd75f' :
                    player.buffs.speedTime > 0 ? '#72f5e1' :
                    player.buffs.damageTime > 0 ? '#ff936e' : null;
  if (auraColor) {
    state.auraParticleClock = (state.auraParticleClock || 0) - delta;
    if (state.auraParticleClock <= 0) {
      state.auraParticleClock = 0.075;
      for (let i = 0; i < 2; i++) {
        const life = 0.55 + Math.random() * 0.35;
        const p = particlePool.acquire();
        p.x = player.x + (Math.random() - 0.5) * 38;
        p.y = player.y + 22;
        p.vx = (Math.random() - 0.5) * 18;
        p.vy = -45 - Math.random() * 35;
        p.life = life;
        p.maxLife = life;
        p.color = auraColor;
        p.size = 2 + Math.random() * 3;
        p.palette = ['#ffffff', auraColor, auraColor, '#23343b'];
        p.drag = 0.99;
        p.gravity = -8;
        state.particles.push(p);
      }
    }
  }

  // Partículas orbitales de aura
  if (player.auraLevel > 0) {
    const t = (state.time || 0) * 2.5;
    for (let i = 0; i < player.auraLevel; i++) {
      const a = t + (i / player.auraLevel) * Math.PI * 2;
      const p = particlePool.acquire();
      p.x = player.x + Math.cos(a) * 108;
      p.y = player.y + Math.sin(a) * 108;
      p.vx = -Math.sin(a) * 22;
      p.vy = Math.cos(a) * 22;
      p.life = 0.22;
      p.maxLife = 0.22;
      p.color = '#86e3bf';
      p.size = 3;
      p.palette = ['#eafff6', '#86e3bf', '#2b6d61'];
      p.drag = 0.92;
      p.gravity = 0;
      state.particles.push(p);
    }
  }

  if (player.mustardLevel > 0) {
    player.rainTimer -= delta;
    if (player.rainTimer <= 0 && state.enemies.some(e => e.hp > 0 && e.spawnTime <= 0)) {
      player.rainTimer = MUSTARD.interval;
      startMustardRain(state, player);
    }
  }
  updateMustardDrops(state, delta);
}

// ============================================================================
// LLUVIA DE MOSTAZA: gotas que caen del cielo con sombra de aviso, explotan en
// salpicadura (daño en área + frenan) y dejan un charco que quema a los enemigos
// ============================================================================
export const MUSTARD = {
  interval: 8,
  drops: level => 5 + level * 2,          // 7 / 9 / 11 gotas
  damage: level => 35 + level * 25,       // 60 / 85 / 110 por salpicadura
  splashRadius: 62,
  fallTime: 0.55,
  stagger: 0.09,
  slowTime: 2,
  puddleLife: 3,
};

export function startMustardRain(state, player) {
  const level = player.mustardLevel;
  const total = MUSTARD.drops(level);
  const targets = state.enemies
    .filter(e => e.hp > 0 && e.spawnTime <= 0)
    .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))
    .slice(0, total);
  state.mustardDrops ||= [];
  for (let i = 0; i < total; i++) {
    // Las gotas sin objetivo caen alrededor del jugador para que la lluvia siempre se vea completa
    const target = targets[i];
    const angle = Math.random() * Math.PI * 2, distance = 90 + Math.random() * 170;
    state.mustardDrops.push({
      x: target ? target.x : player.x + Math.cos(angle) * distance,
      y: target ? target.y : player.y + Math.sin(angle) * distance,
      target: target || null,
      delay: i * MUSTARD.stagger,
      fall: MUSTARD.fallTime,
      damage: MUSTARD.damage(level),
      wobble: Math.random() * Math.PI * 2,
    });
  }
  state.floaters?.push({ x: player.x, y: player.y - 54, text: '¡LLUVIA DE MOSTAZA!', life: 1.2, kind: 'combo', comboVal: 20 });
  state.audio?.play('pickup');
}

function updateMustardDrops(state, delta) {
  const drops = state.mustardDrops;
  if (!drops?.length) return;
  let alive = 0;
  for (const drop of drops) {
    if (drop.delay > 0) { drop.delay -= delta; drops[alive++] = drop; continue; }
    // La gota sigue a su objetivo mientras cae (así no "falla" contra enemigos rápidos)
    if (drop.target && drop.target.hp > 0) { drop.x += (drop.target.x - drop.x) * Math.min(1, delta * 10); drop.y += (drop.target.y - drop.y) * Math.min(1, delta * 10); }
    drop.fall -= delta;
    if (drop.fall > 0) { drops[alive++] = drop; continue; }
    splashMustard(state, drop);
  }
  drops.length = alive;
}

function splashMustard(state, drop) {
  const r = MUSTARD.splashRadius;
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0 || enemy.spawnTime > 0) continue;
    if (Math.hypot(enemy.x - drop.x, enemy.y - drop.y) < r + enemy.radius) {
      damageEnemy(state, enemy, drop.damage, 'fire');
      enemy.mustardSlowUntil = (state.time || 0) + MUSTARD.slowTime;
    }
  }
  state.hazards?.push({ x: drop.x, y: drop.y, radius: 34, life: MUSTARD.puddleLife, isMustardPuddle: true });
  impactRing(state, drop.x, drop.y, '#ffd34f');
  burst(state, drop.x, drop.y, '#ffd34f', 14, 170);
  burst(state, drop.x, drop.y, '#ff9f1c', 6, 110);
  state.shake = Math.max(state.shake || 0, 0.06);
}
