import { drawFood } from '../core/art.js';
import { Projectile } from './Projectile.js';
import { damageEnemy, burst, impactRing } from '../systems/effectSystem.js';

const companionBuffer = [];

export const companions = {
  none: { name: 'Sin companero', detail: 'Solo contra el menu.' },
  ketchup: { name: 'Mini ketchup', detail: 'Dispara salsa y deja charcos pegajosos que frenan enemigos.' },
  drone: { name: 'Dron delivery', detail: 'Atrae aderezos y electrocuta enemigos cercanos con rayos arc.' },
  taco: { name: 'Taco Guardián', detail: 'Otorga un escudo protector periódico y arremete contra enemigos.' },
  soda: { name: 'Botellita Soda', detail: 'Lanza burbujas curativas periódicas y ráfagas de gas refrescante.' },
  parrilla: { name: 'Mini Parrilla', detail: 'Mascota exclusiva de Don Domi. Lanza chispas candentes y calcina enemigos.' },
};

export class Companion {
  constructor(id, player) {
    this.id = companions[id] ? id : 'none';
    this.x = player.x - 40; this.y = player.y + 30;
    this.cooldown = 0;
    this.puddleTimer = 1.5;
    this.zapCooldown = 0.8;
    this.shieldTimer = 3.0;
    this.tacoDashTimer = 1.8;
    this.healTimer = 4.5;
  }

  update(state, delta) {
    if (this.id === 'none') return;
    const p = state.player, blend = 1 - Math.exp(-delta * 6);
    this.x += (p.x - p.facing.x * 45 + Math.sin(state.time * 2) * 14 - this.x) * blend;
    this.y += (p.y - p.facing.y * 45 + 24 - this.y) * blend;

    if (this.id === 'drone') {
      // 1. Magnet: atrae aderezos/items
      for (const item of state.items) {
        const dx = p.x - item.x, dy = p.y - item.y, distance = Math.hypot(dx,dy);
        if (distance > 1 && distance < 190) {
          const step = Math.min(distance, delta * 180);
          item.x += dx / distance * step; item.y += dy / distance * step;
        }
      }

      // 2. Ataque activo: Rayo eléctrico de choque
      this.zapCooldown -= delta;
      if (this.zapCooldown <= 0) {
        let nearest = null, minDist = 220;
        const candidates = (state.spatialGrid && state.spatialGrid.totalEntities > 0)
          ? state.spatialGrid.queryRadius(this.x, this.y, 220, companionBuffer)
          : state.enemies;
        const cLen = candidates.length;
        for (let i = 0; i < cLen; i++) {
          const enemy = candidates[i];
          if (enemy.hp > 0 && enemy.spawnTime <= 0) {
            const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (d < minDist) { minDist = d; nearest = enemy; }
          }
        }
        if (nearest) {
          this.zapCooldown = 2.2;
          damageEnemy(state, nearest, 25 + p.level * 2.5, 'dash');
          burst(state, nearest.x, nearest.y, '#00ffff', 12, 130);
          impactRing(state, nearest.x, nearest.y, '#00ffffaa');
          state.rings.push({ x: this.x, y: this.y, radius: 24, life: 0.25, maxLife: 0.25, color: '#00ffff' });
          // Rayo visual
          state.particles.push({
            x: nearest.x, y: nearest.y, vx: 0, vy: -10, life: 0.2, maxLife: 0.2,
            size: 6, color: '#ffffff', palette: ['#ffffff', '#00ffff', '#0088ff']
          });
          state.audio?.play('hit');
        }
      }
      return;
    }

    if (this.id === 'ketchup') {
      // 1. Disparo de salsa picante
      this.cooldown -= delta;
      if (this.cooldown <= 0) {
        let target = null, nearest = 380;
        const candidates = (state.spatialGrid && state.spatialGrid.totalEntities > 0)
          ? state.spatialGrid.queryRadius(this.x, this.y, 380, companionBuffer)
          : state.enemies;
        const cLen = candidates.length;
        for (let i = 0; i < cLen; i++) {
          const enemy = candidates[i];
          const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (enemy.hp > 0 && enemy.spawnTime <= 0 && distance < nearest) { target = enemy; nearest = distance; }
        }
        if (target) {
          const angle = Math.atan2(target.y - this.y, target.x - this.x);
          state.projectiles.push(new Projectile({
            x: this.x, y: this.y,
            vx: Math.cos(angle) * 440, vy: Math.sin(angle) * 440,
            damage: 14 + p.level * 2, size: 5, color: '#ff4d4d', kind: 'sauce'
          }));
          this.cooldown = 1.6;
        }
      }

      // 2. Charco pegajoso de Ketchup (frena enemigos en 50%)
      this.puddleTimer -= delta;
      if (this.puddleTimer <= 0) {
        this.puddleTimer = 3.6;
        state.hazards.push({
          x: this.x, y: this.y, radius: 34, life: 4.8, isKetchupPuddle: true,
          damageTimer: 0
        });
        burst(state, this.x, this.y, '#d91438', 8, 40);
      }
      return;
    }

    if (this.id === 'taco') {
      // 1. Escudo protector al jugador cada 7 segundos (bloquea 1 golpe o absorbe daño)
      this.shieldTimer -= delta;
      if (this.shieldTimer <= 0) {
        this.shieldTimer = 7.5;
        p.invulnerable = Math.max(p.invulnerable, 1.4);
        impactRing(state, p.x, p.y, '#f59e0b');
        burst(state, p.x, p.y, '#fbbf24', 16, 120);
        state.floaters?.push({ x: p.x, y: p.y - 32, text: '¡ESCUDO TACO!', life: 0.9, color: '#f59e0b', scale: 1.1 });
      }

      // 2. Embestida giratoria a enemigos cercanos
      this.tacoDashTimer -= delta;
      if (this.tacoDashTimer <= 0) {
        let target = null, minDist = 210;
        const candidates = (state.spatialGrid && state.spatialGrid.totalEntities > 0)
          ? state.spatialGrid.queryRadius(this.x, this.y, 210, companionBuffer)
          : state.enemies;
        const cLen = candidates.length;
        for (let i = 0; i < cLen; i++) {
          const enemy = candidates[i];
          if (enemy.hp > 0 && enemy.spawnTime <= 0) {
            const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (d < minDist) { minDist = d; target = enemy; }
          }
        }
        if (target) {
          this.tacoDashTimer = 2.4;
          damageEnemy(state, target, 38 + p.level * 3, 'dash');
          burst(state, target.x, target.y, '#f59e0b', 14, 150);
          impactRing(state, target.x, target.y, '#f59e0b');
          state.rings.push({ x: this.x, y: this.y, radius: 28, life: 0.3, maxLife: 0.3, color: '#fbbf24' });
        }
      }
      return;
    }

    if (this.id === 'soda') {
      // 1. Burbujas curativas periódicas
      this.healTimer -= delta;
      if (this.healTimer <= 0) {
        this.healTimer = 5.2;
        const healAmt = 15 + Math.round(p.level * 1.5);
        const hpBefore = p.hp;
        p.hp = Math.min(p.maxHp, p.hp + healAmt);
        if (p.hp > hpBefore) {
          state.floaters?.push({ x: p.x, y: p.y - 28, text: `+${Math.round(p.hp - hpBefore)} HP`, kind: 'heal', life: 0.9, color: '#00e5ff' });
          impactRing(state, p.x, p.y, '#00e5ff');
          burst(state, p.x, p.y, '#38bdf8', 12, 90);
        }
      }

      // 2. Disparo de chorro efervescente que perfora
      this.cooldown -= delta;
      if (this.cooldown <= 0) {
        let target = null, nearest = 340;
        const candidates = (state.spatialGrid && state.spatialGrid.totalEntities > 0)
          ? state.spatialGrid.queryRadius(this.x, this.y, 340, companionBuffer)
          : state.enemies;
        const cLen = candidates.length;
        for (let i = 0; i < cLen; i++) {
          const enemy = candidates[i];
          const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (enemy.hp > 0 && enemy.spawnTime <= 0 && d < nearest) { target = enemy; nearest = d; }
        }
        if (target) {
          this.cooldown = 1.9;
          const angle = Math.atan2(target.y - this.y, target.x - this.x);
          state.projectiles.push(new Projectile({
            x: this.x, y: this.y,
            vx: Math.cos(angle) * 520, vy: Math.sin(angle) * 520,
            damage: 22 + p.level * 2, size: 7, color: '#00e5ff', kind: 'bubble', pierce: 2
          }));
          burst(state, this.x, this.y, '#00e5ff', 6, 60);
        }
      }
      return;
    }

    if (this.id === 'parrilla') {
      // 1. Chispas de brasa caliente: ataca enemigos cercanos prendiéndolos fuego
      this.cooldown -= delta;
      if (this.cooldown <= 0) {
        let target = null, nearest = 340;
        const candidates = (state.spatialGrid && state.spatialGrid.totalEntities > 0)
          ? state.spatialGrid.queryRadius(this.x, this.y, 340, companionBuffer)
          : state.enemies;
        const cLen = candidates.length;
        for (let i = 0; i < cLen; i++) {
          const enemy = candidates[i];
          const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (enemy.hp > 0 && enemy.spawnTime <= 0 && d < nearest) { target = enemy; nearest = d; }
        }
        if (target) {
          this.cooldown = 1.4;
          const angle = Math.atan2(target.y - this.y, target.x - this.x);
          state.projectiles.push(new Projectile({
            x: this.x, y: this.y,
            vx: Math.cos(angle) * 480, vy: Math.sin(angle) * 480,
            damage: 28 + p.level * 2.8, size: 6, color: '#ff6600', kind: 'ember', pierce: 1
          }));
          burst(state, this.x, this.y, '#ff4400', 8, 80);
          state.audio?.play('hit');
        }
      }

      // 2. Oleada de brasas / humo aromático asador cada 4.5 segundos
      this.puddleTimer -= delta;
      if (this.puddleTimer <= 0) {
        this.puddleTimer = 4.5;
        impactRing(state, this.x, this.y, '#ff4500');
        burst(state, this.x, this.y, '#ffaa00', 16, 120);
        const nearTargets = (state.spatialGrid && state.spatialGrid.totalEntities > 0)
          ? state.spatialGrid.queryRadius(this.x, this.y, 140, companionBuffer)
          : state.enemies;
        const nLen = nearTargets.length;
        for (let i = 0; i < nLen; i++) {
          const enemy = nearTargets[i];
          if (enemy.hp > 0 && enemy.spawnTime <= 0 && Math.hypot(enemy.x - this.x, enemy.y - this.y) < 140) {
            damageEnemy(state, enemy, 35 + p.level * 3, 'dash');
          }
        }
      }
      return;
    }
  }

  draw(ctx, time) {
    if (this.id === 'none') return;
    if (this.id === 'parrilla') {
      const bob = Math.sin(time * 8) * 2;
      ctx.save(); ctx.translate(Math.round(this.x), Math.round(this.y + bob));
      // Sombra
      ctx.fillStyle = '#111c2266'; ctx.fillRect(-12, 14, 24, 4);
      // Patas de metal
      ctx.fillStyle = '#334155'; ctx.fillRect(-10, 8, 3, 7); ctx.fillRect(7, 8, 3, 7);
      // Tambor / cuerpo de parrilla
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-14, -4, 28, 14);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-12, 4, 24, 5);
      // Rejilla y brasas al rojo vivo
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-12, -6, 24, 4);
      ctx.fillStyle = '#ffaa00'; ctx.fillRect(-9, -5, 5, 2); ctx.fillRect(2, -5, 6, 2);
      // Rejilla de hierro
      ctx.fillStyle = '#64748b'; ctx.fillRect(-13, -7, 26, 2);
      for (let gx = -11; gx <= 11; gx += 4) { ctx.fillRect(gx, -7, 2, 4); }
      // Ojitos pixel
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, 0, 3, 3); ctx.fillRect(3, 0, 3, 3);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-5, 1, 2, 2); ctx.fillRect(4, 1, 2, 2);
      // Humito / brasa animada subiendo
      const emberY = -10 - (Math.round(time * 30) % 12);
      ctx.fillStyle = '#ff8800'; ctx.fillRect(-4 + Math.sin(time * 10) * 3, emberY, 2, 2);
      ctx.fillStyle = '#ffcc00'; ctx.fillRect(3 - Math.sin(time * 8) * 3, emberY - 4, 2, 2);
      ctx.restore();
      return;
    }
    if (this.id === 'ketchup') {
      drawFood(ctx, 'ketchup', this.x, this.y, 0.45, time);
      return;
    }
    if (this.id === 'soda') {
      drawFood(ctx, 'soda', this.x, this.y, 0.48, time);
      return;
    }
    if (this.id === 'taco') {
      const bob = Math.sin(time * 7) * 2;
      ctx.save(); ctx.translate(Math.round(this.x), Math.round(this.y + bob));
      // Sombra pixel
      ctx.fillStyle = '#111c2266'; ctx.fillRect(-12, 12, 24, 4);
      // Tortilla doblada
      ctx.fillStyle = '#d97706'; ctx.fillRect(-14, -6, 28, 16);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(-12, -8, 24, 16);
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(-10, -10, 20, 14);
      // Relleno: carne, lechuga, tomate, queso
      ctx.fillStyle = '#78350f'; ctx.fillRect(-8, -12, 16, 5); // carne picada
      ctx.fillStyle = '#22c55e'; ctx.fillRect(-6, -14, 6, 4);  // lechuga
      ctx.fillStyle = '#ef4444'; ctx.fillRect(1, -14, 5, 4);   // tomate
      ctx.fillStyle = '#facc15'; ctx.fillRect(-2, -11, 4, 3);  // queso
      // Ojitos tiernos pixel
      ctx.fillStyle = '#111827'; ctx.fillRect(-5, -3, 3, 3); ctx.fillRect(2, -3, 3, 3);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-4, -3, 1, 1); ctx.fillRect(3, -3, 1, 1);
      // Cachetitos sonrojados
      ctx.fillStyle = '#f87171'; ctx.fillRect(-8, 0, 2, 2); ctx.fillRect(6, 0, 2, 2);
      ctx.restore();
      return;
    }
    const bob = Math.sin(time * 8) * 2;
    ctx.save(); ctx.translate(Math.round(this.x), Math.round(this.y + bob));
    ctx.fillStyle = '#111c2266'; ctx.fillRect(-13, 16, 26, 4);
    ctx.fillStyle = '#182528'; ctx.fillRect(-14, -8, 28, 20);
    ctx.fillStyle = '#f5ca62'; ctx.fillRect(-10, -5, 20, 14); ctx.fillStyle = '#f2f1d2'; ctx.fillRect(-3, -4, 6, 12);
    // Antenas y hélices
    ctx.fillStyle = '#93b4a8'; ctx.fillRect(-23, -12, 18, 3); ctx.fillRect(5, -12, 18, 3);
    ctx.fillStyle = '#00ffff'; ctx.fillRect(-2, -10, 4, 3); // Lente neon
    ctx.fillStyle = '#dce2c9'; ctx.fillRect(-23 + Math.round(Math.sin(time * 50) * 4), -15, 18, 2);
    ctx.fillRect(5 + Math.round(Math.cos(time * 50) * 4), -15, 18, 2);
    ctx.restore();
  }
}