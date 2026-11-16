import { clamp, sweptOverlap } from '../core/collision.js';

export const supportClasses = {
  red: { name:'Rojo / Impulsor', upper:'ROJO / IMPULSOR', skill:'IMPULSO +25%', color:'#ff596d', cooldown:18, duration:6, radius:130 },
  green: { name:'Verde / Sanador', upper:'VERDE / SANADOR', skill:'PULSO DE VIDA', color:'#4bda9b', cooldown:16, duration:7, radius:130 },
  blue: { name:'Azul / Guardián', upper:'AZUL / GUARDIÁN', skill:'ESCUDO GRUPAL', color:'#54aaff', cooldown:22, duration:4, radius:130 }
};

function actor(id, team, supportClass, x, y, skinId='pancho') {
  return {id,team,supportClass,x,y,skinId,radius:17,hp:100,maxHp:100,shield:0,shieldTime:0,cooldown:0,auraTime:0,fireTime:1,respawn:0,damageMultiplier:1};
}

export function createTeamTraining({ mode='coop', supportClass='red', players=[], skinId='pancho' }={}) {
  mode=mode==='versus'?'versus':'coop';
  const local=actor('local','A',supportClasses[supportClass]?supportClass:'red',240,270,skinId);
  const actors=[local,...players.slice(0,3).map((player,i)=>actor(`bot-${i}`,mode==='versus'&&i%2===0?'B':'A',player.supportClass,mode==='versus'&&i%2===0?730:280,180+i*80,['nugget','pizza','papas'][i]))];
  const state={mode,actors,local,time:0,remaining:90,scores:{A:0,B:0},shots:[],particles:[],spawnTimer:0,nextEnemy:0,outcome:null};
  return state;
}

function spark(state,x,y,color,count=14) {
  for(let i=0;i<count;i++){
    const angle=i/count*Math.PI*2;
    state.particles.push({x,y,vx:Math.cos(angle)*100,vy:Math.sin(angle)*100,life:.55,color});
  }
  if(state.particles.length>160)state.particles.splice(0,state.particles.length-160);
}

export function activateSupport(state, source=state.local) {
  const config=supportClasses[source.supportClass];
  if(state.outcome||!config||source.hp<=0||source.cooldown>0)return false;
  source.cooldown=config.cooldown;source.auraTime=config.duration;
  spark(state,source.x,source.y,config.color,24);
  if(source.supportClass==='blue'){
    for(const ally of state.actors){
      if(ally.hp>0&&ally.team===source.team&&Math.hypot(ally.x-source.x,ally.y-source.y)<=config.radius){
        ally.shield=Math.max(ally.shield,28);ally.shieldTime=config.duration;
      }
    }
    for(const enemy of state.actors){
      const dx=enemy.x-source.x,dy=enemy.y-source.y,d=Math.hypot(dx,dy);
      if(enemy.hp>0&&enemy.team!==source.team&&d<config.radius){
        enemy.x=clamp(enemy.x+dx/(d||1)*65,45,915);enemy.y=clamp(enemy.y+dy/(d||1)*65,110,480);
      }
    }
  }
  return true;
}

export function applySupportAuras(state, delta) {
  for(const actor of state.actors)actor.damageMultiplier=1;
  const healed=new Set();
  for(const source of state.actors){
    const config=supportClasses[source.supportClass];
    if(source.hp<=0||source.auraTime<=0||!config)continue;
    for(const ally of state.actors){
      if(ally.hp<=0||ally.team!==source.team||Math.hypot(ally.x-source.x,ally.y-source.y)>config.radius)continue;
      if(source.supportClass==='red')ally.damageMultiplier=1.25;
      if(source.supportClass==='green'&&!healed.has(ally.id)){
        ally.hp=Math.min(ally.maxHp,ally.hp+6*delta);healed.add(ally.id);
      }
    }
  }
}

function hit(state, target, damage, sourceTeam) {
  if(state.outcome||target.hp<=0)return;
  const absorbed=Math.min(target.shield,damage);target.shield-=absorbed;
  target.hp=Math.max(0,target.hp-(damage-absorbed));
  spark(state,target.x,target.y,target.team==='A'?'#8debd5':'#ffaf65',6);
  if(target.hp===0){
    target.respawn=3;target.auraTime=0;state.scores[sourceTeam]++;
    spark(state,target.x,target.y,'#ffe066',22);
    if(state.mode==='versus'&&state.scores[sourceTeam]>=5)state.outcome=sourceTeam==='A'?'victory':'defeat';
    if(state.mode==='coop'&&state.scores.A>=12)state.outcome='victory';
  }
}

export function stepTeamTraining(state, delta, axis={x:0,y:0}) {
  if(state.outcome)return;
  delta=clamp(Number(delta)||0,0,.05);state.time+=delta;state.remaining=Math.max(0,90-state.time);
  if(state.remaining===0){state.outcome=state.mode==='versus'?(state.scores.A===state.scores.B?'draw':state.scores.A>state.scores.B?'victory':'defeat'):'defeat';return;}
  if(state.mode==='coop'){
    state.spawnTimer-=delta;
    if(state.spawnTimer<=0&&state.actors.filter(a=>a.team==='B'&&a.hp>0).length<5){
      state.spawnTimer=3;const n=state.nextEnemy++;
      state.actors.push(actor(`enemy-${n}`,'B',null,890,140+n%4*90,'soda'));
    }
  }
  for(const a of state.actors){
    if(a.hp<=0){
      a.respawn-=delta;
      if(a.respawn<=0&&!(state.mode==='coop'&&a.team==='B')){
        a.hp=a.maxHp;a.shield=0;a.shieldTime=0;a.x=a.team==='A'?160:800;a.y=270;
      }
      continue;
    }
    a.cooldown=Math.max(0,a.cooldown-delta);a.auraTime=Math.max(0,a.auraTime-delta);
    a.shieldTime=Math.max(0,a.shieldTime-delta);if(!a.shieldTime)a.shield=0;
    const enemies=state.actors.filter(e=>e.team!==a.team&&e.hp>0);
    const target=enemies.reduce((best,e)=>!best||Math.hypot(e.x-a.x,e.y-a.y)<Math.hypot(best.x-a.x,best.y-a.y)?e:best,null);
    let dx=0,dy=0;
    if(a===state.local){dx=Number(axis.x)||0;dy=Number(axis.y)||0;}
    else if(target){
      const goal=a.team==='A'&&state.mode==='coop'?state.local:target;
      const distance=Math.hypot(goal.x-a.x,goal.y-a.y);
      if(distance>(goal===state.local?85:190)){dx=(goal.x-a.x)/(distance||1);dy=(goal.y-a.y)/(distance||1);}
    }
    const length=Math.max(1,Math.hypot(dx,dy)),speed=a===state.local?205:95;
    a.x=clamp(a.x+dx/length*speed*delta,45,915);a.y=clamp(a.y+dy/length*speed*delta,110,480);
    if(a!==state.local&&a.cooldown===0&&target&&supportClasses[a.supportClass])activateSupport(state,a);
    a.fireTime-=delta;
    if(target&&a.fireTime<=0&&Math.hypot(target.x-a.x,target.y-a.y)<640){
      a.fireTime=a.team==='B'&&state.mode==='coop'?1.6:.8;
      const angle=Math.atan2(target.y-a.y,target.x-a.x);
      state.shots.push({x:a.x,y:a.y,vx:Math.cos(angle)*400,vy:Math.sin(angle)*400,team:a.team,damage:12*a.damageMultiplier,radius:4,life:2});
    }
  }
  applySupportAuras(state,delta);
  for(const shot of state.shots){
    shot.previousX=shot.x;shot.previousY=shot.y;shot.x+=shot.vx*delta;shot.y+=shot.vy*delta;shot.life-=delta;
    for(const target of state.actors){
      if(shot.life>0&&target.hp>0&&target.team!==shot.team&&sweptOverlap(shot,target)){shot.life=0;hit(state,target,shot.damage,shot.team);break;}
    }
  }
  state.shots=state.shots.filter(s=>s.life>0);
  state.actors=state.actors.filter(a=>!(state.mode==='coop'&&a.team==='B'&&a.hp<=0));
  for(const p of state.particles){p.x+=p.vx*delta;p.y+=p.vy*delta;p.life-=delta;}
  state.particles=state.particles.filter(p=>p.life>0);
}
