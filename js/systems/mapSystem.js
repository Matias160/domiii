import { damageEnemy } from './effectSystem.js';

export const cactusGif = typeof Image !== 'undefined' ? new Image() : null;
if (cactusGif) cactusGif.src = './Cactus.gif';

export const pelotaGif = typeof Image !== 'undefined' ? new Image() : null;
if (pelotaGif) pelotaGif.src = './Pelota.gif';

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
      vy: 0, // Movimiento en línea recta horizontal
      radius: state.mapId === 'football' ? 26 : 30, // Hitbox más generosa acorde al tamaño
      spin: 0, warning: .8, kicked: false
    });
    if (state.mapId === 'football') {
      state.mapObstacles.push({
        x: side < 0 ? worldW + 35 : -35,
        y: 180 + Math.random() * (worldH - 300),
        vx: side * 190,
        vy: 0, // Movimiento en línea recta horizontal
        radius: 26, spin: 0, warning: .8, kicked: false
      });
    }
  }
  for (const o of state.mapObstacles) {
    if (o.warning > 0) { o.warning = Math.max(0, o.warning - dt); continue; }
    o.x += o.vx * dt; o.y += o.vy * dt; // Sin rotación añadida para mantener la orientación del gif limpia y recta

    // Cancha: patear la pelota con el acelerón
    if (state.mapId === 'football' && state.player.dashTime > 0 && Math.hypot(o.x - state.player.x, o.y - state.player.y) < o.radius + state.player.radius + 18) {
      const fx = state.player.facing.x || 1, fy = state.player.facing.y || 0;
      o.vx = fx * 680;
      o.vy = fy * 680;
      o.kicked = true;
      state.shake = 0.24;
      state.audio?.play('hit');
      state.floaters?.push({ x: o.x, y: o.y - 30, text: '¡BOMBAZO! ⚽', life: 1.1, color: '#00ffcc', scale: 1.35 });
    }

    if (o.kicked) {
      // Pelota pateada revienta enemigos a su paso
      for (const enemy of state.enemies) {
        if (enemy.hp > 0 && Math.hypot(enemy.x - o.x, enemy.y - o.y) < enemy.radius + o.radius + 6) {
          damageEnemy(state, enemy, 130 + state.player.level * 8, 'crit');
          state.shake = Math.max(state.shake || 0, 0.15);
          state.audio?.play('kill');
        }
      }
    } else if (Math.hypot(o.x - state.player.x, o.y - state.player.y) < o.radius + state.player.radius && state.player.takeDamage(state.mapId === 'football' ? 10 : 13)) {
      state.shake = .16; state.audio?.play('damage');
    }
  }
  state.mapObstacles = state.mapObstacles.filter(o => o.x > -80 && o.x < worldW + 80 && o.y > 60 && o.y < worldH + 60);
}

export function drawMapObstacles(ctx, state) {
  for (const o of state.mapObstacles) {
    if (o.warning > 0) {
      ctx.save();
      const direction = o.vx > 0 ? 1 : -1;
      const x = direction > 0 ? (state.camera?.x || 0) + 40 : (state.camera?.x || 0) + 920;
      ctx.fillStyle = '#f8dc8c'; ctx.beginPath();
      ctx.moveTo(x + direction * 14, o.y); ctx.lineTo(x - direction * 8, o.y - 12); ctx.lineTo(x - direction * 8, o.y + 12); ctx.fill();
      ctx.strokeStyle = '#ffd57c88'; ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.moveTo(x, o.y); ctx.lineTo(x + direction * 120, o.y); ctx.stroke();
      ctx.restore(); continue;
    }
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.fillStyle = '#07151b66'; ctx.beginPath(); ctx.ellipse(0, 24, 28, 10, 0, 0, Math.PI * 2); ctx.fill();
    if (state.mapId === 'football') {
      if (o.kicked) {
        ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 18;
      }
      if (pelotaGif && pelotaGif.complete && pelotaGif.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        // Pelota más grande (58x58 px) y sin girar
        ctx.drawImage(pelotaGif, -29, -29, 58, 58);
      } else {
        // Fallback procedural ampliado
        ctx.fillStyle = '#111b20'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = o.kicked ? '#00e5ff' : '#0f172a';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = i * Math.PI * 2 / 5 - Math.PI / 2;
          const px = Math.cos(a) * 9, py = Math.sin(a) * 9;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
        for (let i = 0; i < 5; i++) {
          const a = i * Math.PI * 2 / 5 - Math.PI / 2;
          const px = Math.cos(a) * 19, py = Math.sin(a) * 19;
          ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-8, -16, 6, 4);
      }
    } else {
      if (cactusGif && cactusGif.complete && cactusGif.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        // Cactus más grande (64x76 px) y sin girar
        ctx.drawImage(cactusGif, -32, -38, 64, 76);
      } else {
        // Fallback procedural de contingencia ampliado
        ctx.fillStyle = '#143823'; ctx.fillRect(-14, -26, 28, 52);
        ctx.fillStyle = '#15803d'; ctx.fillRect(-11, -23, 22, 46);
        ctx.fillStyle = '#22c55e'; ctx.fillRect(-7, -20, 7, 40);
        ctx.fillStyle = '#143823'; ctx.fillRect(-30, -9, 18, 16); ctx.fillRect(-30, -22, 11, 16);
        ctx.fillStyle = '#16a34a'; ctx.fillRect(-27, -6, 15, 10); ctx.fillRect(-27, -19, 8, 15);
        ctx.fillStyle = '#143823'; ctx.fillRect(12, -18, 18, 16); ctx.fillRect(20, -30, 11, 16);
        ctx.fillStyle = '#16a34a'; ctx.fillRect(12, -15, 15, 10); ctx.fillRect(20, -27, 8, 13);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-3, -13, 3, 3); ctx.fillRect(3, -3, 3, 3); ctx.fillRect(-4, 9, 3, 3);
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
