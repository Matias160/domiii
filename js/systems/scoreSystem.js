import { damageEnemy, burst, impactRing } from './effectSystem.js';
import { scoreMultiplier } from './directorSystem.js';

export function resolveDeaths(state, onLevelUp) {
  const resolved = new Set();
  const queue = state.enemies.filter(enemy => enemy.hp <= 0);
  for (let index=0;index<queue.length;index++) {
    const enemy = queue[index];
    if (resolved.has(enemy)) continue;
    resolved.add(enemy);
    state.combo = (state.combo || 0) + 1; state.comboTime = 3.5;
    applyComboReward(state);
    const multiplier = Math.min(3, 1 + Math.floor(state.combo / 5) * .25);
    if(state.combo%5===0&&state.floaters)state.floaters.push({x:state.player.x,y:state.player.y-45,text:`COMBO ${state.combo} / x${multiplier.toFixed(2)}`,life:1.15,color:'#93ffe0',scale:1.15});
    const gained=Math.round(enemy.score * state.difficulty.score * multiplier * scoreMultiplier(state));
    state.score += gained;
    if(state.floaters&&state.floaters.length<90)state.floaters.push({x:enemy.x,y:enemy.y+8,text:`+${gained}`,life:.75,color:'#91ffda',scale:.85});
    state.peakCombo = Math.max(state.peakCombo || 0, state.combo);
    state.kills += 1;
    if (enemy.isBoss) {
      state.bossesKilled = (state.bossesKilled || 0) + 1;
      state.bossDefeated = true;
      if (state.modeId === 'rush') state.nextBossAt = state.time + 9;
    }
    state.audio?.play(enemy.isBoss ? 'boss' : 'kill');
    if (state.player.explosionDamage > 0) {
      state.rings?.push({x:enemy.x,y:enemy.y,radius:72,life:.5,color:'#ff9965'});
      for (const other of state.enemies) if(other!==enemy && other.hp>0 && Math.hypot(other.x-enemy.x,other.y-enemy.y)<72) {
        damageEnemy(state,other,state.player.explosionDamage);
        if(other.hp<=0)queue.push(other);
      }
    }
    if (enemy.isBoss && state.player.hp > 0) state.player.hp = Math.min(state.player.maxHp, state.player.hp + 25);
    const particleCount = enemy.isBoss ? 30 : 24;
    for (let i=0;i<particleCount;i++) {
      const angle = i * Math.PI * 2 / particleCount;
      if(state.particles.length<800){const speed=(enemy.isBoss?200:145)*(.35+Math.random()*.65);state.particles.push({x:enemy.x,y:enemy.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:enemy.isBoss?.95:.6,color:'#ffda73',size:2+Math.random()*3,drag:.92,palette:['#fffbe8','#ffda73','#ff8a3d','#ff3535']});}
    }
    const levels = state.player.gainXp(enemy.xp);
    for (let level = 0; level < levels; level += 1) onLevelUp();
  }
  state.enemies = state.enemies.filter(enemy=>!resolved.has(enemy));
}

export function applyComboReward(state) {
  const combo=state.combo||0,p=state.player;
  let label='',color='#91ffda';
  if(combo===10){p.buffs.speedMultiplier=Math.max(p.buffs.speedMultiplier,1.35);p.buffs.speedTime=Math.max(p.buffs.speedTime,6);label='COMBO 10 / ACELERON';}
  if(combo===20){p.buffs.fireRateMultiplier=Math.min(p.buffs.fireRateMultiplier,.55);p.buffs.fireTime=Math.max(p.buffs.fireTime,6);label='COMBO 20 / CADENCIA';color='#ffd75f';}
  if(combo===30){p.buffs.damageMultiplier=Math.max(p.buffs.damageMultiplier,1.65);p.buffs.damageTime=Math.max(p.buffs.damageTime,8);p.comboFeverTime=Math.max(p.comboFeverTime,8);label='COMBO 30 / FIEBRE DE COCINA';color='#ff5d9e';}
  if(!label)return false;
  state.directorNotice=label;state.shake=Math.max(state.shake,.2);state.audio?.play('level');
  impactRing(state,p.x,p.y,color);burst(state,p.x,p.y,color,26,180);
  state.floaters?.push({x:p.x,y:p.y-48,text:label,life:1.3,color,scale:1.25});
  return true;
}

export function addSurvivalScore(state, delta) {
  state.score += delta * 1.5 * state.difficulty.score * scoreMultiplier(state);
}
