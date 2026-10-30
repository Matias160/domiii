import test from 'node:test';
import assert from 'node:assert/strict';
import {Shop,filterCatalog,catalog} from '../js/ui/shop.js';
const profile={bank:500,purchases:['skin:pizza','accessory:crown'],loadout:{skin:'pancho',accessory:'none',map:'diner',pet:'none'}};
test('lobby destinations keep store, wardrobe and pets separate',()=>{
  const previous=globalThis.document;
  globalThis.document={querySelector:()=>({addEventListener(){}})};
  try{
    const shop=new Shop({showScreen(){},audio:{play(){}}},{currentAccount:()=>profile});
    shop.render=()=>{};
    shop.show('skin',true);assert.equal(shop.mode,'wardrobe');
    shop.show('pet',true);assert.equal(shop.mode,'pets');
    shop.show();assert.equal(shop.mode,'store');assert.equal(shop.ownedOnly,false);
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
test('wardrobe only includes owned and free items in the selected category',()=>{
  assert.deepEqual(filterCatalog(profile,{type:'skin',ownedOnly:true}).map(item=>item.id),['pancho','pizza']);
  assert.deepEqual(filterCatalog(profile,{type:'accessory',ownedOnly:true}).map(item=>item.id),['none','crown']);
});
test('affordable filter keeps owned items even when their price exceeds the balance',()=>{
  assert.deepEqual(filterCatalog(profile,{type:'skin',affordable:true}).map(item=>item.id),['pancho','nugget','pizza']);
});
test('search ignores accents and case; sorting does not mutate the catalog',()=>{
  const before=catalog.map(item=>item.id);
  assert.equal(filterCatalog(profile,{type:'skin',query:' RÁPIDO '})[0].id,'nugget');
  assert.equal(filterCatalog(profile,{type:'skin',query:'no existe'}).length,0);
  const sorted=filterCatalog(profile,{type:'skin',sort:'price'});
  assert.ok(sorted.every((item,index)=>!index||item.cost>=sorted[index-1].cost));
  assert.deepEqual(catalog.map(item=>item.id),before);
});
