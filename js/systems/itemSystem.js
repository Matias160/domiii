import { Item } from '../entities/Item.js';
import { items } from '../data/items.js';
import { distance } from '../core/collision.js';
import { damageEnemy, particlePool, burst, impactRing } from './effectSystem.js';

export function updateItems(state, delta, bounds) {
  if (state.player.hp <= 0) return;
  state.itemTimer -= delta;
  if (state.itemTimer <= 0 && state.items.length < 6) {
    state.items.push(spawnItem(bounds));
    state.itemTimer = 9 + Math.random() * 6;
  }

  const magnetRadius = state.player.magnetRadius || 54;
  const remaining = [];

  for (const item of state.items) {
    item.update(delta);
    if (item.life <= 0) continue;

    // Emitir partículas ambientales propias de su rareza mientras está en el suelo
    item.particleTimer = (item.particleTimer || 0) - delta;
    if (item.particleTimer <= 0 && state.particles && state.particles.length < 750) {
      const isHigh = ['Epico', 'Legendario', 'Mitico'].includes(item.rarity.id);
      item.particleTimer = isHigh ? 0.14 : 0.26;
      const p = particlePool.acquire();
      const angle = Math.random() * Math.PI * 2;
      const dist = 4 + Math.random() * 14;
      p.x = item.x + Math.cos(angle) * dist;
      p.y = item.y + 6 + Math.sin(angle) * (dist * 0.5);
      p.vx = (Math.random() - 0.5) * 14;
      p.vy = -24 - Math.random() * 26;
      p.life = 0.45 + Math.random() * 0.35;
      p.maxLife = p.life;
      p.size = isHigh ? 3.2 : 2.4;
      p.color = item.rarity.color;
      p.palette = ['#ffffff', item.rarity.accent || item.rarity.color, item.rarity.color];
      p.drag = 0.96;
      p.gravity = -12;
      state.particles.push(p);
    }

    // Atracción magnética suave al acercarse al ítem
    const dist = distance(item, state.player);
    if (dist < magnetRadius) {
      const pull = (1 - dist / magnetRadius) * 280 * delta;
      const dx = state.player.x - item.x;
      const dy = state.player.y - item.y;
      const len = Math.hypot(dx, dy) || 1;
      item.x += (dx / len) * pull;
      item.y += (dy / len) * pull;
    }

    if (distance(item, state.player) <= item.radius + state.player.radius + 4) {
      applyItem(state, item);
      continue;
    }
    remaining.push(item);
  }
  state.items = remaining;

  // Actualizar animaciones activas de recolección de ítems
  if (state.pickupAnims) {
    let alive = 0;
    for (let i = 0; i < state.pickupAnims.length; i++) {
      const anim = state.pickupAnims[i];
      anim.life -= delta;
      if (anim.life > 0) {
        state.pickupAnims[alive++] = anim;
      }
    }
    state.pickupAnims.length = alive;
  }
}

export function spawnItem(bounds) {
  const pool = Object.values(items);
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  const type = pool.find(item => (roll -= item.weight) <= 0) || pool[0];
  return new Item({ type, x: 70 + Math.random() * (bounds.width - 140), y: 130 + Math.random() * (bounds.height - 180) });
}

function applyItem(state, item) {
  const { player } = state, type = item.type, power = item.rarity.multiplier;
  const duration = type.duration * power * player.itemDuration;
  if (player.skin.itemHealBonus) player.hp = Math.min(player.maxHp, player.hp + 8);
  if (type.kind === 'heal') {
    const bonus = player.skin.itemHealBonus ? 12 : 0;
    const hpBefore = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + Math.round(type.value * power) + bonus);
    if (player.hp > hpBefore) state.floaters?.push({ x: player.x, y: player.y - 28, text: `+${Math.round(player.hp - hpBefore)} HP`, kind: 'heal', life: .95, color: '#00ffcc', scale: 1.2 });
  } else if (type.kind === 'damage') {
    player.buffs.damageMultiplier = Math.max(player.buffs.damageMultiplier, 1 + type.value * power);
    player.buffs.damageTime = Math.max(player.buffs.damageTime, duration);
  } else if (type.kind === 'speed') {
    player.buffs.speedMultiplier = Math.max(player.buffs.speedMultiplier, 1 + type.value * power);
    player.buffs.speedTime = Math.max(player.buffs.speedTime, duration);
  } else if (type.kind === 'fire') {
    player.buffs.fireRateMultiplier = Math.min(player.buffs.fireRateMultiplier, 1 / (1 + type.value * power));
    player.buffs.fireTime = Math.max(player.buffs.fireTime, duration);
  } else if (type.kind === 'blast') {
    const blastRadius = 155 * power;
    const candidates = (state.spatialGrid && state.spatialGrid.totalEntities > 0)
      ? state.spatialGrid.queryRadius(item.x, item.y, blastRadius)
      : state.enemies;
    const cLen = candidates.length;
    for (let i = 0; i < cLen; i++) {
      const enemy = candidates[i];
      if (distance(item, enemy) < blastRadius) damageEnemy(state, enemy, type.value * power);
    }
    state.rings?.push({ x: item.x, y: item.y, radius: blastRadius, life: .6, maxLife: .6, color: '#ff8860' });
  }

  const pts = Math.round(15 * power);
  state.score += pts;
  state.pickups[type.id] = (state.pickups[type.id] || 0) + 1;
  state.itemNotice = `${item.rarity.id.toUpperCase()}: ${type.name.toUpperCase()}`;

  // --- ANIMACIÓN JUGOSA AL RECOGER EL ÍTEM ---
  const rCol = item.rarity.color || '#38ef7d';
  const rAccent = item.rarity.accent || '#ffffff';

  // 1. Ondas de choque concéntricas del color de rareza
  impactRing(state, item.x, item.y, rCol);
  state.rings?.push({ x: item.x, y: item.y, radius: 52, life: 0.48, maxLife: 0.48, color: rCol });
  if (power >= 2) {
    state.rings?.push({ x: item.x, y: item.y, radius: 82, life: 0.65, maxLife: 0.65, color: rAccent });
    state.shake = Math.max(state.shake || 0, 0.14);
  }

  // 2. Explosión de partículas en fuente con la paleta de rareza
  burst(state, item.x, item.y, rCol, Math.round(16 + power * 6), 145);
  for (let i = 0; i < 12 && state.particles.length < 800; i++) {
    const p = particlePool.acquire();
    const a = (i / 12) * Math.PI * 2;
    const spd = 65 + Math.random() * 85;
    p.x = item.x;
    p.y = item.y;
    p.vx = Math.cos(a) * spd;
    p.vy = Math.sin(a) * spd - 45;
    p.life = 0.5 + Math.random() * 0.3;
    p.maxLife = p.life;
    p.size = 3.5;
    p.color = rCol;
    p.palette = ['#ffffff', rAccent, rCol];
    p.drag = 0.92;
    p.gravity = -20;
    state.particles.push(p);
  }

  // 3. Texto flotante destacado con nombre e impacto de rareza
  state.floaters?.push({
    x: item.x,
    y: item.y - 20,
    text: `★ ${type.name.toUpperCase()} (${item.rarity.id.toUpperCase()})`,
    life: 1.15,
    maxLife: 1.15,
    color: rCol,
    scale: power >= 2 ? 1.35 : 1.15,
    kind: 'combo'
  });

  // 4. Animación visual de recolección (ícono que asciende, gira y destella)
  state.pickupAnims ||= [];
  state.pickupAnims.push({
    x: item.x,
    y: item.y,
    type: item.type,
    rarity: item.rarity,
    life: 0.55,
    maxLife: 0.55
  });
}

export function drawPickupAnimations(ctx, state) {
  if (!state.pickupAnims || !state.pickupAnims.length) return;
  for (const anim of state.pickupAnims) {
    const progress = 1 - anim.life / anim.maxLife;
    const alpha = Math.max(0, 1 - Math.pow(progress, 1.6));
    const scale = 1 + Math.sin(progress * Math.PI) * 0.85;
    const yOffset = -progress * 46;
    const rCol = anim.rarity.color || '#38ef7d';

    ctx.save();
    ctx.translate(anim.x, anim.y + yOffset);
    ctx.globalAlpha = alpha;

    // Estrella / destello de captura
    ctx.save();
    ctx.rotate(progress * Math.PI * 1.5);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, 0); ctx.lineTo(14, 0);
    ctx.moveTo(0, -14); ctx.lineTo(0, 14);
    ctx.stroke();

    ctx.fillStyle = rCol;
    ctx.beginPath();
    ctx.arc(0, 0, 9 * (1 - progress * 0.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4 * (1 - progress * 0.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
}
