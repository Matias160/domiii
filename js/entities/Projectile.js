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
    this.drawTrail(ctx);
    this.drawBody(ctx);
  }

  // Estela de posiciones anteriores (cambia cada cuadro, se dibuja directo)
  drawTrail(ctx) {
    if (this.trail.length > 0) {
      ctx.fillStyle = this.color;
      for (let i = 0; i < this.trail.length; i++) {
        const point = this.trail[i], ratio = (i + 1) / this.trail.length, size = Math.max(1, this.radius * ratio * 0.9);
        ctx.globalAlpha = ratio * 0.35;
        ctx.fillRect(Math.round(point.x - size / 2), Math.round(point.y - size / 2), Math.ceil(size), Math.ceil(size));
      }
      ctx.globalAlpha = 1;
    }
  }

  // Cuerpo de la bala: imagen pre-dibujada por tipo/color/tamaño, solo se rota y se coloca
  drawBody(ctx) {
    const sprite = projectileSprite(this.kind, this.color, this.radius, Math.min(28, Math.hypot(this.vx, this.vy) * 0.04));
    const angle = Math.atan2(this.vy, this.vx);
    ctx.save();
    ctx.translate(this.x, this.y); ctx.rotate(angle);
    ctx.drawImage(sprite.canvas, -sprite.ox, -sprite.oy);
    ctx.restore();
  }
}

// Imágenes de balas cacheadas: misma forma y colores que el dibujo directo de antes
const projectileSprites = new Map();
function projectileSprite(kind, color, radius, trailLength) {
  const r = Math.round(radius * 2) / 2, trail = Math.round(trailLength / 4) * 4;
  const key = `${kind}|${color}|${r}|${trail}`;
  let sprite = projectileSprites.get(key);
  if (sprite) return sprite;
  const left = Math.ceil(Math.max(trail, r * 6)) + 3, right = Math.ceil(r * 2 + 6), half = Math.ceil(r + 6);
  const canvas = document.createElement('canvas');
  canvas.width = left + right; canvas.height = half * 2;
  const c = canvas.getContext('2d');
  c.translate(left, half);
  // Misma mezcla aditiva con la que se dibujan las balas sobre la escena
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = color; c.lineWidth = Math.max(2, r * 0.8);
  c.globalAlpha = 0.4; c.beginPath(); c.moveTo(-trail, 0); c.lineTo(0, 0); c.stroke();
  c.fillStyle = color; c.globalAlpha = 0.3;
  c.beginPath(); c.ellipse(-r * 2, 0, r * 4, r, 0, 0, 7); c.fill();
  c.globalAlpha = 1;
  if (kind === 'fork' || kind === 'skewer') {
    c.fillRect(-r * 2, -1, r * 4, 2);
    if (kind === 'fork') for (let i = -1; i <= 1; i++) c.fillRect(r, -4 + i * 4, r + 3, 2);
  } else if (kind === 'friesRain') {
    c.fillRect(-r * 2, -r / 2, r * 4, r);
  } else {
    c.beginPath(); c.ellipse(0, 0, r * 1.4, r, 0, 0, 7); c.fill();
  }
  c.fillStyle = '#fffde5'; c.fillRect(-1, -1, 3, 2);
  sprite = { canvas, ox: left, oy: half };
  projectileSprites.set(key, sprite);
  if (projectileSprites.size > 160) projectileSprites.delete(projectileSprites.keys().next().value);
  return sprite;
}
