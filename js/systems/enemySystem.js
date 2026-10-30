import { Enemy, enemyTypes, KAMIKAZE } from "../entities/Enemy.js";
import { quality } from '../core/quality.js';
import { circlesOverlap } from "../core/collision.js";
import { damageEnemy, explosionBurst, burst, impactRing } from './effectSystem.js';
import { RUSH_BOSS_GOAL } from './directorSystem.js';

export const difficulties = {
  suave: { id: "suave", name: "Suave", hp: 0.85, speed: 0.85, damage: 0.7, spawn: 1.25, score: 0.9 },
  picante: { id: "picante", name: "Picante", hp: 1, speed: 1, damage: 1, spawn: 1, score: 1 },
  extra: { id: "extra", name: "Extra picante", hp: 1.25, speed: 1.12, damage: 1.2, spawn: 0.82, score: 1.25 },
  quemado: { id: "quemado", name: "Modo quemado", hp: 1.55, speed: 1.3, damage: 1.45, spawn: 0.62, score: 1.6 },
};

// Mínimo de clientes vivos que se busca mantener (crece con el tiempo hasta un tope) y ritmo del relleno.
// El tope evita que la arena se llene cada vez más con el correr de la partida.
export const SPAWN_REFILL = { base: 4, growEvery: 20, max: 10, interval: 0.35, emptyBurst: 3, graceTime: 3 };

export function updateEnemies(state, delta, canvas) {
  // Durante el tutorial de inicio la arena queda vacía: no entran clientes ni jefes
  state.spawnTimer -= delta;
  // Durante el tutorial de inicio la arena queda vacía: no entran clientes ni jefes
  const hold = Boolean(state.holdSpawns);
  const isSuperwave = state.activeEvent?.id === 'superwave';
  const isPicante = state.difficulty?.id === 'picante' || state.difficulty?.id === 'extra';
  const isLavaMode = state.modeId === 'boss_legendary' || state.mapId === 'lava';

  // En la Super Oleada: reducida a la mitad en volumen e intensidad
  const currentCap = isSuperwave ? Math.max(70, Math.round(enemyCap() * 1.2)) : enemyCap();
  if (isSuperwave && !state.superwaveBursted && !hold) {
    state.superwaveBursted = true;
    const initialSwarm = Math.min(15, currentCap - state.enemies.length);
    for (let s = 0; s < initialSwarm; s++) {
      spawnEnemy(state, canvas, false, true);
    }
  } else if (!isSuperwave) {
    state.superwaveBursted = false;
  }

  const pressure = Math.max(0, 1 - state.time / 240);
  const baseSpawnEvery = state.difficulty.spawn * Math.max(0.32, 1.15 * pressure) * (state.activeEvent?.id === 'promo' ? .55 : 1);
  const spawnEvery = isSuperwave ? 0.16 : baseSpawnEvery;
  let bossSpawned = false;

  // Un jefe cuenta desde que aparece hasta que resolveDeaths lo saca, aunque un cuadro quede en 0 HP
  const activeBossCount = state.enemies.filter(enemy => enemy.isBoss && enemy.hp > 0).length;
  const waveBoss = state.modeId === 'waves' && state.waveRest <= 0 && state.waveBossPending;

  // Ciclo de jefes:
  // Ciclo 1 (rondas 0, 1, 2, 3): 1 jefe a la vez (Ketchup, Papota, Pizza, Subcero)
  // Tras cumplir el primer ciclo (4 jefes): spawnean 2 a la vez (ronda 4), luego 3 (ronda 5), 4 (ronda 6), etc.
  const round = state.bossWaveRound || 0;
  const howManyBosses = isLavaMode ? 1 : (round < 4 ? 1 : 2 + (round - 4));

  if (!hold && (state.time >= state.nextBossAt || waveBoss) && activeBossCount === 0) {
    if (state.modeId !== 'rush' || (state.bossesKilled || 0) < RUSH_BOSS_GOAL) {
      for (let b = 0; b < howManyBosses; b++) {
        spawnEnemy(state, canvas, true, false, b, howManyBosses);
      }
      state.bossWaveRound = round + 1;
      state.waveBossPending = false;
      // El próximo jefe se agenda cuando cae la tanda completa (scoreSystem), con BOSS_GAP de respiro
      state.nextBossAt = Infinity;
      bossSpawned = true;
    }
  }

  // Los enemigos normales continúan con su misma frecuencia de spawn incluso cuando aparece un jefe
  // En el Caldero de Lava el duelo es contra el Coloso: como mucho un ayudante a la vez
  const nonBossCount = isLavaMode ? state.enemies.filter(e => !e.isBoss && e.hp > 0).length : 0;
  const canSpawn = hold ? false : isLavaMode ? (activeBossCount > 0 && nonBossCount < 1 && state.time > 18) :
    state.modeId === 'waves' ? state.waveRest <= 0 && state.waveRemaining > 0 :
    state.modeId === 'rush' ? state.enemies.length < 18 : true;

  const alive = isLavaMode ? 0 : state.enemies.reduce((n, e) => n + (!e.isBoss && e.hp > 0 ? 1 : 0), 0);
  const starving = !isLavaMode && canSpawn && alive < Math.min(currentCap, SPAWN_REFILL.max, SPAWN_REFILL.base + Math.floor(state.time / SPAWN_REFILL.growEvery));
  if (starving) state.spawnTimer = Math.min(state.spawnTimer, alive === 0 ? 0 : SPAWN_REFILL.interval);
  if (canSpawn && state.spawnTimer <= 0 && state.enemies.length < currentCap) {
    const batch = isSuperwave ? 3 : (starving && alive === 0 && state.time > SPAWN_REFILL.graceTime ? SPAWN_REFILL.emptyBurst : 1);
    for (let i = 0; i < batch && state.enemies.length < currentCap; i++) {
      if (state.modeId === 'waves' && state.waveRemaining <= 0) break;
      spawnEnemy(state, canvas, false, starving || isSuperwave);
      if (state.modeId === 'waves') state.waveRemaining -= 1;
    }
    state.spawnTimer = isLavaMode ? 18.0 : state.modeId === 'rush' ? 1.85 : isSuperwave ? 0.16 : starving ? SPAWN_REFILL.interval : spawnEvery;
  }

  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    enemy.slowFactor = state.player.auraLevel > 0 && Math.hypot(enemy.x-state.player.x,enemy.y-state.player.y)<105 ? Math.pow(.75,state.player.auraLevel) : 1;
    enemy.update(delta, (!enemy.isBoss && state.decoy) ? state.decoy : state.player, state);
    if (enemy.spawnTime > 0) continue;
    if (enemy.shotReady) {
      enemy.shotReady = false;
      const target=(!enemy.isBoss && state.decoy)?state.decoy:state.player;const dx = target.x - enemy.x, dy = target.y - enemy.y;
      const length = Math.hypot(dx, dy) || 1;
      state.enemyProjectiles.push({ x: enemy.x, y: enemy.y, vx: dx / length * 245, vy: dy / length * 245, radius: 7, damage: enemy.damage * 0.65, life: 3 });
    }
    if (enemy.fuse !== undefined && enemy.fuse <= 0 && !enemy.exploded) {
      enemy.exploded = true;
      const kamikaze = Boolean(enemy.type.kamikaze);
      const blast = kamikaze ? KAMIKAZE.blastRadius : enemy.radius + state.player.radius + 24;
      state.rings?.push({x:enemy.x,y:enemy.y,radius:kamikaze?blast+18:enemy.radius+42,life:.6,color:'#ff6c70'});
      explosionBurst(state,enemy.x,enemy.y,'#ff654f',kamikaze?36:30,kamikaze?220:190);
      if (Math.hypot(state.player.x - enemy.x, state.player.y - enemy.y) < blast && state.player.takeDamage(enemy.damage)) {
        state.shake = 0.28;state.audio?.play('damage');
      }
      if (kamikaze) {
        // ¡BOOM! El ají también lastima a los enemigos que tenga al lado
        state.shake = Math.max(state.shake, 0.22);
        state.floaters?.push({ x: enemy.x, y: enemy.y - 26, text: '¡BOOM!', life: .8, kind: 'crit' });
        for (const other of state.enemies) {
          if (other !== enemy && other.hp > 0 && !other.isBoss && Math.hypot(other.x - enemy.x, other.y - enemy.y) < blast * 1.2) damageEnemy(state, other, enemy.damage * 1.6, 'fire');
        }
      }
      enemy.hp = 0;
    }
    if (enemy.hp > 0 && circlesOverlap(enemy, state.player)) {
      const player=state.player;
      if(player.dashTime>0&&enemy.lastDashSequence!==player.dashSequence){
        enemy.lastDashSequence=player.dashSequence;
        const dx=enemy.x-player.x,dy=enemy.y-player.y,length=Math.hypot(dx,dy)||1;
        enemy.x+=dx/length*42;enemy.y+=dy/length*42;
        // Los tanques (bandejas blindadas) mueren de un solo choque con el dash
        const dashDamage = enemy.role === 'shield' && !enemy.isBoss
          ? (enemy.hp + 1) * (enemy.armor || 1) + 1
          : (18+player.level*1.35)*player.damageMultiplier;
        damageEnemy(state,enemy,dashDamage,'dash');
        if (enemy.hp <= 0 && state.mapId === 'parking') {
          state.cartographyProgress = state.cartographyProgress || {};
          state.cartographyProgress.parking = (state.cartographyProgress.parking || 0) + 1;
        }
        state.score+=15;state.shake=Math.max(state.shake,.12);
        state.floaters?.push({x:enemy.x,y:enemy.y-34,text:'CHOQUE +15',life:.8,color:'#9fffe0',scale:1.1,kind:'dash'});
        impactRing(state,enemy.x,enemy.y,'#9fffe0');burst(state,enemy.x,enemy.y,'#9fffe0',14,145);state.audio?.play('kill');
      }else if(player.takeDamage(enemy.damage)){
        state.shake = 0.18;state.audio?.play('damage');
      }
    }
  }
  updateBossZones(state,delta);
  return bossSpawned;
}

// Tope de enemigos vivos: alto para que no se note, y baja solo si la calidad automática lo pide
export function enemyCap() { return quality.maxEnemies; }

// Al caer un jefe sus "ayudantes" salen disparados en ronda (respetando el tope de enemigos)
const BOSS_MINION_IDS = ['fries', 'burger', 'soda', 'chili'];
export function spawnBossMinions(state, boss) {
  const room = enemyCap() + 8 - state.enemies.length;
  const count = Math.min(6, room);
  if (count <= 0) return 0;
  const worldW = state.world?.width || 1920, worldH = state.world?.height || 1080;
  const pool = enemyTypes.filter(type => !type.boss && BOSS_MINION_IDS.includes(type.id));
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const distance = boss.radius + 34;
    // Como mucho un kamikaze por camada, para que sea emocionante y no injusto
    const type = i === 0 ? pool.find(t => t.id === 'chili') : pool.filter(t => t.id !== 'chili')[i % (pool.length - 1)];
    const minion = new Enemy({
      x: Math.max(60, Math.min(worldW - 60, boss.x + Math.cos(angle) * distance)),
      y: Math.max(140, Math.min(worldH - 40, boss.y + Math.sin(angle) * distance)),
      type, difficulty: state.difficulty
    });
    minion.spawnTime = 0.7 + i * 0.08;
    state.enemies.push(minion);
  }
  state.rings?.push({ x: boss.x, y: boss.y, radius: boss.radius + 60, life: .7, maxLife: .7, color: '#ffae00' });
  state.floaters?.push({ x: boss.x, y: boss.y - boss.radius - 30, text: '¡AYUDANTES!', life: 1.3, kind: 'combo', comboVal: 20 });
  return count;
}

function updateBossZones(state,delta){
  state.bossZones ||= [];
  for(const zone of state.bossZones){
    zone.delay-=delta;zone.life-=delta;
    if(zone.delay>0||zone.triggered)continue;
    zone.triggered=true;state.shake=Math.max(state.shake,.2);
    if(zone.kind==='snipe'||zone.kind==='laser_sweep'){
      const dx=zone.targetX-zone.x,dy=zone.targetY-zone.y,length=Math.hypot(dx,dy)||1;
      const offsets = zone.kind==='laser_sweep' ? [-.28,-.18,-.09,0,.09,.18,.28] : [-.12,0,.12];
      for(const offset of offsets){
        const angle=Math.atan2(dy,dx)+offset;
        state.enemyProjectiles.push({
          x:zone.x,y:zone.y,
          vx:Math.cos(angle)*(zone.kind==='laser_sweep'?390:365),
          vy:Math.sin(angle)*(zone.kind==='laser_sweep'?390:365),
          radius:zone.kind==='laser_sweep'?8:6,
          damage:zone.damage,
          life:3,
          color:zone.kind==='laser_sweep'?'#ff2200':'#ff4f9a'
        });
      }
    }else{
      const targeted=zone.kind==='rain'||zone.kind==='meteor'||zone.kind==='freeze';
      const x=targeted?zone.targetX:zone.x,y=targeted?zone.targetY:zone.y;
      const inside=Math.hypot(state.player.x-x,state.player.y-y)<zone.radius+state.player.radius;
      if(inside&&zone.kind==='freeze')state.player.buffs.slowTime=Math.max(state.player.buffs.slowTime||0,1.6);
      if(inside&&state.player.takeDamage(zone.damage)){state.audio?.play('damage');}
      state.rings?.push({x,y,radius:zone.radius,life:.5,maxLife:.5,color:zone.kind==='rain'?'#ffd34f':'#ff5f75'});
      explosionBurst(state,x,y,zone.kind==='rain'?'#ffd34f':'#ff5f75',zone.kind==='rain'?24:32,180);
    }
  }
  state.bossZones=state.bossZones.filter(zone=>zone.life>0);

  if (state.bossFireRings && state.bossFireRings.length > 0) {
    const remainingRings = [];
    for (const ring of state.bossFireRings) {
      ring.radius += ring.speed * delta;
      const dist = Math.hypot(state.player.x - ring.x, state.player.y - ring.y);
      if (!ring.hitPlayer && Math.abs(dist - ring.radius) < 26) {
        if (state.player.dashTime > 0 || state.player.invulnerableTime > 0) {
          ring.hitPlayer = true;
          state.floaters?.push({
            x: state.player.x, y: state.player.y - 30,
            text: '¡DASH PERFECTO!', color: '#00ffcc', life: 1.0, scale: 1.25
          });
          state.rings?.push({ x: state.player.x, y: state.player.y, radius: 48, life: 0.35, maxLife: 0.35, color: '#00ffcc' });
        } else {
          ring.hitPlayer = true;
          if (state.player.takeDamage(ring.damage)) {
            state.audio?.play('damage');
            state.shake = Math.max(state.shake, 0.35);
          }
        }
      }
      if (ring.radius < ring.maxRadius) {
        remainingRings.push(ring);
      }
    }
    state.bossFireRings = remainingRings;
  }
}

function spawnEnemy(state, canvas, boss = false, nearEdge = false, bossSlot = 0, totalBosses = 1) {
  const worldW = state.world?.width || 1920;
  const worldH = state.world?.height || 1080;
  const vw = state.view?.w || 960, vh = state.view?.h || 540;
  const cam = state.camera || { x: (worldW - vw) / 2, y: (worldH - vh) / 2 };
  const p = state.player;

  let px, py;
  if (boss) {
    if (totalBosses > 1) {
      const spacing = Math.min(220, (vw - 160) / Math.max(1, totalBosses));
      const startX = cam.x + vw / 2 - ((totalBosses - 1) * spacing) / 2;
      px = startX + bossSlot * spacing;
      py = Math.max(160, Math.min(worldH - 120, cam.y + vh * 0.32 + (bossSlot % 2 === 0 ? 0 : 25)));
    } else {
      px = Math.max(80, Math.min(worldW - 80, cam.x + vw / 2 + (Math.random() - 0.5) * 180));
      py = Math.max(170, Math.min(worldH - 120, cam.y + vh * 0.34));
    }
  } else {
    if (nearEdge || Math.random() < 0.7) {
      const side = Math.floor(Math.random() * 4);
      const margin = 40 + Math.random() * 60;
      if (side === 0) {
        px = cam.x + Math.random() * vw;
        py = cam.y - margin;
      } else if (side === 1) {
        px = cam.x + vw + margin;
        py = cam.y + Math.random() * vh;
      } else if (side === 2) {
        px = cam.x + Math.random() * vw;
        py = cam.y + vh + margin;
      } else {
        px = cam.x - margin;
        py = cam.y + Math.random() * vh;
      }
    } else {
      const angle = Math.random() * Math.PI * 2;
      const dist = 520 + Math.random() * 240;
      px = p.x + Math.cos(angle) * dist;
      py = p.y + Math.sin(angle) * dist;
    }
  }

  px = Math.max(40, Math.min(worldW - 40, px));
  py = Math.max(130, Math.min(worldH - 40, py));
  const position = { x: px, y: py };
  const currentMap = state.mapId || 'diner';
  const nativeForMap = enemyTypes.filter(t => !t.boss && t.nativeMap === currentMap);
  const globalNormals = enemyTypes.filter(t => !t.boss && !t.nativeMap && !t.eventOnly);
  const maxGlobal = state.time > 65 ? globalNormals.length : state.time > 35 ? 5 : state.time > 15 ? 4 : 2;
  const availableGlobals = globalNormals.slice(0, maxGlobal);

  const bosses = enemyTypes.filter(record => record.boss);
  const spawnedBossIndex = state.bossIndexCursor || 0;
  if (boss) state.bossIndexCursor = spawnedBossIndex + 1;
  const colossusBoss = enemyTypes.find(t => t.id === 'lava_boss') || bosses[0];
  const regularBosses = bosses.filter(b => b.id !== 'lava_boss');

  let chosenType;
  if (boss) {
    chosenType = state.mapId === 'lava' ? colossusBoss : regularBosses[spawnedBossIndex % regularBosses.length];
  } else {
    // Si hay enemigos nativos exclusivos para este mapa, aparecen con un 32% de probabilidad
    if (nativeForMap.length > 0 && Math.random() < 0.32) {
      chosenType = nativeForMap[Math.floor(Math.random() * nativeForMap.length)];
    } else {
      chosenType = availableGlobals[Math.floor(Math.random() * availableGlobals.length)];
    }
  }
  const type = chosenType;
  if (type.id === 'onion') {
    const angle = Math.random() * Math.PI * 2;
    position.x = Math.max(62, Math.min(worldW - 62, state.player.x + Math.cos(angle) * 165));
    position.y = Math.max(130, Math.min(worldH - 40, state.player.y + Math.sin(angle) * 165));
  }
  const growth = 1 + Math.max(0, state.time - 60) / 260;
  // En modo Duelo de Jefes ("rush"), los jefes son mucho más resistentes y escalan en cada ronda
  const rushBossHpMult = (boss && state.modeId === 'rush')
    ? (2.45 + spawnedBossIndex * 0.48)
    : (boss ? (1.7 + (state.bossesKilled || 0) * 0.35) : 1);
  const rushBossSpdMult = (boss && state.modeId === 'rush') ? (1.06 + spawnedBossIndex * 0.03) : 1;
  const nightSpdMult = state.nightShift ? (1.12 + ((state.nightShiftLevel || 1) - 1) * 0.06) : 1;
  const difficulty = {
    ...state.difficulty,
    hp: state.difficulty.hp * growth * rushBossHpMult,
    speed: state.difficulty.speed * (state.mapId === 'kitchen' ? 1.08 : 1) * rushBossSpdMult * nightSpdMult
  };
  const spawned = new Enemy({ ...position, type, difficulty });
  if (boss && state.modeId === 'rush') {
    spawned.bossRank = spawnedBossIndex + 1;
  }
  state.enemies.push(spawned);
}
