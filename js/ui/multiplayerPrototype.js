import { refreshIcons } from './icons.js';
import { supportClasses } from '../systems/teamTrainingSystem.js';
import { currentAccount } from '../systems/accountSystem.js';
import { RoomClient } from '../core/roomClient.js';
import { OnlineRun } from './onlineRun.js';

export class MultiplayerPrototype {
  constructor(game){
    this.game=game;this.supportClass='red';this.status='Sin equipo';this.room=null;this.sendTimer=0;
    this.client=new RoomClient({onRoom:room=>{
      this.room=room;
      const self=room?.members.find(m=>m.id===room.selfId);if(self)this.supportClass=self.supportClass;
      this.syncSetup();
      if(this.play.active&&(!room||room.phase!=='match'))this.play.stop();
      this.render();
    },onState:state=>this.play.receive(state),onStatus:status=>{this.status=status;this.render();}});
    this.play=new OnlineRun(game,this.client);
    this.serverInput=document.querySelector('#multiServer');
    try{this.serverInput.value=localStorage.getItem('domi2pancho.roomServer')||'';}catch{}
    document.querySelector('#multiCodeInput').value=new URL(location.href).searchParams.get('room')||'';
    document.querySelector('#multiCreate').onclick=()=>this.enter('create');
    document.querySelector('#multiJoinForm').onsubmit=event=>{event.preventDefault();this.enter('join');};
    document.querySelector('#multiLeave').onclick=()=>this.client.leave().catch(e=>this.message(e.message));
    document.querySelector('#multiInvite').onclick=async()=>{
      if(!this.room)return;
      const url=new URL(location.href);url.search='';url.searchParams.set('room',this.room.code);
      const local=['localhost','127.0.0.1'].includes(location.hostname);
      try{await navigator.clipboard.writeText(local?this.room.code:url.href);this.message(local?'Código de sala copiado.':'Invitación copiada.');}catch{this.message(`Código de sala: ${this.room.code}`);}
    };
    document.querySelector('#multiBackButton').onclick=()=>game.showScreen('lobbyScreen');
    document.querySelectorAll('[data-support-class]').forEach(button=>button.onclick=()=>{
      this.supportClass=button.dataset.supportClass;
      if(this.room)this.client.request('profile',{supportClass:this.supportClass,gear:this.gear()}).catch(e=>this.message(e.message));
      this.render();
    });
    if(this.client.reservation)this.client.resume().catch(e=>this.message(e.message));
  }
  gear(){const p=currentAccount();return {skinId:p?.loadout.skin||'pancho',companionId:p?.loadout.pet||'none',accessoryId:p?.loadout.accessory||'none',weaponId:this.game.menu.selectedWeapon||'fork'};}
  url(){const url=new URL(this.serverInput.value.trim()||location.origin);url.protocol=url.protocol==='https:'||url.protocol==='wss:'?'wss:':'ws:';url.pathname='/api/rooms';url.search='';url.hash='';return url.href;}
  message(text){this.status=text;this.render();}
  async enter(type){
    if(this.busy)return;this.busy=true;this.message('Conectando…');
    try{
      const url=this.url();localStorage.setItem('domi2pancho.roomServer',this.serverInput.value.trim());
      await this.client.connect(url);
      await this.client.enter(type,{name:currentAccount()?.name||'Invitado',gear:this.gear(),supportClass:this.supportClass,code:document.querySelector('#multiCodeInput').value.trim().toUpperCase()});
      this.status='Equipo conectado';this.game.showScreen('lobbyScreen');
    }catch(error){this.status=error.message;}finally{this.busy=false;this.render();}
  }
  show(){this.game.showScreen('multiScreen');}
  onScreen(id){
    if(id==='setupScreen')this.syncSetup(true);
    if(id==='lobbyScreen'&&this.room&&!this.play.active){
      this.client.send('unready');this.client.request('profile',{supportClass:this.supportClass,gear:this.gear()}).catch(e=>this.message(e.message));
    }
  }
  syncSetup(force=false){
    const guest=!!this.room&&this.room.members.length===2&&this.room.selfId!==this.room.hostId;
    for(const id of ['catBarMap','catBarMode','catBarDifficulty']){const section=document.getElementById(id);if(section){section.inert=guest;section.title=guest?'El anfitrión elige esta opción':'';}}
    const signature=guest?JSON.stringify(this.room.shared):'';
    if(guest&&this.room.shared&&(force||this.setupSignature!==signature)){
      const menu=this.game.menu;
      menu.mapInput.value=this.room.shared.mapId;menu.modeInput.value=this.room.shared.modeId;menu.difficultyInput.value=this.room.shared.difficultyId;
      menu.syncCards?.();
    }
    this.setupSignature=signature;
  }
  async prepare(setup){
    if(this.pendingPrepare)return;
    this.pendingPrepare=true;this.render();
    try{await this.client.request('prepare',{setup});}catch(error){this.game.showToast(error.message);}
    finally{this.pendingPrepare=false;this.render();}
  }
  update(delta){
    if(!this.room||this.game.screenId!=='lobbyScreen')return;
    this.sendTimer+=delta;if(this.sendTimer<.08)return;this.sendTimer=0;
    this.client.send('lobby',{x:this.game.lobby.x,y:this.game.lobby.y,spriteState:this.game.lobby.petSpriteState});
  }
  render(){
    const root=document.querySelector('#multiSlots');if(!root)return;
    const signature=JSON.stringify([this.status,this.supportClass,this.busy,this.pendingPrepare,this.room?.code,this.room?.phase,this.room?.hostId,this.room?.members.map(m=>[m.id,m.name,m.supportClass,m.ready,m.connected,m.gear])]);
    if(signature===this.signature)return;this.signature=signature;
    document.querySelector('#multiCreate').disabled=!!this.room||this.busy;
    document.querySelector('#multiJoin').disabled=!!this.room||this.busy;
    document.querySelector('#multiCodeInput').disabled=!!this.room||this.busy;
    this.serverInput.disabled=!!this.room||this.busy;
    document.querySelector('#multiLeave').hidden=!this.room;document.querySelector('#multiInvite').hidden=!this.room;
    document.querySelector('#multiRoomCode').textContent=this.room?.code||'—';
    document.querySelector('#multiFeedback').textContent=this.status;
    document.querySelector('#multiPartySummary').textContent=this.room?`${this.room.members.filter(m=>m.connected).length} / 2 jugadores · ${this.room.phase==='match'?'En partida':'Lobby compartido'}`:'Sin equipo';
    document.querySelectorAll('[data-support-class]').forEach(button=>{
      const selected=button.dataset.supportClass===this.supportClass;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));
    });
    root.replaceChildren();
    const members=this.room?.members||[{id:'self',name:currentAccount()?.name||'Invitado',supportClass:this.supportClass,connected:true}];
    for(const m of members){
      const slot=document.createElement('div');slot.className='multi-slot';
      const copy=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small');
      name.textContent=m.name;detail.textContent=`${supportClasses[m.supportClass].upper} · ${m.connected?(m.ready?'LISTO':'EN EL LOBBY'):'RECONECTANDO'}`;
      copy.append(name,detail);slot.append(copy);
      if(m.id===this.room?.hostId){const tag=document.createElement('b');tag.textContent='ANFITRIÓN';slot.append(tag);}root.append(slot);
    }
    if(members.length===1){const slot=document.createElement('div');slot.className='multi-slot';slot.textContent='Esperando compañero';root.append(slot);}
    const start=document.querySelector('#startRunButton'),me=this.room?.members.find(m=>m.id===this.room.selfId);
    if(start){start.disabled=!!this.pendingPrepare||!!me?.ready;start.querySelector('span').textContent=this.room?.members.length===2?(me?.ready?'ESPERANDO AL EQUIPO':'CONFIRMAR EQUIPO'):'INICIAR TURNO';}
    const badge=document.querySelector('#lobbyTeamStatus');if(badge)badge.textContent=this.room?`EQUIPO ${this.room.code} · ${this.room.members.filter(m=>m.connected).length}/2`:'EQUIPO';
    refreshIcons();
  }
}
