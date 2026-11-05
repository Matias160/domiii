import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('pause stability: blur does not pause game unless document is genuinely hidden', () => {
  const gameSrc = fs.readFileSync(path.resolve('js/game.js'), 'utf8');

  // Verify blur checks document.hidden before triggering pause
  assert.match(gameSrc, /window\.addEventListener\('blur',\s*\(\)\s*=>\s*\{[^}]*document\.hidden/, 'blur checks document.hidden');
  assert.match(gameSrc, /reason\s*===\s*'focus'\s*&&[^}]*!document\.hidden\s*\)\s*return/, 'pause rejects focus reason if document is visible');
});

test('pause stability: resize events do not force orientation pause during gameplay', () => {
  const touchSrc = fs.readFileSync(path.resolve('js/core/touchControls.js'), 'utf8');

  // Verify orientation pause only triggers on explicit orientationchange, not continuous resize
  assert.match(touchSrc, /e\?\.type\s*===\s*'orientationchange'/, 'orientation pause checks for explicit orientationchange');
});

test('pause stability: abilities do not trigger random card freeze intervals during combat', () => {
  const gameSrc = fs.readFileSync(path.resolve('js/game.js'), 'utf8');

  // Verify ability choices only prompt on real pendingLevels, not cardIsDue drought timers
  assert.doesNotMatch(gameSrc, /state\.pendingLevels > 0 \|\| cardIsDue/, 'cardIsDue drought timer removed from update loop');
});
