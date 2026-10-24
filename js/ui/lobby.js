import {drawFood} from '../core/art.js';
import {currentAccount} from '../systems/accountSystem.js';
import {drawAccessory,drawPet,canvasPoint,approachPoint} from '../core/presentation.js';
import {makeRoom,drawStation,drawRoomLight} from './lobbyArt.js';
import {achievements,unlockedAchievements} from '../systems/achievementSystem.js';

const stations=[
  {id:'portal',   x:960,  y:240, label:'ENTRAR AL TURNO', action:'PARTIDA',   color:'#ffe068'},
  {id:'wardrobe', x:400,  y:290, label:'ARMARIO / SKINS', action:'ARMARIO',   color:'#ff5c8a'},
  {id:'pets',     x:1520, y:290, label:'MASCOTAS',        action:'MASCOTAS',  color:'#38ef7d'},
  {id:'npc',      x:400,  y:760, label:'DON DOMI',        action:'CONSEJOS',  color:'#5ce1e6'},
  {id:'ranking',  x:960,  y:820, label:'HISTORIAL',       action:'RECORDS',   color:'#c084fc'},
  {id:'shop',     x:1520, y:760, label:'TIENDA ARCADE',   action:'TIENDA',    color:'#ffd000'},
];

export class Lobby {
  constructor(game){
    this.game=game;this.canvas=document.querySelector('#lobbyCanvas');this.ctx=this.canvas.getContext('2d');
    this.room=makeRoom();
    this.x=960;this.y=520;
    this.camera={x:480,y:270};
    this.near=null;this.hover=null;this.destination=null;
    this.tip=document.querySelector('#lobbyTip');
    document.querySelectorAll('[data-station]').forEach(button=>button.addEventListener('click',()=>this.activate(button.dataset.station)));
    document.querySelector('#lobbyOptions')?.addEventListener('click',()=>game.menu.showOptions());
    document.querySelector('#lobbyAchievements')?.addEventListener('click',()=>game.menu.showAchievements());
    this.canvas.addEventListener('pointermove',event=>{
      const point=this.point(event);
      this.hover=point?stations.find(s=>Math.abs(s.x-point.x)<85&&point.y>s.y-90&&point.y<s.y+90):null;
      this.canvas.style.cursor=this.hover?'pointer':'crosshair';
    });
    this.canvas.addEventListener('pointerleave',()=>{this.hover=null;});
    this.canvas.addEventListener('click',event=>{
      const point=this.point(event);if(!point)return;
      const station=stations.find(s=>Math.abs(s.x-point.x)<85&&point.y>s.y-90&&point.y<s.y+90);
      this.destination=station?{x:station.x,y:Math.min(990,station.y+80),station:station.id}:{x:Math.max(90,Math.min(1830,point.x)),y:Math.max(180,Math.min(1010,point.y))};
      this.game.audio.play('navigate');
    });
  }
  point(event){
    const p=canvasPoint(this.canvas.getBoundingClientRect(),960,540,event.clientX,event.clientY);
    if(!p)return null;
    return {x:p.x+this.camera.x,y:p.y+this.camera.y};
  }
  enter(){
    this.profile=currentAccount();
    this.destination=null;
    // Recuperar la última posición guardada del jugador en el lobby
    try {
      const savedPos = JSON.parse(localStorage.getItem('domi2pancho.lobbyPos') || 'null');
      if (savedPos && savedPos.x && savedPos.y) {
        this.x = Math.max(90, Math.min(1830, savedPos.x));
        this.y = Math.max(180, Math.min(1010, savedPos.y));
      } else {
        this.x = 960; this.y = 520;
      }
    } catch {
      this.x = 960; this.y = 520;
    }
    this.camera.x=this.x-480;this.camera.y=this.y-270;
    document.querySelector('#lobbyWelcome').textContent=this.profile.name.toUpperCase();
    document.querySelector('#lobbyBank').textContent=this.profile.bank.toLocaleString('es-AR');
    document.querySelector('#lobbyAchievementCount').textContent=`${unlockedAchievements().length} / ${achievements.length}`;
    this.draw(0);
  }
  update(dt,input){
    const axis=input.getAxis();this.moving=Boolean(axis.x||axis.y||this.destination);
    if(axis.x||axis.y){this.destination=null;this.x+=axis.x*260*dt;this.y+=axis.y*260*dt;}
    else if(this.destination){
      const next=approachPoint(this,this.destination,260,dt);this.x=next.x;this.y=next.y;
      if(next.arrived){const action=this.destination.station;this.destination=null;if(action){this.activate(action);return;}}
    }
    this.x=Math.max(90,Math.min(1830,this.x));
    this.y=Math.max(180,Math.min(1010,this.y));
    if(this.moving){
      this._saveT=(this._saveT||0)+dt;
      if(this._saveT>0.4){this._saveT=0;this.savePos();}
    }

    // Smooth camera follow
    const targetCamX=this.x-480;
    const targetCamY=this.y-270;
    const lerp=Math.min(1,dt*10);
    this.camera.x+=(targetCamX-this.camera.x)*lerp;
    this.camera.y+=(targetCamY-this.camera.y)*lerp;
    this.camera.x=Math.max(0,Math.min(1920-960,this.camera.x));
    this.camera.y=Math.max(0,Math.min(1080-540,this.camera.y));

    this.near=stations.find(s=>Math.hypot(s.x-this.x,(s.y+40)-this.y)<95)||null;
    this.tip.hidden=!this.near;
    if(this.near)this.tip.textContent=this.near.label;
    document.querySelectorAll('[data-station]').forEach(button=>button.classList.toggle('is-near',button.dataset.station===this.near?.id));
    if(input.consume('e')&&this.near){this.activate(this.near.id);return;}
    this.draw(performance.now()/1000);
  }
  savePos(){
    try{
      localStorage.setItem('domi2pancho.lobbyPos', JSON.stringify({x:Math.round(this.x),y:Math.round(this.y)}));
    }catch{}
  }
  activate(id){
    this.destination=null;this.savePos();this.game.audio.play('confirm');
    if(id==='portal'){this.game.menu.prepareAccount();this.game.showScreen('setupScreen');}
    else if(id==='wardrobe')this.game.shop.show('skin',true);
    else if(id==='pets')this.game.shop.show('pet',true);
    else if(id==='shop')this.game.shop.show();
    else if(id==='ranking')this.game.showRanking();
    else if(id==='npc')this.game.domi.show();
  }
  draw(t){
    if(this.game.reducedMotion)t=0;
    const c=this.ctx;
    c.clearRect(0,0,960,540);
    c.save();
    c.translate(-Math.round(this.camera.x),-Math.round(this.camera.y));
    c.drawImage(this.room,0,0);
    drawRoomLight(c,t);
    const drawPlayer=()=>{
      c.fillStyle='rgba(0,0,0,0.4)';c.beginPath();c.ellipse(this.x,this.y+26,26,8,0,0,7);c.fill();
      c.strokeStyle='#ffe39a';c.lineWidth=2;c.beginPath();c.ellipse(this.x,this.y+24,25,8,0,0,7);c.stroke();
      const bob = this.moving ? Math.round(Math.sin(t * 7 + this.x * .05) * 1.5) : 0;
      drawAccessory(c,this.profile?.loadout.accessory,this.x,this.y + bob, 0.9, 'back');
      drawFood(c,this.profile?.loadout.skin||'pancho',this.x,this.y,.9,this.moving?t:0);
      drawAccessory(c,this.profile?.loadout.accessory,this.x,this.y + bob, 0.9, 'front');
      if(this.profile?.loadout.pet&&this.profile.loadout.pet!=='none')drawPet(c,this.profile.loadout.pet,this.x-37,this.y+20,t);
    };
    if(this.destination){
      c.strokeStyle='#f5dc8a';c.lineWidth=2;c.setLineDash([4,6]);c.beginPath();c.moveTo(this.x,this.y+20);c.lineTo(this.destination.x,this.destination.y+20);c.stroke();c.setLineDash([]);
      c.fillStyle='rgba(255,224,102,0.3)';c.beginPath();c.ellipse(this.destination.x,this.destination.y+20,16,7,0,0,7);c.fill();
      c.strokeStyle='#ffe066';c.beginPath();c.ellipse(this.destination.x,this.destination.y+20,16,7,0,0,7);c.stroke();
    }
    const layers=stations.map(station=>({y:station.y+42,draw:()=>drawStation(c,station,t,this.near?.id===station.id||this.hover?.id===station.id)}));
    layers.push({y:this.y+24,draw:drawPlayer});
    layers.sort((a,b)=>a.y-b.y).forEach(layer=>layer.draw());
    c.restore();

    // Screen-space Vignette
    const vignette=c.createRadialGradient(480,270,220,480,270,540);
    vignette.addColorStop(0,'transparent');
    vignette.addColorStop(1,'rgba(2,7,18,0.55)');
    c.fillStyle=vignette;
    c.fillRect(0,0,960,540);
  }
}
