// Genera css/enye-font.css: una fuente TrueType mínima con una "Ñ" redibujada sobre la misma
// grilla de 8x8 de Press Start 2P. La Ñ original de esa fuente aprieta la tilde contra la N y,
// a los tamaños chicos del juego, se lee como una "A". La CSS registra esta Ñ con el mismo nombre
// de familia y unicode-range U+00D1, así el navegador la usa solo para esa letra (DOM y canvas).
//
// Uso: node tools/build-enye-font.cjs   (no necesita dependencias)
'use strict';
const fs = require('fs');
const path = require('path');

// '#' = píxel lleno. Fila 0 arriba; las mayúsculas de Press Start 2P ocupan las filas 0 a 6.
const ENYE = [
  '.##..#.',
  '#..##..',
  '###..##',
  '####.##',
  '##.####',
  '##..###',
  '##...##',
];

const UNITS_PER_EM = 1000, PX = 125, ADVANCE = 1000;

// Cada tramo horizontal de píxeles es un rectángulo (contorno en sentido horario)
function glyphRects(rows) {
  const rects = [];
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length;) {
      if (row[c] !== '#') { c++; continue; }
      let end = c;
      while (row[end] === '#') end++;
      const top = (8 - r) * PX, bottom = (7 - r) * PX;
      rects.push({ x0: c * PX, x1: end * PX, y0: bottom, y1: top });
      c = end;
    }
  });
  return rects;
}

function encodeGlyph(rects) {
  const pts = [];
  const ends = [];
  for (const { x0, x1, y0, y1 } of rects) {
    pts.push([x0, y0], [x0, y1], [x1, y1], [x1, y0]); // horario (y hacia arriba)
    ends.push(pts.length - 1);
  }
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const bbox = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const parts = [];
  const head = Buffer.alloc(10);
  head.writeInt16BE(rects.length, 0); bbox.forEach((v, i) => head.writeInt16BE(v, 2 + i * 2));
  parts.push(head);
  const endBuf = Buffer.alloc(ends.length * 2); ends.forEach((e, i) => endBuf.writeUInt16BE(e, i * 2)); parts.push(endBuf);
  parts.push(Buffer.from([0, 0]));                  // sin instrucciones
  parts.push(Buffer.alloc(pts.length, 0x01));       // todos los puntos sobre la curva, deltas de 16 bits
  const coords = Buffer.alloc(pts.length * 4);
  let px = 0, py = 0;
  pts.forEach(([x], i) => { coords.writeInt16BE(x - px, i * 2); px = x; });
  pts.forEach(([, y], i) => { coords.writeInt16BE(y - py, pts.length * 2 + i * 2); py = y; });
  parts.push(coords);
  let data = Buffer.concat(parts);
  if (data.length % 4) data = Buffer.concat([data, Buffer.alloc(4 - (data.length % 4))]);
  return { data, bbox, points: pts.length, contours: rects.length };
}

const u16 = v => { const b = Buffer.alloc(2); b.writeUInt16BE(v & 0xffff); return b; };
const i16 = v => { const b = Buffer.alloc(2); b.writeInt16BE(v); return b; };
const u32 = v => { const b = Buffer.alloc(4); b.writeUInt32BE(v >>> 0); return b; };
const cat = (...bufs) => Buffer.concat(bufs);

const enye = encodeGlyph(glyphRects(ENYE));
const glyf = enye.data; // glifo 0 (.notdef) vacío, glifo 1 = Ñ
const loca = cat(u32(0), u32(0), u32(glyf.length));

const head = cat(u32(0x00010000), u32(0x00010000), u32(0), u32(0x5F0F3CF5), u16(0x000B), u16(UNITS_PER_EM),
  Buffer.alloc(8), Buffer.alloc(8), ...enye.bbox.map(i16), u16(0), u16(8), i16(2), i16(1), i16(0));
const hhea = cat(u32(0x00010000), i16(1000), i16(0), i16(0), u16(ADVANCE), i16(0), i16(ADVANCE - enye.bbox[2]), i16(enye.bbox[2]),
  i16(1), i16(0), i16(0), Buffer.alloc(8), i16(0), u16(2));
const maxp = cat(u32(0x00010000), u16(2), u16(enye.points), u16(enye.contours), u16(0), u16(0), u16(2), u16(0), u16(0), u16(0), u16(0), u16(0), u16(0), u16(0), u16(0));
const hmtx = cat(u16(ADVANCE), i16(0), u16(ADVANCE), i16(0));
const os2 = cat(u16(4), i16(ADVANCE), u16(400), u16(5), u16(0),
  i16(650), i16(600), i16(0), i16(75), i16(650), i16(600), i16(0), i16(350), i16(50), i16(250), i16(0),
  Buffer.alloc(10), u32(1), u32(0), u32(0), u32(0), Buffer.from('BRGS'), u16(0x0040), u16(0xD1), u16(0xD1),
  i16(1000), i16(0), i16(0), u16(1000), u16(0), u32(1), u32(0), i16(625), i16(875), u16(0), u16(0x20), u16(1));
const post = cat(u32(0x00030000), u32(0), i16(-100), i16(50), u32(1), u32(0), u32(0), u32(0), u32(0));
// cmap formato 4: U+00D1 -> glifo 1
const segs = [[0xD1, 0xD1, 1 - 0xD1], [0xFFFF, 0xFFFF, 1]];
const segX2 = segs.length * 2;
const fmt4Body = cat(u16(segX2), u16(4), u16(1), u16(0), ...segs.map(s => u16(s[1])), u16(0), ...segs.map(s => u16(s[0])), ...segs.map(s => i16(((s[2] + 0x8000) & 0xffff) - 0x8000)), ...segs.map(() => u16(0)));
const fmt4 = cat(u16(4), u16(6 + fmt4Body.length), u16(0), fmt4Body);
const cmap = cat(u16(0), u16(1), u16(3), u16(1), u32(12), fmt4);
// name: familia, estilo, id único, nombre completo y nombre PostScript
const names = [[1, 'PS2P Enye'], [2, 'Regular'], [3, 'PS2P Enye Regular'], [4, 'PS2P Enye Regular'], [6, 'PS2PEnye-Regular']];
const strings = names.map(([, s]) => Buffer.from(s, 'utf16le').swap16());
let offset = 0;
const records = names.map(([id], i) => { const r = cat(u16(3), u16(1), u16(0x409), u16(id), u16(strings[i].length), u16(offset)); offset += strings[i].length; return r; });
const name = cat(u16(0), u16(names.length), u16(6 + names.length * 12), ...records, ...strings);

const tables = { 'OS/2': os2, cmap, glyf, head, hhea, hmtx, loca, maxp, name, post };
const tags = Object.keys(tables).sort();
const checksum = buf => { let sum = 0; const b = buf.length % 4 ? cat(buf, Buffer.alloc(4 - (buf.length % 4))) : buf; for (let i = 0; i < b.length; i += 4) sum = (sum + b.readUInt32BE(i)) >>> 0; return sum; };
const numTables = tags.length;
let entrySelector = 0; while (1 << (entrySelector + 1) <= numTables) entrySelector++;
const searchRange = (1 << entrySelector) * 16;
const header = cat(u32(0x00010000), u16(numTables), u16(searchRange), u16(entrySelector), u16(numTables * 16 - searchRange));
let dataOffset = 12 + numTables * 16;
const dir = [], bodies = [];
for (const tag of tags) {
  const body = tables[tag];
  const padded = body.length % 4 ? cat(body, Buffer.alloc(4 - (body.length % 4))) : body;
  dir.push(cat(Buffer.from(tag.padEnd(4)), u32(checksum(body)), u32(dataOffset), u32(body.length)));
  bodies.push(padded);
  dataOffset += padded.length;
}
const font = cat(header, ...dir, ...bodies);
// checkSumAdjustment del head
const headOffset = 12 + numTables * 16 + bodies.slice(0, tags.indexOf('head')).reduce((s, b) => s + b.length, 0);
font.writeUInt32BE((0xB1B0AFBA - checksum(font)) >>> 0, headOffset + 8);

const css = `/* Generado por tools/build-enye-font.cjs: "Ñ" legible para Press Start 2P (solo U+00D1) */
@font-face {
  font-family: 'Press Start 2P';
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url(data:font/ttf;base64,${font.toString('base64')}) format('truetype');
  unicode-range: U+00D1;
}
`;
const out = path.join(__dirname, '..', 'css', 'enye-font.css');
fs.writeFileSync(out, css);
console.log(`css/enye-font.css: ${font.length} bytes de fuente, ${enye.contours} rectángulos`);
