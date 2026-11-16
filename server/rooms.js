import { WebSocketServer, WebSocket } from 'ws';
import { randomBytes, randomUUID } from 'node:crypto';
import { CoopSession } from './coopSession.js';
import { skins } from '../js/data/skins.js';
import { weapons } from '../js/data/weapons.js';
import { companions } from '../js/entities/Companion.js';
import { shopItems } from '../js/data/shop.js';

const maps=['diner','kitchen','parking','snow','desert','football','lava','beach'];
const pick=(value,allowed,fallback)=>allowed.includes(value)?value:fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
const gear=data=>({skinId:pick(data?.skinId,Object.keys(skins),'pancho'),weaponId:pick(data?.weaponId,Object.keys(weapons),'fork'),companionId:pick(data?.companionId,Object.keys(companions),'none'),accessoryId:pick(data?.accessoryId,shopItems.filter(i=>i.type==='accessory').map(i=>i.id),'none')});

export function attachRooms(server,{reconnectMs=20000,maxRooms=32}={}){
  const rooms=new Map(),wss=new WebSocketServer({noServer:true,maxPayload:16384,perMessageDeflate:false});
  const send=(socket,data)=>{if(socket?.readyState===WebSocket.OPEN&&socket.bufferedAmount<1000000)socket.send(JSON.stringify(data));};
  const roomView=(room,selfId)=>({code:room.code,selfId,hostId:room.hostId,phase:room.session?'match':room.shared?'preparing':'lobby',shared:room.shared||null,members:room.members.map(m=>({id:m.id,name:m.name,connected:!!m.socket,supportClass:m.supportClass,ready:m.ready,gear:m.gear,x:m.x,y:m.y,spriteState:m.spriteState}))});
  const publish=room=>room.members.forEach(m=>send(m.socket,{type:'room',room:roomView(room,m.id)}));
  const cancel=room=>{room.session=null;room.shared=null;room.members.forEach(m=>{m.ready=false;});};
  function remove(room,member){
    room.members=room.members.filter(m=>m!==member);cancel(room);
    if(!room.members.length)rooms.delete(room.code);
    else {if(room.hostId===member.id)room.hostId=room.members[0].id;publish(room);}
  }
  server.on('upgrade',(req,socket,head)=>{
    if(req.url!=='/api/rooms'||wss.clients.size>=64){socket.destroy();return;}
    const allowedOrigins=(process.env.ALLOWED_ORIGINS||'').split(',').filter(Boolean);
    if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host&&!allowedOrigins.includes(req.headers.origin)){socket.destroy();return;}}catch{socket.destroy();return;}}
    wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
  });
  wss.on('connection',socket=>{
    socket.alive=true;socket.on('pong',()=>{socket.alive=true;});
    let room=null,member=null,windowStart=Date.now(),count=0;
    socket.on('error',()=>{});
    socket.on('message',raw=>{
      if(Date.now()-windowStart>1000){windowStart=Date.now();count=0;}
      if(++count>65){socket.close(1008,'Demasiados mensajes');return;}
      let msg;try{msg=JSON.parse(raw);}catch{socket.close(1008,'Mensaje invalido');return;}
      if(!msg||typeof msg!=='object'||Array.isArray(msg)){socket.close(1008,'Mensaje invalido');return;}
      const ack=(error,data={})=>send(socket,{type:'ack',requestId:msg.requestId,error,...data});
      try{
        if(msg.type==='create'||msg.type==='join'||msg.type==='resume'){
          if(member)throw Error('Ya estas en una sala.');
          if(msg.type==='create'){
            if(rooms.size>=maxRooms)throw Error('Servidor lleno. Proba mas tarde.');
            let code;do{code=randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(rooms.has(code));
            room={code,members:[],hostId:null,shared:null,session:null};rooms.set(code,room);
          }else room=rooms.get(String(msg.code||'').toUpperCase());
          if(!room)throw Error('La sala no existe o ya cerro.');
          if(msg.type==='resume'){
            member=room.members.find(m=>m.token===msg.token);
            if(!member)throw Error('La reserva de tu lugar vencio.');
            if(member.socket)throw Error('Ese jugador ya esta conectado.');
          }else{
            if(room.members.length>=2)throw Error('La sala ya tiene dos jugadores.');
            if(room.session)throw Error('La partida ya empezo.');
            member={id:randomUUID(),token:randomBytes(24).toString('hex'),name:String(msg.name||'Invitado').trim().slice(0,16)||'Invitado',supportClass:pick(msg.supportClass,['red','green','blue'],'red'),gear:gear(msg.gear),x:920+room.members.length*80,y:520,ready:false,spriteState:'idle'};
            room.members.push(member);room.hostId ||= member.id;
          }
          member.socket=socket;member.offlineAt=0;
          ack(null,{code:room.code,token:member.token,id:member.id});publish(room);
          if(room.session)send(socket,{type:'state',state:room.session.snapshot(member.id)});
          return;
        }
        if(!member||!room)throw Error('Primero entra a una sala.');
        if(msg.type==='leave'){
          const old=member;member=null;remove(room,old);room=null;ack(null);return;
        }
        if(msg.type==='lobby'){
          if(room.session)return;
          member.x=clamp(msg.x,90,1830);member.y=clamp(msg.y,180,1010);
          member.spriteState=pick(msg.spriteState,['idle','left','right'],'idle');publish(room);return;
        }
        if(msg.type==='profile'){
          if(room.session)return;
          member.supportClass=pick(msg.supportClass,['red','green','blue'],member.supportClass);member.gear=gear(msg.gear);member.ready=false;publish(room);ack(null);return;
        }
        if(msg.type==='prepare'){
          if(room.session)throw Error('La partida ya empezo.');
          if(room.members.length!==2||room.members.some(m=>!m.socket))throw Error('Falta tu compañero en la sala.');
          const setup=msg.setup||{};
          if(room.hostId===member.id){
            const shared={mapId:pick(setup.mapId,maps,'diner'),modeId:pick(setup.modeId,['survival','waves','rush'],'survival'),difficultyId:pick(setup.difficultyId,['suave','picante','extra','quemado'],'picante')};
            if(JSON.stringify(shared)!==JSON.stringify(room.shared))room.members.forEach(m=>{m.ready=false;});
            room.shared=shared;
          }
          member.gear=gear(setup);member.ready=true;
          if(room.shared&&room.members.every(m=>m.ready))room.session=new CoopSession(randomUUID(),room.shared,room.members);
          publish(room);ack(null);return;
        }
        if(msg.type==='unready'){member.ready=false;publish(room);return;}
        if(msg.type==='abort'){cancel(room);publish(room);ack(null);return;}
        if(msg.type==='input'&&room.session){
          const x=clamp(msg.x,-1,1),y=clamp(msg.y,-1,1),length=Math.max(1,Math.hypot(x,y));
          room.session.input(member.id,{x:x/length,y:y/length,pressed:msg.dash?[' ']:[],revive:!!msg.revive});return;
        }
        if(msg.type==='action'&&room.session){room.session.action(member.id,msg.action,String(msg.value||''));return;}
      }catch(error){ack(error.message);if(!member)room=null;}
    });
    socket.on('close',()=>{if(member&&member.socket===socket){member.socket=null;member.offlineAt=Date.now();member.ready=false;if(room.session)room.session.input(member.id,{x:0,y:0,pressed:[]});publish(room);}});
  });
  let tick=0;
  const interval=setInterval(()=>{
    tick++;
    for(const room of rooms.values()){
      for(const m of [...room.members])if(!m.socket&&Date.now()-m.offlineAt>reconnectMs)remove(room,m);
      if(!room.session||room.members.some(m=>!m.socket))continue;
      try{
        room.session.tick();
        if(tick%3===0||room.session.outcome)for(const m of room.members)send(m.socket,{type:'state',state:room.session.snapshot(m.id)});
        if(room.session.outcome){cancel(room);publish(room);}
      }catch(error){console.error('Coop session stopped:',error);for(const m of room.members)send(m.socket,{type:'notice',message:'La partida se cerro por un error. Tu cuenta no fue modificada.'});cancel(room);publish(room);}
    }
  },1000/30);interval.unref();
  const heartbeat=setInterval(()=>{for(const socket of wss.clients){if(!socket.alive)socket.terminate();else{socket.alive=false;socket.ping();}}},10000);heartbeat.unref();
  server.on('close',()=>{clearInterval(interval);clearInterval(heartbeat);for(const socket of wss.clients)socket.terminate();wss.close();});
  return {rooms,wss};
}
