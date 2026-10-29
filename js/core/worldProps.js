const INK = '#101b20';
function rect(c, color, x, y, w, h) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function shadow(c, x, y, w = 54, h = 12) { c.save(); c.globalAlpha = .24; c.fillStyle = '#071218'; c.beginPath(); c.ellipse(x, y, w, h, 0, 0, Math.PI * 2); c.fill(); c.restore(); }

function table(c, x, y, tone = '#b95d53', accent = '#edaa6e') {
  shadow(c, x, y + 25, 48, 9); rect(c, INK, x - 42, y - 16, 84, 30); rect(c, tone, x - 38, y - 12, 76, 20); rect(c, accent, x - 31, y - 9, 52, 4); rect(c, '#713f3f', x - 38, y + 4, 76, 10);
  rect(c, '#875044', x - 26, y + 14, 8, 18); rect(c, '#875044', x + 18, y + 14, 8, 18); rect(c, '#d67b65', x - 29, y + 30, 14, 3); rect(c, '#d67b65', x + 15, y + 30, 14, 3);
  c.fillStyle = '#f2d995'; c.beginPath(); c.ellipse(x - 12, y - 3, 11, 4, 0, 0, 7); c.fill(); rect(c, '#77b6a0', x + 14, y - 10, 7, 10); rect(c, '#b6e2c2', x + 15, y - 9, 4, 3);
}

function bench(c, x, y, tone = '#8b614d') {
  shadow(c, x, y + 26, 52, 8); rect(c, INK, x - 48, y - 14, 96, 25); rect(c, tone, x - 44, y - 10, 88, 15); rect(c, '#d59a66', x - 37, y - 7, 72, 3); rect(c, '#65473f', x - 43, y + 5, 86, 8); rect(c, '#604944', x - 34, y + 13, 7, 18); rect(c, '#604944', x + 27, y + 13, 7, 18);
}

function showcase(c, x, y, tone = '#a05255') {
  shadow(c, x, y + 37, 58, 10); rect(c, INK, x - 52, y - 34, 104, 68); rect(c, tone, x - 47, y - 29, 94, 58); rect(c, '#20343a', x - 38, y - 20, 76, 40); rect(c, '#7ed1ba', x - 32, y - 14, 64, 3);
  for (let i = 0; i < 4; i++) { rect(c, ['#ef9b77', '#efd26f', '#91c9a3', '#a8b9e7'][i], x - 30 + i * 19, y - 3, 11, 13); rect(c, '#f8e7ac', x - 28 + i * 19, y - 1, 7, 3); }
  rect(c, '#e2b86d', x - 48, y + 22, 96, 7); rect(c, '#6c4145', x - 39, y + 29, 9, 9); rect(c, '#6c4145', x + 30, y + 29, 9, 9);
}

function machine(c, x, y, tone = '#6e9891') {
  shadow(c, x, y + 31, 39, 8); rect(c, INK, x - 32, y - 32, 64, 58); rect(c, tone, x - 27, y - 27, 54, 48); rect(c, '#243b40', x - 19, y - 18, 38, 21); rect(c, '#f1ce70', x - 13, y - 13, 9, 5); rect(c, '#89e0bd', x + 2, y - 13, 13, 5); rect(c, '#263d42', x - 21, y + 9, 42, 5); for (let i = 0; i < 3; i++) rect(c, '#d9e4c0', x - 20 + i * 13, y + 19, 7, 5);
}

function canopy(c, x, y) {
  shadow(c, x, y + 22, 58, 8); rect(c, '#192b2e', x - 53, y - 25, 106, 18); rect(c, '#d58a56', x - 47, y - 20, 94, 10); for (let i = 0; i < 4; i++) rect(c, i % 2 ? '#f2cf73' : '#e56f63', x - 43 + i * 24, y - 20, 13, 10); rect(c, '#865748', x - 43, y - 7, 6, 34); rect(c, '#865748', x + 37, y - 7, 6, 34); rect(c, '#b9d279', x - 32, y + 5, 64, 9);
}

function scoreboard(c, x, y) {
  shadow(c, x, y + 37, 45, 8); rect(c, INK, x - 43, y - 31, 86, 57); rect(c, '#264a46', x - 37, y - 25, 74, 44); rect(c, '#e8c868', x - 26, y - 15, 19, 15); rect(c, '#e8c868', x + 7, y - 15, 19, 15); rect(c, '#f5edc8', x - 20, y - 11, 7, 7); rect(c, '#f5edc8', x + 13, y - 11, 7, 7); rect(c, '#9dd3ad', x - 27, y + 8, 54, 4); rect(c, '#536d65', x - 30, y + 26, 7, 16); rect(c, '#536d65', x + 23, y + 26, 7, 16);
}

function billboard(c,x,y,label,tone='#ff3f8b') {
  shadow(c,x,y+22,48,7);rect(c,'#050b17',x-50,y-21,100,43);rect(c,'#2a1644',x-46,y-17,92,31);rect(c,tone,x-42,y-13,84,4);
  c.fillStyle='#f8f0d0';c.font='bold 9px monospace';c.textAlign='center';c.fillText(label,x,y+5);rect(c,'#4df8dc',x-34,y+11,68,3);rect(c,'#34435d',x-40,y+22,7,12);rect(c,'#34435d',x+33,y+22,7,12);
}

function floodLight(c,x,y,time) {
  rect(c,'#07111b',x-5,y,12,58);rect(c,'#4b5871',x-2,y+5,5,50);rect(c,'#050913',x-22,y-12,46,22);rect(c,'#a23c89',x-18,y-8,38,14);
  for(let i=0;i<4;i++){const glow=.7+Math.sin(time*3+i)*.18;c.fillStyle=`rgba(190,255,236,${glow})`;c.fillRect(x-15+i*9,y-5,6,7);}
}

function snowPile(c, x, y) {
  shadow(c, x, y + 10, 38, 7); rect(c, '#dff6f4', x - 32, y - 6, 64, 14); rect(c, '#f5ffff', x - 24, y - 13, 42, 10); rect(c, '#ffffff', x - 12, y - 18, 20, 7); rect(c, '#b7dfe2', x - 28, y + 6, 56, 4);
}

function steam(c, x, y, time, color = '#effff0') {
  c.save(); c.globalAlpha = .16; c.strokeStyle = color; c.lineWidth = 2; c.beginPath();
  for (let i = 0; i < 3; i++) { const phase = time * .9 + i * 1.7; const sx = x + i * 6; const sy = y - (time * 18 + i * 15) % 28; c.moveTo(sx, sy + 8); c.quadraticCurveTo(sx + Math.sin(phase) * 5, sy + 2, sx + Math.cos(phase) * 3, sy - 6); }
  c.stroke(); c.restore();
}

function heatHaze(c, x, y, time) {
  c.save(); c.globalAlpha = .16; c.strokeStyle = '#ffe4a0'; c.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const wave = Math.sin(time * 1.8 + i) * 3; c.beginPath(); c.moveTo(x - 30, y + i * 7); c.lineTo(x + wave, y - 4 + i * 7); c.lineTo(x + 30, y + i * 7); c.stroke(); }
  c.restore();
}

function drawPalmTree(c, x, y, time = 0, flipped = false) {
  c.save();
  const dir = flipped ? -1 : 1;
  // Sombra de contacto en la arena
  c.save();
  c.globalAlpha = 0.28;
  c.fillStyle = '#071218';
  c.beginPath();
  c.ellipse(x, y + 12, 42, 14, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // Cocos caídos en la arena cerca del tronco
  const dropCoconut = (cx, cy) => {
    rect(c, '#07121844', cx - 1, cy + 8, 12, 4);
    rect(c, '#451a03', cx, cy, 10, 8);
    rect(c, '#78350f', cx + 1, cy + 1, 8, 6);
    rect(c, '#a16207', cx + 2, cy + 2, 4, 3);
    rect(c, '#1c0a00', cx + 6, cy + 2, 2, 2); // hoyito
  };
  dropCoconut(x + dir * 26, y + 6);
  dropCoconut(x - dir * 18, y + 10);

  // Tronco curvado segmentado pixel art (12 segmentos)
  const segments = 12;
  const topX = x + dir * 42;
  const topY = y - 115;
  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const sx = x + dir * (Math.sin(t * Math.PI * 0.5) * 42);
    const sy = y - t * 115;
    const w = Math.round(18 - t * 6);
    const h = 10;
    // Anillo de corteza con textura
    rect(c, '#1c0a00', sx - w / 2 - 1, sy - h / 2 - 1, w + 2, h + 2);
    rect(c, i % 2 === 0 ? '#78350f' : '#92400e', sx - w / 2, sy - h / 2, w, h);
    rect(c, '#b45309', sx - w / 2 + 2, sy - h / 2 + 1, w - 4, 3);
    rect(c, '#451a03', sx - w / 2, sy + h / 2 - 3, w, 3);
  }

  // Racimo de 4 cocos en la copa (topX, topY)
  const cocos = [
    { ox: -10, oy: 2 },
    { ox: 8, oy: 4 },
    { ox: -2, oy: 12 },
    { ox: 10, oy: 12 }
  ];
  for (const co of cocos) {
    const cx = topX + co.ox * dir;
    const cy = topY + co.oy;
    rect(c, '#1c0a00', cx - 6, cy - 6, 13, 13);
    rect(c, '#54392b', cx - 5, cy - 5, 11, 11);
    rect(c, '#784c38', cx - 3, cy - 4, 7, 5);
    rect(c, '#1c0a00', cx - 2, cy + 1, 2, 2);
    rect(c, '#1c0a00', cx + 2, cy + 1, 2, 2);
    rect(c, '#1c0a00', cx, cy + 3, 2, 2);
  }

  // Copa exuberante de palmera: 8 grandes hojas arqueadas
  const leafAngles = [
    -Math.PI * 0.85, -Math.PI * 0.65, -Math.PI * 0.45, -Math.PI * 0.25,
    -Math.PI * 0.05, Math.PI * 0.15, Math.PI * 0.4, Math.PI * 0.75
  ];
  for (let l = 0; l < leafAngles.length; l++) {
    const baseAngle = leafAngles[l];
    const sway = Math.sin(time * 2 + l * 0.8) * 0.08;
    const angle = baseAngle + sway;
    const len = 52 + (l % 3) * 8;

    // Tallo y frondas de la hoja
    for (let step = 0; step < 7; step++) {
      const st = step / 7;
      const lx = topX + Math.cos(angle) * (st * len) * dir;
      const ly = topY + Math.sin(angle) * (st * len) + Math.pow(st, 2) * 18; // arco hacia abajo
      const leafW = Math.round(Math.sin(st * Math.PI) * 14);

      // Frondas verdes con luz y sombra
      rect(c, '#14532d', lx - leafW / 2 - 1, ly - 3, leafW + 2, 6);
      rect(c, '#16a34a', lx - leafW / 2, ly - 2, leafW, 4);
      rect(c, '#22c55e', lx - leafW / 4, ly - 2, leafW / 2, 2);
      if (st > 0.4 && st < 0.8) {
        rect(c, '#86efac', lx - 2, ly - 2, 4, 1); // brillo
      }
    }
  }

  c.restore();
}

function beachUmbrella(c, x, y, col1 = '#ef4444', col2 = '#ffffff') {
  // Sombra amplia inclinada
  shadow(c, x + 16, y + 26, 48, 14);
  // Poste de madera clavado
  rect(c, '#1c0a00', x - 2, y - 28, 6, 56);
  rect(c, '#b45309', x - 1, y - 26, 4, 52);
  rect(c, '#fef08a', x, y - 26, 2, 52);

  // Toldo de sombrilla en ángulo (gajos alternados de colores vivos)
  const segments = [col1, col2, col1, col2, col1, col2];
  const w = 92, h = 34;
  rect(c, '#101b20', x - w / 2 - 2, y - 48 - 2, w + 4, h + 4);
  for (let i = 0; i < segments.length; i++) {
    const sw = w / segments.length;
    const sx = x - w / 2 + i * sw;
    rect(c, segments[i], sx, y - 48, sw, h);
    // Borde festoneado inferior
    rect(c, segments[i], sx + 1, y - 14, sw - 2, 4);
    rect(c, '#ffffff44', sx + 2, y - 46, sw - 4, 3);
  }
  // Puntera superior de la sombrilla
  rect(c, '#101b20', x - 3, y - 56, 6, 9);
  rect(c, '#fbbf24', x - 2, y - 55, 4, 7);
}

function beachTowel(c, x, y, col = '#38bdf8') {
  // Toalla de playa tendida con perspectiva
  shadow(c, x, y + 8, 36, 10);
  rect(c, '#101b20', x - 28, y - 14, 56, 28);
  rect(c, col, x - 26, y - 12, 52, 24);
  // Rayas blancas de la toalla
  rect(c, '#ffffff', x - 18, y - 12, 6, 24);
  rect(c, '#ffffff', x + 12, y - 12, 6, 24);
  // Flecos en los extremos
  rect(c, '#ffffff', x - 30, y - 10, 4, 20);
  rect(c, '#ffffff', x + 26, y - 10, 4, 20);

  // Vaso de jugo tropical o coco con pajita
  rect(c, '#101b20', x + 6, y - 6, 10, 14);
  rect(c, '#f97316', x + 7, y - 5, 8, 12);
  rect(c, '#fde047', x + 8, y - 2, 6, 8);
  // Pajita roja
  rect(c, '#ef4444', x + 10, y - 11, 2, 7);
}

function tropicalBush(c, x, y) {
  // Arbusto tropical con flores de hibisco
  shadow(c, x, y + 10, 24, 7);
  rect(c, '#14532d', x - 20, y - 14, 40, 22);
  rect(c, '#16a34a', x - 18, y - 12, 36, 18);
  rect(c, '#22c55e', x - 12, y - 8, 24, 12);

  // 2 flores de hibisco (rojo coral con centro amarillo)
  const flower = (fx, fy) => {
    rect(c, '#ef4444', fx - 4, fy - 4, 8, 8);
    rect(c, '#f43f5e', fx - 3, fy - 3, 6, 6);
    rect(c, '#facc15', fx - 1, fy - 1, 2, 2);
  };
  flower(x - 8, y - 6);
  flower(x + 8, y - 2);
}

/** Decorative depth layer for expanded maps. */
export function drawWorldProps(ctx, map = 'diner', time = 0, world = { width: 1920, height: 1080 }, cam = null) {
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = .94; const shimmer = Math.sin(time * 1.6) * .5 + .5;
  const w = world.width, h = world.height;
  const isVisible = (x, y, radius = 90) => {
    if (!cam) return true;
    return x >= cam.x - radius && x <= cam.x + (cam.w || 960) + radius && y >= cam.y - radius && y <= cam.y + (cam.h || 540) + radius;
  };

  if (map === 'snow') {
    if (isVisible(160, 160)) bench(ctx, 160, 160, '#6f9ca1');
    if (isVisible(w - 160, 160)) bench(ctx, w - 160, 160, '#6f9ca1');
    if (isVisible(160, h - 160)) bench(ctx, 160, h - 160, '#6f9ca1');
    if (isVisible(w - 160, h - 160)) bench(ctx, w - 160, h - 160, '#6f9ca1');
    if (isVisible(180, 240)) snowPile(ctx, 180, 240);
    if (isVisible(w - 180, 240)) snowPile(ctx, w - 180, 240);
    if (isVisible(w / 2 - 200, 160)) snowPile(ctx, w / 2 - 200, 160);
    if (isVisible(w / 2 + 200, 160)) snowPile(ctx, w / 2 + 200, 160);
    ctx.globalAlpha = .55 + shimmer * .15;
    rect(ctx, '#e8ffff', 80, 108, 90, 3); rect(ctx, '#e8ffff', w - 170, 108, 90, 3);
  } else if (map === 'desert') {
    if (isVisible(180, 160)) canopy(ctx, 180, 160);
    if (isVisible(w - 180, 160)) canopy(ctx, w - 180, 160);
    if (isVisible(180, h - 180)) canopy(ctx, 180, h - 180);
    if (isVisible(w - 180, h - 180)) canopy(ctx, w - 180, h - 180);
    if (isVisible(150, 220)) { rect(ctx, '#9a623b', 110, 210, 90, 36); rect(ctx, '#d39a4e', 116, 215, 78, 26); }
    if (isVisible(w - 150, 220)) { rect(ctx, '#9a623b', w - 200, 210, 90, 36); rect(ctx, '#d39a4e', w - 194, 215, 78, 26); }
    if (isVisible(220, 280)) heatHaze(ctx, 220, 280, time);
    if (isVisible(w - 220, 280)) heatHaze(ctx, w - 220, 280, time + .8);
  } else if (map === 'football') {
    if (isVisible(w / 2 - 250, 140)) scoreboard(ctx, w / 2 - 250, 140);
    if (isVisible(w / 2 + 250, 140)) scoreboard(ctx, w / 2 + 250, 140);
    if (isVisible(280, 160)) bench(ctx, 280, 160, '#386c59');
    if (isVisible(w - 280, 160)) bench(ctx, w - 280, 160, '#386c59');
    if (isVisible(350, h - 90)) billboard(ctx, 350, h - 90, 'DOMI COLA');
    if (isVisible(w - 350, h - 90)) billboard(ctx, w - 350, h - 90, 'PANCHO PRO', '#4df8dc');
    if (isVisible(120, 90)) floodLight(ctx, 120, 90, time);
    if (isVisible(w - 120, 90)) floodLight(ctx, w - 120, 90, time + .6);
    if (isVisible(w / 2, 90)) floodLight(ctx, w / 2, 90, time + .3);
  } else if (map === 'kitchen') {
    if (isVisible(200, 170)) showcase(ctx, 200, 170, '#72958e');
    if (isVisible(w - 200, 170)) showcase(ctx, w - 200, 170, '#72958e');
    if (isVisible(220, 280)) machine(ctx, 220, 280, '#72958e');
    if (isVisible(w - 220, 280)) machine(ctx, w - 220, 280, '#72958e');
    if (isVisible(220, h - 220)) machine(ctx, 220, h - 220, '#72958e');
    if (isVisible(w - 220, h - 220)) machine(ctx, w - 220, h - 220, '#72958e');
    if (isVisible(200, 140)) steam(ctx, 200, 140, time, '#d9fff5');
    if (isVisible(w - 200, 140)) steam(ctx, w - 200, 140, time + .6, '#d9fff5');
  } else if (map === 'parking') {
    if (isVisible(200, 170)) machine(ctx, 200, 170, '#1e293b');
    if (isVisible(w - 200, 170)) machine(ctx, w - 200, 170, '#1e293b');
    if (isVisible(200, h - 200)) machine(ctx, 200, h - 200, '#1e293b');
    if (isVisible(w - 200, h - 200)) machine(ctx, w - 200, h - 200, '#1e293b');
    if (isVisible(420, 145)) billboard(ctx, 420, 145, 'NEON DRIVE', '#00f0ff');
    if (isVisible(w - 420, 145)) billboard(ctx, w - 420, 145, 'CYBER DELIVERY', '#ff007f');
    if (isVisible(420, h - 105)) billboard(ctx, 420, h - 105, 'TURBO PANCHO', '#ffbe0b');
    if (isVisible(w - 420, h - 105)) billboard(ctx, w - 420, h - 105, '24H VIP LOT', '#a855f7');
    if (isVisible(120, 95)) floodLight(ctx, 120, 95, time);
    if (isVisible(w - 120, 95)) floodLight(ctx, w - 120, 95, time + 0.7);
    if (isVisible(340, 360)) steam(ctx, 340, 360, time, '#00f0ff');
    if (isVisible(w - 340, 660)) steam(ctx, w - 340, 660, time + 1.1, '#ff007f');
  } else if (map === 'lava') {
    // El tablero pixel-art de lava ya contiene sus propios puentes, islotes, gemas, cráneos y espinas de obsidiana
  } else if (map === 'beach') {
    // Palmeras tropicales grandes en las 4 esquinas y bordes laterales
    if (isVisible(180, 240, 160)) drawPalmTree(ctx, 180, 240, time, false);
    if (isVisible(w - 180, 240, 160)) drawPalmTree(ctx, w - 180, 240, time, true);
    if (isVisible(140, 720, 160)) drawPalmTree(ctx, 140, 720, time, false);
    if (isVisible(w - 140, 720, 160)) drawPalmTree(ctx, w - 140, 720, time, true);
    if (isVisible(420, h - 140, 160)) drawPalmTree(ctx, 420, h - 140, time, false);
    if (isVisible(w - 420, h - 140, 160)) drawPalmTree(ctx, w - 420, h - 140, time, true);

    // Sombrillas de playa retro con toallas
    if (isVisible(w / 2 - 280, 620)) beachUmbrella(ctx, w / 2 - 280, 620, '#ef4444', '#ffffff');
    if (isVisible(w / 2 + 280, 680)) beachUmbrella(ctx, w / 2 + 280, 680, '#06b6d4', '#facc15');

    // Toallas de playa extendidas en la arena
    if (isVisible(w / 2 - 240, 660)) beachTowel(ctx, w / 2 - 240, 660, '#38bdf8');
    if (isVisible(w / 2 + 320, 720)) beachTowel(ctx, w / 2 + 320, 720, '#f43f5e');

    // Arbustos tropicales con flores de hibisco
    if (isVisible(210, 270)) tropicalBush(ctx, 210, 270);
    if (isVisible(w - 210, 270)) tropicalBush(ctx, w - 210, 270);
    if (isVisible(170, 750)) tropicalBush(ctx, 170, 750);
    if (isVisible(w - 170, 750)) tropicalBush(ctx, w - 170, 750);
  } else {
    // Diner clásico: mobiliario con sombras de contacto profundas
    ctx.save();
    ctx.fillStyle = 'rgba(5, 10, 14, 0.42)';
    for (const [tx, ty] of [[220, 170], [w - 220, 170], [220, h - 180], [w - 220, h - 180]]) {
      if (isVisible(tx, ty)) {
        ctx.beginPath();
        ctx.ellipse(tx, ty + 26, 62, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const [sx, sy] of [[450, 150], [w - 450, 150]]) {
      if (isVisible(sx, sy)) {
        ctx.beginPath();
        ctx.ellipse(sx, sy + 38, 72, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    if (isVisible(220, 170)) table(ctx, 220, 170);
    if (isVisible(w - 220, 170)) table(ctx, w - 220, 170);
    if (isVisible(220, h - 180)) table(ctx, 220, h - 180);
    if (isVisible(w - 220, h - 180)) table(ctx, w - 220, h - 180);
    if (isVisible(450, 150)) showcase(ctx, 450, 150);
    if (isVisible(w - 450, 150)) showcase(ctx, w - 450, 150);
    if (isVisible(240, 150)) steam(ctx, 240, 150, time);
    if (isVisible(w - 240, 150)) steam(ctx, w - 240, 150, time + .8);

    ctx.save();
    for (const sx of [450, w - 450]) {
      const showGlow = ctx.createRadialGradient(sx, 160, 10, sx, 165, 85);
      showGlow.addColorStop(0, 'rgba(126, 209, 186, 0.12)');
      showGlow.addColorStop(0.6, 'rgba(248, 231, 172, 0.06)');
      showGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = showGlow;
      ctx.beginPath();
      ctx.ellipse(sx, 165, 85, 35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
