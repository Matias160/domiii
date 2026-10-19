import { drawFood } from '../core/art.js';
import { Projectile } from './Projectile.js';

export const companions = {
  none: { name: 'Sin companero', detail: 'Solo contra el menu.' },
  ketchup: { name: 'Mini ketchup', detail: 'Dispara a los enemigos cada 1.8 segundos.' },
  drone: { name: 'Dron delivery', detail: 'Acerca los aderezos en un radio de 150.' },
};

export class Companion {
  constructor(id, player) {
    this.id = companions[id] ? id : 'none';
    this.x = player.x - 40; this.y = player.y + 30;
    this.cooldown = 0;
  }
  update(state, delta) {
    if (this.id === 'none') return;
    const p = state.player, blend = 1 - Math.exp(-delta * 6);
    this.x += (p.x - p.facing.x * 45 + Math.sin(state.time) * 14 - this.x) * blend;
    this.y += (p.y - p.facing.y * 45 + 24 - this.y) * blend;
    if (this.id === 'drone') {
      for (const item of state.items) {
        const dx = p.x - item.x, dy = p.y - item.y, distance = Math.hypot(dx,dy);
        if (distance > 1 && distance < 150) {
          const step = Math.min(distance, delta * 155);
          item.x += dx / distance * step; item.y += dy / distance * step;
        }
      }
      return;
    }
    this.cooldown -= delta;
    if (this.cooldown > 0) return;
    let target = null, nearest = 350;
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x-this.x, enemy.y-this.y);
      if (enemy.hp > 0 && enemy.spawnTime <= 0 && distance < nearest) { target=enemy; nearest=distance; }
    }
    if (!target) return;
    const angle = Math.atan2(target.y-this.y,target.x-this.x);
    state.projectiles.push(new Projectile({x:this.x,y:this.y,vx:Math.cos(angle)*400,vy:Math.sin(angle)*400,damage:7+p.level*1.5,size:4,color:'#ff8782',kind:'sauce'}));
    this.cooldown = 1.8;
  }
  draw(ctx, time) {
    if (this.id === 'none') return;
    if (this.id === 'ketchup') { drawFood(ctx,'ketchup',this.x,this.y,.4,time); return; }
    const bob = Math.sin(time * 8) * 2;
    ctx.save();ctx.translate(Math.round(this.x),Math.round(this.y+bob));
    ctx.fillStyle='#111c2266';ctx.fillRect(-13,16,26,4);
    ctx.fillStyle='#182528';ctx.fillRect(-14,-8,28,20);
    ctx.fillStyle='#f5ca62';ctx.fillRect(-10,-5,20,14);ctx.fillStyle='#f2f1d2';ctx.fillRect(-3,-4,6,12);
    ctx.fillStyle='#93b4a8';ctx.fillRect(-23,-12,18,3);ctx.fillRect(5,-12,18,3);
    ctx.fillStyle='#dce2c9';ctx.fillRect(-23+Math.round(Math.sin(time*50)*4),-15,18,2);ctx.fillRect(5+Math.round(Math.cos(time*50)*4),-15,18,2);ctx.restore();
  }
}
