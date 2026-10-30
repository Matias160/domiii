import {drawFood} from '../core/art.js';
import {currentAccount,isGuest} from '../systems/accountSystem.js';
import {drawAccessory,drawPet,canvasPoint,approachPoint,resolveAccessory} from '../core/presentation.js';
import {makeRoom,drawStation,drawRoomLight,drawLobbyLife,lobbyNpcLayers} from './lobbyArt.js';
import {achievements,unlockedAchievements} from '../systems/achievementSystem.js';

const stations=[
  {id:'portal',   x:960,  y:240, label:'JUGAR',           action:'JUGAR',     color:'#ffe068'},
  {id:'shop',     x:400,  y:290, label:'TIENDA ARCADE',   action:'TIENDA',    color:'#ffd000'},
  {id:'pets',     x:1520, y:290, label:'MASCOTAS',        action:'MASCOTAS',  color:'#38ef7d'},
  {id:'npc',      x:400,  y:760, label:'SEÑOR DOMI',      action:'CONSEJOS',  color:'#5ce1e6'},
  {id:'ranking',  x:960,  y:820, label:'HISTORIAL',       action:'RECORDS',   color:'#c084fc'},
  {id:'prize',    x:1520, y:760, label:'MÁQUINA DE PREMIOS', action:'PREMIOS', color:'#f43f5e'},
];

export class Lobby {
  constructor(game){
    this.game=game;this.canvas=document.querySelector('#lobbyCanvas');this.ctx=this.canvas.getContext('2d');
    this.room=makeRoom();
    this.x=960;this.y=520;
    this.camera={x:480,y:270};
    // Visor del local: alto base 540 y ancho según la proporción de la pantalla (ocupa todo)
    this.view={w:960,h:540};
    this.near=null;this.hover=null;this.destination=null;
    this.footsteps=[];
    this.sparkles=[];
    this.lastFootstepDist=0;
    this.lastStepX=this.x;this.lastStepY=this.y;
    this.tip=document.querySelector('#lobbyTip');
    document.querySelectorAll('[data-station]').forEach(button=>button.addEventListener('click',()=>this.activate(button.dataset.station)));
    document.querySelector('#lobbyOptions')?.addEventListener('click',()=>game.menu.showOptions());
    document.querySelector('#lobbyAchievements')?.addEventListener('click',()=>game.menu.showAchievements());
    this.canvas.addEventListener('pointermove',event=>{
      const point=this.point(event);
      this.hover=point?stations.find(s=>{const rx=(s.id==='portal')?135:85,ry=(s.id==='portal')?135:90;return Math.abs(s.x-point.x)<rx&&point.y>s.y-ry&&point.y<s.y+ry;}):null;
      this.canvas.style.cursor=this.hover?'pointer':'crosshair';
    });
    this.canvas.addEventListener('pointerleave',()=>{this.hover=null;});
    this.canvas.addEventListener('click',event=>{
      const point=this.point(event);if(!point)return;
      const station=stations.find(s=>{const rx=(s.id==='portal')?135:85,ry=(s.id==='portal')?135:90;return Math.abs(s.x-point.x)<rx&&point.y>s.y-ry&&point.y<s.y+ry;});
      const maxDist=(station?.id==='portal')?210:140,yOff=(station?.id==='portal')?60:40;
      if(station && Math.hypot(station.x-this.x,(station.y+yOff)-this.y)<maxDist){
        this.activate(station.id);
        return;
      }
      this.destination=station?{x:station.x,y:Math.min(990,station.y+(station.id==='portal'?110:80)),station:station.id}:{x:Math.max(90,Math.min(1830,point.x)),y:Math.max(180,Math.min(1010,point.y))};
      this.game.audio.play('navigate');
    });
  }
  point(event){
    const p=canvasPoint(this.canvas.getBoundingClientRect(),this.view.w,this.view.h,event.clientX,event.clientY);
    if(!p)return null;
    return {x:p.x+this.camera.x,y:p.y+this.camera.y};
  }
  enter(){
    this.profile=currentAccount();
    this.destination=null;
    // Al abrir el juego o al volver de una partida aparecés en el centro, sobre la alfombra.
    // Si volvés de un lugar del local (tienda, registro, ranking...) seguís donde estabas.
    if (this.centerNext !== false) { this.x = 960; this.y = 520; }
    this.centerNext = false;
    this.resizeView();
    this.camera.x=Math.max(0,Math.min(1920-this.view.w,this.x-this.view.w/2));this.camera.y=Math.max(0,Math.min(1080-this.view.h,this.y-this.view.h/2));
    document.querySelector('#lobbyWelcome').textContent=this.profile.name.toUpperCase();
    const roleEl = document.querySelector('#lobbyRole');
    if (roleEl) {
      roleEl.textContent = isGuest() ? 'MODO INVITADO / EN EL LOCAL' : 'SOCIO REGISTRADO / EN EL LOCAL';
    }
    // El botón de registro permite registrarse o gestionar cuenta
    const register=document.querySelector('#lobbyRegister');
    if(register) {
      register.hidden = false;
      const span = register.querySelector('span');
      if (span) span.textContent = isGuest() ? 'REGISTRO' : 'CUENTA';
      register.title = isGuest() ? 'Registro de socios' : 'Gestión de cuenta / Cambiar';
    }
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

    // Huellas y brillos dorados para accesorios legendarios en el lobby
    const acc = resolveAccessory(this.profile?.loadout.accessory);
    const isLegendary = acc?.tier === 'legendary';

    // Actualizar huellas existentes
    for (let i = this.footsteps.length - 1; i >= 0; i--) {
      this.footsteps[i].life -= dt;
      if (this.footsteps[i].life <= 0) this.footsteps.splice(i, 1);
    }
    // Actualizar chispas existentes
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sp = this.sparkles[i];
      sp.life -= dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      if (sp.life <= 0) this.sparkles.splice(i, 1);
    }

    if (isLegendary) {
      // Dejar huella cada ~18 píxeles de recorrido
      const dist = Math.hypot(this.x - (this.lastStepX ?? this.x), this.y - (this.lastStepY ?? this.y));
      if (dist >= 18 && this.moving) {
        this.stepSide = !(this.stepSide);
        const sideOffset = (this.stepSide ? 1 : -1) * 7;
        this.footsteps.push({
          x: this.x + sideOffset,
          y: this.y + 25,
          life: 2.2,
          maxLife: 2.2,
          angle: Math.atan2(this.y - (this.lastStepY || this.y), this.x - (this.lastStepX || this.x))
        });
        if (this.footsteps.length > 28) this.footsteps.shift();
        this.lastStepX = this.x;
        this.lastStepY = this.y;
      }

      // Generar brillos y chispas doradas flotantes alrededor del personaje
      if (Math.random() < 0.45 && this.sparkles.length < 35) {
        this.sparkles.push({
          x: this.x + (Math.random() - 0.5) * 44,
          y: this.y + (Math.random() - 0.5) * 40 + 10,
          vx: (Math.random() - 0.5) * 16,
          vy: -20 - Math.random() * 25,
          size: 2 + Math.random() * 3,
          life: 0.6 + Math.random() * 0.5,
          maxLife: 1.1
        });
      }
    }

    // Smooth camera follow
    const targetCamX=this.x-this.view.w/2;
    const targetCamY=this.y-this.view.h/2;
    const lerp=Math.min(1,dt*10);
    this.camera.x+=(targetCamX-this.camera.x)*lerp;
    this.camera.y+=(targetCamY-this.camera.y)*lerp;
    this.camera.x=Math.max(0,Math.min(1920-this.view.w,this.camera.x));
    this.camera.y=Math.max(0,Math.min(1080-this.view.h,this.camera.y));

    this.near=stations.find(s=>{const r=(s.id==='portal')?142:95,yOff=(s.id==='portal')?60:40;return Math.hypot(s.x-this.x,(s.y+yOff)-this.y)<r;})||null;
    this.tip.hidden=!this.near;
    if(this.near) {
      if (this.near.id === 'prize' || this.near.id === 'atlas' || this.near.id === 'desk') {
        this.tip.textContent = 'E: Probar suerte en la Máquina de Premios';
      } else {
        this.tip.textContent = this.near.label;
      }
    }
    document.querySelectorAll('[data-station]').forEach(button=>button.classList.toggle('is-near',button.dataset.station===this.near?.id));
    if(input.consume('e')&&this.near){this.activate(this.near.id);return;}
    this.draw(performance.now()/1000);
  }
  activate(id){
    this.destination=null;this.game.audio.play('confirm');
    if(id==='portal'){this.game.menu.setSetupStep(1);this.game.menu.prepareAccount();this.game.showScreen('setupScreen');}
    else if(id==='pets')this.game.shop.show('pet',true);
    else if(id==='shop')this.game.shop.show();
    else if(id==='ranking')this.game.showRanking();
    else if(id==='npc')this.game.domi.show();
    else if(id==='prize'||id==='atlas'||id==='desk')this.game.showPrizeMachine();
  }
  resizeView(){
    const stage=this.canvas.parentElement;
    const aspect=(stage?.clientWidth||960)/(stage?.clientHeight||540);
    let w=960,h=540;
    if(aspect>=16/9)w=Math.round(540*aspect);else h=Math.round(960/aspect);
    this.view.w=Math.min(1920,w);this.view.h=Math.min(1080,h);
    if(this.canvas.width!==this.view.w||this.canvas.height!==this.view.h){this.canvas.width=this.view.w;this.canvas.height=this.view.h;}
  }
  draw(t){
    if(this.game.reducedMotion)t=0;
    this.resizeView();
    const c=this.ctx,W=this.view.w,H=this.view.h;
    c.clearRect(0,0,W,H);
    c.save();
    c.translate(-Math.round(this.camera.x),-Math.round(this.camera.y));
    c.drawImage(this.room,0,0);
    drawRoomLight(c,t);
    drawLobbyLife(c,t);

    // Dibujar huellas doradas en el suelo (debajo de jugadores y estaciones)
    for (const step of this.footsteps) {
      const alpha = Math.max(0, step.life / step.maxLife);
      c.save();
      c.translate(step.x, step.y);
      c.rotate(step.angle || 0);
      c.fillStyle = `rgba(251, 191, 36, ${alpha * 0.55})`;
      c.fillRect(-4, -2, 8, 4);
      c.fillStyle = `rgba(254, 240, 138, ${alpha * 0.75})`;
      c.fillRect(-2, -1, 4, 2);
      c.restore();
    }

    const drawPlayer=()=>{
      c.fillStyle='rgba(0,0,0,0.4)';c.beginPath();c.ellipse(this.x,this.y+26,26,8,0,0,7);c.fill();
      c.strokeStyle='#ffe39a';c.lineWidth=2;c.beginPath();c.ellipse(this.x,this.y+24,25,8,0,0,7);c.stroke();
      const bob = this.moving ? Math.round(Math.sin(t * 7 + this.x * .05) * 1.5) : 0;
      drawAccessory(c,this.profile?.loadout.accessory,this.x,this.y + bob, 0.9, 'back');
      drawFood(c,this.profile?.loadout.skin||'pancho',this.x,this.y,.9,this.moving?t:0);
      drawAccessory(c,this.profile?.loadout.accessory,this.x,this.y + bob, 0.9, 'front');
      if(this.profile?.loadout.pet&&this.profile.loadout.pet!=='none')drawPet(c,this.profile.loadout.pet,this.x-37,this.y+20,t);

      // Dibujar destellos y chispas doradas flotantes sobre el personaje
      for (const sp of this.sparkles) {
        const ratio = Math.max(0, sp.life / sp.maxLife);
        c.fillStyle = `rgba(254, 240, 138, ${ratio * 0.9})`;
        c.fillRect(sp.x - sp.size / 2, sp.y - sp.size / 2, sp.size, sp.size);
        c.fillStyle = `rgba(251, 191, 36, ${ratio * 0.5})`;
        c.fillRect(sp.x - sp.size, sp.y, sp.size * 2, 1);
        c.fillRect(sp.x, sp.y - sp.size, 1, sp.size * 2);
      }
    };
    if(this.destination){
      c.strokeStyle='#f5dc8a';c.lineWidth=2;c.setLineDash([4,6]);c.beginPath();c.moveTo(this.x,this.y+20);c.lineTo(this.destination.x,this.destination.y+20);c.stroke();c.setLineDash([]);
      c.fillStyle='rgba(255,224,102,0.3)';c.beginPath();c.ellipse(this.destination.x,this.destination.y+20,16,7,0,0,7);c.fill();
      c.strokeStyle='#ffe066';c.beginPath();c.ellipse(this.destination.x,this.destination.y+20,16,7,0,0,7);c.stroke();
    }
    const layers=stations.map(station=>({y:station.y+42,draw:()=>drawStation(c,station,t,this.near?.id===station.id||this.hover?.id===station.id)}));
    layers.push({y:this.y+24,draw:drawPlayer});
    layers.push(...lobbyNpcLayers(c,t));
    layers.sort((a,b)=>a.y-b.y).forEach(layer=>layer.draw());
    c.restore();

    // Screen-space Vignette
    const vignette=c.createRadialGradient(W/2,H/2,H*0.4,W/2,H/2,Math.hypot(W,H)/2);
    vignette.addColorStop(0,'transparent');
    vignette.addColorStop(1,'rgba(2,7,18,0.55)');
    c.fillStyle=vignette;
    c.fillRect(0,0,W,H);
  }
}
