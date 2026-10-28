// ============================================================================
// DOMI 2: PANCHO - CALIDAD VISUAL ADAPTATIVA
// Si la partida baja de ~45 FPS se recortan SOLO los excesos de efectos
// (cantidad de partículas, textos, balas y el tope de enemigos vivos), nunca el
// estilo: colores, brillos y animaciones siguen iguales. Cuando vuelve a ir fluida, sube sola.
// ============================================================================

export const QUALITY_LEVELS = [
  { id: 'high', maxParticles: 380, maxFloaters: 32, particleFactor: 1, maxEnemies: 90, maxEnemyShots: 160 },
  { id: 'medium', maxParticles: 260, maxFloaters: 24, particleFactor: 0.75, maxEnemies: 75, maxEnemyShots: 130 },
  { id: 'low', maxParticles: 170, maxFloaters: 16, particleFactor: 0.55, maxEnemies: 60, maxEnemyShots: 100 },
];

export const quality = { index: 0, ...QUALITY_LEVELS[0] };

const SLOW_FRAME_MS = 22;   // ~45 FPS
const FAST_FRAME_MS = 18;   // ~55 FPS
let average = 16.7, slowFor = 0, fastFor = 0;

function setLevel(index) {
  quality.index = index;
  Object.assign(quality, QUALITY_LEVELS[index]);
}

// Se llama una vez por cuadro con el tiempo real entre cuadros (ms)
export function trackFrame(frameMs) {
  if (!(frameMs > 0) || frameMs > 250) return; // pestañas en segundo plano o pausas largas
  average += (frameMs - average) * 0.08;
  const seconds = frameMs / 1000;
  if (average > SLOW_FRAME_MS) { slowFor += seconds; fastFor = 0; }
  else if (average < FAST_FRAME_MS) { fastFor += seconds; slowFor = 0; }
  else { slowFor = 0; fastFor = 0; }
  if (slowFor > 1.5 && quality.index < QUALITY_LEVELS.length - 1) { setLevel(quality.index + 1); slowFor = 0; }
  if (fastFor > 5 && quality.index > 0) { setLevel(quality.index - 1); fastFor = 0; }
}

export function resetQuality() {
  setLevel(0);
  average = 16.7; slowFor = 0; fastFor = 0;
}
