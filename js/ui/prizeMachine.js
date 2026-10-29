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
    this.rarityPill = doc?.querySelector('#prizeRarityPill');
    this.itemNameEl = doc?.querySelector('#prizeItemName');
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
    this.coin = { active: false, x: 0, y: 0, targetX: 0, targetY: 0, t: 0 };

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
      this.state = 'IDLE';
      this.updateUI();
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
    this.updateUI();
    this.revealCard.hidden = true;
    this.state = 'IDLE';
    this.particles = [];
    this.droppedCapsule = null;
    this.currentPrize = null;

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
      const isBusy = this.state !== 'IDLE' && this.state !== 'REVEAL';
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
    }

    // Refresh UI
    this.updateUI();
    this.revealCard.hidden = true;

    // Start Animation Sequence
    this.state = 'COIN';
    this.stateTime = 0;
    this.coin = {
      active: true,
      x: 480,
      y: 350,
      targetX: 385,
      targetY: 340,
      t: 0
    };
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

    // --- State Machine ---
    if (this.state === 'COIN') {
      this.coin.t += dt * 2.8;
      if (this.coin.t >= 1) {
        this.coin.active = false;
        this.state = 'CRANK';
        this.stateTime = 0;
        this.game.audio?.play('door_bell');
      }
    } else if (this.state === 'CRANK') {
      this.crankAngle += dt * Math.PI * 4;
      if (this.stateTime >= 0.55) {
        this.state = 'VORTEX';
        this.stateTime = 0;
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
          y: 280,
          vx: 0,
          vy: 80,
          color: color,
          botColor: '#ffffff',
          r: 18,
          rot: 0,
          bounceCount: 0
        };
        this.game.audio?.play('pickup');
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
          if (this.droppedCapsule.bounceCount >= 3) {
            this.state = 'SHAKE';
            this.stateTime = 0;
            this.game.audio?.play('crit');
          }
        }
      }
    } else if (this.state === 'SHAKE') {
      if (this.stateTime >= 0.8) {
        this.state = 'REVEAL';
        this.stateTime = 0;
        this.spawnConfetti();
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
      c.rot += c.vrot;

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

    // Update Confetti
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;
      p.life -= dt;
      p.rot += p.vrot;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnConfetti() {
    this.particles = [];
    const colors = ['#facc15', '#ec4899', '#38bdf8', '#c084fc', '#4ade80', '#fb923c'];
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60 + (Math.random() - 0.5) * 0.5;
      const speed = 120 + Math.random() * 260;
      this.particles.push({
        x: 280,
        y: 415,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 150,
        r: 3 + Math.random() * 4,
        color: colors[i % colors.length],
        life: 1.8 + Math.random() * 0.8,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 8
      });
    }
  }

  showRevealCard() {
    if (!this.currentPrize) return;
    this.revealCard.hidden = false;

    // Rarity Pill
    const rarities = {
      common: { text: '★ COMÚN', bg: '#38bdf8', color: '#000' },
      rare: { text: '★★ RARO', bg: '#c084fc', color: '#000' },
      legendary: { text: '★★★ LEGENDARIO', bg: '#facc15', color: '#000' }
    };
    const rMeta = rarities[this.currentPrize.rarity] || rarities.common;
    if (this.rarityPill) {
      this.rarityPill.textContent = rMeta.text;
      this.rarityPill.style.background = rMeta.bg;
      this.rarityPill.style.color = rMeta.color;
    }

    if (this.itemNameEl) this.itemNameEl.textContent = this.currentPrize.name;
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
  }

  renderItemCanvas() {
    if (!this.itemCanvas || !this.currentPrize) return;
    const ctx = this.itemCanvas.getContext('2d');
    const w = this.itemCanvas.width, h = this.itemCanvas.height;
    ctx.clearRect(0, 0, w, h);

    if (this.isJackpot) {
      // Golden coin stack
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ca8a04';
      ctx.font = '900 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', w / 2, h / 2);
      return;
    }

    const { type, id } = this.currentPrize;
    if (type === 'skin') {
      drawFood(ctx, id, w / 2, h * 0.54, 1.4, 0);
    } else if (type === 'accessory') {
      drawAccessoryIcon(ctx, id, 0, 0, w, h);
    } else if (type === 'pet') {
      drawPet(ctx, id, w / 2, h * 0.58, 1.3, 0);
    }
  }

  render(t) {
    if (!this.ctx) return;
    const c = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    c.clearRect(0, 0, W, H);

    // --- 1. ARCADE CABINET BODY ---
    // Shadow
    c.fillStyle = 'rgba(0, 0, 0, 0.5)';
    c.beginPath();
    c.ellipse(280, 460, 190, 16, 0, 0, Math.PI * 2);
    c.fill();

    // Base Pedestal
    c.fillStyle = '#1e112a';
    c.fillRect(150, 420, 260, 40);
    c.fillStyle = '#701a75';
    c.fillRect(156, 424, 248, 4);

    // Chute Opening
    c.fillStyle = '#0a020f';
    c.fillRect(230, 390, 100, 45);
    c.strokeStyle = '#a21caf';
    c.lineWidth = 3;
    c.strokeRect(230, 390, 100, 45);

    // Chute Interior glow
    const chutePulse = Math.sin(t * 6) * 0.2 + 0.5;
    c.fillStyle = `rgba(236, 72, 153, ${chutePulse})`;
    c.fillRect(234, 394, 92, 37);

    // Lower Cabinet Chassis
    c.fillStyle = '#4c0519';
    c.fillRect(140, 290, 280, 130);
    c.fillStyle = '#831843';
    c.fillRect(146, 296, 268, 120);

    // Chrome Trim
    c.fillStyle = '#fbcfe8';
    c.fillRect(140, 288, 280, 4);
    c.fillRect(140, 418, 280, 4);

    // Coin Slot
    c.fillStyle = '#000';
    c.fillRect(380, 325, 8, 28);
    c.fillStyle = '#facc15';
    c.font = '800 7px "Press Start 2P", monospace';
    c.textAlign = 'center';
    c.fillText('150 PT', 384, 318);

    // Crank Base
    c.fillStyle = '#374151';
    c.beginPath();
    c.arc(200, 350, 22, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#9ca3af';
    c.beginPath();
    c.arc(200, 350, 16, 0, Math.PI * 2);
    c.fill();

    // Crank Handle
    c.save();
    c.translate(200, 350);
    c.rotate(this.crankAngle);
    c.fillStyle = '#d1d5db';
    c.fillRect(-6, -6, 42, 12);
    c.fillStyle = '#ef4444';
    c.beginPath();
    c.arc(36, 0, 10, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Flying Coin (during COIN state)
    if (this.coin.active) {
      const curX = this.coin.x + (this.coin.targetX - this.coin.x) * this.coin.t;
      const curY = this.coin.y + (this.coin.targetY - this.coin.y) * this.coin.t - Math.sin(this.coin.t * Math.PI) * 40;
      c.fillStyle = '#facc15';
      c.beginPath();
      c.ellipse(curX, curY, 9, 13, t * 10, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#ca8a04';
      c.lineWidth = 2;
      c.stroke();
    }

    // --- 2. GLASS DOME & CAPSULES ---
    // Dome Back / Depth
    const domeGrad = c.createRadialGradient(this.globe.x - 30, this.globe.y - 30, 10, this.globe.x, this.globe.y, this.globe.r);
    domeGrad.addColorStop(0, '#312e81');
    domeGrad.addColorStop(0.7, '#1e1b4b');
    domeGrad.addColorStop(1, '#0f172a');
    c.fillStyle = domeGrad;
    c.beginPath();
    c.arc(this.globe.x, this.globe.y, this.globe.r, 0, Math.PI * 2);
    c.fill();

    // Internal Spinner Rod
    c.fillStyle = '#475569';
    c.fillRect(this.globe.x - 5, this.globe.y - 30, 10, 60);
    const paddleRot = this.state === 'VORTEX' ? t * 24 : t * 2;
    c.save();
    c.translate(this.globe.x, this.globe.y);
    c.rotate(paddleRot);
    c.fillStyle = '#facc15';
    c.fillRect(-45, -4, 90, 8);
    c.restore();

    // Draw Capsules Inside
    for (const cap of this.capsules) {
      this.drawCapsule(c, cap.x, cap.y, cap.r, cap.rot, cap.topColor, cap.botColor);
    }

    // Glass Reflections & Specular Highlights
    c.save();
    c.beginPath();
    c.arc(this.globe.x, this.globe.y, this.globe.r - 2, 0, Math.PI * 2);
    c.clip();

    // High Gloss Glint Top-Left
    c.fillStyle = 'rgba(255, 255, 255, 0.22)';
    c.beginPath();
    c.ellipse(this.globe.x - 38, this.globe.y - 38, 45, 20, -Math.PI / 4, 0, Math.PI * 2);
    c.fill();

    // Edge Rim Glow
    c.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    c.lineWidth = 4;
    c.stroke();
    c.restore();

    // Dome Metal Ring Trim
    c.strokeStyle = '#f472b6';
    c.lineWidth = 6;
    c.beginPath();
    c.arc(this.globe.x, this.globe.y, this.globe.r, 0, Math.PI * 2);
    c.stroke();

    // --- 3. TOP MARQUEE (PANCHOMÁTICA) ---
    c.fillStyle = '#831843';
    c.fillRect(170, 20, 220, 48);
    c.strokeStyle = '#f472b6';
    c.lineWidth = 4;
    c.strokeRect(170, 20, 220, 48);

    c.fillStyle = '#fdf2f8';
    c.font = '900 13px "Press Start 2P", monospace';
    c.textAlign = 'center';
    c.fillText('★ PREMIOS ★', 280, 50);

    // Chasing Marquee Lights
    for (let i = 0; i < 14; i++) {
      const lit = (Math.floor(t * 8) + i) % 2 === 0;
      c.fillStyle = lit ? '#facc15' : '#701a75';
      c.beginPath();
      c.arc(178 + i * 16, 26, 4, 0, Math.PI * 2);
      c.fill();
      c.arc(178 + i * 16, 62, 4, 0, Math.PI * 2);
      c.fill();
    }

    // --- 4. DROPPED / SHAKING / REVEALING CAPSULE ---
    if (this.droppedCapsule) {
      let capX = this.droppedCapsule.x;
      let capY = this.droppedCapsule.y;

      if (this.state === 'SHAKE') {
        capX += (Math.random() - 0.5) * 6;
        capY += (Math.random() - 0.5) * 4;

        // Aura glow of rarity
        const auraColor = this.currentPrize?.rarity === 'legendary' ? 'rgba(250, 204, 21, 0.7)' : (this.currentPrize?.rarity === 'rare' ? 'rgba(192, 132, 252, 0.7)' : 'rgba(56, 189, 248, 0.7)');
        c.fillStyle = auraColor;
        c.beginPath();
        c.arc(capX, capY, 28 + Math.sin(t * 20) * 6, 0, Math.PI * 2);
        c.fill();
      }

      if (this.state !== 'REVEAL') {
        this.drawCapsule(c, capX, capY, this.droppedCapsule.r, this.droppedCapsule.rot, this.droppedCapsule.color, this.droppedCapsule.botColor);
      } else {
        // Exploded Capsule halves
        const popOffset = Math.min(this.stateTime * 60, 30);
        this.drawCapsuleHalf(c, capX - popOffset, capY - popOffset * 0.4, this.droppedCapsule.r, -0.4, this.droppedCapsule.color, true);
        this.drawCapsuleHalf(c, capX + popOffset, capY + popOffset * 0.4, this.droppedCapsule.r, 0.4, this.droppedCapsule.botColor, false);
      }
    }

    // --- 5. CONFETTI PARTICLES ---
    for (const p of this.particles) {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillStyle = p.color;
      c.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
      c.restore();
    }
  }

  drawCapsule(c, x, y, r, rot, topCol, botCol) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);

    // Bottom Half
    c.fillStyle = botCol;
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI);
    c.fill();

    // Top Half
    c.fillStyle = topCol;
    c.beginPath();
    c.arc(0, 0, r, Math.PI, 0);
    c.fill();

    // Seam band
    c.fillStyle = '#0f172a';
    c.fillRect(-r, -2, r * 2, 4);

    // Center button
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(0, 0, 4, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#0f172a';
    c.lineWidth = 1.5;
    c.stroke();

    // Gloss glint
    c.fillStyle = 'rgba(255, 255, 255, 0.4)';
    c.beginPath();
    c.ellipse(-r * 0.35, -r * 0.35, r * 0.3, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  drawCapsuleHalf(c, x, y, r, rot, color, isTop) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.fillStyle = color;
    c.beginPath();
    if (isTop) {
      c.arc(0, 0, r, Math.PI, 0);
    } else {
      c.arc(0, 0, r, 0, Math.PI);
    }
    c.fill();
    c.fillStyle = '#0f172a';
    c.fillRect(-r, -2, r * 2, 4);
    c.restore();
  }
}
