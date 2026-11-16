import { drawDiner, drawFood } from '../core/art.js';
import { canvasPoint } from '../core/presentation.js';
import { createTeamTraining, activateSupport, stepTeamTraining, supportClasses } from '../systems/teamTrainingSystem.js';
import { icon } from './icons.js';

export class TeamTraining {
  constructor(game) {
    this.game=game;this.canvas=document.querySelector('#multiArenaCanvas');this.ctx=this.canvas.getContext('2d');
    this.floor=document.createElement('canvas');this.floor.width=960;this.floor.height=540;
    drawDiner(this.floor.getContext('2d'),960,540,0,false,'diner');
    this.skillButton=document.querySelector('#multiSkillButton');this.pauseButton=document.querySelector('#multiPauseButton');
    this.skillButton.onclick=()=>{if(!this.paused)activateSupport(this.state);this.skillButton.blur();};
    this.pauseButton.onclick=()=>{this.paused=!this.paused;this.game.input.clear();this.pauseButton.innerHTML=icon(this.paused?'Play':'Pause');this.pauseButton.setAttribute('aria-pressed',String(this.paused));this.pauseButton.title=this.paused?'Reanudar':'Pausar';this.pauseButton.setAttribute('aria-label',this.pauseButton.title);};
    document.querySelector('#multiArenaBack').onclick=()=>this.exit();
    document.querySelector('#multiReplayButton').onclick=()=>this.start(this.setup);
    this.canvas.addEventListener('pointerdown',event=>{
      const point=canvasPoint(this.canvas.getBoundingClientRect(),960,540,event.clientX,event.clientY);
      if(point&&!this.paused)this.destination=point;
      this.canvas.focus();
    });
  }

  start(setup) {
    this.setup=setup;this.state=createTeamTraining(setup);this.paused=false;this.destination=null;
    this.pauseButton.setAttribute('aria-pressed','false');this.pauseButton.title='Pausar';this.pauseButton.setAttribute('aria-label','Pausar');
    this.pauseButton.innerHTML=icon('Pause');
    this.game.showScreen('multiArenaScreen');this.canvas.focus();this.update(0);
  }

  exit() {this.state=null;this.destination=null;this.game.showScreen('multiScreen');}

  update(delta) {
    if(!this.state)return;
    if(!this.paused&&!document.hidden){
      let axis=this.game.input.getAxis();
      if(axis.x||axis.y)this.destination=null;
      else if(this.destination){
        const dx=this.destination.x-this.state.local.x,dy=this.destination.y-this.state.local.y,d=Math.hypot(dx,dy);
        if(d>6)axis={x:dx/d,y:dy/d};else this.destination=null;
      }
      if(this.game.input.consume('q'))activateSupport(this.state);
      stepTeamTraining(this.state,delta,axis);
    }
    const s=this.state,role=supportClasses[s.local.supportClass];
    document.querySelector('#multiArenaTime').textContent=`${Math.ceil(s.remaining)}s`;
    document.querySelector('#multiArenaScore').textContent=s.mode==='coop'?`${s.scores.A} / 12 KOs`:`A ${s.scores.A} : ${s.scores.B} B`;
    document.querySelector('#multiArenaHealth').textContent=`${Math.ceil(s.local.hp)} / 100`;
    const remaining=Math.ceil(s.local.cooldown);
    this.skillButton.disabled=this.paused||!!s.outcome||s.local.hp<=0||remaining>0;
    this.skillButton.querySelector('span').textContent=`${role.skill}${remaining>0?` · ${remaining}s`:''}`;
    this.skillButton.style.setProperty('--support-color',role.color);
    const result=document.querySelector('#multiArenaResult');
    result.hidden=!s.outcome;
    if(s.outcome)result.querySelector('strong').textContent=s.outcome==='victory'?'¡EQUIPO GANADOR!':s.outcome==='draw'?'EMPATE':'FIN DEL ENTRENAMIENTO';
    document.querySelector('#multiArenaStatus').textContent=this.paused?'PAUSA':s.local.hp<=0?`REAPARECÉS EN ${Math.ceil(s.local.respawn)}s`:s.mode==='coop'?'COOPERATIVO · ALIADOS SIMULADOS':'VERSUS · EQUIPOS A / B';
    this.draw();
  }

  draw() {
    const c=this.ctx,s=this.state;
    c.clearRect(0,0,960,540);c.imageSmoothingEnabled=false;c.drawImage(this.floor,0,0);
    for(const a of s.actors){
      if(a.hp<=0||a.auraTime<=0)continue;
      const role=supportClasses[a.supportClass];if(!role)continue;
      c.save();c.fillStyle=`${role.color}20`;c.strokeStyle=role.color;c.lineWidth=2;c.setLineDash([8,5]);
      c.lineDashOffset=-s.time*15;c.beginPath();c.arc(a.x,a.y,role.radius,0,Math.PI*2);c.fill();c.stroke();c.restore();
    }
    for(const a of s.actors){
      if(a.hp<=0)continue;
      c.fillStyle='#0006';c.beginPath();c.ellipse(a.x,a.y+18,22,7,0,0,Math.PI*2);c.fill();
      drawFood(c,a.skinId,a.x,a.y,.6,s.time);
      c.fillStyle='#071116';c.fillRect(a.x-23,a.y-35,46,6);c.fillStyle=a.team==='A'?'#57f2b5':'#ff6e80';c.fillRect(a.x-22,a.y-34,44*a.hp/100,4);
      if(a.shield>0){c.strokeStyle='#8dccff';c.lineWidth=3;c.beginPath();c.arc(a.x,a.y,29,0,Math.PI*2);c.stroke();}
      if(a===s.local){c.strokeStyle='#fff1a8';c.lineWidth=2;c.strokeRect(a.x-26,a.y-29,52,56);}
    }
    c.save();c.globalCompositeOperation='lighter';
    for(const shot of s.shots){
      const color=shot.team==='A'?'#9ffff1':'#ffad87';
      c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.moveTo(shot.x-shot.vx*.03,shot.y-shot.vy*.03);c.lineTo(shot.x,shot.y);c.stroke();
      c.fillStyle='#fffce7';c.fillRect(shot.x-2,shot.y-2,4,4);
    }
    for(const p of s.particles){c.fillStyle=p.color;c.globalAlpha=Math.max(0,p.life/.55);c.fillRect(p.x-2,p.y-2,4,4);}
    c.restore();
    if(this.paused){c.fillStyle='#071116aa';c.fillRect(0,0,960,540);c.fillStyle='#fff1a8';c.font="20px 'Press Start 2P',monospace";c.textAlign='center';c.fillText('PAUSA',480,275);}
  }
}
