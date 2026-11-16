import { createRunState } from '../js/core/runState.js';
import { updateEnemies } from '../js/systems/enemySystem.js';
import { updateProjectiles } from '../js/systems/projectileSystem.js';
import { updateItems } from '../js/systems/itemSystem.js';
import { updateMap } from '../js/systems/mapSystem.js';
import { updateDirector } from '../js/systems/directorSystem.js';
import { resolveDeaths, addSurvivalScore } from '../js/systems/scoreSystem.js';
import { updateEffects, capEffects, impactRing } from '../js/systems/effectSystem.js';
import { updatePrimes, activatePrime } from '../js/systems/primeSystem.js';
import { getAbilityChoices, applyAbility, abilities } from '../js/data/abilities.js';
import { supportClasses } from '../js/systems/teamTrainingSystem.js';
import { evolveWeapon } from '../js/data/weaponEvolutions.js';

const fields=['world','time','score','kills','damageDealt','mapId','modeId','difficulty','mapClock','mapObstacles','wasFreezing','enemies','projectiles','enemyProjectiles','items','hazards','bossZones','rings','particles','floaters','dashGhosts','decoy','wave','waveRest','bossesKilled','peakCombo','combo','comboTime','activeEvent','eventRemaining','bossIntro','deliveryChest','bossDying','pickups','cartographyProgress','distance'];
const plain=value=>JSON.parse(JSON.stringify(value,(key,v)=>['skills','hitEnemies'].includes(key)||typeof v==='function'?undefined:v));

export class CoopSession {
  constructor(id, shared, members) {
    this.id=id;this.state=createRunState({...shared,...members[0].gear,name:members[0].name});
    this.state.holdSpawns=false;
    this.members=members.map((member,i)=>{
      const run=i===0?this.state:createRunState({...shared,...member.gear,name:member.name});
      run.player.x=920+i*80;run.player.y=540;
      return {id:member.id,player:run.player,companion:run.companion,supportClass:member.supportClass,input:{x:0,y:0,pressed:[]},supportCooldown:0,auraTime:0,revive:0,choices:[],choiceTime:0,damage:0};
    });
  }
  input(id,data){const m=this.members.find(m=>m.id===id);if(m){m.input=data;m.inputAt=Date.now();}}
  action(id,action,value){
    const m=this.members.find(m=>m.id===id);if(!m||m.player.hp<=0||this.outcome)return;
    this.state.player=m.player;this.state.primeCooldowns=m.primes||={q:0,e:0,r:0};
    if(action==='prime'&&['q','e','r'].includes(value))activatePrime(this.state,value);
    if(action==='ability'){
      const ability=abilities.find(a=>a.id===value);
      if(m.choices.includes(value)&&applyAbility(m.player,ability)){m.choices=[];m.choiceTime=0;}
    }
    if(action==='support'&&m.supportCooldown<=0){
      const config=supportClasses[m.supportClass];m.auraTime=config.duration;m.supportCooldown=config.cooldown;
      impactRing(this.state,m.player.x,m.player.y,config.color);
      if(m.supportClass==='blue'){
        for(const ally of this.members)if(ally.player.hp>0&&Math.hypot(ally.player.x-m.player.x,ally.player.y-m.player.y)<=config.radius)ally.player.invulnerable=Math.max(ally.player.invulnerable,2);
        for(const enemy of this.state.enemies){const dx=enemy.x-m.player.x,dy=enemy.y-m.player.y,d=Math.hypot(dx,dy);if(d>0&&d<config.radius){enemy.x+=dx/d*45;enemy.y+=dy/d*45;}}
      }
    }
  }
  tick(delta=1/30){
    if(this.outcome)return;
    const s=this.state;s.time+=delta;updateDirector(s,delta,s.world);updateEffects(s,delta);
    const living=this.members.filter(m=>m.player.hp>0);
    for(const m of this.members){
      m.supportCooldown=Math.max(0,m.supportCooldown-delta);m.auraTime=Math.max(0,m.auraTime-delta);
      if(m.choiceTime>0){m.choiceTime-=delta;if(m.choiceTime<=0)m.choices=[];}
      if(m.player.hp<=0)continue;
      if(m.inputAt&&Date.now()-m.inputAt>500)m.input={x:0,y:0,pressed:[]};
      s.player=m.player;s.companion=m.companion;s.primeCooldowns=m.primes||={q:0,e:0,r:0};
      s.camera={x:Math.max(0,Math.min(960,m.player.x-480)),y:Math.max(0,Math.min(540,m.player.y-270))};
      const pressed=new Set(m.input.pressed||[]);m.input.pressed=[];
      m.player.update(delta,{getAxis:()=>({x:m.input.x,y:m.input.y}),consume:k=>pressed.delete(k)},s.world);
      m.player.skills?.update(delta,s);evolveWeapon(m.player);
      let boosted=false,healing=false;
      for(const source of living)if(source.auraTime>0&&Math.hypot(source.player.x-m.player.x,source.player.y-m.player.y)<supportClasses[source.supportClass].radius){
        if(source.supportClass==='red')boosted=true;if(source.supportClass==='green')healing=true;
      }
      if(healing)m.player.hp=Math.min(m.player.maxHp,m.player.hp+6*delta);
      const baseDamage=m.player.damageMultiplier;if(boosted)m.player.damageMultiplier*=1.25;
      const damageBefore=s.damageDealt;
      // Share one world clock; retain each player's own movement, cooldowns and upgrades.
      const step=delta/Math.max(1,living.length);
      updatePrimes(s,step);
      for(const key of ['q','e','r'])s.primeCooldowns[key]=Math.max(0,(s.primeCooldowns[key]||0)-(delta-step));
      updateMap(s,step);updateEnemies(s,step,s.world);
      m.companion.update(s,delta);updateProjectiles(s,step,s.world);updateItems(s,step,s.world);
      resolveDeaths(s,card=>{
        if(card){m.choices=getAbilityChoices(m.player).map(a=>a.id);m.choiceTime=10;}
        else m.player.hp=Math.min(m.player.maxHp,m.player.hp+12);
      });
      m.damage+=Math.max(0,s.damageDealt-damageBefore);m.player.damageMultiplier=baseDamage;
      const downed=this.members.find(other=>other!==m&&other.player.hp<=0);
      if(downed){
        downed.revive=m.input.revive&&Math.hypot(downed.player.x-m.player.x,downed.player.y-m.player.y)<85?downed.revive+delta:0;
        if(downed.revive>=3){downed.player.hp=downed.player.maxHp*.35;downed.player.invulnerable=2;downed.revive=0;}
      }
    }
    if(s.bossIntro){s.bossIntro.timer-=delta;if(s.bossIntro.timer<=0)s.bossIntro=null;}
    if(s.bossRage)s.bossRage=null;
    if(s.bossDying){s.bossDying.timer-=delta;if(s.bossDying.timer<=0){s.bossDying=null;s.bossesKilled++;s.victory=true;}}
    for(const hazard of s.hazards)hazard.life-=delta;s.hazards=s.hazards.filter(h=>h.life>0);
    addSurvivalScore(s,delta);capEffects(s);
    if(this.members.every(m=>m.player.hp<=0))this.outcome='defeat';
    if(s.victory)this.outcome='victory';
  }
  snapshot(id){
    const m=this.members.find(m=>m.id===id),s=this.state,out={};
    for(const key of fields)if(s[key]!==undefined)out[key]=s[key];
    for(const enemy of s.enemies)enemy.networkId ||= `${this.id}-${this.nextEntityId=(this.nextEntityId||0)+1}`;
    out.particles=s.particles.slice(-100);out.floaters=s.floaters.slice(-25);
    out.player=m.player;out.companion=m.companion;out.primeCooldowns=m.primes||{q:0,e:0,r:0};
    out.players=this.members.map(other=>({id:other.id,player:other.player,companion:other.companion,supportClass:other.supportClass,auraTime:other.auraTime,revive:other.revive}));
    out.online={id:this.id,supportCooldown:m.supportCooldown,supportClass:m.supportClass,choices:m.choices,choiceTime:m.choiceTime,outcome:this.outcome||null};
    out.damageDealt=m.damage;
    return plain(out);
  }
}
