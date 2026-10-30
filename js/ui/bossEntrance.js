// ============================================================================
// DOMI 2: PANCHO - ENTRADA ÉPICA DE JEFE
// Con la partida en pausa: barras de cine, alarma roja y retumbe; un círculo
// rúnico se enciende en el suelo y baja un pilar de luz dorada; el jefe cae por
// el pilar y golpea el suelo (destello, ondas de choque, escombros), se planta
// entre brasas y entra su cartel. Se puede saltear.
// ============================================================================

export const ENTRANCE = { duration: 3.4, runeAt: 0.35, pillarAt: 0.55, dropAt: 1.15, slamAt: 1.35, bannerAt: 1.9, skipAfter: 0.7 };

const DEBRIS_COLORS = ['#8a6a48', '#5e4a36', '#c9a77a', '#3e3329'];
const EMBER_COLORS = ['#ffd34f', '#ff9f1c', '#ff4b2b', '#fff3b0'];
const POOF_COLORS = ['#ffffff', '#e2e8f0', '#cbd5e1', '#fff2c6'];

function spray(entrance, x, y, colors, count, power, { gravity = 260, size = 5, up = 0, life = 0.7 } = {}) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2, speed = power * (0.35 + Math.random() * 0.65);
    const span = life * (0.6 + Math.random() * 0.6);
    entrance.parts.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * 0.6 - up,
      life: span, max: span, size: size * (0.6 + Math.random() * 0.8), color: colors[i % colors.length], gravity,
    });
  }
}

function playTone(audio, freq, duration, volume, type, end) {
  if (audio?.sfxEnabled && audio.context) audio.tone(freq, duration, volume, type, end);
}

// Mantiene los enemigos normales en la arena y arma la animación de entrada del jefe
export function startBossEntrance(state, boss, camera, view) {
  const entrance = { boss, t: 0, parts: [], waves: [], slammed: false, dropped: false, rumbled: false, shake: 0, flash: 0, emberClock: 0, done: false };
  boss.spawnTime = 0;
  entrance.skyY = camera.y - 40;                 // de dónde baja el pilar (arriba de la pantalla)
  entrance.fallHeight = Math.max(160, boss.y - entrance.skyY);
  entrance.view = view;
  return entrance;
}

export function skipBossEntrance(entrance) {
  const timing = entrance.mode === 'rage' ? RAGE : ENTRANCE;
  if (entrance.t >= timing.skipAfter) entrance.t = timing.duration;
}

// ---------------------------------------------------------------------------
// SEGUNDA FASE: pausa corta cuando el jefe "muere" por primera vez y se levanta furioso
// ---------------------------------------------------------------------------
// biteAt: aparece mordido entre migas; burstAt: se levanta furioso
export const RAGE = { duration: 3.2, chargeAt: 0.35, biteAt: 1.2, burstAt: 1.5, titleAt: 1.55, skipAfter: 0.6 };
const CRUMB_COLORS = ['#f6d38b', '#c98a3d', '#fff1b8', '#8a5a2b'];
const RAGE_COLORS = ['#ff2a44', '#ff6b35', '#ffd34f', '#7a0012'];

export function startBossRage(state, boss) {
  // El sprite mordido recién aparece en biteAt
  boss.hideBite = true;
  return { bitten: false, mode: 'rage', boss, t: 0, parts: [], waves: [], bolts: [], charged: false, burst: false, shake: 0.25, flash: 1, flashColor: '#ffffff', emberClock: 0, sparkClock: 0, zoom: 1, done: false };
}

function updateRage(entrance, delta, audio) {
  entrance.t += delta;
  const { boss, t } = entrance;
  // 1) "¡NO TAN RÁPIDO!": destello del golpe final que no lo derribó
  // 2) Carga: la cámara se acerca y la energía gira en espiral hacia el jefe
  if (!entrance.charged && t >= RAGE.chargeAt) {
    entrance.charged = true;
    playTone(audio, 120, 0.9, 0.05, 'sawtooth', 520);
  }
  if (t >= RAGE.chargeAt && t < RAGE.burstAt) {
    const k = (t - RAGE.chargeAt) / (RAGE.burstAt - RAGE.chargeAt);
    entrance.zoom = 1 + 0.28 * Math.sin(k * Math.PI / 2);
    entrance.shake = Math.max(entrance.shake, 0.03 + k * 0.05);
    entrance.sparkClock -= delta;
    while (entrance.sparkClock <= 0) {
      entrance.sparkClock += 0.018;
      const angle = Math.random() * Math.PI * 2, dist = 170 + Math.random() * 90;
      entrance.parts.push({ spiral: true, angle, dist, speed: 2.4 + Math.random() * 1.6, cx: boss.x, cy: boss.y, x: boss.x, y: boss.y, life: 0.8, max: 0.8, size: 3 + Math.random() * 3, color: RAGE_COLORS[(Math.random() * 3) | 0] });
    }
  }
  // 2b) Aparece el mordisco: destello y migas que saltan del lado mordido
  if (!entrance.bitten && t >= RAGE.biteAt) {
    entrance.bitten = true;
    boss.hideBite = false;
    entrance.shake = 0.55; entrance.flash = 0.8; entrance.flashColor = '#ffffff';
    const bx = boss.x + boss.radius * 0.55, by = boss.y - boss.radius * 0.15;
    spray(entrance, bx, by, [...CRUMB_COLORS, boss.type.color], 40, 320, { gravity: 520, size: 6, up: 120, life: 1.1 });
    entrance.waves.push({ r: 0, max: 130, life: 0.5, color: '#fff6c2', width: 6, cx: bx, cy: by });
    playTone(audio, 70, 0.18, 0.12, 'square', 40);
    playTone(audio, 220, 0.08, 0.06, 'square', 90);
  }
  // 3) Transformación: destello rojo, rayos, ondas de choque y explosión de brasas
  if (!entrance.burst && t >= RAGE.burstAt) {
    entrance.burst = true;
    entrance.shake = 0.7; entrance.flash = 1; entrance.flashColor = '#ff3b4a';
    entrance.waves.push({ r: 0, max: 320, life: 0.9, color: '#ffffff', width: 8 });
    entrance.waves.push({ r: 0, max: 240, life: 1.0, color: '#ff2a44', width: 6 });
    entrance.waves.push({ r: 0, max: 160, life: 1.1, color: '#ffd34f', width: 5 });
    for (let i = 0; i < 9; i++) entrance.bolts.push(makeBolt(boss, i / 9 * Math.PI * 2 + Math.random() * 0.3));
    spray(entrance, boss.x, boss.y, RAGE_COLORS, 48, 380, { gravity: -30, size: 6, up: 30, life: 1.1 });
    audio?.play('boss');
    playTone(audio, 95, 0.8, 0.1, 'square', 34);
  }
  if (t >= RAGE.burstAt) entrance.zoom += (1 - entrance.zoom) * Math.min(1, delta * 6);
  // 4) Brasas que suben mientras se planta furioso
  if (entrance.burst && t < RAGE.duration - 0.3) {
    entrance.emberClock -= delta;
    if (entrance.emberClock <= 0) {
      entrance.emberClock = 0.03;
      const angle = Math.random() * Math.PI * 2;
      entrance.parts.push({ x: boss.x + Math.cos(angle) * boss.radius, y: boss.y + Math.sin(angle) * boss.radius * 0.5, vx: 0, vy: -90 - Math.random() * 70, life: 0.8, max: 0.8, size: 3 + Math.random() * 3, color: RAGE_COLORS[(Math.random() * 3) | 0], gravity: -30 });
    }
  }
  for (const bolt of entrance.bolts) bolt.life -= delta;
  entrance.bolts = entrance.bolts.filter(bolt => bolt.life > 0);
  stepEffects(entrance, delta);
  entrance.done = t >= RAGE.duration;
  if (entrance.done) { entrance.zoom = 1; boss.hideBite = false; }
  return entrance.done;
}

// Rayo pixelado en zigzag que sale del jefe
function makeBolt(boss, angle) {
  const points = [];
  const length = 140 + Math.random() * 120, steps = 7;
  for (let i = 0; i <= steps; i++) {
    const along = (i / steps) * length, wobble = (Math.random() - 0.5) * 34;
    points.push({ x: boss.x + Math.cos(angle) * along - Math.sin(angle) * wobble, y: boss.y + Math.sin(angle) * along * 0.6 + Math.cos(angle) * wobble * 0.6 });
  }
  return { points, life: 0.35, max: 0.35 };
}

function stepEffects(entrance, delta) {
  entrance.shake = Math.max(0, entrance.shake - delta);
  entrance.flash = Math.max(0, entrance.flash - delta * 3);
  for (const wave of entrance.waves) { wave.life -= delta; wave.r += (wave.max - wave.r) * Math.min(1, delta * 7); }
  entrance.waves = entrance.waves.filter(wave => wave.life > 0);
  let alive = 0;
  for (const p of entrance.parts) {
    p.life -= delta;
    if (p.life <= 0) continue;
    if (p.spiral) {
      // Gira y se acerca al jefe: la energía se concentra en él
      p.angle += p.speed * delta * 2.2;
      p.dist = Math.max(0, p.dist - (p.dist * 2.6 + 40) * delta);
      p.x = p.cx + Math.cos(p.angle) * p.dist; p.y = p.cy + Math.sin(p.angle) * p.dist * 0.6;
      if (p.dist < 6) continue;
    } else {
      p.x += p.vx * delta; p.y += p.vy * delta;
      p.vx *= 0.92; p.vy += p.gravity * delta;
    }
    entrance.parts[alive++] = p;
  }
  entrance.parts.length = alive;
}

function drawRageWorld(ctx, entrance, time) {
  const { boss, t } = entrance;
  // Aplastado por el golpe, luego tiembla cada vez más mientras carga y al estallar crece con un rebote
  const charge = t < RAGE.burstAt ? Math.max(0, (t - RAGE.chargeAt) / (RAGE.burstAt - RAGE.chargeAt)) : 0;
  const shakeX = t < RAGE.burstAt ? Math.sin(t * 80) * (1 + charge * 4) : 0;
  const k = Math.max(0, t - RAGE.burstAt);
  const squash = t < RAGE.chargeAt ? 0.12 * Math.sin(t / RAGE.chargeAt * Math.PI) : 0;
  const grow = t < RAGE.burstAt ? 1 / 1.12 : 1 + 0.14 * Math.exp(-k * 5) * Math.cos(k * 13);
  const baseY = boss.y + boss.radius;
  ctx.save();
  ctx.globalAlpha = 0.25 + charge * 0.35 + Math.abs(Math.sin(t * 10)) * 0.2;
  ctx.fillStyle = '#ff2a44';
  ctx.beginPath(); ctx.ellipse(boss.x, boss.y + boss.radius * 0.85, boss.radius * (1.2 + charge * 0.6), boss.radius * (0.4 + charge * 0.2), 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(boss.x + shakeX, baseY); ctx.scale(grow * (1 + squash), grow * (1 - squash)); ctx.translate(-boss.x, -baseY);
  // Parpadeo rojo/blanco cada vez más rápido mientras junta energía
  boss.hitFlash = t < RAGE.burstAt && Math.sin(t * (30 + charge * 40)) > 0.2 ? 0.05 : 0;
  boss.draw(ctx, time);
  ctx.restore();
  for (const bolt of entrance.bolts) {
    ctx.save();
    ctx.globalAlpha = bolt.life / bolt.max; ctx.lineJoin = 'miter';
    ctx.strokeStyle = '#ff2a44'; ctx.lineWidth = 7; drawPath(ctx, bolt.points);
    ctx.strokeStyle = '#fff6c2'; ctx.lineWidth = 3; drawPath(ctx, bolt.points);
    ctx.restore();
  }
  drawWavesAndParts(ctx, entrance, boss.x, boss.y);
}

function drawPath(ctx, points) {
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(Math.round(p.x), Math.round(p.y)) : ctx.moveTo(Math.round(p.x), Math.round(p.y))));
  ctx.stroke();
}

function drawRageScreen(ctx, entrance, W, H) {
  const t = entrance.t;
  const fadeOut = Math.max(0, Math.min(1, (RAGE.duration - t) / 0.35));
  ctx.save();
  // Oscurecido rojo que se cierra mientras carga, borde de alarma y barras de cine
  const charge = t < RAGE.burstAt ? Math.max(0, t / RAGE.burstAt) : 1;
  ctx.globalAlpha = (0.25 + charge * 0.25) * fadeOut; ctx.fillStyle = '#1a0005'; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = (0.4 + Math.abs(Math.sin(t * 8)) * 0.6) * fadeOut;
  ctx.strokeStyle = '#ff2a44'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, W - 12, H - 12);
  const bar = Math.round(H * 0.1 * Math.min(1, t / 0.25) * fadeOut);
  ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
  if (bar > 2) { ctx.fillStyle = '#ff2a44'; ctx.fillRect(0, bar - 2, W, 2); ctx.fillRect(0, H - bar, W, 2); }
  if (entrance.flash > 0) { ctx.globalAlpha = entrance.flash * 0.7; ctx.fillStyle = entrance.flashColor; ctx.fillRect(0, 0, W, H); }
  if (t < RAGE.biteAt) {
    ctx.globalAlpha = Math.min(1, t / 0.2) * (0.75 + Math.abs(Math.sin(t * 12)) * 0.25);
    headline(ctx, '¡NO TAN RÁPIDO!', W / 2, H * 0.24, Math.min(20, Math.floor(W / 34)), '#ffffff', '#ff2a44');
  }
  if (t >= RAGE.titleAt) {
    // El título cae de golpe desde grande a su tamaño
    const k = Math.min(1, (t - RAGE.titleAt) / 0.22);
    const size = Math.min(32, Math.floor(W / 20)) * (1 + 1.2 * Math.pow(1 - k, 3));
    ctx.globalAlpha = Math.min(1, k * 1.5) * fadeOut;
    headline(ctx, '¡SEGUNDA FASE!', W / 2, H * 0.72, size, '#ffe066', '#ff2a44');
    if (t >= RAGE.titleAt + 0.3) {
      ctx.globalAlpha = Math.min(1, (t - RAGE.titleAt - 0.3) / 0.25) * fadeOut;
      headline(ctx, '¡MORDIDO Y FURIOSO!', W / 2, H * 0.72 + 42, Math.min(14, Math.floor(W / 46)), '#ffffff', '#b3001e');
    }
  }
  if (t >= RAGE.skipAfter) {
    ctx.globalAlpha = 0.7 * fadeOut;
    ctx.font = "bold 10px 'Press Start 2P', monospace";
    ctx.textAlign = 'center'; ctx.fillStyle = '#e2f3ee';
    ctx.fillText('ESPACIO / CLIC PARA SEGUIR', W / 2, H - Math.max(14, bar + 12));
  }
  ctx.restore();
}

function drawWavesAndParts(ctx, entrance, cx, cy) {
  for (const wave of entrance.waves) {
    ctx.save();
    ctx.translate(wave.cx ?? cx, wave.cy ?? cy); ctx.scale(1, 0.45);
    ctx.globalAlpha = Math.max(0, Math.min(1, wave.life * 1.6));
    ctx.strokeStyle = wave.color; ctx.lineWidth = wave.width;
    ctx.beginPath(); ctx.arc(0, 0, wave.r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  for (const p of entrance.parts) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

export function updateBossEntrance(entrance, delta, audio) {
  if (entrance.mode === 'rage') return updateRage(entrance, delta, audio);
  entrance.t += delta;
  const { boss, t } = entrance;
  if (!entrance.rumbled && t >= 0.05) {
    entrance.rumbled = true;
    playTone(audio, 60, 1.1, 0.07, 'sawtooth', 42);   // retumbe grave que crece hacia el golpe
  }
  if (!entrance.dropped && t >= ENTRANCE.dropAt) {
    entrance.dropped = true;
    playTone(audio, 900, 0.22, 0.03, 'triangle', 220); // silbido de caída
  }
  if (t >= ENTRANCE.dropAt - 0.3 && t < ENTRANCE.slamAt) entrance.shake = Math.max(entrance.shake, 0.05);
  if (!entrance.slammed && t >= ENTRANCE.slamAt) {
    entrance.slammed = true;
    entrance.shake = 0.6;
    entrance.flash = 1;
    const footY = boss.y + boss.radius * 0.8;
    entrance.waves.push({ r: 0, max: 260, life: 0.75, color: '#ffffff', width: 6 });
    entrance.waves.push({ r: 0, max: 190, life: 0.85, color: '#ffd34f', width: 5 });
    entrance.waves.push({ r: 0, max: 120, life: 0.95, color: '#ff3b4a', width: 4 });
    spray(entrance, boss.x, footY, DEBRIS_COLORS, 34, 330, { gravity: 520, size: 6, up: 170, life: 0.9 });
    spray(entrance, boss.x, footY, EMBER_COLORS, 22, 240, { gravity: -60, size: 4, up: 60, life: 1 });
    audio?.play('boss');
    playTone(audio, 75, 0.6, 0.09, 'square', 30);
  }
  // Brasas que suben alrededor del jefe mientras se planta
  if (entrance.slammed && t < ENTRANCE.duration - 0.4) {
    entrance.emberClock -= delta;
    if (entrance.emberClock <= 0) {
      entrance.emberClock = 0.04;
      const angle = Math.random() * Math.PI * 2;
      entrance.parts.push({
        x: boss.x + Math.cos(angle) * boss.radius * 1.1, y: boss.y + boss.radius * 0.6 + Math.sin(angle) * 10,
        vx: (Math.random() - 0.5) * 20, vy: -70 - Math.random() * 60, life: 0.9, max: 0.9,
        size: 2 + Math.random() * 3, color: EMBER_COLORS[(Math.random() * EMBER_COLORS.length) | 0], gravity: -20,
      });
    }
  }
  entrance.shake = Math.max(0, entrance.shake - delta);
  entrance.flash = Math.max(0, entrance.flash - delta * 4);
  for (const wave of entrance.waves) { wave.life -= delta; wave.r += (wave.max - wave.r) * Math.min(1, delta * 7); }
  entrance.waves = entrance.waves.filter(wave => wave.life > 0);
  let alive = 0;
  for (const p of entrance.parts) {
    p.life -= delta;
    if (p.life <= 0) continue;
    p.x += p.vx * delta; p.y += p.vy * delta;
    p.vx *= 0.92; p.vy += p.gravity * delta;
    entrance.parts[alive++] = p;
  }
  entrance.parts.length = alive;
  entrance.done = t >= ENTRANCE.duration;
  return entrance.done;
}

// Posición y escala del jefe: invisible hasta caer por el pilar, impacto firme y luego se planta
export function bossEntranceTransform(entrance) {
  const t = entrance.t;
  if (t < ENTRANCE.dropAt) return { visible: false, dy: -entrance.fallHeight, sx: 1, sy: 1 };
  if (t < ENTRANCE.slamAt) {
    const p = (t - ENTRANCE.dropAt) / (ENTRANCE.slamAt - ENTRANCE.dropAt);
    return { visible: true, dy: -(1 - p * p) * entrance.fallHeight, sx: 0.9, sy: 1.14 };
  }
  const k = t - ENTRANCE.slamAt;
  const impact = Math.exp(-k * 9);
  // Se agranda apenas al pararse (amenaza) y vuelve a su tamaño
  const grow = 1 + 0.08 * Math.exp(-Math.pow(k - 0.35, 2) * 30);
  return { visible: true, dy: 0, sx: (1 + 0.14 * impact) * grow, sy: (1 - 0.16 * impact) * grow };
}

// Capa en coordenadas del mundo: círculo rúnico, pilar de luz, jefe, ondas de choque y partículas
export function drawBossEntranceWorld(ctx, entrance, time) {
  if (entrance.mode === 'rage') return drawRageWorld(ctx, entrance, time);
  const { boss, t } = entrance;
  const footY = boss.y + boss.radius * 0.85;
  const ringR = boss.radius * 1.9;

  if (t >= ENTRANCE.runeAt) {
    const on = Math.min(1, (t - ENTRANCE.runeAt) / 0.35);
    const fade = Math.min(1, (ENTRANCE.duration - t) / 0.6);
    ctx.save();
    ctx.translate(boss.x, footY);
    ctx.scale(1, 0.42);
    ctx.globalAlpha = 0.85 * on * fade;
    ctx.strokeStyle = t < ENTRANCE.slamAt ? '#ff3b4a' : '#ffd34f';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, ringR, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, ringR * 0.72, 0, Math.PI * 2); ctx.stroke();
    // Runas: bloques que giran entre los dos anillos
    const spin = t * 1.8;
    ctx.fillStyle = ctx.strokeStyle;
    for (let i = 0; i < 12; i++) {
      const a = spin + i * Math.PI / 6;
      ctx.save(); ctx.translate(Math.cos(a) * ringR * 0.86, Math.sin(a) * ringR * 0.86); ctx.rotate(a);
      ctx.fillRect(-5, -3, 10, 6); ctx.restore();
    }
    ctx.restore();
  }

  if (t >= ENTRANCE.pillarAt && t < ENTRANCE.slamAt + 0.5) {
    const grow = Math.min(1, (t - ENTRANCE.pillarAt) / 0.3);
    const shrink = t > ENTRANCE.slamAt ? 1 - (t - ENTRANCE.slamAt) / 0.5 : 1;
    const w = boss.radius * 2.4 * grow * shrink;
    const top = entrance.skyY - 400, height = footY - top;
    ctx.save();
    ctx.globalAlpha = 0.18 * shrink; ctx.fillStyle = '#ffd34f';
    ctx.fillRect(boss.x - w / 2, top, w, height);
    ctx.globalAlpha = 0.35 * shrink; ctx.fillStyle = '#ffe9a3';
    ctx.fillRect(boss.x - w * 0.28, top, w * 0.56, height);
    ctx.globalAlpha = 0.7 * shrink; ctx.fillStyle = '#fffbe6';
    ctx.fillRect(boss.x - w * 0.08, top, w * 0.16, height);
    // Destellos que suben por el pilar (pixelados)
    ctx.globalAlpha = 0.8 * shrink; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      const y = footY - ((t * 520 + i * 90) % height);
      ctx.fillRect(Math.round(boss.x + Math.sin(i * 2.3 + t * 5) * w * 0.32) - 2, Math.round(y), 4, 8);
    }
    ctx.restore();
  }

  // Sombra del jefe mientras baja
  if (t >= ENTRANCE.pillarAt) {
    const near = t >= ENTRANCE.slamAt ? 1 : Math.max(0, (t - ENTRANCE.pillarAt) / (ENTRANCE.slamAt - ENTRANCE.pillarAt));
    ctx.save();
    ctx.fillStyle = 'rgba(8, 13, 19, 0.5)';
    ctx.beginPath(); ctx.ellipse(boss.x, footY, boss.radius * (0.4 + near * 0.8), boss.radius * (0.14 + near * 0.26), 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  const { visible, dy, sx, sy } = bossEntranceTransform(entrance);
  if (visible) {
    const baseY = boss.y + boss.radius;
    ctx.save();
    ctx.translate(boss.x, baseY + dy);
    ctx.scale(sx, sy);
    ctx.translate(-boss.x, -baseY);
    boss.draw(ctx, time);
    ctx.restore();
  }

  for (const wave of entrance.waves) {
    ctx.save();
    ctx.translate(boss.x, footY); ctx.scale(1, 0.45);
    ctx.globalAlpha = Math.max(0, Math.min(1, wave.life * 1.6));
    ctx.strokeStyle = wave.color; ctx.lineWidth = wave.width;
    ctx.beginPath(); ctx.arc(0, 0, wave.r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  for (const p of entrance.parts) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function headline(ctx, text, x, y, size, fill, glow) {
  ctx.save();
  ctx.font = `900 ${size}px 'Press Start 2P', monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(4, size * 0.34); ctx.strokeStyle = '#000';
  ctx.strokeText(text, x + 2, y + 3);
  ctx.strokeStyle = glow; ctx.lineWidth = Math.max(3, size * 0.2);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
  ctx.restore();
}

// Capa de pantalla: oscurecido, alarma roja, barras de cine, destello del golpe, cartel y ayuda
export function drawBossEntranceScreen(ctx, entrance, W, H, banner) {
  if (entrance.mode === 'rage') return drawRageScreen(ctx, entrance, W, H);
  const t = entrance.t;
  const fadeOut = Math.max(0, Math.min(1, (ENTRANCE.duration - t) / 0.4));
  const fadeIn = Math.min(1, t / 0.3);
  ctx.save();
  ctx.globalAlpha = 0.4 * fadeIn * fadeOut;
  ctx.fillStyle = '#05080b';
  ctx.fillRect(0, 0, W, H);

  // Alarma: borde rojo que late hasta el golpe
  if (t < ENTRANCE.slamAt + 0.3) {
    const pulse = 0.35 + Math.abs(Math.sin(t * 7)) * 0.65;
    ctx.globalAlpha = pulse * fadeIn;
    ctx.strokeStyle = '#ff2a44'; ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, W - 10, H - 10);
  }

  // Barras de cine
  const bar = Math.round(H * 0.11 * Math.min(1, t / 0.35) * fadeOut);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
  ctx.fillStyle = '#ffd34f';
  if (bar > 2) { ctx.fillRect(0, bar - 2, W, 2); ctx.fillRect(0, H - bar, W, 2); }

  if (t >= 0.15 && t < ENTRANCE.slamAt) {
    const k = Math.min(1, (t - 0.15) / 0.3);
    ctx.globalAlpha = k * (0.7 + Math.abs(Math.sin(t * 9)) * 0.3);
    headline(ctx, '¡ALGO GRANDE SE ACERCA!', W / 2, H * 0.24, Math.min(22, Math.floor(W / 30)), '#ffe066', '#ff2a44');
  }

  if (entrance.flash > 0) {
    ctx.globalAlpha = entrance.flash * 0.75;
    ctx.fillStyle = '#fffbe6';
    ctx.fillRect(0, 0, W, H);
  }

  if (t >= ENTRANCE.bannerAt && banner) {
    const k = Math.min(1, (t - ENTRANCE.bannerAt) / 0.3);
    const ease = 1 - Math.pow(1 - k, 3);
    const scale = Math.min(1, (W - 24) / banner.width) * (1.25 - 0.25 * ease);
    // Entra desde abajo y queda en la parte baja: no tapa al jefe ni queda bajo el HUD
    const y = H + banner.height - (H * 0.3 + banner.height) * ease;
    ctx.globalAlpha = fadeOut;
    ctx.translate(W / 2, y);
    ctx.scale(scale, scale);
    ctx.drawImage(banner, -banner.width / 2, -banner.height / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  if (t >= ENTRANCE.skipAfter) {
    ctx.globalAlpha = 0.75 * fadeOut;
    ctx.font = "bold 10px 'Press Start 2P', monospace";
    ctx.textAlign = 'center'; ctx.fillStyle = '#e2f3ee';
    ctx.fillText('ESPACIO / CLIC PARA SEGUIR', W / 2, H - Math.max(14, bar + 12));
  }
  ctx.restore();
}
