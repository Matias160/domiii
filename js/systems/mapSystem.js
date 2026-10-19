export function updateMap(state, dt) {
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
    // Salpicadura de aceite caliente cada ~4s
    if (state.mapClock > 4 + Math.random() * 1.5) {
      state.mapClock = 0;
      const x = 120 + Math.random() * 720;
      const y = 140 + Math.random() * 350;
      state.hazards.push({ x, y, radius: 28, life: 4.5, isOil: true });
      state.directorNotice = '¡ACEITE CALIENTE!';
    }
    return;
  }
  if (!['desert', 'football'].includes(state.mapId)) return;
  state.mapClock += dt;
  if (state.mapClock > 4.5) {
    state.mapClock = 0;
    const y = 145 + Math.random() * 335, side = Math.random() < .5 ? -1 : 1;
    state.mapObstacles.push({ x: side < 0 ? -35 : 995, y, vx: -side * (state.mapId === 'football' ? 180 : 135), vy: (Math.random() - .5) * 55, radius: state.mapId === 'football' ? 16 : 18, spin: 0, warning: .8 });
    if (state.mapId === 'football') state.mapObstacles.push({ x: side < 0 ? 995 : -35, y: 155 + Math.random() * 315, vx: side * 150, vy: (Math.random() - .5) * 60, radius: 16, spin: 0, warning: .8 });
  }
  for (const o of state.mapObstacles) {
    if (o.warning > 0) { o.warning = Math.max(0, o.warning - dt); continue; }
    o.x += o.vx * dt; o.y += o.vy * dt; o.spin += dt * 5;
    if (Math.hypot(o.x - state.player.x, o.y - state.player.y) < o.radius + state.player.radius && state.player.takeDamage(state.mapId === 'football' ? 10 : 13)) {
      state.shake = .16; state.audio?.play('damage');
    }
  }
  state.mapObstacles = state.mapObstacles.filter(o => o.x > -60 && o.x < 1020 && o.y > 90 && o.y < 560);
}

export function drawMapObstacles(ctx, state) {
  for (const o of state.mapObstacles) {
    if (o.warning > 0) {
      ctx.save();
      const x = o.vx > 0 ? 51 : 909, direction = o.vx > 0 ? 1 : -1;
      ctx.fillStyle = '#f8dc8c'; ctx.beginPath();
      ctx.moveTo(x + direction * 11, o.y); ctx.lineTo(x - direction * 7, o.y - 10); ctx.lineTo(x - direction * 7, o.y + 10); ctx.fill();
      ctx.strokeStyle = '#ffd57c77'; ctx.setLineDash([5, 7]);
      ctx.beginPath(); ctx.moveTo(x, o.y); ctx.lineTo(x + direction * 95, o.y); ctx.stroke();
      ctx.restore(); continue;
    }
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.spin);
    ctx.fillStyle = '#07151b66'; ctx.beginPath(); ctx.ellipse(3, 18, 19, 7, 0, 0, 7); ctx.fill();
    if (state.mapId === 'football') {
      ctx.fillStyle = '#f7f7e8'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); ctx.fill();
      ctx.fillStyle = '#253431';
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; ctx.beginPath(); ctx.arc(Math.cos(a) * 9, Math.sin(a) * 9, 3.7, 0, 7); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = '#3a8b68'; ctx.fillRect(-8, -15, 16, 32); ctx.fillRect(-18, -4, 12, 9); ctx.fillRect(6, -11, 13, 9);
      ctx.fillStyle = '#b8e7a2'; ctx.fillRect(-4, -12, 3, 25); ctx.fillRect(10, -9, 3, 8);
    }
    ctx.restore();
  }

  // Charcos de aceite caliente en cocina
  if (state.mapId === 'kitchen') {
    for (const h of state.hazards) {
      if (!h.isOil) continue;
      const alpha = Math.min(.55, h.life * .12);
      const pulse = 0.85 + Math.sin(performance.now() / 220) * 0.15;
      ctx.save();
      ctx.globalAlpha = alpha * pulse;
      const grad = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.radius);
      grad.addColorStop(0, '#ffe066cc');
      grad.addColorStop(0.6, '#ff9a1888');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.ellipse(h.x, h.y, h.radius, h.radius * .55, 0, 0, Math.PI * 2); ctx.fill();
      // Burbujitas animadas
      ctx.fillStyle = '#ffdd8855';
      for (let i = 0; i < 4; i++) {
        const bx = h.x + Math.cos(performance.now() / 400 + i * 1.57) * h.radius * .45;
        const by = h.y + Math.sin(performance.now() / 400 + i * 1.57) * h.radius * .25;
        ctx.beginPath(); ctx.arc(bx, by, 3 + i, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  if (state.mapId === 'snow' && state.wasFreezing) {
    ctx.save(); ctx.fillStyle = '#b9ebff25'; ctx.fillRect(0, 90, 960, 450);
    ctx.fillStyle = '#f5ffff99';
    for (let i = 0; i < 48; i++) {
      const x = (i * 173 + state.time * 68) % 960, y = 105 + (i * 83 + state.time * 42) % 400;
      ctx.fillRect(x, y, 5, 2);
    }
    ctx.restore();
  }
}
