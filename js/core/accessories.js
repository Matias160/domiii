// ============================================================================
// DOMI 2 PANCHO - SISTEMA DE ACCESORIOS CON SPRITES PNG REALES
// Hoja estándar: accesorios.png (13 casillas de 96x96)
// Hoja legendaria: accesorios legendarios.png (otorgados por el Señor Domi)
// ============================================================================

export const standardSheet = typeof Image !== 'undefined' ? new Image() : null;
if (standardSheet) standardSheet.src = './accesorios.png';

export const legendarySheet = typeof Image !== 'undefined' ? new Image() : null;
if (legendarySheet) legendarySheet.src = './accesorios legendarios.png';

export const ACCESSORIES = {
  // --- ACCESORIOS ESTÁNDAR (TIENDA Y ARMARIO) ---
  crown: {
    id: 'crown',
    name: 'Corona Real',
    tier: 'standard',
    category: 'Corona',
    cost: 650,
    icon: '♛',
    desc: '+15 Vida Máxima para el rey del local.',
    stats: { hp: '+15', spd: '-', dmg: '-', perk: '+15 Vida Máx' },
    sheet: 'standard',
    sx: 6, sy: 6, sw: 90, sh: 66,
    dw: 40, dh: 29, ox: -20, oy: -45
  },
  shades: {
    id: 'shades',
    name: 'Gafas Oscuras',
    tier: 'standard',
    category: 'Lentes',
    cost: 450,
    icon: '◉',
    desc: '+6% Daño. Estilo puro ante los clientes.',
    stats: { hp: '-', spd: '-', dmg: '+6%', perk: '+6% Daño' },
    sheet: 'standard',
    sx: 96, sy: 6, sw: 96, sh: 66,
    dw: 40, dh: 28, ox: -20, oy: -18
  },
  cyber_shades: {
    id: 'cyber_shades',
    name: 'Lentes Cyberpunk',
    tier: 'standard',
    category: 'Lentes',
    cost: 500,
    icon: '▧',
    desc: '+8% Daño con reflejos cian cibernéticos.',
    stats: { hp: '-', spd: '-', dmg: '+8%', perk: '+8% Daño' },
    sheet: 'standard',
    sx: 192, sy: 6, sw: 78, sh: 42,
    dw: 36, dh: 20, ox: -18, oy: -16
  },
  headband: {
    id: 'headband',
    name: 'Vincha Turbo',
    tier: 'standard',
    category: 'Vincha',
    cost: 350,
    icon: '▰',
    desc: '+7% Velocidad de movimiento en combate.',
    stats: { hp: '-', spd: '+7%', dmg: '-', perk: '+7% Velocidad' },
    sheet: 'standard',
    sx: 318, sy: 6, sw: 66, sh: 78,
    dw: 34, dh: 38, ox: -17, oy: -26
  },
  red_bandana: {
    id: 'red_bandana',
    name: 'Bandana Ninja',
    tier: 'standard',
    category: 'Vincha',
    cost: 550,
    icon: '▲',
    desc: '+8% Velocidad y reflejos ninjas del mostrador.',
    stats: { hp: '-', spd: '+8%', dmg: '-', perk: '+8% Velocidad' },
    sheet: 'standard',
    sx: 384, sy: 6, sw: 96, sh: 84,
    dw: 40, dh: 35, ox: -20, oy: -28
  },
  neon_cap: {
    id: 'neon_cap',
    name: 'Gorra Neón',
    tier: 'standard',
    category: 'Gorra',
    cost: 600,
    icon: '◆',
    desc: '+5% Velocidad y +5% Daño general.',
    stats: { hp: '-', spd: '+5%', dmg: '+5%', perk: 'Balance Veloz' },
    sheet: 'standard',
    sx: 480, sy: 6, sw: 96, sh: 84,
    dw: 42, dh: 36, ox: -21, oy: -44
  },
  magic_hat: {
    id: 'magic_hat',
    name: 'Sombrero Arcano',
    tier: 'standard',
    category: 'Gorro',
    cost: 750,
    icon: '★',
    desc: '+10% Cadencia de ataque. Magia culinaria.',
    stats: { hp: '-', spd: '-', dmg: '+10% Vel Atq', perk: '+10% Cadencia' },
    sheet: 'standard',
    sx: 576, sy: 6, sw: 96, sh: 84,
    dw: 44, dh: 38, ox: -22, oy: -48
  },
  void_hood: {
    id: 'void_hood',
    name: 'Capucha Sombría',
    tier: 'standard',
    category: 'Capucha',
    cost: 800,
    icon: '♠',
    desc: '+12% Probabilidad de Golpe Crítico.',
    stats: { hp: '-', spd: '-', dmg: '+12% Crit', perk: '+12% Crítico' },
    sheet: 'standard',
    sx: 672, sy: 6, sw: 90, sh: 84,
    dw: 42, dh: 38, ox: -21, oy: -40
  },
  cyber_helmet: {
    id: 'cyber_helmet',
    name: 'Casco Arcade',
    tier: 'standard',
    category: 'Casco',
    cost: 850,
    icon: '⛨',
    desc: '+15 Vida Máxima y blindaje de titanio.',
    stats: { hp: '+15', spd: '-', dmg: '-', perk: '+15 HP +Armadura' },
    sheet: 'standard',
    sx: 786, sy: 6, sw: 78, sh: 78,
    dw: 38, dh: 38, ox: -19, oy: -36
  },
  blue_visor: {
    id: 'blue_visor',
    name: 'Visor Táctico',
    tier: 'standard',
    category: 'Visor',
    cost: 700,
    icon: '◎',
    desc: '+15% Velocidad de Proyectiles disparados.',
    stats: { hp: '-', spd: '-', dmg: '+Vel Proy', perk: '+15% Vel Proy' },
    sheet: 'standard',
    sx: 864, sy: 6, sw: 96, sh: 78,
    dw: 40, dh: 32, ox: -20, oy: -18
  },
  headphones: {
    id: 'headphones',
    name: 'Auriculares Gamer',
    tier: 'standard',
    category: 'Casco',
    cost: 600,
    icon: '♫',
    desc: '+6% Velocidad al ritmo de la música arcade.',
    stats: { hp: '-', spd: '+6%', dmg: '-', perk: '+6% Velocidad' },
    sheet: 'standard',
    sx: 960, sy: 6, sw: 84, sh: 54,
    dw: 40, dh: 26, ox: -20, oy: -26
  },
  chef_hat: {
    id: 'chef_hat',
    name: 'Gorro de Chef',
    tier: 'special',
    category: 'Gorro',
    cost: 0,
    icon: '★',
    desc: 'Exclusivo Don Domi: +12% Daño y maestría gastronómica.',
    stats: { hp: '-', spd: '-', dmg: '+12%', perk: '+12% Daño' },
    sheet: 'standard',
    sx: 1098, sy: 6, sw: 54, sh: 60,
    dw: 34, dh: 38, ox: -17, oy: -48
  },
  energy_halo: {
    id: 'energy_halo',
    name: 'Halo de Energía',
    tier: 'standard',
    category: 'Halo',
    cost: 900,
    icon: '☼',
    desc: '+12 Vida Máxima y +6% Daño radiante.',
    stats: { hp: '+12', spd: '-', dmg: '+6%', perk: '+12 HP +6% Dmg' },
    sheet: 'standard',
    sx: 1152, sy: 6, sw: 72, sh: 66,
    dw: 36, dh: 33, ox: -18, oy: -52
  },

  // --- ACCESORIOS LEGENDARIOS (OTORGADOS EXCLUSIVAMENTE POR SEÑOR DOMI) ---
  leg_crown: {
    id: 'leg_crown',
    name: 'Corona Imperial',
    tier: 'legendary',
    category: 'LEGENDARIO',
    cost: 0,
    icon: '👑',
    desc: 'Legado de Don Domi: +25 Vida Máxima y +15% Daño total.',
    stats: { hp: '+25', spd: '-', dmg: '+15%', perk: '+25 HP +15% Dmg' },
    sheet: 'legendary',
    sx: 12, sy: 12, sw: 173, sh: 141,
    dw: 48, dh: 39, ox: -24, oy: -48
  },
  leg_tiara: {
    id: 'leg_tiara',
    name: 'Diadema Sagrada',
    tier: 'legendary',
    category: 'LEGENDARIO',
    cost: 0,
    icon: '✧',
    desc: 'Bendición de Don Domi: +15% Velocidad y regeneración pasiva.',
    stats: { hp: 'REGEN', spd: '+15%', dmg: '-', perk: '+15% Spd +Regen' },
    sheet: 'legendary',
    sx: 612, sy: 12, sw: 201, sh: 81,
    dw: 46, dh: 20, ox: -23, oy: -26
  },
  leg_valkyrie: {
    id: 'leg_valkyrie',
    name: 'Yelmo de Valquiria',
    tier: 'legendary',
    category: 'LEGENDARIO',
    cost: 0,
    icon: '⚔',
    desc: 'Armadura celestial del Señor Domi: +20% Daño brutal.',
    stats: { hp: '+15', spd: '-', dmg: '+20%', perk: '+20% Daño Total' },
    sheet: 'legendary',
    sx: 1212, sy: 12, sw: 225, sh: 141,
    dw: 52, dh: 32, ox: -26, oy: -42
  },
  leg_visor: {
    id: 'leg_visor',
    name: 'Visor Cuántico',
    tier: 'legendary',
    category: 'LEGENDARIO',
    cost: 0,
    icon: '⌖',
    desc: 'Óptica dimensional de Domi: +20% Crítico y gran imán de ingredientes.',
    stats: { hp: '-', spd: '-', dmg: '+20% Crit', perk: '+20% Crit +Imán' },
    sheet: 'legendary',
    sx: 12, sy: 324, sw: 189, sh: 69,
    dw: 44, dh: 18, ox: -22, oy: -15
  },
  leg_void_crown: {
    id: 'leg_void_crown',
    name: 'Corona del Vacío',
    tier: 'legendary',
    category: 'LEGENDARIO',
    cost: 0,
    icon: '🌀',
    desc: 'Poder arcano absoluto: +22% Daño y pulso de energía pura.',
    stats: { hp: '-', spd: '-', dmg: '+22%', perk: '+22% Daño Arcano' },
    sheet: 'legendary',
    sx: 612, sy: 324, sw: 213, sh: 237,
    dw: 48, dh: 52, ox: -24, oy: -56
  },
  leg_crimson_cape: {
    id: 'leg_crimson_cape',
    name: 'Manto Carmesí',
    tier: 'legendary',
    category: 'LEGENDARIO',
    cost: 0,
    icon: '⚜',
    desc: 'Manto de honor de Don Domi: +25 Vida y +10% Daño.',
    stats: { hp: '+25', spd: '-', dmg: '+10%', perk: '+25 HP +10% Dmg' },
    sheet: 'legendary',
    sx: 1212, sy: 324, sw: 237, sh: 237,
    dw: 56, dh: 56, ox: -28, oy: -18
  },
  leg_angel_wings: {
    id: 'leg_angel_wings',
    name: 'Alas Celestiales',
    tier: 'legendary',
    category: 'LEGENDARIO',
    cost: 0,
    icon: '🪶',
    desc: 'Alas sagradas del Señor Domi: +22% Velocidad y acelerón rápido.',
    stats: { hp: '-', spd: '+22%', dmg: '-', perk: '+22% Spd -Recarga' },
    sheet: 'legendary',
    sx: 1812, sy: 324, sw: 249, sh: 209,
    dw: 68, dh: 56, ox: -34, oy: -22
  },
  leg_dragon_wings: {
    id: 'leg_dragon_wings',
    name: 'Alas Dracónicas',
    tier: 'legendary',
    category: 'LEGENDARIO',
    cost: 0,
    icon: '🔥',
    desc: 'Alas de fuego del horno supremo: +25% Daño ígneo destructivo.',
    stats: { hp: '-', spd: '+10%', dmg: '+25%', perk: '+25% Daño Fuego' },
    sheet: 'legendary',
    sx: 12, sy: 636, sw: 249, sh: 209,
    dw: 68, dh: 56, ox: -34, oy: -22
  },
  leg_golden_staff: {
    id: 'leg_golden_staff',
    name: 'Cetro de Oro',
    tier: 'legendary',
    category: 'LEGENDARIO',
    cost: 0,
    icon: '🔱',
    desc: 'Cetro de mando supremo: +1 Proyectil Extra permanente y +15% Daño.',
    stats: { hp: '-', spd: '-', dmg: '+15% +1Proy', perk: '+1 Proyectil' },
    sheet: 'legendary',
    sx: 612, sy: 636, sw: 93, sh: 285,
    dw: 26, dh: 65, ox: 16, oy: -28
  },
  leg_golden_chalice: {
    id: 'leg_golden_chalice',
    name: 'Cáliz Sagrado',
    tier: 'legendary',
    category: 'LEGENDARIO',
    cost: 0,
    icon: '🏆',
    desc: 'El Santo Grial culinario de Don Domi: +35 Vida Máxima.',
    stats: { hp: '+35', spd: '-', dmg: '-', perk: '+35 Vida Máx' },
    sheet: 'legendary',
    sx: 1212, sy: 636, sw: 113, sh: 141,
    dw: 28, dh: 35, ox: -32, oy: -10
  }
};

/**
 * Dibuja un accesorio montado sobre Don Pancho o en vitrina.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} id ID del accesorio
 * @param {number} x Coordenada X central
 * @param {number} y Coordenada Y central
 * @param {number} scale Factor de escala (1 para gameplay / lobby)
 */
export function drawAccessory(ctx, id, x, y, scale = 1) {
  if (!id || id === 'none') return;
  const acc = ACCESSORIES[id];
  if (!acc) return;

  const sheet = acc.sheet === 'legendary' ? legendarySheet : standardSheet;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (sheet && sheet.complete && sheet.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sheet,
      acc.sx, acc.sy, acc.sw, acc.sh,
      acc.ox, acc.oy, acc.dw, acc.dh
    );
  } else {
    // Fallback de contingencia mientras carga la textura
    if (id === 'headband') { ctx.fillStyle = '#ef4444'; ctx.fillRect(-20, -26, 40, 5); }
    else if (id === 'shades') { ctx.fillStyle = '#0f172a'; ctx.fillRect(-18, -14, 36, 8); }
    else if (id === 'crown') { ctx.fillStyle = '#fbbf24'; ctx.fillRect(-18, -40, 36, 16); }
    else if (id === 'chef_hat') { ctx.fillStyle = '#ffffff'; ctx.fillRect(-16, -46, 32, 22); }
    else { ctx.fillStyle = '#38bdf8'; ctx.fillRect(-16, -30, 32, 10); }
  }

  ctx.restore();
}

/**
 * Dibuja el accesorio de forma aislada (centrado en su caja) para iconos o tarjetas.
 */
export function drawAccessoryIcon(ctx, id, cx, cy, boxSize = 48) {
  if (!id || id === 'none') return;
  const acc = ACCESSORIES[id];
  if (!acc) return;

  const sheet = acc.sheet === 'legendary' ? legendarySheet : standardSheet;
  if (!sheet || !sheet.complete || sheet.naturalWidth <= 0) return;

  const fitScale = Math.min((boxSize * 0.85) / acc.dw, (boxSize * 0.85) / acc.dh);
  const targetW = acc.dw * fitScale;
  const targetH = acc.dh * fitScale;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sheet,
    acc.sx, acc.sy, acc.sw, acc.sh,
    cx - targetW / 2, cy - targetH / 2, targetW, targetH
  );
  ctx.restore();
}
