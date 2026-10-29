import { damageEnemy, burst, impactRing } from './effectSystem.js';

// Sprite sheets generadas a partir de todos los cuadros de animación de los GIFs originales (16 frames)
export const cactusSheet = typeof Image !== 'undefined' ? new Image() : null;
if (cactusSheet) cactusSheet.src = './cactus_sheet.png';

export const pelotaSheet = typeof Image !== 'undefined' ? new Image() : null;
if (pelotaSheet) pelotaSheet.src = './pelota_sheet.png';

export function updateMap(state, dt) {
  const worldW = state.world?.width || 1920;
  const worldH = state.world?.height || 1080;

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
  if (!['desert', 'football'].includes(state.mapId)) return;
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
        state.projectiles.push({
          x: o.x, y: o.y,
          vx: Math.cos(angle) * 520, vy: Math.sin(angle) * 520,
          radius: 7,
          damage: 150 + state.player.level * 10,
          life: 1.8,
          color: '#84cc16',
          hitEnemies: new Set(),
          pierce: 5,
          isThorn: true
        });
      }

      // Daño de área masivo inmediato a todos los enemigos cercanos
      for (const enemy of state.enemies) {
        if (enemy.hp > 0 && Math.hypot(enemy.x - o.x, enemy.y - o.y) < 320) {
          damageEnemy(state, enemy, 160 + state.player.level * 12, 'crit');
        }
      }
    }

    if (o.kicked) {
      // Pelota pateada revienta enemigos a su paso
      for (const enemy of state.enemies) {
        o.hitEnemies ||= new Set();
        if (enemy.hp > 0 && !o.hitEnemies.has(enemy) && Math.hypot(enemy.x - o.x, enemy.y - o.y) < enemy.radius + o.radius + 6) {
          o.hitEnemies.add(enemy);
          damageEnemy(state, enemy, 130 + state.player.level * 8, 'crit');
          state.shake = Math.max(state.shake || 0, 0.15);
          state.audio?.play('kill');
        }
      }
    } else if (!o.exploded && Math.hypot(o.x - state.player.x, o.y - state.player.y) < o.radius + state.player.radius && state.player.takeDamage(state.mapId === 'football' ? 10 : 13)) {
      state.shake = .16; state.audio?.play('damage');
    }
  }
  state.mapObstacles = state.mapObstacles.filter(o => !o.exploded && o.x > -80 && o.x < worldW + 80 && o.y > 60 && o.y < worldH + 60);
}

export function drawMapObstacles(ctx, state) {
  for (const o of state.mapObstacles) {
    if (o.warning > 0) {
      ctx.save();
      const direction = o.vx > 0 ? 1 : -1;
      const x = direction > 0 ? (state.camera?.x || 0) + 40 : (state.camera?.x || 0) + (state.view?.w || 960) - 40;
      ctx.fillStyle = '#f8dc8c'; ctx.beginPath();
      ctx.moveTo(x + direction * 14, o.y); ctx.lineTo(x - direction * 8, o.y - 12); ctx.lineTo(x - direction * 8, o.y + 12); ctx.fill();
      ctx.strokeStyle = '#ffd57c88'; ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.moveTo(x, o.y); ctx.lineTo(x + direction * 120, o.y); ctx.stroke();
      ctx.restore(); continue;
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
}
