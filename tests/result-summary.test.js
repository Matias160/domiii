import test from 'node:test';
import assert from 'node:assert/strict';
import {nextUnlock} from '../js/ui/gameOverScreen.js';
import {shopItems} from '../js/data/shop.js';
test('result suggests an unowned unlock using the current wallet',()=>{
 const buyable=shopItems.filter(item=>item.cost>0).sort((a,b)=>a.cost-b.cost);
 const [cheapest,second]=buyable;
 assert.match(nextUnlock({bank:100,purchases:[]}),new RegExp(`${cheapest.name}.*${cheapest.cost-100} PT`));
 assert.match(nextUnlock({bank:cheapest.cost,purchases:[]}),/Ya podés comprar/);
 assert.match(nextUnlock({bank:0,purchases:[`${cheapest.type}:${cheapest.id}`]}),new RegExp(`${second.cost} PT`));
 assert.match(nextUnlock({bank:0,purchases:buyable.map(item=>`${item.type}:${item.id}`)}),/Completaste/);
 assert.doesNotMatch(nextUnlock({bank:99999,purchases:[]}),/Mini Parrilla|Don Domi/);
 assert.equal(nextUnlock(null),'');
});
