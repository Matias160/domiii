import { spawnItem } from './itemSystem.js';

export const RUSH_BOSS_GOAL = 3;
// Respiro mínimo entre que cae un jefe y aparece el siguiente (segundos de juego)
export const BOSS_GAP = 35;

export const modes = {
  survival: { name: 'Supervivencia', goal: 'Aguanta el ultimo turno' },
  waves: { name: 'Oleadas', goal: 'Completa las 8 oleadas' },
  rush: { name: 'Duelo de jefes', goal: `Derrota a los ${RUSH_BOSS_GOAL} Grandes Jefes` },
  boss_legendary: { name: '???', goal: 'Derrota al Coloso Final de la Lava' },
};

const events = [
  { id: 'sauces', name: 'LLUVIA DE ADEREZOS', duration: 14, color: '#ffcf4a', subtitle: '¡BOTINES Y SALSAS ESPECIALES!' },
  { id: 'promo', name: 'PROMO 2x1', duration: 18, color: '#ff8580', subtitle: '¡PUNTOS Y MULTIPLICADORES DOBLES!' },
  { id: 'happy', name: 'HORA FELIZ', duration: 16, color: '#86e3bf', subtitle: '¡BONIFICACIÓN DE SCORE Y VELOCIDAD!' },
  { id: 'superwave', name: '¡SUPER OLEADA!', duration: 14, color: '#ff1144', subtitle: '¡ENJAMBRE MASIVO: EL TRIPLE DE ENEMIGOS!' },
];

export function initializeDirector(state) {
  state.modeId = state.mapId === 'lava' ? 'boss_legendary' : (modes[state.modeId] ? state.modeId : 'survival');
  state.wave = 1;
  state.waveRemaining = 10;
  state.waveRest = 2;
  state.waveBossPending = false;
  state.nextBossAt = state.mapId === 'lava' ? 3.5 : state.modeId === 'rush' ? 3 : state.modeId === 'waves' ? Infinity : 55;
  state.nextEventAt = state.mapId === 'lava' ? Infinity : state.modeId === 'rush' ? 25 : 32;
  state.activeEvent = null;
  state.eventRemaining = 0;
  state.eventItemTimer = 0;
  state.peakCombo = 0;
}

export function updateDirector(state, delta, bounds, random = Math.random) {
  state.peakCombo = Math.max(state.peakCombo, state.combo || 0);
  if (state.mapId === 'lava' && state.bossesKilled >= 1 && !state.bossDying) state.victory = true;
  if (state.modeId === 'rush' && state.bossesKilled >= RUSH_BOSS_GOAL) state.victory = true;
  if (state.modeId === 'waves') {
    state.waveRest = Math.max(0, state.waveRest - delta);
    if (state.waveRemaining === 0 && !state.waveBossPending && state.enemies.length === 0) {
      if (state.wave >= 8) state.victory = true;
      else {
        state.wave += 1;
        state.waveRemaining = 8 + state.wave * 3;
        state.waveRest = 4;
        state.waveBossPending = state.wave % 4 === 0;
        state.directorNotice = 'OLEADA ' + state.wave + ' / 8';
        if (state.player.hp > 0) state.player.hp = Math.min(state.player.maxHp, state.player.hp + 12);
      }
    }
  }
  if (state.activeEvent) {
    state.eventRemaining = Math.max(0, state.eventRemaining - delta);
    if (state.eventRemaining <= 0) {
      state.activeEvent = null;
      state.nextEventAt = state.time + 32 + random() * 14;
    } else if (state.activeEvent.id !== 'promo') {
      state.eventItemTimer -= delta;
      if (state.eventItemTimer <= 0 && state.items.length < 9) {
        state.items.push(spawnItem(bounds));
        state.eventItemTimer = state.activeEvent.id === 'sauces' ? 2 : 4;
      }
    }
  } else if (state.time >= state.nextEventAt && (state.modeId === 'rush' || !state.enemies.some(e => e.isBoss))) {
    state.activeEvent = events[Math.floor(random() * events.length)];
    state.eventRemaining = state.activeEvent.duration;
    state.eventItemTimer = 0;
    state.directorNotice = state.activeEvent.name;
    // Notificación cinemática idéntica a la de los jefes para anunciar el evento
    state.bossIntro = {
      bossName: state.activeEvent.name,
      eventSubtitle: state.activeEvent.subtitle || '¡EVENTO ESPECIAL EN CURSO!',
      duration: 3.0,
      timer: 3.0,
      isEvent: true
    };
    state.shake = Math.max(state.shake || 0, 0.42);
  }
}

export function scoreMultiplier(state) {
  return state.activeEvent?.id === 'promo' ? 2 : state.activeEvent?.id === 'happy' ? 1.5 : 1;
}
