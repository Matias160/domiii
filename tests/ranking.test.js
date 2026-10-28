import test from 'node:test';
import assert from 'node:assert/strict';
import { getRanking, saveRun, qualifiesForRanking, cleanArcadeName, RANKING_SIZE } from '../js/systems/rankingSystem.js';

function memoryStorage() {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value)), removeItem: key => entries.delete(key) };
}

test('the ranking keeps only the best ten and knows when a score gets in', () => {
  globalThis.localStorage = memoryStorage();
  assert.equal(qualifiesForRanking(0), false, 'zero points never enter');
  assert.equal(qualifiesForRanking(5), true, 'with free places any score enters');
  for (let i = 1; i <= 12; i++) saveRun({ id: `r${i}`, name: 'AAAAA', score: i * 100 });
  const ranking = getRanking();
  assert.equal(ranking.length, RANKING_SIZE);
  assert.equal(ranking[0].score, 1200);
  assert.equal(ranking.at(-1).score, 300);
  assert.equal(qualifiesForRanking(300), false, 'a tie with the tenth place does not push it out');
  assert.equal(qualifiesForRanking(301), true);
});

test('arcade names are up to five letters or digits in uppercase, nothing else', () => {
  assert.equal(cleanArcadeName('pancho123'), 'PANCH');
  assert.equal(cleanArcadeName('ñu'), 'ÑU');
  assert.equal(cleanArcadeName('<b>x</b>'), 'BXB');
  assert.equal(cleanArcadeName('  a-b c '), 'ABC');
  assert.equal(cleanArcadeName(null), '');
});
