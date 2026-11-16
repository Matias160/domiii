import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { Item } from '../entities/Item.js';
import { Companion } from '../entities/Companion.js';
import { supportClasses } from '../systems/teamTrainingSystem.js';
import { abilities } from '../data/abilities.js';

const hydrate=(type,data)=>Object.assign(Object.create(type.prototype),data);
export class OnlineRun {
  constructor(game,client){this.game=game;this.client=client;this.inputTimer=0;this.active=false;this.menuOpen=false;this.positions=new Map();}
  receive(raw){
    const game=this.game;
    const newMatch=this.matchId!==raw.online.id;
    if(newMatch){this.positions.clear();this.matchId=raw.online.id;}
    raw.player=hydrate(Player,raw.player);raw.companion=hydrate(Companion,raw.companion);
    raw.enemies=raw.enemies.map(e=>hydrate(Enemy,e));raw.projectiles=raw.projectiles.map(e=>hydrate(Projectile,e));raw.items=raw.items.map(e=>hydrate(Item,e));
    raw.players=raw.players.map(m=>({...m,player:hydrate(Player,m.player),companion:hydrate(Companion,m.companion)}));
    raw.camera=!newMatch&&game.state?.online?game.state.camera:{x:480,y:270};game.state=raw;
    this.targets=new Map([...raw.players.map(m=>[m.id,{x:m.player.x,y:m.player.y}]),...raw.enemies.map(e=>[e.networkId,{x:e.x,y:e.y}])]);
    for(const key of this.positions.keys())if(!this.targets.has(key))this.positions.delete(key);
    if(!this.active){
      this.active=true;this.menuOpen=false;game.tutorial=null;game.choice=null;game.entrance=null;game.primeIntro=null;
      game.lastSetup={name:raw.player.name,skinId:raw.player.skin.id,weaponId:raw.player.weapon.id,mapId:raw.mapId,modeId:raw.modeId,difficultyId:raw.difficulty.id,companionId:raw.companion.id,accessoryId:raw.player.accessory};
      game.lobby.centerNext=true;game.showScreen('onlineRunScreen');game.resizeView();game.updateTutorialVisibility();
    }
    if(raw.online.outcome){
      this.active=false;this.menuOpen=false;game.screenId='onlineRunScreen';
      game.endRun(raw.online.outcome);
    }
  }
  stop(){if(this.active){this.active=false;this.menuOpen=false;this.game.showScreen('lobbyScreen');this.game.showToast('La partida de equipo termino.');}}
  frame(delta){
    const game=this.game,s=game.state;if(!this.active||!s?.online)return;
    const smooth=(key,actor)=>{
      const target=this.targets?.get(key);if(!target)return;
      let pos=this.positions.get(key);if(!pos){pos={...target};this.positions.set(key,pos);}
      const blend=1-Math.exp(-delta*22);pos.x+=(target.x-pos.x)*blend;pos.y+=(target.y-pos.y)*blend;actor.x=pos.x;actor.y=pos.y;
    };
    for(const member of s.players){smooth(member.id,member.player);if(member.id===this.client.room?.selfId){s.player.x=member.player.x;s.player.y=member.player.y;}}
    for(const enemy of s.enemies)smooth(enemy.networkId,enemy);
    this.inputTimer+=delta;
    if(this.inputTimer>=.05){
      this.inputTimer=0;const axis=this.menuOpen||document.hidden?{x:0,y:0}:game.input.getAxis();
      this.client.send('input',{...axis,dash:!this.menuOpen&&game.input.consume(' '),revive:!this.menuOpen&&game.input.keys.has('e')});
      if(!this.menuOpen){
        if(game.input.consume('f'))this.client.send('action',{action:'support'});
        for(const key of ['q','e','r'])if(game.input.consume(key))this.client.send('action',{action:'prime',value:key});
      }
    }
    const view=game.view,w=s.world;
    const tx=Math.max(0,Math.min(w.width-view.w,s.player.x-view.w/2)),ty=Math.max(0,Math.min(w.height-view.h,s.player.y-view.h/2));
    s.camera.x+=(tx-s.camera.x)*Math.min(1,delta*9);s.camera.y+=(ty-s.camera.y)*Math.min(1,delta*9);
    game.hud.update(s);game.renderPrimeBar();game.touchControls?.update(s);game.draw();
    game.hudCanvas.render(s,game.overlayLayout||{hudBottom:84,minimapBottom:210},delta,this.menuOpen);
    const me=s.players.find(m=>m.id===this.client.room?.selfId),ally=s.players.find(m=>m.id!==this.client.room?.selfId);
    const role=supportClasses[s.online.supportClass];
    document.querySelector('#onlineAlly').textContent=ally?`${ally.player.name} · ${Math.ceil(ally.player.hp)} / ${ally.player.maxHp} HP`:'';
    document.querySelector('#onlineStatus').textContent=this.client.socket?.readyState!==1?'RECONECTANDO…':s.player.hp<=0?'CAÍDO · TU ALIADO PUEDE REVIVIRTE':this.client.room?.members.some(m=>!m.connected)?'ESPERANDO RECONEXIÓN':'COOPERATIVO';
    const skill=document.querySelector('#onlineSupport');skill.disabled=this.menuOpen||s.online.supportCooldown>0||s.player.hp<=0;
    skill.querySelector('span').textContent=`${role.skill}${s.online.supportCooldown>0?` · ${Math.ceil(s.online.supportCooldown)}s`:''}`;
    skill.onclick=()=>this.client.send('action',{action:'support'});
    const choices=document.querySelector('#onlineChoices'),ids=s.online.choices.join(',');
    if(choices.dataset.ids!==ids){
      choices.dataset.ids=ids;choices.replaceChildren();
      for(const id of s.online.choices){const a=abilities.find(a=>a.id===id);if(!a)continue;
        const button=document.createElement('button');button.type='button';button.className='pixel-button pixel-button--secondary';button.textContent=a.name;button.title=a.description;
        button.onclick=()=>this.client.send('action',{action:'ability',value:id});choices.append(button);
      }
    }
    choices.hidden=!ids||this.menuOpen||s.player.hp<=0;
    if(me&&me.player.hp<=0)document.querySelector('#onlineStatus').textContent+=` · ${Math.round(me.revive/3*100)}%`;
  }
  menu(open){this.menuOpen=open;this.game.input.clear();this.game.showScreen(open?'pauseScreen':'onlineRunScreen');
    if(open)document.querySelector('#pauseReason').textContent='MENÚ PERSONAL · LA PARTIDA CONTINÚA';
  }
}
