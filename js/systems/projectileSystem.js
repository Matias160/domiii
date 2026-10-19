import { Projectile } from "../entities/Projectile.js";
import { sweptOverlap, distance } from "../core/collision.js";
import { damageEnemy, explosionBurst } from './effectSystem.js';

export function updateProjectiles(state, delta, canvas) {
  autoFire(state);

  state.enemyProjectiles ||= [];
  for (const shot of state.enemyProjectiles) {
    shot.previousX=shot.x;shot.previousY=shot.y;
    shot.trail ||= [];shot.trail.push({x:shot.x,y:shot.y});if(shot.trail.length>7)shot.trail.shift();
    shot.x += shot.vx * delta; shot.y += shot.vy * delta; shot.life -= delta;
    if (sweptOverlap(shot, state.player)) {
      shot.life = 0;
      if (state.player.takeDamage(shot.damage)) { state.shake = 0.18; state.audio?.play('damage'); }
    }
  }
  state.enemyProjectiles = state.enemyProjectiles.filter(shot => shot.life > 0 && shot.x > -20 && shot.x < canvas.width + 20 && shot.y > -20 && shot.y < canvas.height + 20);

  for (const projectile of state.projectiles) {
    if (projectile.boomerang && projectile.age > .48) {
      projectile.returning = true;
      const dx=state.player.x-projectile.x,dy=state.player.y-projectile.y,length=Math.hypot(dx,dy)||1;
      projectile.vx=dx/length*690;projectile.vy=dy/length*690;
      if(projectile.age>1.45)projectile.dead=true;
    }
    projectile.update(delta);
    if(state.particles&&!projectile.dead){
      projectile.trailClock=(projectile.trailClock||0)+delta*30;
      const count=Math.min(3,Math.floor(projectile.trailClock));
      if(count>0){
        projectile.trailClock-=count;
        const speed=Math.hypot(projectile.vx,projectile.vy)||1;
        for(let i=0;i<count&&state.particles.length<500;i++){
          const life=.15+Math.random()*.1;
          state.particles.push({x:projectile.x-projectile.vx/speed*projectile.radius*2+(Math.random()-.5)*4,y:projectile.y-projectile.vy/speed*projectile.radius*2+(Math.random()-.5)*4,vx:-projectile.vx*.04,vy:-projectile.vy*.04,life,maxLife:life,size:2+Math.random()*2,color:'#ffe066',palette:['#ffe066','#ff973d','#ff3939'],drag:.92,gravity:0});
        }
      }
    }
  }

  for (const projectile of state.projectiles) {
    if (projectile.dead) continue;
    const hits = state.enemies.filter(enemy=>enemy.hp>0 && enemy.spawnTime<=0 && !projectile.hitEnemies.has(enemy) && sweptOverlap(projectile,enemy));
    hits.sort((a,b)=>Math.hypot(a.x-projectile.previousX,a.y-projectile.previousY)-Math.hypot(b.x-projectile.previousX,b.y-projectile.previousY));
    for (const enemy of hits) {
      if (enemy.hp <= 0) continue;
      projectile.hitEnemies.add(enemy);
      const bossBonus = enemy.isBoss ? (state.player.skin.bossDamageMultiplier || 1) : 1;
      damageEnemy(state, enemy, projectile.damage * bossBonus);
      if (projectile.splash > 0) {
        state.rings?.push({x:enemy.x,y:enemy.y,radius:projectile.splash,life:.5,color:'#ffcc77'});
        explosionBurst(state,enemy.x,enemy.y,projectile.color,28,170);
        for (const other of state.enemies) {
          if (other !== enemy && distance(enemy, other) <= projectile.splash) {
            damageEnemy(state, other, projectile.damage * 0.45);
          }
        }
      }
      if(projectile.cluster){
        projectile.cluster=false;
        for(let i=0;i<6;i++){
          const angle=i*Math.PI/3;
          state.projectiles.push(new Projectile({x:enemy.x,y:enemy.y,vx:Math.cos(angle)*260,vy:Math.sin(angle)*260,damage:projectile.damage*.34,size:Math.max(3,projectile.radius*.5),color:'#ffb347',pierce:0,kind:'explosiveBread'}));
        }
      }
      if (projectile.pierce > 0) {
        projectile.pierce -= 1;
      } else {
        projectile.dead = true;
        break;
      }
    }
  }

  state.projectiles = state.projectiles.filter(p => !p.dead && p.x>=-40 && p.x<=canvas.width+40 && p.y>=-40 && p.y<=canvas.height+40);
}

export function autoFire(state) {
  const player = state.player;
  const target = state.manualAim ? state.aimPoint : state.enemies.filter(enemy=>enemy.hp>0 && enemy.spawnTime<=0).reduce((closest, enemy) => {
    if (!closest) return enemy;
    return distance(player, enemy) < distance(player, closest) ? enemy : closest;
  }, null);
  state.target=state.manualAim?null:target;
  if (!target) return;

  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const angle = Math.atan2(dy, dx);
  player.aimAngle = angle;
  if (player.fireCooldown > 0) return;
  player.muzzleTime=.09;
  const weapon = player.weapon;
  const evolution=player.weaponEvolution;
  player.shotsFired=(player.shotsFired||0)+1;
  const empowered=evolution?.empoweredEvery&&player.shotsFired%evolution.empoweredEvery===0;
  const count = weapon.projectileCount + player.extraProjectiles + (player.comboFeverTime > 0 ? 2 : 0) + (evolution?.extraProjectiles||0);
  const spread = count > 1 ? (evolution?.spread||0.36) : 0;

  for (let index = 0; index < count; index += 1) {
    const offset = count === 1 ? 0 : -spread / 2 + (spread * index) / (count - 1);
    const finalAngle = angle + offset;
    state.projectiles.push(
      new Projectile({
        x: player.x,
        y: player.y,
        vx: Math.cos(finalAngle) * weapon.projectileSpeed,
        vy: Math.sin(finalAngle) * weapon.projectileSpeed,
        damage: weapon.damage * player.damageMultiplier * player.buffs.damageMultiplier * (evolution?.damageMultiplier||1) * (empowered?2.1:1),
        size: weapon.projectileSize * player.projectileScale * (empowered?1.75:1),
        color: empowered?'#fff27a':weapon.color,
        pierce: weapon.pierce + player.pierceBonus + (evolution?.pierceBonus||0) + (empowered?2:0),
        splash: Math.max((weapon.splash||0)*(evolution?.splashMultiplier||1),evolution?.splash||0),
        kind: weapon.id,
        boomerang:Boolean(evolution?.boomerang),
        cluster:Boolean(evolution?.cluster),
      }),
    );
  }

  player.fireCooldown = weapon.fireRate * player.fireRateMultiplier * player.buffs.fireRateMultiplier;
  if (weapon.fireRate >= .3) state.audio?.play('shoot');
}
