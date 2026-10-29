import { drawFood } from "../core/art.js";
import { createBossBehaviorTree } from "../ai/trees/enemyBehavior.js";
import { SkillController } from "../skills/SkillSystem.js";
import { Item } from "./Item.js";
import { items, rarities } from "../data/items.js";

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
    this.summonTimer = BOSS_SUMMON.firstDelay;
    this.roleTimer = type.role === 'healer' ? 2.2 : type.role === 'summoner' ? 4 : 0;
    this.flockAngle = Math.random() * Math.PI * 2;
    this.flockTimer = Math.random() * 2;
    // Kamikaze: busca -> se arma (tiembla y marca la línea) -> embiste y explota
    this.kamikazeState = 'seek';
    this.kamikazeTimer = 0;
    this.chargeDir = null;

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
    if (this.type.kamikaze) { this.updateKamikaze(delta, player, state); return; }
    if (this.isBoss) {
      // Fase 2 al 65% de vida
      if (!this.phaseTwo && this.hp <= this.maxHp * 0.65) {
        this.phaseTwo = true;
        this.speed *= this.type.bossStyle === 'colossus' ? 1.25 : 1.14;
        this.armor = (this.armor || 1) * (this.type.bossStyle === 'colossus' ? 1.35 : 1);
        this.volleyTimer = Math.min(this.volleyTimer, 1.0);
        if (state) {
          state.directorNotice = this.type.bossStyle === 'colossus' ? '¡DOMI COLOSAL / FASE 2: FURIA FUNDIDA!' : `${this.type.name.toUpperCase()} / ¡SE PONE SERIO!`;
          state.shake = Math.max(state.shake, 0.35);
          state.rings?.push({ x: this.x, y: this.y, radius: this.radius + 75, life: 0.7, maxLife: 0.7, color: '#ff4f9a' });
          state.audio?.play('bossPhase');
          if (this.type.bossStyle === 'colossus' && state.items) {
            state.items.push(new Item({ type: items.mayo, rarity: rarities[3], x: Math.max(80, this.x - 75), y: Math.max(140, this.y + 45) }));
            state.items.push(new Item({ type: items.mayo, rarity: rarities[3], x: Math.min((state.world?.width || 1920) - 80, this.x + 75), y: Math.max(140, this.y - 45) }));
            state.floaters?.push({ x: this.x, y: this.y - 55, text: '¡SUMINISTRO TÁCTICO!', color: '#ffd700', life: 1.6, scale: 1.3 });
          }
        }
      }
      // Fase 3 (FURIA MAXIMA) al 30% de vida
      if (!this.phaseThree && this.hp <= this.maxHp * 0.30) {
        this.phaseThree = true;
        this.speed *= this.type.bossStyle === 'colossus' ? 1.28 : 1.18;
        this.armor = (this.armor || 1) * (this.type.bossStyle === 'colossus' ? 1.45 : 1.25);
        this.volleyTimer = 0.45;
        this.specialTimer = 0.5;
        if (state) {
          state.directorNotice = this.type.bossStyle === 'colossus' ? '¡DOMI COLOSAL / FASE 3: FURIA TOTAL!' : `¡${this.type.name.toUpperCase()} AL LÍMITE!`;
          state.shake = Math.max(state.shake, 0.48);
          state.rings?.push({ x: this.x, y: this.y, radius: this.radius + 110, life: 0.85, maxLife: 0.85, color: '#ff0044' });
          state.rings?.push({ x: this.x, y: this.y, radius: this.radius + 65, life: 0.6, maxLife: 0.6, color: '#ffd700' });
          state.audio?.play('bossPhase');
          if (this.type.bossStyle === 'colossus' && state.items) {
            state.items.push(new Item({ type: items.mayo, rarity: rarities[4] || rarities[3], x: Math.max(90, this.x - 90), y: this.y }));
            state.items.push(new Item({ type: items.mayo, rarity: rarities[4] || rarities[3], x: Math.min((state.world?.width || 1920) - 90, this.x + 90), y: this.y }));
            state.items.push(new Item({ type: items.mayo, rarity: rarities[3], x: this.x, y: Math.min((state.world?.height || 1080) - 60, this.y + 70) }));
            state.floaters?.push({ x: this.x, y: this.y - 65, text: '¡SOBRECARGA TÁCTICA!', color: '#ff4400', life: 1.8, scale: 1.4 });
          }
        }
      }

      const moveDelta = delta * (this.rageAttack?.move ?? 1);
      if (this.type.bossStyle === 'ranged') {
        const dx = player.x - this.x, dy = player.y - this.y, length = Math.hypot(dx, dy) || 1;
        const approach = length < 185 ? -0.5 : length > 280 ? 1 : 0;
        this.x += (dx / length * approach - dy / length * 0.5) * this.speed * moveDelta;
        this.y += (dy / length * approach + dx / length * 0.5) * this.speed * moveDelta;
      } else this.updateBoss(moveDelta, player, state);

      const worldW = state?.world?.width || 1920;
      const worldH = state?.world?.height || 1080;
      this.x = Math.max(this.radius + 8, Math.min(worldW - 8 - this.radius, this.x));
      this.y = Math.max(115 + this.radius, Math.min(worldH - 25 - this.radius, this.y));

      this.volleyTimer -= delta * (this.phaseThree ? 1.35 : 1);
      this.specialTimer -= delta * (this.phaseThree ? 1.3 : 1);
      this.summonTimer -= delta;

      if (this.enraged && state) this.updateRageAttack(delta, player, state);

      // Pisotón tectónico y Anillos de Fuego expansivos para Domi Colosal
      if (this.type.bossStyle === 'colossus') {
        this.stompTimer = (this.stompTimer ?? 1.6) - delta;
        if (this.stompTimer <= 0 && state) {
          this.stompTimer = this.phaseThree ? 0.95 : this.phaseTwo ? 1.35 : 1.85;
          state.shake = Math.max(state.shake, 0.32);
          state.rings?.push({ x: this.x, y: this.y, radius: this.radius + 80, life: 0.55, maxLife: 0.55, color: '#ff3300' });
          state.audio?.play('telegraph');

          // Generar Anillo de Fuego Expansivo que obliga a esquivar con Dash en Fase 2+
          if (this.phaseTwo) {
            state.bossFireRings = state.bossFireRings || [];
            state.bossFireRings.push({
              x: this.x,
              y: this.y,
              radius: this.radius + 15,
              maxRadius: 460,
              speed: this.phaseThree ? 260 : 210,
              damage: this.damage * 0.85,
              hitPlayer: false,
              color: this.phaseThree ? '#ff1100' : '#ff6600'
            });
          }
          // Lanza abanico denso de proyectiles de roca magmática de alto daño directo al jugador
          const dx = player.x - this.x, dy = player.y - this.y;
          const baseAngle = Math.atan2(dy, dx);
          const spreads = this.phaseThree
            ? [-0.48, -0.32, -0.16, 0, 0.16, 0.32, 0.48]
            : this.phaseTwo
              ? [-0.36, -0.18, 0, 0.18, 0.36]
              : [-0.28, -0.14, 0, 0.14, 0.28];
          for (const off of spreads) {
            const a = baseAngle + off;
            state.enemyProjectiles.push({
              x: this.x, y: this.y,
              vx: Math.cos(a) * 285, vy: Math.sin(a) * 285,
              radius: 10,
              damage: this.damage * 0.75,
              life: 3.8,
              color: '#ff5500'
            });
          }
        }
      }

      if (this.volleyTimer <= 0 && state && !this.rageAttack) {
        state.rings?.push({ x: this.x, y: this.y, radius: this.radius + 38, life: 0.45, maxLife: 0.45, color: this.phaseThree ? '#ff0055' : '#ff879e' });
        this.volleyTimer = this.type.bossStyle === 'colossus' ? (this.phaseThree ? 0.75 : this.phaseTwo ? 1.15 : 1.55) : (this.enraged ? BOSS_RAGE.volleyInterval : 1) * (this.type.bossStyle === 'ranged' ? (this.phaseTwo ? 1.95 : 2.6) :
                           this.type.bossStyle === 'heavy' ? (this.phaseTwo ? 2.6 : 3.5) :
                           this.type.bossStyle === 'frost' ? (this.phaseTwo ? 2.2 : 3.0) :
                           this.phaseTwo ? 3.1 : 4.4);
        const isColossus = this.type.bossStyle === 'colossus';
        const baseCount = isColossus ? 24 : this.type.bossStyle === 'ranged' ? 14 :
                          this.type.bossStyle === 'heavy' ? 18 :
                          this.type.bossStyle === 'frost' ? 12 : 10;
        const count = (this.phaseThree ? baseCount + (isColossus ? 8 : 6) : baseCount) + (this.enraged ? 6 : 0);
        const bulletSpeed = (isColossus ? 175 : this.type.bossStyle === 'heavy' ? 115 : this.type.bossStyle === 'frost' ? 135 : 150) * (this.phaseThree ? 1.2 : 1);
        const bulletColor = isColossus ? (this.phaseThree ? '#ff1100' : '#ff6600') : this.phaseThree ? '#ff2255' : this.type.bossStyle === 'frost' ? '#a855f7' : this.type.bossStyle === 'heavy' ? '#ffaa00' : undefined;
        for (let i = 0; i < count; i++) {
          const angle = i * Math.PI * 2 / count + state.time * (isColossus ? 0.85 : 0.45);
          state.enemyProjectiles.push({
            x: this.x, y: this.y,
            vx: Math.cos(angle) * bulletSpeed, vy: Math.sin(angle) * bulletSpeed,
            radius: isColossus ? 8 : (this.phaseThree ? 7 : 6),
            damage: this.damage * (isColossus ? 0.65 : 0.45),
            life: 4.2,
            color: bulletColor
          });
        }
      }

      if (this.phaseTwo && state && this.specialTimer <= 0 && !this.enraged) {
        const kind = this.type.bossStyle === 'colossus' ? (this.phaseThree ? 'laser_sweep' : 'meteor') :
                     this.type.bossStyle === 'ranged' ? 'snipe' :
                     this.type.bossStyle === 'fast' ? 'rain' :
                     this.type.bossStyle === 'frost' ? 'freeze' :
                     this.type.bossStyle === 'heavy' ? 'meteor' : 'shockwave';
        this.specialTimer = this.type.bossStyle === 'colossus' ? (this.phaseThree ? 1.5 : 2.2) : kind === 'snipe' ? 3.2 : kind === 'rain' ? 2.8 : kind === 'freeze' ? 3.0 : 4.2;
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
            delay: kind === 'laser_sweep' ? 0.85 : kind === 'snipe' ? 0.75 : kind === 'meteor' ? 1.0 : 0.85,
            life: kind === 'shockwave' ? 1.15 : 1.25,
            damage: this.damage * (kind === 'laser_sweep' ? 1.25 : kind === 'snipe' ? 0.65 : kind === 'meteor' ? 1.6 : 0.75),
            triggered: false
          });
        }
      }

      // Invoca ayudantes de a poco: camadas más seguidas y numerosas a medida que pierde vida
      if (state && this.summonTimer <= 0 && this.type.bossStyle !== 'colossus') {
        const phase = this.phaseThree ? 2 : this.phaseTwo ? 1 : 0;
        this.summonTimer = BOSS_SUMMON.interval[phase] * (this.enraged ? BOSS_RAGE.summonInterval : 1);
        const helpers = state.enemies.reduce((n, e) => n + (!e.isBoss && e.hp > 0 ? 1 : 0), 0);
        const cap = BOSS_SUMMON.maxHelpers[phase] + (this.enraged ? BOSS_RAGE.extraHelpers : 0);
        const count = Math.min(BOSS_SUMMON.batch[phase] + (this.enraged ? 1 : 0), cap - helpers);
        const ids = BOSS_SUMMON.pools[phase];
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const id = ids[Math.floor(Math.random() * ids.length)];
          const type = enemyTypes.find(t => !t.boss && t.id === id);
          const escort = new Enemy({
            x: Math.max(60, Math.min(worldW - 60, this.x + Math.cos(angle) * (this.radius + 40))),
            y: Math.max(130, Math.min(worldH - 40, this.y + Math.sin(angle) * (this.radius + 40))),
            type,
            difficulty: state.difficulty
          });
          escort.spawnTime = 0.6 + i * 0.12;
          state.enemies.push(escort);
        }
        if (count > 0) state.rings?.push({ x: this.x, y: this.y, radius: this.radius + 34, life: 0.5, maxLife: 0.5, color: '#ffae00' });
      }
      return;
    }

    // Clon señuelo: los enemigos que lo detectan lo siguen hasta fuera del mapa y ya no vuelven
    if (!this.isBoss && state) {
      if (state.decoy) {
        this.decoyChaser = true;
        const dv = Math.hypot(state.decoy.vx, state.decoy.vy) || 1;
        this.decoyExit = { x: state.decoy.vx / dv, y: state.decoy.vy / dv };
      } else if (this.decoyChaser && this.decoyExit) {
        player = { x: this.x + this.decoyExit.x * 1000, y: this.y + this.decoyExit.y * 1000 };
      }
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
    if (state?.decoy || this.decoyChaser) {
      if (this.x < -80 || this.x > worldW + 80 || this.y < -80 || this.y > worldH + 80) {
        this.hp = 0;
        // resolveDeaths contabiliza la baja en state.kills
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

  // Segunda fase: al quedarse sin vida por primera vez el jefe se levanta furioso (no muere)
  enrage(state) {
    this.enraged = true;
    this.hp = Math.round(this.maxHp * BOSS_RAGE.hpRestore);
    this.phaseTwo = true; this.phaseThree = true;
    this.speed *= BOSS_RAGE.speed;
    this.rageSpecialTimer = 2.4; this.rageAttack = null;
    this.damage *= BOSS_RAGE.damage;
    this.radius = Math.round(this.radius * BOSS_RAGE.size);
    this.hitFlash = 0;
    this.bossPhase = 'recover'; this.bossTimer = 1.2;
    this.volleyTimer = 1.4; this.specialTimer = 1.8; this.summonTimer = 1.2;
    if (state) {
      state.enemyProjectiles.length = 0;
      state.bossZones = [];
      state.bossRage = this;
    }
  }

  updateKamikaze(delta, player, state) {
    const worldW = state?.world?.width || 1920, worldH = state?.world?.height || 1080;
    const dx = player.x - this.x, dy = player.y - this.y, length = Math.hypot(dx, dy) || 1;
    if (this.kamikazeState === 'seek') {
      const speed = this.speed * (this.speedMultiplier || 1) * this.slowFactor;
      this.x += dx / length * speed * delta;
      this.y += dy / length * speed * delta;
      if (length < KAMIKAZE.armRange) {
        // Se frena y apunta: la línea roja avisa hacia dónde va a salir disparado
        this.kamikazeState = 'arm';
        this.kamikazeTimer = KAMIKAZE.armTime;
        this.chargeDir = { x: dx / length, y: dy / length };
        state?.audio?.play('telegraph');
      }
    } else if (this.kamikazeState === 'arm') {
      this.kamikazeTimer -= delta;
      if (this.kamikazeTimer <= 0) { this.kamikazeState = 'charge'; this.kamikazeTimer = KAMIKAZE.chargeTime; }
    } else if (this.kamikazeState === 'charge') {
      this.kamikazeTimer -= delta;
      const speed = this.speed * KAMIKAZE.chargeMultiplier * this.slowFactor;
      this.x += this.chargeDir.x * speed * delta;
      this.y += this.chargeDir.y * speed * delta;
      const target = state?.decoy || player;
      const hit = Math.hypot(target.x - this.x, target.y - this.y) < this.radius + (target.radius || 18) + 4;
      const wall = this.x < this.radius + 6 || this.x > worldW - this.radius - 6 || this.y < 120 + this.radius || this.y > worldH - this.radius - 20;
      // Explota al chocar, contra la pared o al terminar la embestida (enemySystem resuelve la explosión)
      if (hit || wall || this.kamikazeTimer <= 0) this.fuse = 0;
    }
    this.x = Math.max(this.radius + 6, Math.min(worldW - this.radius - 6, this.x));
    this.y = Math.max(120 + this.radius, Math.min(worldH - this.radius - 20, this.y));
  }

  updateBoss(delta, player, state) {
    this.bossTimer -= delta;

    // Estado ATURDIDO si chocó contra los bordes de la arena
    if (this.bossPhase === 'stunned') {
      if (this.bossTimer <= 0) {
        this.bossPhase = 'stalk';
        this.bossTimer = this.phaseThree ? 2.0 : 3.0;
        this.armor = this._originalArmor || (this.type.armor || 1);
      }
      return;
    }

    if (this.bossPhase === 'telegraph') {
      if (this.bossTimer <= 0) {
        const angle = Math.atan2(this.chargeTarget.y - this.y, this.chargeTarget.x - this.x);
        this.chargeVelocity = { x: Math.cos(angle), y: Math.sin(angle) };
        this.bossPhase = 'charge';
        this.bossTimer = this.enraged ? 0.7 : this.type.bossStyle === 'colossus' ? (this.phaseThree ? 1.25 : 1.1) : this.phaseThree ? 0.95 : 0.82;
      }
      return;
    }
    if (this.bossPhase === 'charge') {
      const isColossus = this.type.bossStyle === 'colossus';
      const chargeMult = this.enraged ? BOSS_RAGE.chargeMultiplier : this.type.bossStyle === 'colossus' ? (this.phaseThree ? 4.1 : 3.65) : this.phaseThree ? 3.55 : 3.15;
      this.x += this.chargeVelocity.x * this.speed * chargeMult * delta;
      this.y += this.chargeVelocity.y * this.speed * chargeMult * delta;

      // Colisión con bordes del mapa para aturdir al coloso
      const worldW = state?.world?.width || 1920;
      const worldH = state?.world?.height || 1080;
      const hitWall = isColossus && (
        this.x <= this.radius + 16 ||
        this.x >= worldW - 16 - this.radius ||
        this.y <= 122 + this.radius ||
        this.y >= worldH - 30 - this.radius
      );

      if (hitWall) {
        this.bossPhase = 'stunned';
        this.bossTimer = 2.4; // 2.4s de aturdimiento
        this._originalArmor = this.armor;
        this.armor = 0.5; // Doble de daño recibido durante aturdimiento
        if (state) {
          state.shake = 0.68;
          state.audio?.play('boss');
          state.rings?.push({ x: this.x, y: this.y, radius: 170, life: 0.85, maxLife: 0.85, color: '#ffd700' });
          state.rings?.push({ x: this.x, y: this.y, radius: 100, life: 0.55, maxLife: 0.55, color: '#ffffff' });
          state.floaters?.push({ x: this.x, y: this.y - 48, text: '¡ESTRELLADO! ¡ATURDIDO! (DAÑO x2)', color: '#ffd700', life: 2.2, scale: 1.35 });
          if (state.items) {
            state.items.push(new Item({ type: items.mayo, rarity: rarities[3], x: this.x, y: this.y }));
          }
        }
        return;
      }

      if (this.bossTimer <= 0) {
        if (this.enraged && state) {
          // Al frenar en seco suelta un anillo de balas
          for (let i = 0; i < 10; i++) shootBossBullet(state, this, i / 10 * Math.PI * 2 + state.time, 170, '#ffd33d', 6);
          state.rings?.push({ x: this.x, y: this.y, radius: this.radius + 30, life: 0.4, maxLife: 0.4, color: '#ffd33d' });
        }
        if (this.enraged && this.chainLeft > 0) {
          // Embestida encadenada: vuelve a apuntar enseguida
          this.chainLeft -= 1;
          this.bossPhase = 'telegraph';
          this.bossTimer = 0.42;
          this.chargeTarget = { x: player.x, y: player.y };
          return;
        }
        this.bossPhase = 'recover';
        this.bossTimer = this.enraged ? 1.0 : this.phaseThree ? 0.9 : 1.35;
      }
      return;
    }
    if (this.bossPhase === 'recover' && this.bossTimer <= 0) {
      this.bossPhase = 'stalk';
      this.bossTimer = this.enraged ? 1.9 : this.phaseThree ? 2.4 : 3.5;
    }
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const length = Math.hypot(dx, dy) || 1;
    const speed = this.bossPhase === 'recover' ? this.speed * 0.48 : this.speed;
    this.x += (dx / length) * speed * delta;
    this.y += (dy / length) * speed * delta;
    if (this.bossPhase === 'stalk' && this.bossTimer <= 0) {
      this.bossPhase = 'telegraph';
      this.bossTimer = this.enraged ? 0.5 : this.type.bossStyle === 'colossus' ? 1.05 : this.type.bossStyle === 'fast' ? .6 : .85;
      this.chargeTarget = { x: player.x, y: player.y };
      // Segunda fase: el Rey encadena 3 embestidas, el resto 2
      this.chainLeft = this.enraged ? (this.type.bossStyle ? 1 : 2) : 0;
      if (this.enraged && !this.type.bossStyle && state) announceRageAttack(state, this, '¡TRIPLE EMBESTIDA!');
    }
  }

  // Ataque exclusivo de segunda fase: se anuncia, tiene aviso y reemplaza al especial de la fase 1
  updateRageAttack(delta, player, state) {
    const attack = RAGE_ATTACKS[this.type.bossStyle || 'default'];
    if (!attack) return;
    if (this.rageAttack) {
      this.rageAttack.t += delta;
      attack.tick?.(this, this.rageAttack, delta, player, state);
      if (this.rageAttack.t >= attack.duration) this.rageAttack = null;
      return;
    }
    this.rageSpecialTimer = (this.rageSpecialTimer ?? 2.4) - delta;
    if (this.rageSpecialTimer > 0) return;
    this.rageSpecialTimer = attack.cooldown;
    this.rageAttack = { t: 0, emit: 0, angle: Math.random() * Math.PI * 2, move: attack.move ?? 1 };
    attack.start?.(this, this.rageAttack, player, state);
    announceRageAttack(state, this, attack.name);
  }

  // Venita de enojo (estilo historieta) que late sobre la cabeza del jefe mordido
  drawAngerMark(ctx) {
    const now = performance.now() / 1000;
    const p = Math.max(2, Math.round(this.radius / 12)) + (Math.sin(now * 9) > 0 ? 1 : 0); // píxel que late
    const x = Math.round(this.x + this.radius * 0.72), y = Math.round(this.y - this.radius * 0.7);
    // Cuatro esquinas en L (el clásico símbolo de enojo), con borde oscuro
    const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    for (const [color, grow] of [['#1a0006', 1], ['#ff2a44', 0]]) {
      ctx.fillStyle = color;
      for (const [dx, dy] of corners) {
        const cx = x + dx * p * 1.5, cy = y + dy * p * 1.5;
        ctx.fillRect(cx - (dx < 0 ? p * 2 : 0) - grow, cy - p / 2 - grow, p * 2 + grow * 2, p + grow * 2);
        ctx.fillRect(cx - p / 2 - grow, cy - (dy < 0 ? p * 2 : 0) - grow, p + grow * 2, p * 2 + grow * 2);
      }
    }
  }

  drawRageAura(ctx) {
    const now = performance.now() / 1000;
    ctx.save();
    ctx.globalAlpha = 0.28 + Math.sin(now * 8) * 0.08;
    ctx.fillStyle = '#ff2a44';
    ctx.beginPath(); ctx.ellipse(this.x, this.y + this.radius * 0.8, this.radius * 1.35, this.radius * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 + now * 1.4;
      const rise = (now * 2.2 + i * 0.37) % 1;
      const size = 6 - rise * 4;
      ctx.fillStyle = rise < 0.4 ? '#ffd34f' : rise < 0.75 ? '#ff6b35' : '#ff2a44';
      ctx.fillRect(Math.round(this.x + Math.cos(a) * this.radius * 1.05 - size / 2), Math.round(this.y + Math.sin(a) * this.radius * 0.5 - rise * this.radius * 0.9), size, size);
    }
    ctx.restore();
  }

  drawKamikazeTelegraph(ctx) {
    if (this.kamikazeState === 'arm' && this.chargeDir) {
      const progress = 1 - this.kamikazeTimer / KAMIKAZE.armTime;
      const reach = this.speed * KAMIKAZE.chargeMultiplier * KAMIKAZE.chargeTime;
      ctx.save();
      ctx.globalAlpha = 0.35 + progress * 0.5;
      ctx.strokeStyle = '#ff3b1f'; ctx.lineWidth = 3; ctx.setLineDash([10, 7]);
      ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + this.chargeDir.x * reach, this.y + this.chargeDir.y * reach); ctx.stroke();
      ctx.setLineDash([]);
      // Anillo que se cierra: cuando llega al ají, sale disparado
      ctx.strokeStyle = '#ffd34f'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 6 + (1 - progress) * 26, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    } else if (this.kamikazeState === 'charge' && this.chargeDir) {
      // Estela de fuego pixelada detrás del ají
      ctx.save();
      for (let i = 1; i <= 4; i++) {
        const s = 12 - i * 2;
        ctx.globalAlpha = 0.5 - i * 0.1;
        ctx.fillStyle = i % 2 ? '#ffb02e' : '#ff4b2b';
        ctx.fillRect(this.x - this.chargeDir.x * i * 11 - s / 2, this.y - this.chargeDir.y * i * 11 - s / 2, s, s);
      }
      ctx.restore();
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

    if (this.type.kamikaze) this.drawKamikazeTelegraph(ctx);

    if (this.fuse !== undefined && !this.exploded && !this.type.kamikaze) {
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
    // Segunda fase: aura de llamas rojas pixeladas alrededor del jefe furioso
    if (this.enraged) this.drawRageAura(ctx);

    // Mientras se arma, el ají tiembla y parpadea como una mecha a punto de estallar
    const arming = this.type.kamikaze && this.kamikazeState === 'arm';
    const wobble = arming ? Math.sin(performance.now() / 22) * 2.5 : 0;
    // Fase 2 (o fase 3 del Coloso): el jefe aparece mordido. hideBite lo mantiene entero hasta el mordisco de la animación
    const bitten = this.isBoss && !this.hideBite && (this.enraged || (this.type.bossStyle === 'colossus' && this.phaseThree));
    drawFood(ctx, this.type.id, this.x + wobble, this.y, this.radius / 23, performance.now() / 1000, true, this.hitFlash > 0 || (arming && Math.sin(performance.now() / 45) > 0.4), bitten);
    if (bitten) this.drawAngerMark(ctx);

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

      if (this.bossPhase === 'stunned') {
        ctx.save();
        const stars = 5;
        const t = performance.now() / 180;
        for (let s = 0; s < stars; s++) {
          const a = t + s * Math.PI * 2 / stars;
          const sx = this.x + Math.cos(a) * (this.radius * 0.75);
          const sy = this.y - this.radius - 12 + Math.sin(a) * 12;
          ctx.fillStyle = '#ffd700';
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
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

// Invocaciones del jefe por fase (1 / 2 / 3): cada cuánto, cuántos por camada y tope de ayudantes vivos
export const BOSS_SUMMON = {
  firstDelay: 3,
  interval: [5.2, 3.8, 2.8],
  batch: [3, 3, 4],
  maxHelpers: [10, 16, 24],
  pools: [['fries', 'burger'], ['fries', 'burger', 'soda', 'ketchup'], ['fries', 'burger', 'soda', 'ketchup', 'chili']],
};

// Segunda fase del jefe (al "morir" la primera vez): cuánta vida recupera y cuánto más peligroso se vuelve
export const BOSS_RAGE = { hpRestore: 0.7, chargeMultiplier: 3.9, speed: 1.35, damage: 1.2, size: 1.12, summonInterval: 0.75, extraHelpers: 6, volleyInterval: 0.8 };

function shootBossBullet(state, boss, angle, speed, color, radius = 6, life = 3) {
  state.enemyProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius, damage: boss.damage * 0.42, life, color });
}

function announceRageAttack(state, boss, name) {
  state.floaters?.push({ x: boss.x, y: boss.y - boss.radius - 34, text: name, life: 1.2, kind: 'fire', scale: 1.15 });
  state.rings?.push({ x: boss.x, y: boss.y, radius: boss.radius + 50, life: 0.55, maxLife: 0.55, color: '#ff2a44' });
  state.audio?.play('telegraph');
}

function bossZone(state, boss, kind, x, y, radius, delay, damageFactor) {
  state.bossZones.push({ kind, x: boss.x, y: boss.y, targetX: x, targetY: y, radius, delay, maxDelay: delay, life: delay + 0.45, damage: boss.damage * damageFactor, triggered: false });
}

// Ataques exclusivos de la segunda fase de cada jefe (bossStyle -> ataque)
export const RAGE_ATTACKS = {
  // Rey del mostrador: además de la triple embestida, tres anillos de balas con huecos para esquivar
  default: { name: '¡ONDA REAL!', cooldown: 6.5, duration: 1.1, move: 0.2,
    tick(boss, a, delta, player, state) {
      a.emit -= delta;
      if (a.emit > 0) return;
      a.emit = 0.35;
      const gap = Math.atan2(player.y - boss.y, player.x - boss.x) + (Math.random() - 0.5) * 1.2;
      for (let i = 0; i < 22; i++) {
        const angle = i / 22 * Math.PI * 2;
        const diff = Math.abs(Math.atan2(Math.sin(angle - gap), Math.cos(angle - gap)));
        if (diff > 0.42) shootBossBullet(state, boss, angle, 175, '#ffd33d', 7);
      }
    } },
  // Señor Ketchup: se planta y dispara una espiral giratoria de dos brazos
  ranged: { name: '¡ESPIRAL DE SALSA!', cooldown: 6.5, duration: 2.8, move: 0,
    tick(boss, a, delta, player, state) {
      a.emit -= delta;
      while (a.emit <= 0) {
        a.emit += 0.07;
        a.angle += 0.34;
        shootBossBullet(state, boss, a.angle, 190, '#ff4f6d', 6);
        shootBossBullet(state, boss, a.angle + Math.PI, 190, '#ff4f6d', 6);
      }
    } },
  // La Papota: una línea de impactos de papas que avanza hacia el jugador
  fast: { name: '¡ESTAMPIDA DE PAPAS!', cooldown: 5.5, duration: 1.2, move: 0.3,
    start(boss, a, player, state) {
      const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
      for (let i = 1; i <= 8; i++) {
        const d = i * 72;
        bossZone(state, boss, 'rain', boss.x + Math.cos(angle) * d, boss.y + Math.sin(angle) * d, 50, 0.55 + i * 0.12, 0.7);
      }
    } },
  // Don Muzza: cruz de balas que gira mientras avanza lento
  heavy: { name: '¡PIZZA GIRATORIA!', cooldown: 7, duration: 3, move: 0.35,
    tick(boss, a, delta, player, state) {
      a.emit -= delta;
      while (a.emit <= 0) {
        a.emit += 0.11;
        a.angle += 0.1;
        for (let k = 0; k < 4; k++) shootBossBullet(state, boss, a.angle + k * Math.PI / 2, 170, '#ffb347', 7);
      }
    } },
  // Emperador Subcero: círculo de zonas heladas que se cierra alrededor del jugador
  frost: { name: '¡PRISIÓN DE HIELO!', cooldown: 6.5, duration: 1, move: 0.5,
    start(boss, a, player, state) {
      for (let i = 0; i < 6; i++) {
        const angle = i / 6 * Math.PI * 2;
        bossZone(state, boss, 'freeze', player.x + Math.cos(angle) * 140, player.y + Math.sin(angle) * 140, 62, 1.05, 0.6);
      }
      bossZone(state, boss, 'freeze', player.x, player.y, 58, 1.35, 0.75);
    } },
};

// Ajustes del Ají kamikaze (alcance de aviso, tiempo de armado y embestida)
export const KAMIKAZE = { armRange: 250, armTime: 0.6, chargeTime: 0.8, chargeMultiplier: 3.6, blastRadius: 64 };

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
  { id: "chili", name: "Aji kamikaze", hp: 18, speed: 118, damage: 24, score: 40, xp: 9, radius: 15, color: "#ff4b2b", kamikaze: true },
  // --- Enemigos Nativos Exclusivos de Cartografía ---
  { id: "bill_collector", name: "Cobrador de cuentas", hp: 44, speed: 110, damage: 14, score: 55, xp: 12, radius: 16, color: "#38bdf8", nativeMap: "diner" },
  { id: "frying_pan", name: "Sartén poseída", hp: 68, speed: 58, damage: 16, score: 60, xp: 14, radius: 19, color: "#475569", role: "shield", armor: 1.6, nativeMap: "kitchen" },
  { id: "delivery_kart", name: "Autito de reparto", hp: 75, speed: 95, damage: 18, score: 65, xp: 15, radius: 20, color: "#fbbf24", nativeMap: "parking" },
  { id: "ice_pop", name: "Paleta congelante", hp: 36, speed: 78, damage: 13, score: 48, xp: 11, radius: 15, color: "#67e8f9", nativeMap: "snow" },
  { id: "burrower_chili", name: "Chile excavador", hp: 35, speed: 115, damage: 20, score: 52, xp: 12, radius: 14, color: "#ea580c", nativeMap: "desert" },
  { id: "goalie_bot", name: "Arquero mecánico", hp: 95, speed: 52, damage: 16, score: 70, xp: 16, radius: 22, color: "#3b82f6", nativeMap: "football" },
  { id: "armored_crab", name: "Cangrejo acorazado", hp: 65, speed: 64, damage: 15, score: 62, xp: 13, radius: 18, color: "#ef4444", nativeMap: "beach" },
  { id: "exotic_juice", name: "Zumo exótico", hp: 30, speed: 125, damage: 16, score: 50, xp: 11, radius: 14, color: "#f97316", nativeMap: "beach" },
  { id: "inspector", name: "Inspector Bromatológico", hp: 72, speed: 96, damage: 16, score: 140, xp: 24, radius: 18, color: "#0284c7", role: "inspector", eventOnly: true },
  // --- Jefes ---
  { id: "double", name: "Rey del mostrador", hp: 820, speed: 58, damage: 24, score: 650, xp: 48, radius: 48, color: "#ffd33d", boss: true },
  { id: "ketchup", name: "Senor Ketchup", hp: 960, speed: 78, damage: 25, score: 850, xp: 60, radius: 42, color: "#ff6e76", boss: true, bossStyle: 'ranged' },
  { id: "fries", name: "La Papota Suprema", hp: 1120, speed: 80, damage: 28, score: 1050, xp: 75, radius: 46, color: "#ffdd61", boss: true, bossStyle: 'fast' },
  { id: "pizza", name: "Don Muzza el Padrino", hp: 1350, speed: 60, damage: 32, score: 1350, xp: 90, radius: 52, color: "#e63946", boss: true, bossStyle: 'heavy' },
  { id: "icecream", name: "Emperador Subcero", hp: 1080, speed: 66, damage: 24, score: 1200, xp: 82, radius: 44, color: "#a855f7", boss: true, bossStyle: 'frost' },
  { id: "lava_boss", name: "Domi Colosal", hp: 8800, speed: 64, damage: 32, score: 10000, xp: 500, radius: 80, color: "#ff2200", boss: true, bossStyle: 'colossus', armor: 1.85 },
];
