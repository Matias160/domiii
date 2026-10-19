import test from 'node:test';
import assert from 'node:assert/strict';
import {canvasPoint,approachPoint} from '../js/core/presentation.js';
import {createRunState} from '../js/core/runState.js';
import {updateProjectiles} from '../js/systems/projectileSystem.js';
import {updateMap} from '../js/systems/mapSystem.js';

test('lobby pointer mapping ignores letterbox space and preserves world position',()=>{
  const rect={left:20,top:10,width:1200,height:540};
  assert.equal(canvasPoint(rect,960,540,40,100),null);
  assert.deepEqual(canvasPoint(rect,960,540,620,280),{x:480,y:270});
  const end=approachPoint({x:100,y:100},{x:103,y:104},220,.033);
  assert.deepEqual(end,{x:103,y:104,arrived:true});
});

test('manual aim fires toward the cursor without requiring an enemy',()=>{
  const state=createRunState();state.manualAim=true;state.aimPoint={x:480,y:130};
  updateProjectiles(state,0,{width:960,height:540});
  assert.equal(state.projectiles.length,1);
  assert.ok(state.projectiles[0].vy<0);
  assert.ok(Math.abs(state.projectiles[0].vx)<.001);
  state.manualAim=false;state.player.fireCooldown=0;state.projectiles=[];
  updateProjectiles(state,0,{width:960,height:540});
  assert.equal(state.projectiles.length,0);
});

test('map hazard warning gives time before travel and contact damage',()=>{
  const state=createRunState({mapId:'football'});state.mapClock=4.5;
  updateMap(state,.016);const obstacle=state.mapObstacles[0],x=obstacle.x;
  assert.ok(obstacle.warning>0);
  updateMap(state,.2);assert.equal(obstacle.x,x);
  obstacle.warning=0;obstacle.x=state.player.x;obstacle.y=state.player.y;obstacle.vx=0;obstacle.vy=0;
  updateMap(state,.016);assert.ok(state.player.hp<state.player.maxHp);
});
