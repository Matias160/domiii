import test from 'node:test';
import assert from 'node:assert/strict';
import {register,login,logout,currentAccount,purchase,equip,awardRun} from '../js/systems/accountSystem.js';
import {createRunState} from '../js/core/runState.js';
import {activatePrime,updatePrimes} from '../js/systems/primeSystem.js';
import {updateMap} from '../js/systems/mapSystem.js';
import {DomiScreen} from '../js/ui/domi.js';

function storage(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
test('local profiles isolate points, purchases and run rewards',async()=>{
  globalThis.localStorage=storage();globalThis.sessionStorage=storage();
  await register('CuentaUno','clave123');
  const result={id:'one',score:1000,kills:2,level:50,damageDealt:50000,timeText:'01:00',map:'diner',outcome:'defeat'};
  awardRun(result);awardRun(result);assert.equal(currentAccount().bank,50);
  assert.equal(currentAccount().runs.length,1);
  for(let i=0;i<9;i++)awardRun({id:'extra'+i,score:1000,damageDealt:50000,map:'diner'});
  assert.equal(currentAccount().bank,500);
  purchase('skin','nugget');equip('skin','nugget');assert.equal(currentAccount().bank,50);
  assert.equal(currentAccount().loadout.skin,'nugget');
  logout();await register('CuentaDos','clave456');assert.equal(currentAccount().bank,0);
  assert.equal(currentAccount().purchases.length,0);
  logout();await assert.rejects(login('CuentaInexistente'));
  await login('CuentaUno');assert.equal(currentAccount().bank,50);
});

test('run rewards grant scarce coins from effective damage and always grant at least one',async()=>{
  globalThis.localStorage=storage();globalThis.sessionStorage=storage();
  await register('Economia','clave123');
  awardRun({id:'short',score:99999,level:1,damageDealt:12,map:'diner'});
  awardRun({id:'fight',score:1,level:2,damageDealt:2600,map:'diner'});
  awardRun({id:'long',score:1,level:20,damageDealt:100000,map:'diner'});
  assert.equal(currentAccount().bank,53);
});

test('run rewards always include a base coin and add one per five levels',async()=>{
  globalThis.localStorage=storage();globalThis.sessionStorage=storage();
  await register('PremioNivel','clave123');
  awardRun({id:'base',score:0,level:1,damageDealt:0});
  awardRun({id:'level-five',score:0,level:5,damageDealt:0});
  awardRun({id:'level-ten',score:0,level:10,damageDealt:0});
  assert.equal(currentAccount().bank,6);
});

test('primes unlock at levels 10, 20 and 30 with cooldowns',()=>{
  const s=createRunState();assert.equal(activatePrime(s,'q'),false);
  s.player.level=10;assert.equal(activatePrime(s,'q'),true);assert.equal(s.projectiles.length,20);
  assert.equal(activatePrime(s,'q'),false);updatePrimes(s,22);assert.equal(activatePrime(s,'q'),true);
  s.player.level=20;assert.equal(activatePrime(s,'e'),true);assert.ok(s.decoy);
  s.player.level=30;assert.equal(activatePrime(s,'r'),true);assert.ok(s.player.shieldTime>0);
});

test('snow freezes periodically and moving hazards spawn only on special maps',()=>{
  const snow=createRunState({mapId:'snow'});updateMap(snow,29);assert.equal(snow.wasFreezing,true);
  const desert=createRunState({mapId:'desert'});updateMap(desert,5);assert.equal(desert.mapObstacles.length,1);
  const football=createRunState({mapId:'football'});updateMap(football,5);assert.equal(football.mapObstacles.length,2);
});

test('awardRun persists combo, time and bossesKilled so all 14 Don Domi missions can be completed',async()=>{
  globalThis.localStorage=storage();globalThis.sessionStorage=storage();
  await register('DomiTester','clave123');
  for(let i=0;i<7;i++){
    awardRun({id:'r'+i,score:2500,kills:150,level:15,time:320,timeText:'05:20',peakCombo:50,bossesKilled:1,map:'diner',outcome:'victory'});
  }
  const profile=currentAccount();
  const missions=DomiScreen.prototype.getMissions(profile);
  assert.equal(missions.length,14);
  assert.ok(missions.every(m=>m.isDone===true),'all 14 missions including m_legendary_lava must be completable');
  const slots=DomiScreen.prototype.getCollectionSlots(profile);
  assert.ok(slots.every(s=>s.stats && s.stats.spd !== undefined),'every almanac slot must define stats.spd');
});

test('completing all 14 Founder missions unlocks Señor Domi skin', async () => {
  globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
  await register('FounderChampion', 'pass123');
  for (let i = 0; i < 7; i++) {
    awardRun({ id: 'f' + i, score: 2500, kills: 150, level: 15, time: 320, timeText: '05:20', peakCombo: 50, bossesKilled: 1, map: 'diner', outcome: 'victory' });
  }
  const prevDoc = globalThis.document;
  const mockCtx = new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') {
        return () => ({ addColorStop() {} });
      }
      return typeof prop === 'string' ? () => {} : undefined;
    },
    set: () => true
  });
  const createMockNode = () => ({
    className: '',
    style: {},
    append() {},
    classList: { add() {} },
    addEventListener() {},
    querySelector: () => createMockNode(),
    getContext: () => mockCtx
  });
  globalThis.document = {
    querySelector: () => createMockNode(),
    createElement: () => createMockNode()
  };
  try {
    const domiScreen = new DomiScreen({ audio: { play() {} }, showScreen() {} });
    const dummyEl = { append() {}, classList: { add() {} } };
    domiScreen.renderMissions(dummyEl, currentAccount());

    assert.ok(currentAccount().purchases.includes('skin:domi'), 'skin:domi should be granted upon completing all 14 missions');
  } finally {
    if (prevDoc === undefined) delete globalThis.document;
    else globalThis.document = prevDoc;
  }
});
