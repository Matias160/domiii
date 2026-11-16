import test from 'node:test';
import assert from 'node:assert/strict';
import { CoopSession } from '../server/coopSession.js';

const members=[{id:'a',name:'A',supportClass:'red',gear:{}},{id:'b',name:'B',supportClass:'green',gear:{skinId:'nugget'}}];
test('cooperative session reuses the game world and advances both players without duplicate world clocks',()=>{
  const session=new CoopSession('run',{mapId:'diner',modeId:'survival'},members);
  session.input('a',{x:1,y:0,pressed:[]});session.input('b',{x:-1,y:0,pressed:[]});
  for(let i=0;i<90;i++)session.tick();
  const a=session.snapshot('a'),b=session.snapshot('b');
  assert.ok(Math.abs(a.time-3)<.01);assert.equal(a.time,b.time);assert.equal(a.online.id,b.online.id);
  assert.ok(a.player.x>920);assert.ok(b.player.x<1000);assert.ok(a.enemies.length>0);
  assert.doesNotThrow(()=>JSON.stringify(a));
});
test('cooperative support has cooldowns and a nearby living player can revive a teammate',()=>{
  const session=new CoopSession('run',{mapId:'diner'},members),[a,b]=session.members;
  b.player.hp=0;a.player.invulnerable=100;
  session.input('a',{x:0,y:0,pressed:[],revive:true});
  for(let i=0;i<95;i++)session.tick();
  assert.ok(b.player.hp>0);assert.equal(session.outcome,undefined);
  session.action('a','support');const cooldown=a.supportCooldown;session.action('a','support');assert.equal(a.supportCooldown,cooldown);
});

test('cooperative snapshots stay serializable across every map and retain stable enemy identifiers',()=>{
  for(const mapId of ['diner','kitchen','parking','snow','desert','football','lava','beach']){
    const session=new CoopSession(mapId,{mapId,modeId:'survival'},members);
    for(const m of session.members)m.player.invulnerable=1000;
    for(let i=0;i<600;i++)session.tick();
    const snapshot=session.snapshot('a');
    assert.equal(snapshot.mapId,mapId);assert.ok(Number.isFinite(snapshot.time));
    assert.doesNotThrow(()=>JSON.stringify(snapshot));
    assert.ok(snapshot.enemies.every(enemy=>!!enemy.networkId));
  }
});
