import {Projectile} from '../entities/Projectile.js';
import {drawFood} from '../core/art.js';
export const primes=[
  {key:'q',level:5,name:'Rafaga 360',cooldown:18,symbol:'✳'},
  {key:'e',level:10,name:'Doble señuelo',cooldown:28,symbol:'◈'},
  {key:'r',level:15,name:'Campana blindada',cooldown:40,symbol:'⬡'},
];
export function updatePrimes(state,dt){
  for(const prime of primes)state.primeCooldowns[prime.key]=Math.max(0,(state.primeCooldowns[prime.key]||0)-dt);
  state.player.shieldTime=Math.max(0,(state.player.shieldTime||0)-dt);
  if(state.decoy){
    state.decoy.life -= dt;
    state.decoy.x += state.decoy.vx * dt;
    state.decoy.y += state.decoy.vy * dt;
    const worldW = state.world?.width || 1920;
    const worldH = state.world?.height || 1080;
    // El clon señuelo viaja atrayendo enemigos hasta salir completamente fuera del mapa
    if(state.decoy.life <= 0 || state.decoy.x < -180 || state.decoy.x > worldW + 180 || state.decoy.y < -180 || state.decoy.y > worldH + 180){
      state.decoy = null;
    }
  }
}
export function activatePrime(state,key){const prime=primes.find(p=>p.key===key),player=state.player;
  if(!prime||player.level<prime.level||state.primeCooldowns[key]>0)return false;
  state.primeCooldowns[key]=prime.cooldown;
  if(key==='q')for(let i=0;i<20;i++){
    const a=i*Math.PI/10;state.projectiles.push(new Projectile({x:player.x,y:player.y,vx:Math.cos(a)*560,vy:Math.sin(a)*560,damage:player.weapon.damage*player.damageMultiplier*1.15,size:7,color:'#ffe269',pierce:1,kind:'sauce'}));
  }
  if(key==='e'){
    const worldW = state.world?.width || 1920;
    const worldH = state.world?.height || 1080;
    // El clon corre hacia el borde exterior del mapa para llevarse a toda la horda
    const toRight = player.x < worldW * 0.5 ? -1 : 1;
    const toBottom = player.y < worldH * 0.5 ? -0.4 : 0.4;
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
    ctx.globalAlpha = 0.85;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    drawFood(ctx, state.decoy.skin, state.decoy.x, state.decoy.y, 0.95, state.time);
    ctx.restore();
    if(state.rings && (Math.sin(state.time * 6) > 0.85)){
      state.rings.push({x: state.decoy.x, y: state.decoy.y, radius: 26, life: 0.35, color: '#38bdf8'});
    }
  }
  if(state.player.shieldTime>0){ctx.save();ctx.strokeStyle='#95f7e9';ctx.lineWidth=4;ctx.shadowColor='#95f7e9';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(state.player.x,state.player.y,32+Math.sin(state.time*8)*2,0,7);ctx.stroke();ctx.restore();}
}
