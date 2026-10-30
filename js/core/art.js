import { createAnimatedGif } from './animatedGif.js';
export const domiGifImage = createAnimatedGif('./don domi.gif');
const INK = '#161c20';
const sprites = new Map();
const floors = new Map();
// Guarda el sprite y, cuando el navegador lo permite, lo reemplaza por un ImageBitmap:
// queda listo en la placa de video y dibujar cientos por cuadro (enemigos, destellos de golpe) es mucho más barato
function cacheSprite(map, key, canvas) {
  map.set(key, canvas);
  if (typeof createImageBitmap === 'function') {
    createImageBitmap(canvas).then(bitmap => { if (map.get(key) === canvas) map.set(key, bitmap); }, () => {});
  }
  return canvas;
}
// Guiño a BurgosCorp: el escudo "BC" en miniatura pixel art (negro, borde rojo, letras blancas),
// igual de forma que el isologo del proyecto RN3. Se usa chiquito y en lugares discretos.
const BC_SHIELD = [
  '..rrrrrrrrr..',
  '.rkkkkkkkkkr.',
  'rkkkkkkkkkkkr',
  'rkwwkkkwwwkkr',
  'rkwkwkkwkkkkr',
  'rkwwkkkwkkkkr',
  'rkwkwkkwkkkkr',
  'rkwwkkkwwwkkr',
  'rkkkkkkkkkkkr',
  '.rkkkkkkkkkr.',
  '..rkkkkkkkr..',
  '...rkkkkkr...',
  '....rrrrr....',
];
const BC_COLORS = { r: '#e11d2e', k: '#18181b', w: '#f4f4f5' };
export function drawBurgosMark(c, x, y, s = 1, alpha = 1) {
  c.save();
  c.globalAlpha *= alpha;
  BC_SHIELD.forEach((row, r) => {
    for (let col = 0; col < row.length; col++) {
      const color = BC_COLORS[row[col]];
      if (color) { c.fillStyle = color; c.fillRect(Math.round(x + col * s), Math.round(y + r * s), s, s); }
    }
  });
  c.restore();
}

function rect(c, color, x, y, w, h) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); }
function block(c, color, x, y, w, h, edge = 2) {
  rect(c, INK, x + edge, y, w - edge * 2, h); rect(c, INK, x, y + edge, w, h - edge * 2);
  rect(c, color, x + edge, y + edge, w - edge * 2, h - edge * 2);
}

// Cache native-resolution pixel sprites; enlarge only with nearest-neighbor filtering.
// Elipse de brillo bajo los personajes: se dibuja una sola vez a 2x y luego solo se copia
const groundGlows = new Map();
function groundGlowSprite(enemy) {
  if (groundGlows.has(enemy)) return groundGlows.get(enemy);
  const k = 2, canvas = document.createElement('canvas');
  canvas.width = 56 * k; canvas.height = 16 * k;
  const g = canvas.getContext('2d'), cx = 28 * k, cy = 8 * k;
  const glow = g.createRadialGradient(cx, cy, 3 * k, cx, cy, 28 * k);
  glow.addColorStop(0, enemy ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 211, 238, 0.2)');
  glow.addColorStop(0.45, '#080d1360');
  glow.addColorStop(1, 'transparent');
  g.fillStyle = glow; g.beginPath(); g.ellipse(cx, cy, 28 * k, 8 * k, 0, 0, Math.PI * 2); g.fill();
  return cacheSprite(groundGlows, enemy, canvas);
}

function foodSprite(kind, enemy, flash = false) {
  const key = `${kind}:${enemy}:${flash}`;
  if (sprites.has(key)) return sprites.get(key);
  if (flash) {
    const base = foodSprite(kind, enemy, false);
    const flashCanvas = document.createElement('canvas'); flashCanvas.width = 64; flashCanvas.height = 72;
    const fc = flashCanvas.getContext('2d');
    fc.drawImage(base, 0, 0);
    fc.globalCompositeOperation = 'source-atop';
    fc.fillStyle = 'rgba(255, 255, 255, 0.72)';
    fc.fillRect(0, 0, 64, 72);
    return cacheSprite(sprites, key, flashCanvas);
  }
  const sprite = document.createElement('canvas'); sprite.width = 64; sprite.height = 72;
  const c = sprite.getContext('2d');
  block(c, '#f7ead2', 14, 56, 15, 9); block(c, '#f7ead2', 37, 56, 15, 9);
  rect(c, '#93a6a0', 17, 62, 10, 2); rect(c, '#93a6a0', 40, 62, 10, 2);
  if (kind === 'pancho' || kind === 'choripan') {
    block(c, '#d7954d', 9, 16, 47, 43, 4); block(c, '#f9c477', 11, 12, 18, 43, 4);
    rect(c, '#ffe5a0', 15, 17, 4, 27); rect(c, '#a8623e', 48, 23, 4, 28);
    block(c, kind === 'choripan' ? '#974d3c' : '#d85744', 25, 7, 22, 48, 5);
    rect(c, kind === 'choripan' ? '#c97a46' : '#fa8b66', 29, 13, 5, 26);
    const sauce = kind === 'choripan' ? '#8acd70' : '#ffdf59';
    for (let y = 12; y < 43; y += 8) { rect(c, sauce, 34, y, 7, 3); rect(c, sauce, 39, y + 3, 4, 3); }
    block(c, '#f0e9d1', 2, 35, 10, 11); block(c, '#f0e9d1', 54, 34, 9, 11);
  } else if (kind === 'burger' || kind === 'double') {
    block(c, '#cd8946', 7, 13, 50, 43, 5); block(c, '#efb35f', 8, 11, 48, 23, 5);
    rect(c, '#ffdc8a', 17, 14, 29, 4); rect(c, '#f3c980', 12, 20, 4, 7);
    for (let i = 0; i < 7; i++) rect(c, '#fff0b0', 16 + i * 5, 21 + (i % 2) * 5, 3, 2);
    block(c, '#81b965', 5, 32, 54, 8); rect(c, '#b8e177', 9, 33, 44, 2);
    block(c, '#754633', 8, 40, 48, kind === 'double' ? 13 : 9);
    rect(c, '#ffcb4b', 10, 38, 44, 4); rect(c, '#ffe472', 16, 42, 11, 3);
    if (kind === 'double') { rect(c, '#d95b51', 10, 49, 44, 3); rect(c, '#e8ad61', 11, 55, 42, 4); }
    else rect(c, '#e8ad61', 11, 51, 42, 5);
  } else if (kind === 'double_rage') {
    // Jefe hamburguesa en segunda fase: el hueco entre el pan y la carne es una boca llena de colmillos
    const tall = 4;
    // Pan de abajo y carne a la parrilla (con marcas)
    block(c, '#a8612a', 7, 50 + tall, 50, 8, 3); rect(c, '#c9803d', 10, 51 + tall, 44, 2);
    block(c, '#4a2416', 6, 42, 52, 10 + tall, 3); rect(c, '#6b3722', 9, 43, 46, 2);
    for (let i = 0; i < 5; i++) rect(c, '#2a120b', 12 + i * 9, 46, 5, 2);
    rect(c, '#ffcb4b', 7, 48, 50, 2); rect(c, '#2a120b', 8, 51, 48, 2);
    // Boca: interior oscuro con lengua
    block(c, '#1c0507', 9, 30, 46, 13, 3);
    rect(c, '#7a1020', 22, 37, 20, 4); rect(c, '#a8213a', 25, 37, 8, 2);
    // Colmillos de arriba y de abajo (queso fundido como dientes de abajo)
    for (let i = 0; i < 7; i++) { const x = 11 + i * 6; rect(c, '#fff8e6', x, 30, 4, 4); rect(c, '#fff8e6', x + 1, 34, 2, 2); }
    for (let i = 0; i < 6; i++) { const x = 14 + i * 6; rect(c, '#ffcb4b', x, 39, 4, 4); rect(c, '#ffcb4b', x + 1, 37, 2, 2); }
    rect(c, '#ffcb4b', 7, 41, 50, 3); rect(c, '#ffcb4b', 12, 44, 3, 4); rect(c, '#ffcb4b', 44, 44, 3, 5); // queso chorreando
    // Lechuga rota colgando sobre la boca
    for (let i = 0; i < 9; i++) rect(c, i % 2 ? '#5fa344' : '#7cc45a', 6 + i * 6, 28 + (i % 2) * 2, 6, 3);
    // Ketchup que gotea de la comisura
    rect(c, '#d61f2c', 52, 33, 4, 8); rect(c, '#d61f2c', 53, 41, 2, 4); rect(c, '#ff5a64', 53, 34, 1, 3);
    // Pan de arriba tostado con semillas
    block(c, '#b4642a', 5, 6, 54, 25, 6); block(c, '#d98a3f', 8, 5, 48, 12, 5);
    rect(c, '#f2b465', 15, 7, 22, 3);
    for (const [x, y] of [[14, 12], [24, 9], [34, 13], [44, 9], [50, 15], [20, 16]]) { rect(c, '#fff3cf', x, y, 3, 2); rect(c, '#d9c08a', x, y + 2, 3, 1); }
    // Ojos furiosos: cejas en V, ojo amarillo con pupila roja que brilla
    block(c, '#fff3b0', 16, 18, 11, 8, 1); block(c, '#fff3b0', 37, 18, 11, 8, 1);
    rect(c, '#d61f2c', 21, 20, 5, 5); rect(c, '#d61f2c', 38, 20, 5, 5);
    rect(c, '#ffffff', 23, 21, 2, 2); rect(c, '#ffffff', 39, 21, 2, 2);
    rect(c, '#2a0e04', 15, 13, 4, 2); rect(c, '#2a0e04', 18, 15, 4, 2); rect(c, '#2a0e04', 21, 16, 4, 2); rect(c, '#2a0e04', 24, 17, 4, 2);
    rect(c, '#2a0e04', 45, 13, 4, 2); rect(c, '#2a0e04', 42, 15, 4, 2); rect(c, '#2a0e04', 39, 16, 4, 2); rect(c, '#2a0e04', 36, 17, 4, 2);
  } else if (kind === 'papas' || kind === 'fries') {
    for (let i = 0; i < 5; i++) { block(c, '#f3b846', 10 + i * 8, 7 + i % 3 * 4, 9, 32); rect(c, '#ffe895', 12 + i * 8, 10 + i % 3 * 4, 3, 23); }
    block(c, '#d84b50', 7, 29, 50, 31, 4); rect(c, '#ff7770', 11, 32, 4, 19);
    rect(c, '#9e3444', 49, 34, 4, 19); rect(c, '#ffdf67', 27, 48, 10, 7);
  } else if (kind === 'soda' || kind === 'ketchup' || kind === 'mayo') {
    if (kind === 'soda') { block(c, '#e8ebd1', 38, 3, 6, 21); rect(c, '#ff7f69', 40, 5, 2, 10); }
    else block(c, '#f4e8c8', 24, 5, 17, 13);
    block(c, kind === 'soda' ? '#50b8be' : kind === 'mayo' ? '#d9ead2' : '#d84b50', 14, 20, 37, 40, 4);
    rect(c, kind === 'soda' ? '#98e9dd' : kind === 'mayo' ? '#ffffff' : '#ff8781', 18, 24, 5, 27);
    block(c, '#f8e6c5', 11, 17, 43, 8); rect(c, '#eff2d7', 16, 33, 33, 15);
    rect(c, kind === 'soda' ? '#5abbba' : kind === 'mayo' ? '#69cf8b' : '#f27168', 27, 37, 10, 7);
  } else if (kind === 'tray') {
    block(c,'#7697a1',5,22,54,34,5);block(c,'#b9d8d9',9,25,46,25,4);rect(c,'#e8ffff',14,29,32,4);rect(c,'#52717c',12,48,40,4);
  } else if (kind === 'chef') {
    block(c,'#d58b45',10,24,44,35,5);rect(c,'#ffd27d',15,28,34,6);block(c,'#f4f0df',14,7,38,22,5);block(c,'#ffffff',8,12,17,13,5);block(c,'#ffffff',39,9,18,16,5);
  } else if (kind === 'pizza') {
    for (let i = 0; i < 10; i++) { rect(c, INK, 6 + i * 2, 19 + i * 4, 53 - i * 4, 5); rect(c, '#f6c761', 10 + i * 2, 20 + i * 4, 45 - i * 4, 3); }
    block(c, '#d3944d', 6, 13, 54, 11, 3); rect(c, '#ffdc88', 12, 15, 41, 3);
    for (const [x,y] of [[18,28],[40,27],[30,44]]) block(c, '#df6251', x, y, 9, 9);
  } else if (kind === 'icecream') {
    for (let i = 0; i < 7; i++) block(c, '#dba26a', 18 + i * 2, 35 + i * 4, 30 - i * 4, 5, 1);
    block(c, '#ed9fb9', 8, 21, 29, 25, 5); block(c, '#b79aca', 30, 23, 27, 22, 5);
    block(c, '#f1e3c4', 21, 8, 27, 25, 5); rect(c, '#fff8da', 26, 12, 9, 5);
  } else if (kind === 'chili') {
    // Ají kamikaze: cuerpo rojo curvado que se afina hacia abajo, tallo verde y mecha encendida
    block(c, '#e2362b', 12, 16, 40, 22, 6); block(c, '#e2362b', 16, 32, 32, 16, 6);
    block(c, '#c42a24', 24, 44, 20, 10, 4); block(c, '#a8211d', 32, 50, 10, 7, 3);
    rect(c, '#ff7a5c', 17, 20, 5, 15); rect(c, '#ffb39b', 18, 21, 2, 6); rect(c, '#8f1c18', 44, 22, 4, 18);
    block(c, '#4f9a3c', 24, 9, 18, 9, 3); rect(c, '#86c95e', 27, 10, 9, 2); block(c, '#3b7a2c', 30, 3, 6, 9, 2);
    rect(c, '#5b4630', 41, 4, 3, 7); rect(c, '#5b4630', 43, 2, 3, 3);
    rect(c, '#ffe066', 45, 0, 4, 3); rect(c, '#ff8a3d', 46, 1, 2, 1); rect(c, '#fff6c2', 48, 2, 2, 2);
  } else if (kind === 'onion') {
    block(c, '#aa83b8', 10, 20, 45, 38, 7); rect(c, '#d9b7d8', 15, 28, 5, 20);
    rect(c, '#c9a1cc', 24, 23, 7, 30); block(c, '#8db26c', 27, 9, 10, 16, 2);
    rect(c, '#c4d880', 24, 9, 4, 7); rect(c, '#6f9956', 35, 5, 5, 12);
  } else if (kind === 'lava_boss') {
    // Domi Colosal / El Señor de la Plancha Negra
    // Placas inferiores y pies de roca basáltica
    block(c, '#0d0608', 8, 54, 20, 12, 3); block(c, '#0d0608', 36, 54, 20, 12, 3);
    rect(c, '#ff3300', 12, 58, 12, 3); rect(c, '#ff3300', 40, 58, 12, 3);
    // Pan inferior calcinado
    block(c, '#241016', 6, 44, 52, 12, 4); rect(c, '#ff5500', 10, 46, 44, 2);
    // Magma hirviente / carne volcánica con núcleo incandescente
    block(c, '#d92200', 4, 30, 56, 16, 3);
    rect(c, '#ff7700', 8, 33, 48, 5);
    rect(c, '#ffdd33', 14, 35, 36, 3);
    // Queso de lava fundido goteando
    rect(c, '#ffaa00', 10, 42, 6, 8); rect(c, '#ffaa00', 26, 44, 8, 7); rect(c, '#ffaa00', 44, 43, 7, 9);
    // Pan superior / coraza de basalto negro
    block(c, '#1f0d13', 5, 12, 54, 20, 5);
    rect(c, '#3a1a24', 9, 14, 46, 6);
    // Grietas de magma en la cabeza
    rect(c, '#ff3300', 14, 18, 12, 2); rect(c, '#ff9900', 16, 17, 8, 1);
    rect(c, '#ff3300', 38, 18, 12, 2); rect(c, '#ff9900', 40, 17, 8, 1);
    rect(c, '#ff5500', 28, 22, 8, 3);
    // Ojos ardientes amenazantes
    rect(c, '#ff0033', 16, 24, 10, 5); rect(c, '#ffdd00', 18, 25, 6, 3); rect(c, '#ffffff', 20, 26, 2, 2);
    rect(c, '#ff0033', 38, 24, 10, 5); rect(c, '#ffdd00', 40, 25, 6, 3); rect(c, '#ffffff', 42, 26, 2, 2);
    // Boca volcánica con colmillos de fuego
    rect(c, '#0a0305', 22, 38, 20, 6);
    rect(c, '#ffee33', 24, 38, 4, 3); rect(c, '#ffee33', 36, 38, 4, 3);
    rect(c, '#ff2200', 22, 42, 20, 2);
    // Corona de hierro negro forjado con picos ardientes
    block(c, '#0f0508', 10, 2, 44, 12, 2);
    for (let p = 0; p < 5; p++) {
      const px = 12 + p * 8;
      rect(c, '#ff2200', px, 0, 4, 4);
      rect(c, '#ffbb00', px + 1, 1, 2, 2);
    }
  } else if (kind === 'inspector') {
    // Delantal/bata blanca sanitaria de bromatología
    block(c, '#0f172a', 12, 14, 40, 44, 5);
    rect(c, '#f8fafc', 16, 16, 32, 40);
    // Corbata roja formal
    rect(c, '#dc2626', 30, 20, 4, 14);
    // Gafas oscuras con reflejo cian
    rect(c, '#0f172a', 18, 16, 28, 7);
    rect(c, '#38bdf8', 21, 18, 9, 2);
    rect(c, '#38bdf8', 34, 18, 9, 2);
    // Placa dorada municipal de inspector en el pecho
    rect(c, '#f59e0b', 19, 28, 7, 7);
    rect(c, '#fef08a', 21, 30, 3, 3);
    // Carpeta de madera con acta de clausura y checklist
    block(c, '#78350f', 40, 26, 18, 24, 2);
    rect(c, '#fef9c3', 42, 28, 14, 20);
    // Renglones y tilde roja de clausura
    rect(c, '#94a3b8', 44, 32, 10, 2);
    rect(c, '#94a3b8', 44, 36, 10, 2);
    rect(c, '#ef4444', 45, 40, 8, 4);
  } else if (kind === 'bill_collector') {
    block(c, '#0284c7', 10, 16, 44, 40, 5);
    rect(c, '#38bdf8', 14, 18, 36, 10);
    rect(c, '#f8fafc', 26, 18, 12, 14);
    rect(c, '#ef4444', 30, 20, 4, 10);
    block(c, '#f59e0b', 42, 32, 14, 18, 2);
    rect(c, '#fef08a', 44, 34, 10, 14);
    rect(c, '#0369a1', 8, 32, 10, 12);
  } else if (kind === 'frying_pan') {
    block(c, '#1e293b', 8, 14, 48, 40, 6);
    rect(c, '#334155', 12, 18, 40, 32);
    block(c, '#0f172a', 2, 28, 10, 8, 2);
    rect(c, '#ffffff', 20, 24, 24, 20);
    rect(c, '#f8fafc', 18, 28, 28, 12);
    block(c, '#f59e0b', 28, 28, 12, 12, 4);
    rect(c, '#fbbf24', 30, 30, 8, 8);
  } else if (kind === 'delivery_kart') {
    block(c, '#eab308', 8, 20, 48, 28, 5);
    rect(c, '#fde047', 12, 22, 40, 12);
    rect(c, '#0f172a', 14, 46, 12, 10);
    rect(c, '#0f172a', 38, 46, 12, 10);
    rect(c, '#e2e8f0', 16, 48, 8, 6); rect(c, '#e2e8f0', 40, 48, 8, 6);
    block(c, '#b45309', 22, 8, 20, 14, 2);
    rect(c, '#d97706', 24, 10, 16, 10);
    rect(c, '#ef4444', 30, 10, 4, 10);
  } else if (kind === 'ice_pop') {
    block(c, '#06b6d4', 14, 10, 36, 42, 6);
    rect(c, '#22d3ee', 18, 12, 28, 36);
    rect(c, '#67e8f9', 22, 14, 12, 30);
    rect(c, '#ffffff', 24, 16, 4, 18);
    block(c, '#d97706', 28, 52, 8, 14, 2);
    rect(c, '#f59e0b', 30, 52, 4, 12);
  } else if (kind === 'burrower_chili') {
    block(c, '#ea580c', 14, 20, 36, 34, 6);
    rect(c, '#f97316', 18, 22, 28, 28);
    block(c, '#eab308', 18, 8, 28, 14, 3);
    rect(c, '#fef08a', 28, 14, 8, 6);
    rect(c, '#ffffff', 30, 15, 4, 4);
    block(c, '#78350f', 6, 36, 10, 10, 2);
    block(c, '#78350f', 48, 36, 10, 10, 2);
  } else if (kind === 'goalie_bot') {
    block(c, '#2563eb', 12, 16, 40, 36, 4);
    rect(c, '#3b82f6', 16, 18, 32, 30);
    rect(c, '#1d4ed8', 20, 24, 24, 8);
    rect(c, '#22d3ee', 22, 26, 20, 4);
    block(c, '#f59e0b', 2, 24, 14, 18, 3);
    rect(c, '#fbbf24', 4, 26, 10, 14);
    block(c, '#f59e0b', 48, 24, 14, 18, 3);
    rect(c, '#fbbf24', 50, 26, 10, 14);
  } else if (kind === 'armored_crab') {
    block(c, '#dc2626', 10, 20, 44, 30, 6);
    rect(c, '#ef4444', 14, 22, 36, 24);
    rect(c, '#f87171', 18, 24, 28, 12);
    block(c, '#b91c1c', 2, 12, 14, 16, 3); rect(c, '#ef4444', 4, 14, 8, 10);
    block(c, '#b91c1c', 48, 12, 14, 16, 3); rect(c, '#ef4444', 52, 14, 8, 10);
    for (let p = 0; p < 3; p++) {
      rect(c, '#991b1b', 6, 38 + p * 6, 6, 3);
      rect(c, '#991b1b', 52, 38 + p * 6, 6, 3);
    }
  } else if (kind === 'exotic_juice') {
    block(c, '#f59e0b', 16, 16, 32, 38, 4);
    rect(c, '#fbbf24', 18, 18, 28, 32);
    rect(c, '#fef08a', 22, 20, 16, 26);
    rect(c, '#ef4444', 36, 4, 5, 18);
    rect(c, '#ffffff', 36, 8, 5, 4); rect(c, '#ffffff', 36, 16, 5, 4);
    block(c, '#84cc16', 10, 12, 12, 12, 6);
    rect(c, '#bef264', 12, 14, 8, 8);
  } else {
    block(c, kind === 'empanada' ? '#e7ba6e' : '#c68c44', 9, 17, 48, 40, 7);
    rect(c, '#f8d28b', 17, 20, 30, 5); rect(c, '#e4aa52', 14, 27, 6, 22);
    for (let i = 0; i < 7; i++) rect(c, '#a6693c', 17 + (i * 11) % 32, 27 + (i * 7) % 25, 3, 3);
    if (kind === 'empanada') for (let i = 0; i < 7; i++) rect(c, '#a87144', 11 + i * 6, 51, 3, 4);
  }
  // El Coloso y la hamburguesa furiosa traen su propia cara
  if (kind !== 'lava_boss' && kind !== 'double_rage') {
    block(c, '#fff8dc', 22, 30, 9, 12, 1); block(c, '#fff8dc', 38, 30, 9, 12, 1);
    rect(c, INK, 27, 33, 4, 6); rect(c, INK, 42, 33, 4, 6);
    if (enemy) { rect(c, INK, 21, 28, 7, 3); rect(c, INK, 26, 30, 6, 3); rect(c, INK, 38, 30, 6, 3); rect(c, INK, 43, 28, 7, 3); }
    rect(c, INK, 31, 46, 10, 3); rect(c, enemy ? '#f9867e' : '#fff2d5', 34, 49, 5, 2);
  }

  // Sombreado y degradado de color vibrante (iluminación cenital cálida y sombra rica)
  c.save();
  c.globalCompositeOperation = 'source-atop';
  const shadeGrad = c.createLinearGradient(0, 4, 0, 68);
  shadeGrad.addColorStop(0, enemy ? 'rgba(255, 120, 100, 0.28)' : 'rgba(255, 245, 180, 0.28)');
  shadeGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.06)');
  shadeGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.0)');
  shadeGrad.addColorStop(1, enemy ? 'rgba(50, 10, 25, 0.42)' : 'rgba(15, 25, 45, 0.38)');
  c.fillStyle = shadeGrad;
  c.fillRect(0, 0, 64, 72);

  // Luz de borde / rim light lateral coloreada
  const rimGrad = c.createLinearGradient(0, 0, 64, 0);
  rimGrad.addColorStop(0, enemy ? 'rgba(255, 80, 80, 0.24)' : 'rgba(125, 211, 252, 0.24)');
  rimGrad.addColorStop(0.2, 'transparent');
  rimGrad.addColorStop(0.8, 'transparent');
  rimGrad.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  c.fillStyle = rimGrad;
  c.fillRect(0, 0, 64, 72);
  c.restore();

  return cacheSprite(sprites, key, sprite);
}

// Jefes en segunda fase: el mismo sprite pero mordido (o "comido" en la hamburguesa).
// Cada mordida son 3 discos en fila (forma de dientes) que se recortan píxel a píxel,
// y el borde del mordisco se pinta con el color de "adentro" de cada comida.
const BITES = {
  double:    { inner: '#f6d38b', crumbs: '#c98a3d', bites: [[58, 13, 12, 0.8]] },
  burger:    { inner: '#f6d38b', crumbs: '#c98a3d', bites: [[55, 20, 11, 0.6]] },
  fries:     { inner: '#fff1b8', crumbs: '#f2c14e', bites: [[44, 6, 10, 1.4], [16, 8, 7, 1.9]] },
  papas:     { inner: '#fff1b8', crumbs: '#f2c14e', bites: [[44, 6, 10, 1.4]] },
  ketchup:   { inner: '#ff9aa2', crumbs: '#b3001e', bites: [[52, 32, 12, 0], [14, 52, 7, 3.1]] },
  pizza:     { inner: '#ffe6a0', crumbs: '#e0a33a', bites: [[50, 30, 13, -0.3], [14, 24, 8, 2.8]] },
  icecream:  { inner: '#fdf4ff', crumbs: '#d8b4fe', bites: [[40, 8, 11, 1.2]] },
  lava_boss: { inner: '#ff7a14', crumbs: '#ffd166', bites: [[55, 18, 12, 0.6], [8, 46, 8, 2.6]] },
};
const DEFAULT_BITE = { inner: '#f6d38b', crumbs: '#c98a3d', bites: [[54, 18, 11, 0.6]] };

function bittenSprite(kind, flash = false) {
  const key = `${kind}:bitten:${flash}`;
  if (sprites.has(key)) return sprites.get(key);
  const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 72;
  const c = canvas.getContext('2d');
  // La hamburguesa jefe cambia de cara en la segunda fase (la versión furiosa con colmillos)
  c.drawImage(foodSprite(kind === 'double' ? 'double_rage' : kind, true, flash), 0, 0);
  const spec = BITES[kind] || DEFAULT_BITE;
  // Cada mordida: 3 dientes en arco (ángulo = hacia dónde mira el mordisco)
  const discs = [];
  for (const [x, y, r, angle] of spec.bites) {
    const tx = -Math.sin(angle), ty = Math.cos(angle);
    for (const k of [-1, 0, 1]) discs.push([x + tx * k * r * 0.62, y + ty * k * r * 0.62, r * (k ? 0.72 : 0.8)]);
  }
  const image = c.getImageData(0, 0, 64, 72), data = image.data;
  const inner = [parseInt(spec.inner.slice(1, 3), 16), parseInt(spec.inner.slice(3, 5), 16), parseInt(spec.inner.slice(5, 7), 16)];
  for (let py = 0; py < 72; py++) {
    for (let px = 0; px < 64; px++) {
      const i = (py * 64 + px) * 4;
      if (!data[i + 3]) continue;
      let edge = Infinity;
      for (const [dx, dy, r] of discs) edge = Math.min(edge, Math.hypot(px + 0.5 - dx, py + 0.5 - dy) - r);
      if (edge < 0) data[i + 3] = 0;                                      // recorte del mordisco
      else if (edge < 2.2 && !flash) { data[i] = inner[0]; data[i + 1] = inner[1]; data[i + 2] = inner[2]; } // borde con relleno
    }
  }
  c.putImageData(image, 0, 0);
  // Migas sueltas y una marquita de dientes pegada al mordisco
  if (!flash) {
    c.fillStyle = spec.crumbs;
    const [bx, by, br, angle] = spec.bites[0];
    for (let k = 0; k < 4; k++) {
      const a = angle + Math.PI + (k - 1.5) * 0.5, d = br + 4 + (k % 2) * 3;
      c.fillRect(Math.round(bx + Math.cos(a) * d), Math.round(by + Math.sin(a) * d), 2, 2);
    }
  }
  return cacheSprite(sprites, key, canvas);
}

// bitten: jefe en segunda fase (sprite mordido)
export function drawFood(c, kind, x, y, scale = 1, time = 0, enemy = false, flash = false, bitten = false) {
  const bob = Math.round(Math.sin(time * 7 + x * .05) * 1.5);
  // Sin save/restore por personaje (se dibujan cientos por cuadro): solo se toca y se repone el suavizado
  const smoothing = c.imageSmoothingEnabled;
  // Brillo de suelo pre-dibujado (mismo degradado y forma), escalado suave según el tamaño del personaje
  c.imageSmoothingEnabled = true;
  c.drawImage(groundGlowSprite(enemy), x - 28 * scale, y + 15 * scale, 56 * scale, 16 * scale);
  c.imageSmoothingEnabled = false;
  if (kind === 'lava_boss') {
    // Halo de magma bajo el Coloso (un solo enemigo: el degradado en vivo no pesa)
    const glow = c.createRadialGradient(x, y + 23 * scale, 3 * scale, x, y + 23 * scale, 48 * scale);
    glow.addColorStop(0, 'rgba(255, 34, 0, 0.55)'); glow.addColorStop(0.45, 'rgba(255, 120, 0, 0.28)'); glow.addColorStop(1, 'transparent');
    c.fillStyle = glow; c.beginPath(); c.ellipse(x, y + 23 * scale, 48 * scale, 16 * scale, 0, 0, Math.PI * 2); c.fill();
  }

  if (kind === 'domi') {
    if (domiGifImage && domiGifImage.complete && domiGifImage.naturalWidth > 0) {
      const w = 52 * scale;
      const h = 54 * scale;
      if (flash) { c.save(); c.filter = 'brightness(2.5)'; }
      c.drawImage(domiGifImage, Math.round(x - w / 2), Math.round(y - h / 2 - 4 + bob), w, h);
      if (flash) c.restore();
      c.imageSmoothingEnabled = smoothing;
      return;
    }
  }

  c.drawImage(bitten ? bittenSprite(kind, flash) : foodSprite(kind, enemy, flash), Math.round(x - 32 * scale), Math.round(y - 36 * scale + bob), 64 * scale, 72 * scale);
  c.imageSmoothingEnabled = smoothing;
}

export function drawWeapon(c, kind, x, y, scale = 1, angle = -.65) {
  c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale);
  if (kind === 'fork' || kind === 'skewer') {
    block(c, '#b8d4cd', -3, -20, 6, 41, 1); rect(c, '#f8f2d1', -1, -17, 2, 32);
    if (kind === 'fork') for (let i = 0; i < 3; i++) block(c, '#c8ded4', -10 + i * 8, -31, 5, 16, 1);
    else { block(c, '#cb7949', -8, -13, 17, 10); block(c, '#8ac274', -8, 0, 17, 9); }
  } else if (kind === 'friesRain') {
    for (let i = 0; i < 3; i++) block(c, '#ffcf4a', -14 + i * 10, -21 + i % 2 * 8, 8, 35, 1);
  } else if (kind === 'explosiveBread') {
    block(c, '#dfa85a', -16, -15, 32, 31, 5); rect(c, '#ffe08c', -9, -11, 17, 4); rect(c, '#e35c48', 9, -21, 4, 8);
  } else {
    block(c, kind === 'mustardSniper' ? '#f4c64d' : '#e46155', -10, -14, 21, 35, 3);
    block(c, '#e9ead4', -6, -23, 13, 10); rect(c, '#f7edc9', -7, 0, 15, 7);
  }
  c.restore();
}

// Estadio en pixel art: tribuna con hinchada, carteles LED y césped cortado en franjas.
// Todo con rectángulos de 2-4 px (líneas de cal incluidas) para que se vea nítido al escalar.
function footballFloor(c) {
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const PX = 4; // tamaño del "píxel" del césped y las líneas
  const pitch = { x: 64, y: 120, w: 1792, h: 920 };
  const midX = pitch.x + pitch.w / 2, midY = pitch.y + pitch.h / 2;

  // --- Tribuna: escalones de cemento con hinchas de dos colores ---
  rect(c, '#0b1020', 0, 0, 1920, 120);
  for (let row = 0; row < 5; row++) {
    const y = 6 + row * 13;
    rect(c, row % 2 ? '#1a2238' : '#202a44', 0, y + 9, 1920, 4);
    for (let x = 4 + (row % 2) * 6; x < 1916; x += 12) {
      const n = hash(x, row);
      if (n < 0.12) continue; // asientos vacíos
      const shirt = n < 0.5 ? '#6ec6ff' : n < 0.78 ? '#f8fafc' : n < 0.92 ? '#ffd23f' : '#ff4d6d';
      rect(c, '#f1c27d', x + 2, y, 4, 3);          // cabeza
      rect(c, shirt, x, y + 3, 8, 6);              // camiseta
      if (n > 0.86) rect(c, shirt, x + (n > 0.93 ? 8 : -2), y - 3, 2, 6); // brazo levantado
    }
  }
  // Banderas gigantes en la tribuna
  for (const [fx, a, b] of [[300, '#6ec6ff', '#f8fafc'], [960, '#ffd23f', '#1d4ed8'], [1620, '#ff4d6d', '#f8fafc']]) {
    for (let i = 0; i < 6; i++) rect(c, i % 2 ? a : b, fx - 60 + i * 20, 8, 20, 44);
    rect(c, '#0b1020', fx - 60, 52, 120, 2);
  }
  // Carteles LED de publicidad
  rect(c, '#05070d', 0, 70, 1920, 34);
  const ads = [['DOMI COLA', '#ff3f8b'], ['PANCHO PRO', '#4df8dc'], ['24/7 ARCADE', '#ffe272'], ['MOSTAZA FC', '#a3e635']];
  for (let i = 0; i < 8; i++) {
    // El sexto cartel es un auspicio discreto de BurgosCorp
    const [label, tone] = i === 5 ? ['BURGOSCORP', '#ef3b4f'] : ads[i % ads.length], ax = 8 + i * 240;
    rect(c, '#111827', ax, 74, 228, 26);
    for (let d = 0; d < 228; d += 4) rect(c, '#1f2937', ax + d, 74, 1, 26); // grilla de LEDs
    c.save(); c.fillStyle = tone; c.font = '900 14px monospace'; c.textAlign = 'center'; c.fillText(label, ax + 114, 93); c.restore();
    if (i === 5) drawBurgosMark(c, ax + 20, 80, 1);
  }
  rect(c, '#0f3b26', 0, 104, 1920, 16); // pista perimetral

  // --- Césped: franjas de corte + damero sutil + pasto con textura ---
  const stripes = ['#2f8f46', '#277b3c'];
  const stripeW = 128;
  for (let x = pitch.x - 64; x < pitch.x + pitch.w + 64; x += stripeW) {
    const i = Math.floor((x - pitch.x + 64) / stripeW);
    rect(c, stripes[i % 2], x, 104 + 16, stripeW, 1080 - 120);
  }
  for (let y = pitch.y; y < pitch.y + pitch.h; y += 92) {
    if (((y - pitch.y) / 92) % 2) { c.save(); c.globalAlpha = 0.07; rect(c, '#ffffff', 0, y, 1920, 92); c.restore(); }
  }
  for (let y = 120; y < 1080; y += PX * 2) {
    for (let x = 0; x < 1920; x += PX * 2) {
      const n = hash(x, y);
      // Matitas de pasto en forma de V (oscuras y claras), pocas para que el césped se vea limpio
      if (n < 0.025) { rect(c, '#24723a', x, y + 2, 2, 4); rect(c, '#24723a', x + 2, y + 4, 2, 2); rect(c, '#24723a', x + 4, y, 2, 6); }
      else if (n > 0.975) { rect(c, '#4fb565', x, y + 2, 2, 4); rect(c, '#4fb565', x + 4, y, 2, 6); }
    }
  }

  // --- Líneas de cal pixeladas ---
  const LINE = '#f1f5e9', SHADE = '#c9d8c3';
  const hLine = (x, y, w) => { rect(c, SHADE, x, y + PX, w, 2); rect(c, LINE, x, y, w, PX); };
  const vLine = (x, y, h) => { rect(c, SHADE, x + PX, y, 2, h); rect(c, LINE, x, y, PX, h); };
  const box = (x, y, w, h) => { hLine(x, y, w); hLine(x, y + h - PX, w); vLine(x, y, h); vLine(x + w - PX, y, h); };
  const arc = (cx, cy, r, from, to) => {
    const steps = Math.ceil(r * Math.abs(to - from) / 2);
    for (let s = 0; s <= steps; s++) {
      const a = from + (to - from) * s / steps;
      const px = Math.round((cx + Math.cos(a) * r) / 2) * 2, py = Math.round((cy + Math.sin(a) * r) / 2) * 2;
      rect(c, LINE, px - PX / 2, py - PX / 2, PX, PX);
    }
  };
  box(pitch.x, pitch.y, pitch.w, pitch.h);
  vLine(midX - PX / 2, pitch.y, pitch.h);
  arc(midX, midY, 120, 0, Math.PI * 2);
  rect(c, LINE, midX - 6, midY - 6, 12, 12);
  for (const side of [-1, 1]) {
    const edge = side < 0 ? pitch.x : pitch.x + pitch.w;
    const bigW = 270, bigH = 500, smallW = 100, smallH = 240;
    box(side < 0 ? edge : edge - bigW, midY - bigH / 2, bigW, bigH);
    box(side < 0 ? edge : edge - smallW, midY - smallH / 2, smallW, smallH);
    const spot = edge + side * -190;
    rect(c, LINE, spot - 5, midY - 5, 10, 10);
    // Medialuna fuera del área grande
    const reach = Math.acos(80 / 100);
    if (side < 0) arc(spot, midY, 100, -reach, reach); else arc(spot, midY, 100, Math.PI - reach, Math.PI + reach);
  }
  // Córners con banderines
  for (const [cx, cy, a0] of [[pitch.x, pitch.y, 0], [pitch.x + pitch.w, pitch.y, Math.PI / 2], [pitch.x + pitch.w, pitch.y + pitch.h, Math.PI], [pitch.x, pitch.y + pitch.h, Math.PI * 1.5]]) {
    arc(cx, cy, 24, a0, a0 + Math.PI / 2);
    rect(c, '#e5e7eb', cx - 1, cy - 26, 3, 26);
    rect(c, '#ffd23f', cx + (cx < midX ? 2 : -12), cy - 26, 10, 8);
    rect(c, '#f59e0b', cx + (cx < midX ? 2 : -12), cy - 22, 10, 2);
  }

  // --- Arcos: palos con volumen, red cuadriculada y sombra ---
  for (const side of [-1, 1]) {
    const gx = side < 0 ? pitch.x : pitch.x + pitch.w, depth = 44, gh = 200, gy = midY - gh / 2;
    const back = gx + side * depth;
    rect(c, 'rgba(0,0,0,0.25)', Math.min(gx, back), gy + 8, depth, gh);
    rect(c, '#0b3b20', Math.min(gx, back), gy, depth, gh);
    for (let y = gy; y <= gy + gh; y += 10) rect(c, '#d1d5db66', Math.min(gx, back), y, depth, 1);
    for (let x = 0; x <= depth; x += 10) rect(c, '#d1d5db66', Math.min(gx, back) + x, gy, 1, gh);
    // Palos y travesaño
    rect(c, '#f8fafc', gx - 4, gy - 6, 8, gh + 12);
    rect(c, '#94a3b8', gx + 2, gy - 6, 2, gh + 12);
    rect(c, '#f8fafc', Math.min(gx, back), gy - 6, depth, 6);
    rect(c, '#f8fafc', Math.min(gx, back), gy + gh, depth, 6);
    rect(c, '#e5e7eb', back - 3, gy - 6, 6, gh + 12);
  }

  // Luz de los reflectores sobre el césped (horneada)
  for (const [lx, ly] of [[260, 160], [1660, 160], [260, 1000], [1660, 1000]]) {
    const glow = c.createRadialGradient(lx, ly, 20, lx, ly, 520);
    glow.addColorStop(0, 'rgba(255, 252, 220, 0.12)'); glow.addColorStop(1, 'rgba(255, 252, 220, 0)');
    c.fillStyle = glow; c.fillRect(lx - 520, ly - 520, 1040, 1040);
  }
}

// ============================================================================
// Motor Pixel Art integrado de "Tablero de lava — Pixel art.html" (192x128 px)
// ============================================================================
const LAVA_BOARD = (() => {
  const W = 192, H = 128, N = W * H, THR = 0.45;
  const hx = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  const LAVA = ['#6a1004', '#a82406', '#e04008', '#ff7a14', '#ffb52e', '#ffe88a'].map(hx);
  const ROCK = ['#0f0c14', '#181320', '#241d2c', '#33293a', '#463b49'].map(hx);
  const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const bay = (x, y) => B[y & 3][x & 3] / 16;
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);

  let seed = 7, edge, rock, deco, lavaM, parts = [], t = 0, lastStep = -1;
  let cv = null, ctx = null, img = null, D = null, built = false;

  function mulberry(s) {
    return () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let m = Math.imul(s ^ (s >>> 15), 1 | s);
      m = (m + Math.imul(m ^ (m >>> 7), 61 | m)) ^ m;
      return ((m ^ (m >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(x, y) {
    let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vn(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, o) {
    let s = 0, a = 0.5, f = 1;
    for (let i = 0; i < o; i++) { s += a * vn(x * f, y * f); f *= 2; a *= 0.5; }
    return s / (1 - Math.pow(0.5, o));
  }

  const set = (x, y, c) => {
    x |= 0; y |= 0;
    if (x >= 0 && y >= 0 && x < W && y < H) deco[y * W + x] = typeof c === 'string' ? hx(c) : c;
  };
  const safe = (x, y, m) => x > m && y > m && x < W - m && y < H - m && edge[(y | 0) * W + (x | 0)] > 0.06;

  function decorate() {
    const r = mulberry(seed * 7 + 1), R = (a, b) => a + r() * (b - a);
    // islotes en lava
    let n = 0;
    for (let tr = 0; tr < 400 && n < 16; tr++) {
      const x = R(8, W - 8) | 0, y = R(8, H - 8) | 0;
      if (edge[y * W + x] < -0.07) {
        n++;
        const rx = R(3, 6), ry = rx * 0.7;
        for (let dy = -ry - 1; dy <= ry + 1; dy++) {
          for (let dx = -rx - 1; dx <= rx + 1; dx++) {
            const d = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
            if (d <= 1) set(x + dx, y + dy, d > 0.65 ? '#1c1620' : (dx + dy < -1 ? '#4a3f50' : '#33293a'));
            else if (d < 1.5 && dy > 0) set(x + dx, y + dy, '#8a2a0a');
          }
        }
        if (r() < 0.5) {
          set(x, y - 1, '#ffd24a'); set(x - 1, y, '#ff8a1c');
          set(x + 1, y, '#ff8a1c'); set(x, y, '#c4400a');
        }
      }
    }
    // puentes
    let br = 0;
    for (let tr = 0; tr < 300 && br < 4; tr++) {
      const y = R(10, H - 12) | 0;
      const x = R(10, W - 60) | 0;
      if (edge[y * W + x] > 0 && edge[y * W + x + 1] < 0) {
        let x1 = x + 1;
        while (x1 < W - 4 && lavaM[y * W + x1]) x1++;
        if (x1 - x >= 8 && x1 - x <= 44 && edge[y * W + x1] > 0) {
          br++;
          for (let px = x - 3; px <= x1 + 3; px++) {
            set(px, y - 2, '#2a160a'); set(px, y + 2, '#2a160a');
            for (let py = -1; py <= 1; py++) set(px, y + py, (px % 3 === 0) ? '#4b2c14' : (py === 0 ? '#9a6530' : '#80501f'));
            if (px % 6 === 0) { set(px, y - 3, '#2a160a'); set(px, y + 3, '#2a160a'); }
          }
          for (const px of [x - 3, x1 + 3]) {
            for (let q = -3; q <= 3; q++) set(px, y + q, '#3a2210');
          }
        }
      }
    }
    // rocas
    for (let tr = 0, c = 0; tr < 300 && c < 45; tr++) {
      const x = R(4, W - 4) | 0, y = R(4, H - 4) | 0;
      if (!safe(x, y, 4)) continue;
      c++;
      const rx = R(1.5, 4), ry = rx * 0.75;
      for (let dy = -ry; dy <= ry; dy++) {
        for (let dx = -rx; dx <= rx; dx++) {
          const d = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
          if (d <= 1) set(x + dx, y + dy, d > 0.7 ? '#14101a' : (dx + dy < -0.5 ? '#5d5264' : (dx + dy < 1 ? '#41364a' : '#2b2332')));
        }
      }
    }
    // espinas de obsidiana
    for (let tr = 0, c = 0; tr < 300 && c < 30; tr++) {
      const x = R(6, W - 6) | 0, y = R(14, H - 4) | 0;
      if (!safe(x, y, 6)) continue;
      c++;
      const k = 1 + (r() * 3 | 0);
      for (let s = 0; s < k; s++) {
        const bx = x + s * 4 - k * 2, hh = R(6, 13) | 0, w = R(3, 6) | 0;
        for (let q = 0; q < hh; q++) {
          const hw = Math.max(0.5, (1 - q / hh) * w / 2);
          for (let dx = -hw; dx <= hw; dx++) {
            const left = dx < -hw + 1;
            set(bx + dx, y - q, left ? '#5a47a0' : (dx > hw - 1 ? '#0b0912' : '#241b3c'));
          }
        }
        set(bx, y - hh, '#8a78d0');
      }
      for (let dx = -3; dx <= 3; dx++) set(x + dx, y + 1, '#0b0912');
    }
    // gemas
    for (let tr = 0, c = 0; tr < 200 && c < 22; tr++) {
      const x = R(4, W - 4) | 0, y = R(4, H - 4) | 0;
      if (!safe(x, y, 3)) continue;
      c++;
      set(x, y - 2, '#fff0a0'); set(x - 1, y - 1, '#ffd24a'); set(x, y - 1, '#ffb52e'); set(x + 1, y - 1, '#ff8a1c');
      set(x - 1, y, '#ff8a1c'); set(x, y, '#e04008'); set(x + 1, y, '#b52a07'); set(x, y + 1, '#6a1004');
    }
    // cráneos
    const SK = ['.WWWW.', 'WWWWWW', 'WKWWKW', 'WWWWWW', '.WKKW.', '.W.W.W'];
    for (let tr = 0, c = 0; tr < 200 && c < 9; tr++) {
      const x = R(4, W - 8) | 0, y = R(4, H - 8) | 0;
      if (!safe(x, y, 6)) continue;
      c++;
      SK.forEach((row, j) => [...row].forEach((ch, i) => {
        if (ch === 'W') set(x + i, y + j, j > 3 ? '#a89f80' : '#ddd4b4');
        else if (ch === 'K') set(x + i, y + j, '#1a1010');
      }));
    }
    // huesos
    for (let tr = 0, c = 0; tr < 200 && c < 16; tr++) {
      const x = R(4, W - 10) | 0, y = R(4, H - 6) | 0;
      if (!safe(x, y, 6)) continue;
      c++;
      const dy = r() < 0.5 ? 1 : 0, l = R(4, 8) | 0;
      for (let i = 0; i < l; i++) set(x + i, y + (dy ? i >> 1 : 0), '#cfc6a4');
      set(x - 1, y - 1, '#e8dfbe'); set(x - 1, y + 1, '#e8dfbe');
      set(x + l, y + (dy ? l >> 1 : 0) - 1, '#e8dfbe'); set(x + l, y + (dy ? l >> 1 : 0) + 1, '#e8dfbe');
    }
  }

  function build() {
    if (typeof document === 'undefined') return;
    cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    ctx = cv.getContext('2d');
    img = ctx.createImageData(W, H);
    D = img.data;
    edge = new Float32Array(N);
    rock = new Uint8Array(N * 3);
    deco = new Array(N).fill(null);
    lavaM = new Uint8Array(N);
    parts = [];
    const cr = hx('#ffe88a'), co = hx('#ff7a14'), cd = hx('#b52a07');
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const wx = x + (fbm(x / 40 + 9, y / 40, 2) - 0.5) * 34;
        const wy = y + (fbm(x / 40, y / 40 + 9, 2) - 0.5) * 34;
        const h = fbm(wx / 36, wy / 36, 4), e = h - THR;
        edge[i] = e; lavaM[i] = e < 0 ? 1 : 0;
        const n = fbm(x / 5, y / 5, 3), big = fbm(x / 30 + 4, y / 30, 2);
        const v = n * 1.1 + big * 0.35 - 0.3 + (bay(x, y) - 0.5) * 0.16;
        let col = ROCK[cl(Math.floor(v * 5), 0, 4)].slice();
        const k1 = Math.abs(fbm(x / 20 + 50, y / 20 + 50, 3) - 0.5);
        const k2 = Math.abs(fbm(x / 9 + 80, y / 9, 2) - 0.5);
        let k = k1;
        if (k1 < 0.13) k = Math.min(k1, k2 * 1.5);
        if (k < 0.006) col = cr.slice();
        else if (k < 0.012) col = co.slice();
        else if (k < 0.019) col = cd.slice();
        else if (k < 0.04) {
          const g = (0.04 - k) / 0.04;
          col[0] = Math.min(255, col[0] + g * 70);
          col[1] += g * 12;
        }
        if (e >= 0) {
          if (e < 0.012) col = cd.slice();
          else if (e < 0.028) col = hx('#4a1c14');
          else if (e < 0.05) { col[0] += 24; col[1] += 4; }
        }
        rock.set(col, i * 3);
      }
    }
    decorate();
    built = true;
    frame();
  }

  function frame() {
    if (!built || !D) return;
    const pal = LAVA;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x, o = i * 4;
        let col;
        if (deco[i]) col = deco[i];
        else if (lavaM[i]) {
          const e = edge[i], n = fbm(x / 8 + t * 0.5, y / 8 + t * 0.2, 3), d = cl(-e * 7, 0, 1);
          const v = n * 1.25 + d * 0.55 - 0.35 + Math.sin(x * 0.6 + y * 0.35 + t * 2 + n * 8) * 0.07 + (bay(x, y) - 0.5) * 0.14;
          col = pal[cl(Math.floor(v * 6), 0, 5)];
        } else {
          // Roca: se copia directo sin crear un arreglo por píxel en cada cuadro
          D[o] = rock[i * 3]; D[o + 1] = rock[i * 3 + 1]; D[o + 2] = rock[i * 3 + 2]; D[o + 3] = 255;
          continue;
        }
        D[o] = col[0]; D[o + 1] = col[1]; D[o + 2] = col[2]; D[o + 3] = 255;
      }
    }
    // brasas
    if (parts.length < 70 && Math.random() < 0.8) {
      const x = (Math.random() * W) | 0, y = (Math.random() * H) | 0;
      if (lavaM[y * W + x] && !deco[y * W + x]) {
        parts.push({ x, y, vx: (Math.random() - 0.5) * 0.3, vy: -(0.2 + Math.random() * 0.5), l: 1 });
      }
    }
    parts = parts.filter(p => {
      p.x += p.vx + Math.sin(t * 3 + p.y) * 0.1;
      p.y += p.vy;
      p.l -= 0.012;
      if (p.l <= 0 || p.y < 0) return false;
      const px = p.x | 0, py = p.y | 0;
      if (px >= 0 && px < W) {
        const o = (py * W + px) * 4;
        const col = p.l > 0.65 ? LAVA[5] : p.l > 0.35 ? LAVA[4] : LAVA[2];
        D[o] = col[0]; D[o + 1] = col[1]; D[o + 2] = col[2];
      }
      return true;
    });
    ctx.putImageData(img, 0, 0);
  }

  return {
    draw(targetCtx, width, height, time = 0) {
      if (!built) build();
      if (!cv) return;
      if (lastStep < 0 || Math.abs(time - lastStep) >= 0.07) {
        t += 0.07;
        lastStep = time;
        frame();
      }
      targetCtx.save();
      targetCtx.imageSmoothingEnabled = false;
      targetCtx.drawImage(cv, 0, 0, width, height);
      targetCtx.restore();
    }
  };
})();

function lavaFloor(c) {
  LAVA_BOARD.draw(c, 1920, 1080, 0);
}

// Desierto en pixel art: cielo de atardecer con mesetas, dunas con ondas de viento,
// suelo agrietado, piedras, huesos y matorrales secos. Todo en bloques de 4 px.
function desertFloor(c) {
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const P = 4;
  // --- Cielo en franjas (atardecer) y mesetas rojizas en el horizonte ---
  const sky = ['#ffcf7a', '#ffb560', '#ff9a52', '#f07a48'];
  for (let i = 0; i < sky.length; i++) rect(c, sky[i], 0, i * 12, 1920, 12);
  rect(c, '#e9a463', 0, 48, 1920, 36); // desierto lejano detrás de las mesetas
  for (let x = 0; x < 1920; x += P) rect(c, '#d98f52', x, 58 + Math.round(Math.sin(x / 70) * 3 / P) * P, P, P);
  for (let x = 0; x < 1920; x += P) if (hash(x, 1) < 0.5) rect(c, sky[1], x, 10, P, 2); // borde tramado entre franjas
  rect(c, '#fff1c1', 1520, 6, 40, 40); rect(c, '#ffe08a', 1516, 10, 48, 32); // sol
  const mesa = (x0, w, top, base, col, stripe) => {
    for (let x = x0; x < x0 + w; x += P) {
      const edge = Math.min(x - x0, x0 + w - x);
      const h = edge < 24 ? top + (24 - edge) * 1.2 : top;
      rect(c, col, x, h, P, base - h);
      if (((x - x0) / P) % 9 < 6) rect(c, stripe, x, h + 10, P, 3);
    }
  };
  mesa(40, 360, 22, 84, '#b8543a', '#cf6a45');
  mesa(520, 240, 30, 84, '#a84a35', '#c25f40');
  mesa(980, 420, 18, 84, '#b8543a', '#d27048');
  mesa(1560, 330, 28, 84, '#a84a35', '#c25f40');
  rect(c, '#8a3b2c', 0, 70, 1920, 14);
  for (let x = 0; x < 1920; x += P * 2) rect(c, hash(x, 7) < 0.5 ? '#7a3226' : '#9c4632', x, 80 + (hash(x, 8) < 0.5 ? 0 : P), P * 2, P);

  // --- Arena base en dos tonos con tramado ---
  rect(c, '#e2a85e', 0, 88, 1920, 992);
  for (let y = 88; y < 1080; y += P) for (let x = 0; x < 1920; x += P) {
    const n = hash(x, y);
    if (n < 0.06) rect(c, '#d69a52', x, y, P, P);
    else if (n > 0.97) rect(c, '#f0c27c', x, y, P, P);
  }
  // Dunas: ondas de viento escalonadas (luz arriba, sombra abajo)
  for (let row = 0; row < 26; row++) {
    const baseY = 120 + row * 38 + (row % 2) * 6;
    for (let x = 0; x < 1920; x += P) {
      const y = Math.round((baseY + Math.sin(x / 90 + row * 1.7) * 9 + Math.sin(x / 31 + row) * 3) / P) * P;
      if (hash(x, row) < 0.12) continue; // cortes para que no parezcan líneas perfectas
      rect(c, '#f3c784', x, y, P, P);
      rect(c, '#c98d4a', x, y + P, P, P);
    }
  }
  // Suelo seco agrietado en parches
  for (const [px, py, size] of [[420, 640, 150], [1380, 300, 130], [900, 900, 120], [1600, 820, 110], [260, 320, 100]]) {
    for (let y = py - size / 2; y < py + size / 2; y += P) for (let x = px - size; x < px + size; x += P) {
      const d = Math.hypot((x - px) / size, (y - py) / (size / 2));
      if (d < 1) rect(c, d > 0.85 ? '#c99050' : '#d29a5a', x, y, P, P);
    }
    // Grietas: red de líneas quebradas de 2 px (barro seco)
    const inside = (x, y) => Math.hypot((x - px) / size, (y - py) / (size / 2)) < 0.92;
    const line = (x, y, dx, dy, steps) => {
      for (let s = 0; s < steps; s++) {
        if (inside(x, y)) { rect(c, '#9a6230', Math.round(x / 2) * 2, Math.round(y / 2) * 2, 2, 2); rect(c, '#e8b878', Math.round(x / 2) * 2, Math.round(y / 2) * 2 + 2, 2, 1); }
        x += dx * 2 + (hash(s, x | 0) - 0.5) * 2; y += dy * 2 + (hash(y | 0, s) - 0.5) * 2;
      }
    };
    for (let gy = py - size / 2 + 14; gy < py + size / 2; gy += 22) line(px - size, gy + (hash(gy, px) - 0.5) * 8, 1, (hash(px, gy) - 0.5) * 0.5, size);
    for (let gx = px - size + 20; gx < px + size; gx += 34) for (let gy = py - size / 2 + 14; gy < py + size / 2; gy += 22) line(gx + (hash(gx, gy) - 0.5) * 12, gy, (hash(gy, gx) - 0.5) * 0.4, 1, 11);
  }
  // Piedras con luz y sombra
  for (let i = 0; i < 46; i++) {
    const x = Math.round(hash(i, 3) * 1860 + 30), y = Math.round(hash(3, i) * 940 + 110), s = 2 + Math.floor(hash(i, 9) * 3);
    rect(c, '#00000022', x + 2, y + s * P - 2, s * P + 4, P);
    rect(c, '#9b6b47', x, y, s * P, s * P - 2);
    rect(c, '#c49470', x, y, s * P - P, P);
    rect(c, '#6e4a33', x + s * P - P, y + P, P, s * P - 3);
  }
  // Matorrales secos
  for (let i = 0; i < 22; i++) {
    const x = Math.round(hash(i, 11) * 1840 + 40), y = Math.round(hash(11, i) * 900 + 140);
    rect(c, '#00000022', x - 8, y + 10, 24, 4);
    for (const [dx, dy] of [[0, 0], [-6, -4], [6, -4], [-10, -10], [10, -10], [-2, -12], [4, -16], [-12, 2], [12, 2]]) rect(c, hash(dx + i, dy) < 0.5 ? '#8a6a32' : '#a6843f', x + dx, y + dy, P, P);
  }
  // Huesos y una calavera de vaca
  const skull = (x, y) => {
    rect(c, '#00000026', x - 2, y + 18, 34, 5);
    rect(c, '#f4ecd8', x + 6, y + 2, 18, 14); rect(c, '#f4ecd8', x + 10, y + 16, 10, 4);
    rect(c, '#f4ecd8', x - 4, y, 8, 4); rect(c, '#f4ecd8', x + 26, y, 8, 4); rect(c, '#f4ecd8', x - 6, y - 4, 4, 4); rect(c, '#f4ecd8', x + 32, y - 4, 4, 4);
    rect(c, '#3b2a20', x + 9, y + 6, 4, 4); rect(c, '#3b2a20', x + 17, y + 6, 4, 4); rect(c, '#c9bea4', x + 12, y + 14, 2, 2); rect(c, '#c9bea4', x + 16, y + 14, 2, 2);
  };
  skull(700, 260); skull(1240, 760); skull(320, 900);
  for (let i = 0; i < 8; i++) {
    const x = Math.round(hash(i, 21) * 1800 + 60), y = Math.round(hash(21, i) * 880 + 160);
    rect(c, '#efe5cf', x, y, 20, 4); rect(c, '#efe5cf', x - 3, y - 2, 4, 8); rect(c, '#efe5cf', x + 19, y - 2, 4, 8);
  }
  // Guiño: cajón de madera semienterrado con el sello BC
  rect(c, '#00000026', 1484, 914, 44, 6);
  rect(c, '#7a4a24', 1480, 884, 40, 30); rect(c, '#9a6230', 1482, 886, 36, 4); rect(c, '#5c3519', 1480, 898, 40, 2);
  rect(c, '#e2a85e', 1478, 906, 46, 10); for (let x = 1478; x < 1524; x += 8) rect(c, '#f3c784', x, 906, 4, 4);
  drawBurgosMark(c, 1494, 887, 1, 0.75);
  // Huellas que cruzan el desierto
  for (let s = 0; s < 26; s++) {
    const x = 120 + s * 64, y = 560 + Math.sin(s * 0.45) * 60 + (s % 2) * 10;
    rect(c, '#c98d4a', x, y, 8, 4); rect(c, '#c98d4a', x + 2, y + 4, 4, 2);
  }
}

// Playa Tropical en pixel art: cielo tropical, mar en degradé con cáusticas,
// costa curva, arena dorada con texturas, conchas marinas, estrellas de mar y dunas suaves.
function beachFloor(c) {
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const P = 4;

  // 1. Cielo tropical despejado y horizonte en degradé (y: 0 a 88)
  const skyColors = ['#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'];
  for (let i = 0; i < skyColors.length; i++) rect(c, skyColors[i], 0, i * 22, 1920, 22);

  // Sol radiante en el cielo (x: 1600, y: 14)
  rect(c, '#fef08a', 1590, 8, 48, 48);
  rect(c, '#fffbeb', 1596, 14, 36, 36);
  rect(c, '#ffffff', 1602, 20, 24, 24);

  // Nubes cúmulo pixeladas blancas
  const drawCloud = (x0, y0, w0) => {
    rect(c, '#ffffff', x0, y0 + 10, w0, 16);
    rect(c, '#ffffff', x0 + 12, y0 + 2, w0 - 24, 28);
    rect(c, '#e0f2fe', x0 + 4, y0 + 22, w0 - 8, 6);
  };
  drawCloud(120, 16, 110);
  drawCloud(680, 24, 140);
  drawCloud(1220, 12, 90);

  // Barquitos veleros en el horizonte
  const drawSailboat = (bx, by) => {
    rect(c, '#78350f', bx, by + 8, 22, 6);
    rect(c, '#92400e', bx + 2, by + 10, 18, 4);
    rect(c, '#ffffff', bx + 8, by - 12, 2, 20); // mástil
    rect(c, '#ffffff', bx + 10, by - 10, 8, 14); // vela
    rect(c, '#ef4444', bx + 3, by - 6, 5, 10);
  };
  drawSailboat(480, 80);
  drawSailboat(1360, 84);

  // 2. Mar Tropical (y: 88 hasta la línea costera ~380)
  // Océano profundo:
  rect(c, '#0369a1', 0, 88, 1920, 56);
  rect(c, '#0284c7', 0, 144, 1920, 64);
  // Océano turquesa medio:
  rect(c, '#0097a7', 0, 208, 1920, 68);
  rect(c, '#00acc1', 0, 276, 1920, 60);
  // Aguas costeras cristalinas:
  rect(c, '#06b6d4', 0, 336, 1920, 50);

  // Tramado de profundidad entre franjas de agua
  for (let x = 0; x < 1920; x += P) {
    if (hash(x, 1) < 0.4) rect(c, '#0284c7', x, 142, P, 4);
    if (hash(x, 2) < 0.45) rect(c, '#0097a7', x, 206, P, 4);
    if (hash(x, 3) < 0.5) rect(c, '#00acc1', x, 274, P, 4);
    if (hash(x, 4) < 0.5) rect(c, '#06b6d4', x, 334, P, 4);
  }

  // Red de refracción de luz marina / cáusticas solares en el mar (líneas turquesas brillantes)
  for (let cy = 110; cy < 370; cy += 24) {
    for (let cx = 0; cx < 1920; cx += 56) {
      const rx = cx + (hash(cx, cy) - 0.5) * 20;
      const ry = cy + (hash(cy, cx) - 0.5) * 10;
      rect(c, '#67e8f933', rx, ry, 28, 3);
      rect(c, '#e0f7fa44', rx + 6, ry + 1, 16, 2);
    }
  }

  // 3. Costa y Arena Dorada Cálida (desde ~380 hasta 1080)
  // Arena base:
  rect(c, '#f5d491', 0, 380, 1920, 700);

  // La línea de costa curvada natural (transición de agua poco profunda a arena húmeda)
  for (let x = 0; x < 1920; x += P) {
    const coastY = Math.round((380 + Math.sin(x / 160) * 18 + Math.sin(x / 52) * 6) / P) * P;
    // Agua poco profunda sobre arena:
    rect(c, '#22d3ee', x, coastY - 16, P, 16);
    rect(c, '#67e8f9', x, coastY - 8, P, 8);
    rect(c, '#a5f3fc', x, coastY - 4, P, 4);
    // Franja de arena húmeda oscura:
    rect(c, '#c79d5e', x, coastY, P, 16);
    rect(c, '#d9ab6a', x, coastY + 16, P, 12);
  }

  // Tramado y textura de arena dorada
  for (let y = 420; y < 1080; y += P) {
    for (let x = 0; x < 1920; x += P) {
      const n = hash(x, y);
      if (n < 0.05) rect(c, '#eab970', x, y, P, P); // grano oscuro
      else if (n > 0.96) rect(c, '#fae6b2', x, y, P, P); // grano claro brillante
      else if (n > 0.48 && n < 0.50) rect(c, '#f1cb85', x, y, P, P);
    }
  }

  // Dunas suaves con ondas de viento sutiles
  for (let row = 0; row < 14; row++) {
    const baseY = 460 + row * 44;
    for (let x = 0; x < 1920; x += P) {
      const y = Math.round((baseY + Math.sin(x / 110 + row * 1.6) * 7) / P) * P;
      if (hash(x, row * 9) < 0.15) continue;
      rect(c, '#fae3ad', x, y, P, P);
      rect(c, '#deb069', x, y + P, P, P);
    }
  }

  // Conchas marinas esparcidas en la arena (pequeños espirales y abanicos en bloques de 4x4 px)
  const drawShell = (sx, sy, col, shade) => {
    rect(c, '#00000018', sx - 2, sy + 6, 12, 3);
    rect(c, col, sx, sy, 8, 6);
    rect(c, shade, sx + 2, sy + 2, 4, 3);
    rect(c, '#ffffff', sx + 1, sy, 3, 2);
  };
  for (let i = 0; i < 35; i++) {
    const sx = Math.round(hash(i, 41) * 1840 + 40);
    const sy = Math.round(440 + hash(41, i) * 600);
    const colorPair = [
      ['#fbcfe8', '#f472b6'], // rosa nácar
      ['#fed7aa', '#fb923c'], // melocotón
      ['#fef08a', '#eab308'], // perla dorada
      ['#e0e7ff', '#818cf8']  // lavanda suave
    ][i % 4];
    drawShell(sx, sy, colorPair[0], colorPair[1]);
  }

  // Estrellas de mar decorativas en la arena cerca de la orilla
  const drawStarfish = (stx, sty, col, shade) => {
    rect(c, '#00000022', stx - 1, sty + 10, 16, 4);
    rect(c, col, stx + 5, sty + 4, 4, 4);
    rect(c, col, stx + 5, sty, 4, 4);       // brazo superior
    rect(c, col, stx + 5, sty + 8, 4, 4);   // brazo inferior
    rect(c, col, stx, sty + 3, 5, 4);       // brazo izq
    rect(c, col, stx + 9, sty + 3, 5, 4);   // brazo der
    rect(c, shade, stx + 6, sty + 5, 2, 2); // centro
  };
  for (let i = 0; i < 12; i++) {
    const stx = Math.round(hash(i, 77) * 1800 + 60);
    const sty = Math.round(410 + hash(77, i) * 180);
    drawStarfish(stx, sty, i % 2 ? '#f87171' : '#fb923c', '#b91c1c');
  }

  // Castillo de arena de Pancho & Don Domi con banderita
  const drawSandCastle = (cx, cy) => {
    rect(c, '#00000028', cx - 4, cy + 32, 68, 8);
    // Base del castillo
    rect(c, '#deb069', cx, cy + 12, 60, 22);
    rect(c, '#ebd08f', cx + 4, cy + 14, 52, 18);
    // Puerta de arco
    rect(c, '#854d0e', cx + 24, cy + 22, 12, 12);
    // 3 torrecitas con almenas
    for (const tx of [cx + 2, cx + 22, cx + 42]) {
      rect(c, '#deb069', tx, cy, 16, 14);
      rect(c, '#ebd08f', tx + 2, cy + 2, 12, 12);
      // Almenas
      rect(c, '#deb069', tx, cy - 4, 4, 4);
      rect(c, '#deb069', tx + 6, cy - 4, 4, 4);
      rect(c, '#deb069', tx + 12, cy - 4, 4, 4);
    }
    // Banderita roja
    rect(c, '#854d0e', cx + 29, cy - 14, 2, 12);
    rect(c, '#ef4444', cx + 31, cy - 14, 10, 6);
  };
  drawSandCastle(1560, 740);

  // Guiño del Señor Domi: sello Burgos tallado en la arena
  drawBurgosMark(c, 1780, 980, 2, 0.22);
}

function dinerFloor(map = 'diner') {
  if (floors.has(map)) return floors.get(map);
  const canvas = document.createElement('canvas'); canvas.width = 1920; canvas.height = 1080;
  const c = canvas.getContext('2d'); const parking = map === 'parking', kitchen = map === 'kitchen';
  if(map==='football'){footballFloor(c);return cacheSprite(floors,map,canvas);}
  if(map==='lava'){lavaFloor(c);return cacheSprite(floors,map,canvas);}
  if(map==='desert'){desertFloor(c);return cacheSprite(floors,map,canvas);}
  if(map==='beach'){beachFloor(c);return cacheSprite(floors,map,canvas);}
  if(map==='snow'){
    const colors=['#275574','#35688a'];
    for(let y=0;y<1080;y+=32)for(let x=0;x<1920;x+=32){rect(c,colors[(x/32+y/32)%2],x,y,32,32);rect(c,'#7dd3fc1c',x+2,y+2,28,2);}
    if(map==='snow'){
      for(let i=0;i<160;i++){const x=(i*179)%1920,y=108+(i*91)%920;rect(c,i%2?'#bae6fd':'#e0f2fe',x,y,5,3);rect(c,'#38bdf8',x+1,y+1,2,1);}
      rect(c,'#38bdf8',0,80,1920,3);
      rect(c,'#0d1e2b',0,0,1920,84);rect(c,'#173850',0,76,1920,8);
      for(let x=0;x<1920;x+=64){block(c,x%128?'#1c3d55':'#163246',x+2,5,60,31,2);block(c,'#122839',x+18,40,60,31,2);rect(c,'#38bdf866',x+8,9,38,3);}
      for(const x of [160,540,960,1380,1760]){rect(c,'#e0f2fe',x,72,80,5);rect(c,'#38bdf8',x+8,77,64,3);}
      drawBurgosMark(c, 1830, 1000, 2, 0.18); // guiño: sello BC bajo el hielo
    }
    return cacheSprite(floors,map,canvas);
  }
  rect(c, parking ? '#121822' : '#171f24', 0, 0, 1920, 1080);
  for (let y = 0; y < 1080; y += 32) for (let x = 0; x < 1920; x += 32) {
    const alternate = ((x + y) / 32) % 2;
    rect(c, parking ? (alternate ? '#1c2432' : '#1f2837') : kitchen ? (alternate ? '#465550' : '#3e4c49') : (alternate ? '#4a5550' : '#394441'), x + 1, y + 1, 31, 31);
    rect(c, parking ? '#38bdf808' : '#ffffff04', x + 3, y + 3, 27, 1);
    if ((x * 3 + y) % 224 === 0) rect(c, '#0a18181a', x + 9, y + 20, 8, 2);
  }
  if (parking) {
    // Líneas de cajones de estacionamiento con brillo neón cian y magenta
    for (let x = 120; x < 1860; x += 140) {
      // Halo neón de las líneas
      rect(c, '#00f0ff22', x - 3, 126, 10, 168);
      rect(c, '#00f0ff', x, 130, 4, 160);
      rect(c, '#ff007f22', x - 3, 746, 10, 228);
      rect(c, '#ff007f', x, 750, 4, 220);
      // Topes de rueda reflectivos
      rect(c, '#0f172a', x + 28, 125, 84, 10);
      rect(c, '#ffe066', x + 34, 127, 24, 4);
      rect(c, '#ffe066', x + 82, 127, 24, 4);
      rect(c, '#0f172a', x + 28, 965, 84, 10);
      rect(c, '#00f0ff', x + 34, 967, 24, 4);
      rect(c, '#00f0ff', x + 82, 967, 24, 4);
    }
    // Carril central con pintura reflectiva dorada neón
    for (let x = 120; x < 1860; x += 70) {
      rect(c, '#ffbe0b24', x - 3, 517, 41, 10);
      rect(c, '#ffbe0b', x, 520, 35, 4);
    }
    // Charcos de asfalto húmedo con reflejos de neón cian, magenta y púrpura
    const puddles = [
      { x: 340, y: 370, rx: 68, ry: 24, col: 'rgba(0, 240, 255, 0.18)' },
      { x: 780, y: 640, rx: 82, ry: 28, col: 'rgba(255, 0, 127, 0.18)' },
      { x: 1180, y: 390, rx: 74, ry: 25, col: 'rgba(168, 85, 247, 0.20)' },
      { x: 1560, y: 670, rx: 64, ry: 22, col: 'rgba(0, 240, 255, 0.18)' },
      { x: 520, y: 840, rx: 58, ry: 20, col: 'rgba(255, 190, 11, 0.16)' },
      { x: 1380, y: 830, rx: 70, ry: 24, col: 'rgba(255, 0, 127, 0.17)' },
    ];
    for (const p of puddles) {
      c.save();
      c.fillStyle = '#090d14cc';
      c.beginPath(); c.ellipse(p.x, p.y, p.rx + 6, p.ry + 3, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = p.col;
      c.beginPath(); c.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#ffffff22'; c.lineWidth = 1.5;
      c.beginPath(); c.ellipse(p.x, p.y, p.rx * 0.7, p.ry * 0.6, 0, 0, Math.PI); c.stroke();
      c.restore();
    }
  }
  rect(c, parking ? '#0d131d' : '#172327', 0, 0, 1920, 80);
  rect(c, parking ? '#162032' : '#253637', 0, 76, 1920, 14);
  rect(c, parking ? '#00f0ff' : '#7b9282', 0, 77, 1920, 3);
  if (parking) rect(c, '#ff007f', 0, 86, 1920, 2);

  for (let x = 8; x < 1920; x += 80) {
    block(c, parking ? '#1e293b' : '#415953', x, 7, 72, 60, 3);
    rect(c, parking ? '#38bdf8' : '#6e8576', x + 4, 10, 64, 5);
    rect(c, '#0f172a', x + 9, 27, 52, 24);
    rect(c, parking ? '#ff007f' : '#73958c', x + 16, 30, 35, 2);
    if ((x - 8) % 160 === 0) {
      rect(c, parking ? '#00f0ff' : '#eecc70', x + 14, 36, 23, 3);
      rect(c, parking ? '#a855f7' : '#839e8c', x + 14, 43, 38, 2);
    } else {
      for (let i = 0; i < 3; i++) {
        rect(c, parking ? '#38bdf8' : '#92b1a4', x + 13 + i * 15, 30, 7, 16);
        rect(c, parking ? '#1e1b4b' : '#536f69', x + 14 + i * 15, 34, 5, 8);
      }
    }
  }
  rect(c, '#1e2c2c', 48, 98, 1824, 4); rect(c, parking ? '#00f0ff55' : '#819e7d40', 48, 102, 1824, 1);
  for (let x = 50; x < 1870; x += 22) rect(c, parking ? ((x / 22) % 2 === 0 ? '#00f0ff' : '#ff007f') : '#d7b76a', x, 1050, 12, 3);
  c.save(); c.globalAlpha = parking ? .16 : .1; c.fillStyle = parking ? '#00f0ff' : '#dbe6c5'; c.font = '900 68px monospace'; c.textAlign = 'center';
  if (parking) { c.shadowColor = '#ff007f'; c.shadowBlur = 18; }
  c.fillText(parking ? 'NEON DELIVERY HUB' : kitchen ? 'COCINA INDUSTRIAL 02' : 'DOMI 24/7 ARCADE', 960, 560);
  c.restore();
  // Guiño a BurgosCorp: sello del fabricante en una baldosa / cajón de estacionamiento, casi invisible
  if (map === 'diner') drawBurgosMark(c, 1838, 1004, 2, 0.22);
  else if (kitchen) drawBurgosMark(c, 70, 1004, 2, 0.2);
  else if (parking) drawBurgosMark(c, 1617, 880, 3, 0.16);
  // Viñeteado fijo de los bordes: se pinta una vez acá en vez de en cada cuadro (se ve igual)
  if (map === 'diner' || map === 'parking') {
    const width = 1920, height = 1080;
    const v = c.createRadialGradient(width / 2, height / 2, height * 0.35, width / 2, height / 2, Math.max(width, height) * 0.72);
    if (map === 'diner') { v.addColorStop(0, 'rgba(0, 0, 0, 0)'); v.addColorStop(0.65, 'rgba(10, 16, 20, 0.24)'); v.addColorStop(1, 'rgba(4, 8, 12, 0.58)'); }
    else { v.addColorStop(0, 'rgba(6, 12, 24, 0.04)'); v.addColorStop(0.65, 'rgba(8, 12, 28, 0.24)'); v.addColorStop(1, 'rgba(3, 6, 16, 0.52)'); }
    c.fillStyle = v; c.fillRect(0, 0, width, height);
  }
  return cacheSprite(floors, map, canvas);
}

export function drawDiner(c, width, height, time, menu, map = 'diner') {
  c.imageSmoothingEnabled = false;
  if (!menu) {
    if (map === 'lava') {
      LAVA_BOARD.draw(c, width, height, time);
      return;
    }
    c.drawImage(dinerFloor(map), 0, 0, width, height);

    // Efectos ambientales animados según el mapa con iluminación y partículas ricas
    if (map === 'snow') {
      c.save();
      // Aurora Boreal dinámica ondulante en el cielo/muro
      for (let a = 0; a < 2; a++) {
        const aGrad = c.createLinearGradient(0, 0, width, 0);
        const shift = time * 0.3 + a * 0.5;
        const alpha = 0.10 + Math.sin(time * 1.5 + a) * 0.04;
        aGrad.addColorStop(0, 'transparent');
        aGrad.addColorStop(Math.max(0.1, Math.min(0.9, 0.35 + Math.sin(shift) * 0.2)), `rgba(56, 189, 248, ${alpha})`);
        aGrad.addColorStop(Math.max(0.1, Math.min(0.9, 0.65 + Math.cos(shift * 1.2) * 0.2)), `rgba(14, 165, 233, ${alpha * 1.1})`);
        aGrad.addColorStop(1, 'transparent');
        c.fillStyle = aGrad;
        c.fillRect(0, 5 + a * 32, width, 85);
      }

      // Conos de luz dinámica azulada desde los faroles del muro
      for (const lx of [160, 540, 960, 1380, 1760]) {
        if (lx < width + 100) {
          const lGrad = c.createRadialGradient(lx + 40, 78, 5, lx + 40, 150, 120);
          const flicker = 0.14 + Math.sin(time * 3 + lx) * 0.03;
          lGrad.addColorStop(0, `rgba(224, 242, 254, ${flicker})`);
          lGrad.addColorStop(0.5, `rgba(56, 189, 248, ${flicker * 0.5})`);
          lGrad.addColorStop(1, 'transparent');
          c.fillStyle = lGrad;
          c.beginPath();
          c.moveTo(lx + 20, 78);
          c.lineTo(lx + 60, 78);
          c.lineTo(lx + 105, 230);
          c.lineTo(lx - 25, 230);
          c.closePath();
          c.fill();
        }
      }

      // Ventisca de nieve optimizada en capas
      for (let i = 0; i < 48; i++) {
        const speedX = 45 + (i % 5) * 18;
        const speedY = 32 + (i % 4) * 12;
        const x = ((i * 137 + time * speedX) % width);
        const y = ((i * 89 + time * speedY) % (height - 90)) + 90;
        const size = (i % 4 === 0) ? 3 : 2;
        c.fillStyle = (i % 3 === 0) ? '#ffffff' : '#bae6fd';
        c.globalAlpha = 0.45 + Math.sin(time * 2.5 + i) * 0.25;
        c.fillRect(Math.round(x), Math.round(y), size, size);
      }
      // Ráfagas de viento helado
      c.strokeStyle = '#bae6fd99'; c.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const y = 130 + (i * 113 + time * 30) % (height - 200);
        const x = ((i * 241 + time * 95) % width);
        c.globalAlpha = 0.22 + Math.sin(time * 1.8 + i) * 0.1;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + 75 + (i % 3) * 35, y); c.stroke();
      }
      // Brillos y destellos de escarcha azulada en el suelo
      for (let i = 0; i < 8; i++) {
        const gx = (i * 235 + 70) % width, gy = 150 + (i * 113) % (height - 220);
        const twinkle = Math.max(0, Math.sin(time * 4 + i * 1.7));
        if (twinkle > 0.4) {
          c.fillStyle = '#f0f9ff';
          c.globalAlpha = twinkle * 0.7;
          c.fillRect(Math.round(gx), Math.round(gy), 2, 2);
        }
        const glow = c.createRadialGradient(gx, gy, 0, gx, gy, 100);
        glow.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
        glow.addColorStop(1, 'transparent');
        c.fillStyle = glow; c.fillRect(gx - 100, gy - 100, 200, 200);
      }
      c.restore();
    } else if (map === 'desert') {
      c.save();
      // Tormenta de arena optimizada
      for (let i = 0; i < 40; i++) {
        const x = ((i * 163 + time * (65 + (i % 4) * 22)) % width);
        const y = 110 + ((i * 107 + time * (16 + (i % 3) * 9)) % (height - 140));
        c.fillStyle = (i % 2 === 0) ? '#f4c57c' : '#ffdca0';
        c.globalAlpha = 0.3 + Math.sin(time * 1.8 + i) * 0.18;
        c.fillRect(Math.round(x), Math.round(y), 3 + (i % 3) * 2, 2);
      }
      // Ondas de calor
      c.strokeStyle = '#ffdd9933'; c.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const y = 200 + i * 140;
        const offset = Math.sin(time * 2.2 + i * 1.4) * 16;
        c.beginPath(); c.moveTo(0, y + offset);
        c.bezierCurveTo(width * 0.33, y - offset, width * 0.66, y + offset, width, y - offset);
        c.stroke();
      }
      c.restore();
    } else if (map === 'football') {
      c.save();
      // Focos de estadio
      for (let i = 0; i < 6; i++) {
        const cx = [160, 520, 880, 1240, 1600, 1820][i], cy = 45;
        const pulse = 0.12 + Math.sin(time * 3.2 + i * 1.3) * 0.04;
        const cone = c.createRadialGradient(cx, cy, 10, cx, cy + 180, 320);
        cone.addColorStop(0, `rgba(255, 252, 220, ${pulse * 1.4})`);
        cone.addColorStop(0.5, `rgba(180, 245, 220, ${pulse * 0.5})`);
        cone.addColorStop(1, 'transparent');
        c.fillStyle = cone;
        c.beginPath();
        c.moveTo(cx - 30, cy);
        c.lineTo(cx + 30, cy);
        c.lineTo(cx + 220, cy + 500);
        c.lineTo(cx - 220, cy + 500);
        c.closePath();
        c.fill();
      }
      // Confeti optimizado
      for (let i = 0; i < 22; i++) {
        const fx = ((i * 149 + time * 28) % width);
        const fy = 100 + ((i * 93 + time * 38) % (height - 180));
        c.fillStyle = ['#4ade80', '#38bdf8', '#ffbe3b', '#f43f5e', '#ffffff'][i % 5];
        c.globalAlpha = 0.5 + Math.sin(time * 3 + i) * 0.25;
        c.fillRect(Math.round(fx), Math.round(fy), 3, 3);
      }
      c.restore();
    } else if (map === 'kitchen') {
      c.save();
      // EFECTO "SE CORTÓ LA LUZ" / BLACKOUT ATMOSFÉRICO:
      c.fillStyle = 'rgba(5, 12, 16, 0.75)';
      c.fillRect(0, 0, width, height);

      for (let i = 0; i < 4; i++) {
        const lx = [280, 800, 1320, 1720][i];
        const ly = 130;
        const flicker = 0.12 + Math.sin(time * 8 + i * 2.3) * 0.04;
        const lamp = c.createRadialGradient(lx, ly, 10, lx, ly + 90, 220);
        lamp.addColorStop(0, `rgba(56, 189, 248, ${flicker * 1.6})`);
        lamp.addColorStop(0.5, `rgba(16, 185, 129, ${flicker * 0.5})`);
        lamp.addColorStop(1, 'transparent');
        c.fillStyle = lamp;
        c.fillRect(lx - 220, ly - 50, 440, 360);
      }

      for (let i = 0; i < 18; i++) {
        const sx = ((i * 179 + time * (18 + (i % 3) * 12)) % width);
        const sy = height - 90 - ((i * 61 + time * (40 + (i % 3) * 18)) % 240);
        c.fillStyle = (i % 2 === 0) ? '#ff4500' : '#ffaa00';
        c.globalAlpha = 0.8 + Math.sin(time * 7 + i) * 0.2;
        c.fillRect(Math.round(sx), Math.round(sy), 3, 3);
      }
      c.restore();
    } else if (map === 'parking') {
      c.save();
      // 1. Atmósfera nocturna synthwave
      // (el viñeteado nocturno ya viene horneado en la imagen del piso)

      // 2. Farolas de neón superiores optimizadas
      const neonLamps = [
        { x: 200, color: '0, 240, 255', hex: '#00f0ff' },
        { x: 580, color: '255, 0, 127', hex: '#ff007f' },
        { x: 960, color: '168, 85, 247', hex: '#a855f7' },
        { x: 1340, color: '0, 240, 255', hex: '#00f0ff' },
        { x: 1720, color: '255, 190, 11', hex: '#ffbe0b' }
      ];
      for (let i = 0; i < neonLamps.length; i++) {
        const nl = neonLamps[i];
        const pulse = 0.16 + Math.sin(time * 3.4 + i * 1.5) * 0.035;

        // Cono de luz neón desde el muro superior
        const cone = c.createLinearGradient(nl.x, 78, nl.x, 380);
        cone.addColorStop(0, `rgba(${nl.color}, ${pulse * 1.5})`);
        cone.addColorStop(0.5, `rgba(${nl.color}, ${pulse * 0.55})`);
        cone.addColorStop(1, 'transparent');
        c.fillStyle = cone;
        c.beginPath();
        c.moveTo(nl.x - 26, 78);
        c.lineTo(nl.x + 26, 78);
        c.lineTo(nl.x + 185, 380);
        c.lineTo(nl.x - 185, 380);
        c.closePath();
        c.fill();

        // Tubo de neón brillante en la cornisa
        c.fillStyle = nl.hex;
        c.fillRect(nl.x - 26, 74, 52, 4);
      }

      // 3. Partículas de neón optimizadas (38 partículas nítidas y livianas)
      const neonPalette = ['#00f0ff', '#ff007f', '#ffe066', '#a855f7', '#38ef7d'];
      for (let i = 0; i < 38; i++) {
        const speedX = 18 + (i % 5) * 9;
        const speedY = -22 - (i % 4) * 11;
        const px = ((i * 157 + time * speedX + Math.sin(time * 2 + i) * 14) % width);
        const py = 95 + ((i * 97 - time * speedY) % (height - 120));
        const col = neonPalette[i % neonPalette.length];
        const size = (i % 5 === 0) ? 3 : 2;
        const alpha = 0.4 + Math.sin(time * 4.2 + i * 1.3) * 0.3;

        c.fillStyle = col;
        c.globalAlpha = Math.max(0.12, alpha);
        c.fillRect(Math.round(px), Math.round(py), size, size);
      }
      c.restore();
    } else if (map === 'beach') {
      c.save();
      // 1. OLAS ANIMADAS EN LA ORILLA (suben y bajan sobre la arena dorada)
      const tide = Math.sin(time * 1.8);
      const tideOffset = tide * 22; // Avance y retroceso de 22 px de la marea

      // Capa de agua translúcida que cubre la arena mojada
      for (let x = 0; x < width; x += 8) {
        const coastBaseY = 380 + Math.sin(x / 140) * 18 + Math.sin(x / 45) * 6;
        const waveFrontY = coastBaseY + tideOffset + Math.sin(x / 60 + time * 2.2) * 8;

        // Lámina de agua poco profunda que se extiende sobre la arena
        c.fillStyle = '#22d3ee55';
        c.fillRect(x, 340, 8, Math.max(0, waveFrontY - 340));

        // Franja de espuma blanca y cian en la rompiente
        const foamWidth = 12 + Math.sin(x / 25 + time * 3) * 6;
        c.fillStyle = '#ffffff';
        c.fillRect(x, waveFrontY - foamWidth, 8, 5);
        c.fillStyle = '#cffafe';
        c.fillRect(x, waveFrontY - foamWidth + 5, 8, 4);
        c.fillStyle = '#a5f3fc88';
        c.fillRect(x, waveFrontY - foamWidth + 9, 8, 4);

        // Burbujitas efímeras de espuma dejadas atrás cuando la ola retrocede
        if (tide < 0) {
          const recedeFade = -tide * 0.7;
          c.fillStyle = `rgba(255, 255, 255, ${recedeFade})`;
          if ((x / 8) % 3 === 0) {
            c.fillRect(x + 2, coastBaseY + 12, 4, 3);
            c.fillRect(x + 4, coastBaseY + 18, 3, 2);
          }
        }
      }

      // Olas secundarias ondeantes en el mar abierto
      for (let w = 0; w < 4; w++) {
        const waveY = 140 + w * 58 + ((time * (20 + w * 6)) % 70);
        c.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        c.lineWidth = 2.5;
        c.beginPath();
        for (let x = 0; x < width; x += 20) {
          const y = waveY + Math.sin(x / 80 + time * 2 + w) * 6;
          if (x === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
      }

      // 2. DESTELLOS DE SOL EN EL MAR (Sparkles titilantes sobre el agua turquesa)
      for (let i = 0; i < 24; i++) {
        const sx = ((i * 157 + time * 12) % width);
        const sy = 95 + ((i * 67 + Math.sin(time + i) * 15) % 250);
        const sparkle = Math.max(0, Math.sin(time * 4.5 + i * 2.1));
        if (sparkle > 0.3) {
          c.fillStyle = '#ffffff';
          c.globalAlpha = sparkle * 0.85;
          c.fillRect(Math.round(sx), Math.round(sy), 3, 3);
          c.fillStyle = '#fef08a';
          c.fillRect(Math.round(sx) - 1, Math.round(sy) + 1, 5, 1);
          c.fillRect(Math.round(sx) + 1, Math.round(sy) - 1, 1, 5);
        }
      }

      // 3. BRISA MARINA Y MOTAS DORADAS FLOTANDO EN LA ARENA
      for (let i = 0; i < 30; i++) {
        const bx = ((i * 127 + time * (55 + (i % 4) * 20)) % width);
        const by = 120 + ((i * 83 + time * 14) % (height - 180));
        const alpha = 0.35 + Math.sin(time * 2.5 + i) * 0.2;
        c.globalAlpha = alpha;
        c.fillStyle = (i % 3 === 0) ? '#ffffff' : (i % 3 === 1) ? '#67e8f9' : '#fde047';
        c.fillRect(Math.round(bx), Math.round(by), (i % 2 === 0 ? 3 : 2), 2);
      }
      c.restore();
    } else {
      // Diner clásico (Local DOMI): Iluminación retro inmersiva optimizada
      c.save();
      // (el viñeteado de los bordes ya viene horneado en la imagen del piso)

      // Resplandor del letrero de neón DOMI
      const neonGlow = c.createRadialGradient(width / 2, 70, 10, width / 2, 70, 300);
      const neonPulse = 0.16 + Math.sin(time * 3.5) * 0.035;
      neonGlow.addColorStop(0, `rgba(255, 90, 80, ${neonPulse * 1.3})`);
      neonGlow.addColorStop(0.4, `rgba(255, 170, 80, ${neonPulse * 0.55})`);
      neonGlow.addColorStop(1, 'transparent');
      c.fillStyle = neonGlow;
      c.fillRect(width / 2 - 300, 0, 600, 200);

      // 4 lámparas clave en lugar de 8 para máximo rendimiento
      const lampPositions = [
        { x: 300, y: 78, floorY: 200, r: 210 },
        { x: 800, y: 78, floorY: 200, r: 210 },
        { x: 1120, y: 78, floorY: 200, r: 210 },
        { x: 1620, y: 78, floorY: 200, r: 210 }
      ];

      for (let i = 0; i < lampPositions.length; i++) {
        const { x: lx, y: ly, floorY, r } = lampPositions[i];
        const lampFlicker = 0.12 + Math.sin(time * 2.2 + i * 1.7) * 0.02;

        c.save();
        const coneGrad = c.createLinearGradient(lx, ly, lx, floorY + 40);
        coneGrad.addColorStop(0, `rgba(255, 238, 180, ${lampFlicker * 1.4})`);
        coneGrad.addColorStop(0.4, `rgba(255, 215, 130, ${lampFlicker * 0.65})`);
        coneGrad.addColorStop(1, 'rgba(255, 190, 90, 0)');
        c.fillStyle = coneGrad;
        c.beginPath();
        c.moveTo(lx - 16, ly);
        c.lineTo(lx + 16, ly);
        c.lineTo(lx + r * 0.7, floorY + 25);
        c.lineTo(lx - r * 0.7, floorY + 25);
        c.closePath();
        c.fill();
        c.restore();

        const poolGrad = c.createRadialGradient(lx, floorY, 10, lx, floorY, r);
        poolGrad.addColorStop(0, `rgba(255, 230, 160, ${lampFlicker * 1.4})`);
        poolGrad.addColorStop(0.4, `rgba(255, 195, 110, ${lampFlicker * 0.7})`);
        poolGrad.addColorStop(1, 'transparent');
        c.fillStyle = poolGrad;
        c.beginPath();
        c.ellipse(lx, floorY, r, r * 0.52, 0, 0, Math.PI * 2);
        c.fill();
      }

      // Motas de polvo dorado sutiles
      for (let i = 0; i < 20; i++) {
        const dx = ((i * 139 + time * 12) % width);
        const dy = 90 + ((i * 83 + Math.sin(time * 1.4 + i) * 16) % (height - 160));
        const alpha = 0.3 + Math.sin(time * 2.5 + i) * 0.2;
        c.fillStyle = (i % 2 === 0) ? '#fff2b2' : '#ffd580';
        c.globalAlpha = Math.max(0.1, alpha);
        c.fillRect(Math.round(dx), Math.round(dy), 2, 2);
      }
      c.restore();
    }
    return;
  }
  rect(c, '#15191c', 0, 0, width, height);
  const mobile = width < 700, scale = mobile ? .42 : Math.min(width / 1100, height / 670);
  const cx = mobile ? width * .28 : width * .76, cy = mobile ? height - 133 : height * .47;
  c.save(); c.translate(cx, cy); c.scale(scale, scale);
  rect(c, '#20282a', -248, -166, 482, 366);
  for (let y = -142; y < 200; y += 26) for (let x = -248; x < 234; x += 26) rect(c, ((x + y) / 26) % 2 ? '#34413c' : '#29342f', x, y, 25, 25);
  rect(c, '#101b20', -248, -182, 482, 82); rect(c, '#657e6c', -248, -102, 482, 4);
  block(c, '#dd665b', -82, -198, 176, 66, 5); rect(c, '#ffb37b', -76, -192, 164, 3);
  c.textAlign = 'center'; c.font = '900 37px monospace'; c.fillStyle = '#ffe4a1'; c.fillText('DOMI', 6, -151);
  c.font = '8px monospace'; c.fillStyle = '#ced4a9'; c.fillText('ABIERTO HASTA EL ULTIMO PEDIDO', 6, -118);
  for (const x of [-218, 141]) {
    block(c, '#2e4942', x, -167, 73, 51); rect(c, '#99b38a', x + 8, -158, 56, 4);
    for (let i = 0; i < 3; i++) { rect(c, '#d4b867', x + 9, -146 + i * 8, 27, 2); rect(c, '#75876c', x + 42, -146 + i * 8, 14, 2); }
  }
  for (const x of [-222, 191]) {
    block(c, '#833e42', x, -38, 36, 107, 4); rect(c, '#d86c65', x + 5, -32, 26, 11);
    block(c, '#d8d3ac', x - 10, 89, 56, 31, 3); rect(c, '#748d7d', x - 7, 115, 50, 6);
  }
  for (let x = -220; x < 230; x += 30) rect(c, '#ccaa57', x, 190, 15, 3);
  drawFood(c, 'burger', 134, -46, 1.18, time, true); drawFood(c, 'soda', -126, -45, .97, time + .6, true);
  drawFood(c, 'fries', 133, 105, 1.02, time + 1.4, true); drawFood(c, 'pancho', -9, 36, 2.55, time);
  drawWeapon(c, 'fork', 62, 29, 2.0, .32 + Math.sin(time * 1.6) * .06);
  for (let i = 0; i < 7; i++) rect(c, i % 2 ? '#bada91' : '#ffd461', -160 + (i * 97) % 330, 106 + Math.sin(time * 1.7 + i) * 9, 3, 3);
  c.restore();
}
