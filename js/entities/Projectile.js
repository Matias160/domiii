export class Projectile {
  constructor({ x, y, vx, vy, damage, size, color, pierce = 0, splash = 0, kind = 'sauce', boomerang = false, cluster = false }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = size;
    this.color = color;
    this.pierce = pierce;
    this.splash = splash;
    this.dead = false;
    this.hitEnemies = new Set();
    this.kind = kind;
    this.boomerang = boomerang;
    this.cluster = cluster;
    this.age = 0;
    this.returning = false;
    this.previousX = x; this.previousY = y;
    this.trail = [];
  }

  update(delta) {
    this.age += delta;
    this.previousX = this.x; this.previousY = this.y;
    this.trail.push({x:this.x,y:this.y});
    if(this.trail.length>8)this.trail.shift();
    this.x += this.vx * delta;
    this.y += this.vy * delta;
  }

  draw(ctx) {
    ctx.save();
    if(this.trail.length > 0){
      ctx.fillStyle = this.color;
      for(let i=0;i<this.trail.length;i++){
        const point=this.trail[i],ratio=(i+1)/this.trail.length,size=Math.max(1,this.radius*ratio*.9);
        ctx.globalAlpha=ratio*.35;
        ctx.fillRect(Math.round(point.x-size/2),Math.round(point.y-size/2),Math.ceil(size),Math.ceil(size));
      }
    }
    ctx.globalAlpha=1;
    ctx.translate(this.x,this.y);ctx.rotate(Math.atan2(this.vy,this.vx));
    const trail = Math.min(28, Math.hypot(this.vx,this.vy)*.04);
    ctx.strokeStyle = this.color; ctx.lineWidth = Math.max(2,this.radius*.8);
    ctx.globalAlpha = .4; ctx.beginPath(); ctx.moveTo(-trail,0); ctx.lineTo(0,0); ctx.stroke();
    ctx.fillStyle = this.color;ctx.globalAlpha = 0.3;
    ctx.beginPath();ctx.ellipse(-this.radius*2,0,this.radius*4,this.radius,0,0,7);ctx.fill();
    ctx.globalAlpha = 1;
    if (this.kind === 'fork' || this.kind === 'skewer') {
      ctx.fillRect(-this.radius*2,-1,this.radius*4,2);
      if(this.kind==='fork')for(let i=-1;i<=1;i++)ctx.fillRect(this.radius,-4+i*4,this.radius+3,2);
    } else if(this.kind==='friesRain') {
      ctx.fillRect(-this.radius*2,-this.radius/2,this.radius*4,this.radius);
    } else {
      ctx.beginPath();ctx.ellipse(0,0,this.radius*1.4,this.radius,0,0,7);ctx.fill();
    }
    ctx.fillStyle='#fffde5';ctx.fillRect(-1,-1,3,2);ctx.restore();
  }
}
