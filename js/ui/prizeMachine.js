import { currentAccount, mutate, equip, grantItem } from '../systems/accountSystem.js';
import { shopItems, isOwned } from '../data/shop.js';
import { drawFood } from '../core/art.js';
import { drawAccessory, drawAccessoryIcon, drawPet } from '../core/presentation.js';

export class PrizeMachine {
  constructor(game) {
    this.game = game;
    this.cost = 150;
    this.state = 'IDLE'; // IDLE | COIN | CRANK | VORTEX | DROP | SHAKE | REVEAL
    this.animTime = 0;
    this.stateTime = 0;
    this.currentPrize = null;
    this.isJackpot = false;
    this.rafId = null;

    // Elements (guarded for non-DOM / test environments)
    const doc = typeof document !== 'undefined' ? document : null;
    this.screen = doc?.querySelector('#prizeScreen');
    this.canvas = doc?.querySelector('#prizeCanvas');
    this.ctx = this.canvas?.getContext ? this.canvas.getContext('2d') : null;
    this.bankEl = doc?.querySelector('#prizeBank');
    this.pullBtn = doc?.querySelector('#prizePullBtn');
    this.noticeEl = doc?.querySelector('#prizeNotice');
    this.backBtn = doc?.querySelector('#prizeBackButton');
    this.revealCard = doc?.querySelector('#prizeRevealCard') || { hidden: true };
    this.revealParticles = doc?.querySelector('#prizeRevealParticles');
    this.rarityPill = doc?.querySelector('#prizeRarityPill');
    this.itemNameEl = doc?.querySelector('#prizeItemName');
    this.itemTypeEl = doc?.querySelector('#prizeItemType');
    this.itemCanvas = doc?.querySelector('#prizeItemCanvas');
    this.itemDescEl = doc?.querySelector('#prizeItemDesc');
    this.equipBtn = doc?.querySelector('#prizeEquipBtn');
    this.nextBtn = doc?.querySelector('#prizeNextBtn');

    // Physics capsules inside glass dome
    this.globe = { x: 280, y: 175, r: 105 };
    this.capsules = this.initCapsules(10);
    this.droppedCapsule = null;
    this.particles = [];
    this.crankAngle = 0;
    this.coin = { active: false, t: 0 };
    this.slotFlash = 0;
    this.screenFlash = 0;
    this.shake = 0;

    this.bindEvents();
  }

  initCapsules(count) {
    const colors = [
      ['#ef4444', '#fecaca'], // Red
      ['#3b82f6', '#bfdbfe'], // Blue
      ['#10b981', '#a7f3d0'], // Green
      ['#f59e0b', '#fef3c7'], // Gold
      ['#a855f7', '#f3e8ff'], // Purple
      ['#ec4899', '#fbcfe8'], // Pink
      ['#06b6d4', '#cffafe'], // Cyan
    ];
    const list = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = Math.random() * (this.globe.r - 28);
      const [colTop, colBot] = colors[i % colors.length];
      list.push({
        x: this.globe.x + Math.cos(angle) * dist,
        y: this.globe.y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        r: 16,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.05,
        topColor: colTop,
        botColor: colBot
      });
    }
    return list;
  }

  bindEvents() {
    this.backBtn?.addEventListener('click', () => {
      this.game.audio?.play('navigate');
      this.hide();
    });

    this.pullBtn?.addEventListener('click', () => {
      this.pull();
    });

    this.nextBtn?.addEventListener('click', () => {
      this.game.audio?.play('navigate');
      this.revealCard.hidden = true;
      this.currentPrize = null;
      this.droppedCapsule = null;
      this.state = 'IDLE';
      this.updateUI();
      this.pullBtn?.focus?.();
    });

    this.equipBtn?.addEventListener('click', () => {
      if (!this.currentPrize || this.isJackpot) return;
      try {
        equip(this.currentPrize.type, this.currentPrize.id);
        this.game.audio?.play('confirm');
        this.equipBtn.textContent = '¡EQUIPADO!';
        this.equipBtn.disabled = true;
      } catch (err) {
        console.warn('Equip error:', err);
      }
    });

    // Close on Escape
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.game.screenId === 'prizeScreen') {
          this.hide();
        }
      });
    }
  }

  show() {
    this.game.showScreen('prizeScreen');
    if (this.currentPrize && this.state !== 'IDLE') {
      this.state = 'REVEAL';
      this.showRevealCard();
    } else {
      this.revealCard.hidden = true;
      this.state = 'IDLE';
      this.particles = [];
      this.droppedCapsule = null;
    }
    this.updateUI();

    if (!this.rafId) {
      let lastT = performance.now();
      const loop = (t) => {
        const dt = Math.min((t - lastT) / 1000, 0.05);
        lastT = t;
        if (this.game.screenId === 'prizeScreen') {
          this.update(dt, t / 1000);
          this.render(t / 1000);
          this.rafId = requestAnimationFrame(loop);
        } else {
          this.rafId = null;
        }
      };
      this.rafId = requestAnimationFrame(loop);
    }
  }

  hide() {
    this.game.showScreen('lobbyScreen');
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  updateUI() {
    const account = currentAccount();
    const bank = account ? account.bank : 0;
    if (this.bankEl) this.bankEl.textContent = bank;

    if (this.pullBtn) {
      const canAfford = bank >= this.cost;
      const isBusy = this.state !== 'IDLE';
      this.pullBtn.disabled = !canAfford || isBusy;
    }

    if (this.noticeEl) {
      if (!account) {
        this.noticeEl.textContent = 'Iniciá sesión para jugar.';
      } else if (account.bank < this.cost && this.state === 'IDLE') {
        this.noticeEl.textContent = `Necesitás ${this.cost} PT (tenés ${bank} PT).`;
      } else {
        this.noticeEl.textContent = '';
      }
    }
  }

  pull() {
    if (this.state !== 'IDLE') return;
    const account = currentAccount();
    if (!account) return;
    if (account.bank < this.cost) {
      this.game.audio?.play('damage');
      if (this.noticeEl) this.noticeEl.textContent = '¡Puntos insuficientes!';
      return;
    }

    // Determine prize
    const prizeResult = this.pickPrize(account);
    this.currentPrize = prizeResult.item;
    this.isJackpot = prizeResult.isJackpot;

    // Deduct cost and grant reward
    try {
      mutate(p => {
        p.bank -= this.cost;
        if (this.isJackpot) {
          p.bank += 300; // Jackpot bonus net
        } else if (this.currentPrize) {
          const key = `${this.currentPrize.type}:${this.currentPrize.id}`;
          if (!p.purchases.includes(key)) p.purchases.push(key);
        }
        return p;
      });
    } catch (e) {
      console.warn('Prize mutation failed:', e);
      this.currentPrize = null;
      if (this.noticeEl) this.noticeEl.textContent = 'No se pudo guardar la tirada. Probá otra vez.';
      return;
    }

    // Start Animation Sequence
    this.state = 'COIN';
    this.stateTime = 0;
    this.coin = { active: true, t: 0 };
    this.slotFlash = 0;
    this.screenFlash = 0;
    this.shake = 0;
    this.particles = [];
    this.revealCard.hidden = true;
    this.updateUI();
    this.game.audio?.play('purchase');
  }

  pickPrize(account) {
    // Collect unowned items from shop
    const unownedSkins = shopItems.filter(it => it.type === 'skin' && !isOwned(account, 'skin', it.id));
    const unownedAccs = shopItems.filter(it => it.type === 'accessory' && !isOwned(account, 'accessory', it.id));
    const unownedPets = shopItems.filter(it => it.type === 'pet' && !isOwned(account, 'pet', it.id));

    const totalUnowned = [...unownedSkins, ...unownedAccs, ...unownedPets];

    if (totalUnowned.length === 0) {
      // Jackpot!
      return {
        isJackpot: true,
        item: {
          id: 'jackpot',
          type: 'special',
          name: '¡BOTE DE ORO!',
          rarity: 'legendary',
          description: '¡Tenés la colección completa! Ganaste un super premio de 300 PUNTOS.',
          cost: 300
        }
      };
    }

    // Weighted roll: 55% normal/common, 35% rare, 10% legendary
    const roll = Math.random();
    let targetTier = 'common';
    if (roll < 0.10) targetTier = 'legendary';
    else if (roll < 0.45) targetTier = 'rare';

    let pool = totalUnowned.filter(it => {
      if (targetTier === 'legendary') return it.domiExclusive || it.id.startsWith('leg_') || it.cost >= 1200;
      if (targetTier === 'rare') return it.cartographyExclusive || it.type === 'pet' || (it.cost >= 600 && it.cost < 1200);
      return !it.domiExclusive && !it.cartographyExclusive && !it.id.startsWith('leg_') && it.cost < 600;
    });

    if (pool.length === 0) pool = totalUnowned;
    const selected = pool[Math.floor(Math.random() * pool.length)];

    let rarity = 'common';
    if (selected.domiExclusive || selected.id.startsWith('leg_') || selected.cost >= 1200) {
      rarity = 'legendary';
    } else if (selected.cartographyExclusive || selected.type === 'pet' || selected.cost >= 600) {
      rarity = 'rare';
    }

    return {
      isJackpot: false,
      item: { ...selected, rarity }
    };
  }

  update(dt, t) {
    this.animTime += dt;
    this.stateTime += dt;
    this.slotFlash = Math.max(0, this.slotFlash - dt * 2.8);
    this.screenFlash = Math.max(0, this.screenFlash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 12);

    // --- State Machine ---
    if (this.state === 'COIN') {
      this.coin.t += dt * 1.55;
      if (this.coin.t >= 1) {
        this.coin.active = false;
        this.slotFlash = 1;
        this.shake = 3;
        this.spawnBurst(392, 340, 20, ['#fff7c3', '#ffe17a', '#fb923c'], 130);
        this.state = 'CRANK';
        this.stateTime = 0;
        this.game.audio?.play('door_bell');
      }
    } else if (this.state === 'CRANK') {
      this.crankAngle += dt * Math.PI * 4;
      if (this.stateTime >= 0.55) {
        this.state = 'VORTEX';
        this.stateTime = 0;
        this.shake = 2;
        this.game.audio?.play('telegraph');
      }
    } else if (this.state === 'VORTEX') {
      // Violent churning
      if (this.stateTime >= 1.4) {
        this.state = 'DROP';
        this.stateTime = 0;
        const color = this.currentPrize?.rarity === 'legendary' ? '#facc15' : (this.currentPrize?.rarity === 'rare' ? '#c084fc' : '#38bdf8');
        this.droppedCapsule = {
          x: 280,
          y: 325,
          vx: 0,
          vy: 50,
          color: color,
          botColor: '#ffffff',
          r: 18,
          rot: 0,
          bounceCount: 0
        };
        this.game.audio?.play('pickup');
        this.spawnBurst(280, 334, 16, [color, '#fff7c3', '#f472b6'], 110);
      }
    } else if (this.state === 'DROP') {
      if (this.droppedCapsule) {
        this.droppedCapsule.vy += 700 * dt;
        this.droppedCapsule.y += this.droppedCapsule.vy * dt;
        const groundY = 415;
        if (this.droppedCapsule.y >= groundY) {
          this.droppedCapsule.y = groundY;
          this.droppedCapsule.vy = -this.droppedCapsule.vy * 0.45;
          this.droppedCapsule.bounceCount++;
          this.shake = this.droppedCapsule.bounceCount >= 3 ? 5 : 2;
          this.spawnBurst(280, groundY, 10, [this.droppedCapsule.color, '#fff7c3'], 90);
          if (this.droppedCapsule.bounceCount >= 3) {
            this.state = 'SHAKE';
            this.stateTime = 0;
            this.game.audio?.play('crit');
          }
        }
      }
    } else if (this.state === 'SHAKE') {
      this.shake = Math.max(this.shake, 2 + 4 * Math.min(1, this.stateTime / 0.8));
      if (this.stateTime >= 0.8) {
        this.state = 'REVEAL';
        this.stateTime = 0;
        this.spawnConfetti();
        this.screenFlash = 0.75;
        this.shake = 8;
        this.game.audio?.play('victory');
        this.showRevealCard();
      }
    }

    // --- Physics of Capsules in Dome ---
    const isVortex = this.state === 'VORTEX';
    for (const c of this.capsules) {
      if (isVortex) {
        // Tangential vortex force
        const dx = c.x - this.globe.x;
        const dy = c.y - this.globe.y;
        c.vx += -dy * 18 * dt + (Math.random() - 0.5) * 120 * dt;
        c.vy += dx * 18 * dt + (Math.random() - 0.5) * 120 * dt;
        c.vrot = (Math.random() - 0.5) * 0.3;
      } else {
        // Gentle gravity & float
        c.vy += 80 * dt;
        c.vx += (Math.random() - 0.5) * 20 * dt;
        c.vx *= 0.98;
        c.vy *= 0.98;
      }

      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vx = Math.max(-360, Math.min(360, c.vx));
      c.vy = Math.max(-360, Math.min(360, c.vy));
      c.rot += c.vrot * dt * 60;

      // Collide with spherical globe boundary
      const dist = Math.hypot(c.x - this.globe.x, c.y - this.globe.y);
      const maxDist = this.globe.r - c.r;
      if (dist > maxDist) {
        const nx = (c.x - this.globe.x) / dist;
        const ny = (c.y - this.globe.y) / dist;
        c.x = this.globe.x + nx * maxDist;
        c.y = this.globe.y + ny * maxDist;
        const dot = c.vx * nx + c.vy * ny;
        c.vx = (c.vx - 2 * dot * nx) * 0.75;
        c.vy = (c.vy - 2 * dot * ny) * 0.75;
      }
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < this.capsules.length; i++) {
        for (let j = i + 1; j < this.capsules.length; j++) {
          const a = this.capsules[i], b = this.capsules[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          const gap = a.r + b.r + 2;
          if (dist >= gap) continue;
          const angle = (i * 13 + j * 7) * 2.4;
          const nx = dist > 0.01 ? dx / dist : Math.cos(angle);
          const ny = dist > 0.01 ? dy / dist : Math.sin(angle);
          const push = (gap - dist) * 0.5;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;
          const impact = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (impact < 0) {
            a.vx += impact * nx * 0.28; a.vy += impact * ny * 0.28;
            b.vx -= impact * nx * 0.28; b.vy -= impact * ny * 0.28;
          }
        }
      }
      for (const capsule of this.capsules) {
        const dx = capsule.x - this.globe.x, dy = capsule.y - this.globe.y;
        const dist = Math.hypot(dx, dy);
        const limit = this.globe.r - capsule.r;
        if (dist > limit) {
          capsule.x = this.globe.x + dx / dist * limit;
          capsule.y = this.globe.y + dy / dist * limit;
        }
      }
    }

    // Sparks and confetti share one bounded particle system.
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const drag = Math.pow(0.94, dt * 60);
      p.vx *= drag;
      p.vy = p.vy * drag + p.gravity * dt;
      p.life -= dt;
      p.rot += p.vrot * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnBurst(x, y, count, colors, speed) {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 2 * i / count + (Math.random() - 0.5) * 0.25;
      const velocity = speed * (0.45 + Math.random() * 0.75);
      const life = 0.35 + Math.random() * 0.45;
      this.particles.push({
        x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity,
        gravity: 150, size: 2 + Math.random() * 3,
        color: colors[i % colors.length], life, maxLife: life,
        rot: 0, vrot: 0, kind: 'spark'
      });
    }
    if (this.particles.length > 160) this.particles.splice(0, this.particles.length - 160);
  }

  spawnConfetti() {
    const colors = ['#ffe17a', '#f472b6', '#7ce5ff', '#d7a4ff', '#82e8ae', '#fff7c3', '#facc15', '#ec4899', '#38bdf8', '#c084fc'];
    this.spawnBurst(280, 405, 80, colors, 480);
    for (let i = 0; i < 110; i++) {
      const angle = (Math.PI * 2 * i / 110) + (Math.random() - 0.5) * 0.4;
      const speed = 100 + Math.random() * 340;
      const life = 1.4 + Math.random() * 1.6;
      this.particles.push({
        x: 280 + (Math.random() - 0.5) * 40,
        y: 400 + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 160,
        gravity: 240,
        size: 3 + Math.random() * 6,
        color: colors[i % colors.length],
        life, maxLife: life,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 14,
        kind: 'confetti'
      });
    }
  }

  showRevealCard() {
    if (!this.currentPrize) return;
    this.revealCard.hidden = false;

    const machineFrame = this.canvas?.closest('.prize-canvas-container');
    machineFrame?.classList.remove('prize-machine-zoom');
    if (machineFrame && !this.game.reducedMotion) {
      void machineFrame.offsetWidth;
      machineFrame.classList.add('prize-machine-zoom');
    }

    // Rarity Pill
    const rarities = {
      common: { text: '★ COMÚN', bg: '#38bdf8', color: '#000' },
      rare: { text: '★★ RARO', bg: '#c084fc', color: '#000' },
      legendary: { text: '★★★ LEGENDARIO', bg: '#facc15', color: '#000' }
    };
    const rMeta = rarities[this.currentPrize.rarity] || rarities.common;
    if (this.revealCard.dataset) this.revealCard.dataset.rarity = this.currentPrize.rarity;
    if (this.rarityPill) {
      this.rarityPill.textContent = rMeta.text;
      this.rarityPill.style.background = rMeta.bg;
      this.rarityPill.style.color = rMeta.color;
    }

    if (this.itemNameEl) this.itemNameEl.textContent = this.currentPrize.name;
    if (this.itemTypeEl) this.itemTypeEl.textContent = this.isJackpot ? 'BOTE DE PUNTOS' : ({ skin: 'PERSONAJE', accessory: 'ACCESORIO', pet: 'MASCOTA' }[this.currentPrize.type] || 'COLECCIONABLE');
    if (this.itemDescEl) this.itemDescEl.textContent = this.currentPrize.description || '¡Nuevo coleccionable listo para usar!';

    if (this.equipBtn) {
      if (this.isJackpot) {
        this.equipBtn.hidden = true;
      } else {
        this.equipBtn.hidden = false;
        this.equipBtn.disabled = false;
        this.equipBtn.textContent = '✓ EQUIPAR AHORA';
      }
    }

    // Render Preview in item canvas
    this.renderItemCanvas();
    this.spawnRevealParticles();
    (this.isJackpot ? this.nextBtn : this.equipBtn)?.focus?.();
  }

  spawnRevealParticles() {
    if (!this.revealParticles || this.game.reducedMotion) return;
    this.revealParticles.replaceChildren();
    const colors = ['#ffe17a', '#7ce5ff', '#f472b6', '#82e8ae', '#fff6c8'];
    const count = 72;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('i');
      const angle = i * Math.PI * 2 / count + (Math.random() - 0.5) * 0.09;
      const distance = 220 + Math.random() * 430;
      particle.style.setProperty('--dx', `${Math.round(Math.cos(angle) * distance)}px`);
      particle.style.setProperty('--dy', `${Math.round(Math.sin(angle) * distance)}px`);
      particle.style.setProperty('--rot', `${(i % 7 - 3) * 45}deg`);
      particle.style.setProperty('--delay', `${Math.floor(Math.random() * 110)}ms`);
      particle.style.setProperty('--size', `${5 + Math.floor(Math.random() * 8)}px`);
      particle.style.background = colors[i % colors.length];
      particle.style.color = colors[i % colors.length];
      this.revealParticles.append(particle);
    }
  }

  renderItemCanvas() {
    if (!this.itemCanvas || !this.currentPrize) return;
    const ctx = this.itemCanvas.getContext('2d');
    const w = this.itemCanvas.width, h = this.itemCanvas.height;
    ctx.clearRect(0, 0, w, h);

    if (this.isJackpot) {
      this.drawCoin(ctx, w / 2 - 11, h / 2 + 9, 1.5, 0);
      this.drawCoin(ctx, w / 2 + 10, h / 2 - 9, 1.65, 0);
      return;
    }

    const { type, id } = this.currentPrize;
    if (type === 'skin') {
      drawFood(ctx, id, w / 2, h * 0.54, 1.4, 0);
    } else if (type === 'accessory') {
      drawAccessoryIcon(ctx, id, w / 2, h / 2, Math.min(w, h) * 0.85);
    } else if (type === 'pet') {
      drawPet(ctx, id, w / 2, h * 0.58, 1.3, 0);
    }
  }

  render(t) {
    if (!this.ctx) return;
    const c = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    c.clearRect(0, 0, W, H);
    c.imageSmoothingEnabled = false;
    this.drawStage(c, t);
    const motion = this.game.reducedMotion ? 0 : this.shake;
    c.save();
    c.translate(Math.round(Math.sin(t * 111) * motion), Math.round(Math.cos(t * 137) * motion * 0.65));

    // --- 1. ARCADE CABINET BODY ---
    c.fillStyle = 'rgba(0, 0, 0, 0.55)';
    c.fillRect(93, 455, 384, 13);
    c.fillRect(112, 448, 346, 13);
    c.fillStyle = '#070b13';
    c.fillRect(102, 278, 356, 166);
    c.fillStyle = '#5a2348';
    c.fillRect(110, 282, 340, 152);
    c.fillStyle = '#f472b6';
    c.fillRect(110, 282, 340, 7);
    c.fillRect(110, 424, 340, 8);
    c.fillStyle = '#a93a65';
    c.fillRect(119, 291, 322, 128);
    c.fillStyle = '#6c284f';
    c.fillRect(119, 394, 322, 25);
    c.fillStyle = '#ffadd2';
    c.fillRect(122, 295, 6, 96);
    c.fillStyle = '#351b38';
    c.fillRect(126, 434, 308, 18);
    c.fillStyle = '#e681b4';
    c.fillRect(126, 434, 308, 4);
    c.fillStyle = '#091320';
    c.fillRect(210, 286, 140, 34);
    c.fillStyle = '#7ce5dc';
    c.fillRect(215, 291, 130, 24);
    c.fillStyle = '#0d2633';
    c.font = '8px "Press Start 2P", monospace';
    c.textAlign = 'center';
    c.fillText('PANCHOMATICA', 280, 307);

    // Prize chute, recessed behind a bright pixel rim.
    c.fillStyle = '#07101c';
    c.fillRect(222, 374, 116, 57);
    c.fillStyle = '#ffd875';
    c.fillRect(226, 378, 108, 5);
    c.fillRect(226, 425, 108, 5);
    c.fillRect(226, 378, 5, 52);
    c.fillRect(329, 378, 5, 52);
    c.fillStyle = '#321934';
    c.fillRect(233, 386, 94, 36);
    c.fillStyle = `rgba(255, 134, 200, ${0.2 + 0.14 * Math.sin(t * 5)})`;
    c.fillRect(237, 390, 86, 28);
    c.fillStyle = '#090e18';
    c.fillRect(243, 396, 74, 20);

    // Coin receiver and mechanical lever.
    c.fillStyle = '#09111b';
    c.fillRect(367, 309, 50, 68);
    c.fillStyle = '#ffd875';
    c.fillRect(371, 313, 42, 5);
    c.fillRect(371, 369, 42, 4);
    c.fillStyle = this.slotFlash > 0 ? '#fff5ca' : '#283f50';
    c.fillRect(375, 321, 34, 42);
    c.fillStyle = this.slotFlash > 0 ? '#ffe17a' : '#07101b';
    c.fillRect(389, 326, 6, 28);
    c.fillStyle = '#ffe17a';
    c.font = '7px "Press Start 2P", monospace';
    c.fillText('150 PT', 392, 304);
    c.fillStyle = '#09111b';
    c.fillRect(133, 319, 68, 68);
    c.fillStyle = '#ffd875';
    c.fillRect(138, 324, 58, 58);
    c.fillStyle = '#29485a';
    c.fillRect(144, 330, 46, 46);
    c.fillStyle = '#91ecdf';
    c.fillRect(150, 336, 34, 34);
    c.save();
    c.translate(167, 353);
    c.rotate(this.crankAngle);
    c.fillStyle = '#101924';
    c.fillRect(-5, -6, 44, 16);
    c.fillStyle = '#dcecf3';
    c.fillRect(-3, -4, 38, 10);
    c.fillStyle = '#f472b6';
    c.fillRect(30, -9, 18, 20);
    c.fillStyle = '#ffc3dd';
    c.fillRect(32, -7, 12, 5);
    c.restore();
    c.fillStyle = '#ffe17a';
    c.fillRect(145, 391, 44, 4);
    c.fillStyle = '#111724';
    c.font = '7px "Press Start 2P", monospace';
    c.fillText('GIRA', 167, 407);

    // A short arc and afterimages make the payment readable even at speed.
    if (this.coin.active) {
      for (let i = 3; i >= 0; i--) {
        const progress = Math.max(0, this.coin.t - i * 0.045);
        const x = 60 + 332 * progress;
        const y = 390 - 54 * progress - Math.sin(progress * Math.PI) * 86;
        this.drawCoin(c, x, y, 0.5 + progress * 0.5, t * 18 - i * 0.9, i === 0 ? 1 : (0.25 - i * 0.045));
      }
    }

    // --- 2. GLASS DOME & CAPSULES ---
    this.fillPixelDisk(c, 280, 175, 116, 4, '#0a111e');
    this.fillPixelDisk(c, 280, 175, 110, 4, '#ffd875');
    this.fillPixelDisk(c, 280, 175, 103, 4, '#263f5d');
    this.fillPixelDisk(c, 280, 175, 97, 4, '#142c43');
    c.fillStyle = '#355676';
    for (let i = 0; i < 12; i++) c.fillRect(201 + i * 13, 124 + (i % 3) * 34, 6, 4);
    c.fillStyle = '#1d344a';
    c.fillRect(274, 137, 12, 82);
    c.fillStyle = '#7ce5dc';
    c.fillRect(278, 145, 4, 65);
    const paddleRot = this.state === 'VORTEX' ? t * 24 : t * 2;
    c.save();
    c.translate(this.globe.x, this.globe.y);
    c.rotate(paddleRot);
    c.fillStyle = '#07131f';
    c.fillRect(-50, -7, 100, 14);
    c.fillStyle = '#ffe17a';
    c.fillRect(-46, -3, 92, 6);
    c.restore();

    // Draw Capsules Inside
    for (const cap of this.capsules) {
      this.drawCapsule(c, cap.x, cap.y, cap.r, cap.rot, cap.topColor, cap.botColor);
    }

    // Pixel-glass reflections and a rotating chase of lamps.
    c.fillStyle = 'rgba(230, 255, 255, 0.22)';
    c.fillRect(215, 109, 30, 7);
    c.fillRect(207, 116, 14, 24);
    c.fillRect(217, 143, 6, 13);
    c.fillRect(328, 96, 16, 5);
    c.fillRect(342, 103, 8, 11);
    for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12;
      c.fillStyle = (Math.floor(t * 12) + i) % 4 === 0 ? '#fff8d0' : '#f472b6';
      c.fillRect(Math.round(280 + Math.cos(a) * 107) - 3, Math.round(175 + Math.sin(a) * 107) - 3, 6, 6);
    }
    if (this.state === 'VORTEX') {
      c.fillStyle = `rgba(124, 229, 220, ${0.14 + 0.12 * Math.sin(t * 20)})`;
      c.fillRect(230, 172, 100, 7);
      c.fillRect(275, 128, 8, 92);
    }

    // --- 3. TOP MARQUEE (PANCHOMÁTICA) ---
    c.fillStyle = '#070e18';
    c.fillRect(149, 13, 262, 58);
    c.fillStyle = '#f472b6';
    c.fillRect(155, 19, 250, 46);
    c.fillStyle = '#512144';
    c.fillRect(161, 25, 238, 34);
    c.fillStyle = '#0d1726';
    c.fillRect(168, 30, 224, 24);
    c.fillStyle = '#fff4c4';
    c.font = '12px "Press Start 2P", monospace';
    c.textAlign = 'center';
    c.fillText('PREMIOS', 280, 48);
    for (let i = 0; i < 13; i++) {
      c.fillStyle = (Math.floor(t * 10) + i) % 3 === 0 ? '#fff8d0' : '#ffba53';
      c.fillRect(158 + i * 20, 19, 8, 5);
      c.fillRect(158 + i * 20, 60, 8, 5);
    }

    // --- 4. DROPPED / SHAKING / REVEALING CAPSULE ---
    if (this.droppedCapsule) {
      let capX = this.droppedCapsule.x;
      let capY = this.droppedCapsule.y;

      if (this.state === 'SHAKE') {
        if (!this.game.reducedMotion) {
          capX += (Math.random() - 0.5) * 6;
          capY += (Math.random() - 0.5) * 4;
        }

        const auraColor = this.currentPrize?.rarity === 'legendary' ? 'rgba(255, 225, 122, 0.5)' : (this.currentPrize?.rarity === 'rare' ? 'rgba(215, 164, 255, 0.5)' : 'rgba(124, 229, 255, 0.5)');
        this.fillPixelDisk(c, capX, capY, 28 + Math.sin(t * 20) * 4, 4, auraColor);
      }

      if (this.state !== 'REVEAL') {
        this.drawCapsule(c, capX, capY, this.droppedCapsule.r, this.droppedCapsule.rot, this.droppedCapsule.color, this.droppedCapsule.botColor);
      } else {
        // Exploded Capsule halves
        const popOffset = Math.min(this.stateTime * 110, 46);
        this.drawCapsuleHalf(c, capX - popOffset, capY - popOffset * 0.4, this.droppedCapsule.r, -0.4, this.droppedCapsule.color, true);
        this.drawCapsuleHalf(c, capX + popOffset, capY + popOffset * 0.4, this.droppedCapsule.r, 0.4, this.droppedCapsule.botColor, false);
      }
    }

    // --- 5. CONFETTI PARTICLES ---
    for (const p of this.particles) {
      c.save();
      c.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      if (p.kind === 'spark') {
        c.globalCompositeOperation = 'lighter';
        c.shadowColor = p.color;
        c.shadowBlur = 9;
      }
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillStyle = p.color;
      const size = Math.max(1, Math.round(p.size * Math.min(1, p.life / p.maxLife * 2)));
      c.fillRect(-size, -size, size * 2, p.kind === 'spark' ? size * 2 : size);
      c.restore();
    }
    c.restore();
    if (this.screenFlash > 0 && !this.game.reducedMotion) {
      c.fillStyle = `rgba(255, 246, 210, ${this.screenFlash * 0.7})`;
      c.fillRect(0, 0, W, H);
    }
  }

  drawStage(c, t) {
    c.fillStyle = '#0b1420';
    c.fillRect(0, 0, 560, 480);
    for (let y = 0; y < 400; y += 28) {
      for (let x = 0; x < 560; x += 28) {
        c.fillStyle = ((x / 28 + y / 28) % 2) ? '#101e2c' : '#132436';
        c.fillRect(x + 1, y + 1, 26, 26);
        c.fillStyle = '#24394c';
        c.fillRect(x + 3, y + 3, 4, 2);
      }
    }
    c.fillStyle = '#263a50';
    c.fillRect(0, 396, 560, 9);
    c.fillStyle = '#7ce5dc';
    c.fillRect(0, 396, 560, 3);
    c.fillStyle = '#0a111c';
    c.fillRect(0, 405, 560, 75);
    for (let x = 0; x < 560; x += 32) {
      c.fillStyle = x % 64 ? '#142334' : '#192a3c';
      c.fillRect(x, 409, 30, 68);
      c.fillStyle = '#31465b';
      c.fillRect(x + 2, 413, 26, 3);
    }
    for (const x of [18, 534]) {
      c.fillStyle = '#07101b';
      c.fillRect(x, 24, 8, 350);
      c.fillStyle = '#f472b6';
      c.fillRect(x + 2, 32, 4, 335);
      c.fillStyle = '#fff2bb';
      c.fillRect(x - 3, 23, 18, 8);
      c.fillRect(x - 3, 368, 18, 8);
    }
    c.fillStyle = '#ffe17a';
    c.font = '8px "Press Start 2P", monospace';
    c.textAlign = 'center';
    c.fillText('ARCADE', 85, 453);
    c.fillText('CLUB', 484, 453);
    c.fillStyle = (Math.floor(t * 2) % 2) ? '#7ce5dc' : '#ffe17a';
    c.fillRect(46, 58, 8, 8);
    c.fillRect(506, 58, 8, 8);
  }

  fillPixelDisk(c, cx, cy, radius, step, color) {
    c.fillStyle = color;
    for (let y = -radius; y < radius; y += step) {
      const half = Math.floor(Math.sqrt(Math.max(0, radius * radius - y * y)) / step) * step;
      c.fillRect(Math.round(cx - half), Math.round(cy + y), Math.max(step, half * 2), step);
    }
  }

  drawCoin(c, x, y, scale, phase, alpha = 1) {
    c.save();
    c.globalAlpha = Math.max(0, alpha);
    c.translate(Math.round(x), Math.round(y));
    c.scale(Math.max(0.18, Math.abs(Math.cos(phase))) * scale, scale);
    c.fillStyle = '#49230e';
    c.fillRect(-10, -17, 20, 34);
    c.fillRect(-14, -13, 28, 26);
    c.fillStyle = '#ffb633';
    c.fillRect(-8, -15, 16, 30);
    c.fillRect(-12, -11, 24, 22);
    c.fillStyle = '#fff1a1';
    c.fillRect(-7, -11, 13, 3);
    c.fillRect(-9, -8, 3, 15);
    c.fillStyle = '#c7771e';
    c.fillRect(-2, -9, 5, 18);
    c.fillRect(-6, -6, 13, 4);
    c.fillRect(-6, 2, 13, 4);
    c.restore();
  }

  drawCapsule(c, x, y, r, rot, topCol, botCol) {
    c.save();
    c.translate(Math.round(x), Math.round(y));
    c.rotate(rot);
    c.fillStyle = '#07111f';
    c.fillRect(-r + 5, -r, r * 2 - 10, r * 2);
    c.fillRect(-r, -r + 5, r * 2, r * 2 - 10);
    c.fillStyle = botCol;
    c.fillRect(-r + 3, 2, r * 2 - 6, r - 5);
    c.fillRect(-r + 6, r - 4, r * 2 - 12, 2);
    c.fillStyle = topCol;
    c.fillRect(-r + 3, -r + 5, r * 2 - 6, r - 7);
    c.fillRect(-r + 6, -r + 2, r * 2 - 12, 2);
    c.fillStyle = '#091522';
    c.fillRect(-r + 1, -2, r * 2 - 2, 5);
    c.fillStyle = '#fff4d2';
    c.fillRect(-3, -4, 6, 8);
    c.fillStyle = 'rgba(255, 255, 255, 0.6)';
    c.fillRect(-r + 6, -r + 6, 5, 8);
    c.restore();
  }

  drawCapsuleHalf(c, x, y, r, rot, color, isTop) {
    c.save();
    c.translate(Math.round(x), Math.round(y));
    c.rotate(rot);
    c.fillStyle = color;
    if (isTop) {
      c.fillRect(-r + 4, -r + 4, r * 2 - 8, r - 4);
      c.fillRect(-r + 7, -r, r * 2 - 14, 5);
    } else {
      c.fillRect(-r + 4, 0, r * 2 - 8, r - 4);
      c.fillRect(-r + 7, r - 5, r * 2 - 14, 5);
    }
    c.fillStyle = '#091522';
    c.fillRect(-r + 4, isTop ? 0 : -3, r * 2 - 8, 4);
    c.restore();
  }
}
