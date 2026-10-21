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
  if(state.decoy){state.decoy.life-=dt;state.decoy.x+=state.decoy.vx*dt;state.decoy.y+=state.decoy.vy*dt;
    if(state.decoy.life<=0||state.decoy.x < -45||state.decoy.x>1005||state.decoy.y < -45||state.decoy.y>585)state.decoy=null;}
}
export function activatePrime(state,key){const prime=primes.find(p=>p.key===key),player=state.player;
  if(!prime||player.level<prime.level||state.primeCooldowns[key]>0)return false;
  state.primeCooldowns[key]=prime.cooldown;
  if(key==='q')for(let i=0;i<20;i++){
    const a=i*Math.PI/10;state.projectiles.push(new Projectile({x:player.x,y:player.y,vx:Math.cos(a)*560,vy:Math.sin(a)*560,damage:player.weapon.damage*player.damageMultiplier*1.15,size:7,color:'#ffe269',pierce:1,kind:'sauce'}));
  }
  if(key==='e'){const dx=player.x<480?1:-1,dy=player.y<270?1:-1;
    state.decoy={x:player.x,y:player.y,vx:dx*230,vy:dy*145,life:5,skin:player.skin.id};}
  if(key==='r'){player.shieldTime=3.5;player.invulnerable=Math.max(player.invulnerable,3.5);
    state.rings.push({x:player.x,y:player.y,radius:110,life:.9,color:'#8df5ea'});
    for(const enemy of state.enemies){const d=Math.hypot(enemy.x-player.x,enemy.y-player.y)||1;if(d<125){enemy.x+=(enemy.x-player.x)/d*75;enemy.y+=(enemy.y-player.y)/d*75;}}}
  return true;
}
export function drawPrimeEffects(ctx,state){
  if(state.decoy){ctx.save();ctx.globalAlpha=.48;drawFood(ctx,state.decoy.skin,state.decoy.x,state.decoy.y,.85,state.time);ctx.restore();}
  if(state.player.shieldTime>0){ctx.save();ctx.strokeStyle='#95f7e9';ctx.lineWidth=4;ctx.shadowColor='#95f7e9';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(state.player.x,state.player.y,32+Math.sin(state.time*8)*2,0,7);ctx.stroke();ctx.restore();}
}
