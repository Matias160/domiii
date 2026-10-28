import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('the readable Ñ font covers only that letter and is a valid TrueType file', () => {
  const css = read('../css/enye-font.css');
  assert.match(css, /font-family: 'Press Start 2P'/);
  assert.match(css, /unicode-range: U\+00D1;/);
  const base64 = css.match(/base64,([A-Za-z0-9+/=]+)\)/)[1];
  const font = Buffer.from(base64, 'base64');
  assert.equal(font.readUInt32BE(0), 0x00010000, 'TrueType header');
  const tables = Array.from({ length: font.readUInt16BE(4) }, (_, i) => font.toString('latin1', 12 + i * 16, 16 + i * 16));
  for (const tag of ['OS/2', 'cmap', 'glyf', 'head', 'hhea', 'hmtx', 'loca', 'maxp', 'name', 'post']) assert.ok(tables.includes(tag), tag);
});

test('the Ñ font is loaded after every stylesheet that brings Press Start 2P, so it wins only for Ñ', () => {
  const html = read('../index.html');
  const enye = html.indexOf('css/enye-font.css');
  assert.ok(enye > html.indexOf('family=Press+Start+2P'));
  for (const sheet of ['arcade', 'polish', 'shop', 'gameplay', 'interface', 'mobile']) assert.ok(enye > html.indexOf(`css/${sheet}.css`), sheet);
  for (const sheet of ['arcade', 'polish', 'shop', 'gameplay', 'interface', 'mobile']) {
    assert.doesNotMatch(read(`../css/${sheet}.css`), /@import[^;]*Press\+Start/, `${sheet}.css no vuelve a importar la fuente`);
  }
});
