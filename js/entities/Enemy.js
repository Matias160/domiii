import { drawFood } from "../core/art.js";
export class Enemy {
  constructor({ x, y, type, difficulty }) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = type.radius;
    this.maxHp = type.hp * difficulty.hp;
    this.hp = this.maxHp;
    this.speed = type.speed * difficulty.speed;
    this.damage = type.damage * difficulty.damage;
    this.score = type.score;
    this.xp = type.xp;
    this.color = type.color;
    this.role = type.role || null;
    this.armor = type.armor || 1;
    this.isBoss = Boolean(type.boss);
    this.bossPhase = 'stalk';
    this.bossTimer = 3.8;
    this.chargeTarget = null;
    this.shotTimer = 1.5 + Math.random();
    this.shotReady = false;
    this.puddleTimer = 2;
    this.fuse = undefined;
    this.exploded = false;
    this.hitFlash = 0;
    this.spawnTime = type.boss ? 1.6 : type.id === 'onion' ? .9 : 0;
    this.slowFactor = 1;
    this.volleyTimer = 5;
    this.phaseTwo = false;
    this.specialTimer = 3.5;
    this.roleTimer = type.role === 'healer' ? 2.2 : type.role === 'summoner' ? 4 : 0;
  }

  update(delta, player, state) {
    this.hitFlash = Math.max(0, this.hitFlash - delta);
    this.spawnTime = Math.max(0, this.spawnTime - delta);
    if (this.spawnTime > 0 || this.hp <= 0) return;
    if (this.isBoss) {
      if (!this.phaseTwo && this.hp <= this.maxHp * .5) {
        this.phaseTwo=true;this.speed*=1.12;this.volleyTimer=Math.min(this.volleyTimer,1.2);
        if(state){state.directorNotice=`${this.type.name.toUpperCase()} / FASE 2`;state.shake=Math.max(state.shake,.35);state.rings?.push({x:this.x,y:this.y,radius:this.radius+70,life:.7,maxLife:.7,color:'#ff4f9a'});}
      }
      if (this.type.bossStyle === 'ranged') {
        const dx=player.x-this.x,dy=player.y-this.y,length=Math.hypot(dx,dy)||1;
        const approach=length<185?-.5:length>280?1:0;
        this.x+=(dx/length*approach-dy/length*.5)*this.speed*delta;
        this.y+=(dy/length*approach+dx/length*.5)*this.speed*delta;
      } else this.updateBoss(delta, player);
      this.x=Math.max(this.radius+8,Math.min(952-this.radius,this.x));
      this.y=Math.max(115+this.radius,Math.min(515-this.radius,this.y));
      this.volleyTimer -= delta;this.specialTimer-=delta;
      if (this.volleyTimer <= 0 && state) {
        state.rings?.push({x:this.x,y:this.y,radius:this.radius+38,life:.45,maxLife:.45,color:'#ff879e'});
        this.volleyTimer = this.type.bossStyle === 'ranged' ? (this.phaseTwo?2.05:2.7) : this.phaseTwo ? 3.5 : 5;
        const count=this.type.bossStyle==='ranged'?14:10;
        for (let i=0;i<count;i++) {
          const angle = i * Math.PI * 2 / count + state.time * .4;
          state.enemyProjectiles.push({x:this.x,y:this.y,vx:Math.cos(angle)*145,vy:Math.sin(angle)*145,radius:6,damage:this.damage*.45,life:4});
        }
      }
      if(this.phaseTwo&&state&&this.specialTimer<=0){
        const kind=this.type.bossStyle==='ranged'?'snipe':this.type.bossStyle==='fast'?'rain':'shockwave';
        this.specialTimer=kind==='snipe'?3.6:kind==='rain'?3.1:4.8;
        state.bossZones.push({kind,x:this.x,y:this.y,targetX:player.x,targetY:player.y,radius:kind==='shockwave'?145:40,delay:kind==='snipe'?.8:.9,life:kind==='shockwave'?1.15:1.25,damage:this.damage*(kind==='snipe'?.65:.75),triggered:false});
      }
      return;
    }
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const length = Math.hypot(dx, dy) || 1;
    const supportRange=this.role==='healer'?185:this.role==='summoner'?230:0;
    const approach = this.type.id === 'ketchup' ? (length < 155 ? -.65 : length > 245 ? 1 : 0) : supportRange ? (length<supportRange-35?-.55:length>supportRange+45?1:0) : this.fuse !== undefined ? .35 : 1;
    this.x += (dx / length) * this.speed * this.slowFactor * approach * delta;
    this.y += (dy / length) * this.speed * this.slowFactor * approach * delta;
    if (this.type.id === 'ketchup') {
      this.shotTimer -= delta;
      if (this.shotTimer <= 0) { this.shotTimer = 2.1; this.shotReady = true; }
    }
    if (this.type.id === 'icecream') {
      this.puddleTimer -= delta;
      if (this.puddleTimer <= 0) {
        this.puddleTimer = 2.5;
        state.hazards.push({ x: this.x, y: this.y, radius: 34, life: 5 });
      }
    }
    if (this.type.id === 'soda' && this.fuse === undefined && Math.hypot(dx, dy) < 105) this.fuse = 0.72;
    if (this.fuse !== undefined && !this.exploded) this.fuse -= delta;
    if(this.role==='healer'){
      this.roleTimer-=delta;
      if(this.roleTimer<=0){
        this.roleTimer=3.4;
        let healed=false;
        for(const ally of state.enemies){
          if(ally!==this&&ally.hp>0&&ally.hp<ally.maxHp&&Math.hypot(ally.x-this.x,ally.y-this.y)<175){ally.hp=Math.min(ally.maxHp,ally.hp+Math.max(8,ally.maxHp*.13));healed=true;}
        }
        if(healed){state.rings?.push({x:this.x,y:this.y,radius:175,life:.6,maxLife:.6,color:'#72ffa8'});state.floaters?.push({x:this.x,y:this.y-30,text:'+ CURA',life:.8,color:'#72ffa8',scale:1.1});}
      }
    }
    if(this.role==='summoner'){
      this.roleTimer-=delta;
      if(this.roleTimer<=0&&state.enemies.length<58){
        this.roleTimer=6.2;
        const minionType=enemyTypes.find(type=>!type.boss&&type.id==='fries');
        for(const side of [-1,1]){const minion=new Enemy({x:this.x+side*38,y:this.y+18,type:minionType,difficulty:state.difficulty});minion.spawnTime=.65;state.enemies.push(minion);}
        state.rings?.push({x:this.x,y:this.y,radius:64,life:.65,maxLife:.65,color:'#c58cff'});
      }
    }
  }

  updateBoss(delta, player) {
    this.bossTimer -= delta;
    if (this.bossPhase === 'telegraph') {
      if (this.bossTimer <= 0) {
        const angle = Math.atan2(this.chargeTarget.y - this.y, this.chargeTarget.x - this.x);
        this.chargeVelocity = { x: Math.cos(angle), y: Math.sin(angle) };
        this.bossPhase = 'charge';
        this.bossTimer = 0.82;
      }
      return;
    }
    if (this.bossPhase === 'charge') {
      this.x += this.chargeVelocity.x * this.speed * 3.15 * delta;
      this.y += this.chargeVelocity.y * this.speed * 3.15 * delta;
      if (this.bossTimer <= 0) {
        this.bossPhase = 'recover';
        this.bossTimer = 1.35;
      }
      return;
    }
    if (this.bossPhase === 'recover' && this.bossTimer <= 0) {
      this.bossPhase = 'stalk';
      this.bossTimer = 3.8;
    }
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const length = Math.hypot(dx, dy) || 1;
    const speed = this.bossPhase === 'recover' ? this.speed * 0.48 : this.speed;
    this.x += (dx / length) * speed * delta;
    this.y += (dy / length) * speed * delta;
    if (this.bossPhase === 'stalk' && this.bossTimer <= 0) {
      this.bossPhase = 'telegraph';
      this.bossTimer = this.type.bossStyle === 'fast' ? .65 : .9;
      this.chargeTarget = { x: player.x, y: player.y };
    }
  }

  draw(ctx) {
    if (this.spawnTime > 0) {
      const pulse = 0.6 + Math.sin(performance.now() / 90) * 0.4;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ff8284'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(this.x, this.y, 28, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ff8284'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
      ctx.fillText('!', this.x, this.y + 6);
      ctx.restore(); return;
    }

    // Indicador de ataque inminente (ketchup apuntando a disparar)
    if (this.type.id === 'ketchup' && this.shotTimer < 0.55) {
      const pulse = 0.5 + Math.sin(performance.now() / 55) * 0.5;
      ctx.save(); ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ff4040'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    if (this.fuse !== undefined && !this.exploded) {
      const fuseRatio = Math.max(0, this.fuse / 0.72);
      const pulse = 0.12 + Math.sin(performance.now() / 65) * 0.09;
      ctx.fillStyle = `rgba(245,75,70,${pulse + (1 - fuseRatio) * 0.18})`;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 26, 0, Math.PI * 2); ctx.fill();
    }

    if (this.isBoss && this.bossPhase === 'telegraph') {
      const pulse = 0.72 + Math.sin(performance.now() / 75) * 0.14;
      ctx.save(); ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#f15f58'; ctx.fillStyle = 'rgba(241, 95, 88, 0.16)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.chargeTarget.x, this.chargeTarget.y); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(this.chargeTarget.x, this.chargeTarget.y, this.radius * 0.75, this.radius * 0.48, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke(); ctx.restore();
    }

    if(this.phaseTwo){
      const pulse=.55+Math.sin(performance.now()/110)*.25;ctx.save();ctx.globalAlpha=pulse;ctx.strokeStyle='#ff4f9a';ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.beginPath();ctx.arc(this.x,this.y,this.radius+13,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    drawFood(ctx, this.type.id, this.x, this.y, this.radius / 23, performance.now() / 1000, true, this.hitFlash > 0);

    if(this.role){
      ctx.save();ctx.textAlign='center';ctx.font='bold 13px monospace';ctx.lineWidth=3;ctx.strokeStyle='#102126';
      const symbol=this.role==='shield'?'◆':this.role==='healer'?'+':'✦';
      ctx.fillStyle=this.role==='shield'?'#8be6ff':this.role==='healer'?'#72ffa8':'#cf91ff';
      ctx.strokeText(symbol,this.x,this.y-this.radius-14);ctx.fillText(symbol,this.x,this.y-this.radius-14);
      if(this.role==='shield'){ctx.globalAlpha=.72;ctx.strokeStyle='#8be6ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(this.x,this.y,this.radius+7,-1.1,1.1);ctx.stroke();}
      ctx.restore();
    }

    if (this.isBoss) {
      ctx.save();
      ctx.fillStyle = '#ffd33d'; ctx.strokeStyle = '#523521'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.x - this.radius * .55, this.y - this.radius * .72);
      ctx.lineTo(this.x - this.radius * .52, this.y - this.radius * 1.18);
      ctx.lineTo(this.x - this.radius * .2, this.y - this.radius * .96);
      ctx.lineTo(this.x, this.y - this.radius * 1.3);
      ctx.lineTo(this.x + this.radius * .2, this.y - this.radius * .96);
      ctx.lineTo(this.x + this.radius * .52, this.y - this.radius * 1.18);
      ctx.lineTo(this.x + this.radius * .55, this.y - this.radius * .72); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 3;
      ctx.strokeStyle = '#10272b'; ctx.fillStyle = '#fff8dd';
      ctx.strokeText(this.type.name.toUpperCase(), this.x, this.y - this.radius * 1.48);
      ctx.fillText(this.type.name.toUpperCase(), this.x, this.y - this.radius * 1.48);
      ctx.restore();
    }

    // Barra de vida: siempre visible para fuertes (hp >= 40 o boss), solo cuando dañados para débiles
    const isStrong = this.maxHp >= 40 || this.isBoss;
    if (this.hp >= this.maxHp && !isStrong) return;

    const barWidth = this.isBoss ? this.radius * 2.5 : this.radius * 2.1;
    const barHeight = this.isBoss ? 9 : 5;
    const barY = this.y - this.radius - (this.isBoss ? 12 : 9);
    const hpRatio = Math.max(0, this.hp / this.maxHp);

    // Fondo de barra
    ctx.fillStyle = '#0d1f24'; ctx.fillRect(this.x - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);
    ctx.fillStyle = '#10272b'; ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

    // Color de la barra según tipo de enemigo
    const typeColor = this.isBoss
      ? (hpRatio < 0.4 ? '#ff4444' : hpRatio < 0.7 ? '#ffaa00' : '#f47779')
      : (this.type.color || '#3bd671');

    ctx.fillStyle = typeColor;
    ctx.fillRect(this.x - barWidth / 2, barY, hpRatio * barWidth, barHeight);

    // Brillo sutil en la barra
    ctx.fillStyle = '#ffffff22';
    ctx.fillRect(this.x - barWidth / 2, barY, hpRatio * barWidth, Math.ceil(barHeight / 3));
  }
}

export const enemyTypes = [
  { id: "burger", name: "Hamburguesa basica", hp: 28, speed: 92, damage: 11, score: 20, xp: 6, radius: 16, color: "#b96f2d" },
  { id: "double", name: "Hamburguesa doble", hp: 58, speed: 62, damage: 18, score: 45, xp: 12, radius: 21, color: "#8f4d22" },
  { id: "soda", name: "Gaseosa explosiva", hp: 20, speed: 132, damage: 22, score: 35, xp: 9, radius: 14, color: "#29b6f6" },
  { id: "fries", name: "Papas mutantes", hp: 16, speed: 152, damage: 8, score: 18, xp: 5, radius: 12, color: "#ffd33d" },
  { id: "ketchup", name: "Ketchup francotirador", hp: 30, speed: 48, damage: 13, score: 38, xp: 10, radius: 17, color: "#ef5960" },
  { id: "icecream", name: "Helado resbaladizo", hp: 38, speed: 67, damage: 12, score: 42, xp: 11, radius: 18, color: "#db96ff" },
  { id: "onion", name: "Cebolla sorpresa", hp: 23, speed: 168, damage: 17, score: 37, xp: 9, radius: 15, color: "#c7b1e8" },
  { id: "tray", name: "Bandeja blindada", hp: 105, speed: 48, damage: 16, score: 72, xp: 18, radius: 23, color: "#74cbe3", role: "shield", armor: 2 },
  { id: "mayo", name: "Mayonesa medica", hp: 52, speed: 57, damage: 9, score: 68, xp: 17, radius: 18, color: "#76e8a4", role: "healer" },
  { id: "chef", name: "Chef invocador", hp: 78, speed: 44, damage: 12, score: 92, xp: 22, radius: 22, color: "#be82ec", role: "summoner" },
  { id: "double", name: "Rey del mostrador", hp: 560, speed: 54, damage: 24, score: 550, xp: 42, radius: 48, color: "#ffd33d", boss: true },
  { id: "ketchup", name: "Senor Ketchup", hp: 680, speed: 76, damage: 25, score: 750, xp: 55, radius: 42, color: "#ff6e76", boss: true, bossStyle: 'ranged' },
  { id: "fries", name: "La Papota Suprema", hp: 820, speed: 76, damage: 28, score: 950, xp: 70, radius: 46, color: "#ffdd61", boss: true, bossStyle: 'fast' },
];
