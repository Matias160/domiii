import test from 'node:test';
import assert from 'node:assert/strict';
import { companions } from '../js/entities/Companion.js';
import { shopItems } from '../js/data/shop.js';
import { PETS_DATA,populateCompanionSelect,MenuScreen } from '../js/ui/menuScreen.js';
import fs from 'node:fs';

test('each support class uses its real animated gem asset',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const file of ['gema_rojo_calaveras.gif','gema_verde_curacion.gif','gema_azul_misterio.gif']){
    assert.ok(html.includes(`./clases/${file}`));
    assert.match(fs.readFileSync(new URL(`../clases/${file}`,import.meta.url)).subarray(0,6).toString(),/^GIF8[79]a$/);
  }
});

test('setup exposes every pet from the gameplay and shop catalogs',()=>{
  assert.deepEqual(PETS_DATA.map(p=>p.id),Object.keys(companions));
  for(const item of shopItems.filter(item=>item.type==='pet'))assert.ok(PETS_DATA.some(p=>p.id===item.id));
  for(const pet of PETS_DATA){assert.ok(pet.role);assert.ok(pet.name);}
});

test('owned Cosmo and every animated pet can be selected by the real combo selection handler',()=>{
  const previous={document:globalThis.document,localStorage:globalThis.localStorage,sessionStorage:globalThis.sessionStorage};
  const ids=['cosmo','mate','dulce_leche','choco_heart','icecream_pet'];
  globalThis.document={createElement:()=>({})};
  globalThis.sessionStorage={getItem:()=> 'player'};
  globalThis.localStorage={getItem:()=>JSON.stringify({player:{name:'Player',purchases:ids.map(id=>`pet:${id}`),loadout:{skin:'pancho',pet:'none'},runs:[]}})};
  try{
    let value='none';const select={options:[],replaceChildren(){this.options=[];},append(option){this.options.push(option);},dispatchEvent(){},get value(){return value;},set value(id){value=this.options.some(option=>option.value===id)?id:'';}};
    populateCompanionSelect(select);
    assert.deepEqual(select.options.map(option=>option.value),PETS_DATA.map(p=>p.id));
    const instance={companionInput:select,mapInput:{value:'diner'},syncCards(){},game:{audio:{play(){}},showToast(message){throw Error(message);}}};
    for(const id of ids){MenuScreen.prototype.selectCategoryOption.call(instance,'companion',id);assert.equal(select.value,id);}
  }finally{Object.assign(globalThis,previous);}
});
