import { damageEnemy, burst, impactRing } from './effectSystem.js';
import { Projectile } from '../entities/Projectile.js';
import { openDeliveryChest } from './directorSystem.js';

// Sprite sheets generadas a partir de todos los cuadros de animación de los GIFs originales (16 frames)
export const cactusSheet = typeof Image !== 'undefined' ? new Image() : null;
if (cactusSheet) cactusSheet.src = './cactus_sheet.png';

export const pelotaSheet = typeof Image !== 'undefined' ? new Image() : null;
if (pelotaSheet) pelotaSheet.src = './pelota_sheet.png';

export function updateMap(state, dt) {
  const worldW = state.world?.width || 1920;
  const worldH = state.world?.height || 1080;

  // Interacción de embestida (Dash) contra el Cofre Acorazado del Camión de Reparto
  if (state.deliveryChest && !state.deliveryChest.opened && state.player?.dashTime > 0) {
    const chest = state.deliveryChest;
    if (Math.hypot(chest.x - state.player.x, chest.y - state.player.y) < chest.radius + state.player.radius + 15) {
      if (chest.lastDashSeq !== state.player.dashSequence) {
        chest.lastDashSeq = state.player.dashSequence;
        const dashDmg = (32 + state.player.level * 2) * (state.player.damageMultiplier || 1);
        chest.hp -= dashDmg;
        chest.hitFlash = 0.15;
        state.shake = Math.max(state.shake || 0, 0.35);
        state.audio?.play('hit');
        burst(state, chest.x, chest.y, '#f59e0b', 16, 140);
        if (state.floaters) {
          state.floaters.push({
            x: chest.x,
            y: chest.y - 20,
            text: `¡EMBESTIDA! -${Math.round(dashDmg)}`,
            life: 0.8,
            color: '#f59e0b',
            scale: 1.1,
            kind: 'gain'
          });
        }
        if (chest.hp <= 0) {
          openDeliveryChest(state);
        }
      }
    }
  }

  if (state.mapId === 'snow') {
    state.mapClock += dt;
    const active = state.mapClock % 34 > 28;
    state.mapWarning = state.mapClock % 34 > 25 && !active;
    if (active && !state.wasFreezing) state.directorNotice = 'VENTISCA / El suelo se congela';
    state.wasFreezing = active;
    if (active) state.player.buffs.slowTime = Math.max(state.player.buffs.slowTime, .18);
    return;
  }
  if (state.mapId === 'kitchen') {
    state.mapClock += dt;
    // Salpicadura de aceite caliente periódica
    if (state.mapClock > 3.8 + Math.random() * 1.5) {
      state.mapClock = 0;
      const x = 140 + Math.random() * (worldW - 280);
      const y = 160 + Math.random() * (worldH - 240);
      state.hazards.push({ x, y, radius: 32, life: 4.8, isOil: true });
      state.directorNotice = '¡ACEITE CALIENTE!';
    }
    return;
  }

  if (state.mapId === 'beach') {
    // 1. Cangrejos chiquitos que caminan de costado y se asustan
    if (!state.beachCrabs) {
      state.beachCrabs = [
        { x: 380, y: 520, vx: 24, timer: 3, facing: 1, anim: 0, buried: 0 },
        { x: 820, y: 640, vx: -22, timer: 2, facing: -1, anim: 0, buried: 0 },
        { x: 1240, y: 540, vx: 26, timer: 4, facing: 1, anim: 0, buried: 0 },
        { x: 1580, y: 680, vx: -20, timer: 2.5, facing: -1, anim: 0, buried: 0 },
        { x: 540, y: 820, vx: 22, timer: 3.5, facing: 1, anim: 0, buried: 0 },
        { x: 1100, y: 880, vx: -25, timer: 1.8, facing: -1, anim: 0, buried: 0 },
        { x: 1400, y: 940, vx: 20, timer: 3.2, facing: 1, anim: 0, buried: 0 }
      ];
    }
    for (const crab of state.beachCrabs) {
      if (crab.buried > 0) {
        crab.buried -= dt;
        continue;
      }
      const dist = Math.hypot(crab.x - state.player.x, crab.y - state.player.y);
      if (dist < 42 && state.player.dashTime > 0) {
        crab.buried = 3;
        state.floaters?.push({ x: crab.x, y: crab.y - 18, text: '🦀💨', life: 0.7, scale: 1.1 });
        burst(state, crab.x, crab.y, '#ebd08f', 8, 80);
        continue;
      }
      if (dist < 85) {
        crab.vx = (crab.x > state.player.x ? 1 : -1) * 95;
        crab.facing = Math.sign(crab.vx);
        crab.anim += dt * 14;
      } else {
        crab.anim += dt * 6;
        crab.timer -= dt;
        if (crab.timer <= 0) {
          crab.timer = 2 + Math.random() * 3;
          crab.facing = Math.random() < 0.5 ? -1 : 1;
          crab.vx = crab.facing * (18 + Math.random() * 14);
        }
      }
      crab.x += crab.vx * dt;
      if (crab.x < 120) { crab.x = 120; crab.facing = 1; crab.vx = Math.abs(crab.vx); }
      if (crab.x > worldW - 120) { crab.x = worldW - 120; crab.facing = -1; crab.vx = -Math.abs(crab.vx); }
    }

    // Salpicadura al caminar por la orilla del mar
    if (state.player.y < 390 && Math.hypot(state.player.facing?.x || 0, state.player.facing?.y || 0) > 0) {
      state.waterSplashTimer = (state.waterSplashTimer || 0) + dt;
      if (state.waterSplashTimer > 0.22) {
        state.waterSplashTimer = 0;
        burst(state, state.player.x, state.player.y + 12, '#67e8f9', 5, 70);
        impactRing(state, state.player.x, state.player.y + 12, '#ffffff');
      }
    }

    // 2. Cocos que caen periódicamente de las palmeras
    state.mapClock += dt;
    if (state.mapClock > 5.5) {
      state.mapClock = 0;
      const cx = 200 + Math.random() * (worldW - 400);
      const cy = 480 + Math.random() * (worldH - 600);
      state.mapObstacles.push({
        type: 'coconut',
        x: cx, y: cy,
        vx: 0, vy: 0,
        radius: 20,
        warning: 0.8,
        kicked: false,
        exploded: false,
        isCoconut: true,
        animTime: 0
      });
    }
  } else if (!['desert', 'football'].includes(state.mapId)) {
    return;
  }

  if (['desert', 'football'].includes(state.mapId)) {
    state.mapClock += dt;
    if (state.mapClock > 4.2) {
      state.mapClock = 0;
      const y = 160 + Math.random() * (worldH - 280), side = Math.random() < .5 ? -1 : 1;
      const startX = side < 0 ? -35 : worldW + 35;
      state.mapObstacles.push({
        x: startX, y,
        vx: -side * (state.mapId === 'football' ? 220 : 160),
        vy: 0,
        radius: state.mapId === 'football' ? 36 : 42, // Hitbox acorde al nuevo gran tamaño
        animTime: 0,
        warning: .8, kicked: false
      });
      if (state.mapId === 'football') {
        state.mapObstacles.push({
          x: side < 0 ? worldW + 35 : -35,
          y: 180 + Math.random() * (worldH - 300),
          vx: side * 190,
          vy: 0,
          radius: 36,
          animTime: 0.15,
          warning: .8, kicked: false
        });
      }
    }
  }
  for (const o of state.mapObstacles) {
    if (o.warning > 0) { o.warning = Math.max(0, o.warning - dt); continue; }
    o.x += o.vx * dt; o.y += o.vy * dt;
    o.animTime = (o.animTime || 0) + dt;

    // Cancha: patear la pelota con el acelerón
    if (state.mapId === 'football' && state.player.dashTime > 0 && Math.hypot(o.x - state.player.x, o.y - state.player.y) < o.radius + state.player.radius + 18) {
      const fx = state.player.facing.x || 1, fy = state.player.facing.y || 0;
      o.vx = fx * 680;
      o.vy = fy * 680;
      o.kicked = true;
      o.hitEnemies = new Set();
      state.shake = 0.24;
      state.audio?.play('hit');
      state.floaters?.push({ x: o.x, y: o.y - 30, text: '¡BOMBAZO! ⚽', life: 1.1, color: '#00ffcc', scale: 1.35 });
    }

    // Playa: hacer Dash contra un coco lo patea a toda velocidad hacia los enemigos ("¡COCOTAZO!")
    if (state.mapId === 'beach' && o.isCoconut && state.player.dashTime > 0 && Math.hypot(o.x - state.player.x, o.y - state.player.y) < o.radius + state.player.radius + 18) {
      const fx = state.player.facing.x || 1, fy = state.player.facing.y || 0;
      o.vx = fx * 680;
      o.vy = fy * 680;
      o.kicked = true;
      o.hitEnemies = new Set();
      state.shake = 0.22;
      state.audio?.play('hit');
      state.floaters?.push({ x: o.x, y: o.y - 28, text: '¡COCOTAZO! 🥥', life: 1.1, color: '#facc15', scale: 1.35 });
    }

    // Desierto: hacer Dash contra un cactus lo hace explotar en pinchos que dañan a los enemigos (al jugador no)
    if (state.mapId === 'desert' && state.player.dashTime > 0 && !o.exploded && Math.hypot(o.x - state.player.x, o.y - state.player.y) < o.radius + state.player.radius + 20) {
      o.exploded = true;
      state.shake = Math.max(state.shake || 0, 0.38);
      state.audio?.play('hit');
      burst(state, o.x, o.y, '#84cc16', 32, 280);
      burst(state, o.x, o.y, '#facc15', 24, 240);
      impactRing(state, o.x, o.y, '#84cc16');
      state.floaters?.push({ x: o.x, y: o.y - 30, text: '¡EXPLOSIÓN DE PINCHOS! 🌵', life: 1.25, color: '#84cc16', scale: 1.4 });

      // Expulsar pinchos radiales veloces a 360° que perforan y aniquilan enemigos
      const spikeCount = 20;
      for (let i = 0; i < spikeCount; i++) {
        const angle = (i * Math.PI * 2) / spikeCount;
        state.projectiles.push(new Projectile({
          x: o.x, y: o.y,
          vx: Math.cos(angle) * 520, vy: Math.sin(angle) * 520,
          size: 7,
          damage: 150 + state.player.level * 10,
          color: '#84cc16',
          pierce: 5,
          kind: 'sauce'
        }));
      }

      // Daño de área masivo inmediato a todos los enemigos cercanos
      for (const enemy of state.enemies) {
        if (enemy.hp > 0 && Math.hypot(enemy.x - o.x, enemy.y - o.y) < 320) {
          damageEnemy(state, enemy, 160 + state.player.level * 12, 'crit');
          if (enemy.hp <= 0 && state.mapId === 'desert') {
            state.cartographyProgress = state.cartographyProgress || {};
            state.cartographyProgress.desert = (state.cartographyProgress.desert || 0) + 1;
            const cur = state.cartographyProgress.desert;
            if (cur <= 10 && state.floaters) {
              state.floaters.push({
                x: enemy.x, y: enemy.y - 48,
                text: cur === 10 ? '⭐ ¡MISIÓN DE MAPA COMPLETADA!' : `🎯 MISIÓN: ${cur}/10`,
                life: 1.2, color: cur === 10 ? '#facc15' : '#c084fc', scale: cur === 10 ? 1.3 : 1.0, kind: 'combo'
              });
            }
          }
        }
      }
    }

    if (o.kicked) {
      if (o.isCoconut) {
        // Coco pateado revienta al primer enemigo que choca
        for (const enemy of state.enemies) {
          if (enemy.hp > 0 && Math.hypot(enemy.x - o.x, enemy.y - o.y) < enemy.radius + o.radius + 6) {
            o.exploded = true;
            damageEnemy(state, enemy, 160 + state.player.level * 10, 'crit');
            if (state.mapId === 'beach') {
              state.cartographyProgress = state.cartographyProgress || {};
              state.cartographyProgress.beach = (state.cartographyProgress.beach || 0) + 1;
              if (enemy.hp <= 0) {
                state.cartographyProgress.beach_alt = (state.cartographyProgress.beach_alt || 0) + 1;
              }
              const cur = state.cartographyProgress.beach;
              if (cur <= 8 && state.floaters) {
                state.floaters.push({
                  x: enemy.x, y: enemy.y - 48,
                  text: cur === 8 ? '⭐ ¡MISIÓN DE MAPA COMPLETADA!' : `🎯 MISIÓN: ${cur}/8`,
                  life: 1.2, color: cur === 8 ? '#facc15' : '#c084fc', scale: cur === 8 ? 1.3 : 1.0, kind: 'combo'
                });
              }
            }
            burst(state, o.x, o.y, '#ffffff', 18, 180);
            burst(state, o.x, o.y, '#78350f', 14, 150);
            impactRing(state, o.x, o.y, '#ffffff');
            state.shake = Math.max(state.shake || 0, 0.22);
            state.audio?.play('hit');
            break;
          }
        }
      } else {
        // Pelota pateada revienta enemigos a su paso
        for (const enemy of state.enemies) {
          o.hitEnemies ||= new Set();
          if (enemy.hp > 0 && !o.hitEnemies.has(enemy) && Math.hypot(enemy.x - o.x, enemy.y - o.y) < enemy.radius + o.radius + 6) {
            o.hitEnemies.add(enemy);
            damageEnemy(state, enemy, 130 + state.player.level * 8, 'crit');
            if (state.mapId === 'football') {
              state.cartographyProgress = state.cartographyProgress || {};
              state.cartographyProgress.football = (state.cartographyProgress.football || 0) + 1;
              const cur = state.cartographyProgress.football;
              if (cur <= 8 && state.floaters) {
                state.floaters.push({
                  x: enemy.x, y: enemy.y - 48,
                  text: cur === 8 ? '⭐ ¡MISIÓN DE MAPA COMPLETADA!' : `🎯 MISIÓN: ${cur}/8`,
                  life: 1.2, color: cur === 8 ? '#facc15' : '#c084fc', scale: cur === 8 ? 1.3 : 1.0, kind: 'combo'
                });
              }
            }
            state.shake = Math.max(state.shake || 0, 0.15);
            state.audio?.play('kill');
          }
        }
      }
    } else if (!o.exploded && !o.isCoconut && Math.hypot(o.x - state.player.x, o.y - state.player.y) < o.radius + state.player.radius && state.player.takeDamage(state.mapId === 'football' ? 10 : 13)) {
      state.shake = .16; state.audio?.play('damage');
    }
  }
  state.mapObstacles = state.mapObstacles.filter(o => !o.exploded && o.x > -80 && o.x < worldW + 80 && o.y > 60 && o.y < worldH + 60);
}

export function drawMapObstacles(ctx, state) {
  for (const o of state.mapObstacles) {
    if (o.warning > 0) {
      if (o.isCoconut) {
        ctx.save();
        const progress = 1 - Math.max(0, o.warning / 0.8);
        ctx.fillStyle = `rgba(7, 18, 24, ${0.15 + progress * 0.35})`;
        ctx.beginPath();
        ctx.ellipse(o.x, o.y, 8 + progress * 12, 4 + progress * 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.font = '900 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('¡COCO! 🥥', o.x, o.y - 24);
        ctx.restore();
        continue;
      }
      ctx.save();
      const direction = o.vx > 0 ? 1 : -1;
      const x = direction > 0 ? (state.camera?.x || 0) + 40 : (state.camera?.x || 0) + (state.view?.w || 960) - 40;
      ctx.fillStyle = '#f8dc8c'; ctx.beginPath();
      ctx.moveTo(x + direction * 14, o.y); ctx.lineTo(x - direction * 8, o.y - 12); ctx.lineTo(x - direction * 8, o.y + 12); ctx.fill();
      ctx.strokeStyle = '#ffd57c88'; ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.moveTo(x, o.y); ctx.lineTo(x + direction * 120, o.y); ctx.stroke();
      ctx.restore(); continue;
    }

    if (o.isCoconut) {
      ctx.save();
      ctx.translate(o.x, o.y);
      // Sombra de contacto
      ctx.fillStyle = '#07151b55';
      ctx.beginPath();
      ctx.ellipse(0, 14, 18, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rotación si fue pateado
      const rollAngle = o.kicked ? (o.animTime || 0) * 16 : 0;
      ctx.rotate(rollAngle);
      // Coco pixel art con corteza y los 3 hoyitos
      ctx.fillStyle = '#1c0a00';
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#54392b';
      ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#784c38';
      ctx.beginPath(); ctx.arc(-3, -3, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-6, -6, 4, 3);
      // 3 hoyitos característicos del coco
      ctx.fillStyle = '#1c0a00';
      ctx.fillRect(-4, 2, 3, 3);
      ctx.fillRect(2, 2, 3, 3);
      ctx.fillRect(-1, 5, 3, 3);
      ctx.restore();
      continue;
    }

    ctx.save(); ctx.translate(o.x, o.y);
    const shadowScale = state.mapId === 'football' ? 36 : 42;
    ctx.fillStyle = '#07151b66'; ctx.beginPath(); ctx.ellipse(0, 32, shadowScale, 12, 0, 0, Math.PI * 2); ctx.fill();

    // 16 cuadros a 0.05s por cuadro = 20 fps (idéntico al delay nativo del GIF)
    const frameIndex = Math.floor((o.animTime || 0) * 20) % 16;

    if (state.mapId === 'football') {
      if (o.kicked) {
        // Estela neón de pelota pateada (anillos translúcidos en vez de shadowBlur)
        ctx.fillStyle = '#00ffcc';
        ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (pelotaSheet && pelotaSheet.complete && pelotaSheet.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        // Pelota recortada con tamaño ampliado notable (96x72 px) y animación fluida en vivo
        const frameW = 318;
        const frameH = 240;
        const dw = 96;
        const dwH = 72;
        ctx.drawImage(
          pelotaSheet,
          frameIndex * frameW, 0, frameW, frameH,
          -dw / 2, -dwH / 2, dw, dwH
        );
      } else {
        // Fallback procedural ampliado
        ctx.fillStyle = '#111b20'; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = o.kicked ? '#00e5ff' : '#0f172a';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = i * Math.PI * 2 / 5 - Math.PI / 2;
          const px = Math.cos(a) * 11, py = Math.sin(a) * 11;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
      }
    } else {
      if (cactusSheet && cactusSheet.complete && cactusSheet.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        // Cactus recortado con tamaño imponente (114x74 px) y animación fluida en vivo
        const frameW = 378;
        const frameH = 246;
        const dw = 114;
        const dwH = 74;
        ctx.drawImage(
          cactusSheet,
          frameIndex * frameW, 0, frameW, frameH,
          -dw / 2, -dwH / 2, dw, dwH
        );
      } else {
        // Fallback procedural de contingencia ampliado
        ctx.fillStyle = '#143823'; ctx.fillRect(-18, -32, 36, 64);
        ctx.fillStyle = '#15803d'; ctx.fillRect(-14, -28, 28, 56);
        ctx.fillStyle = '#22c55e'; ctx.fillRect(-9, -24, 9, 48);
      }
    }
    ctx.restore();
  }

  // Charcos de aceite caliente en cocina (con burbujas y humo)
  if (state.mapId === 'kitchen') {
    for (const h of state.hazards) {
      if (!h.isOil) continue;
      const alpha = Math.min(.75, h.life * .16);
      const pulse = 0.9 + Math.sin(performance.now() / 180) * 0.1;
      ctx.save();
      ctx.globalAlpha = alpha * pulse;
      // Aceite espeso hirviendo con brillo dorado
      const grad = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.radius);
      grad.addColorStop(0, '#f59e0bcc');
      grad.addColorStop(0.5, '#b45309aa');
      grad.addColorStop(0.85, '#78350f66');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.ellipse(h.x, h.y, h.radius, h.radius * .58, 0, 0, Math.PI * 2); ctx.fill();

      // Borde de fritura crujiente
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.ellipse(h.x, h.y, h.radius * 0.9, h.radius * 0.52, 0, 0, Math.PI * 2); ctx.stroke();

      // Burbujas doradas que revientan
      ctx.fillStyle = '#fef08a';
      for (let i = 0; i < 5; i++) {
        const bx = h.x + Math.cos(performance.now() / 320 + i * 1.25) * h.radius * .5;
        const by = h.y + Math.sin(performance.now() / 320 + i * 1.25) * h.radius * .3;
        ctx.beginPath(); ctx.arc(bx, by, 2 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  if (state.mapId === 'snow' && state.wasFreezing) {
    const worldW = state.world?.width || 1920;
    const worldH = state.world?.height || 1080;
    ctx.save(); ctx.fillStyle = '#b9ebff25'; ctx.fillRect(0, 90, worldW, worldH - 90);
    ctx.fillStyle = '#f5ffff99';
    for (let i = 0; i < 75; i++) {
      const x = (i * 173 + state.time * 68) % worldW, y = 105 + (i * 83 + state.time * 42) % (worldH - 120);
      ctx.fillRect(x, y, 5, 2);
    }
    ctx.restore();
  }

  // Dibujar cangrejitos de la playa
  if (state.mapId === 'beach') {
    drawBeachCrabs(ctx, state);
  }

  // Dibujar Cofre Acorazado del Camión de Reparto
  if (state.deliveryChest && !state.deliveryChest.opened) {
    drawDeliveryChest(ctx, state.deliveryChest, state.time);
  }

  // Dibujar atmósfera de Turno Nocturno 24hs
  if (state.nightShift) {
    drawNightShiftAtmosphere(ctx, state);
  }
}

export function drawDeliveryChest(ctx, chest, time = 0) {
  if (!chest || chest.opened) return;
  const x = Math.round(chest.x);
  const y = Math.round(chest.y);
  const hit = (chest.hitFlash || 0) > 0;

  ctx.save();
  ctx.translate(x, y);

  // Sombra suave proyectada en el piso
  ctx.fillStyle = 'rgba(7, 18, 24, 0.42)';
  ctx.beginPath();
  ctx.ellipse(0, 22, 34, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Halo de advertencia pulsante
  const pulse = 0.5 + Math.sin(time * 6) * 0.5;
  ctx.strokeStyle = `rgba(245, 158, 11, ${0.35 + pulse * 0.35})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, chest.radius + 6 + pulse * 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Cuerpo metálico blindado (56 x 44 px)
  const bodyColor = hit ? '#ffffff' : '#334155';
  const rimColor = hit ? '#ffffff' : '#1e293b';
  ctx.fillStyle = rimColor;
  ctx.fillRect(-28, -22, 56, 44);
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-26, -20, 52, 40);

  // Franjas diagonales industriales de precaución
  if (!hit) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-24, -12, 48, 24);
    ctx.clip();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-24, -12, 48, 24);
    ctx.fillStyle = '#0f172a';
    for (let s = -40; s < 40; s += 16) {
      ctx.beginPath();
      ctx.moveTo(s, -12);
      ctx.lineTo(s + 10, -12);
      ctx.lineTo(s + 2, 12);
      ctx.lineTo(s - 8, 12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Refuerzos y remaches de acero en las esquinas
  const rivetColor = hit ? '#ffffff' : '#94a3b8';
  ctx.fillStyle = rivetColor;
  for (const [rx, ry] of [[-24, -18], [20, -18], [-24, 14], [20, 14]]) {
    ctx.fillRect(rx, ry, 4, 4);
  }

  // Candado o cerradura dorada en el centro
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-8, -4, 16, 12);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-6, -2, 12, 8);
  ctx.fillStyle = '#d97706';
  ctx.fillRect(-2, 0, 4, 4);

  // Baliza de emergencia en el techo con giro de luz ámbar
  const beaconAngle = time * 8;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-6, -26, 12, 5);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-4, -28, 8, 4);
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(0, -26, 16, beaconAngle, beaconAngle + 0.9);
  ctx.lineTo(0, -26);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Barra de resistencia (HP)
  const barW = 48, barH = 5;
  const barY = -35;
  const hpRatio = Math.max(0, chest.hp / (chest.maxHp || 60));
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);
  ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH);

  // Temporizador de expiración
  ctx.fillStyle = '#f8fafc';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const sec = Math.ceil(chest.timer);
  ctx.fillText(`⏱ ${sec}s`, 0, barY - 3);

  ctx.restore();
}

export function drawNightShiftAtmosphere(ctx, state) {
  if (!state.nightShift) return;
  const p = state.player || { x: 500, y: 500 };
  const worldW = state.world?.width || 1920;
  const worldH = state.world?.height || 1080;
  const time = state.time || 0;
  const pulse = Math.sin(time * 3) * 8;
  const lanternRadius = 185 + pulse;

  ctx.save();
  // Halo de luz linterna centrado en el jugador que ilumina la noche
  const grad = ctx.createRadialGradient(p.x, p.y, 45, p.x, p.y, lanternRadius);
  grad.addColorStop(0, 'rgba(15, 12, 38, 0.08)');
  grad.addColorStop(0.5, 'rgba(14, 10, 36, 0.28)');
  grad.addColorStop(0.82, 'rgba(12, 8, 32, 0.46)');
  grad.addColorStop(1, 'rgba(10, 6, 28, 0.58)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 90, worldW, worldH - 90);

  // Cartel de neón parpadeante "🌙 24HS ABIERTO" en la parte superior
  const flicker = Math.sin(time * 12) > 0.88 ? 0.3 : 0.95;
  ctx.globalAlpha = flicker;
  ctx.fillStyle = '#f43f5e';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = '#f43f5e';
  ctx.shadowBlur = 10;
  ctx.fillText('🌙 ABIERTO 24HS · TURNO NOCTURNO', worldW / 2, 105);
  ctx.restore();
}

export function drawBeachCrabs(ctx, state) {
  if (!state.beachCrabs) return;
  for (const c of state.beachCrabs) {
    ctx.save();
    ctx.translate(c.x, c.y);

    if (c.buried > 0) {
      // Montañita de arena con los dos ojitos asomando
      ctx.fillStyle = '#deb069';
      ctx.beginPath();
      ctx.ellipse(0, 4, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ebd08f';
      ctx.beginPath();
      ctx.ellipse(0, 2, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ojitos
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4, -4, 3, 4);
      ctx.fillRect(2, -4, 3, 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3, -3, 2, 2);
      ctx.fillRect(3, -3, 2, 2);
      ctx.restore();
      continue;
    }

    // Sombra de contacto
    ctx.fillStyle = 'rgba(7, 18, 24, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const dir = c.facing || 1;
    ctx.scale(dir, 1);

    // Patitas ágiles que se mueven al caminar de costado (3 a la izquierda, 3 a la derecha)
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.5;
    for (let p = 0; p < 3; p++) {
      const legWave = Math.sin(c.anim + p * 1.5) * 3;
      // Pata trasera
      ctx.beginPath();
      ctx.moveTo(-4 - p * 2, 2);
      ctx.lineTo(-8 - p * 3, 5 + legWave);
      ctx.stroke();
      // Pata delantera
      ctx.beginPath();
      ctx.moveTo(4 + p * 2, 2);
      ctx.lineTo(8 + p * 3, 5 - legWave);
      ctx.stroke();
    }

    // Caparazón redondo rojo
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-8, -5, 16, 11);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-7, -4, 14, 9);
    ctx.fillStyle = '#f87171';
    ctx.fillRect(-5, -3, 6, 3); // brillo de caparazón

    // Pedúnculos y ojos saltones
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, -9, 4, 5);
    ctx.fillRect(1, -9, 4, 5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4, -8, 2, 3);
    ctx.fillRect(2, -8, 2, 3);

    // 2 Tenazas frontales que abren y cierran
    const clawPinch = Math.sin(c.anim * 1.5) * 2;
    // Tenaza izquierda
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-12, -4, 5, 4);
    ctx.fillRect(-14, -7 + clawPinch, 4, 4);
    // Tenaza derecha
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(7, -4, 5, 4);
    ctx.fillRect(10, -7 - clawPinch, 4, 4);

    ctx.restore();
  }
}
