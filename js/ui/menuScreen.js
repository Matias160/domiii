import { skins } from "../data/skins.js";
import { weapons } from "../data/weapons.js";
import { drawFood, drawWeapon, drawDiner } from "../core/art.js";
import { drawItemPreview, drawPet, drawOrangePixelSkull } from "../core/presentation.js";
import { unlockedAchievements, readAchievementStats, achievements } from "../systems/achievementSystem.js";
import { currentAccount, clearAccountRuns, isGuest, getCartographyMissions, equip } from '../systems/accountSystem.js';
import { isOwned } from '../data/shop.js';
import { refreshIcons } from './icons.js';
import { REGIONS } from './atlasScreen.js';
import { drawAccessoryIcon } from '../core/accessories.js';
import { drawWorldProps } from '../core/worldProps.js';

export const MODES_DATA = [
  { id: 'survival', name: 'SUPERVIVENCIA', short: 'SURVIVAL', tag: 'INF' },
  { id: 'waves', name: '8 OLEADAS', short: '8 WAVES', tag: '8 RND' },
  { id: 'rush', name: 'DUELO JEFES', short: 'BOSS RUSH', tag: 'BOSS' }
];

export const MAPS_DATA = [
  { id: 'diner', num: '01', name: 'LOCAL' },
  { id: 'kitchen', num: '02', name: 'COCINA' },
  { id: 'parking', num: '03', name: 'PARKING' },
  { id: 'snow', num: '04', name: 'NIEVE' },
  { id: 'desert', num: '05', name: 'DESIERTO' },
  { id: 'football', num: '06', name: 'CANCHA' },
  { id: 'lava', num: '07', name: 'LAVA' },
  { id: 'beach', num: '08', name: 'PLAYA' }
];

export const PETS_DATA = [
  { id: 'none', name: 'NINGUNA' },
  { id: 'ketchup', name: 'KETCHUP' },
  { id: 'drone', name: 'DRON' },
  { id: 'taco', name: 'TACO' },
  { id: 'soda', name: 'SODA' },
  { id: 'parrilla', name: 'PARRILLA' }
];

export const DIFFICULTIES_DATA = [
  { id: 'suave', name: 'SUAVE', mult: '1.0x' },
  { id: 'picante', name: 'PICANTE', mult: '1.5x' },
  { id: 'extra', name: 'EXTRA', mult: '2.0x' },
  { id: 'quemado', name: 'QUEMADO', mult: '2.5x' }
];

export function getModePixelSvg(modeId) {
  if (modeId === 'survival') {
    return `<svg viewBox="0 0 24 24" class="card-icon-pixel" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="5" y="2" width="14" height="2" fill="#ffcc00"/>
      <rect x="6" y="2" width="12" height="1" fill="#fff9c4"/>
      <rect x="7" y="4" width="10" height="1" fill="#cc8800"/>
      <rect x="6" y="5" width="12" height="2" fill="#38bdf8" opacity="0.35"/>
      <rect x="7" y="5" width="10" height="3" fill="#ffdd00"/>
      <rect x="8" y="8" width="8" height="2" fill="#ffaa00"/>
      <rect x="10" y="10" width="4" height="2" fill="#ffaa00"/>
      <rect x="11" y="11" width="2" height="2" fill="#ffffff"/>
      <rect x="11" y="13" width="2" height="1" fill="#ffdd00"/>
      <rect x="6" y="15" width="12" height="4" fill="#38bdf8" opacity="0.35"/>
      <rect x="10" y="14" width="4" height="2" fill="#e69500"/>
      <rect x="8" y="16" width="8" height="2" fill="#ffaa00"/>
      <rect x="7" y="17" width="10" height="2" fill="#ffcc00"/>
      <rect x="7" y="19" width="10" height="1" fill="#cc8800"/>
      <rect x="5" y="20" width="14" height="2" fill="#ffcc00"/>
      <rect x="6" y="21" width="12" height="1" fill="#995500"/>
      <rect x="5" y="4" width="1" height="16" fill="#ffaa00"/>
      <rect x="18" y="4" width="1" height="16" fill="#ffaa00"/>
    </svg>`;
  }
  if (modeId === 'rush') {
    return `<svg viewBox="0 0 24 24" class="card-icon-pixel" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="4" y="2" width="3" height="3" fill="#ef4444"/>
      <rect x="5" y="1" width="2" height="2" fill="#fca5a5"/>
      <rect x="17" y="2" width="3" height="3" fill="#ef4444"/>
      <rect x="17" y="1" width="2" height="2" fill="#fca5a5"/>
      <rect x="7" y="4" width="10" height="3" fill="#ffd700"/>
      <rect x="9" y="3" width="6" height="2" fill="#ffffff"/>
      <rect x="11" y="2" width="2" height="2" fill="#ff0044"/>
      <rect x="5" y="7" width="14" height="6" fill="#e2e8f0"/>
      <rect x="7" y="9" width="3" height="3" fill="#180508"/>
      <rect x="8" y="10" width="1" height="1" fill="#ff0022"/>
      <rect x="14" y="9" width="3" height="3" fill="#180508"/>
      <rect x="15" y="10" width="1" height="1" fill="#ff0022"/>
      <rect x="11" y="12" width="2" height="1" fill="#180508"/>
      <rect x="7" y="14" width="10" height="3" fill="#cbd5e1"/>
      <rect x="8" y="15" width="2" height="2" fill="#180508"/>
      <rect x="11" y="15" width="2" height="2" fill="#180508"/>
      <rect x="14" y="15" width="2" height="2" fill="#180508"/>
      <rect x="2" y="18" width="4" height="2" fill="#fbbf24"/>
      <rect x="18" y="18" width="4" height="2" fill="#fbbf24"/>
      <rect x="6" y="19" width="12" height="2" fill="#94a3b8"/>
      <rect x="10" y="21" width="4" height="2" fill="#64748b"/>
    </svg>`;
  }
  // 'waves'
  return `<svg viewBox="0 0 24 24" class="card-icon-pixel" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="11" y="1" width="2" height="2" fill="#ffffff"/>
    <rect x="10" y="2" width="4" height="2" fill="#ffd700"/>
    <rect x="8" y="3" width="8" height="1" fill="#ffcc00"/>
    <rect x="4" y="6" width="16" height="2" fill="#00e5ff"/>
    <rect x="6" y="7" width="12" height="1" fill="#ffffff"/>
    <rect x="3" y="9" width="18" height="2" fill="#00b4d8"/>
    <rect x="5" y="12" width="14" height="2" fill="#0077b6"/>
    <rect x="7" y="15" width="10" height="2" fill="#023e8a"/>
    <rect x="4" y="19" width="2" height="2" fill="#ffd700"/>
    <rect x="6" y="19" width="1" height="2" fill="#ffd700"/>
    <rect x="8" y="19" width="2" height="2" fill="#ffd700"/>
    <rect x="11" y="19" width="2" height="2" fill="#ffd700"/>
    <rect x="14" y="19" width="2" height="2" fill="#ffd700"/>
    <rect x="17" y="19" width="1" height="2" fill="#ffd700"/>
    <rect x="19" y="19" width="2" height="2" fill="#ffd700"/>
    <rect x="8" y="22" width="8" height="1" fill="#00ffcc"/>
  </svg>`;
}

export function getDifficultySkullSvgByTier(diff) {
  if (diff === 'quemado') {
    return `<svg viewBox="0 0 24 24" class="card-icon-pixel" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="5" y="1" width="2" height="2" fill="#ff0033"/>
      <rect x="17" y="1" width="2" height="2" fill="#ff0033"/>
      <rect x="8" y="2" width="8" height="1" fill="#ef4444"/>
      <rect x="6" y="3" width="12" height="2" fill="#dc2626"/>
      <rect x="8" y="3" width="2" height="1" fill="#fca5a5"/>
      <rect x="4" y="5" width="16" height="5" fill="#b91c1c"/>
      <rect x="6" y="8" width="4" height="4" fill="#180508"/>
      <rect x="7" y="9" width="2" height="2" fill="#ff0022"/>
      <rect x="14" y="8" width="4" height="4" fill="#180508"/>
      <rect x="15" y="9" width="2" height="2" fill="#ff0022"/>
      <rect x="11" y="12" width="2" height="2" fill="#180508"/>
      <rect x="5" y="11" width="3" height="3" fill="#7f1d1d"/>
      <rect x="16" y="11" width="3" height="3" fill="#7f1d1d"/>
      <rect x="7" y="15" width="10" height="1" fill="#b91c1c"/>
      <rect x="8" y="16" width="8" height="3" fill="#fca5a5"/>
      <rect x="9" y="16" width="1" height="3" fill="#180508"/>
      <rect x="11" y="16" width="2" height="3" fill="#180508"/>
      <rect x="14" y="16" width="1" height="3" fill="#180508"/>
      <rect x="8" y="19" width="8" height="1" fill="#450a0a"/>
    </svg>`;
  }
  if (diff === 'extra') {
    return `<svg viewBox="0 0 24 24" class="card-icon-pixel" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="8" y="2" width="8" height="1" fill="#fb923c"/>
      <rect x="6" y="3" width="12" height="2" fill="#f97316"/>
      <rect x="8" y="3" width="2" height="1" fill="#fed7aa"/>
      <rect x="4" y="5" width="16" height="5" fill="#ea580c"/>
      <rect x="6" y="8" width="4" height="4" fill="#2a0c02"/>
      <rect x="7" y="9" width="2" height="2" fill="#ff7700"/>
      <rect x="14" y="8" width="4" height="4" fill="#2a0c02"/>
      <rect x="15" y="9" width="2" height="2" fill="#ff7700"/>
      <rect x="11" y="12" width="2" height="2" fill="#2a0c02"/>
      <rect x="5" y="11" width="3" height="3" fill="#9a3412"/>
      <rect x="16" y="11" width="3" height="3" fill="#9a3412"/>
      <rect x="7" y="15" width="10" height="1" fill="#ea580c"/>
      <rect x="8" y="16" width="8" height="3" fill="#fed7aa"/>
      <rect x="9" y="16" width="1" height="3" fill="#2a0c02"/>
      <rect x="11" y="16" width="2" height="3" fill="#2a0c02"/>
      <rect x="14" y="16" width="1" height="3" fill="#2a0c02"/>
      <rect x="8" y="19" width="8" height="1" fill="#431407"/>
    </svg>`;
  }
  if (diff === 'suave') {
    return `<svg viewBox="0 0 24 24" class="card-icon-pixel" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="8" y="2" width="8" height="1" fill="#4ade80"/>
      <rect x="6" y="3" width="12" height="2" fill="#22c55e"/>
      <rect x="8" y="3" width="2" height="1" fill="#ffffff"/>
      <rect x="4" y="5" width="16" height="5" fill="#16a34a"/>
      <rect x="6" y="8" width="4" height="4" fill="#052e16"/>
      <rect x="7" y="9" width="2" height="2" fill="#86efac"/>
      <rect x="14" y="8" width="4" height="4" fill="#052e16"/>
      <rect x="15" y="9" width="2" height="2" fill="#86efac"/>
      <rect x="11" y="12" width="2" height="2" fill="#052e16"/>
      <rect x="5" y="11" width="3" height="3" fill="#15803d"/>
      <rect x="16" y="11" width="3" height="3" fill="#15803d"/>
      <rect x="7" y="15" width="10" height="1" fill="#16a34a"/>
      <rect x="8" y="16" width="8" height="3" fill="#ffffff"/>
      <rect x="9" y="16" width="1" height="3" fill="#052e16"/>
      <rect x="11" y="16" width="2" height="3" fill="#052e16"/>
      <rect x="14" y="16" width="1" height="3" fill="#052e16"/>
      <rect x="8" y="19" width="8" height="1" fill="#064e3b"/>
    </svg>`;
  }
  // 'picante'
  return `<svg viewBox="0 0 24 24" class="card-icon-pixel" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="8" y="2" width="8" height="1" fill="#facc15"/>
    <rect x="6" y="3" width="12" height="2" fill="#eab308"/>
    <rect x="8" y="3" width="2" height="1" fill="#fef9c3"/>
    <rect x="4" y="5" width="16" height="5" fill="#ca8a04"/>
    <rect x="6" y="8" width="4" height="4" fill="#2a1802"/>
    <rect x="7" y="9" width="2" height="2" fill="#fef08a"/>
    <rect x="14" y="8" width="4" height="4" fill="#2a1802"/>
    <rect x="15" y="9" width="2" height="2" fill="#fef08a"/>
    <rect x="11" y="12" width="2" height="2" fill="#2a1802"/>
    <rect x="5" y="11" width="3" height="3" fill="#a16207"/>
    <rect x="16" y="11" width="3" height="3" fill="#a16207"/>
    <rect x="7" y="15" width="10" height="1" fill="#ca8a04"/>
    <rect x="8" y="16" width="8" height="3" fill="#ffffff"/>
    <rect x="9" y="16" width="1" height="3" fill="#2a1802"/>
    <rect x="11" y="16" width="2" height="3" fill="#2a1802"/>
    <rect x="14" y="16" width="1" height="3" fill="#2a1802"/>
    <rect x="8" y="19" width="8" height="1" fill="#713f12"/>
  </svg>`;
}

function drawMapScenePreview(canvas, mapId, isOwned) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (mapId === 'lava' && !isOwned) {
    drawOrangePixelSkull(ctx, canvas.width, canvas.height, 0);
    return;
  }
  try {
    const buffer = document.createElement('canvas');
    buffer.width = 960;
    buffer.height = 540;
    const bCtx = buffer.getContext('2d');
    bCtx.imageSmoothingEnabled = false;
    drawDiner(bCtx, 960, 540, 0, false, mapId);
    drawWorldProps(bCtx, mapId, 0);

    ctx.drawImage(buffer, 80, 95, 800, 420, 0, 0, canvas.width, canvas.height);
  } catch (err) {
    console.warn('Error rendering map scene:', mapId, err);
  }
}

function drawPetThumbnail(canvas, petId) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;

  const bg = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.46);
  bg.addColorStop(0, 'rgba(0, 229, 255, 0.14)');
  bg.addColorStop(1, 'transparent');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  if (petId === 'none') {
    ctx.save();
    ctx.translate(w / 2, h / 2 + 1);
    ctx.fillStyle = '#162228';
    ctx.beginPath();
    ctx.ellipse(0, 5, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2b3f49';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '800 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('—', 0, 2);
    ctx.restore();
    return;
  }

  try {
    drawPet(ctx, petId, w / 2, h / 2 + 2, 0, 1.25);
  } catch (err) {
    console.warn('Error rendering pet thumbnail:', petId, err);
  }
}

export class MenuScreen {
  constructor(game) {
    this.game = game;
    this.selectedSkin = "pancho";
    this.selectedWeapon = "fork";
    this.nameInput = document.querySelector("#playerNameInput");
    this.difficultyInput = document.querySelector('#difficultySelect');
    this.mapInput = document.querySelector('#mapSelect');
    this.modeInput = document.querySelector('#modeSelect');
    this.companionInput = document.querySelector('#companionSelect');
    this.accessoryInput = document.querySelector('#accessorySelect');

    this.rowMode = document.querySelector('#rowMode');
    this.rowMap = document.querySelector('#rowMap');
    this.rowCompanion = document.querySelector('#rowCompanion');
    this.rowDifficulty = document.querySelector('#rowDifficulty');

    this.badgeMode = document.querySelector('#badgeMode');
    this.badgeMap = document.querySelector('#badgeMap');
    this.badgeCompanion = document.querySelector('#badgeCompanion');
    this.badgeDifficulty = document.querySelector('#badgeDifficulty');

    this.catBarMode = document.querySelector('#catBarMode');
    this.catBarMap = document.querySelector('#catBarMap');
    this.catBarCompanion = document.querySelector('#catBarCompanion');
    this.catBarDifficulty = document.querySelector('#catBarDifficulty');

    this.cardAccessory = document.querySelector('#cardAccessory');
    this.cardAccessoryVal = document.querySelector('#cardAccessoryVal');

    // Legacy proxies
    this.cardModeVal = document.querySelector('#cardModeVal');
    this.cardMapVal = document.querySelector('#cardMapVal');
    this.cardCompanionVal = document.querySelector('#cardCompanionVal');
    this.cardDifficultyVal = document.querySelector('#cardDifficultyVal');

    this.buildSetupCategories();
    this.bindInputs();
    this.restoreSetup();
    this.setSetupStep(1);

    document.querySelector("#setupNextBtn")?.addEventListener("click", () => {
      this.setSetupStep(2);
      this.game.audio?.play('navigate');
    });
    document.querySelector("#setupPrevBtn")?.addEventListener("click", () => {
      this.setSetupStep(1);
      this.game.audio?.play('navigate');
    });
    document.querySelector("#tabStep1")?.addEventListener("click", () => {
      this.setSetupStep(1);
      this.game.audio?.play('navigate');
    });
    document.querySelector("#tabStep2")?.addEventListener("click", () => {
      this.setSetupStep(2);
      this.game.audio?.play('navigate');
    });

    document.querySelector("#playButton").addEventListener("click", () => { this.setSetupStep(1); this.renderOptions(); game.showScreen("setupScreen"); });
    document.querySelector("#setupBackButton").addEventListener("click", () => game.showScreen("lobbyScreen"));
    document.querySelector("#rankingButton").addEventListener("click", () => game.showRanking());
    document.querySelector('#skinsButton').addEventListener('click',()=>this.showSkins());
    document.querySelector('#achievementsButton').addEventListener('click',()=>this.showAchievements());
    document.querySelector('#optionsButton').addEventListener('click',()=>this.showOptions());
    document.querySelector('#skinsBackButton').addEventListener('click',()=>game.showScreen('lobbyScreen'));
    document.querySelector('#achievementsBackButton').addEventListener('click',()=>game.showScreen('lobbyScreen'));
    document.querySelector('#optionsBackButton').addEventListener('click',()=>game.showScreen('lobbyScreen'));
    this.bindOptions();
    document.querySelector("#rankingBackButton").addEventListener("click", () => game.showScreen("lobbyScreen"));
    document.querySelector("#startRunButton").addEventListener("click", () => {
      const setup = {
        name: currentAccount()?.name || "Pancho",
        skinId: this.selectedSkin,
        weaponId: this.selectedWeapon,
        difficultyId: this.difficultyInput.value,
        mapId: this.mapInput.value,
        modeId: this.modeInput.value,
        companionId: this.companionInput.value,
        accessoryId: this.accessoryInput.value,
      };
      try { localStorage.setItem('domi2pancho.setup', JSON.stringify(setup)); } catch {}
      game.startRun(setup);
    });
    this.renderOptions();
  }

  buildSetupCategories() {
    // 1. MODO (3 opciones)
    if (this.rowMode) {
      this.rowMode.innerHTML = '';
      MODES_DATA.forEach(mode => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'setup-option-card setup-option-card--amber';
        card.dataset.category = 'mode';
        card.dataset.value = mode.id;
        card.setAttribute('role', 'radio');
        card.setAttribute('aria-label', `Modo ${mode.name}`);
        card.innerHTML = `
          <div class="setup-option-card__visual">${getModePixelSvg(mode.id)}</div>
          <div class="setup-option-card__info"><span class="setup-option-card__name">${mode.name}</span></div>
          <span class="setup-option-card__check" aria-hidden="true">✓</span>
        `;
        card.addEventListener('click', () => this.selectCategoryOption('mode', mode.id));
        this.rowMode.appendChild(card);
      });
    }

    // 2. MAPAS (8 opciones)
    if (this.rowMap) {
      this.rowMap.innerHTML = '';
      MAPS_DATA.forEach(map => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'setup-option-card setup-option-card--mint';
        card.dataset.category = 'map';
        card.dataset.value = map.id;
        card.setAttribute('role', 'radio');
        card.setAttribute('aria-label', `Mapa ${map.num} ${map.name}`);
        card.innerHTML = `
          <div class="setup-option-card__visual">
            <canvas class="setup-card-map-canvas" width="128" height="84" aria-hidden="true"></canvas>
          </div>
          <div class="setup-option-card__info"><span class="setup-option-card__name">${map.num} ${map.name}</span></div>
          <span class="setup-option-card__check" aria-hidden="true">✓</span>
        `;
        card.addEventListener('click', () => this.selectCategoryOption('map', map.id));
        this.rowMap.appendChild(card);
      });
    }

    // 3. MASCOTAS (6 opciones)
    if (this.rowCompanion) {
      this.rowCompanion.innerHTML = '';
      PETS_DATA.forEach(pet => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'setup-option-card setup-option-card--cyan';
        card.dataset.category = 'companion';
        card.dataset.value = pet.id;
        card.setAttribute('role', 'radio');
        card.setAttribute('aria-label', `Mascota ${pet.name}`);
        card.innerHTML = `
          <div class="setup-option-card__visual">
            <canvas class="setup-card-pet-canvas" width="84" height="60" aria-hidden="true"></canvas>
          </div>
          <div class="setup-option-card__info"><span class="setup-option-card__name">${pet.name}</span></div>
          <span class="setup-option-card__check" aria-hidden="true">✓</span>
        `;
        card.addEventListener('click', () => this.selectCategoryOption('companion', pet.id));
        this.rowCompanion.appendChild(card);
      });
    }

    // 4. DIFICULTAD (4 opciones)
    if (this.rowDifficulty) {
      this.rowDifficulty.innerHTML = '';
      DIFFICULTIES_DATA.forEach(diff => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `setup-option-card setup-option-card--red setup-option-card--diff-${diff.id}`;
        card.dataset.category = 'difficulty';
        card.dataset.value = diff.id;
        card.setAttribute('role', 'radio');
        card.setAttribute('aria-label', `Dificultad ${diff.name} (${diff.mult})`);
        card.innerHTML = `
          <div class="setup-option-card__visual">${getDifficultySkullSvgByTier(diff.id)}</div>
          <div class="setup-option-card__info"><span class="setup-option-card__name">${diff.name}</span></div>
          <span class="setup-option-card__check" aria-hidden="true">✓</span>
        `;
        card.addEventListener('click', () => this.selectCategoryOption('difficulty', diff.id));
        this.rowDifficulty.appendChild(card);
      });
    }

    // Scroll navigation arrows
    document.querySelector('#mapNavPrev')?.addEventListener('click', () => {
      this.rowMap?.scrollBy({ left: -160, behavior: 'smooth' });
      this.game.audio?.play?.('navigate');
    });
    document.querySelector('#mapNavNext')?.addEventListener('click', () => {
      this.rowMap?.scrollBy({ left: 160, behavior: 'smooth' });
      this.game.audio?.play?.('navigate');
    });
    document.querySelector('#petNavPrev')?.addEventListener('click', () => {
      this.rowCompanion?.scrollBy({ left: -160, behavior: 'smooth' });
      this.game.audio?.play?.('navigate');
    });
    document.querySelector('#petNavNext')?.addEventListener('click', () => {
      this.rowCompanion?.scrollBy({ left: 160, behavior: 'smooth' });
      this.game.audio?.play?.('navigate');
    });

    this.renderAllCardCanvases();
  }

  renderAllCardCanvases() {
    const profile = currentAccount();
    if (this.rowMap) {
      this.rowMap.querySelectorAll('.setup-option-card').forEach(card => {
        const canvas = card.querySelector('canvas');
        const mapId = card.dataset.value;
        if (canvas && mapId) {
          drawMapScenePreview(canvas, mapId, isOwned(profile, 'map', mapId));
        }
      });
    }
    if (this.rowCompanion) {
      this.rowCompanion.querySelectorAll('.setup-option-card').forEach(card => {
        const canvas = card.querySelector('canvas');
        const petId = card.dataset.value;
        if (canvas && petId) {
          drawPetThumbnail(canvas, petId);
        }
      });
    }
  }

  selectCategoryOption(category, value) {
    const profile = currentAccount();
    const guest = isGuest();
    const isLava = this.mapInput?.value === 'lava';

    if (category === 'mode') {
      if (isLava) return;
      if (this.modeInput) {
        this.modeInput.value = value;
        this.modeInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (category === 'map') {
      const isUnlocked = isOwned(profile, 'map', value);
      if (!isUnlocked) {
        this.game.showToast?.(value === 'lava' ? '💀 ¡El Caldero de Lava requiere desbloqueo especial!' : '¡Mapa no adquirido! Compralo en la tienda o en el Atlas.');
        this.game.audio?.play?.('error');
        return;
      }
      if (this.mapInput) {
        this.mapInput.value = value;
        this.mapInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (category === 'companion') {
      if (guest && value !== 'none') {
        this.game.showToast?.('¡Solo para socios! Creá tu tarjeta en la recepción para desbloquear mascotas.');
        this.game.audio?.play?.('error');
        return;
      }
      const isUnlocked = (value === 'none') || isOwned(profile, 'pet', value);
      if (!isUnlocked) {
        this.game.showToast?.('¡Mascota no adquirida! Podés desbloquearla en la Máquina de Premios o en la Tienda.');
        this.game.audio?.play?.('error');
        return;
      }
      if (this.companionInput) {
        this.companionInput.value = value;
        this.companionInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (category === 'difficulty') {
      if (isLava) return;
      if (this.difficultyInput) {
        this.difficultyInput.value = value;
        this.difficultyInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    this.game.audio?.play?.('navigate');
    this.syncCards();
  }

  bindInputs() {
    this.cardAccessory?.addEventListener('click', () => this.cycleOption(this.accessoryInput));

    [this.modeInput, this.mapInput, this.companionInput, this.difficultyInput, this.accessoryInput].forEach(input => {
      input?.addEventListener('change', () => this.syncCards());
    });
  }

  cycleOption(select) {
    if (!select || !select.options) return;
    if (isGuest() && (select === this.companionInput || select === this.accessoryInput)) {
      this.game.showToast?.('¡Solo para socios! Creá tu tarjeta en la recepción para desbloquear mascotas y accesorios.');
      this.game.audio?.play?.('error');
      return;
    }
    if ((select === this.modeInput || select === this.difficultyInput) && this.mapInput.value === 'lava') {
      return;
    }
    const available = [...select.options].filter(opt => !opt.disabled);
    if (available.length <= 1) return;
    const currentVal = select.value;
    const currIdx = available.findIndex(opt => opt.value === currentVal);
    const nextIdx = (currIdx + 1) % available.length;
    select.value = available[nextIdx].value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    this.syncCards();
    this.game.audio?.play?.('navigate');
  }

  renderCardThumbnail(card, type, id) {
    if (!card) return;
    const box = card.querySelector('.setup-card__icon-box');
    if (!box) return;
    const profile = currentAccount();

    let canvas = box.querySelector('canvas.card-icon-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'card-icon-canvas';
      canvas.width = (type === 'accessory') ? 44 : 68;
      canvas.height = (type === 'accessory') ? 44 : 68;
    }

    if (id === 'none') {
      canvas.remove();
      const existingSvg = box.querySelector('svg');
      if (existingSvg) existingSvg.style.display = 'block';
      return;
    }

    const svg = box.querySelector('svg');
    if (svg) svg.style.display = 'none';

    if (!box.contains(canvas)) {
      box.appendChild(canvas);
    }

    try {
      drawItemPreview(canvas, { type, id, name: id }, profile, 0);
    } catch (err) {
      console.warn('Error rendering card preview:', err);
    }
  }

  getDifficultySkullSvg(diff, isLava) {
    if (isLava) return getDifficultySkullSvgByTier('quemado');
    return getDifficultySkullSvgByTier(diff);
  }

  syncCards() {
    const isLava = this.mapInput?.value === 'lava';
    const profile = currentAccount();
    const guest = isGuest();

    const getCleanLabel = (sel) => {
      if (!sel || !sel.options || sel.selectedIndex < 0) return '';
      const opt = sel.options[sel.selectedIndex];
      return opt ? opt.textContent.replace(/ \[(TIENDA|SOLO SOCIOS|BLOQUEADO)\]$/, '') : '';
    };

    const modeVal = this.modeInput?.value || 'waves';
    const mapVal = this.mapInput?.value || 'diner';
    const compVal = this.companionInput?.value || 'none';
    const diffVal = this.difficultyInput?.value || 'picante';

    // Header Badges
    if (this.badgeMode) this.badgeMode.textContent = isLava ? 'COLOSAL' : (getCleanLabel(this.modeInput) || modeVal.toUpperCase());
    if (this.badgeMap) this.badgeMap.textContent = getCleanLabel(this.mapInput) || mapVal.toUpperCase();
    if (this.badgeCompanion) this.badgeCompanion.textContent = getCleanLabel(this.companionInput) || compVal.toUpperCase();
    if (this.badgeDifficulty) this.badgeDifficulty.textContent = isLava ? '???' : (getCleanLabel(this.difficultyInput) || diffVal.toUpperCase());

    // Legacy proxies
    if (this.cardModeVal) this.cardModeVal.textContent = isLava ? '???' : getCleanLabel(this.modeInput);
    if (this.cardMapVal) this.cardMapVal.textContent = getCleanLabel(this.mapInput);
    if (this.cardCompanionVal) this.cardCompanionVal.textContent = getCleanLabel(this.companionInput);
    if (this.cardDifficultyVal) this.cardDifficultyVal.textContent = isLava ? '???' : getCleanLabel(this.difficultyInput);
    if (this.cardAccessoryVal) this.cardAccessoryVal.textContent = getCleanLabel(this.accessoryInput);

    // Update active states on cards
    const updateRowCards = (row, currVal, category) => {
      if (!row) return;
      row.querySelectorAll('.setup-option-card').forEach(card => {
        const val = card.dataset.value;
        const isSel = (val === currVal);
        card.classList.toggle('setup-option-card--selected', isSel);
        card.setAttribute('aria-checked', String(isSel));

        let locked = false;
        if (category === 'map') {
          locked = !isOwned(profile, 'map', val);
        } else if (category === 'companion') {
          locked = (guest && val !== 'none') || (!guest && val !== 'none' && !isOwned(profile, 'pet', val));
        }
        card.classList.toggle('setup-option-card--locked', locked);

        if (category === 'map' && val === 'lava') {
          card.classList.toggle('setup-option-card--lava', isLava && isSel);
        }
      });
    };

    updateRowCards(this.rowMode, isLava ? 'boss_legendary' : modeVal, 'mode');
    updateRowCards(this.rowMap, mapVal, 'map');
    updateRowCards(this.rowCompanion, compVal, 'companion');
    updateRowCards(this.rowDifficulty, isLava ? 'quemado' : diffVal, 'difficulty');

    // Lava state on bars
    if (this.catBarMap) this.catBarMap.classList.toggle('setup-category--lava', isLava);
    if (this.catBarMode) this.catBarMode.classList.toggle('setup-category--locked-lava', isLava);
    if (this.catBarDifficulty) this.catBarDifficulty.classList.toggle('setup-category--locked-lava', isLava);

    // Scroll active card into view in scrollable rows
    const scrollSelectedIntoView = (row) => {
      const sel = row?.querySelector('.setup-option-card--selected');
      if (sel && row) {
        const rLeft = row.scrollLeft;
        const rWidth = row.clientWidth;
        const cLeft = sel.offsetLeft;
        const cWidth = sel.clientWidth;
        if (cLeft < rLeft || (cLeft + cWidth) > (rLeft + rWidth)) {
          row.scrollTo({ left: Math.max(0, cLeft - 10), behavior: 'smooth' });
        }
      }
    };
    scrollSelectedIntoView(this.rowMap);
    scrollSelectedIntoView(this.rowCompanion);

    // Thumbnail for accessory
    this.renderCardThumbnail(this.cardAccessory, 'accessory', this.accessoryInput?.value || 'none');

    // Briefing de Zona del mapa activo
    this.renderMapBriefing(mapVal);

    refreshIcons();
    this.fitSetup();
  }

  renderMapBriefing(mapId) {
    const root = document.querySelector('#setupMapBriefing');
    if (!root) return;

    const r = REGIONS.find(reg => reg.id === mapId) || REGIONS[0];
    const missions = getCartographyMissions();
    const m = missions[r.missionId] || { progress: 0, target: r.target, completed: false };
    const profile = currentAccount();
    const guest = isGuest();
    const isOwnedAcc = !guest && (isOwned(profile, 'accessory', r.accessoryId) || m.completed);
    const isEquipped = !guest && ((profile?.loadout?.accessory === r.accessoryId) || (this.accessoryInput?.value === r.accessoryId));
    const curr = Math.min(r.target, m.progress || 0);
    const pct = Math.min(100, Math.round((curr / r.target) * 100));
    const isCompleted = m.completed || curr >= r.target;

    root.innerHTML = `
      <div class="setup-card setup-card--purple setup-card--compact setup-mission-card">
        <div class="setup-card__icon-box setup-mission-card__icon">
          <canvas class="setup-mission-canvas" width="44" height="44" aria-hidden="true"></canvas>
        </div>
        <div class="setup-card__content setup-mission-card__content">
          <div class="setup-mission-topline">
            <span class="setup-card__label">RECOMPENSA: ${r.accessoryName.toUpperCase()}</span>
            <span class="setup-mission-ratio ${isCompleted ? 'is-done' : ''}">${isCompleted ? '✓ COMPLETADA' : `${curr} / ${r.target}`}</span>
          </div>
          <strong class="setup-card__value setup-mission-goal">${r.missionDesc}</strong>
          <div class="setup-mission-meter" role="progressbar" aria-valuenow="${curr}" aria-valuemin="0" aria-valuemax="${r.target}">
            <div class="setup-mission-meter-fill ${isCompleted ? 'is-done' : ''}" style="width: ${pct}%;"></div>
          </div>
        </div>
        ${!guest && isOwnedAcc ? `
          <div class="setup-mission-action">
            ${isEquipped 
              ? `<span class="setup-mission-pill is-equipped">✓ EQUIPADO</span>`
              : `<button type="button" class="setup-mission-equip-btn" data-equip-acc="${r.accessoryId}">⚡ EQUIPAR</button>`
            }
          </div>
        ` : ''}
      </div>
    `;

    const accCv = root.querySelector('.setup-mission-canvas');
    if (accCv) {
      const actx = accCv.getContext('2d');
      actx.clearRect(0, 0, 44, 44);
      drawAccessoryIcon(actx, r.accessoryId, 22, 22, 36);
    }

    root.querySelector('[data-equip-acc]')?.addEventListener('click', (e) => {
      const accId = e.currentTarget.dataset.equipAcc;
      if (!accId) return;
      try {
        equip('accessory', accId);
      } catch {}
      if (this.accessoryInput) {
        this.accessoryInput.value = accId;
        this.accessoryInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      this.game.audio?.play?.('confirm');
      this.game.showToast?.(`¡${r.accessoryName} equipado con éxito!`);
      this.syncCards();
    });
  }

  setSetupStep(step = 1) {
    this.setupStep = step;
    const s1 = document.querySelector('#setupStep1');
    const s2 = document.querySelector('#setupStep2');
    const t1 = document.querySelector('#tabStep1');
    const t2 = document.querySelector('#tabStep2');
    if (s1 && s2) {
      s1.hidden = (step !== 1);
      s2.hidden = (step !== 2);
    }
    if (t1 && t2) {
      t1.classList.toggle('setup-step-tab--active', step === 1);
      t2.classList.toggle('setup-step-tab--active', step === 2);
    }
    this.fitSetup();
  }

  fitSetup() {
    const screen = document.querySelector('#setupScreen');
    const panel = screen?.querySelector('.setup-panel');
    if (!panel || !screen.classList.contains('screen--active')) return;
    if (window.innerWidth <= 768) {
      panel.style.zoom = '1';
      return;
    }
    const details = panel.querySelector('.controls-guide');
    const wasOpen = details?.open;
    if (wasOpen) details.open = false;
    panel.style.zoom = '1';
    const style = getComputedStyle(screen);
    const availableH = screen.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const availableW = screen.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const neededH = panel.scrollHeight, neededW = panel.scrollWidth;
    if (!neededH || !neededW || availableH <= 0) {
      if (wasOpen) details.open = true;
      return;
    }
    const zoom = Math.max(0.65, Math.min(1.5, availableH / neededH, availableW / neededW));
    panel.style.zoom = String(Math.floor(zoom * 100) / 100);
    if (wasOpen) details.open = true;
  }

  restoreSetup() {
    try {
      const saved = JSON.parse(localStorage.getItem('domi2pancho.setup')) || {};
      if (skins[saved.skinId]) this.selectedSkin = saved.skinId;
      if (weapons[saved.weaponId]) this.selectedWeapon = saved.weaponId;
      for (const [input, value] of [[this.difficultyInput,saved.difficultyId],[this.mapInput,saved.mapId],[this.modeInput,saved.modeId],[this.companionInput,saved.companionId],[this.accessoryInput,saved.accessoryId]]) {
        if ([...input.options].some(option=>option.value===value)) input.value=value;
      }
    } catch {}
    this.syncCards();
  }

  renderOptions() {
    if (!isOwned(currentAccount(),'skin',this.selectedSkin)) this.selectedSkin='pancho';
    this.renderCards("#skinOptions", skins, "selectedSkin");
    this.renderCards("#weaponOptions", weapons, "selectedWeapon");
    this.syncCards();
  }

  prepareAccount(){const p=currentAccount();if(!p)return;
    this.setSetupStep(1);
    const guest = isGuest();
    this.nameInput.value=p.name;
    this.selectedSkin=p.loadout.skin;
    this.mapInput.value=p.loadout.map;
    this.companionInput.value=guest ? 'none' : p.loadout.pet;
    this.accessoryInput.value=guest ? 'none' : p.loadout.accessory;
    for(const [input,type] of [[this.mapInput,'map'],[this.companionInput,'pet'],[this.accessoryInput,'accessory']]){
      for(const option of input.options){
        let owned = isOwned(p,type,option.value);
        if (guest && (type === 'pet' || type === 'accessory') && option.value !== 'none') {
          owned = false;
        }
        option.disabled=!owned;
        if (type === 'map' && option.value === 'lava') {
          option.textContent = owned ? '07 / Caldero de Lava' : '💀 ??? [BLOQUEADO]';
        } else if (guest && (type === 'pet' || type === 'accessory') && option.value !== 'none') {
          option.textContent = option.textContent.replace(/ \[(TIENDA|SOLO SOCIOS)\]$/, '') + ' [SOLO SOCIOS]';
        } else {
          option.textContent=option.textContent.replace(/ \[(TIENDA|SOLO SOCIOS)\]$/, '')+(owned?'':' [TIENDA]');
        }
      }
    }
    this.renderAllCardCanvases();
    this.renderOptions();
    this.syncCards();
  }

  renderCards(selector, records, selectedKey) {
    const root = document.querySelector(selector);
    root.innerHTML = "";
    Object.values(records).forEach((record) => {
      const locked=selectedKey==='selectedSkin'&&!isOwned(currentAccount(),'skin',record.id);
      const button = document.createElement("button");
      button.className = `option-card ${this[selectedKey] === record.id ? "option-card--selected" : ""} ${locked?'option-card--locked':''}`;
      button.disabled=locked;
      button.setAttribute('aria-pressed', String(this[selectedKey] === record.id));

      if (selectedKey === 'selectedSkin') {
        const stage = document.createElement('div');
        stage.className = 'pedestal-stage';

        const beam = document.createElement('div');
        beam.className = 'pedestal-beam';

        const portrait = document.createElement('canvas');
        portrait.width = 128;
        portrait.height = 120;
        portrait.className = 'option-portrait';
        portrait.setAttribute('aria-hidden', 'true');
        drawFood(portrait.getContext('2d'), record.id, 64, 58, 1.8);

        const base = document.createElement('div');
        base.className = 'pedestal-base';
        base.innerHTML = '<div class="pedestal-plate"></div><div class="pedestal-skirt"></div>';

        stage.append(beam, portrait, base);
        button.append(stage);

        const heading = document.createElement('strong');
        heading.textContent = record.name;
        button.append(heading);

        const stat = document.createElement('span');
        stat.className = 'item-stat';
        stat.textContent = `VIDA ${record.maxHp} / VEL ${record.speed}`;
        button.append(stat);

        if (locked) {
          const lockNote = document.createElement('span');
          lockNote.className = 'pedestal-locked';
          lockNote.textContent = 'En tienda';
          button.append(lockNote);
        }
      } else {
        const stage = document.createElement('div');
        stage.className = 'pedestal-stage pedestal-stage--weapon';

        const beam = document.createElement('div');
        beam.className = 'pedestal-beam';

        const portrait = document.createElement('canvas');
        portrait.width = 64;
        portrait.height = 56;
        portrait.className = 'weapon-portrait';
        portrait.setAttribute('aria-hidden', 'true');
        drawWeapon(portrait.getContext('2d'), record.id, 32, 28, .75);

        const base = document.createElement('div');
        base.className = 'pedestal-base pedestal-base--compact';
        base.innerHTML = '<div class="pedestal-plate"></div><div class="pedestal-skirt"></div>';

        stage.append(beam, portrait, base);
        button.append(stage);

        const heading = document.createElement('strong');
        heading.textContent = record.name;
        button.append(heading);

        const stat = document.createElement('span');
        stat.className = 'item-stat';
        stat.textContent = `DANO ${record.damage} / ${(1/record.fireRate).toFixed(1)} T/S`;
        button.append(stat);
      }

      button.addEventListener("click", () => {
        this[selectedKey] = record.id;
        this.renderOptions();
      });
      root.append(button);
    });
  }

  showSkins(){
    const root=document.querySelector('#skinsPreview');root.replaceChildren();
    for(const skin of Object.values(skins)){
      const card=document.createElement('article');card.className='skin-preview';
      const image=document.createElement('canvas');image.width=128;image.height=110;drawFood(image.getContext('2d'),skin.id,64,54,1.7);
      const owned=isOwned(currentAccount(),'skin',skin.id);
      const heading=document.createElement('strong');heading.textContent=owned?skin.name:'???';
      const detail=document.createElement('span');detail.textContent=owned?`Vida ${skin.maxHp} / Velocidad ${Math.round(skin.speed)} / Defensa ${skin.defense.toFixed(1)}`:'Disponible en la tienda.';
      card.append(image,heading,detail);root.append(card);
    }
    this.game.showScreen('skinsScreen');
  }

  showAchievements(){
    const unlocked=new Set(unlockedAchievements().map(item=>item.id)),stats=readAchievementStats(),root=document.querySelector('#achievementsList');
    document.querySelector('#achievementsScreen h2').textContent=`Logros ${unlocked.size} / ${achievements.length}`;
    root.replaceChildren();
    for(const item of achievements){
      const card=document.createElement('article');card.className=`achievement ${unlocked.has(item.id)?'achievement--unlocked':''}`;
      const name=document.createElement('strong');name.textContent=`${unlocked.has(item.id)?'★':'◇'} ${item.name}`;
      const description=document.createElement('span');description.textContent=item.description;
      let progress=0,goal=1;if(item.id==='firstBite'){progress=stats.kills;goal=10;}if(item.id==='ketchupFan'){progress=stats.pickups.ketchup||0;goal=20;}if(item.id==='immortal'){progress=stats.seconds;goal=600;}if(item.id==='delivery'){progress=stats.distance;goal=1000000;}if(item.id==='chef'){progress=stats.bosses;goal=1;}if(item.id==='comboKing'){progress=stats.bosses;goal=3;}
      const status=document.createElement('small');status.textContent=unlocked.has(item.id)?'Desbloqueado':item.id==='immortal'?`${Math.floor(progress/60)} / 10 min`:item.id==='firstBite'?`${progress} / 10`:item.id==='ketchupFan'?`${progress} / 20`:item.id==='delivery'?`${(progress/100).toFixed(0)} / 10.000 m`:`${stats.bosses} / ${item.id==='comboKing'?3:1} jefes`;
      const meter=document.createElement('progress');meter.max=goal;meter.value=Math.min(progress,goal);meter.setAttribute('aria-label',`Progreso de ${item.name}`);
      card.append(name,description,meter,status);root.append(card);
    }
    this.game.showScreen('achievementsScreen');
  }

  showOptions(){
    const audio=this.game.audio;
    document.querySelector('#musicToggle').checked=audio.musicEnabled;
    document.querySelector('#sfxToggle').checked=audio.sfxEnabled;
    document.querySelector('#volumeSlider').value=audio.volume;
    this.game.showScreen('optionsScreen');
  }

  bindOptions(){
    const audio=this.game.audio;
    document.querySelector('#musicToggle').addEventListener('change',event=>audio.setMusic(event.target.checked));
    document.querySelector('#sfxToggle').addEventListener('change',event=>audio.setSfx(event.target.checked));
    document.querySelector('#volumeSlider').addEventListener('input',event=>audio.setVolume(event.target.value));
    document.querySelector('#clearRankingButton').addEventListener('click',()=>{
      if(confirm('Se borraran las 10 mejores partidas guardadas en este navegador. Continuar?')){
        try{localStorage.removeItem('domi2pancho.ranking');}catch{}clearAccountRuns();this.game.showToast('Ranking borrado.');
      }
    });
    document.querySelector('#clearAchievementsButton').addEventListener('click',()=>{
      if(confirm('Se borrara todo el progreso de logros. Continuar?')){
        const sessionKey = sessionStorage.getItem('domi2pancho.session.v1') || currentAccount()?.name.trim().toLocaleLowerCase('es');
        try{localStorage.removeItem(sessionKey ? `domi2pancho.achievements.${sessionKey}` : 'domi2pancho.achievements');}catch{}this.game.showToast('Progreso de logros borrado.');
        this.renderOptions();
      }
    });
  }
}
