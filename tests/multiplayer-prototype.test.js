import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { WebSocket } from 'ws';
import { attachRooms } from '../server/rooms.js';
import { RoomClient } from '../js/core/roomClient.js';

const waitFor=async test=>{const start=Date.now();while(!test()){if(Date.now()-start>4000)throw Error('Room update timeout');await new Promise(resolve=>setTimeout(resolve,25));}};
async function fixture(t){
  const server=createServer(),{wss}=attachRooms(server,{reconnectMs:1000});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`ws://127.0.0.1:${server.address().port}/api/rooms`,clients=[];
  t.after(async()=>{for(const c of clients){c.manual=true;clearTimeout(c.retry);c.socket?.terminate();}for(const ws of wss.clients)ws.terminate();await new Promise(resolve=>server.close(resolve));});
  const client=async()=>{const c=new RoomClient({WebSocketImpl:WebSocket,onState:state=>{c.state=state;}});clients.push(c);await c.connect(url);return c;};
  return {client};
}

test('real rooms synchronize two players, class, position and enforce capacity',async t=>{
  const {client}=await fixture(t),a=await client(),b=await client(),third=await client();
  const created=await a.enter('create',{name:'Host',supportClass:'red'});
  await b.enter('join',{code:created.code,name:'Guest',supportClass:'green'});
  await waitFor(()=>a.room?.members.length===2&&b.room?.members.length===2);
  assert.equal(a.room.hostId,a.room.selfId);assert.notEqual(a.room.selfId,b.room.selfId);
  assert.equal(JSON.stringify(b.room).includes(created.token),false);
  await assert.rejects(third.enter('join',{code:created.code}),/dos jugadores/);
  a.send('lobby',{x:1234,y:400,spriteState:'left'});
  await waitFor(()=>b.room.members.find(m=>m.id===a.room.selfId).x===1234);
  await b.request('profile',{supportClass:'blue',gear:{skinId:'nugget'}});
  assert.equal(b.room.members.find(m=>m.id===b.room.selfId).supportClass,'blue');
});

test('normal match preparation starts one shared world, no start before both players confirm',async t=>{
  const {client}=await fixture(t),a=await client(),b=await client();
  const {code}=await a.enter('create',{name:'Host'});await b.enter('join',{code,name:'Guest'});
  await a.request('prepare',{setup:{mapId:'kitchen',modeId:'survival',skinId:'pancho'}});
  assert.equal(a.room.phase,'preparing');assert.equal(a.state,undefined);
  await b.request('prepare',{setup:{mapId:'desert',skinId:'nugget'}});
  await waitFor(()=>a.state&&b.state);
  assert.equal(a.state.online.id,b.state.online.id);assert.equal(b.state.mapId,'kitchen');
  assert.equal(a.state.players.length,2);assert.equal(b.state.player.skin.id,'nugget');
  const x=a.state.player.x;a.send('input',{x:1,y:0});
  await waitFor(()=>a.state.player.x>x+3);
  assert.equal(b.room.phase,'match');
  await b.request('abort');await waitFor(()=>a.room.phase==='lobby');
});

test('reserved player reconnects with a private token and a departure preserves the remaining room',async t=>{
  const {client}=await fixture(t),a=await client(),b=await client();
  const {code}=await a.enter('create',{name:'Host'});const session=await b.enter('join',{code,name:'Guest'});
  b.manual=true;b.socket.terminate();await waitFor(()=>a.room.members.some(m=>!m.connected));
  await b.resume();await waitFor(()=>a.room.members.every(m=>m.connected));
  assert.equal(b.room.selfId,session.id);await a.leave();
  await waitFor(()=>b.room.members.length===1);assert.equal(b.room.hostId,b.room.selfId);
});

test('malformed messages and invalid room codes cannot stop the server or join another room',async t=>{
  const {client}=await fixture(t),a=await client(),b=await client();
  await assert.rejects(b.enter('join',{code:'000000'}),/no existe/);
  a.socket.send('null');await waitFor(()=>a.socket.readyState===3);
  const result=await b.enter('create',{name:'Valid'});assert.match(result.code,/^[A-F0-9]{6}$/);
});
