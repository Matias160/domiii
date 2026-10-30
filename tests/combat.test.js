import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunState } from '../js/core/runState.js';
import { Enemy, enemyTypes, BOSS_SUMMON, BOSS_RAGE } from '../js/entities/Enemy.js';
import { Projectile } from '../js/entities/Projectile.js';
import { Item } from '../js/entities/Item.js';
import { items } from '../js/data/items.js';
import { updateProjectiles } from '../js/systems/projectileSystem.js';
import { updateEnemies, enemyCap } from '../js/systems/enemySystem.js';
import { resolveDeaths, CARD_METER } from '../js/systems/scoreSystem.js';
import { updateDirector, scoreMultiplier, RUSH_BOSS_GOAL } from '../js/systems/directorSystem.js';
import { updateEffects } from '../js/systems/effectSystem.js';
import { updateItems } from '../js/systems/itemSystem.js';
import { abilities, applyAbility, getAbilityChoices } from '../js/data/abilities.js';
import { evolveWeapon, weaponEvolutions } from '../js/data/weaponEvolutions.js';
import { damageEnemy } from '../js/systems/effectSystem.js';

const bounds = {width:960,height:540};
const idle = {getAxis:()=>({x:0,y:0}),consume:()=>false};
function enemy(state, x=300, boss=false) {
  const entity = new Enemy({x,y:300,type:enemyTypes.find(type=>Boolean(type.boss)===boss),difficulty:state.difficulty});
  entity.spawnTime=0;return entity;
}

test('temporary cadence expires without removing permanent upgrades',()=>{
  const {player} = createRunState();
  player.fireRateMultiplier=.82;player.buffs.fireRateMultiplier=.5;player.buffs.fireTime=.1;
  player.update(.2,idle,bounds);
  assert.equal(player.buffs.fireRateMultiplier,1);
  assert.equal(player.fireRateMultiplier,.82);
});

test('dash grants short immunity and cannot bypass its cooldown',()=>{
  const {player} = createRunState();
  const dash={getAxis:()=>({x:1,y:0}),consume:()=>true};
  player.update(.016,dash,bounds);
  assert.ok(player.x>490);assert.equal(player.takeDamage(50),false);
  const cooldown=player.dashCooldown;
  player.update(.1,dash,bounds);
  assert.ok(player.dashCooldown<cooldown);
  player.update(.3,idle,bounds);
  assert.equal(player.takeDamage(50),true);
});

test('dash collision damages and pushes each enemy only once per dash',()=>{
  const state=createRunState(),target=enemy(state,state.player.x+1);target.y=state.player.y;state.enemies=[target];state.spawnTimer=99;
  state.player.dashTime=.1;state.player.dashSequence=1;const hp=target.hp,x=target.x;
  updateEnemies(state,0,bounds);assert.ok(target.hp<hp);assert.notEqual(target.x,x);assert.equal(state.player.hp,state.player.maxHp);
  const after=target.hp;updateEnemies(state,0,bounds);assert.equal(target.hp,after);
});

test('fast projectiles collide along the path, nearest target first',()=>{
  const state=createRunState();state.player.fireCooldown=10;
  const near=enemy(state,150),far=enemy(state,230);state.enemies=[far,near];
  state.projectiles=[new Projectile({x:80,y:300,vx:6000,vy:0,damage:12,size:3,color:'#fff'})];
  updateProjectiles(state,.033,bounds);
  assert.equal(near.hp,near.maxHp-12);assert.equal(far.hp,far.maxHp);assert.equal(state.projectiles.length,0);
});

test('reverse-order death chain resolves in one frame and awards kills only once',()=>{
  const state=createRunState();state.player.explosionDamage=60;
  const first=enemy(state,350),second=enemy(state,300),third=enemy(state,250);
  third.hp=0;state.enemies=[first,second,third];
  resolveDeaths(state,()=>{});
  assert.equal(state.enemies.length,0);assert.equal(state.kills,3);
  const score=state.score;resolveDeaths(state,()=>{});assert.equal(state.score,score);
});

test('combo milestones grant speed, cadence and kitchen fever rewards',()=>{
  const rewards=[
    {before:9,check:p=>p.buffs.speedTime>0&&p.buffs.speedMultiplier>1},
    {before:19,check:p=>p.buffs.fireTime>0&&p.buffs.fireRateMultiplier<1},
    {before:29,check:p=>p.comboFeverTime>0&&p.buffs.damageMultiplier>1},
  ];
  for(const reward of rewards){
    const state=createRunState();state.combo=reward.before;const target=enemy(state);target.hp=0;state.enemies=[target];
    resolveDeaths(state,()=>{});assert.equal(state.combo,reward.before+1);assert.equal(reward.check(state.player),true);assert.match(state.directorNotice,/COMBO/);
  }
});

test('all six weapons evolve once at level 15 with distinct identities',()=>{
  const ids=new Set();
  for(const weaponId of Object.keys(weaponEvolutions)){
    const state=createRunState({weaponId});state.player.level=15;
    const evolution=evolveWeapon(state.player);
    assert.ok(evolution);ids.add(evolution.id);assert.equal(evolveWeapon(state.player),null);
  }
  assert.equal(ids.size,6);
});

test('support enemies shield, heal and summon with readable roles',()=>{
  const state=createRunState(),shield=new Enemy({x:220,y:260,type:enemyTypes.find(type=>type.role==='shield'),difficulty:state.difficulty});
  shield.spawnTime=0;const originalRandom=Math.random;Math.random=()=>.5;
  try{damageEnemy(state,shield,20);}finally{Math.random=originalRandom;}
  assert.equal(shield.hp,shield.maxHp-10);

  const healer=new Enemy({x:300,y:300,type:enemyTypes.find(type=>type.role==='healer'),difficulty:state.difficulty});
  const ally=enemy(state,350);healer.spawnTime=0;healer.roleTimer=0;ally.hp-=20;state.enemies=[healer,ally];
  healer.update(.1,state.player,state);assert.ok(ally.hp>ally.maxHp-20);

  const summoner=new Enemy({x:420,y:300,type:enemyTypes.find(type=>type.role==='summoner'),difficulty:state.difficulty});
  summoner.spawnTime=0;summoner.roleTimer=0;state.enemies=[summoner];summoner.update(.1,state.player,state);
  assert.equal(state.enemies.length,3);assert.equal(state.enemies.filter(unit=>unit.type.id==='fries').length,2);
});

test('each boss gets serious at 65% HP with its own telegraphed special attack',()=>{
  const bosses=enemyTypes.filter(type=>type.boss&&type.bossStyle!=='colossus'),kinds=[];
  for(const type of bosses){
    const state=createRunState(),boss=new Enemy({x:480,y:250,type,difficulty:state.difficulty});boss.spawnTime=0;boss.hp=boss.maxHp*.49;boss.specialTimer=0;state.enemies=[boss];
    updateEnemies(state,.016,bounds);assert.equal(boss.phaseTwo,true);assert.match(state.directorNotice,/SE PONE SERIO/);assert.equal(state.bossZones.length,1);kinds.push(state.bossZones[0].kind);
  }
  assert.deepEqual(new Set(kinds), new Set(['shockwave', 'snipe', 'rain', 'meteor', 'freeze']));
});

test('boss reward does not revive a defeated player',()=>{
  const state=createRunState();state.player.hp=0;
  const boss=enemy(state,400,true);boss.enraged=true;boss.hp=0;state.enemies=[boss];
  resolveDeaths(state,()=>{});assert.equal(state.player.hp,0);assert.equal(state.bossesKilled,1);
});

test('waves respect rest, track spawn budget and end after the eighth clear',()=>{
  const state=createRunState({modeId:'waves'});
  updateEnemies(state,.1,bounds);assert.equal(state.enemies.length,0);
  updateDirector(state,2,bounds);updateEnemies(state,.25,bounds);
  assert.equal(state.enemies.length,1);assert.equal(state.waveRemaining,9);
  state.waveRemaining=0;state.enemies=[];updateDirector(state,.1,bounds);
  assert.equal(state.wave,2);assert.equal(state.waveRest,4);
  state.wave=8;state.waveRemaining=0;state.enemies=[];state.waveBossPending=false;
  updateDirector(state,.1,bounds);assert.equal(state.victory,true);
});

test('boss rush rotates through three bosses and has a victory condition',()=>{
  const state=createRunState({modeId:'rush'});const names=new Set();
  for(let i=0;i<RUSH_BOSS_GOAL;i++){
    state.time=state.nextBossAt;updateEnemies(state,.016,bounds);
    const boss=state.enemies.find(e=>e.isBoss);assert.ok(boss);names.add(boss.type.name);
    boss.hp=0;state.enemies=[boss];resolveDeaths(state,()=>{});
    assert.ok(boss.enraged&&boss.hp>0,'first defeat starts the second phase');
    boss.hp=0;resolveDeaths(state,()=>{});
  }
  updateDirector(state,.016,bounds);assert.ok(names.size>=3);assert.equal(state.victory,true);
});

test('event multipliers expire, and item shower respects the item cap',()=>{
  const state=createRunState();state.time=32;
  updateDirector(state,.016,bounds,()=>.4);assert.equal(state.activeEvent.id,'promo');assert.equal(scoreMultiplier(state),2);
  updateDirector(state,19,bounds,()=>.4);assert.equal(scoreMultiplier(state),1);assert.equal(state.activeEvent,null);
  state.time=state.nextEventAt;updateDirector(state,.01,bounds,()=>0);
  for(let i=0;i<12;i++)updateDirector(state,1,bounds,()=>0);
  assert.ok(state.items.length>1 && state.items.length<=9);
});

test('delivery companion moves items toward the player and pickups apply',()=>{
  const state=createRunState({companionId:'drone'}),p=state.player;p.hp=20;
  const item=new Item({type:items.mayo,x:p.x+100,y:p.y,random:()=>0});state.items=[item];
  state.companion.update(state,.5);assert.ok(item.x<p.x+100);
  updateItems(state,.016,bounds);
  assert.equal(state.pickups.mayo,1);assert.ok(p.hp>20);
});

test('three simulated minutes keep combat state finite with all special abilities',()=>{
  const state=createRunState({companionId:'ketchup'}),p=state.player;
  for(const ability of abilities)applyAbility(p,ability);
  p.maxHp=100000;p.hp=100000;
  const input={getAxis:()=>({x:Math.cos(state.time*.65),y:Math.sin(state.time*.65)}),consume:()=>false};
  for(let frame=0;frame<60*180;frame++){
    const delta=1/60;state.time+=delta;
    p.update(delta,input,bounds);updateDirector(state,delta,bounds,()=>.4);
    updateEffects(state,delta);updateEnemies(state,delta,bounds);
    state.companion.update(state,delta);updateProjectiles(state,delta,bounds);updateItems(state,delta,bounds);
    resolveDeaths(state,()=>{const choice=getAbilityChoices(p,()=>.3)[0];if(choice)applyAbility(p,choice);});
  }
  assert.ok(state.kills>20);assert.ok(Number.isFinite(state.score));assert.ok(p.hp>0);
  assert.ok(state.particles.length<700);
  for(const entity of [...state.enemies,...state.projectiles,state.player])assert.ok(Number.isFinite(entity.x)&&Number.isFinite(entity.y));
});

test('resolveDeaths grants ability level-up flag strictly every 2 levels even across multi-level jumps',()=>{
  const state=createRunState();
  const target=enemy(state);
  target.hp=0;
  target.xp=500;
  state.enemies=[target];
  const flags=[];
  resolveDeaths(state,(isAbility)=>flags.push(isAbility));
  assert.ok(flags.length>=5);
  assert.deepEqual(flags.slice(0,5),[true,false,true,false,true],'levels 2, 4, 6 grant upgrade cards');
});

test('kamikaze chili arms near the player, charges along its warning line and explodes',()=>{
  const state=createRunState();const p=state.player;p.x=600;p.y=500;p.hp=p.maxHp=500;
  const type=enemyTypes.find(t=>t.kamikaze);assert.ok(type,'kamikaze type exists');
  const chili=new Enemy({x:p.x+200,y:p.y,type,difficulty:state.difficulty});chili.spawnTime=0;
  const bystander=new Enemy({x:p.x+40,y:p.y+20,type:enemyTypes.find(t=>t.id==='burger'),difficulty:state.difficulty});bystander.spawnTime=0;
  state.enemies=[chili,bystander];
  updateEnemies(state,.016,bounds);
  assert.equal(chili.kamikazeState,'arm');
  const armedX=chili.x;
  for(let i=0;i<30;i++)updateEnemies(state,.016,bounds);
  assert.equal(chili.x,armedX,'stays still while arming');
  for(let i=0;i<60&&!chili.exploded;i++)updateEnemies(state,.016,bounds);
  assert.equal(chili.exploded,true);assert.equal(chili.hp,0);
  assert.ok(p.hp<500,'blast hurts the player it hit');
  assert.ok(bystander.hp<bystander.maxHp,'blast also hurts nearby enemies');
});

test('a defeated boss releases a ring of helpers with at most one kamikaze, within the enemy cap',()=>{
  const state=createRunState();const boss=enemy(state,500,true);boss.enraged=true;boss.hp=0;state.enemies=[boss];
  resolveDeaths(state,()=>{});
  const helpers=state.enemies.filter(e=>!e.isBoss);
  assert.ok(helpers.length>=4&&helpers.length<=6);
  assert.ok(helpers.filter(e=>e.type.kamikaze).length<=1);
  assert.ok(helpers.every(e=>e.spawnTime>0),'helpers get a spawn warning');
  const crowded=createRunState();const big=enemy(crowded,500,true);big.enraged=true;big.hp=0;
  crowded.enemies=[big,...Array.from({length:enemyCap()+8},()=>enemy(crowded,300))];
  resolveDeaths(crowded,()=>{});
  assert.ok(crowded.enemies.length<=enemyCap()+8,'never exceeds the cap margin');
});

test('regular spawning stops at the enemy cap',()=>{
  const state=createRunState();state.nextBossAt=Infinity;
  state.enemies=Array.from({length:enemyCap()},()=>enemy(state,300));
  state.spawnTimer=0;updateEnemies(state,.016,bounds);
  assert.equal(state.enemies.filter(e=>e.hp>0).length,enemyCap());
});

test('boss entrance preserves regular enemies and spawning continues during boss fight',async()=>{
  const { startBossEntrance, updateBossEntrance } = await import('../js/ui/bossEntrance.js');
  const state=createRunState({difficultyId:'suave'});state.player.hp=state.player.maxHp=1e6;
  const boss=enemy(state,600,true);boss.spawnTime=1.6;
  state.enemies=[boss,...Array.from({length:12},()=>enemy(state,300))];
  const kills=state.kills,score=state.score;
  const entrance=startBossEntrance(state,boss,state.camera,{w:960,h:540});
  assert.equal(state.enemies.length, 13, 'regular enemies are preserved on boss entrance');
  assert.equal(boss.spawnTime,0);
  assert.equal(state.kills,kills);assert.equal(state.score,score);
  let frames=0;while(!updateBossEntrance(entrance,1/60,null))frames++;
  assert.ok(frames>60,'entrance lasts a moment');
  state.spawnTimer=0;state.nextBossAt=Infinity;
  const helperCounts=[];
  for(let s=0;s<16;s++){for(let i=0;i<60;i++)updateEnemies(state,1/60,bounds);helperCounts.push(state.enemies.filter(e=>!e.isBoss).length);}
  assert.ok(helperCounts.at(-1)>0,'enemies and helpers continue to spawn while the boss is alive');
});

test('mustard rain drops splash in an area, slow enemies and leave burning puddles',()=>{
  const state=createRunState();const p=state.player;p.x=600;p.y=600;
  const mustard=abilities.find(a=>a.id==='mustardRain');applyAbility(p,mustard);
  const targets=Array.from({length:4},(_,i)=>{const e=enemy(state,640+i*12);e.y=600;e.hp=e.maxHp=400;return e;});
  state.enemies=targets;p.rainTimer=0;
  updateEffects(state,.016);
  assert.equal(state.mustardDrops.length,7,'level 1 drops 7');
  for(let i=0;i<120;i++){state.time+=1/60;updateEffects(state,1/60);}
  assert.equal(state.mustardDrops.length,0);
  assert.ok(targets.every(e=>e.hp<400),'every enemy in the splash took damage');
  assert.ok(targets.some(e=>e.mustardSlowUntil>state.time),'splash slows');
  assert.ok(state.hazards.some(h=>h.isMustardPuddle));
  assert.ok(p.rainTimer>6,'next rain waits ~8 s');
});

test('card pacing never shows two cards back to back and never leaves long droughts',async()=>{
  const { bankCard, cardIsDue, CARD_PACING } = await import('../js/systems/cardPacing.js');
  const state=createRunState();const shown=[];
  for(let frame=0;frame<60*300;frame++){
    state.time+=1/60;
    if(frame%240===0){bankCard(state);bankCard(state);} // la barra se llena muy seguido (peor caso)
    if(cardIsDue(state)){shown.push(state.time);state.pendingLevels=0;}
  }
  const gaps=shown.map((t,i)=>i?t-shown[i-1]:t);
  assert.ok(shown[0]>=CARD_PACING.firstAt-0.1);
  assert.ok(gaps.slice(1).every(g=>g>=CARD_PACING.minGap-0.05),'minimum spacing between cards');
  const dry=createRunState();const dryShown=[];
  for(let frame=0;frame<60*200;frame++){dry.time+=1/60;if(cardIsDue(dry)){dryShown.push(dry.time);dry.pendingLevels=0;}}
  assert.ok(dryShown.length>=3,'cards still arrive when the meter is not filling');
  assert.ok(dryShown.every((t,i)=>!i||t-dryShown[i-1]<=CARD_PACING.maxGap+0.05),'maximum spacing between cards');
});

test('a boss "dies" once into an enraged second phase before it can be defeated',()=>{
  const state=createRunState();const boss=enemy(state,500,true);
  const speed=boss.speed,radius=boss.radius,kills=state.kills;
  boss.hp=0;state.enemies=[boss];state.enemyProjectiles=[{x:1,y:1,vx:0,vy:0,radius:4,damage:1,life:3}];
  resolveDeaths(state,()=>{});
  assert.equal(state.enemies.includes(boss),true,'the boss survives its first defeat');
  assert.equal(boss.enraged,true);assert.equal(boss.hp,Math.round(boss.maxHp*BOSS_RAGE.hpRestore));
  assert.ok(boss.speed>speed&&boss.radius>radius,'faster and bigger');
  assert.equal(state.bossRage,boss,'asks the game for the rage cutscene');
  assert.equal(state.enemyProjectiles.length,0,'clears bullets for a fair restart');
  assert.equal(state.kills,kills);assert.equal(state.bossesKilled||0,0);
  boss.hp=0;resolveDeaths(state,()=>{});
  assert.equal(state.bossesKilled,1,'the second defeat is final');
});

test('a boss knocked to 0 HP by a puddle never lets a duplicate boss spawn (regresión: doble Señor Ketchup)',()=>{
  const state=createRunState();
  state.time=60;state.nextBossAt=60;updateEnemies(state,.016,bounds);
  const boss=state.enemies.find(e=>e.isBoss);assert.ok(boss);boss.spawnTime=0;
  // Pelea larga: ya pasó el momento agendado para el próximo jefe y un charco lo deja en 0 antes de revisar
  state.time+=200;boss.hp=0;
  updateEnemies(state,.016,bounds);
  assert.equal(state.enemies.filter(e=>e.isBoss).length,1,'only one boss at a time');
  resolveDeaths(state,()=>{});
  assert.equal(state.enemies.filter(e=>e.isBoss).length,1,'the same boss enters its second phase');
});

test('after a boss falls the next one waits BOSS_GAP seconds, never sooner',async()=>{
  const { BOSS_GAP } = await import('../js/systems/directorSystem.js');
  const state=createRunState();state.player.hp=state.player.maxHp=1e6;
  state.time=60;state.nextBossAt=60;updateEnemies(state,.016,bounds);
  const boss=state.enemies.find(e=>e.isBoss);boss.enraged=true;boss.hp=0;
  state.time=400;resolveDeaths(state,()=>{});
  assert.equal(state.nextBossAt,400+BOSS_GAP);
  state.enemies=[];
  for(let t=0;t<BOSS_GAP-1;t+=1){state.time=400+t;updateEnemies(state,.016,bounds);}
  assert.equal(state.enemies.filter(e=>e.isBoss).length,0,'no boss during the break');
  state.time=400+BOSS_GAP;updateEnemies(state,.016,bounds);
  assert.equal(state.enemies.filter(e=>e.isBoss).length,1,'next boss right after the break');
});

test('the second-phase transformation zooms on the boss, ends by itself and restores the camera',async()=>{
  const { startBossRage, updateBossEntrance, RAGE } = await import('../js/ui/bossEntrance.js');
  const state=createRunState();const boss=enemy(state,500,true);
  const rage=startBossRage(state,boss);let peak=1,frames=0;
  while(!updateBossEntrance(rage,1/60,null)){peak=Math.max(peak,rage.zoom);frames++;}
  assert.ok(peak>1.15,'camera zooms in while charging');
  assert.equal(rage.zoom,1,'camera back to normal');
  assert.ok(frames>=Math.floor(RAGE.duration*60)-2);
  assert.ok(rage.burst,'transformation burst happened');
});

test('every boss gets its own exclusive attack in the second phase, different from phase one',async()=>{
  const { RAGE_ATTACKS } = await import('../js/entities/Enemy.js');
  const seen=new Set();
  for(const type of enemyTypes.filter(t=>t.boss&&t.bossStyle!=='colossus')){
    const state=createRunState();state.player.hp=state.player.maxHp=1e6;state.player.x=700;state.player.y=600;
    const boss=new Enemy({x:600,y:450,type,difficulty:state.difficulty});boss.spawnTime=0;state.enemies=[boss];
    boss.enrage(state);state.bossRage=null;
    const style=type.bossStyle||'default';
    let announced=null,bullets=0,zones=new Set();
    for(let i=0;i<60*8;i++){
      updateEnemies(state,1/60,bounds);
      for(const f of state.floaters)if(f.kind==='fire')announced=f.text;
      bullets=Math.max(bullets,state.enemyProjectiles.length);
      for(const z of state.bossZones)zones.add(z.kind);
    }
    assert.equal(announced!==null,true,`${type.name} anuncia su ataque`);
    seen.add(RAGE_ATTACKS[style].name);
    if(style==='fast')assert.ok(zones.has('rain'),'estampida de papas');
    if(style==='frost')assert.ok(zones.has('freeze'),'prisión de hielo');
    if(['default','ranged','heavy'].includes(style))assert.ok(bullets>20,`${type.name} dispara su patrón`);
    assert.ok(!zones.has(style==='ranged'?'snipe':style==='heavy'?'meteor':'shockwave'),'el especial de la fase 1 ya no se usa');
  }
  assert.equal(seen.size,5,'cinco ataques distintos');
});

test('targeted boss zones hit where they were marked, not on the boss (regresión meteorito/ventisca)',()=>{
  const state=createRunState();const p=state.player;p.x=900;p.y=700;p.hp=p.maxHp=500;
  state.bossZones=[{kind:'meteor',x:200,y:200,targetX:900,targetY:700,radius:80,delay:0,life:1,damage:40,triggered:false}];
  updateEnemies(state,.016,bounds);
  assert.ok(p.hp<500,'the meteor lands on its mark');
  const s2=createRunState();const p2=s2.player;p2.x=200;p2.y=200;p2.hp=p2.maxHp=500;
  s2.bossZones=[{kind:'freeze',x:200,y:200,targetX:900,targetY:700,radius:80,delay:0,life:1,damage:40,triggered:false}];
  updateEnemies(s2,.016,bounds);
  assert.equal(p2.hp,500,'standing next to the boss is safe from a zone marked elsewhere');
});

test('returningSkewer clears hitEnemies on return and cadence accessories reduce fireCooldown',()=>{
  const state=createRunState({weaponId:'skewer',accessoryId:'leg_archmage'});
  assert.ok(state.player.fireRateMultiplier < 1, 'leg_archmage must reduce fireRateMultiplier below 1');
  const bowtieState=createRunState({weaponId:'fork',accessoryId:'bowtie'});
  bowtieState.manualAim=true;bowtieState.aimPoint={x:bowtieState.player.x+200,y:bowtieState.player.y};
  updateProjectiles(bowtieState,0,bounds);
  assert.ok(Math.hypot(bowtieState.projectiles[0].vx,bowtieState.projectiles[0].vy) > bowtieState.player.weapon.projectileSpeed);

  const target=enemy(state,state.player.x+80);target.y=state.player.y;target.maxHp=500;target.hp=500;
  state.enemies=[target];
  const skewerProj=new Projectile({x:state.player.x,y:state.player.y,vx:500,vy:0,damage:20,size:5,color:'#fff',pierce:3,kind:'skewer',boomerang:true});
  state.projectiles=[skewerProj];
  state.player.fireCooldown=99;
  updateProjectiles(state,0.2,bounds);
  const hpAfterOut=target.hp;
  assert.ok(hpAfterOut<500,'skewer hits on outbound path');
  updateProjectiles(state,0.35,bounds);
  assert.equal(skewerProj.returning,true);
  assert.ok(target.hp < hpAfterOut,'returning skewer hits enemy a second time on return');
});
