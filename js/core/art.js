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
  } else {
    block(c, kind === 'empanada' ? '#e7ba6e' : '#c68c44', 9, 17, 48, 40, 7);
    rect(c, '#f8d28b', 17, 20, 30, 5); rect(c, '#e4aa52', 14, 27, 6, 22);
    for (let i = 0; i < 7; i++) rect(c, '#a6693c', 17 + (i * 11) % 32, 27 + (i * 7) % 25, 3, 3);
    if (kind === 'empanada') for (let i = 0; i < 7; i++) rect(c, '#a87144', 11 + i * 6, 51, 3, 4);
  }
  block(c, '#fff8dc', 22, 30, 9, 12, 1); block(c, '#fff8dc', 38, 30, 9, 12, 1);
  rect(c, INK, 27, 33, 4, 6); rect(c, INK, 42, 33, 4, 6);
  if (enemy) { rect(c, INK, 21, 28, 7, 3); rect(c, INK, 26, 30, 6, 3); rect(c, INK, 38, 30, 6, 3); rect(c, INK, 43, 28, 7, 3); }
  rect(c, INK, 31, 46, 10, 3); rect(c, enemy ? '#f9867e' : '#fff2d5', 34, 49, 5, 2);
  sprites.set(key, sprite); return sprite;
}

export function drawFood(c, kind, x, y, scale = 1, time = 0, enemy = false, flash = false) {
  const bob = Math.round(Math.sin(time * 7 + x * .05) * 1.5);
  c.save(); c.imageSmoothingEnabled = false;
  c.fillStyle = '#080d1360'; c.beginPath(); c.ellipse(x, y + 23 * scale, 25 * scale, 7 * scale, 0, 0, Math.PI * 2); c.fill();
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
  rect(c,'#081a26',0,0,960,540);
  for(let x=0;x<960;x+=64){rect(c,colors[(x/64)%4],x,84,64,456);rect(c,'#0a5a4e55',x,84,3,456);rect(c,'#4ad69418',x+4,84,3,456);}
  for(let y=96;y<540;y+=24)rect(c,'#d7ffe908',0,y,960,2);
  for(let i=0;i<110;i++){const x=(i*173+37)%930+15,y=103+(i*89)%420;rect(c,i%3?'#075c4a66':'#82c76b55',x,y,4+(i%4)*3,2+(i%2));}

  // Synthwave stands and a beveled, high-contrast pitch frame.
  rect(c,'#050b17',0,0,960,84);rect(c,'#20133c',0,55,960,29);rect(c,'#ff3f8b',0,78,960,6);rect(c,'#6dfbe7',0,84,960,3);
  for(let x=18;x<950;x+=36){rect(c,x%72?'#ffcf62':'#4df8dc',x,65,18,5);rect(c,'#4e2e75',x+3,53,12,5);rect(c,x%72?'#5f397f':'#382456',x,12+(x/36%3)*9,29,7);}
  for(const x of [74,790]){block(c,'#142c3c',x,12,96,34,3);rect(c,'#ffe272',x+10,22,28,4);rect(c,'#61f6df',x+48,22,36,4);}
  rect(c,'#020c1690',37,101,886,420);rect(c,'#03151c',40,104,880,414);rect(c,'#62ffb8',44,108,872,406);rect(c,'#eaffdb',48,112,864,398);
  for(let x=52;x<912;x+=64)rect(c,colors[Math.floor(x/64)%4],x,116,Math.min(64,912-x),390);
  for(let y=126;y<506;y+=24)rect(c,'#d7ffe908',52,y,860,2);
  for(let i=0;i<88;i++){const x=58+(i*173)%842,y=122+(i*89)%376;rect(c,i%3?'#075c4a66':'#82c76b55',x,y,4+(i%4)*3,2+(i%2));}

  c.strokeStyle='#082d35aa';c.lineWidth=9;c.strokeRect(55,119,850,382);
  c.strokeStyle='#eaffdc';c.lineWidth=4;c.strokeRect(52,116,856,388);c.beginPath();c.moveTo(480,116);c.lineTo(480,504);c.moveTo(52,220);c.lineTo(151,220);c.lineTo(151,400);c.lineTo(52,400);c.moveTo(908,220);c.lineTo(809,220);c.lineTo(809,400);c.lineTo(908,400);c.stroke();c.beginPath();c.arc(480,310,72,0,7);c.stroke();
  c.fillStyle='#f4ffe8';c.beginPath();c.arc(480,310,5,0,7);c.fill();
  for(const side of [-1,1]){const gx=side<0?46:914;c.fillStyle='#03101888';c.fillRect(gx+(side<0?5:-43),251,38,119);c.strokeStyle='#f8ffe8';c.lineWidth=4;c.strokeRect(gx+(side<0?0:-34),246,34,119);c.strokeStyle='#82ffe655';c.lineWidth=1;for(let y=256;y<365;y+=12){c.beginPath();c.moveTo(gx+(side<0?2:-32),y);c.lineTo(gx+(side<0?32:0),y);c.stroke();}}
}

function dinerFloor(map = 'diner') {
  if (floors.has(map)) return floors.get(map);
  const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 540;
  const c = canvas.getContext('2d'); const parking = map === 'parking', kitchen = map === 'kitchen';
  if(map==='football'){footballFloor(c);floors.set(map,canvas);return canvas;}
  if(['snow','desert'].includes(map)){
    const colors=map==='snow'?['#b8d6d9','#c9e5e7']:map==='desert'?['#bb8149','#c99355']:['#3c965b','#48a867'];
    for(let y=0;y<540;y+=32)for(let x=0;x<960;x+=32){rect(c,colors[(x/32+y/32)%2],x,y,32,32);rect(c,'#ffffff0b',x+2,y+2,28,2);}
    if(map==='snow'){for(let i=0;i<80;i++){const x=(i*179)%960,y=108+(i*91)%420;rect(c,'#f1fcf8',x,y,5,3);}rect(c,'#e7f6ee',0,80,960,12);}
    else{for(let i=0;i<55;i++){const x=(i*191)%960,y=110+(i*73)%420;rect(c,'#e8b975',x,y,10,2);}}
    if(map==='snow'){
      rect(c,'#52777f',0,0,960,84);rect(c,'#83b5b9',0,76,960,8);
      for(let x=0;x<960;x+=64){block(c,x%128?'#789fa3':'#6e959a',x+2,5,60,31,2);block(c,'#63898f',x+18,40,60,31,2);rect(c,'#dfffff99',x+8,9,38,3);}
      for(const x of [80,440,800]){rect(c,'#efffff',x,72,80,5);rect(c,'#8cf5ef',x+8,77,64,3);}
    }else{
      rect(c,'#75462f',0,0,960,84);rect(c,'#bf7b47',0,76,960,8);
      for(let x=0;x<960;x+=72){block(c,x%144?'#a9633d':'#995738',x+3,7,67,30,3);block(c,'#8c4d34',x+25,42,67,29,3);}
      for(const x of [88,430,785]){rect(c,'#522f2b',x,18,92,34);rect(c,'#e1a958',x+6,24,80,5);rect(c,'#70402f',x+12,34,68,12);}
    }
    floors.set(map,canvas);return canvas;
  }
  rect(c, '#171f24', 0, 0, 960, 540);
  for (let y = 0; y < 540; y += 32) for (let x = 0; x < 960; x += 32) {
    const alternate = ((x + y) / 32) % 2;
    rect(c, parking ? (alternate ? '#343c40' : '#363e42') : kitchen ? (alternate ? '#465550' : '#3e4c49') : (alternate ? '#4a5550' : '#394441'), x + 1, y + 1, 31, 31);
    rect(c, '#ffffff04', x + 3, y + 3, 27, 1);
    if ((x * 3 + y) % 224 === 0) rect(c, '#0a18181a', x + 9, y + 20, 8, 2);
  }
  if (parking) {
    for (let x = 120; x < 900; x += 140) { rect(c, '#b4b59b', x, 130, 3, 95); rect(c, '#b4b59b', x, 365, 3, 130); }
    for (let x = 120; x < 900; x += 70) rect(c, '#c5ad5e', x, 292, 35, 4);
  }
  rect(c, '#172327', 0, 0, 960, 80); rect(c, '#253637', 0, 76, 960, 14); rect(c, '#7b9282', 0, 77, 960, 3);
  for (let x = 8; x < 960; x += 80) {
    block(c, '#415953', x, 7, 72, 60, 3); rect(c, '#6e8576', x + 4, 10, 64, 5);
    rect(c, '#15242a', x + 9, 27, 52, 24); rect(c, '#73958c', x + 16, 30, 35, 2);
    if ((x - 8) % 160 === 0) { rect(c, '#eecc70', x + 14, 36, 23, 3); rect(c, '#839e8c', x + 14, 43, 38, 2); }
    else for (let i = 0; i < 3; i++) { rect(c, '#92b1a4', x + 13 + i * 15, 30, 7, 16); rect(c, '#536f69', x + 14 + i * 15, 34, 5, 8); }
  }
  if (!parking) for (const x of [5, 916]) for (const y of [135, 324]) {
    block(c, kitchen ? '#79968c' : '#923f45', x, y, 39, 122, 3);
    rect(c, kitchen ? '#adc0a8' : '#dc7370', x + 5, y + 5, 29, 12);
    rect(c, kitchen ? '#506b64' : '#b05052', x + 6, y + 25, 27, 85);
    rect(c, '#17282a', x + 7, y + 56, 25, 3); rect(c, '#17282a', x + 7, y + 99, 25, 3);
  }
  rect(c, '#1e2c2c', 48, 98, 864, 4); rect(c, '#819e7d40', 48, 102, 864, 1);
  for (let x = 50; x < 910; x += 22) rect(c, '#d7b76a', x, 518, 12, 3);
  c.save(); c.globalAlpha = .1; c.fillStyle = '#dbe6c5'; c.font = '900 58px monospace'; c.textAlign = 'center'; c.fillText(parking ? 'DELIVERY' : kitchen ? 'COCINA 02' : 'DOMI 24/7', 480, 308); c.restore();
  floors.set(map, canvas); return canvas;
}

export function drawDiner(c, width, height, time, menu, map = 'diner') {
  c.imageSmoothingEnabled = false;
  if (!menu) {
    c.drawImage(dinerFloor(map), 0, 0, width, height);

    // Efectos ambientales animados según el mapa
    if (map === 'snow') {
      // Copos de nieve cayendo
      c.save(); c.fillStyle = '#e8f8ff';
      for (let i = 0; i < 35; i++) {
        const x = ((i * 173 + time * 38) % 980) - 10;
        const y = ((i * 97 + time * (28 + i % 4 * 6)) % 460) + 90;
        const size = 2 + (i % 3);
        c.globalAlpha = 0.55 + Math.sin(time * 2.1 + i) * 0.25;
        c.fillRect(x, y, size, size);
      }
      // Viento ocasional — líneas horizontales
      c.strokeStyle = '#d0f0ff44'; c.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const y = 120 + (i * 83 + time * 25) % 380;
        const x = ((i * 211 + time * 68) % 960);
        c.globalAlpha = 0.2 + Math.sin(time + i) * 0.1;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + 55 + (i % 3) * 20, y); c.stroke();
      }
      c.restore();
    } else if (map === 'desert') {
      // Partículas de arena
      c.save(); c.fillStyle = '#e8c07a';
      for (let i = 0; i < 28; i++) {
        const x = ((i * 191 + time * 55) % 980) - 10;
        const y = 110 + ((i * 113 + time * (18 + i % 3 * 8)) % 390);
        c.globalAlpha = 0.3 + Math.sin(time * 1.5 + i) * 0.15;
        c.fillRect(x, y, 4 + (i % 3) * 2, 2);
      }
      c.restore();
    } else if (map === 'football') {
      // Destellos de reflectores parpadeantes
      c.save();
      for (let i = 0; i < 4; i++) {
        const cx = [80, 300, 660, 880][i], cy = 45;
        c.globalAlpha = 0.08 + Math.sin(time * 3.5 + i * 1.3) * 0.06;
        const grad = c.createRadialGradient(cx, cy, 0, cx, cy, 140);
        grad.addColorStop(0, '#fffbe0'); grad.addColorStop(1, 'transparent');
        c.fillStyle = grad; c.fillRect(cx - 140, cy, 280, 200);
      }
      c.restore();
    } else if (map === 'kitchen') {
      // Vapor ascendente
      c.save(); c.strokeStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        const x = 150 + i * 165;
        const phase = time * 0.8 + i * 1.2;
        c.globalAlpha = 0.05 + Math.sin(phase) * 0.04;
        c.lineWidth = 3 + Math.sin(phase * 0.7) * 1.5;
        c.beginPath();
        for (let s = 0; s < 8; s++) {
          const sy = 500 - s * 30 - ((time * 22 + i * 40) % 240);
          const sx = x + Math.sin(phase + s * 0.5) * 8;
          s === 0 ? c.moveTo(sx, sy) : c.lineTo(sx, sy);
        }
        c.stroke();
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
