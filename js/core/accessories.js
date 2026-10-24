// ============================================================================
// DOMI 2 PANCHO - SISTEMA DE ACCESORIOS CON SPRITES PNG REALES
// Hoja estándar: accesorios.png (8 accesorios recortados a precisión pixel-perfect)
// Hoja legendaria: accesorios legendarios.png (11 reliquias otorgadas por el Señor Domi)
// ============================================================================

export const standardSheet = typeof Image !== 'undefined' ? new Image() : null;
if (standardSheet) standardSheet.src = './accesorios.png';

export const legendarySheet = typeof Image !== 'undefined' ? new Image() : null;
if (legendarySheet) legendarySheet.src = './accesorios legendarios.png';

export const ACCESSORIES = {
  // --- ACCESORIOS ESTÁNDAR (TIENDA Y ARMARIO - 8 ITEMS REALES DE accesorios.png) ---
  crown: {
    id: 'crown',
    name: 'Corona Real',
    tier: 'standard',
    category: 'Corona',
    layer: 'front',
    cost: 650,
    icon: '♛',
    desc: '+15 Vida Máxima para el rey del mostrador.',
    stats: { hp: '+15', spd: '-', dmg: '-', perk: '+15 Vida Máx' },
    sheet: 'standard',
    sx: 6, sy: 6, sw: 108, sh: 66,
    dw: 40, dh: 24, ox: -19, oy: -42
  },
  shades: {
    id: 'shades',
    name: 'Gafas de Sol Retro',
    tier: 'standard',
    category: 'Lentes',
    layer: 'front',
    cost: 450,
    icon: '◉',
    desc: '+8% Daño. Estilo puro frente a los clientes.',
    stats: { hp: '-', spd: '-', dmg: '+8%', perk: '+8% Daño' },
    sheet: 'standard',
    sx: 162, sy: 6, sw: 108, sh: 42,
    dw: 36, dh: 14, ox: -15, oy: -7
  },
  top_hat: {
    id: 'top_hat',
    name: 'Galera Elegante',
    tier: 'standard',
    category: 'Gorro',
    layer: 'front',
    cost: 700,
    icon: '🎩',
    desc: '+12% Probabilidad de Golpe Crítico de alta etiqueta.',
    stats: { hp: '-', spd: '-', dmg: '+12% Crit', perk: '+12% Crítico' },
    sheet: 'standard',
    sx: 318, sy: 6, sw: 108, sh: 78,
    dw: 42, dh: 30, ox: -20, oy: -46
  },
  headphones: {
    id: 'headphones',
    name: 'Auriculares Gamer',
    tier: 'standard',
    category: 'Casco',
    layer: 'front',
    cost: 600,
    icon: '♫',
    desc: '+8% Velocidad de movimiento al ritmo del sintetizador.',
    stats: { hp: '-', spd: '+8%', dmg: '-', perk: '+8% Velocidad' },
    sheet: 'standard',
    sx: 474, sy: 6, sw: 144, sh: 84,
    dw: 56, dh: 33, ox: -27, oy: -27
  },
  wizard_hat: {
    id: 'wizard_hat',
    name: 'Sombrero de Brujo',
    tier: 'standard',
    category: 'Gorro',
    layer: 'front',
    cost: 750,
    icon: '★',
    desc: '+12% Cadencia de ataque con hechicería culinaria.',
    stats: { hp: '-', spd: '-', dmg: '+12% Cadencia', perk: '+12% Vel Ataque' },
    sheet: 'standard',
    sx: 630, sy: 6, sw: 132, sh: 84,
    dw: 48, dh: 31, ox: -23, oy: -47
  },
  party_hat: {
    id: 'party_hat',
    name: 'Bonete de Fiesta',
    tier: 'standard',
    category: 'Gorro',
    layer: 'front',
    cost: 500,
    icon: '🎉',
    desc: '+6% Velocidad y +6% Daño para festejar cada combo.',
    stats: { hp: '-', spd: '+6%', dmg: '+6%', perk: '+6% Vel / +6% Dmg' },
    sheet: 'standard',
    sx: 786, sy: 6, sw: 114, sh: 78,
    dw: 38, dh: 26, ox: -18, oy: -45
  },
  bowtie: {
    id: 'bowtie',
    name: 'Moño Elegante Azul',
    tier: 'standard',
    category: 'Cuello',
    layer: 'front',
    cost: 400,
    icon: '⋈',
    desc: '+15% Velocidad de proyectiles con distinción gourmet.',
    stats: { hp: '-', spd: '-', dmg: '+15% Vel Proy', perk: '+15% Vel Proy' },
    sheet: 'standard',
    sx: 942, sy: 6, sw: 102, sh: 54,
    dw: 28, dh: 15, ox: -11, oy: 9
  },
  cap: {
    id: 'cap',
    name: 'Gorra Urbana Celeste',
    tier: 'standard',
    category: 'Gorra',
    layer: 'front',
    cost: 550,
    icon: '◆',
    desc: '+10% Velocidad de reparto callejero.',
    stats: { hp: '-', spd: '+10%', dmg: '-', perk: '+10% Velocidad' },
    sheet: 'standard',
    sx: 1098, sy: 6, sw: 126, sh: 66,
    dw: 46, dh: 24, ox: -20, oy: -40
  },

  // --- ACCESORIO ESPECIAL DE MISIÓN INICIAL ---
  chef_hat: {
    id: 'chef_hat',
    name: 'Gorro de Chef',
    tier: 'special',
    category: 'Especial',
    layer: 'front',
    cost: 0,
    icon: '👨‍🍳',
    desc: 'Reliquia del Maestro: +12% Daño y maestría gastronómica.',
    stats: { hp: '-', spd: '-', dmg: '+12%', perk: '+12% Daño Total' },
    sheet: 'procedural',
    dw: 38, dh: 32, ox: -19, oy: -46
  },

  // --- ACCESORIOS LEGENDARIOS (11 RELIQUIAS OTORGADAS POR EL SEÑOR DOMI) ---
  leg_crown: {
    id: 'leg_crown',
    name: 'Corona Imperial',
    tier: 'legendary',
    category: 'LEGENDARIO',
    layer: 'front',
    cost: 0,
    icon: '👑',
    desc: 'Legado de Don Domi: +25 Vida Máxima y +15% Daño total.',
    stats: { hp: '+25', spd: '-', dmg: '+15%', perk: '+25 HP +15% Dmg' },
    sheet: 'legendary',
    sx: 12, sy: 12, sw: 174, sh: 144,
    dw: 42, dh: 35, ox: -20, oy: -50
  },
  leg_halo: {
    id: 'leg_halo',
    name: 'Aureola Celestial',
    tier: 'legendary',
    category: 'LEGENDARIO',
    layer: 'front',
    cost: 0,
    icon: '✧',
    desc: 'Bendición divina de Don Domi: +15% Velocidad y regeneración.',
    stats: { hp: 'REGEN', spd: '+15%', dmg: '-', perk: '+15% Spd +Regen' },
    sheet: 'legendary',
    sx: 612, sy: 12, sw: 204, sh: 84,
    dw: 44, dh: 18, ox: -21, oy: -46
  },
  leg_viking: {
    id: 'leg_viking',
    name: 'Casco Vikingo',
    tier: 'legendary',
    category: 'LEGENDARIO',
    layer: 'front',
    cost: 0,
    icon: '⚔',
    desc: 'Yelmo nórdico del Señor Domi: +20 Vida y +20% Daño brutal.',
    stats: { hp: '+20', spd: '-', dmg: '+20%', perk: '+20 HP +20% Dmg' },
    sheet: 'legendary',
    sx: 1212, sy: 12, sw: 228, sh: 144,
    dw: 52, dh: 33, ox: -25, oy: -44
  },
  leg_horns: {
    id: 'leg_horns',
    name: 'Cuernos Demoníacos',
    tier: 'legendary',
    category: 'LEGENDARIO',
    layer: 'front',
    cost: 0,
    icon: '😈',
    desc: 'Furia del horno infernal: +28% Daño destructivo.',
    stats: { hp: '-', spd: '+8%', dmg: '+28%', perk: '+28% Daño Puro' },
    sheet: 'legendary',
    sx: 1812, sy: 12, sw: 216, sh: 156,
    dw: 48, dh: 35, ox: -23, oy: -48
  },
  leg_visor: {
    id: 'leg_visor',
    name: 'Visor Cibernético',
    tier: 'legendary',
    category: 'LEGENDARIO',
    layer: 'front',
    cost: 0,
    icon: '⌖',
    desc: 'Óptica láser esmeralda: +20% Crítico y súper imán de botín.',
    stats: { hp: '-', spd: '-', dmg: '+20% Crit', perk: '+20% Crit +Imán' },
    sheet: 'legendary',
    sx: 12, sy: 324, sw: 192, sh: 72,
    dw: 38, dh: 14, ox: -16, oy: -7
  },
  leg_archmage: {
    id: 'leg_archmage',
    name: 'Sombrero de Arquimago',
    tier: 'legendary',
    category: 'LEGENDARIO',
    layer: 'front',
    cost: 0,
    icon: '🌀',
    desc: 'Poder arcano estelar: +22% Daño y +15% Cadencia de tiro.',
    stats: { hp: '-', spd: '-', dmg: '+22%', perk: '+22% Dmg +Cadencia' },
    sheet: 'legendary',
    sx: 612, sy: 324, sw: 216, sh: 240,
    dw: 48, dh: 53, ox: -23, oy: -66
  },
  leg_cape: {
    id: 'leg_cape',
    name: 'Manto Real Carmesí',
    tier: 'legendary',
    category: 'LEGENDARIO',
    layer: 'back',
    cost: 0,
    icon: '⚜',
    desc: 'Capa de terciopelo y armiño: +30 Vida y +12% Daño.',
    stats: { hp: '+30', spd: '-', dmg: '+12%', perk: '+30 HP +12% Dmg' },
    sheet: 'legendary',
    sx: 1212, sy: 324, sw: 240, sh: 240,
    dw: 62, dh: 62, ox: -31, oy: -22
  },
  leg_angel_wings: {
    id: 'leg_angel_wings',
    name: 'Alas de Ángel',
    tier: 'legendary',
    category: 'LEGENDARIO',
    layer: 'back',
    cost: 0,
    icon: '🪶',
    desc: 'Plumas celestiales: +22% Velocidad y recarga de acelerón reducida.',
    stats: { hp: '-', spd: '+22%', dmg: '-', perk: '+22% Spd -Recarga' },
    sheet: 'legendary',
    sx: 1812, sy: 324, sw: 576, sh: 210,
    dw: 112, dh: 41, ox: -56, oy: -20
  },
  leg_fire_wings: {
    id: 'leg_fire_wings',
    name: 'Alas de Fénix Ígneo',
    tier: 'legendary',
    category: 'LEGENDARIO',
    layer: 'back',
    cost: 0,
    icon: '🔥',
    desc: 'Envergadura de llamas solares: +25% Daño y +12% Velocidad.',
    stats: { hp: '-', spd: '+12%', dmg: '+25%', perk: '+25% Dmg +12% Spd' },
    sheet: 'legendary',
    sx: 12, sy: 636, sw: 576, sh: 210,
    dw: 112, dh: 41, ox: -56, oy: -20
  },
  leg_excalibur: {
    id: 'leg_excalibur',
    name: 'Espada Dorada Excalibur',
    tier: 'legendary',
    category: 'LEGENDARIO',
    layer: 'front',
    cost: 0,
    icon: '🗡',
    desc: 'Hoja sagrada de Don Domi: +1 Proyectil Extra y +18% Daño.',
    stats: { hp: '-', spd: '-', dmg: '+18% +1Proy', perk: '+1 Proyectil Extra' },
    sheet: 'legendary',
    sx: 612, sy: 636, sw: 96, sh: 288,
    dw: 16, dh: 48, ox: -34, oy: -24
  },
  leg_medallion: {
    id: 'leg_medallion',
    name: 'Medallón Rubí Sagrado',
    tier: 'legendary',
    category: 'LEGENDARIO',
    layer: 'front',
    cost: 0,
    icon: '🎖',
    desc: 'Insignia real con rubí encantado: +40 Vida Máxima y blindaje.',
    stats: { hp: '+40', spd: '-', dmg: '-', perk: '+40 Vida +Defensa' },
    sheet: 'legendary',
    sx: 1212, sy: 636, sw: 114, sh: 144,
    dw: 22, dh: 28, ox: -8, oy: 2
  }
};

// Compatibilidad de alias por si algún perfil guardado tenía los IDs anteriores
const LEGACY_ALIASES = {
  cyber_shades: 'shades',
  headband: 'cap',
  red_bandana: 'party_hat',
  neon_cap: 'cap',
  magic_hat: 'wizard_hat',
  void_hood: 'top_hat',
  cyber_helmet: 'headphones',
  blue_visor: 'bowtie',
  energy_halo: 'crown',
  leg_tiara: 'leg_halo',
  leg_valkyrie: 'leg_viking',
  leg_void_crown: 'leg_archmage',
  leg_crimson_cape: 'leg_cape',
  leg_dragon_wings: 'leg_fire_wings',
  leg_golden_staff: 'leg_excalibur',
  leg_golden_chalice: 'leg_medallion'
};

export function resolveAccessory(id) {
  if (!id || id === 'none') return null;
  const resolvedId = LEGACY_ALIASES[id] || id;
  return ACCESSORIES[resolvedId] || null;
}

function drawProceduralChefHat(ctx, ox, oy, dw, dh) {
  ctx.save();
  ctx.translate(ox + dw / 2, oy + dh);
  // Base del gorro de chef
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(-13, -8, 26, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-12, -8, 24, 5);
  // Cinta dorada
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-13, -3, 26, 2);
  // Copa abullonada
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-16, -20, 32, 12);
  ctx.fillRect(-12, -25, 24, 6);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-8, -18, 2, 8);
  ctx.fillRect(0, -19, 2, 9);
  ctx.fillRect(7, -18, 2, 8);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-13, -8, 26, 7);
  ctx.strokeRect(-16, -20, 32, 12);
  ctx.restore();
}

/**
 * Dibuja un accesorio montado sobre Don Pancho o en vitrina.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} id ID del accesorio
 * @param {number} x Coordenada X central del personaje
 * @param {number} y Coordenada Y central del personaje
 * @param {number} scale Factor de escala (0.85 en gameplay, 0.9 en lobby, scale en vitrina)
 * @param {string|null} layerFilter Si se especifica ('back' o 'front'), solo dibuja si coincide con la capa del accesorio
 */
export function drawAccessory(ctx, id, x, y, scale = 1, layerFilter = null) {
  const acc = resolveAccessory(id);
  if (!acc) return;
  const accLayer = acc.layer || 'front';
  if (layerFilter && accLayer !== layerFilter) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (acc.sheet === 'procedural') {
    drawProceduralChefHat(ctx, acc.ox, acc.oy, acc.dw, acc.dh);
    ctx.restore();
    return;
  }

  const sheet = acc.sheet === 'legendary' ? legendarySheet : standardSheet;

  if (sheet && sheet.complete && sheet.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sheet,
      acc.sx, acc.sy, acc.sw, acc.sh,
      acc.ox, acc.oy, acc.dw, acc.dh
    );
  } else {
    // Fallback de contingencia mientras carga la textura
    ctx.fillStyle = acc.tier === 'legendary' ? '#fbbf24' : '#38bdf8';
    ctx.fillRect(acc.ox, acc.oy, acc.dw, Math.min(14, acc.dh));
  }

  ctx.restore();
}

/**
 * Dibuja el accesorio de forma aislada (centrado en su caja) para iconos o tarjetas de colección.
 */
export function drawAccessoryIcon(ctx, id, cx, cy, boxSize = 48) {
  const acc = resolveAccessory(id);
  if (!acc) return;

  if (acc.sheet === 'procedural') {
    const s = boxSize / 48;
    ctx.save();
    ctx.translate(cx, cy + 12 * s);
    ctx.scale(s, s);
    drawProceduralChefHat(ctx, -19, -28, 38, 32);
    ctx.restore();
    return;
  }

  const sheet = acc.sheet === 'legendary' ? legendarySheet : standardSheet;
  if (!sheet || !sheet.complete || sheet.naturalWidth <= 0) return;

  const fitScale = Math.min((boxSize * 0.82) / acc.sw, (boxSize * 0.82) / acc.sh);
  const targetW = acc.sw * fitScale;
  const targetH = acc.sh * fitScale;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sheet,
    acc.sx, acc.sy, acc.sw, acc.sh,
    cx - targetW / 2, cy - targetH / 2, targetW, targetH
  );
  ctx.restore();
}
