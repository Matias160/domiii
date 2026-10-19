const RANKING_KEY = "domi2pancho.ranking";

export function getRanking() {
  try {
    const stored = JSON.parse(localStorage.getItem(RANKING_KEY));
    return Array.isArray(stored) ? stored.filter(run=>run && Number.isFinite(run.score) && typeof run.name==='string').sort((a,b)=>b.score-a.score).slice(0,10) : [];
  } catch {
    return [];
  }
}

export function saveRun(result) {
  const ranking = getRanking();
  ranking.push({ ...result, date: new Date().toLocaleDateString("es-AR") });
  ranking.sort((a, b) => b.score - a.score);
  try { localStorage.setItem(RANKING_KEY, JSON.stringify(ranking.slice(0, 10))); } catch { /* A blocked browser store must not interrupt game over. */ }
}

export function getBestScore() {
  return getRanking()[0]?.score || 0;
}
