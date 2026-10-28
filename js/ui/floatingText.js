// ============================================================================
// DOMI 2: PANCHO - FLOATING COMBAT TEXT & COMBO INDICATORS
// Renderizado procedural con degradados verticales, halo neón y extrusión 3D.
// Cada texto se dibuja UNA vez en un sprite cacheado (degradado, halo, contorno,
// placa y destello) y en cada cuadro solo se anima: salto, pop, giro y fundido.
// ============================================================================

// Tamaño al que se pre-dibuja el sprite respecto de la escala base: cerca del pico del "pop"
// para que al animar casi siempre se reduzca (se ve nítido) en vez de agrandarse.
const RENDER_BOOST = 1.75;
const SPRITE_CACHE_LIMIT = 220;
const spriteCache = new Map();
// Si un sprite se cacheó antes de que cargue la fuente pixel, se descarta al quedar lista
if (typeof document !== 'undefined' && document.fonts?.load) {
  document.fonts.load("12px 'Press Start 2P'").then(() => spriteCache.clear(), () => {});
}

function detectKind(text) {
  if (text.kind) return text.kind;
  if (/COMBO|RACHA|FIEBRE/i.test(text.text)) return 'combo';
  if (/[✦★]/.test(text.text) || /EXTERMINIO|BOMBAZO/i.test(text.text)) return 'crit';
  if (/HP|CURA/i.test(text.text)) return 'heal';
  if (/^\+/.test(text.text)) return 'gain';
  if (/CHOQUE|ESCUDO/i.test(text.text)) return 'dash';
  return 'normal';
}

function comboValueOf(text, kind) {
  if (text.comboVal != null || kind !== 'combo') return text.comboVal;
  const match = text.text.match(/\b(\d+)\b/);
  return match ? parseInt(match[1], 10) : undefined;
}

// Paletas de degradados con colores intensos y halo neón
function paletteFor(kind, comboVal, label) {
  if (kind === 'crit') return { stops: [[0.0, '#ffffff'], [0.18, '#fff644'], [0.55, '#ff3b00'], [1.0, '#b80028']], halo: '#ff2b00', blur: 14, outline: '#120004' };
  if (kind === 'combo') {
    if (comboVal >= 30 || /FIEBRE/i.test(label)) return { stops: [[0.0, '#ffffff'], [0.2, '#ff3df1'], [0.58, '#9400d3'], [1.0, '#ffd700']], halo: '#ff00aa', blur: 18, outline: '#100014' };
    if (comboVal >= 20 || /CADENCIA/i.test(label)) return { stops: [[0.0, '#ffffff'], [0.22, '#fff04d'], [0.6, '#ff6600'], [1.0, '#d60036']], halo: '#ff5500', blur: 16, outline: '#140400' };
    return { stops: [[0.0, '#ffffff'], [0.22, '#00ffff'], [0.6, '#00e676'], [1.0, '#0066ff']], halo: '#00f2ff', blur: 14, outline: '#001018' };
  }
  if (kind === 'fire') return { stops: [[0.0, '#ffffcc'], [0.22, '#ffaa00'], [0.65, '#ff3300'], [1.0, '#800000']], halo: '#ff4d00', blur: 10, outline: '#190300' };
  if (kind === 'ice') return { stops: [[0.0, '#ffffff'], [0.22, '#a5f3fc'], [0.65, '#38bdf8'], [1.0, '#0284c7']], halo: '#00e5ff', blur: 10, outline: '#011524' };
  if (kind === 'poison') return { stops: [[0.0, '#ffffff'], [0.22, '#bbf7d0'], [0.65, '#22c55e'], [1.0, '#14532d']], halo: '#22c55e', blur: 10, outline: '#021808' };
  if (kind === 'heal') return { stops: [[0.0, '#ffffff'], [0.22, '#6ee7b7'], [0.65, '#10b981'], [1.0, '#047857']], halo: '#10b981', blur: 12, outline: '#011c10' };
  if (kind === 'gain') return { stops: [[0.0, '#ffffff'], [0.22, '#fde047'], [0.65, '#eab308'], [1.0, '#92400e']], halo: '#eab308', blur: 9, outline: '#1a0e00' };
  if (kind === 'dash') return { stops: [[0.0, '#ffffff'], [0.22, '#99f6e4'], [0.65, '#14b8a6'], [1.0, '#0f766e']], halo: '#14b8a6', blur: 10, outline: '#011917' };
  // Daño normal con degradado ámbar/oro intenso
  return { stops: [[0.0, '#ffffff'], [0.22, '#ffeea6'], [0.62, '#f59e0b'], [1.0, '#c2410c']], halo: '#f59e0b', blur: 7, outline: '#140b02' };
}

function baseScaleOf(kind, comboVal, text) {
  if (kind === 'crit') return 1.7;
  if (kind === 'combo') return comboVal >= 30 ? 1.45 : comboVal >= 20 ? 1.35 : 1.25;
  return text.scale || 1;
}

function buildSprite(label, kind, comboVal, fontSize, reducedMotion) {
  const palette = paletteFor(kind, comboVal, label);
  const outlineWidth = Math.max(3, Math.round(fontSize * 0.26));
  const extrusionY = Math.max(2, Math.round(fontSize * 0.16));
  const font = `bold ${fontSize}px 'Press Start 2P', monospace`;
  const blur = reducedMotion ? 0 : palette.blur;

  const measure = document.createElement('canvas').getContext('2d');
  measure.font = font;
  const textWidth = Math.ceil(measure.measureText(label).width);
  const isCombo = kind === 'combo';
  const badgeW = textWidth + 16, badgeH = fontSize + 10;
  const pad = outlineWidth + Math.max(blur, isCombo ? 8 : 0) + 4;
  const width = Math.ceil((isCombo ? badgeW : textWidth) + pad * 2 + 2);
  const height = Math.ceil(Math.max(fontSize * 1.2, isCombo ? badgeH : 0) + extrusionY + pad * 2);

  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.translate(width / 2, height / 2 - extrusionY / 2);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  const grad = ctx.createLinearGradient(0, -fontSize * 0.55, 0, fontSize * 0.5);
  for (const [offset, color] of palette.stops) grad.addColorStop(offset, color);

  // Placa / Badge retro para avisos de COMBO importantes
  if (isCombo) {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 14, 18, 0.84)';
    ctx.strokeStyle = palette.halo;
    ctx.lineWidth = 2;
    ctx.shadowColor = palette.halo;
    ctx.shadowBlur = reducedMotion ? 0 : 8;
    ctx.fillRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH);
    ctx.strokeRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH);
    ctx.shadowBlur = 0;
    // Muescas angulares estilo arcade en esquinas
    ctx.fillStyle = palette.halo;
    ctx.fillRect(-badgeW / 2 - 1, -badgeH / 2 - 1, 3, 3);
    ctx.fillRect(badgeW / 2 - 2, -badgeH / 2 - 1, 3, 3);
    ctx.fillRect(-badgeW / 2 - 1, badgeH / 2 - 2, 3, 3);
    ctx.fillRect(badgeW / 2 - 2, badgeH / 2 - 2, 3, 3);
    ctx.restore();
  }

  // 1. Sombra 3D pixel art extrusion (desplazada abajo para profundidad táctil)
  ctx.lineWidth = outlineWidth;
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.strokeText(label, 1, extrusionY);
  ctx.fillText(label, 1, extrusionY);

  // 2. Trazo exterior oscuro nítido
  ctx.strokeStyle = palette.outline;
  ctx.strokeText(label, 0, 0);

  // 3. Relleno con degradado vertical intenso y halo neón
  ctx.shadowColor = palette.halo;
  ctx.shadowBlur = blur;
  ctx.fillStyle = grad;
  ctx.fillText(label, 0, 0);
  ctx.shadowBlur = 0;

  // 4. Segundo destello translúcido en la mitad superior para críticos y combos
  if (!reducedMotion && (kind === 'crit' || isCombo)) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.save();
    ctx.beginPath();
    ctx.rect(-width, -fontSize * 0.65, width * 2, fontSize * 0.45);
    ctx.clip();
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
  return canvas;
}

function spriteFor(label, kind, comboVal, fontSize, reducedMotion) {
  const key = `${kind}|${comboVal ?? ''}|${fontSize}|${reducedMotion ? 1 : 0}|${label}`;
  let sprite = spriteCache.get(key);
  if (sprite) {
    // Refresca su posición LRU
    spriteCache.delete(key); spriteCache.set(key, sprite);
    return sprite;
  }
  sprite = buildSprite(label, kind, comboVal, fontSize, reducedMotion);
  spriteCache.set(key, sprite);
  if (spriteCache.size > SPRITE_CACHE_LIMIT) spriteCache.delete(spriteCache.keys().next().value);
  return sprite;
}

// Pre-dibuja textos frecuentes (p. ej. al iniciar la partida) para evitar tirones la primera vez
export function warmFloatingText(samples, reducedMotion = false) {
  for (const sample of samples) {
    const kind = detectKind(sample);
    const comboVal = comboValueOf(sample, kind);
    const fontSize = Math.max(9, Math.round(12 * baseScaleOf(kind, comboVal, sample) * RENDER_BOOST));
    spriteFor(sample.text, kind, comboVal, fontSize, reducedMotion);
  }
}

export function drawFloatingText(ctx, text, reducedMotion = false) {
  text.maxLife ??= text.life;
  text.originY ??= text.y;
  text.tilt ??= (Math.random() - 0.5) * (Math.PI / 8);

  const progress = Math.max(0, Math.min(1, 1 - text.life / text.maxLife));
  const kind = detectKind(text);
  const comboVal = comboValueOf(text, kind);
  const baseScale = baseScaleOf(kind, comboVal, text);

  // Escala dinámica con salto/pop explosivo al inicio
  const popFactor = reducedMotion
    ? 1
    : (progress < 0.22 ? 1 + Math.sin((progress / 0.22) * Math.PI) * 0.35 : 1);
  const decayScale = reducedMotion ? 1 : (1.35 - progress * 0.55);
  const finalScale = baseScale * popFactor * decayScale;

  // Física de salto parabólico (arc jump) y temblor
  const jumpHeight = kind === 'combo' ? 24 : kind === 'crit' ? 20 : 13;
  const jumpY = reducedMotion ? 0 : Math.sin(progress * Math.PI) * jumpHeight;
  const shake = (kind === 'crit' || (kind === 'combo' && comboVal >= 20)) && !reducedMotion && progress < 0.35
    ? (Math.random() * 3 - 1.5)
    : 0;
  const driftX = Math.sin(text.tilt) * progress * (kind === 'combo' ? 14 : 28);

  const renderScale = baseScale * RENDER_BOOST;
  const fontSize = Math.max(9, Math.round(12 * renderScale));
  const sprite = spriteFor(text.text, kind, comboVal, fontSize, reducedMotion);
  const drawScale = finalScale / renderScale;

  ctx.save();
  ctx.translate(text.x + driftX + shake, text.y - jumpY);
  if (!reducedMotion) ctx.rotate(text.tilt * (1 - progress) * 0.6);
  // Desvanecimiento suave al final de la vida
  ctx.globalAlpha = Math.max(0, Math.min(1, (1 - progress) * 2.2));
  ctx.imageSmoothingEnabled = true;
  const w = sprite.width * drawScale, h = sprite.height * drawScale;
  ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
  ctx.restore();
}
