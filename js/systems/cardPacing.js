// ============================================================================
// DOMI 2: PANCHO - RITMO DE CARTAS DE MEJORA
// La barra de cartas (CARD_METER en scoreSystem) dice cuándo "se ganó" una carta;
// este reparto decide cuándo se MUESTRA, para que salgan bien distribuidas:
//  - nunca dos seguidas: al menos minGap segundos de juego entre una y otra
//  - nunca una sequía: si pasan maxGap segundos sin carta, se entrega igual
//  - como mucho maxBanked cartas guardadas esperando su turno
// El tiempo es de juego (state.time): las pausas y la entrada del jefe no cuentan.
// ============================================================================
import { getAbilityChoices } from '../data/abilities.js';

export const CARD_PACING = { firstAt: 18, minGap: 22, maxGap: 45, maxBanked: 1 };

// Encola una carta ganada por la barra, sin acumular de más
export function bankCard(state) {
  state.pendingLevels = Math.min(CARD_PACING.maxBanked, (state.pendingLevels || 0) + 1);
}

// ¿Toca mostrar una carta ahora? Marca el momento si devuelve true
export function cardIsDue(state) {
  const player = state.player;
  if (!getAbilityChoices(player).length) { state.pendingLevels = 0; return false; }
  const last = state.lastCardAt ?? (CARD_PACING.firstAt - CARD_PACING.minGap);
  const since = state.time - last;
  let due = state.pendingLevels > 0 && since >= CARD_PACING.minGap;
  if (!due && since >= CARD_PACING.maxGap) {
    // Sequía: se entrega una carta y la barra arranca de cero para no regalar otra enseguida
    state.pendingLevels = 1;
    player.cardXp = 0;
    due = true;
  }
  if (due) state.lastCardAt = state.time;
  return due;
}
