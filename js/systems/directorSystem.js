import { spawnItem } from './itemSystem.js';
import { Enemy, enemyTypes } from '../entities/Enemy.js';
import { Item } from '../entities/Item.js';
import { items, rarities } from '../data/items.js';
import { burst, impactRing } from './effectSystem.js';

export const RUSH_BOSS_GOAL = 3;
// Respiro mínimo entre que cae un jefe y aparece el siguiente (segundos de juego)
export const BOSS_GAP = 35;

export const modes = {
  survival: { name: 'Supervivencia', goal: 'Aguanta el ultimo turno' },
  waves: { name: 'Oleadas', goal: 'Completa las 8 oleadas' },
  rush: { name: 'Duelo de jefes', goal: `Derrota a los ${RUSH_BOSS_GOAL} Grandes Jefes` },
  boss_legendary: { name: '???', goal: 'Derrota al Coloso Final de la Lava' },
};

export const events = [
  { id: 'sauces', name: 'LLUVIA DE ADEREZOS', duration: 14, color: '#ffcf4a', subtitle: '¡BOTINES Y SALSAS ESPECIALES!' },
  { id: 'happy', name: 'HORA FELIZ', duration: 16, color: '#86e3bf', subtitle: '¡BONIFICACIÓN DE SCORE Y VELOCIDAD!' },
  { id: 'promo', name: 'PROMO 2x1', duration: 18, color: '#ff8580', subtitle: '¡PUNTOS Y MULTIPLICADORES DOBLES!' },
  { id: 'superwave', name: '¡SUPER OLEADA!', duration: 14, color: '#ff1144', subtitle: '¡ENJAMBRE MASIVO: OLEADA INTENSA!' },
  { id: 'delivery_truck', name: '🚚 CAMIÓN DE REPARTO', duration: 25, color: '#f59e0b', subtitle: '¡COFRE ACORAZADO EN LA ARENA! ¡ÁBRELO ANTES QUE EXPIRE!' },
  { id: 'health_inspection', name: '📋 INSPECCIÓN BROMATOLÓGICA', duration: 24, color: '#38bdf8', subtitle: '¡PATRULLA DE INSPECTORES! ¡DERROTALOS PARA PROPINAS GIGANTES!' },
];

export function openDeliveryChest(state) {
  const chest = state.deliveryChest;
  if (!chest || chest.opened) return;
  chest.opened = true;
  state.shake = Math.max(state.shake || 0, 0.65);
  state.audio?.play('synergy');
  state.rings?.push({ x: chest.x, y: chest.y, radius: 180, life: 0.85, maxLife: 0.85, color: '#ffd700' });
  state.rings?.push({ x: chest.x, y: chest.y, radius: 100, life: 0.55, maxLife: 0.55, color: '#ffffff' });

  burst(state, chest.x, chest.y, '#ffd700', 45, 260);
  burst(state, chest.x, chest.y, '#f59e0b', 35, 220);

  const worldW = state.world?.width || 1920;
  const worldH = state.world?.height || 1080;
  if (state.items) {
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const dist = 35 + Math.random() * 55;
      const ix = Math.max(40, Math.min(worldW - 40, chest.x + Math.cos(angle) * dist));
      const iy = Math.max(120, Math.min(worldH - 40, chest.y + Math.sin(angle) * dist));
      const rarity = i < 3 ? (rarities[3] || rarities[2]) : (rarities[2] || rarities[1]);
      const pool = [items.mayo, items.burger || items.barbecue || items.mayo, items.soda || items.hotSauce || items.mustard, items.mustard];
      const type = pool[i % pool.length];
      state.items.push(new Item({ type, rarity, x: ix, y: iy }));
    }
  }

  const bonus = Math.round(500 * (state.difficulty?.score || 1) * scoreMultiplier(state));
  state.score = (state.score || 0) + bonus;
  state.floaters?.push({
    x: chest.x,
    y: chest.y - 45,
    text: `🚚 ¡CARGAMENTO ACORAZADO! +${bonus} PTS`,
    life: 2.2,
    color: '#fde047',
    scale: 1.45,
    kind: 'combo'
  });
  state.deliveryChest = null;
}

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
  state.deliveryChest = null;
  state.nightShift = false;
  state.nightShiftLevel = 0;
  state.nightShiftTimer = 0;
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

  // Modo "Turno Nocturno 24hs" (Modo Infinito / Supervivencia Extrema a los 15 minutos / 900s)
  if (state.time >= 900) {
    if (!state.nightShift) {
      state.nightShift = true;
      state.nightShiftLevel = 1;
      state.nightShiftTimer = 0;
      state.bossIntro = {
        bossName: '🌙 TURNO NOCTURNO 24HS',
        eventSubtitle: '¡HORARIO DE TRASNOCHE! ¡SUPERVIVENCIA EXTREMA ACTIVADA!',
        duration: 4.2,
        timer: 4.2,
        isEvent: true
      };
      state.directorNotice = '🌙 ¡TURNO NOCTURNO 24HS ACTIVADO!';
      state.shake = 0.65;
      state.audio?.play('bossPhase');
    } else {
      state.nightShiftTimer = (state.nightShiftTimer || 0) + delta;
      if (state.nightShiftTimer >= 60) {
        state.nightShiftTimer -= 60;
        state.nightShiftLevel = (state.nightShiftLevel || 1) + 1;
        state.directorNotice = `🌙 ¡TURNO NOCTURNO NIVEL ${state.nightShiftLevel}!`;
        state.shake = 0.45;
        state.audio?.play('synergy');
        if (state.floaters && state.player) {
          state.floaters.push({
            x: state.player.x,
            y: state.player.y - 50,
            text: `🌙 ¡NOCTURNO NIVEL ${state.nightShiftLevel}!`,
            life: 2.0,
            color: '#c084fc',
            scale: 1.45,
            kind: 'combo'
          });
        }
      }
    }
  }

  // Actualización del cofre acorazado de reparto
  if (state.deliveryChest && !state.deliveryChest.opened) {
    state.deliveryChest.timer -= delta;
    state.deliveryChest.hitFlash = Math.max(0, (state.deliveryChest.hitFlash || 0) - delta);
    if (state.deliveryChest.timer <= 0) {
      if (state.floaters) {
        state.floaters.push({
          x: state.deliveryChest.x,
          y: state.deliveryChest.y - 25,
          text: '🚚 ¡EL CAMIÓN SE RETIRÓ!',
          life: 1.6,
          color: '#94a3b8',
          scale: 1.15
        });
      }
      state.deliveryChest = null;
    }
  }

  if (state.activeEvent) {
    state.eventRemaining = Math.max(0, state.eventRemaining - delta);
    if (state.eventRemaining <= 0) {
      state.activeEvent = null;
      state.nextEventAt = state.time + 32 + random() * 14;
    } else if (state.activeEvent.id !== 'promo' && state.activeEvent.id !== 'delivery_truck' && state.activeEvent.id !== 'health_inspection') {
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
      duration: 3.2,
      timer: 3.2,
      isEvent: true
    };
    state.shake = Math.max(state.shake || 0, 0.45);

    const p = state.player || { x: 500, y: 500 };
    const worldW = state.world?.width || bounds?.width || 1920;
    const worldH = state.world?.height || bounds?.height || 1080;

    // Disparador especial: Camión de Reparto (Cofre Acorazado)
    if (state.activeEvent.id === 'delivery_truck') {
      const angle = random() * Math.PI * 2;
      const dist = 220 + random() * 120;
      const cx = Math.max(90, Math.min(worldW - 90, p.x + Math.cos(angle) * dist));
      const cy = Math.max(140, Math.min(worldH - 90, p.y + Math.sin(angle) * dist));
      state.deliveryChest = {
        x: cx,
        y: cy,
        radius: 36,
        hp: 60,
        maxHp: 60,
        timer: 25,
        maxTimer: 25,
        opened: false,
        hitFlash: 0
      };
      // Escolta protectora de 5 carritos de reparto alrededor del cofre
      const kartType = enemyTypes.find(t => t.id === 'delivery_kart') || enemyTypes[0];
      if (state.enemies) {
        for (let k = 0; k < 5; k++) {
          const ka = (k / 5) * Math.PI * 2;
          const kx = Math.max(60, Math.min(worldW - 60, cx + Math.cos(ka) * 85));
          const ky = Math.max(140, Math.min(worldH - 60, cy + Math.sin(ka) * 85));
          state.enemies.push(new Enemy({
            x: kx,
            y: ky,
            type: kartType,
            difficulty: state.difficulty || { hp: 1, speed: 1, damage: 1, score: 1 }
          }));
        }
      }
      state.audio?.play('bossEntrance');
    }

    // Disparador especial: Inspección Bromatológica (Patrulla de Inspectores)
    if (state.activeEvent.id === 'health_inspection') {
      const inspectorType = enemyTypes.find(t => t.id === 'inspector');
      if (inspectorType && state.enemies) {
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + (random() - 0.5) * 0.3;
          const d = 320 + random() * 80;
          const ix = Math.max(60, Math.min(worldW - 60, p.x + Math.cos(a) * d));
          const iy = Math.max(140, Math.min(worldH - 60, p.y + Math.sin(a) * d));
          state.enemies.push(new Enemy({
            x: ix,
            y: iy,
            type: inspectorType,
            difficulty: state.difficulty || { hp: 1, speed: 1, damage: 1, score: 1 }
          }));
        }
      }
      state.audio?.play('bossEntrance');
    }
  }
}

export function scoreMultiplier(state) {
  let mult = state.activeEvent?.id === 'promo' ? 2 : state.activeEvent?.id === 'happy' ? 1.5 : 1;
  if (state.nightShift) {
    mult *= (1 + (state.nightShiftLevel || 1) * 0.5);
  }
  return mult;
}
