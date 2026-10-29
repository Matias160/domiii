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
    x: 230, y: 190,
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
    accessoryName: 'Ticket Dorado',
    accessoryDesc: '+10% puntos/monedas y +5% daño con combo x5 o mayor.'
  },
  {
    id: 'kitchen',
    index: 2,
    name: 'Cocina Industrial',
    sub: 'Norte Tecnológico y Hornallas',
    x: 270, y: 90,
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
    accessoryName: 'Guantes Térmicos',
    accessoryDesc: 'Inmunidad total al aceite y +7% cadencia de disparo.'
  },
  {
    id: 'parking',
    index: 3,
    name: 'Estacionamiento',
    sub: 'Oeste Asfáltico y Delivery',
    x: 105, y: 200,
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
    accessoryName: 'Chaleco Reflectante',
    accessoryDesc: '+20% daño de embestida con dash y recarga -12%.'
  },
  {
    id: 'snow',
    index: 4,
    name: 'Nevado',
    sub: 'Noroeste Glacial y Ventiscas',
    x: 105, y: 80,
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
    accessoryName: 'Bufanda Térmica',
    accessoryDesc: '-60% ralentización por frío y +12 HP máx.'
  },
  {
    id: 'desert',
    index: 5,
    name: 'Desierto',
    sub: 'Suroeste Árido y Dunas',
    x: 125, y: 325,
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
    accessoryName: 'Botas Anti-Espinas',
    accessoryDesc: 'Inmunidad al daño de cactus y +8% velocidad en arena.'
  },
  {
    id: 'football',
    index: 6,
    name: 'Cancha de fútbol',
    sub: 'Este Deportivo y Tribuna',
    x: 395, y: 160,
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
    accessoryDesc: '+30% velocidad y daño al patear pelotas/cocos, +8% velocidad.'
  },
  {
    id: 'beach',
    index: 7,
    name: 'Playa Tropical',
    sub: 'Sureste Costero y Olas',
    x: 420, y: 300,
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
    accessoryName: 'Visera Tropical',
    accessoryDesc: '+12% radio de imán de pickups y +7% crítico.'
  },
  {
    id: 'lava',
    index: 8,
    name: 'Caldero de Lava',
    sub: 'Abismo Volcánico Oculto',
    x: 270, y: 310,
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
    this.selectedRegionIndex = 0;
    this.hoverRegionIndex = -1;
    this.animTime = 0;
    this.canvas = null;
    this.ctx = null;
    this.bound = false;
  }

  init() {
    if (this.bound) return;
    this.canvas = document.querySelector('#atlasCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    document.querySelector('#atlasBackButton')?.addEventListener('click', () => {
      this.game.showScreen('lobbyScreen');
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      let found = -1;
      for (let i = 0; i < REGIONS.length; i++) {
        const r = REGIONS[i];
        if (Math.hypot(mx - r.x, my - r.y) < 32) {
          found = i;
          break;
        }
      }
      if (found !== this.hoverRegionIndex) {
        this.hoverRegionIndex = found;
        this.canvas.style.cursor = found >= 0 ? 'pointer' : 'default';
        this.drawMap();
      }
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      for (let i = 0; i < REGIONS.length; i++) {
        const r = REGIONS[i];
        if (Math.hypot(mx - r.x, my - r.y) < 32) {
          this.selectRegion(i);
          this.game.audio?.play('navigate');
          break;
        }
      }
    });

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
      }
    });

    this.bound = true;
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

    const bankEl = document.querySelector('#atlasBank');
    if (bankEl) bankEl.textContent = profile.bank.toLocaleString('es-AR');

    this.renderDetail();
    this.drawMap();
    this.game.showScreen('atlasScreen');
    refreshIcons();
    this.startLoop();
  }

  startLoop() {
    if (this.loopRunning) return;
    this.loopRunning = true;
    const tick = () => {
      const screen = document.querySelector('#atlasScreen');
      if (!screen || screen.classList.contains('hidden') || screen.style.display === 'none') {
        this.loopRunning = false;
        return;
      }
      this.animTime += 0.035;
      this.drawMap();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  selectRegion(index) {
    this.selectedRegionIndex = index;
    this.renderDetail();
    this.drawMap();
    refreshIcons();
  }

  renderDetail() {
    const detail = document.querySelector('#atlasRegionDetail');
    if (!detail) return;
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

    detail.innerHTML = `
      <div class="atlas-card-header" style="border-left: 4px solid ${region.color};">
        <div class="atlas-card-title-row">
          <span class="atlas-region-badge" style="background:${region.color}22; color:${region.color}; border: 1px solid ${region.color}66;">
            0${region.index} / REGISTRO
          </span>
          <span class="atlas-owned-badge ${owned ? 'is-owned' : 'is-locked'}">
            ${owned ? 'PROPIEDAD' : region.cost ? `${region.cost} PT` : 'BLOQUEADO'}
          </span>
        </div>
        <h3 class="atlas-region-name">${region.name}</h3>
        <p class="atlas-region-sub">${region.sub}</p>
      </div>

      <div class="atlas-section">
        <h4 class="atlas-section-title"><i data-lucide="alert-triangle"></i> PELIGRO AMBIENTAL</h4>
        <p class="atlas-hazard-desc">${region.hazard}</p>
      </div>

      <div class="atlas-section">
        <h4 class="atlas-section-title"><i data-lucide="bar-chart-2"></i> ESTADÍSTICAS PERMANENTES</h4>
        <div class="atlas-stats-grid">
          <div class="atlas-stat-box"><small>PARTIDAS</small><strong>${stats.runs}</strong></div>
          <div class="atlas-stat-box"><small>VICTORIAS</small><strong style="color:#4ade80;">${stats.victories}</strong></div>
          <div class="atlas-stat-box"><small>BAJAS</small><strong>${stats.kills}</strong></div>
          <div class="atlas-stat-box"><small>MÁX TIEMPO</small><strong>${Math.floor(stats.maxTime / 60)}:${String(Math.floor(stats.maxTime % 60)).padStart(2, '0')}</strong></div>
        </div>
      </div>

      <div class="atlas-section">
        <h4 class="atlas-section-title"><i data-lucide="skull"></i> AMENAZA NATIVA</h4>
        <div class="atlas-enemy-card">
          <div class="atlas-enemy-preview">
            <canvas id="atlasEnemyCanvas" width="56" height="56"></canvas>
          </div>
          <div class="atlas-enemy-info">
            <strong class="atlas-enemy-name">${region.enemyName}</strong>
            <small class="atlas-enemy-role" style="color:${region.color};">${region.enemyRole}</small>
            <p class="atlas-enemy-desc">${region.enemyDesc}</p>
          </div>
        </div>
      </div>

      <div class="atlas-section">
        <h4 class="atlas-section-title"><i data-lucide="flag"></i> MISIÓN TEMÁTICA</h4>
        <div class="atlas-mission-card">
          <div class="atlas-mission-header">
            <strong>${region.missionName}</strong>
            <span class="atlas-mission-status ${mission.completed ? 'is-done' : ''}">
              ${mission.completed ? 'COMPLETADA ✔' : `${mission.progress} / ${region.target}`}
            </span>
          </div>
          <p class="atlas-mission-desc">${region.missionDesc}</p>
          <div class="atlas-progress-track">
            <div class="atlas-progress-fill" style="width: ${progressPct}%; background: ${mission.completed ? '#4ade80' : region.color};"></div>
          </div>
        </div>
      </div>

      <div class="atlas-section">
        <h4 class="atlas-section-title"><i data-lucide="award"></i> RECOMPENSA EXCLUSIVA</h4>
        <div class="atlas-accessory-card ${accessoryOwned ? 'is-unlocked' : 'is-locked'}">
          <div class="atlas-accessory-preview">
            <canvas id="atlasAccessoryCanvas" width="48" height="48"></canvas>
            ${!accessoryOwned ? '<div class="atlas-lock-overlay"><i data-lucide="lock"></i></div>' : ''}
          </div>
          <div class="atlas-accessory-info">
            <strong>${region.accessoryName}</strong>
            <p class="atlas-accessory-desc">${region.accessoryDesc}</p>
            ${accessoryOwned
              ? `<button id="atlasEquipBtn" class="pixel-button pixel-button--sm ${isEquipped ? 'is-active' : ''}">
                  ${isEquipped ? 'EQUIPADO ✔' : 'EQUIPAR'}
                </button>`
              : `<small class="atlas-locked-hint">Completa la misión para desbloquear</small>`
            }
          </div>
        </div>
      </div>

      <div class="atlas-actions">
        ${owned
          ? `<button id="atlasPlayBtn" class="pixel-button pixel-button--green" style="width:100%; padding:12px; font-size:12px;">
              JUGAR EN ESTA REGIÓN
            </button>`
          : region.domiExclusive
            ? `<button disabled class="pixel-button pixel-button--secondary" style="width:100%; opacity:0.6; padding:12px; font-size:11px;">
                BLOQUEADO (RELIQUIA SUPREMA)
              </button>`
            : `<button id="atlasBuyBtn" class="pixel-button pixel-button--yellow" style="width:100%; padding:12px; font-size:12px;">
                COMPRAR MAPA (${region.cost} PT)
              </button>`
        }
      </div>
    `;

    // Renderizar preview del enemigo nativo
    const enemyCv = detail.querySelector('#atlasEnemyCanvas');
    if (enemyCv) {
      const ectx = enemyCv.getContext('2d');
      ectx.clearRect(0, 0, 56, 56);
      drawFood(ectx, region.enemyId, 28, 28, 0.72, this.animTime, true);
    }

    // Renderizar preview del accesorio
    const accCv = detail.querySelector('#atlasAccessoryCanvas');
    if (accCv) {
      const actx = accCv.getContext('2d');
      actx.clearRect(0, 0, 48, 48);
      drawAccessoryIcon(actx, region.accessoryId, 24, 24, 40);
    }

    // Botones de acción
    detail.querySelector('#atlasPlayBtn')?.addEventListener('click', () => {
      this.game.audio?.play('confirm');
      try {
        equip('map', region.id);
      } catch {}
      this.game.menu.setSetupStep(1);
      this.game.menu.prepareAccount();
      this.game.showScreen('setupScreen');
    });

    detail.querySelector('#atlasBuyBtn')?.addEventListener('click', () => {
      try {
        purchase('map', region.id);
        this.game.audio?.play('victory');
        const p = currentAccount();
        const b = document.querySelector('#atlasBank');
        if (b && p) b.textContent = p.bank.toLocaleString('es-AR');
        this.renderDetail();
        this.drawMap();
        refreshIcons();
      } catch (err) {
        this.game.showToast?.(err.message);
        this.game.audio?.play('hit');
      }
    });

    detail.querySelector('#atlasEquipBtn')?.addEventListener('click', () => {
      try {
        equip('accessory', region.accessoryId);
        this.game.audio?.play('confirm');
        this.renderDetail();
        refreshIcons();
      } catch (err) {
        this.game.showToast?.(err.message);
      }
    });
  }

  drawMap() {
    if (!this.ctx || !this.canvas) return;
    const c = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const t = this.animTime;

    // Fondo del mar oceánico retro con gradiente
    const seaGrad = c.createLinearGradient(0, 0, 0, h);
    seaGrad.addColorStop(0, '#041726');
    seaGrad.addColorStop(0.5, '#06263f');
    seaGrad.addColorStop(1, '#083354');
    c.fillStyle = seaGrad;
    c.fillRect(0, 0, w, h);

    // Olas animadas en el océano
    c.fillStyle = 'rgba(56, 189, 248, 0.12)';
    for (let row = 0; row < 14; row++) {
      const y = 20 + row * 30;
      const waveShift = Math.sin(t * 1.5 + row * 0.8) * 16;
      for (let x = -20; x < w + 20; x += 40) {
        c.fillRect(x + waveShift, y, 16, 2);
      }
    }

    // Dibujar rutas marítimas y terrestres entre regiones
    const routes = [
      ['diner', 'kitchen'],
      ['diner', 'parking'],
      ['parking', 'snow'],
      ['snow', 'kitchen'],
      ['diner', 'football'],
      ['football', 'beach'],
      ['parking', 'desert'],
      ['desert', 'lava'],
      ['beach', 'lava'],
      ['diner', 'lava']
    ];

    c.lineWidth = 2;
    for (const [fromId, toId] of routes) {
      const from = REGIONS.find(r => r.id === fromId);
      const to = REGIONS.find(r => r.id === toId);
      if (!from || !to) continue;

      const isLavaPath = fromId === 'lava' || toId === 'lava';
      c.strokeStyle = isLavaPath ? 'rgba(239, 68, 68, 0.45)' : 'rgba(254, 240, 138, 0.28)';
      c.setLineDash([4, 6]);
      c.lineDashOffset = -t * 12;
      c.beginPath();
      c.moveTo(from.x, from.y);
      c.lineTo(to.x, to.y);
      c.stroke();
    }
    c.setLineDash([]);

    // Dibujar islas y nodos de región
    const profile = currentAccount() || {};
    for (let i = 0; i < REGIONS.length; i++) {
      const r = REGIONS[i];
      const isSelected = i === this.selectedRegionIndex;
      const isHover = i === this.hoverRegionIndex;
      const owned = isOwned(profile, 'map', r.id);

      // Isla / Tierra bajo el nodo
      c.save();
      c.translate(r.x, r.y);

      // Sombra de isla
      c.fillStyle = 'rgba(2, 6, 23, 0.55)';
      c.beginPath();
      c.ellipse(0, 8, 30, 18, 0, 0, Math.PI * 2);
      c.fill();

      // Superficie de la isla según bioma
      const biomeColors = {
        diner: '#a16207',
        kitchen: '#78350f',
        parking: '#334155',
        snow: '#93c5fd',
        desert: '#d97706',
        football: '#15803d',
        beach: '#eab308',
        lava: '#7f1d1d'
      };
      c.fillStyle = biomeColors[r.id] || '#334155';
      c.beginPath();
      c.ellipse(0, 0, 26, 16, 0, 0, Math.PI * 2);
      c.fill();

      // Anillo de selección pulsante
      if (isSelected || isHover) {
        const pulse = (Math.sin(t * 5) + 1) * 0.5;
        c.strokeStyle = isSelected ? r.color : '#ffffff';
        c.lineWidth = isSelected ? 3 : 2;
        c.beginPath();
        c.arc(0, 0, 22 + (isSelected ? pulse * 4 : 2), 0, Math.PI * 2);
        c.stroke();
      }

      // Base del pin
      c.fillStyle = '#0f172a';
      c.beginPath();
      c.arc(0, -2, 14, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = r.color;
      c.lineWidth = 2;
      c.stroke();

      // Número de región
      c.font = 'bold 10px monospace';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = '#f8fafc';
      c.fillText(`0${r.index}`, 0, -2);

      // Etiqueta flotante con nombre
      c.font = 'bold 9px monospace';
      c.fillStyle = '#0f172a';
      c.fillRect(-44, 18, 88, 14);
      c.strokeStyle = isSelected ? r.color : '#334155';
      c.lineWidth = 1;
      c.strokeRect(-44, 18, 88, 14);
      c.fillStyle = isSelected ? r.color : '#f8fafc';
      c.fillText(r.name.toUpperCase(), 0, 26);

      // Candado si no es propio
      if (!owned) {
        c.fillStyle = '#ef4444';
        c.fillRect(10, -14, 8, 8);
        c.fillStyle = '#ffffff';
        c.fillRect(12, -12, 4, 4);
      }

      c.restore();
    }
  }
}
