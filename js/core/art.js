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
  const colors=['#11725a','#168966','#1b9c70','#107d67'];
  rect(c,'#081a26',0,0,1920,1080);
  for(let x=0;x<1920;x+=64){rect(c,colors[(x/64)%4],x,84,64,996);rect(c,'#0a5a4e55',x,84,3,996);rect(c,'#4ad69418',x+4,84,3,996);}
  for(let y=96;y<1080;y+=24)rect(c,'#d7ffe908',0,y,1920,2);
  for(let i=0;i<180;i++){const x=(i*173+37)%1880+20,y=103+(i*89)%920;rect(c,i%3?'#075c4a66':'#82c76b55',x,y,4+(i%4)*3,2+(i%2));}

  // Synthwave stands and pitch frame
  rect(c,'#050b17',0,0,1920,84);rect(c,'#20133c',0,55,1920,29);rect(c,'#ff3f8b',0,78,1920,6);rect(c,'#6dfbe7',0,84,1920,3);
  for(let x=18;x<1900;x+=36){rect(c,x%72?'#ffcf62':'#4df8dc',x,65,18,5);rect(c,'#4e2e75',x+3,53,12,5);rect(c,x%72?'#5f397f':'#382456',x,12+(x/36%3)*9,29,7);}
  for(const x of [150,750,1350]){block(c,'#142c3c',x,12,120,34,3);rect(c,'#ffe272',x+12,22,34,4);rect(c,'#61f6df',x+60,22,46,4);}

  // Main Grass Pitch
  rect(c,'#020c1690',37,101,1846,950);rect(c,'#03151c',40,104,1840,944);rect(c,'#62ffb8',44,108,1832,936);rect(c,'#eaffdb',48,112,1824,928);
  for(let x=52;x<1868;x+=64)rect(c,colors[Math.floor(x/64)%4],x,116,Math.min(64,1868-x),920);
  for(let y=126;y<1036;y+=24)rect(c,'#d7ffe908',52,y,1816,2);

  // Pitch markings
  c.strokeStyle='#082d35aa';c.lineWidth=9;c.strokeRect(55,119,1810,920);
  c.strokeStyle='#eaffdc';c.lineWidth=4;c.strokeRect(52,116,1816,926);
  // Halfway line & center circle
  c.beginPath();c.moveTo(960,116);c.lineTo(960,1042);
  c.arc(960,579,110,0,Math.PI*2);c.stroke();
  c.fillStyle='#f4ffe8';c.beginPath();c.arc(960,579,6,0,Math.PI*2);c.fill();

  // Left Goal & Box
  c.strokeRect(52,380,240,400);
  c.strokeRect(52,480,110,200);
  // Right Goal & Box
  c.strokeRect(1628,380,240,400);
  c.strokeRect(1758,480,110,200);

  // Goal nets
  for(const side of [-1,1]){
    const gx=side<0?46:1874;
    c.fillStyle='#03101888';c.fillRect(gx+(side<0?5:-43),485,38,190);
    c.strokeStyle='#f8ffe8';c.lineWidth=4;c.strokeRect(gx+(side<0?0:-34),480,34,200);
    c.strokeStyle='#82ffe655';c.lineWidth=1;
    for(let y=490;y<675;y+=14){c.beginPath();c.moveTo(gx+(side<0?2:-32),y);c.lineTo(gx+(side<0?32:0),y);c.stroke();}
  }
}

function lavaFloor(c) {
  // 1. Base de lecho volcánico profundo (obsidiana y escoria basáltica)
  rect(c, '#090204', 0, 0, 1920, 1080);

  // 2. Losas de basalto fracturadas e irregulares con relieve, sombras proyectadas y micro-fisuras de calor
  const stoneTones = ['#14070a', '#1b0b10', '#230e15', '#17090d', '#1f0c12'];
  for (let y = 84; y < 1080; y += 44) {
    const rowShift = ((y / 44) % 2) * 22;
    for (let x = -24; x < 1920; x += 52) {
      const hash = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453);
      const idx = Math.floor(hash * stoneTones.length) % stoneTones.length;
      const w = 48 + Math.floor((hash * 7) % 5) - 2;
      const h = 40 + Math.floor((hash * 11) % 5) - 2;
      const tx = x + rowShift;

      // Sombra proyectada de la losa sobre la grieta inferior
      rect(c, '#040102', tx + 3, y + 3, w, h);
      // Cuerpo de la losa basáltica
      rect(c, stoneTones[idx], tx + 1, y + 1, w - 2, h - 2);
      // Bisel superior iluminado por reflejo cálido
      rect(c, '#ff662210', tx + 2, y + 2, w - 6, 1.5);
      rect(c, '#050103', tx, y + h - 1, w, 1.5);

      // Grietas irregulares de donde se filtra el calor subterráneo en ciertas losas
      if ((Math.floor(hash * 100) % 4) === 0) {
        c.save();
        c.strokeStyle = '#ff330038';
        c.lineWidth = 3.5;
        c.beginPath();
        c.moveTo(tx + 8, y + 10);
        c.lineTo(tx + w * 0.52, y + h * 0.58);
        c.lineTo(tx + w - 9, y + h * 0.42);
        c.stroke();
        c.strokeStyle = '#ff992288';
        c.lineWidth = 1.2;
        c.stroke();
        c.restore();
      }
    }
  }

  // 2b. Elevaciones rocosas volcánicas y mesetas de basalto con sombras proyectadas profundas
  const volcanicElevations = [
    { x: 340, y: 210, rx: 58, ry: 28 },
    { x: 610, y: 175, rx: 46, ry: 22 },
    { x: 1320, y: 195, rx: 64, ry: 30 },
    { x: 1560, y: 310, rx: 52, ry: 25 },
    { x: 260, y: 510, rx: 62, ry: 32 },
    { x: 520, y: 610, rx: 48, ry: 24 },
    { x: 1380, y: 650, rx: 56, ry: 28 },
    { x: 1680, y: 540, rx: 50, ry: 26 },
    { x: 430, y: 890, rx: 66, ry: 30 },
    { x: 1180, y: 880, rx: 60, ry: 28 },
    { x: 740, y: 280, rx: 42, ry: 20 },
    { x: 1140, y: 290, rx: 45, ry: 22 }
  ];
  for (const el of volcanicElevations) {
    c.save();
    // Sombra proyectada desplazada hacia abajo-derecha
    c.fillStyle = 'rgba(3, 0, 2, 0.78)';
    c.beginPath();
    c.ellipse(el.x + 10, el.y + 12, el.rx * 1.04, el.ry * 1.06, 0.08, 0, Math.PI * 2);
    c.fill();

    // Pared lateral de la elevación rocosa
    c.fillStyle = '#120508';
    c.beginPath();
    c.ellipse(el.x, el.y + 5, el.rx, el.ry, 0, 0, Math.PI * 2);
    c.fill();

    // Superficie superior de la meseta basáltica
    const rockGrad = c.createLinearGradient(el.x - el.rx, el.y - el.ry, el.x + el.rx, el.y + el.ry);
    rockGrad.addColorStop(0, '#2c1219');
    rockGrad.addColorStop(0.6, '#1d0a10');
    rockGrad.addColorStop(1, '#3d1510');
    c.fillStyle = rockGrad;
    c.beginPath();
    c.ellipse(el.x, el.y, el.rx * 0.94, el.ry * 0.88, 0, 0, Math.PI * 2);
    c.fill();

    // Borde iluminado por el magma cercano (rim light naranja/rojizo)
    c.strokeStyle = '#ff551155';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(el.x, el.y, el.rx * 0.94, el.ry * 0.88, 0, 0.15, Math.PI - 0.15);
    c.stroke();
    c.restore();
  }

  // 3. Piscinas de magma hirviendo en los bordes con iluminación sobre las casillas cercanas
  const lavaPools = [
    { x: 180, y: 190, rx: 82, ry: 44 },
    { x: 1740, y: 190, rx: 82, ry: 44 },
    { x: 180, y: 920, rx: 88, ry: 48 },
    { x: 1740, y: 920, rx: 88, ry: 48 },
    { x: 960, y: 980, rx: 118, ry: 54 },
    { x: 960, y: 160, rx: 96, ry: 45 }
  ];
  for (const pool of lavaPools) {
    c.save();
    // Destello amplio de luz cálida que ilumina las baldosas cercanas alrededor de la piscina
    const tileLight = c.createRadialGradient(pool.x, pool.y, pool.rx * 0.3, pool.x, pool.y, pool.rx * 2.35);
    tileLight.addColorStop(0, 'rgba(255, 115, 20, 0.42)');
    tileLight.addColorStop(0.45, 'rgba(255, 55, 0, 0.18)');
    tileLight.addColorStop(0.8, 'rgba(180, 20, 0, 0.06)');
    tileLight.addColorStop(1, 'transparent');
    c.fillStyle = tileLight;
    c.beginPath();
    c.ellipse(pool.x, pool.y, pool.rx * 2.35, pool.ry * 2.35, 0, 0, Math.PI * 2);
    c.fill();

    // Sombra exterior del cráter de la piscina
    c.fillStyle = '#050102';
    c.beginPath();
    c.ellipse(pool.x + 5, pool.y + 6, pool.rx + 12, pool.ry + 9, 0, 0, Math.PI * 2);
    c.fill();

    // Borde rocoso elevado de escoria volcánica
    c.fillStyle = '#24090d';
    c.beginPath();
    c.ellipse(pool.x, pool.y, pool.rx + 8, pool.ry + 6, 0, 0, Math.PI * 2);
    c.fill();

    // Magma hirviendo multicapa en el interior del cráter
    const pGrad = c.createRadialGradient(pool.x - pool.rx * 0.12, pool.y - pool.ry * 0.1, pool.rx * 0.06, pool.x, pool.y, pool.rx);
    pGrad.addColorStop(0, '#ffffff');
    pGrad.addColorStop(0.18, '#fff066');
    pGrad.addColorStop(0.45, '#ff7700');
    pGrad.addColorStop(0.75, '#d91b00');
    pGrad.addColorStop(0.92, '#4a0609');
    pGrad.addColorStop(1, '#1c0305');
    c.fillStyle = pGrad;
    c.beginPath();
    c.ellipse(pool.x, pool.y, pool.rx, pool.ry, 0, 0, Math.PI * 2);
    c.fill();

    // Ondas concéntricas de calor estáticas grabadas en el magma y costras flotantes
    c.strokeStyle = 'rgba(255, 238, 120, 0.45)';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(pool.x, pool.y, pool.rx * 0.68, pool.ry * 0.65, 0, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = 'rgba(255, 140, 20, 0.5)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.ellipse(pool.x, pool.y, pool.rx * 0.42, pool.ry * 0.40, 0, 0, Math.PI * 2);
    c.stroke();

    // Pequeñas costras de roca volcánica flotando dentro de la piscina
    c.fillStyle = '#21070a';
    c.beginPath();
    c.ellipse(pool.x + pool.rx * 0.35, pool.y + pool.ry * 0.2, 11, 5, 0.2, 0, Math.PI * 2);
    c.ellipse(pool.x - pool.rx * 0.4, pool.y - pool.ry * 0.18, 9, 4, -0.3, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // 4. Jerarquía de Venas de Magma con grosor variable, bifurcaciones orgánicas y glow intenso
  // Cada punto es [x, y, factorGrosor]
  const magmaArteries = [
    // Arteria principal Noroeste -> Centro -> Sureste (grosor variable orgánico)
    [[160, 195, 1.35], [290, 255, 1.15], [450, 260, 1.3], [575, 310, 1.0], [680, 340, 1.25], [810, 365, 1.1], [920, 390, 1.45], [1055, 435, 1.2], [1180, 480, 1.4], [1310, 520, 1.1], [1420, 560, 1.3], [1565, 625, 1.05], [1680, 680, 1.2], [1750, 895, 1.35]],
    // Arteria diagonal Suroeste -> Centro -> Noreste
    [[175, 910, 1.35], [310, 840, 1.25], [435, 775, 1.05], [540, 720, 1.2], [665, 700, 0.95], [780, 680, 1.3], [905, 635, 1.15], [1020, 590, 1.4], [1155, 550, 1.2], [1280, 510, 1.35], [1410, 445, 1.05], [1520, 380, 1.2], [1645, 295, 1.1], [1740, 195, 1.35]],
    // Anillo fracturado del Caldero Central (variable y asimétrico)
    [[755, 455, 1.25], [835, 400, 1.1], [920, 390, 1.45], [960, 372, 1.2], [1085, 405, 1.15], [1180, 480, 1.4], [1190, 565, 1.15], [1115, 645, 1.25], [1020, 590, 1.4], [960, 688, 1.3], [820, 680, 1.25], [735, 565, 1.05], [755, 455, 1.25]],
    // Bifurcaciones secundarias naturales hacia las piscinas norte y sur
    [[960, 160, 1.3], [945, 245, 0.95], [910, 315, 0.85], [920, 390, 1.3]],
    [[960, 688, 1.25], [985, 785, 0.95], [945, 880, 1.1], [960, 980, 1.4]],
    [[450, 260, 1.2], [410, 385, 0.9], [385, 510, 0.75], [345, 675, 0.85], [310, 840, 1.15]],
    [[1180, 480, 1.25], [1235, 365, 0.9], [1345, 265, 0.78], [1485, 175, 0.6]],
    [[1420, 560, 1.2], [1455, 705, 0.92], [1545, 825, 0.8], [1660, 910, 1.0]],
    // Ramificaciones capilares finas (bifurcaciones orgánicas)
    [[680, 340, 0.95], [630, 445, 0.65], [565, 515, 0.45]],
    [[540, 720, 0.95], [610, 825, 0.65], [685, 905, 0.45]],
    [[1280, 510, 1.0], [1365, 585, 0.68], [1440, 645, 0.45]],
    [[1520, 380, 0.95], [1615, 435, 0.65], [1710, 465, 0.42]],
    [[820, 680, 1.05], [765, 815, 0.75], [795, 935, 0.52]]
  ];

  // Dibujar cada segmento con grosor variable y 5 niveles de energía (halo difuminado -> magma -> núcleo amarillo brillante)
  for (const path of magmaArteries) {
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1, w1] = path[i];
      const [x2, y2, w2] = path[i + 1];
      const w = (w1 + w2) * 0.5;

      // 1) Halo exterior anaranjado difuminado (Glow sobre el suelo oscuro)
      c.strokeStyle = 'rgba(255, 65, 0, 0.19)';
      c.lineWidth = 28 * w;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();

      c.strokeStyle = 'rgba(255, 105, 15, 0.32)';
      c.lineWidth = 17 * w;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();

      // 2) Borde de roca fundida al rojo vivo
      c.strokeStyle = '#5c0804';
      c.lineWidth = 12 * w;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();

      // 3) Flujo de magma carmesí-naranja
      c.strokeStyle = '#e82c00';
      c.lineWidth = 8.2 * w;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();

      // 4) Manto naranja incandescente
      c.strokeStyle = '#ff8c00';
      c.lineWidth = 4.6 * w;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();

      // 5) Núcleo central amarillo-blanco brillante (energía pura)
      c.strokeStyle = '#fff380';
      c.lineWidth = 2.0 * w;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    }
    c.restore();
  }

  // 4b. Nodos de intersección de alta energía (Glow concentrado donde se cruzan las venas de lava)
  const intersectionNodes = [
    { x: 920, y: 390, r: 58 },
    { x: 1180, y: 480, r: 62 },
    { x: 1020, y: 590, r: 58 },
    { x: 820, y: 680, r: 52 },
    { x: 450, y: 260, r: 48 },
    { x: 680, y: 340, r: 44 },
    { x: 1420, y: 560, r: 50 },
    { x: 1280, y: 510, r: 48 },
    { x: 310, y: 840, r: 46 },
    { x: 540, y: 720, r: 44 },
    { x: 1520, y: 380, r: 44 },
    { x: 960, y: 688, r: 52 }
  ];
  for (const node of intersectionNodes) {
    c.save();
    const nGrad = c.createRadialGradient(node.x, node.y, 2, node.x, node.y, node.r);
    nGrad.addColorStop(0, '#ffffff');
    nGrad.addColorStop(0.16, '#fff588');
    nGrad.addColorStop(0.42, 'rgba(255, 130, 10, 0.65)');
    nGrad.addColorStop(0.75, 'rgba(255, 45, 0, 0.24)');
    nGrad.addColorStop(1, 'transparent');
    c.fillStyle = nGrad;
    c.beginPath();
    c.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // 5. Horizonte superior (cielo ardiente y silueta de caldera volcánica)
  rect(c, '#090204', 0, 0, 1920, 84);
  const skyGrad = c.createLinearGradient(0, 0, 0, 84);
  skyGrad.addColorStop(0, '#220408');
  skyGrad.addColorStop(0.6, '#3d0a10');
  skyGrad.addColorStop(1, '#ff3300');
  c.fillStyle = skyGrad;
  c.fillRect(0, 0, 1920, 80);

  // Silueta de crestas y conos volcánicos lejanos
  c.fillStyle = '#0a0204';
  c.beginPath();
  c.moveTo(0, 80);
  for (let x = 0; x <= 1920; x += 60) {
    const peakH = 35 + Math.sin(x * 0.015) * 22 + Math.cos(x * 0.035) * 14;
    c.lineTo(x, 80 - peakH);
  }
  c.lineTo(1920, 80);
  c.closePath();
  c.fill();

  // Borde ardiente de separación de la arena
  rect(c, '#ff2200', 0, 79, 1920, 4);
  rect(c, '#ffaa00', 0, 81, 1920, 1.5);
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
    } else if (map === 'lava') {
      c.save();
      // 1. Resplandor ambiental de calor magmático pulsante
      const pulse = 0.14 + Math.sin(time * 2.5) * 0.04;
      const heatGrad = c.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, Math.max(width, height) * 0.72);
      heatGrad.addColorStop(0, `rgba(255, 75, 10, ${pulse * 0.85})`);
      heatGrad.addColorStop(0.55, `rgba(225, 35, 0, ${pulse})`);
      heatGrad.addColorStop(1, `rgba(55, 6, 12, ${pulse * 1.65})`);
      c.fillStyle = heatGrad;
      c.fillRect(0, 0, width, height);

      // 2. Piscinas de magma hirviendo: ondas concéntricas de calor animadas y destellos sobre casillas cercanas
      const poolCoords = [
        { x: 180, y: 190, rx: 82, ry: 44 },
        { x: 1740, y: 190, rx: 82, ry: 44 },
        { x: 180, y: 920, rx: 88, ry: 48 },
        { x: 1740, y: 920, rx: 88, ry: 48 },
        { x: 960, y: 980, rx: 118, ry: 54 },
        { x: 960, y: 160, rx: 96, ry: 45 }
      ];
      for (let pIdx = 0; pIdx < poolCoords.length; pIdx++) {
        const pool = poolCoords[pIdx];
        // Destello pulsante de luz que baña las baldosas vecinas
        const flareAlpha = 0.14 + Math.sin(time * 3.6 + pIdx * 1.3) * 0.07;
        const flare = c.createRadialGradient(pool.x, pool.y, pool.rx * 0.2, pool.x, pool.y, pool.rx * 1.85);
        flare.addColorStop(0, `rgba(255, 220, 90, ${flareAlpha})`);
        flare.addColorStop(0.5, `rgba(255, 90, 10, ${flareAlpha * 0.7})`);
        flare.addColorStop(1, 'transparent');
        c.fillStyle = flare;
        c.beginPath();
        c.ellipse(pool.x, pool.y, pool.rx * 1.85, pool.ry * 1.85, 0, 0, Math.PI * 2);
        c.fill();

        // 2 ondas concéntricas de calor expandiéndose desde el centro de la piscina
        for (let r = 0; r < 2; r++) {
          const waveProg = ((time * 0.65 + r * 0.5 + pIdx * 0.19) % 1);
          const wrx = pool.rx * (0.2 + waveProg * 0.75);
          const wry = pool.ry * (0.2 + waveProg * 0.75);
          c.strokeStyle = `rgba(255, 240, 130, ${(1 - waveProg) * 0.55})`;
          c.lineWidth = 2.2 * (1 - waveProg * 0.5);
          c.beginPath();
          c.ellipse(pool.x, pool.y, wrx, wry, 0, 0, Math.PI * 2);
          c.stroke();
        }
      }

      // 3. Burbujas de lava creciendo y estallando a lo largo de las líneas de magma e intersecciones
      const veinAnchors = [
        [290, 255], [450, 260], [575, 310], [680, 340], [810, 365], [920, 390],
        [1055, 435], [1180, 480], [1310, 520], [1420, 560], [1565, 625], [1680, 680],
        [310, 840], [540, 720], [780, 680], [905, 635], [1020, 590], [1280, 510],
        [1520, 380], [960, 372], [1115, 645], [960, 688], [755, 455], [820, 680],
        [180, 190], [1740, 190], [180, 920], [1740, 920], [960, 980], [960, 160]
      ];
      for (let b = 0; b < veinAnchors.length; b++) {
        const [bx, by] = veinAnchors[b];
        const cycle = (time * (1.1 + (b % 4) * 0.22) + b * 0.37) % 1;
        const ox = bx + Math.sin(b * 3.1) * 8;
        const oy = by + Math.cos(b * 2.7) * 6;

        if (cycle < 0.72) {
          // Burbuja de magma hinchándose al rojo-amarillo vivo
          const grow = cycle / 0.72;
          const rad = 2.2 + grow * 5.2;
          c.fillStyle = grow > 0.5 ? '#ffee66' : '#ff7711';
          c.globalAlpha = 0.85;
          c.beginPath();
          c.arc(ox, oy, rad, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(ox - rad * 0.3, oy - rad * 0.3, rad * 0.32, 0, Math.PI * 2);
          c.fill();
        } else {
          // ¡Burbuja estallando! Anillo expansivo + gotas de lava salpicando
          const pop = (cycle - 0.72) / 0.28;
          const burstR = 6 + pop * 14;
          c.strokeStyle = `rgba(255, 240, 130, ${(1 - pop) * 0.9})`;
          c.lineWidth = 2 * (1 - pop * 0.6);
          c.beginPath();
          c.arc(ox, oy, burstR, 0, Math.PI * 2);
          c.stroke();

          // Chispas radiales del estallido
          for (let s = 0; s < 4; s++) {
            const ang = s * (Math.PI / 2) + b * 0.8;
            const sx = ox + Math.cos(ang) * (4 + pop * 16);
            const sy = oy + Math.sin(ang) * (4 + pop * 12) - pop * 6;
            c.fillStyle = s % 2 === 0 ? '#fff380' : '#ff6600';
            c.globalAlpha = 1 - pop;
            c.fillRect(sx - 1.5, sy - 1.5, 3, 3);
          }
        }
      }
      c.globalAlpha = 1;

      // 4. Pequeñas rocas volcánicas flotando/levitando por el calor con sombra proyectada y brillo inferior
      const floatingRocks = [
        [380, 340], [720, 490], [1120, 410], [1360, 460],
        [620, 640], [1060, 710], [1480, 610], [860, 290]
      ];
      for (let r = 0; r < floatingRocks.length; r++) {
        const [rx, ry] = floatingRocks[r];
        const bob = Math.sin(time * 2.6 + r * 1.4) * 5;
        // Sombra proyectada en el suelo
        c.fillStyle = 'rgba(4, 1, 2, 0.65)';
        c.beginPath();
        c.ellipse(rx + 4, ry + 14, 9 - bob * 0.2, 4, 0, 0, Math.PI * 2);
        c.fill();
        // Resplandor naranja reflejado en la base de la roca
        c.fillStyle = '#ff5500';
        c.beginPath();
        c.ellipse(rx, ry + bob + 2, 8.5, 5, 0, 0, Math.PI * 2);
        c.fill();
        // Cuerpo oscuro de roca volcánica
        c.fillStyle = '#240b10';
        c.beginPath();
        c.ellipse(rx, ry + bob, 8, 4.8, 0, 0, Math.PI * 2);
        c.fill();
      }

      // 5. Partículas flotantes de fuego, chispas y ceniza volcánica ascendente
      for (let i = 0; i < 68; i++) {
        const speedY = 52 + (i % 6) * 19;
        const driftX = Math.sin(time * 2.4 + i * 1.5) * 30;
        const x = ((i * 127 + driftX) % width + width) % width;
        const y = height - ((i * 73 + time * speedY) % (height - 80));
        const isAsh = i % 5 === 0;
        const sz = isAsh ? 3 : (i % 3 === 0) ? 3.5 : 2.2;
        const emberColor = isAsh ? '#5a2e35' : (i % 3 === 0) ? '#fff275' : (i % 2 === 0) ? '#ff7700' : '#ff2200';
        c.fillStyle = emberColor;
        c.globalAlpha = isAsh ? 0.55 : (0.48 + Math.sin(time * 4.5 + i) * 0.38);
        c.fillRect(Math.round(x), Math.round(y), sz, sz);
      }
      c.globalAlpha = 1;

      // 6. Efectos de Distorsión Térmica (ondas de aire caliente ondulante sobre las venas de lava)
      for (let i = 0; i < 7; i++) {
        const baseY = 175 + i * 125;
        const phase = time * 3.4 + i * 1.35;
        const waveAmp = 14 + (i % 3) * 5;
        const offset1 = Math.sin(phase) * waveAmp;
        const offset2 = Math.cos(phase * 1.15) * waveAmp;

        // Halo cálido difuso de refracción térmica
        c.strokeStyle = 'rgba(255, 130, 30, 0.16)';
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(80, baseY + offset1);
        c.bezierCurveTo(width * 0.32, baseY - offset2, width * 0.68, baseY + offset2, width - 80, baseY - offset1);
        c.stroke();

        // Filamento fino de aire hirviendo
        c.strokeStyle = 'rgba(255, 235, 150, 0.14)';
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(120, baseY - 8 + offset2 * 0.7);
        c.bezierCurveTo(width * 0.36, baseY - 8 + offset1, width * 0.64, baseY - 8 - offset1, width - 120, baseY - 8 - offset2 * 0.7);
        c.stroke();
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
