import test from 'node:test';
import assert from 'node:assert/strict';
import {nextUnlock} from '../js/ui/gameOverScreen.js';
import {shopItems} from '../js/data/shop.js';
test('result suggests an unowned unlock using the current wallet',()=>{
 assert.match(nextUnlock({bank:100,purchases:[]}),/Vincha turbo.*250 PT/);
 assert.match(nextUnlock({bank:500,purchases:[]}),/Ya podés comprar/);
 assert.match(nextUnlock({bank:0,purchases:['accessory:headband']}),/450 PT/);
 assert.match(nextUnlock({bank:0,purchases:shopItems.map(item=>`${item.type}:${item.id}`)}),/Completaste/);
 assert.equal(nextUnlock(null),'');
});
