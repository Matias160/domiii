import { drawFood } from "../core/art.js";
import { createBossBehaviorTree } from "../ai/trees/enemyBehavior.js";
import { SkillController } from "../skills/SkillSystem.js";

// Reusable static buffer for boid separation queries
const boidBuffer = [];

export class Enemy {
  constructor({ x, y, type, difficulty }) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = type.radius;
    this.maxHp = Math.round(type.hp * difficulty.hp);
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
    this.bossTimer = 3.6;
    this.chargeTarget = null;
    this.shotTimer = 1.5 + Math.random();
    this.shotReady = false;
    this.puddleTimer = 2;
    this.fuse = undefined;
    this.exploded = false;
    this.hitFlash = 0;
    this.spawnTime = type.boss ? 1.6 : type.id === 'onion' ? .9 : 0;
    this.slowFactor = 1;
    this.speedMultiplier = 1;
    this.volleyTimer = 4.4;
    this.phaseTwo = false;
    this.phaseThree = false;
    this.specialTimer = 3.2;
    this.summonTimer = 7.5;
    this.roleTimer = type.role === 'healer' ? 2.2 : type.role === 'summoner' ? 4 : 0;
    this.flockAngle = Math.random() * Math.PI * 2;
    this.flockTimer = Math.random() * 2;

    // AI & Skills architecture
    this.skills = new SkillController(this);
    this.blackboard = {};
    if (this.isBoss) {
      this.behaviorTree = createBossBehaviorTree();
    }
  }

  update(delta, player, state) {
    this.hitFlash = Math.max(0, this.hitFlash - delta);
    this.spawnTime = Math.max(0, this.spawnTime - delta);
    if (this.spawnTime > 0 || this.hp <= 0) return;
    if (this.isBoss) {
      // Fase 2 al 65% de vida
      if (!this.phaseTwo && this.hp <= this.maxHp * 0.65) {
        this.phaseTwo = true;
        this.speed *= 1.14;
        this.volleyTimer = Math.min(this.volleyTimer, 1.0);
        if (state) {
          state.directorNotice = `${this.type.name.toUpperCase()} / FASE 2`;
          state.shake = Math.max(state.shake, 0.35);
          state.rings?.push({ x: this.x, y: this.y, radius: this.radius + 75, life: 0.7, maxLife: 0.7, color: '#ff4f9a' });
          state.audio?.play('bossPhase');
        }
      }
      // Fase 3 (FURIA MAXIMA) al 30% de vida
      if (!this.phaseThree && this.hp <= this.maxHp * 0.30) {
        this.phaseThree = true;
        this.speed *= 1.18;
        this.armor = (this.armor || 1) * 1.25;
        this.volleyTimer = 0.5;
        this.specialTimer = 0.6;
        if (state) {
          state.directorNotice = `¡${this.type.name.toUpperCase()} EN FURIA TOTAL!`;
          state.shake = Math.max(state.shake, 0.48);
          state.rings?.push({ x: this.x, y: this.y, radius: this.radius + 110, life: 0.85, maxLife: 0.85, color: '#ff0044' });
          state.rings?.push({ x: this.x, y: this.y, radius: this.radius + 65, life: 0.6, maxLife: 0.6, color: '#ffd700' });
          state.audio?.play('bossPhase');
        }
      }

      if (this.type.bossStyle === 'ranged') {
        const dx = player.x - this.x, dy = player.y - this.y, length = Math.hypot(dx, dy) || 1;
        const approach = length < 185 ? -0.5 : length > 280 ? 1 : 0;
        this.x += (dx / length * approach - dy / length * 0.5) * this.speed * delta;
        this.y += (dy / length * approach + dx / length * 0.5) * this.speed * delta;
      } else this.updateBoss(delta, player);

      const worldW = state?.world?.width || 960;
      const worldH = state?.world?.height || 540;
      this.x = Math.max(this.radius + 8, Math.min(worldW - 8 - this.radius, this.x));
      this.y = Math.max(115 + this.radius, Math.min(worldH - 25 - this.radius, this.y));

      this.volleyTimer -= delta * (this.phaseThree ? 1.35 : 1);
      this.specialTimer -= delta * (this.phaseThree ? 1.3 : 1);
      this.summonTimer -= delta;

      if (this.volleyTimer <= 0 && state) {
        state.rings?.push({ x: this.x, y: this.y, radius: this.radius + 38, life: 0.45, maxLife: 0.45, color: this.phaseThree ? '#ff0055' : '#ff879e' });
        this.volleyTimer = this.type.bossStyle === 'ranged' ? (this.phaseTwo ? 1.95 : 2.6) :
                           this.type.bossStyle === 'heavy' ? (this.phaseTwo ? 2.6 : 3.5) :
                           this.type.bossStyle === 'frost' ? (this.phaseTwo ? 2.2 : 3.0) :
                           this.phaseTwo ? 3.1 : 4.4;
        const baseCount = this.type.bossStyle === 'ranged' ? 14 :
                          this.type.bossStyle === 'heavy' ? 18 :
                          this.type.bossStyle === 'frost' ? 12 : 10;
        const count = this.phaseThree ? baseCount + 6 : baseCount;
        const bulletSpeed = (this.type.bossStyle === 'heavy' ? 115 : this.type.bossStyle === 'frost' ? 135 : 150) * (this.phaseThree ? 1.2 : 1);
        const bulletColor = this.phaseThree ? '#ff2255' : this.type.bossStyle === 'frost' ? '#a855f7' : this.type.bossStyle === 'heavy' ? '#ffaa00' : undefined;
        for (let i = 0; i < count; i++) {
          const angle = i * Math.PI * 2 / count + state.time * 0.45;
          state.enemyProjectiles.push({
            x: this.x, y: this.y,
            vx: Math.cos(angle) * bulletSpeed, vy: Math.sin(angle) * bulletSpeed,
            radius: this.phaseThree ? 7 : 6,
            damage: this.damage * 0.45,
            life: 4.2,
            color: bulletColor
          });
        }
      }

      if (this.phaseTwo && state && this.specialTimer <= 0) {
        const kind = this.type.bossStyle === 'ranged' ? 'snipe' :
                     this.type.bossStyle === 'fast' ? 'rain' :
                     this.type.bossStyle === 'frost' ? 'freeze' :
                     this.type.bossStyle === 'heavy' ? 'meteor' : 'shockwave';
        this.specialTimer = kind === 'snipe' ? 3.2 : kind === 'rain' ? 2.8 : kind === 'freeze' ? 3.0 : 4.2;
        const zonesCount = this.phaseThree ? 2 : 1;
        state.audio?.play('telegraph');
        for (let z = 0; z < zonesCount; z++) {
          const offsetX = z === 0 ? 0 : (Math.random() - 0.5) * 160;
          const offsetY = z === 0 ? 0 : (Math.random() - 0.5) * 160;
          state.bossZones.push({
            kind,
            x: this.x, y: this.y,
            targetX: player.x + offsetX, targetY: player.y + offsetY,
            radius: kind === 'shockwave' ? 145 : kind === 'meteor' ? 88 : kind === 'freeze' ? 120 : 44,
            delay: kind === 'snipe' ? 0.75 : kind === 'meteor' ? 1.0 : 0.85,
            life: kind === 'shockwave' ? 1.15 : 1.25,
            damage: this.damage * (kind === 'snipe' ? 0.65 : kind === 'meteor' ? 1.2 : 0.75),
            triggered: false
          });
        }
      }

      // Invocación de escoltas de élite durante Duelo de Jefes o en Fase 2+
      if (state && this.summonTimer <= 0 && (state.modeId === 'rush' || this.phaseTwo) && state.enemies.length < 35) {
        this.summonTimer = this.phaseThree ? 5.5 : 8.0;
        const escortPool = enemyTypes.filter(t => !t.boss && (t.id === 'fries' || t.id === 'soda' || t.id === 'ketchup'));
        const escortType = escortPool[Math.floor(Math.random() * escortPool.length)];
        for (const side of [-1, 1]) {
          const escort = new Enemy({
            x: Math.max(60, Math.min(worldW - 60, this.x + side * 62)),
            y: Math.max(130, Math.min(worldH - 40, this.y + 24)),
            type: escortType,
            difficulty: state.difficulty
          });
          escort.spawnTime = 0.6;
          state.enemies.push(escort);
        }
        state.rings?.push({ x: this.x, y: this.y, radius: 75, life: 0.5, maxLife: 0.5, color: '#ffae00' });
      }
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const length = Math.hypot(dx, dy) || 1;
    const supportRange = this.role === 'healer' ? 185 : this.role === 'summoner' ? 230 : 0;
    const approach = this.type.id === 'ketchup' ? (length < 155 ? -.65 : length > 245 ? 1 : 0) : supportRange ? (length < supportRange - 35 ? -.55 : length > supportRange + 45 ? 1 : 0) : this.fuse !== undefined ? .35 : 1;

    // Vector de persecución base
    let moveX = (dx / length) * approach;
    let moveY = (dy / length) * approach;

    // Flanqueo / Rodeado dinámico
    this.flockTimer -= delta;
    if (this.flockTimer <= 0) {
      this.flockTimer = 1.2 + Math.random() * 1.5;
      this.flockAngle = (Math.random() - 0.5) * 1.2;
    }
    if (length > 80 && length < 380 && this.fuse === undefined) {
      const tangentX = -dy / length;
      const tangentY = dx / length;
      moveX += tangentX * Math.sin(this.flockAngle) * 0.42;
      moveY += tangentY * Math.sin(this.flockAngle) * 0.42;
    }

    // Separación entre enemigos cercanos
    if (state) {
      let sepX = 0, sepY = 0, neighbors = 0;
      const minDistance = this.radius * 2.2;
      const candidates = state.spatialGrid
        ? state.spatialGrid.queryRadius(this.x, this.y, minDistance, boidBuffer)
        : (state.enemies || []);
      const candLen = candidates.length;

      for (let i = 0; i < candLen; i++) {
        const other = candidates[i];
        if (other === this || other.hp <= 0) continue;
        const distSq = (this.x - other.x) * (this.x - other.x) + (this.y - other.y) * (this.y - other.y);
        if (distSq < minDistance * minDistance && distSq > 0.01) {
          const d = Math.sqrt(distSq);
          const push = (minDistance - d) / minDistance;
          sepX += ((this.x - other.x) / d) * push;
          sepY += ((this.y - other.y) / d) * push;
          neighbors++;
          if (neighbors > 6) break;
        }
      }
      if (neighbors > 0) {
        moveX += sepX * 0.75;
        moveY += sepY * 0.75;
      }
    }

    const moveMag = Math.hypot(moveX, moveY) || 1;
    const finalSpeed = this.speed * (this.speedMultiplier || 1) * this.slowFactor;
    this.x += (moveX / moveMag) * finalSpeed * delta;
    this.y += (moveY / moveMag) * finalSpeed * delta;

    const worldW = state?.world?.width || 1920;
    const worldH = state?.world?.height || 1080;
    if (state?.decoy) {
      if (this.x < -80 || this.x > worldW + 80 || this.y < -80 || this.y > worldH + 80) {
        this.hp = 0;
        if (state.player) state.player.kills = (state.player.kills || 0) + 1;
        state.floaters?.push({ x: this.x, y: this.y, text: '¡BURLADO!', life: 0.8, color: '#38bdf8', scale: 1 });
      }
    } else {
      this.x = Math.max(this.radius + 6, Math.min(worldW - this.radius - 6, this.x));
      this.y = Math.max(120 + this.radius, Math.min(worldH - this.radius - 20, this.y));
    }
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
    if (this.role === 'healer') {
      this.roleTimer -= delta;
      if (this.roleTimer <= 0) {
        this.roleTimer = 3.4;
        let healed = false;
        for (const ally of state.enemies) {
          if (ally !== this && ally.hp > 0 && ally.hp < ally.maxHp && Math.hypot(ally.x - this.x, ally.y - this.y) < 175) {
            ally.hp = Math.min(ally.maxHp, ally.hp + Math.max(8, ally.maxHp * .13));
            healed = true;
          }
        }
        if (healed) {
          state.rings?.push({ x: this.x, y: this.y, radius: 175, life: .6, maxLife: .6, color: '#72ffa8' });
          state.floaters?.push({ x: this.x, y: this.y - 30, text: '+ CURA', life: .8, color: '#72ffa8', scale: 1.1 });
        }
      }
    }
    if (this.role === 'summoner') {
      this.roleTimer -= delta;
      if (this.roleTimer <= 0 && state.enemies.length < 58) {
        this.roleTimer = 6.2;
        const minionType = enemyTypes.find(type => !type.boss && type.id === 'fries');
        for (const side of [-1, 1]) {
          const minion = new Enemy({ x: this.x + side * 38, y: this.y + 18, type: minionType, difficulty: state.difficulty });
          minion.spawnTime = .65;
          state.enemies.push(minion);
        }
        state.rings?.push({ x: this.x, y: this.y, radius: 64, life: .65, maxLife: .65, color: '#c58cff' });
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
        this.bossTimer = this.phaseThree ? 0.95 : 0.82;
      }
      return;
    }
    if (this.bossPhase === 'charge') {
      const chargeMult = this.phaseThree ? 3.55 : 3.15;
      this.x += this.chargeVelocity.x * this.speed * chargeMult * delta;
      this.y += this.chargeVelocity.y * this.speed * chargeMult * delta;
      if (this.bossTimer <= 0) {
        this.bossPhase = 'recover';
        this.bossTimer = this.phaseThree ? 0.9 : 1.35;
      }
      return;
    }
    if (this.bossPhase === 'recover' && this.bossTimer <= 0) {
      this.bossPhase = 'stalk';
      this.bossTimer = this.phaseThree ? 2.4 : 3.5;
    }
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const length = Math.hypot(dx, dy) || 1;
    const speed = this.bossPhase === 'recover' ? this.speed * 0.48 : this.speed;
    this.x += (dx / length) * speed * delta;
    this.y += (dy / length) * speed * delta;
    if (this.bossPhase === 'stalk' && this.bossTimer <= 0) {
      this.bossPhase = 'telegraph';
      this.bossTimer = this.type.bossStyle === 'fast' ? .6 : .85;
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

    if (this.phaseTwo) {
      const pulse = .55 + Math.sin(performance.now() / 90) * .25;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = this.phaseThree ? '#ff0044' : '#ff4f9a';
      ctx.lineWidth = this.phaseThree ? 4 : 3;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 13, 0, Math.PI * 2);
      ctx.stroke();
      if (this.phaseThree) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 20, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    drawFood(ctx, this.type.id, this.x, this.y, this.radius / 23, performance.now() / 1000, true, this.hitFlash > 0);

    if (this.role) {
      ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 13px monospace'; ctx.lineWidth = 3; ctx.strokeStyle = '#102126';
      const symbol = this.role === 'shield' ? '◆' : this.role === 'healer' ? '+' : '✦';
      ctx.fillStyle = this.role === 'shield' ? '#8be6ff' : this.role === 'healer' ? '#72ffa8' : '#cf91ff';
      ctx.strokeText(symbol, this.x, this.y - this.radius - 14); ctx.fillText(symbol, this.x, this.y - this.radius - 14);
      if (this.role === 'shield') { ctx.globalAlpha = .72; ctx.strokeStyle = '#8be6ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 7, -1.1, 1.1); ctx.stroke(); }
      ctx.restore();
    }

    if (this.isBoss) {
      ctx.save();
      ctx.fillStyle = this.phaseThree ? '#ff2255' : '#ffd33d';
      ctx.strokeStyle = '#523521'; ctx.lineWidth = 3;
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
      const bossLabel = this.bossRank ? `#${this.bossRank} ${this.type.name.toUpperCase()}` : this.type.name.toUpperCase();
      ctx.strokeText(bossLabel, this.x, this.y - this.radius * 1.48);
      ctx.fillText(bossLabel, this.x, this.y - this.radius * 1.48);
      ctx.restore();
    }

    const isStrong = this.maxHp >= 40 || this.isBoss;
    if (this.hp >= this.maxHp && !isStrong) return;

    const barWidth = this.isBoss ? this.radius * 2.6 : this.radius * 2.1;
    const barHeight = this.isBoss ? 10 : 5;
    const barY = this.y - this.radius - (this.isBoss ? 12 : 9);
    const hpRatio = Math.max(0, this.hp / this.maxHp);

    ctx.fillStyle = '#0d1f24'; ctx.fillRect(this.x - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);
    ctx.fillStyle = '#10272b'; ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

    const typeColor = this.isBoss
      ? (hpRatio < 0.3 ? '#ff0044' : hpRatio < 0.65 ? '#ffaa00' : '#f47779')
      : (this.type.color || '#3bd671');

    ctx.fillStyle = typeColor;
    ctx.fillRect(this.x - barWidth / 2, barY, hpRatio * barWidth, barHeight);

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
  { id: "double", name: "Rey del mostrador", hp: 820, speed: 58, damage: 24, score: 650, xp: 48, radius: 48, color: "#ffd33d", boss: true },
  { id: "ketchup", name: "Senor Ketchup", hp: 960, speed: 78, damage: 25, score: 850, xp: 60, radius: 42, color: "#ff6e76", boss: true, bossStyle: 'ranged' },
  { id: "fries", name: "La Papota Suprema", hp: 1120, speed: 80, damage: 28, score: 1050, xp: 75, radius: 46, color: "#ffdd61", boss: true, bossStyle: 'fast' },
  { id: "pizza", name: "Don Muzza el Padrino", hp: 1350, speed: 60, damage: 32, score: 1350, xp: 90, radius: 52, color: "#e63946", boss: true, bossStyle: 'heavy' },
  { id: "icecream", name: "Emperador Subcero", hp: 1080, speed: 66, damage: 24, score: 1200, xp: 82, radius: 44, color: "#a855f7", boss: true, bossStyle: 'frost' },
];
