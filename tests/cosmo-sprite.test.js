import test from 'node:test';
import assert from 'node:assert/strict';
import { shopItems } from '../js/data/shop.js';
import { companions } from '../js/entities/Companion.js';
import { createRunState } from '../js/core/runState.js';
import { currentAccount } from '../js/systems/accountSystem.js';

function storage(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}

test('Cosmo is listed as a pet with its own support behavior', () => {
  assert.equal(shopItems.find(item => item.id === 'cosmo')?.type, 'pet');
  assert.equal(shopItems.some(item => item.id === 'cosmo' && item.type === 'skin'), false);
  assert.equal(companions.cosmo.name, 'Cosmo');
  assert.match(companions.cosmo.detail, /velocidad/i);
});

test('Cosmo follows the player animation state, including vertical movement and idle', () => {
  const state=createRunState({companionId:'cosmo'});
  let axis={x:1,y:0};
  const input={getAxis:()=>axis,consume:()=>false};
  const bounds={width:1920,height:1080};
  state.player.update(.016,input,bounds);
  state.companion.update(state,.016);
  assert.equal(state.companion.spriteState,'right');
  axis={x:0,y:-1};
  state.player.update(.016,input,bounds);
  state.companion.update(state,.016);
  assert.equal(state.companion.spriteState,'right');
  axis={x:0,y:0};
  state.player.update(.016,input,bounds);
  state.companion.update(state,.016);
  assert.equal(state.companion.spriteState,'idle');
});

test('existing Cosmo owners keep the purchase as a pet and return to Pancho', () => {
  globalThis.localStorage=storage();globalThis.sessionStorage=storage();
  localStorage.setItem('domi2pancho.accounts.v1',JSON.stringify({user:{name:'Jugador',purchases:['skin:cosmo'],loadout:{skin:'cosmo',pet:'none'}}}));
  sessionStorage.setItem('domi2pancho.session.v1','user');
  const profile=currentAccount();
  assert.deepEqual(profile.purchases,['pet:cosmo']);
  assert.equal(profile.loadout.skin,'pancho');
  assert.equal(profile.loadout.pet,'cosmo');
});
