// Spawn partículas con velocidad y tamaño variables
export function burst(state, x, y, color, count = 8, power = 100) {
  if (!state.particles) return;
  for (let i = 0; i < count && state.particles.length < 800; i++) {
    const angle = Math.random() * Math.PI * 2, speed = power * (.3 + Math.random() * .7);
    const size = 2 + Math.random() * 4;
    const life=.25+Math.random()*.4;
    state.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life,maxLife:life,color,size,palette:['#fffbe8',color,'#ff8a3d','#ff3535'],drag:.92,gravity:45});
  }
}

export function explosionBurst(state,x,y,color='#ff7048',count=26,power=180){
  burst(state,x,y,color,count,power);
  for(let i=0;i<9;i++){
    const angle=Math.random()*Math.PI*2,speed=20+Math.random()*45,life=.65+Math.random()*.55;
    state.particles.push({x:x+(Math.random()-.5)*18,y:y+(Math.random()-.5)*12,vx:Math.cos(angle)*speed,vy:-25+Math.sin(angle)*speed*.35,life,maxLife:life,color:'#697078',size:5+Math.random()*7,palette:['#ffd487','#8b6d63','#596169','#29333c'],drag:.965,gravity:-10});
  }
}

// Partículas en forma de estrella para críticos
export function critBurst(state, x, y) {
  if (!state.particles) return;
  const colors = ['#fff7a0', '#ffe54d', '#ffffff', '#ffd700'];
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2, speed = 90 + Math.random() * 160;
    const life=.4+Math.random()*.3,color=colors[i%colors.length];state.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life,maxLife:life,color,size:3+Math.random()*4,palette:['#ffffff',color,'#ff9c33','#4b525b'],drag:.98,gravity:38});
  }
}

// Onda de impacto visual al golpear
export function impactRing(state, x, y, color = '#ffffff88') {
  state.rings?.push({ x, y, radius: 32, life: .38, maxLife:.38, color });
}

// Colores de floaters según tipo de daño
const DAMAGE_COLORS = {
  crit:   '#fff500',
  fire:   '#ff7a1a',
  ice:    '#7fd6ff',
  poison: '#a3ff6f',
  dash:   '#9fffe0',
  heal:   '#7bffb0',
  normal: '#ffe8a1',
};

export function damageEnemy(state, enemy, damage, type = 'normal') {
  if (enemy.hp <= 0 || enemy.spawnTime > 0) return;
  damage /= enemy.armor || 1;
  // Crítico: daño alto o aleatorio 10%
  const isCrit = damage > 60 || Math.random() < 0.10;
  const finalDamage = isCrit ? damage * 1.4 : damage;
  enemy.hp -= finalDamage;
  enemy.hitFlash = isCrit ? .22 : .12;
  if(isCrit)state.shake=Math.max(state.shake||0,.12);

  if (state.floaters && state.floaters.length < 90) {
    const color = isCrit ? DAMAGE_COLORS.crit : (DAMAGE_COLORS[type] || DAMAGE_COLORS.normal);
    state.floaters.push({
      x: enemy.x + (Math.random() - .5) * 18,
      y: enemy.y - 22,
      text: isCrit ? `✦${Math.ceil(finalDamage)}` : String(Math.ceil(finalDamage)),
      life: isCrit ? .95 : .65,
      color,
      scale: isCrit ? 1.65 : 1,
      kind: isCrit ? 'crit' : type,
    });
  }

  const particleColor = isCrit ? '#fff700' : (DAMAGE_COLORS[type] || '#ffd468');
  burst(state, enemy.x, enemy.y, particleColor, isCrit ? 30 : 20, isCrit ? 170 : 115);
  if (isCrit) { critBurst(state, enemy.x, enemy.y); impactRing(state, enemy.x, enemy.y, '#ffe500aa'); }
  else impactRing(state, enemy.x, enemy.y, particleColor + '88');
}

export function updateEffects(state, delta) {
  const player = state.player;
  state.dashGhosts ||= [];
  state.dashGhosts = state.dashGhosts.filter(ghost => ghost.life > delta);
  for (const ghost of state.dashGhosts) ghost.life -= delta;
  if (player.dashTime > 0) state.dashGhosts.push({ x: player.x, y: player.y, life: .18 });
  state.comboTime = Math.max(0, state.comboTime - delta);
  if (state.comboTime <= 0) state.combo = 0;
  
  if (state.particles.length > 450) {
    state.particles = state.particles.slice(state.particles.length - 450);
  }
  const dragFactor = Math.pow(0.92, delta * 60);
  const activeParticles = [];
  for (let i = 0; i < state.particles.length; i++) {
    const p = state.particles[i];
    p.life -= delta;
    if (p.life > 0) {
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      const drag = p.drag ? Math.pow(p.drag, delta * 60) : dragFactor;
      p.vx *= drag;
      p.vy *= drag;
      p.vy += (p.gravity ?? 45) * delta;
      activeParticles.push(p);
    }
  }
  state.particles = activeParticles;
  state.floaters = state.floaters.filter(p => p.life > 0);
  for (const p of state.floaters) { p.maxLife ??= p.life;p.life -= delta; p.y -= delta * (p.scale > 1 ? 55 : 38); }
  state.rings = state.rings.filter(r => r.life > 0);
  for (const ring of state.rings) { ring.maxLife ??= ring.life; ring.life -= delta; }
  if (player.dashTime > 0) burst(state, player.x - player.facing.x * 15, player.y, '#86e3bf', 2, 30);

  // Rising energy pixels make temporary states readable around the character.
  const auraColor=player.comboFeverTime>0?'#ff5d9e':player.buffs.fireTime>0?'#ffd75f':player.buffs.speedTime>0?'#72f5e1':player.buffs.damageTime>0?'#ff936e':null;
  if(auraColor){state.auraParticleClock=(state.auraParticleClock||0)-delta;if(state.auraParticleClock<=0){state.auraParticleClock=.075;for(let i=0;i<2;i++){const life=.55+Math.random()*.35;state.particles.push({x:player.x+(Math.random()-.5)*38,y:player.y+22,vx:(Math.random()-.5)*18,vy:-45-Math.random()*35,life,maxLife:life,color:auraColor,size:2+Math.random()*3,palette:['#ffffff',auraColor,auraColor,'#23343b'],drag:.99,gravity:-8});}}}

  // Partículas orbitales de aura
  if (player.auraLevel > 0) {
    const t = state.time * 2.5;
    for (let i = 0; i < player.auraLevel; i++) {
      const a = t + (i / player.auraLevel) * Math.PI * 2;
      state.particles.push({ x: player.x + Math.cos(a) * 108, y: player.y + Math.sin(a) * 108, vx: -Math.sin(a) * 22, vy: Math.cos(a) * 22, life: .22,maxLife:.22, color: '#86e3bf', size: 3,palette:['#eafff6','#86e3bf','#2b6d61'] });
    }
  }

  if (player.mustardLevel > 0) {
    player.rainTimer -= delta;
    if (player.rainTimer <= 0 && state.enemies.some(e => e.hp > 0 && e.spawnTime <= 0)) {
      player.rainTimer = 5;
      const targets = state.enemies.filter(e => e.hp > 0 && e.spawnTime <= 0)
        .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))
        .slice(0, 2 + player.mustardLevel);
      for (const enemy of targets) {
        damageEnemy(state, enemy, 28 * player.mustardLevel, 'fire');
        state.rings.push({ x: enemy.x, y: enemy.y, radius: 48, life: .6, color: '#ffcf4a' });
        burst(state, enemy.x, enemy.y, '#ffcf4a', 18, 140);
      }
      state.audio?.play('pickup');
    }
  }
}
