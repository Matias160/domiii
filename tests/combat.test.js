import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunState } from '../js/core/runState.js';
import { Enemy, enemyTypes } from '../js/entities/Enemy.js';
import { Projectile } from '../js/entities/Projectile.js';
import { Item } from '../js/entities/Item.js';
import { items } from '../js/data/items.js';
import { updateProjectiles } from '../js/systems/projectileSystem.js';
import { updateEnemies } from '../js/systems/enemySystem.js';
import { resolveDeaths } from '../js/systems/scoreSystem.js';
import { updateDirector, scoreMultiplier } from '../js/systems/directorSystem.js';
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

test('each boss enters a distinct telegraphed second phase',()=>{
  const bosses=enemyTypes.filter(type=>type.boss),kinds=[];
  for(const type of bosses){
    const state=createRunState(),boss=new Enemy({x:480,y:250,type,difficulty:state.difficulty});boss.spawnTime=0;boss.hp=boss.maxHp*.49;boss.specialTimer=0;state.enemies=[boss];
    updateEnemies(state,.016,bounds);assert.equal(boss.phaseTwo,true);assert.match(state.directorNotice,/FASE 2/);assert.equal(state.bossZones.length,1);kinds.push(state.bossZones[0].kind);
  }
  assert.deepEqual(new Set(kinds),new Set(['shockwave','snipe','rain']));
});

test('boss reward does not revive a defeated player',()=>{
  const state=createRunState();state.player.hp=0;
  const boss=enemy(state,400,true);boss.hp=0;state.enemies=[boss];
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
  for(let i=0;i<3;i++){
    state.time=state.nextBossAt;updateEnemies(state,.016,bounds);
    const boss=state.enemies.find(e=>e.isBoss);assert.ok(boss);names.add(boss.type.name);
    boss.hp=0;state.enemies=[boss];resolveDeaths(state,()=>{});
  }
  updateDirector(state,.016,bounds);assert.equal(names.size,3);assert.equal(state.victory,true);
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
