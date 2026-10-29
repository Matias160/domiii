import { currentAccount, purchase, equip, grantItem } from '../systems/accountSystem.js';
import { isOwned } from '../data/shop.js';
import { getMapStats, getCartographyMissions } from '../systems/accountSystem.js';
import { drawFood } from '../core/art.js';
import { drawAccessoryIcon, resolveAccessory } from '../core/accessories.js';
import { refreshIcons } from './icons.js';

export const REGIONS = [
  {
    id: 'diner',
    index: 1,
    name: 'Local DOMI',
    sub: 'Centro Urbano Gastronómico',
    x: 640, y: 370,
    icon: '🏪',
    color: '#facc15',
    cost: 0,
    hazard: 'Embotellamiento de mesas y mozos acelerados.',
    enemyId: 'bill_collector',
    enemyName: 'Cobrador de cuentas',
    enemyRole: 'Veloz / Implacable',
    enemyDesc: 'Mozo con libreta que persigue sin tregua.',
    missionId: 'diner',
    missionName: 'Cuentas Claras',
    missionDesc: 'Derrotar a 10 enemigos con combo x10 o superior',
    target: 10,
    accessoryId: 'ticket_gold',
    accessoryName: 'Lentes de Fiesta',
    accessoryDesc: 'Lentes estrella de fiesta retro: +10% puntos/monedas y +5% daño con combo x5 o mayor.'
  },
  {
    id: 'kitchen',
    index: 2,
    name: 'Cocina Industrial',
    sub: 'Norte Tecnológico y Hornallas',
    x: 640, y: 140,
    icon: '🍳',
    color: '#fb923c',
    cost: 0,
    hazard: 'Charcos de aceite resbaladizo (+8% velocidad enemigos).',
    enemyId: 'frying_pan',
    enemyName: 'Sartén poseída',
    enemyRole: 'Defensivo / Blindado',
    enemyDesc: 'Sartén de hierro que bloquea ataques frontales.',
    missionId: 'kitchen',
    missionName: 'Fuego Bajo Control',
    missionDesc: 'Derrotar a 10 enemigos mientras haya aceite activo',
    target: 10,
    accessoryId: 'thermal_gloves',
    accessoryName: 'Farol Gourmet',
    accessoryDesc: 'Farol de hornallas vivas: Inmunidad total al aceite y +7% cadencia de disparo.'
  },
  {
    id: 'parking',
    index: 3,
    name: 'Estacionamiento',
    sub: 'Oeste Asfáltico y Delivery',
    x: 200, y: 390,
    icon: '🚗',
    color: '#38bdf8',
    cost: 0,
    hazard: 'Peligro vial nocturno y espacio abierto de asedio.',
    enemyId: 'delivery_kart',
    enemyName: 'Autito de reparto',
    enemyRole: 'Embestida Rápida',
    enemyDesc: 'Vehículo que toca bocina y arremete a gran velocidad.',
    missionId: 'parking',
    missionName: 'Entrega Urgente',
    missionDesc: 'Derribar a 12 enemigos con acelerón (dash)',
    target: 12,
    accessoryId: 'reflect_vest',
    accessoryName: 'Guitarra Callejera',
    accessoryDesc: 'Guitarra acústica de asfalto: +20% daño de embestida con dash y recarga -12%.'
  },
  {
    id: 'snow',
    index: 4,
    name: 'Nevado',
    sub: 'Noroeste Glacial y Ventiscas',
    x: 220, y: 160,
    icon: '❄️',
    color: '#a5f3fc',
    cost: 800,
    hazard: 'Ventiscas periódicas que congelan y ralentizan al jugador.',
    enemyId: 'ice_pop',
    enemyName: 'Paleta congelante',
    enemyRole: 'Control Glacial',
    enemyDesc: 'Dispara esquirlas gélidas y estalla en escarcha.',
    missionId: 'snow',
    missionName: 'Resistencia Ártica',
    missionDesc: 'Derrotar a 10 enemigos durante ventiscas activas',
    target: 10,
    accessoryId: 'thermal_scarf',
    accessoryName: 'Gorro Invernal',
    accessoryDesc: 'Gorro festivo invernal con pompón: -60% ralentización por frío y +12 HP máx.'
  },
  {
    id: 'desert',
    index: 5,
    name: 'Desierto',
    sub: 'Suroeste Árido y Dunas',
    x: 280, y: 590,
    icon: '🌵',
    color: '#f59e0b',
    cost: 1000,
    hazard: 'Cactus explosivos y tormentas de arena.',
    enemyId: 'burrower_chili',
    enemyName: 'Chile excavador',
    enemyRole: 'Subterráneo / Emboscada',
    enemyDesc: 'Excava bajo tierra y emerge bajo tus pies.',
    missionId: 'desert',
    missionName: 'Tormenta de Espinas',
    missionDesc: 'Derrotar a 10 enemigos mediante explosiones de cactus',
    target: 10,
    accessoryId: 'thorn_boots',
    accessoryName: 'Estrella de Sheriff',
    accessoryDesc: 'Insignia dorada del sheriff: Inmunidad al daño de cactus y +8% velocidad en arena.'
  },
  {
    id: 'football',
    index: 6,
    name: 'Cancha de fútbol',
    sub: 'Este Deportivo y Tribuna',
    x: 1040, y: 170,
    icon: '⚽',
    color: '#4ade80',
    cost: 1200,
    hazard: 'Pelotas gigantes que rebotan con impacto devastador.',
    enemyId: 'goalie_bot',
    enemyName: 'Arquero mecánico',
    enemyRole: 'Guardián / Rechazo',
    enemyDesc: 'Autómata con guantes gigantes que desvía proyectiles.',
    missionId: 'football',
    missionName: 'Goleador Implacable',
    missionDesc: 'Golpear a 8 enemigos con pelotas pateadas',
    target: 8,
    accessoryId: 'captain_cleats',
    accessoryName: 'Botines de Capitán',
    accessoryDesc: 'Botines con tapones de fútbol: +30% velocidad y daño al patear pelotas/cocos, +8% velocidad.'
  },
  {
    id: 'beach',
    index: 7,
    name: 'Playa Tropical',
    sub: 'Sureste Costero y Olas',
    x: 1040, y: 520,
    icon: '🏖️',
    color: '#2dd4bf',
    cost: 0,
    hazard: 'Mareas rompientes, cangrejos y cocos rodantes.',
    enemyId: 'armored_crab',
    enemyName: 'Cangrejo acorazado',
    enemyRole: 'Blindaje Lateral',
    enemyDesc: 'Crustáceo que marcha de costado con pinzas protectoras.',
    missionId: 'beach',
    missionName: 'Marea Peligrosa',
    missionDesc: 'Derribar a 8 enemigos con cocos pateados',
    target: 8,
    accessoryId: 'tropical_visor',
    accessoryName: 'Sombrero de Piña',
    accessoryDesc: 'Casco de piña tropical: +15% duración de comida y +7% golpe crítico.'
  },
  {
    id: 'lava',
    index: 8,
    name: 'Caldero de Lava',
    sub: 'Abismo Volcánico Oculto',
    x: 640, y: 590,
    icon: '🌋',
    color: '#ef4444',
    cost: 0,
    domiExclusive: true,
    hazard: 'Basalto agrietado, géiseres de magma y lluvia de meteoritos.',
    enemyId: 'lava_boss',
    enemyName: 'Domi Colosal',
    enemyRole: 'COLOSO FINAL',
    enemyDesc: 'El titán del Caldero. Portador de la Plancha Negra.',
    missionId: 'lava',
    missionName: 'El Fuego Supremo',
    missionDesc: 'Derrotar al Coloso Final en una sola partida',
    target: 1,
    accessoryId: 'leg_lava_crown',
    accessoryName: 'Corona Magmática Imperial',
    accessoryDesc: '+50 HP Máximo, +30% Daño Ígneo y Rastro de Magma.'
  }
];

export class AtlasScreen {
  constructor(game) {
    this.game = game;
    this.world = { w: 1280, h: 720 };
    this.view = { w: 960, h: 540 };
    this.camera = { x: 160, y: 90 };
    this.targetCamera = { x: 160, y: 90 };

    this.selectedRegionIndex = 0;
    this.hoverRegionIndex = -1;
    this.cardVisible = true;
    this.animTime = 0;

    // Pancho aventurero en el mapa mundi
    this.pancho = {
      x: 640,
      y: 370,
      targetX: 640,
      targetY: 370,
      moving: false,
      angle: 0
    };

    // Partículas ambientales del mundo
    this.particles = [];
    this.initParticles();

    // Arrastre con mouse / touch
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.camStart = { x: 0, y: 0 };
    this.dragDist = 0;

    this.canvas = null;
    this.ctx = null;
    this.bound = false;
  }

  initParticles() {
    this.particles = [];
    // Copos de nieve en la zona noroeste
    for (let i = 0; i < 35; i++) {
      this.particles.push({
        type: 'snow',
        x: 60 + Math.random() * 320,
        y: 40 + Math.random() * 260,
        vx: -15 - Math.random() * 25,
        vy: 20 + Math.random() * 35,
        size: 2 + Math.random() * 2.5
      });
    }
    // Chispas de lava en la zona sur
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        type: 'ember',
        x: 520 + Math.random() * 240,
        y: 520 + Math.random() * 160,
        vx: (Math.random() - 0.5) * 20,
        vy: -25 - Math.random() * 35,
        size: 2 + Math.random() * 2.5,
        life: Math.random() * 1.5,
        maxLife: 1.5
      });
    }
    // Polvo de desierto
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        type: 'sand',
        x: 160 + Math.random() * 260,
        y: 500 + Math.random() * 180,
        vx: 30 + Math.random() * 40,
        vy: -5 + Math.random() * 10,
        size: 2
      });
    }
  }

  init() {
    if (this.bound) return;
    this.canvas = document.querySelector('#atlasCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    document.querySelector('#atlasBackButton')?.addEventListener('click', () => {
      this.game.audio?.play('navigate');
      this.game.showScreen('lobbyScreen');
    });

    // Barra de navegación rápida superior
    const navBar = document.querySelector('#atlasQuickNav');
    if (navBar) {
      navBar.innerHTML = '';
      REGIONS.forEach((r, idx) => {
        const btn = document.createElement('button');
        btn.className = `atlas-quick-btn ${idx === this.selectedRegionIndex ? 'is-active' : ''}`;
        btn.textContent = `0${r.index} ${r.name}`;
        btn.dataset.idx = idx;
        btn.addEventListener('click', () => {
          this.game.audio?.play('navigate');
          this.selectRegion(idx);
        });
        navBar.appendChild(btn);
      });
    }

    // Pointer events para arrastre y clic en el mapa mundi
    this.canvas.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.dragDist = 0;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.camStart = { x: this.camera.x, y: this.camera.y };
      this.canvas.setPointerCapture?.(e.pointerId);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.view.w / rect.width;
      const scaleY = this.view.h / rect.height;

      if (this.isDragging) {
        const dx = (e.clientX - this.dragStart.x) * scaleX;
        const dy = (e.clientY - this.dragStart.y) * scaleY;
        this.dragDist += Math.hypot(dx, dy);
        this.camera.x = Math.max(0, Math.min(this.world.w - this.view.w, this.camStart.x - dx));
        this.camera.y = Math.max(0, Math.min(this.world.h - this.view.h, this.camStart.y - dy));
        this.targetCamera.x = this.camera.x;
        this.targetCamera.y = this.camera.y;
        return;
      }

      // Hover check sobre las regiones (en coordenadas del mundo)
      const mouseWorldX = (e.clientX - rect.left) * scaleX + this.camera.x;
      const mouseWorldY = (e.clientY - rect.top) * scaleY + this.camera.y;

      let found = -1;
      for (let i = 0; i < REGIONS.length; i++) {
        const r = REGIONS[i];
        if (Math.hypot(mouseWorldX - r.x, mouseWorldY - r.y) < 42) {
          found = i;
          break;
        }
      }
      if (found !== this.hoverRegionIndex) {
        this.hoverRegionIndex = found;
        this.canvas.style.cursor = found >= 0 ? 'pointer' : 'grab';
      }
    });

    const onPointerUp = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.canvas.releasePointerCapture?.(e.pointerId);

      // Si fue un clic simple sin arrastre, seleccionar región
      if (this.dragDist < 8) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.view.w / rect.width;
        const scaleY = this.view.h / rect.height;
        const clickWorldX = (e.clientX - rect.left) * scaleX + this.camera.x;
        const clickWorldY = (e.clientY - rect.top) * scaleY + this.camera.y;

        for (let i = 0; i < REGIONS.length; i++) {
          const r = REGIONS[i];
          if (Math.hypot(clickWorldX - r.x, clickWorldY - r.y) < 46) {
            this.selectRegion(i);
            this.game.audio?.play('navigate');
            break;
          }
        }
      }
    };

    this.canvas.addEventListener('pointerup', onPointerUp);
    this.canvas.addEventListener('pointercancel', onPointerUp);

    window.addEventListener('keydown', (e) => {
      const screen = document.querySelector('#atlasScreen');
      if (!screen || screen.classList.contains('hidden') || screen.style.display === 'none') return;

      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.selectRegion((this.selectedRegionIndex + 1) % REGIONS.length);
        this.game.audio?.play('navigate');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.selectRegion((this.selectedRegionIndex - 1 + REGIONS.length) % REGIONS.length);
        this.game.audio?.play('navigate');
      } else if (e.key === 'Escape') {
        this.game.showScreen('lobbyScreen');
      } else if (e.key === ' ' || e.key === 'Enter') {
        const playBtn = document.querySelector('#atlasPlayBtn');
        const buyBtn = document.querySelector('#atlasBuyBtn');
        if (playBtn) playBtn.click();
        else if (buyBtn) buyBtn.click();
      }
    });

    this.bound = true;
  }

  resizeView() {
    if (!this.canvas) return;
    const stage = this.canvas.parentElement;
    const cw = stage?.clientWidth || window.innerWidth || 960;
    const ch = stage?.clientHeight || window.innerHeight || 540;
    const aspect = cw / (ch || 1);

    let w = 960, h = 540;
    if (aspect >= 16 / 9) {
      w = Math.round(540 * aspect);
    } else {
      h = Math.round(960 / aspect);
    }
    this.view.w = Math.min(this.world.w, Math.max(640, w));
    this.view.h = Math.min(this.world.h, Math.max(360, h));

    if (this.canvas.width !== this.view.w || this.canvas.height !== this.view.h) {
      this.canvas.width = this.view.w;
      this.canvas.height = this.view.h;
    }
  }

  show() {
    this.init();
    const profile = currentAccount();
    if (!profile) {
      this.game.showScreen('authScreen');
      return;
    }

    const currentMapId = profile.loadout?.map || 'diner';
    const foundIdx = REGIONS.findIndex(r => r.id === currentMapId);
    this.selectedRegionIndex = foundIdx >= 0 ? foundIdx : 0;

    const r = REGIONS[this.selectedRegionIndex];
    this.pancho.x = r.x;
    this.pancho.y = r.y;
    this.pancho.targetX = r.x;
    this.pancho.targetY = r.y;
    this.focusRegion(this.selectedRegionIndex, true);

    const bankEl = document.querySelector('#atlasBank');
    if (bankEl) bankEl.textContent = profile.bank.toLocaleString('es-AR');

    this.cardVisible = true;
    this.renderFloatingCard();
    this.game.showScreen('atlasScreen');
    this.resizeView();
    refreshIcons();
    this.startLoop();
  }

  startLoop() {
    if (this.loopRunning) return;
    this.loopRunning = true;
    let lastTime = performance.now();

    const tick = (now) => {
      const screen = document.querySelector('#atlasScreen');
      if (!screen || !screen.classList.contains('screen--active')) {
        this.loopRunning = false;
        return;
      }
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      this.animTime += dt;

      this.update(dt);
      this.draw();

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  focusRegion(index, instant = false) {
    const r = REGIONS[index];
    if (!r) return;
    this.targetCamera.x = Math.max(0, Math.min(this.world.w - this.view.w, r.x - this.view.w / 2));
    this.targetCamera.y = Math.max(0, Math.min(this.world.h - this.view.h, r.y - this.view.h / 2));
    if (instant) {
      this.camera.x = this.targetCamera.x;
      this.camera.y = this.targetCamera.y;
    }
  }

  selectRegion(index) {
    this.selectedRegionIndex = index;
    const r = REGIONS[index];
    this.pancho.targetX = r.x;
    this.pancho.targetY = r.y;
    this.focusRegion(index);
    this.cardVisible = true;

    // Actualizar botones de navegación rápida
    document.querySelectorAll('.atlas-quick-btn').forEach((btn, i) => {
      btn.classList.toggle('is-active', i === index);
    });

    this.renderFloatingCard();
    refreshIcons();
  }

  update(dt) {
    // Suavizado de cámara hacia el objetivo
    if (!this.isDragging) {
      const lerp = Math.min(1, dt * 5.5);
      this.camera.x += (this.targetCamera.x - this.camera.x) * lerp;
      this.camera.y += (this.targetCamera.y - this.camera.y) * lerp;
    }

    // Movimiento de Pancho entre regiones
    const dx = this.pancho.targetX - this.pancho.x;
    const dy = this.pancho.targetY - this.pancho.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 3) {
      this.pancho.moving = true;
      const speed = 360 * dt;
      this.pancho.x += (dx / dist) * Math.min(dist, speed);
      this.pancho.y += (dy / dist) * Math.min(dist, speed);
      this.pancho.angle = Math.atan2(dy, dx);
    } else {
      this.pancho.x = this.pancho.targetX;
      this.pancho.y = this.pancho.targetY;
      this.pancho.moving = false;
    }

    // Actualizar partículas ambientales
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === 'snow') {
        if (p.y > 320) { p.y = 40; p.x = 60 + Math.random() * 320; }
        if (p.x < 40) { p.x = 380; }
      } else if (p.type === 'ember') {
        p.life -= dt;
        if (p.life <= 0 || p.y < 460) {
          p.life = p.maxLife;
          p.x = 520 + Math.random() * 240;
          p.y = 620 + Math.random() * 80;
        }
      } else if (p.type === 'sand') {
        if (p.x > 440) { p.x = 160; p.y = 500 + Math.random() * 180; }
      }
    }
  }

  renderFloatingCard() {
    const card = document.querySelector('#atlasFloatingCard');
    if (!card) return;

    if (!this.cardVisible) {
      card.hidden = true;
      return;
    }
    card.hidden = false;

    const region = REGIONS[this.selectedRegionIndex];
    const profile = currentAccount() || {};
    const owned = isOwned(profile, 'map', region.id);
    const stats = getMapStats(region.id);
    const missions = getCartographyMissions();
    const mission = missions[region.missionId] || { progress: 0, target: region.target, completed: false };
    const accessory = resolveAccessory(region.accessoryId);
    const accessoryOwned = isOwned(profile, 'accessory', region.accessoryId);
    const isEquipped = profile.loadout?.accessory === region.accessoryId;
    const progressPct = Math.min(100, Math.round((mission.progress / region.target) * 100));

    card.innerHTML = `
      <div class="atlas-card-top" style="border-left: 4px solid ${region.color}; padding-left: 8px;">
        <div>
          <h3 class="atlas-card-reg-name">${region.name}</h3>
          <p class="atlas-card-sub">${region.sub}</p>
        </div>
        <span class="atlas-tag-badge ${owned ? 'is-owned' : 'is-locked'}">
          ${owned ? 'DESBLOQUEADO' : region.cost ? `${region.cost} PT` : 'BLOQUEADO'}
        </span>
      </div>

      <!-- Amenaza Nativa -->
      <div class="atlas-card-row">
        <div class="atlas-card-canvas-wrap">
          <canvas id="atlasCardEnemyCanvas" width="40" height="40"></canvas>
        </div>
        <div class="atlas-card-info">
          <span class="atlas-card-label" style="color:#38bdf8;">AMENAZA NATIVA</span>
          <strong style="color:${region.color};">${region.enemyName}</strong>
          <small>${region.enemyRole} · ${region.enemyDesc}</small>
        </div>
      </div>

      <!-- Misión Temática -->
      <div class="atlas-mission-prog-wrap">
        <div class="atlas-mission-prog-header">
          <div>
            <span class="atlas-card-label" style="color:#a78bfa;">MISIÓN DE MAPA</span>
            <strong style="color:#fef08a; font-size:10px;">${region.missionName}</strong>
          </div>
          <span style="color:${mission.completed ? '#4ade80' : '#facc15'}; font:bold 10px monospace;">
            ${mission.completed ? 'COMPLETADA ✔' : `${mission.progress} / ${region.target}`}
          </span>
        </div>
        <div class="atlas-bar-track">
          <div class="atlas-bar-fill" style="width: ${progressPct}%; background: ${mission.completed ? '#4ade80' : region.color};"></div>
        </div>
        <small style="color:#94a3b8; font-size:11px; line-height:1.3;">${region.missionDesc}</small>
      </div>

      <!-- Accesorio Exclusivo de Misión -->
      <div class="atlas-card-row">
        <div class="atlas-card-canvas-wrap">
          <canvas id="atlasCardAccCanvas" width="40" height="40"></canvas>
        </div>
        <div class="atlas-card-info">
          <span class="atlas-card-label" style="color:#fde047;">RELIQUIA TEMÁTICA</span>
          <strong style="color:#fef08a;">${region.accessoryName}</strong>
          <small>${region.accessoryDesc}</small>
          ${accessoryOwned
            ? `<button id="atlasCardEquipBtn" class="pixel-button pixel-button--sm ${isEquipped ? 'is-active' : ''}" style="margin-top:6px;">
                ${isEquipped ? 'EQUIPADO ✔' : 'EQUIPAR'}
              </button>`
            : `<small style="color:#f87171; display:block; margin-top:4px; font-weight:bold;">🔒 Bloqueado: completa la misión</small>`
          }
        </div>
      </div>

      <!-- Estadísticas rápidas -->
      <div class="atlas-stats-mini">
        <div class="atlas-stat-mini-box"><small>PARTIDAS</small><strong>${stats.runs}</strong></div>
        <div class="atlas-stat-mini-box"><small>VICTORIAS</small><strong style="color:#4ade80;">${stats.victories}</strong></div>
        <div class="atlas-stat-mini-box"><small>BAJAS</small><strong>${stats.kills}</strong></div>
      </div>

      <!-- Botón de Acción Principal -->
      <div class="atlas-card-actions">
        ${owned
          ? `<button id="atlasPlayBtn" class="pixel-button pixel-button--green" style="width:100%; padding:12px; font-size:11px;">
              JUGAR EN ESTA REGIÓN (ESPACIO)
            </button>`
          : region.domiExclusive
            ? `<button disabled class="pixel-button pixel-button--secondary" style="width:100%; opacity:0.6; padding:10px; font-size:10px;">
                RELIQUIA DEL COLOSO (BLOQUEADO)
              </button>`
            : `<button id="atlasBuyBtn" class="pixel-button pixel-button--yellow" style="width:100%; padding:12px; font-size:11px;">
                COMPRAR REGIÓN (${region.cost} PT)
              </button>`
        }
      </div>
    `;

    // Renderizar preview animado del enemigo nativo
    const enemyCv = card.querySelector('#atlasCardEnemyCanvas');
    if (enemyCv) {
      const ectx = enemyCv.getContext('2d');
      ectx.clearRect(0, 0, 40, 40);
      drawFood(ectx, region.enemyId, 20, 20, 0.60, this.animTime, true);
    }

    // Renderizar preview del accesorio
    const accCv = card.querySelector('#atlasCardAccCanvas');
    if (accCv) {
      const actx = accCv.getContext('2d');
      actx.clearRect(0, 0, 40, 40);
      drawAccessoryIcon(actx, region.accessoryId, 20, 20, 34);
    }

    card.querySelector('#atlasPlayBtn')?.addEventListener('click', () => {
      this.game.audio?.play('confirm');
      try {
        equip('map', region.id);
      } catch {}
      this.game.menu.setSetupStep(1);
      this.game.menu.prepareAccount();
      this.game.showScreen('setupScreen');
    });

    card.querySelector('#atlasBuyBtn')?.addEventListener('click', () => {
      try {
        purchase('map', region.id);
        this.game.audio?.play('victory');
        const p = currentAccount();
        const b = document.querySelector('#atlasBank');
        if (b && p) b.textContent = p.bank.toLocaleString('es-AR');
        this.renderFloatingCard();
        refreshIcons();
      } catch (err) {
        this.game.showToast?.(err.message);
        this.game.audio?.play('hit');
      }
    });

    card.querySelector('#atlasCardEquipBtn')?.addEventListener('click', () => {
      try {
        equip('accessory', region.accessoryId);
        this.game.audio?.play('confirm');
        this.renderFloatingCard();
        refreshIcons();
      } catch (err) {
        this.game.showToast?.(err.message);
      }
    });
  }

  draw() {
    this.resizeView();
    if (!this.ctx || !this.canvas) return;
    const c = this.ctx;
    const W = this.view.w;
    const H = this.view.h;
    const t = this.animTime;

    c.clearRect(0, 0, W, H);

    c.save();
    c.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

    // --- 1. OCÉANO Y CORRIENTES MARINAS ---
    const oceanGrad = c.createLinearGradient(0, 0, 0, this.world.h);
    oceanGrad.addColorStop(0, '#021220');
    oceanGrad.addColorStop(0.4, '#041d33');
    oceanGrad.addColorStop(1, '#062846');
    c.fillStyle = oceanGrad;
    c.fillRect(0, 0, this.world.w, this.world.h);

    // Olas animadas en el mar
    c.fillStyle = 'rgba(56, 189, 248, 0.12)';
    for (let row = 0; row < 24; row++) {
      const y = 20 + row * 30;
      const waveShift = Math.sin(t * 1.8 + row * 0.9) * 20;
      for (let x = -20; x < this.world.w + 40; x += 48) {
        c.fillRect(x + waveShift, y, 20, 2);
      }
    }

    // --- 2. RUTAS TERRESTRES Y MARÍTIMAS CONECTADAS ---
    const routes = [
      ['snow', 'kitchen'],
      ['snow', 'parking'],
      ['kitchen', 'diner'],
      ['kitchen', 'football'],
      ['parking', 'diner'],
      ['parking', 'desert'],
      ['diner', 'football'],
      ['diner', 'lava'],
      ['desert', 'lava'],
      ['football', 'beach'],
      ['beach', 'lava']
    ];

    c.lineWidth = 3;
    for (const [fromId, toId] of routes) {
      const from = REGIONS.find(r => r.id === fromId);
      const to = REGIONS.find(r => r.id === toId);
      if (!from || !to) continue;

      const isLava = fromId === 'lava' || toId === 'lava';
      c.strokeStyle = isLava ? 'rgba(239, 68, 68, 0.45)' : 'rgba(254, 240, 138, 0.32)';
      c.setLineDash([5, 7]);
      c.lineDashOffset = -t * 18;
      c.beginPath();
      c.moveTo(from.x, from.y);
      c.lineTo(to.x, to.y);
      c.stroke();
    }
    c.setLineDash([]);

    // --- 3. DIBUJADO DE REGIONES Y BIOMAS PIXEL ART ---
    for (let i = 0; i < REGIONS.length; i++) {
      const r = REGIONS[i];
      const isSelected = i === this.selectedRegionIndex;
      const isHover = i === this.hoverRegionIndex;

      c.save();
      c.translate(r.x, r.y);

      // Aguas someras / arrecife alrededor de cada isla con oleaje
      const foamPulse = Math.sin(t * 3 + i) * 3;
      c.fillStyle = 'rgba(14, 165, 233, 0.22)';
      c.beginPath();
      c.ellipse(0, 14, 82 + foamPulse, 46 + foamPulse * 0.5, 0, 0, Math.PI * 2);
      c.fill();

      // Línea de espuma costera
      c.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      c.lineWidth = 1.5;
      c.setLineDash([4, 6]);
      c.lineDashOffset = t * 10;
      c.beginPath();
      c.ellipse(0, 14, 80, 44, 0, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);

      // Sombra de contacto de la isla
      c.fillStyle = 'rgba(2, 6, 23, 0.60)';
      c.beginPath();
      c.ellipse(0, 12, 70, 38, 0, 0, Math.PI * 2);
      c.fill();

      // Terreno base del bioma
      this.drawBiomeTerrain(c, r.id, t);

      // Aro de selección o hover
      if (isSelected || isHover) {
        const pulse = (Math.sin(t * 6) + 1) * 0.5;
        c.strokeStyle = isSelected ? r.color : '#ffffff';
        c.lineWidth = isSelected ? 3.5 : 2;
        c.beginPath();
        c.arc(0, 0, 42 + (isSelected ? pulse * 5 : 2), 0, Math.PI * 2);
        c.stroke();
      }

      // Pin central con icono y número de región
      c.fillStyle = '#0f172a';
      c.beginPath();
      c.arc(0, -6, 17, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = r.color;
      c.lineWidth = 2.5;
      c.stroke();

      c.font = 'bold 11px monospace';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = '#f8fafc';
      c.fillText(`0${r.index}`, 0, -6);

      // Cartel con nombre de la región
      c.fillStyle = '#0b1522';
      c.fillRect(-52, 24, 104, 18);
      c.strokeStyle = isSelected ? r.color : '#203a4f';
      c.lineWidth = 1.5;
      c.strokeRect(-52, 24, 104, 18);

      c.font = 'bold 8px monospace';
      c.fillStyle = isSelected ? r.color : '#f8fafc';
      c.fillText(r.name.toUpperCase(), 0, 34);

      // Indicador de bloqueo
      const profile = currentAccount() || {};
      const owned = isOwned(profile, 'map', r.id);
      if (!owned) {
        c.fillStyle = '#ef4444';
        c.fillRect(10, -18, 10, 10);
        c.fillStyle = '#ffffff';
        c.fillRect(13, -15, 4, 4);
      }

      c.restore();
    }

    // --- 4. PANCHO VIAJANDO POR EL MAPA ---
    this.drawPanchoOnMap(c, t);

    // --- 5. PARTÍCULAS AMBIENTALES ---
    this.drawParticles(c);

    c.restore();

    // Viñeta de bordes arcade sobre el viewport
    const vignette = c.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, Math.hypot(W, H) / 2);
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(1, 'rgba(2, 6, 16, 0.45)');
    c.fillStyle = vignette;
    c.fillRect(0, 0, W, H);
  }

  drawBiomeTerrain(c, id, t) {
    if (id === 'snow') {
      // Montañas nevadas y pinos
      c.fillStyle = '#e2e8f0';
      c.beginPath(); c.ellipse(0, 0, 68, 34, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#cbd5e1';
      c.beginPath(); c.ellipse(0, 4, 62, 28, 0, 0, Math.PI * 2); c.fill();
      // Picos glaciares
      c.fillStyle = '#93c5fd';
      c.beginPath(); c.moveTo(-36, 6); c.lineTo(-18, -26); c.lineTo(2, 6); c.fill();
      c.beginPath(); c.moveTo(-8, 8); c.lineTo(18, -32); c.lineTo(42, 8); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.moveTo(-24, -16); c.lineTo(-18, -26); c.lineTo(-12, -16); c.fill();
      c.beginPath(); c.moveTo(12, -22); c.lineTo(18, -32); c.lineTo(24, -22); c.fill();
      // Pinos escarchados
      c.fillStyle = '#0f766e';
      c.beginPath(); c.moveTo(-42, 4); c.lineTo(-36, -8); c.lineTo(-30, 4); c.fill();
      c.beginPath(); c.moveTo(30, 6); c.lineTo(36, -6); c.lineTo(42, 6); c.fill();
    } else if (id === 'kitchen') {
      // Fábrica industrial de acero y chimeneas con humo
      c.fillStyle = '#475569';
      c.beginPath(); c.ellipse(0, 0, 68, 34, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#334155';
      c.beginPath(); c.ellipse(0, 4, 62, 28, 0, 0, Math.PI * 2); c.fill();
      // Estructura de la fábrica
      c.fillStyle = '#1e293b';
      c.fillRect(-32, -22, 64, 22);
      c.fillStyle = '#f97316';
      c.fillRect(-26, -16, 8, 8); c.fillRect(-12, -16, 8, 8); c.fillRect(2, -16, 8, 8);
      // Chimeneas humeantes
      c.fillStyle = '#0f172a';
      c.fillRect(-22, -36, 10, 16); c.fillRect(14, -40, 12, 20);
      // Humo animado
      const puff = Math.sin(t * 4) * 4;
      c.fillStyle = 'rgba(241, 245, 249, 0.55)';
      c.beginPath(); c.arc(-17 + puff, -44, 6, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(20 - puff, -48, 8, 0, Math.PI * 2); c.fill();
    } else if (id === 'parking') {
      // Asfalto gris con líneas amarillas de estacionamiento y farolas
      c.fillStyle = '#1e293b';
      c.beginPath(); c.ellipse(0, 0, 66, 33, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#334155';
      c.fillRect(-34, -16, 68, 30);
      c.fillStyle = '#facc15';
      for (let p = -28; p <= 22; p += 10) {
        c.fillRect(p, -14, 2, 10); c.fillRect(p, 2, 2, 10);
      }
      // Autito estacionado
      c.fillStyle = '#ef4444';
      c.fillRect(-8, -12, 16, 8);
      c.fillStyle = '#38bdf8';
      c.fillRect(-6, -10, 12, 4);
    } else if (id === 'desert') {
      // Dunas doradas onduladas y cactus con espinas
      c.fillStyle = '#d97706';
      c.beginPath(); c.ellipse(0, 0, 68, 34, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f59e0b';
      c.beginPath(); c.ellipse(-12, -6, 48, 22, -0.2, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(14, 4, 38, 18, 0.15, 0, Math.PI * 2); c.fill();
      // Cactus grande
      c.fillStyle = '#15803d';
      c.fillRect(-28, -24, 6, 22); c.fillRect(-34, -18, 18, 4);
      c.fillRect(-34, -22, 4, 6); c.fillRect(-20, -22, 4, 6);
      // Cactus pequeño
      c.fillRect(24, -14, 4, 14); c.fillRect(20, -10, 10, 3);
    } else if (id === 'football') {
      // Césped de cancha con franjas y arcos
      c.fillStyle = '#16a34a';
      c.beginPath(); c.ellipse(0, 0, 68, 34, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#15803d';
      for (let f = -36; f <= 26; f += 14) c.fillRect(f, -16, 7, 32);
      c.strokeStyle = '#ffffff'; c.lineWidth = 1.5;
      c.strokeRect(-32, -15, 64, 30);
      c.beginPath(); c.arc(0, 0, 10, 0, Math.PI * 2); c.stroke();
      c.strokeRect(-32, -7, 10, 14); c.strokeRect(22, -7, 10, 14);
    } else if (id === 'beach') {
      // Costa de arena y palmeras
      c.fillStyle = '#fde047';
      c.beginPath(); c.ellipse(0, 0, 68, 34, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2dd4bf';
      c.beginPath(); c.ellipse(18, 8, 42, 18, 0.2, 0, Math.PI * 2); c.fill();
      // Palmera principal
      c.fillStyle = '#78350f';
      c.fillRect(-26, -24, 5, 22);
      c.fillStyle = '#22c55e';
      c.beginPath(); c.arc(-24, -26, 10, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(-34, -24, 8, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(-14, -24, 8, 0, Math.PI * 2); c.fill();
      // Conchas marinas
      c.fillStyle = '#fda4af';
      c.fillRect(-8, 6, 3, 3); c.fillRect(6, 10, 3, 3);
    } else if (id === 'lava') {
      // Cráter de basalto negro con magma incandescente
      c.fillStyle = '#1c090d';
      c.beginPath(); c.ellipse(0, 0, 70, 35, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2d0f14';
      c.beginPath(); c.ellipse(0, 2, 60, 28, 0, 0, Math.PI * 2); c.fill();
      // Magma pulsante
      const lavaPulse = (Math.sin(t * 4) + 1) * 0.5;
      c.fillStyle = '#ef4444';
      c.beginPath(); c.ellipse(0, 0, 44 + lavaPulse * 4, 22 + lavaPulse * 2, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f97316';
      c.beginPath(); c.ellipse(0, 0, 30, 15, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fef08a';
      c.beginPath(); c.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2); c.fill();
    } else {
      // Diner clásico (Local DOMI)
      c.fillStyle = '#b45309';
      c.beginPath(); c.ellipse(0, 0, 70, 35, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#78350f';
      c.beginPath(); c.ellipse(0, 3, 62, 28, 0, 0, Math.PI * 2); c.fill();
      // Fachada con techo rojo y blanco
      c.fillStyle = '#dc2626';
      c.fillRect(-28, -22, 56, 20);
      c.fillStyle = '#ffffff';
      c.fillRect(-22, -22, 10, 20); c.fillRect(12, -22, 10, 20);
      // Cartel de neón DOMI
      c.fillStyle = '#fef08a';
      c.fillRect(-16, -32, 32, 10);
      c.fillStyle = '#b91c1c';
      c.font = 'bold 8px monospace';
      c.fillText('DOMI', 0, -24);
    }
  }

  drawPanchoOnMap(c, t) {
    const p = this.pancho;
    c.save();
    c.translate(p.x, p.y - 12);

    // Sombra de Pancho
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.beginPath();
    c.ellipse(0, 16, 12, 5, 0, 0, Math.PI * 2);
    c.fill();

    // Sprite de Pancho caminando con balanceo
    const bob = p.moving ? Math.sin(t * 14) * 2 : 0;
    drawFood(c, 'pancho', 0, bob, 0.65, p.moving ? t * 2 : 0);

    // Partículas de polvo si se está moviendo
    if (p.moving && Math.random() < 0.4) {
      c.fillStyle = 'rgba(254, 240, 138, 0.6)';
      c.beginPath();
      c.arc(-8 + Math.random() * 4, 14 + Math.random() * 3, 2, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();
  }

  drawParticles(c) {
    for (const p of this.particles) {
      if (p.type === 'snow') {
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fill();
      } else if (p.type === 'ember') {
        c.fillStyle = p.life < 0.5 ? '#f97316' : '#facc15';
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fill();
      } else if (p.type === 'sand') {
        c.fillStyle = '#fde047';
        c.fillRect(p.x, p.y, p.size, p.size);
      }
    }
  }
}
