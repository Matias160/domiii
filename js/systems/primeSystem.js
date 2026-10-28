import {Projectile} from '../entities/Projectile.js';
import {drawFood} from '../core/art.js';
export const primes=[
  {key:'q',level:5,name:'Rafaga 360',cooldown:18,symbol:'✳',info:'Dispara 20 proyectiles en círculo a tu alrededor. Ideal cuando te rodean.'},
  {key:'e',level:10,name:'Doble señuelo',cooldown:28,symbol:'◈',info:'Suelta un clon que corre hacia el borde del mapa y se lleva a los enemigos detrás.'},
  {key:'r',level:15,name:'Campana blindada',cooldown:40,symbol:'⬡',info:'Te cubre con un escudo 3,5 segundos: no recibís daño y empujás a los que están cerca.'},
];
export function updatePrimes(state,dt){
  for(const prime of primes)state.primeCooldowns[prime.key]=Math.max(0,(state.primeCooldowns[prime.key]||0)-dt);
  state.player.shieldTime=Math.max(0,(state.player.shieldTime||0)-dt);
  if(state.decoy){
    state.decoy.life -= dt;
    state.decoy.x += state.decoy.vx * dt;
    state.decoy.y += state.decoy.vy * dt;
    state.decoy.ringTimer = (state.decoy.ringTimer || 0) - dt;
    if (state.decoy.ringTimer <= 0 && state.rings) {
      state.decoy.ringTimer = 0.28;
      state.rings.push({ x: state.decoy.x, y: state.decoy.y, radius: 26, life: 0.35, color: '#38bdf8' });
    }
    const worldW = state.world?.width || 1920;
    const worldH = state.world?.height || 1080;
    // El clon señuelo viaja atrayendo enemigos hasta salir completamente fuera del mapa
    if(state.decoy.life <= 0 || state.decoy.x < -180 || state.decoy.x > worldW + 180 || state.decoy.y < -180 || state.decoy.y > worldH + 180){
      state.decoy = null;
    }
  }
}
export function activatePrime(state,key){const prime=primes.find(p=>p.key===key),player=state.player;
  const isUnlocked = state.mapId === 'lava' || player.level >= prime.level;
  if(!prime||!isUnlocked||state.primeCooldowns[key]>0)return false;
  state.primeCooldowns[key]=prime.cooldown;
  if(key==='q')for(let i=0;i<20;i++){
    const a=i*Math.PI/10;state.projectiles.push(new Projectile({x:player.x,y:player.y,vx:Math.cos(a)*560,vy:Math.sin(a)*560,damage:player.weapon.damage*player.damageMultiplier*1.15,size:7,color:'#ffe269',pierce:1,kind:'sauce'}));
  }
  if(key==='e'){
    const worldW = state.world?.width || 1920;
    const worldH = state.world?.height || 1080;
    // El clon corre hacia el borde exterior del mapa para llevarse a toda la horda
    const toRight = player.x < worldW * 0.5 ? 1 : -1;
    const toBottom = player.y < worldH * 0.5 ? 0.4 : -0.4;
    const speed = 210;
    state.decoy = {
      x: player.x,
      y: player.y,
      vx: toRight * speed,
      vy: toBottom * speed,
      life: 14,
      skin: player.skin.id
    };
    state.rings?.push({ x: player.x, y: player.y, radius: 45, life: 0.6, color: '#38bdf8' });
  }
  if(key==='r'){player.shieldTime=3.5;player.invulnerable=Math.max(player.invulnerable,3.5);
    state.rings.push({x:player.x,y:player.y,radius:110,life:.9,color:'#8df5ea'});
    for(const enemy of state.enemies){const d=Math.hypot(enemy.x-player.x,enemy.y-player.y)||1;if(d<125){enemy.x+=(enemy.x-player.x)/d*75;enemy.y+=(enemy.y-player.y)/d*75;}}}
  return true;
}
export function drawPrimeEffects(ctx,state){
  if(state.decoy){
    ctx.save();
    // Aura celeste del señuelo con círculos translúcidos (sin shadowBlur)
    ctx.fillStyle = '#38bdf8';
    ctx.globalAlpha = 0.12; ctx.beginPath(); ctx.arc(state.decoy.x, state.decoy.y - 4, 38, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.arc(state.decoy.x, state.decoy.y - 4, 28, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.85;
    drawFood(ctx, state.decoy.skin, state.decoy.x, state.decoy.y, 0.95, state.time);
    ctx.restore();
    if(false && state.rings && (Math.sin(state.time * 6) > 0.85)){
      state.rings.push({x: state.decoy.x, y: state.decoy.y, radius: 26, life: 0.35, color: '#38bdf8'});
    }
  }
  if(state.player.shieldTime>0){ctx.save();ctx.strokeStyle='#95f7e9';ctx.beginPath();ctx.arc(state.player.x,state.player.y,32+Math.sin(state.time*8)*2,0,7);ctx.globalAlpha=.3;ctx.lineWidth=12;ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=4;ctx.stroke();ctx.restore();}
}
