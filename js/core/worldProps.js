const INK = '#101b20';
function rect(c, color, x, y, w, h) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function shadow(c, x, y, w = 54, h = 12) { c.save(); c.globalAlpha = .24; c.fillStyle = '#071218'; c.beginPath(); c.ellipse(x, y, w, h, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
function table(c, x, y, tone = '#b95d53', accent = '#edaa6e') {
  shadow(c, x, y + 25, 48, 9); rect(c, INK, x - 42, y - 16, 84, 30); rect(c, tone, x - 38, y - 12, 76, 20); rect(c, accent, x - 31, y - 9, 52, 4); rect(c, '#713f3f', x - 38, y + 4, 76, 10);
  rect(c, '#875044', x - 26, y + 14, 8, 18); rect(c, '#875044', x + 18, y + 14, 8, 18); rect(c, '#d67b65', x - 29, y + 30, 14, 3); rect(c, '#d67b65', x + 15, y + 30, 14, 3);
  c.fillStyle = '#f2d995'; c.beginPath(); c.ellipse(x - 12, y - 3, 11, 4, 0, 0, 7); c.fill(); rect(c, '#77b6a0', x + 14, y - 10, 7, 10); rect(c, '#b6e2c2', x + 15, y - 9, 4, 3);
}
function bench(c, x, y, tone = '#8b614d') { shadow(c, x, y + 26, 52, 8); rect(c, INK, x - 48, y - 14, 96, 25); rect(c, tone, x - 44, y - 10, 88, 15); rect(c, '#d59a66', x - 37, y - 7, 72, 3); rect(c, '#65473f', x - 43, y + 5, 86, 8); rect(c, '#604944', x - 34, y + 13, 7, 18); rect(c, '#604944', x + 27, y + 13, 7, 18); }
function showcase(c, x, y, tone = '#a05255') {
  shadow(c, x, y + 37, 58, 10); rect(c, INK, x - 52, y - 34, 104, 68); rect(c, tone, x - 47, y - 29, 94, 58); rect(c, '#20343a', x - 38, y - 20, 76, 40); rect(c, '#7ed1ba', x - 32, y - 14, 64, 3);
  for (let i = 0; i < 4; i++) { rect(c, ['#ef9b77', '#efd26f', '#91c9a3', '#a8b9e7'][i], x - 30 + i * 19, y - 3, 11, 13); rect(c, '#f8e7ac', x - 28 + i * 19, y - 1, 7, 3); }
  rect(c, '#e2b86d', x - 48, y + 22, 96, 7); rect(c, '#6c4145', x - 39, y + 29, 9, 9); rect(c, '#6c4145', x + 30, y + 29, 9, 9);
}
function machine(c, x, y, tone = '#6e9891') { shadow(c, x, y + 31, 39, 8); rect(c, INK, x - 32, y - 32, 64, 58); rect(c, tone, x - 27, y - 27, 54, 48); rect(c, '#243b40', x - 19, y - 18, 38, 21); rect(c, '#f1ce70', x - 13, y - 13, 9, 5); rect(c, '#89e0bd', x + 2, y - 13, 13, 5); rect(c, '#263d42', x - 21, y + 9, 42, 5); for (let i = 0; i < 3; i++) rect(c, '#d9e4c0', x - 20 + i * 13, y + 19, 7, 5); }
function canopy(c, x, y) { shadow(c, x, y + 22, 58, 8); rect(c, '#192b2e', x - 53, y - 25, 106, 18); rect(c, '#d58a56', x - 47, y - 20, 94, 10); for (let i = 0; i < 4; i++) rect(c, i % 2 ? '#f2cf73' : '#e56f63', x - 43 + i * 24, y - 20, 13, 10); rect(c, '#865748', x - 43, y - 7, 6, 34); rect(c, '#865748', x + 37, y - 7, 6, 34); rect(c, '#b9d279', x - 32, y + 5, 64, 9); }
function scoreboard(c, x, y) { shadow(c, x, y + 37, 45, 8); rect(c, INK, x - 43, y - 31, 86, 57); rect(c, '#264a46', x - 37, y - 25, 74, 44); rect(c, '#e8c868', x - 26, y - 15, 19, 15); rect(c, '#e8c868', x + 7, y - 15, 19, 15); rect(c, '#f5edc8', x - 20, y - 11, 7, 7); rect(c, '#f5edc8', x + 13, y - 11, 7, 7); rect(c, '#9dd3ad', x - 27, y + 8, 54, 4); rect(c, '#536d65', x - 30, y + 26, 7, 16); rect(c, '#536d65', x + 23, y + 26, 7, 16); }
function billboard(c,x,y,label,tone='#ff3f8b') {
  shadow(c,x,y+22,48,7);rect(c,'#050b17',x-50,y-21,100,43);rect(c,'#2a1644',x-46,y-17,92,31);rect(c,tone,x-42,y-13,84,4);
  c.fillStyle='#f8f0d0';c.font='bold 9px monospace';c.textAlign='center';c.fillText(label,x,y+5);rect(c,'#4df8dc',x-34,y+11,68,3);rect(c,'#34435d',x-40,y+22,7,12);rect(c,'#34435d',x+33,y+22,7,12);
}
function floodLight(c,x,y,time) {
  rect(c,'#07111b',x-5,y,12,58);rect(c,'#4b5871',x-2,y+5,5,50);rect(c,'#050913',x-22,y-12,46,22);rect(c,'#a23c89',x-18,y-8,38,14);
  for(let i=0;i<4;i++){const glow=.7+Math.sin(time*3+i)*.18;c.fillStyle=`rgba(190,255,236,${glow})`;c.fillRect(x-15+i*9,y-5,6,7);}
}
function snowPile(c, x, y) { shadow(c, x, y + 10, 38, 7); rect(c, '#dff6f4', x - 32, y - 6, 64, 14); rect(c, '#f5ffff', x - 24, y - 13, 42, 10); rect(c, '#ffffff', x - 12, y - 18, 20, 7); rect(c, '#b7dfe2', x - 28, y + 6, 56, 4); }
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
function edgeVignette(c) {
  const gradient = c.createLinearGradient(0, 0, 960, 0);
  gradient.addColorStop(0, '#0712183c'); gradient.addColorStop(.12, 'transparent'); gradient.addColorStop(.88, 'transparent'); gradient.addColorStop(1, '#0712183c');
  c.fillStyle = gradient; c.fillRect(0, 90, 960, 450);
}
/** Decorative depth layer. Props stay outside gameplay data and collisions. */
export function drawWorldProps(ctx, map = 'diner', time = 0) {
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = .94; const shimmer = Math.sin(time * 1.6) * .5 + .5;
  if (map === 'snow') { bench(ctx, 112, 145, '#6f9ca1'); bench(ctx, 848, 145, '#6f9ca1'); snowPile(ctx, 116, 208); snowPile(ctx, 844, 208); ctx.globalAlpha = .55 + shimmer * .15; rect(ctx, '#e8ffff', 67, 108, 55, 3); rect(ctx, '#e8ffff', 838, 108, 55, 3); }
  else if (map === 'desert') { canopy(ctx, 116, 143); canopy(ctx, 844, 143); rect(ctx, '#9a623b', 77, 189, 80, 34); rect(ctx, '#d39a4e', 82, 194, 70, 24); rect(ctx, '#9a623b', 803, 189, 80, 34); rect(ctx, '#d39a4e', 808, 194, 70, 24); }
  else if (map === 'football') { scoreboard(ctx, 113, 151); scoreboard(ctx, 847, 151); bench(ctx, 112, 220, '#386c59'); bench(ctx, 848, 220, '#386c59'); billboard(ctx,112,449,'DOMI COLA'); billboard(ctx,848,449,'PANCHO PRO','#4df8dc'); floodLight(ctx,64,101,time); floodLight(ctx,896,101,time+.6); }
  else if (map === 'kitchen') { showcase(ctx, 111, 158, '#72958e'); showcase(ctx, 849, 158, '#72958e'); machine(ctx, 115, 245, '#72958e'); machine(ctx, 845, 245, '#72958e'); }
  else if (map === 'parking') { machine(ctx, 111, 155, '#697c7c'); machine(ctx, 849, 155, '#697c7c'); rect(ctx, '#9f6948', 69, 214, 79, 34); rect(ctx, '#d3a061', 75, 219, 67, 23); rect(ctx, '#9f6948', 812, 214, 79, 34); rect(ctx, '#d3a061', 818, 219, 67, 23); }
  else { table(ctx, 124, 150); table(ctx, 836, 150); showcase(ctx, 111, 259); showcase(ctx, 849, 259); }
  ctx.globalAlpha = 1;
  edgeVignette(ctx);
  if (map === 'diner') { steam(ctx, 138, 137, time); steam(ctx, 822, 137, time + .8); }
  if (map === 'kitchen') { steam(ctx, 111, 125, time, '#d9fff5'); steam(ctx, 849, 125, time + .6, '#d9fff5'); }
  if (map === 'desert') { heatHaze(ctx, 116, 249, time); heatHaze(ctx, 844, 249, time + .8); }
  if (map === 'football') {
    ctx.save(); ctx.globalAlpha = .18 + shimmer * .1; ctx.fillStyle = '#fff8cf'; ctx.fillRect(78, 115, 70, 3); ctx.fillRect(812, 115, 70, 3); ctx.restore();
  }
  ctx.restore();
}
