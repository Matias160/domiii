import {drawFood} from '../core/art.js';

export function drawCombatFeedback(ctx, state, reducedMotion = false) {
  const p = state.player; ctx.save();

  // Fantasmas de dash
  if (!reducedMotion) for (const ghost of state.dashGhosts || []) {
    ctx.globalAlpha = ghost.life / .18 * .28;
    drawFood(ctx, p.skin.id, ghost.x, ghost.y, .85, 0);
  }
  ctx.globalAlpha = 1;

  // Stable direction marks distinguish the dash from a speed pickup.
  if (p.dashTime > 0) {
    ctx.save(); ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.dashDirection.y,p.dashDirection.x));
    ctx.strokeStyle='#a4ffe1';ctx.lineWidth=3;
    for(let i=0;i<3;i++) { const x=-22-i*15;ctx.beginPath();ctx.moveTo(x-7,-12);ctx.lineTo(x,0);ctx.lineTo(x-7,12);ctx.stroke(); }
    ctx.restore();
  }
  if(p.buffs.speedTime>0) {
    ctx.strokeStyle='#83e8ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+26,31,11,0,0,Math.PI*2);ctx.stroke();
  }
  if(p.comboFeverTime>0){
    const pulse=reducedMotion?0:state.time*2.8;ctx.strokeStyle='#ff5d9e';ctx.lineWidth=3;
    for(let i=0;i<3;i++){const a=pulse+i*Math.PI*2/3;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*34,p.y+Math.sin(a)*22,4,0,Math.PI*2);ctx.stroke();}
  }

  for(const zone of state.bossZones||[]){
    const warning=zone.delay>0,pulse=.55+Math.sin(state.time*12)*.25;ctx.save();ctx.globalAlpha=warning?pulse:.35;
    if(zone.kind==='snipe'){
      ctx.strokeStyle='#ff4f9a';ctx.lineWidth=warning?3:7;ctx.setLineDash(warning?[9,7]:[]);ctx.beginPath();ctx.moveTo(zone.x,zone.y);ctx.lineTo(zone.targetX,zone.targetY);ctx.stroke();
      ctx.beginPath();ctx.arc(zone.targetX,zone.targetY,18,0,Math.PI*2);ctx.stroke();
    }else{
      const x=zone.kind==='rain'?zone.targetX:zone.x,y=zone.kind==='rain'?zone.targetY:zone.y;
      ctx.strokeStyle=zone.kind==='rain'?'#ffd34f':'#ff5f75';ctx.fillStyle=zone.kind==='rain'?'#ffd34f18':'#ff5f7518';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(x,y,zone.radius,0,Math.PI*2);ctx.fill();ctx.stroke();
      if(warning){ctx.save();ctx.beginPath();ctx.arc(x,y,zone.radius-3,0,Math.PI*2);ctx.clip();ctx.globalAlpha=.24;ctx.setLineDash([]);ctx.lineWidth=4;for(let line=-zone.radius*2;line<zone.radius*2;line+=15){ctx.beginPath();ctx.moveTo(x-zone.radius,line+y-zone.radius);ctx.lineTo(x+zone.radius,line+y+zone.radius);ctx.stroke();}ctx.restore();}
      if(zone.kind==='rain')for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x+i*13-8,y-70);ctx.lineTo(x+i*13+5,y-45);ctx.stroke();}
    }
    if(warning){const x=zone.kind==='rain'?zone.targetX:zone.kind==='snipe'?zone.targetX:zone.x,y=zone.kind==='rain'?zone.targetY:zone.kind==='snipe'?zone.targetY:zone.y,labelY=Math.max(132,y-zone.radius-25);ctx.globalAlpha=1;ctx.setLineDash([]);ctx.fillStyle='#111923ed';ctx.fillRect(x-63,labelY,126,18);ctx.fillStyle=zone.kind==='rain'?'#ffe071':'#ff9ab8';ctx.textAlign='center';ctx.font='bold 10px monospace';ctx.fillText(zone.kind==='snipe'?'TRIPLE TIRO':zone.kind==='rain'?'LLUVIA DE PAPAS':'ONDA DE CHOQUE',x,labelY+13);}
    ctx.restore();
  }

  for(const boss of state.enemies) {
    if(!boss.isBoss||boss.hp<=0||boss.spawnTime>0)continue;
    const volley=boss.volleyTimer<=.85;
    if(volley) {
      const progress=1-Math.max(0,boss.volleyTimer)/.85;
      const radius=boss.radius+18;
      ctx.strokeStyle='#ff9ba9';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(boss.x,boss.y,radius,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();
      const count=boss.type.bossStyle==='ranged'?14:10;
      // Project the actual firing phase at release, so the preview matches the volley.
      for(let i=0;i<count;i++) {
        const a=i*Math.PI*2/count+(state.time+Math.max(0,boss.volleyTimer))*.4;
        ctx.beginPath();ctx.moveTo(boss.x+Math.cos(a)*radius,boss.y+Math.sin(a)*radius);
        ctx.lineTo(boss.x+Math.cos(a)*(radius+22),boss.y+Math.sin(a)*(radius+22));ctx.stroke();
      }
    }
    if(boss.bossPhase==='telegraph'&&boss.chargeTarget) {
      const angle=Math.atan2(boss.chargeTarget.y-boss.y,boss.chargeTarget.x-boss.x);
      const length=boss.speed*3.15*.82;
      ctx.save();ctx.translate(boss.x,boss.y);ctx.rotate(angle);
      ctx.fillStyle='#ff657326';ctx.fillRect(0,-boss.radius,length,boss.radius*2);
      ctx.strokeStyle='#ff8991';ctx.lineWidth=2;ctx.strokeRect(0,-boss.radius,length,boss.radius*2);
      for(let x=45;x<length;x+=38){ctx.beginPath();ctx.moveTo(x-9,-8);ctx.lineTo(x,0);ctx.lineTo(x-9,8);ctx.stroke();}
      ctx.restore();
    }
    const label=volley?'SALVA RADIAL':boss.bossPhase==='telegraph'?'EMBESTIDA':boss.bossPhase==='recover'?'RECUPERANDO':null;
    if(label) {
      const x=Math.max(90,Math.min(870,boss.x)),y=Math.min(492,boss.y+boss.radius+27);
      ctx.fillStyle='#151b25';ctx.fillRect(x-76,y-13,152,20);ctx.textAlign='center';ctx.font='bold 11px monospace';
      ctx.fillStyle=boss.bossPhase==='recover'&&!volley?'#a4ffe1':'#ffbdc4';ctx.fillText(label,x,y+1);
    }
  }

  // Indicador de cooldown de dash
  ctx.strokeStyle = p.dashCooldown > 0 ? '#7ba998' : '#cde6a3'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 25, 22, 7, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p.dashCooldown / 2.8));
  ctx.stroke();

  // Retícula de apuntado
  const target = state.manualAim ? state.aimPoint : state.target;
  if (target && (!target.hp || target.hp > 0)) {
    const size = state.manualAim ? 10 : target.radius + 7;
    ctx.strokeStyle = state.manualAim ? '#f4e7b1' : '#f8d36d8c'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ctx.moveTo(target.x + x * (size - 5), target.y + y * size);
      ctx.lineTo(target.x + x * size, target.y + y * size);
      ctx.lineTo(target.x + x * size, target.y + y * (size - 5));
    }
    ctx.stroke();
    if (state.manualAim) { ctx.fillStyle = '#ffe9b7'; ctx.fillRect(target.x - 1, target.y - 1, 2, 2); }
  }

  // Borde de peligro (vida baja) — pulsación animada + vignette
  if (p.hp / p.maxHp < 0.25) {
    const pulse = reducedMotion ? 0.7 : 0.55 + Math.sin(performance.now() / 180) * 0.45;
    // Vignette roja desde los bordes
    const vg = ctx.createRadialGradient(480, 310, 160, 480, 310, 490);
    vg.addColorStop(0, 'transparent');
    vg.addColorStop(1, `rgba(200,40,35,${pulse * 0.22})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, 960, 540);
    // Borde pulsante
    ctx.strokeStyle = `rgba(238,122,107,${pulse})`; ctx.lineWidth = 4;
    ctx.strokeRect(49, 105, 862, 410);
  }

  ctx.restore();
}
