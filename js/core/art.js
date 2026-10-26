import { createAnimatedGif } from './animatedGif.js';
export const domiGifImage = createAnimatedGif('./don domi.gif');
const INK = '#161c20';
const sprites = new Map();
const floors = new Map();
function rect(c, color, x, y, w, h) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); }
function block(c, color, x, y, w, h, edge = 2) {
  rect(c, INK, x + edge, y, w - edge * 2, h); rect(c, INK, x, y + edge, w, h - edge * 2);
  rect(c, color, x + edge, y + edge, w - edge * 2, h - edge * 2);
}

// Cache native-resolution pixel sprites; enlarge only with nearest-neighbor filtering.
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
    sprites.set(key, flashCanvas);
    return flashCanvas;
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
  } else {
    block(c, kind === 'empanada' ? '#e7ba6e' : '#c68c44', 9, 17, 48, 40, 7);
    rect(c, '#f8d28b', 17, 20, 30, 5); rect(c, '#e4aa52', 14, 27, 6, 22);
    for (let i = 0; i < 7; i++) rect(c, '#a6693c', 17 + (i * 11) % 32, 27 + (i * 7) % 25, 3, 3);
    if (kind === 'empanada') for (let i = 0; i < 7; i++) rect(c, '#a87144', 11 + i * 6, 51, 3, 4);
  }
  if (kind !== 'lava_boss') {
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

  sprites.set(key, sprite); return sprite;
}

export function drawFood(c, kind, x, y, scale = 1, time = 0, enemy = false, flash = false) {
  const bob = Math.round(Math.sin(time * 7 + x * .05) * 1.5);
  c.save(); c.imageSmoothingEnabled = false;
  const isColossus = kind === 'lava_boss';
  const groundGlow = c.createRadialGradient(x, y + 23 * scale, 3 * scale, x, y + 23 * scale, (isColossus ? 48 : 28) * scale);
  groundGlow.addColorStop(0, isColossus ? 'rgba(255, 34, 0, 0.55)' : enemy ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 211, 238, 0.2)');
  groundGlow.addColorStop(0.45, isColossus ? 'rgba(255, 120, 0, 0.28)' : '#080d1360');
  groundGlow.addColorStop(1, 'transparent');
  c.fillStyle = groundGlow; c.beginPath(); c.ellipse(x, y + 23 * scale, (isColossus ? 48 : 28) * scale, (isColossus ? 16 : 8) * scale, 0, 0, Math.PI * 2); c.fill();

  if (kind === 'domi') {
    if (domiGifImage && domiGifImage.complete && domiGifImage.naturalWidth > 0) {
      if (flash) c.filter = 'brightness(2.5)';
      const w = 52 * scale;
      const h = 54 * scale;
      c.drawImage(domiGifImage, Math.round(x - w / 2), Math.round(y - h / 2 - 4 + bob), w, h);
      c.restore();
      return;
    }
  }

  c.drawImage(foodSprite(kind, enemy, flash), Math.round(x - 32 * scale), Math.round(y - 36 * scale + bob), 64 * scale, 72 * scale);
  c.restore();
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

function footballFloor(c) {
  // 1. Gradas synthwave y marco de estadio
  rect(c,'#050b17',0,0,1920,84);
  rect(c,'#1a1030',0,55,1920,29);
  rect(c,'#38bdf8',0,78,1920,6);
  rect(c,'#0284c7',0,84,1920,4);

  // Butacas y tableros electrónicos lejanos
  for(let x=18;x<1900;x+=36){
    rect(c,x%72?'#ffcf62':'#4df8dc',x,65,18,5);
    rect(c,'#4e2e75',x+3,53,12,5);
    rect(c,x%72?'#5f397f':'#382456',x,12+(x/36%3)*9,29,7);
  }
  for(const x of [180, 780, 1380]){
    block(c,'#142c3c',x,12,120,34,3);
    rect(c,'#ffe272',x+12,22,34,4);
    rect(c,'#61f6df',x+60,22,46,4);
  }

  // 2. Campo de Juego (Césped profesional con franjas verticales simétricas de corte)
  const pitchX = 64, pitchY = 112, pitchW = 1792, pitchH = 936;
  const stripeW = 64;
  const grassLight = '#1e753f';
  const grassDark = '#176033';

  // Borde exterior / pista de respeto
  rect(c, '#0c2419', 0, 88, 1920, 992);
  rect(c, '#091c13', pitchX - 8, pitchY - 8, pitchW + 16, pitchH + 16);

  // Franjas de corte de césped
  for (let x = pitchX; x < pitchX + pitchW; x += stripeW) {
    const isEven = Math.floor((x - pitchX) / stripeW) % 2 === 0;
    const w = Math.min(stripeW, (pitchX + pitchW) - x);
    rect(c, isEven ? grassLight : grassDark, x, pitchY, w, pitchH);
    // Microtextura de corte
    rect(c, isEven ? '#24874933' : '#10492633', x + 2, pitchY, 2, pitchH);
  }

  // Textura suave de briznas
  c.fillStyle = 'rgba(255, 255, 255, 0.025)';
  for (let y = pitchY + 16; y < pitchY + pitchH; y += 32) {
    c.fillRect(pitchX, y, pitchW, 2);
  }

  // 3. Líneas de cal reglamentarias nítidas (Blanco tiza con sutil relieve)
  c.save();
  c.strokeStyle = '#f8ffea';
  c.lineWidth = 4;
  c.lineCap = 'square';
  c.lineJoin = 'miter';

  // Perímetro del terreno de juego
  c.strokeRect(pitchX, pitchY, pitchW, pitchH);

  // Línea de medio campo
  const midX = pitchX + pitchW / 2;
  const midY = pitchY + pitchH / 2;
  c.beginPath();
  c.moveTo(midX, pitchY);
  c.lineTo(midX, pitchY + pitchH);
  c.stroke();

  // Círculo central y punto de saque inicial
  c.beginPath();
  c.arc(midX, midY, 116, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = '#f8ffea';
  c.beginPath();
  c.arc(midX, midY, 6, 0, Math.PI * 2);
  c.fill();

  // Áreas Grandes (Penal) - 270 x 480 px
  const boxW = 270, boxH = 480, boxY = midY - boxH / 2;
  // Área Penal Izquierda
  c.strokeRect(pitchX, boxY, boxW, boxH);
  // Área Penal Derecha
  c.strokeRect(pitchX + pitchW - boxW, boxY, boxW, boxH);

  // Áreas Chicas (Meta) - 100 x 240 px
  const goalBoxW = 100, goalBoxH = 240, goalBoxY = midY - goalBoxH / 2;
  // Área Chica Izquierda
  c.strokeRect(pitchX, goalBoxY, goalBoxW, goalBoxH);
  // Área Chica Derecha
  c.strokeRect(pitchX + pitchW - goalBoxW, goalBoxY, goalBoxW, goalBoxH);

  // Puntos de Penal
  const penDist = 200;
  const penLeftX = pitchX + penDist;
  const penRightX = pitchX + pitchW - penDist;
  c.fillStyle = '#f8ffea';
  c.beginPath(); c.arc(penLeftX, midY, 5, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(penRightX, midY, 5, 0, Math.PI * 2); c.fill();

  // Medialunas del área penal (Arcos fuera del área grande)
  c.beginPath();
  c.arc(penLeftX, midY, 96, -0.92, 0.92, false);
  c.stroke();
  c.beginPath();
  c.arc(penRightX, midY, 96, Math.PI - 0.92, Math.PI + 0.92, false);
  c.stroke();

  // Arcos de Tiro de Esquina (Córner) en las 4 esquinas
  const cornerR = 26;
  // Superior Izquierda
  c.beginPath(); c.arc(pitchX, pitchY, cornerR, 0, Math.PI / 2); c.stroke();
  // Inferior Izquierda
  c.beginPath(); c.arc(pitchX, pitchY + pitchH, cornerR, -Math.PI / 2, 0); c.stroke();
  // Superior Derecha
  c.beginPath(); c.arc(pitchX + pitchW, pitchY, cornerR, Math.PI / 2, Math.PI); c.stroke();
  // Inferior Derecha
  c.beginPath(); c.arc(pitchX + pitchW, pitchY + pitchH, cornerR, Math.PI, Math.PI * 1.5); c.stroke();

  // 4. Banderines de esquina pixel art
  const corners = [
    [pitchX, pitchY], [pitchX, pitchY + pitchH],
    [pitchX + pitchW, pitchY], [pitchX + pitchW, pitchY + pitchH]
  ];
  for (const [bx, by] of corners) {
    // Poste blanco
    c.fillStyle = '#ffffff';
    c.fillRect(bx - 1, by - 14, 2, 14);
    // Banderín dorado ondeante
    c.fillStyle = '#fde047';
    c.beginPath();
    c.moveTo(bx, by - 14);
    c.lineTo(bx + (bx < midX ? 8 : -8), by - 10);
    c.lineTo(bx, by - 6);
    c.closePath();
    c.fill();
  }

  // 5. Porterías (Arcos) 3D Pixel Art
  const netH = 190, netDepth = 36;
  const netY = midY - netH / 2;

  // Portería Izquierda
  c.fillStyle = '#061a1299';
  c.fillRect(pitchX - netDepth, netY + 4, netDepth, netH);
  // Red cuadriculada
  c.strokeStyle = '#cbd5e166';
  c.lineWidth = 1;
  for (let gy = netY; gy <= netY + netH; gy += 12) {
    c.beginPath(); c.moveTo(pitchX - netDepth, gy); c.lineTo(pitchX, gy); c.stroke();
  }
  for (let gx = pitchX - netDepth; gx <= pitchX; gx += 10) {
    c.beginPath(); c.moveTo(gx, netY); c.lineTo(gx, netY + netH); c.stroke();
  }
  // Postes y Travesaño blancos
  c.strokeStyle = '#ffffff';
  c.lineWidth = 5;
  c.strokeRect(pitchX - netDepth, netY, netDepth, netH);
  c.beginPath();
  c.moveTo(pitchX, netY); c.lineTo(pitchX, netY + netH); c.stroke();

  // Portería Derecha
  c.fillStyle = '#061a1299';
  c.fillRect(pitchX + pitchW, netY + 4, netDepth, netH);
  c.strokeStyle = '#cbd5e166';
  c.lineWidth = 1;
  for (let gy = netY; gy <= netY + netH; gy += 12) {
    c.beginPath(); c.moveTo(pitchX + pitchW, gy); c.lineTo(pitchX + pitchW + netDepth, gy); c.stroke();
  }
  for (let gx = pitchX + pitchW; gx <= pitchX + pitchW + netDepth; gx += 10) {
    c.beginPath(); c.moveTo(gx, netY); c.lineTo(gx, netY + netH); c.stroke();
  }
  c.strokeStyle = '#ffffff';
  c.lineWidth = 5;
  c.strokeRect(pitchX + pitchW, netY, netDepth, netH);
  c.beginPath();
  c.moveTo(pitchX + pitchW, netY); c.lineTo(pitchX + pitchW, netY + netH); c.stroke();

  c.restore();
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
          col = [rock[i * 3], rock[i * 3 + 1], rock[i * 3 + 2]];
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

function dinerFloor(map = 'diner') {
  if (floors.has(map)) return floors.get(map);
  const canvas = document.createElement('canvas'); canvas.width = 1920; canvas.height = 1080;
  const c = canvas.getContext('2d'); const parking = map === 'parking', kitchen = map === 'kitchen';
  if(map==='football'){footballFloor(c);floors.set(map,canvas);return canvas;}
  if(map==='lava'){lavaFloor(c);floors.set(map,canvas);return canvas;}
  if(['snow','desert'].includes(map)){
    const colors=map==='snow'?['#275574','#35688a']:map==='desert'?['#bb8149','#c99355']:['#3c965b','#48a867'];
    for(let y=0;y<1080;y+=32)for(let x=0;x<1920;x+=32){rect(c,colors[(x/32+y/32)%2],x,y,32,32);rect(c,map==='snow'?'#7dd3fc1c':'#ffffff0b',x+2,y+2,28,2);}
    if(map==='snow'){
      for(let i=0;i<160;i++){const x=(i*179)%1920,y=108+(i*91)%920;rect(c,i%2?'#bae6fd':'#e0f2fe',x,y,5,3);rect(c,'#38bdf8',x+1,y+1,2,1);}
      rect(c,'#38bdf8',0,80,1920,3);
      rect(c,'#0d1e2b',0,0,1920,84);rect(c,'#173850',0,76,1920,8);
      for(let x=0;x<1920;x+=64){block(c,x%128?'#1c3d55':'#163246',x+2,5,60,31,2);block(c,'#122839',x+18,40,60,31,2);rect(c,'#38bdf866',x+8,9,38,3);}
      for(const x of [160,540,960,1380,1760]){rect(c,'#e0f2fe',x,72,80,5);rect(c,'#38bdf8',x+8,77,64,3);}
    }else{
      for(let i=0;i<100;i++){const x=(i*191)%1920,y=110+(i*73)%920;rect(c,'#e8b975',x,y,10,2);}
      rect(c,'#75462f',0,0,1920,84);rect(c,'#bf7b47',0,76,1920,8);
      for(let x=0;x<1920;x+=72){block(c,x%144?'#a9633d':'#995738',x+3,7,67,30,3);block(c,'#8c4d34',x+25,42,67,29,3);}
      for(const x of [180,680,1200,1680]){rect(c,'#522f2b',x,18,92,34);rect(c,'#e1a958',x+6,24,80,5);rect(c,'#70402f',x+12,34,68,12);}
    }
    floors.set(map,canvas);return canvas;
  }
  rect(c, parking ? '#121822' : '#171f24', 0, 0, 1920, 1080);
  for (let y = 0; y < 1080; y += 32) for (let x = 0; x < 1920; x += 32) {
    const alternate = ((x + y) / 32) % 2;
    rect(c, parking ? (alternate ? '#1c2432' : '#1f2837') : kitchen ? (alternate ? '#465550' : '#3e4c49') : (alternate ? '#4a5550' : '#394441'), x + 1, y + 1, 31, 31);
    rect(c, parking ? '#38bdf808' : '#ffffff04', x + 3, y + 3, 27, 1);
    if ((x * 3 + y) % 224 === 0) rect(c, '#0a18181a', x + 9, y + 20, 8, 2);
  }
  if (parking) {
    // 1. Siluetas de rascacielos lejanos en el horizonte nocturno (fondo detallado)
    const skyline = [
      { x: 30, w: 90, h: 68, col: '#09111e' },
      { x: 135, w: 75, h: 52, col: '#0c1626' },
      { x: 225, w: 120, h: 74, col: '#070d18' },
      { x: 360, w: 85, h: 60, col: '#0a1422' },
      { x: 460, w: 140, h: 76, col: '#050a12' },
      { x: 620, w: 100, h: 62, col: '#0c1626' },
      { x: 735, w: 110, h: 72, col: '#08101c' },
      { x: 860, w: 130, h: 76, col: '#060c16' },
      { x: 1005, w: 95, h: 56, col: '#0a1320' },
      { x: 1115, w: 135, h: 74, col: '#070e18' },
      { x: 1265, w: 115, h: 64, col: '#09121f' },
      { x: 1395, w: 150, h: 76, col: '#050a14' },
      { x: 1560, w: 90, h: 58, col: '#0b1524' },
      { x: 1665, w: 120, h: 70, col: '#080f1b' },
      { x: 1800, w: 95, h: 62, col: '#060c16' }
    ];
    for (const b of skyline) {
      rect(c, b.col, b.x, 76 - b.h, b.w, b.h);
      // Antena con baliza roja / cian en lo alto
      rect(c, '#1e293b', b.x + b.w / 2 - 1, 76 - b.h - 14, 2, 14);
      rect(c, (b.x % 2 === 0) ? '#ff0055' : '#00f0ff', b.x + b.w / 2 - 2, 76 - b.h - 16, 4, 3);
      // Ventanas iluminadas en cuadrícula pixel-art
      for (let wx = b.x + 8; wx < b.x + b.w - 10; wx += 14) {
        for (let wy = 76 - b.h + 8; wy < 70; wy += 12) {
          if ((wx * 3 + wy * 7) % 5 === 0) {
            rect(c, (wx % 2 === 0) ? '#00f0ff55' : '#ff007f55', wx, wy, 4, 5);
          }
        }
      }
    }

    // 2. Cuadrícula en perspectiva sutil sobre el asfalto (evita que se sienta plano)
    c.save();
    c.strokeStyle = '#00f0ff09';
    c.lineWidth = 1;
    for (let x = 60; x <= 1860; x += 120) {
      c.beginPath();
      c.moveTo(x, 100);
      c.lineTo(x + (x - 960) * 0.18, 1060);
      c.stroke();
    }
    c.restore();

    // 3. Rejillas de ventilación metálicas con textura e iluminación subterránea
    const grates = [
      { x: 260, y: 280, w: 74, h: 42 },
      { x: 1620, y: 280, w: 74, h: 42 },
      { x: 620, y: 780, w: 82, h: 46 },
      { x: 1260, y: 780, w: 82, h: 46 }
    ];
    for (const g of grates) {
      rect(c, '#080d14', g.x - 2, g.y - 2, g.w + 4, g.h + 4);
      rect(c, '#162232', g.x, g.y, g.w, g.h);
      rect(c, '#00f0ff44', g.x, g.y, g.w, 2);
      for (let sl = g.x + 8; sl < g.x + g.w - 8; sl += 8) {
        rect(c, '#060a10', sl, g.y + 4, 3, g.h - 8);
        rect(c, '#00f0ff55', sl, g.y + 6, 1, 4);
      }
    }

    // 4. Líneas de cajones de estacionamiento con brillo neón cian y magenta
    for (let x = 120; x < 1860; x += 140) {
      rect(c, '#00f0ff22', x - 3, 126, 10, 168);
      rect(c, '#00f0ff', x, 130, 4, 160);
      rect(c, '#ff007f22', x - 3, 746, 10, 228);
      rect(c, '#ff007f', x, 750, 4, 220);
      // Topes de rueda reflectivos con textura
      rect(c, '#0a101d', x + 28, 125, 84, 10);
      rect(c, '#ffe066', x + 34, 127, 24, 4);
      rect(c, '#ffe066', x + 82, 127, 24, 4);
      rect(c, '#0a101d', x + 28, 965, 84, 10);
      rect(c, '#00f0ff', x + 34, 967, 24, 4);
      rect(c, '#00f0ff', x + 82, 967, 24, 4);
    }

    // 5. Carril central con pintura reflectiva dorada neón
    for (let x = 120; x < 1860; x += 70) {
      rect(c, '#ffbe0b24', x - 3, 517, 41, 10);
      rect(c, '#ffbe0b', x, 520, 35, 4);
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
  if (!parking) {
    c.save();
    c.globalAlpha = .1;
    c.fillStyle = kitchen ? '#b8d5c8' : '#dbe6c5';
    c.font = '900 68px monospace';
    c.textAlign = 'center';
    c.fillText(kitchen ? 'COCINA INDUSTRIAL 02' : 'DOMI 24/7 ARCADE', 960, 560);
    c.restore();
  }
  floors.set(map, canvas); return canvas;
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
      // Confeti festivo (sin puntos rojos, tonos verdes, dorados y cian)
      for (let i = 0; i < 22; i++) {
        const fx = ((i * 149 + time * 28) % width);
        const fy = 100 + ((i * 93 + time * 38) % (height - 180));
        c.fillStyle = ['#4ade80', '#38bdf8', '#ffbe3b', '#22d3ee', '#ffffff'][i % 5];
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
      const nightVignette = c.createRadialGradient(width / 2, height / 2, height * 0.35, width / 2, height / 2, Math.max(width, height) * 0.72);
      nightVignette.addColorStop(0, 'rgba(6, 12, 24, 0.04)');
      nightVignette.addColorStop(0.65, 'rgba(8, 12, 28, 0.24)');
      nightVignette.addColorStop(1, 'rgba(3, 6, 16, 0.52)');
      c.fillStyle = nightVignette;
      c.fillRect(0, 0, width, height);

      // 2. Farolas de neón superiores con halos volumétricos y piscinas de luz en el suelo
      const neonLamps = [
        { x: 200, color: '0, 240, 255', hex: '#00f0ff' },
        { x: 580, color: '255, 0, 127', hex: '#ff007f' },
        { x: 960, color: '168, 85, 247', hex: '#a855f7' },
        { x: 1340, color: '0, 240, 255', hex: '#00f0ff' },
        { x: 1720, color: '255, 190, 11', hex: '#ffbe0b' }
      ];
      for (let i = 0; i < neonLamps.length; i++) {
        const nl = neonLamps[i];
        const pulse = 0.18 + Math.sin(time * 3.4 + i * 1.5) * 0.045;

        // Cono de luz volumétrica intensa
        const cone = c.createLinearGradient(nl.x, 78, nl.x, 390);
        cone.addColorStop(0, `rgba(${nl.color}, ${pulse * 1.8})`);
        cone.addColorStop(0.45, `rgba(${nl.color}, ${pulse * 0.75})`);
        cone.addColorStop(1, 'transparent');
        c.fillStyle = cone;
        c.beginPath();
        c.moveTo(nl.x - 30, 78);
        c.lineTo(nl.x + 30, 78);
        c.lineTo(nl.x + 205, 390);
        c.lineTo(nl.x - 205, 390);
        c.closePath();
        c.fill();

        // Tubo de neón brillante en la cornisa
        c.fillStyle = nl.hex;
        c.fillRect(nl.x - 28, 74, 56, 4);

        // LED indicador parpadeante arriba a la izquierda/derecha para guiar al jugador
        const blink = Math.sin(time * 7 + i * 2) > 0;
        c.fillStyle = blink ? nl.hex : '#0f172a';
        c.fillRect(nl.x - 4, 62, 8, 8);
        if (blink) {
          c.fillStyle = '#ffffff';
          c.fillRect(nl.x - 2, 64, 4, 4);
        }
      }

      // 3. Neblina baja synthwave que recorre el suelo
      const mistShift = Math.sin(time * 0.8) * 120;
      const mistGrad = c.createLinearGradient(0, height - 160, 0, height);
      mistGrad.addColorStop(0, 'transparent');
      mistGrad.addColorStop(0.6, 'rgba(0, 240, 255, 0.05)');
      mistGrad.addColorStop(1, 'rgba(255, 0, 127, 0.06)');
      c.fillStyle = mistGrad;
      c.fillRect(0, height - 160, width, 160);

      // 4. Partículas de neón, chispas y polvo estelar flotante (56 partículas)
      const neonPalette = ['#00f0ff', '#ff007f', '#ffe066', '#a855f7', '#38ef7d', '#ffffff'];
      for (let i = 0; i < 56; i++) {
        const speedX = 16 + (i % 6) * 8;
        const speedY = -20 - (i % 5) * 10;
        const px = ((i * 137 + time * speedX + Math.sin(time * 2.5 + i) * 18 + mistShift * 0.1) % width);
        const py = 95 + ((i * 89 - time * speedY) % (height - 120));
        const col = neonPalette[i % neonPalette.length];
        const size = (i % 6 === 0) ? 3.5 : (i % 3 === 0) ? 2.5 : 2;
        const alpha = 0.35 + Math.sin(time * 4.5 + i * 1.4) * 0.35;

        c.fillStyle = col;
        c.globalAlpha = Math.max(0.12, Math.min(0.9, alpha));
        c.fillRect(Math.round(px), Math.round(py), size, size);
      }
      c.restore();
    } else {
      // Diner clásico (Local DOMI): Iluminación retro inmersiva optimizada
      c.save();
      const vignette = c.createRadialGradient(width / 2, height / 2, height * 0.35, width / 2, height / 2, Math.max(width, height) * 0.72);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.65, 'rgba(10, 16, 20, 0.24)');
      vignette.addColorStop(1, 'rgba(4, 8, 12, 0.58)');
      c.fillStyle = vignette;
      c.fillRect(0, 0, width, height);

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
