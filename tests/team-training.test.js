import test from 'node:test';
import assert from 'node:assert/strict';
import { createTeamTraining, activateSupport, applySupportAuras, stepTeamTraining } from '../js/systems/teamTrainingSystem.js';

test('support auras affect only living teammates within the radius and do not stack',()=>{
  const s=createTeamTraining({mode:'versus',players:[{supportClass:'red'},{supportClass:'red'}]});
  s.actors.forEach(a=>{a.x=240;a.y=270;});
  activateSupport(s);activateSupport(s,s.actors[2]);applySupportAuras(s,1);
  assert.equal(s.local.damageMultiplier,1.25);
  assert.equal(s.actors[2].damageMultiplier,1.25);
  assert.equal(s.actors[1].damageMultiplier,1);
  s.actors[2].x=600;s.actors[2].auraTime=0;applySupportAuras(s,1);
  assert.equal(s.actors[2].damageMultiplier,1);
});

test('green heals only within range, without overhealing or reviving',()=>{
  const s=createTeamTraining({mode:'versus',supportClass:'green',players:[{supportClass:'blue'},{supportClass:'green'}]});
  s.actors.forEach(a=>{a.x=240;a.y=270;a.hp=50;});
  activateSupport(s);applySupportAuras(s,1);
  assert.equal(s.local.hp,56);assert.equal(s.actors[1].hp,50);assert.equal(s.actors[2].hp,56);
  s.actors[2].hp=0;s.local.hp=99;applySupportAuras(s,1);
  assert.equal(s.local.hp,100);assert.equal(s.actors[2].hp,0);
});

test('blue grants a timed shield to nearby allies, repels rivals and respects cooldown',()=>{
  const s=createTeamTraining({mode:'versus',supportClass:'blue',players:[{supportClass:'red'},{supportClass:'green'}]});
  s.actors.forEach((a,i)=>{a.x=240+i*25;a.y=270;});
  assert.equal(activateSupport(s),true);assert.equal(activateSupport(s),false);
  assert.equal(s.local.shield,28);assert.equal(s.actors[2].shield,28);assert.equal(s.actors[1].shield,0);
  assert.ok(s.actors[1].x>265);
  for(let i=0;i<100;i++)stepTeamTraining(s,.05);
  assert.equal(s.local.shield,0);
});

test('training expires, does not continue after ending and stays within the arena',()=>{
  const s=createTeamTraining({players:[{supportClass:'green'}]});
  for(let i=0;i<200;i++)stepTeamTraining(s,.05,{x:1,y:1});
  assert.ok(s.local.x<=915&&s.local.y<=480);
  assert.ok(s.shots.length<100&&s.particles.length<=160);
  s.time=89.99;stepTeamTraining(s,.05);
  assert.equal(s.outcome,'defeat');const time=s.time;stepTeamTraining(s,.05);
  assert.equal(s.time,time);assert.equal(activateSupport(s),false);
});

test('versus ends at five KOs and rejects further state changes',()=>{
  const s=createTeamTraining({mode:'versus',players:[{supportClass:'red'}]});
  const enemy=s.actors[1];enemy.hp=1;s.scores.A=4;
  s.shots.push({x:enemy.x,y:enemy.y,vx:0,vy:0,team:'A',damage:20,radius:4,life:1});
  stepTeamTraining(s,.05);
  assert.equal(s.outcome,'victory');assert.equal(s.scores.A,5);
  const snapshot=JSON.stringify(s);stepTeamTraining(s,.05);
  assert.equal(JSON.stringify(s),snapshot);
});

test('a defeated teammate respawns after three seconds without reviving immediately',()=>{
  const s=createTeamTraining({mode:'versus',players:[{supportClass:'red'}]});
  s.local.hp=1;
  s.shots.push({x:s.local.x,y:s.local.y,vx:0,vy:0,team:'B',damage:20,radius:4,life:1});
  stepTeamTraining(s,.05);
  assert.equal(s.local.hp,0);assert.equal(activateSupport(s),false);
  for(let i=0;i<61;i++)stepTeamTraining(s,.05);
  assert.ok(s.local.hp>0);assert.equal(s.scores.B,1);
});
