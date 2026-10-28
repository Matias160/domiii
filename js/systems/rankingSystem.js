const RANKING_KEY = "domi2pancho.ranking";
export const RANKING_SIZE = 10;
export const ARCADE_NAME_LENGTH = 5;

export function getRanking() {
  try {
    const stored = JSON.parse(localStorage.getItem(RANKING_KEY));
    return Array.isArray(stored) ? stored.filter(run=>run && Number.isFinite(run.score) && typeof run.name==='string').sort((a,b)=>b.score-a.score).slice(0,RANKING_SIZE) : [];
  } catch {
    return [];
  }
}

export function saveRun(result) {
  const ranking = getRanking();
  ranking.push({ ...result, date: new Date().toLocaleDateString("es-AR") });
  ranking.sort((a, b) => b.score - a.score);
  try { localStorage.setItem(RANKING_KEY, JSON.stringify(ranking.slice(0, RANKING_SIZE))); } catch { /* A blocked browser store must not interrupt game over. */ }
}

// ¿Este puntaje entra en el Top 10? (con lugar libre alcanza con sumar algo)
export function qualifiesForRanking(score) {
  const value = Math.floor(Number(score) || 0);
  if (value <= 0) return false;
  const ranking = getRanking();
  return ranking.length < RANKING_SIZE || value > ranking[ranking.length - 1].score;
}

// Nombre de máquina arcade: hasta 5 letras o números, en mayúsculas (se descarta todo lo demás)
export function cleanArcadeName(value) {
  return String(value ?? '').toLocaleUpperCase('es').replace(/[^A-ZÑ0-9]/g, '').slice(0, ARCADE_NAME_LENGTH);
}

export function getBestScore() {
  return getRanking()[0]?.score || 0;
}
