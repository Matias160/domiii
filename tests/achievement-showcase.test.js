import test from 'node:test';
import assert from 'node:assert/strict';
import { achievementProgress, achievementTiers } from '../js/systems/achievementSystem.js';

test('achievement counters use the three frames, not the six internal objectives',()=>{
  const local=globalThis.localStorage,session=globalThis.sessionStorage;
  let stats={kills:10,seconds:600,bosses:1,pickups:{}};
  globalThis.localStorage={getItem:()=>JSON.stringify(stats)};
  globalThis.sessionStorage={getItem:()=>null};
  try{
    assert.deepEqual(achievementProgress(),{percentage:50,unlocked:1,total:3});
    stats={};assert.equal(achievementProgress().unlocked,0);
    stats={kills:10,seconds:600,bosses:3,distance:1000000,pickups:{ketchup:20}};
    assert.deepEqual(achievementProgress(),{percentage:100,unlocked:3,total:3});
    assert.deepEqual(achievementTiers.map(t=>t.threshold),[25,60,100]);
  }finally{globalThis.localStorage=local;globalThis.sessionStorage=session;}
});
