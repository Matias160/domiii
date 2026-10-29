import { skins } from "../data/skins.js";
import { weapons } from "../data/weapons.js";
import { drawFood, drawWeapon } from "../core/art.js";
import { drawItemPreview } from "../core/presentation.js";
import { unlockedAchievements, readAchievementStats, achievements } from "../systems/achievementSystem.js";
import {currentAccount, clearAccountRuns, isGuest, getCartographyMissions, equip} from '../systems/accountSystem.js';
import {isOwned} from '../data/shop.js';
import {refreshIcons} from './icons.js';
import {REGIONS} from './atlasScreen.js';
import {drawAccessoryIcon} from '../core/accessories.js';

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

    this.cardMode = document.querySelector('#cardMode');
    this.cardMap = document.querySelector('#cardMap');
    this.cardCompanion = document.querySelector('#cardCompanion');
    this.cardDifficulty = document.querySelector('#cardDifficulty');
    this.cardAccessory = document.querySelector('#cardAccessory');

    this.cardModeVal = document.querySelector('#cardModeVal');
    this.cardMapVal = document.querySelector('#cardMapVal');
    this.cardCompanionVal = document.querySelector('#cardCompanionVal');
    this.cardDifficultyVal = document.querySelector('#cardDifficultyVal');
    this.cardAccessoryVal = document.querySelector('#cardAccessoryVal');

    this.bindCards();
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

  bindCards() {
    const bindCycle = (card, input) => {
      if (!card || !input) return;
      card.addEventListener('click', () => this.cycleOption(input));
    };
    bindCycle(this.cardMode, this.modeInput);
    bindCycle(this.cardMap, this.mapInput);
    bindCycle(this.cardCompanion, this.companionInput);
    bindCycle(this.cardDifficulty, this.difficultyInput);
    bindCycle(this.cardAccessory, this.accessoryInput);

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

  updateDifficultyCard(diff, isLava) {
    if (!this.cardDifficulty) return;
    const box = this.cardDifficulty.querySelector('.setup-card__icon-box');
    if (!box) return;

    this.cardDifficulty.classList.remove('setup-card--green', 'setup-card--amber', 'setup-card--orange', 'setup-card--red');

    if (isLava || diff === 'quemado') {
      this.cardDifficulty.classList.add('setup-card--red');
    } else if (diff === 'extra') {
      this.cardDifficulty.classList.add('setup-card--orange');
    } else if (diff === 'suave') {
      this.cardDifficulty.classList.add('setup-card--green');
    } else {
      this.cardDifficulty.classList.add('setup-card--amber');
    }

    box.innerHTML = this.getDifficultySkullSvg(diff, isLava);
  }

  getDifficultySkullSvg(diff, isLava) {
    if (isLava || diff === 'quemado') {
      return `<svg viewBox="0 0 24 24" class="card-icon-pixel" shape-rendering="crispEdges" aria-hidden="true">
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
    // 'picante' (normal/amber)
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

  syncCards() {
    const isLava = this.mapInput?.value === 'lava';
    const getCleanLabel = (sel) => {
      if (!sel || !sel.options || sel.selectedIndex < 0) return '';
      const opt = sel.options[sel.selectedIndex];
      return opt ? opt.textContent.replace(/ \[TIENDA\]$/, '').replace(/ \[BLOQUEADO\]$/, '') : '';
    };

    if (this.cardModeVal) {
      this.cardModeVal.textContent = isLava ? '???' : getCleanLabel(this.modeInput);
    }
    if (this.cardMapVal) this.cardMapVal.textContent = getCleanLabel(this.mapInput);
    if (this.cardCompanionVal) this.cardCompanionVal.textContent = getCleanLabel(this.companionInput);
    if (this.cardDifficultyVal) {
      this.cardDifficultyVal.textContent = isLava ? '???' : getCleanLabel(this.difficultyInput);
    }
    if (this.cardAccessoryVal) this.cardAccessoryVal.textContent = getCleanLabel(this.accessoryInput);

    if (this.cardMap) this.cardMap.classList.toggle('setup-card--lava', isLava);
    if (this.cardMode) this.cardMode.classList.toggle('setup-card--locked-lava', isLava);
    if (this.cardDifficulty) this.cardDifficulty.classList.toggle('setup-card--locked-lava', isLava);

    // Miniaturas visuales para mapa, mascota y accesorio
    this.renderCardThumbnail(this.cardMap, 'map', this.mapInput?.value || 'diner');
    this.renderCardThumbnail(this.cardCompanion, 'pet', this.companionInput?.value || 'none');
    this.renderCardThumbnail(this.cardAccessory, 'accessory', this.accessoryInput?.value || 'none');

    // Calavera dinámica y colores de tarjeta de dificultad
    this.updateDifficultyCard(this.difficultyInput?.value || 'picante', isLava);

    // Briefing de Zona del mapa activo (amenaza nativa, misión y accesorio)
    this.renderMapBriefing(this.mapInput?.value || 'diner');

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
      <div class="briefing-topbar">
        <div class="briefing-title-zone">
          <span class="briefing-badge" style="color: ${r.color}; border-color: ${r.color};">
            ${r.icon} MAPA 0${r.index}: ${r.name.toUpperCase()}
          </span>
          <span class="briefing-subtitle">${r.sub}</span>
        </div>
        <div class="briefing-map-selector" role="group" aria-label="Cambiar mapa de juego">
          ${REGIONS.map(reg => {
            const active = reg.id === r.id;
            const regOwned = isOwned(profile, 'map', reg.id);
            return `<button type="button" class="briefing-map-pill ${active ? 'is-active' : ''} ${!regOwned ? 'is-locked' : ''}" data-briefing-map="${reg.id}" title="${reg.name}${!regOwned ? ' [BLOQUEADO]' : ''}" style="${active ? `border-color: ${reg.color}; box-shadow: 0 0 10px ${reg.color}88;` : ''}">
              <span>${reg.icon}</span>
            </button>`;
          }).join('')}
        </div>
      </div>

      <div class="briefing-panels">
        <!-- 1. AMENAZA NATIVA -->
        <div class="briefing-panel briefing-panel--threat">
          <div class="briefing-panel-tag">
            <span class="briefing-tag-icon">👾</span>
            <span class="briefing-tag-label">AMENAZA NATIVA</span>
          </div>
          <div class="briefing-panel-content">
            <div class="briefing-canvas-frame">
              <canvas class="briefing-threat-canvas" width="48" height="48" aria-hidden="true"></canvas>
            </div>
            <div class="briefing-details">
              <strong class="briefing-name">${r.enemyName}</strong>
              <span class="briefing-role">${r.enemyRole}</span>
              <p class="briefing-text"><b class="briefing-text-hi">Peligro:</b> ${r.hazard}</p>
            </div>
          </div>
        </div>

        <!-- 2. MISIÓN ACUMULATIVA -->
        <div class="briefing-panel briefing-panel--mission">
          <div class="briefing-panel-tag">
            <span class="briefing-tag-icon">🎯</span>
            <span class="briefing-tag-label">MISIÓN DE ZONA</span>
            <span class="briefing-chip ${isCompleted ? 'is-done' : ''}">${isCompleted ? '✓ COMPLETADA' : 'EN CURSO'}</span>
          </div>
          <div class="briefing-panel-content briefing-panel-content--col">
            <strong class="briefing-name">${r.missionName}</strong>
            <p class="briefing-mission-goal">${r.missionDesc}</p>
            <div class="briefing-meter-wrap">
              <div class="briefing-meter-bar" role="progressbar" aria-valuenow="${curr}" aria-valuemin="0" aria-valuemax="${r.target}">
                <div class="briefing-meter-fill" style="width: ${pct}%;"></div>
              </div>
              <span class="briefing-meter-num">${curr} / ${r.target}</span>
            </div>
          </div>
        </div>

        <!-- 3. ACCESORIO EXCLUSIVO -->
        <div class="briefing-panel briefing-panel--reward">
          <div class="briefing-panel-tag">
            <span class="briefing-tag-icon">🎁</span>
            <span class="briefing-tag-label">ACCESORIO EXCLUSIVO</span>
          </div>
          <div class="briefing-panel-content">
            <div class="briefing-canvas-frame">
              <canvas class="briefing-reward-canvas" width="48" height="48" aria-hidden="true"></canvas>
            </div>
            <div class="briefing-details">
              <strong class="briefing-name">${r.accessoryName}</strong>
              <p class="briefing-text briefing-text--perk">${r.accessoryDesc}</p>
              <div class="briefing-btn-row">
                ${guest
                  ? `<button type="button" class="briefing-action-btn briefing-action-btn--locked" data-briefing-guest="1">🔒 SOLO SOCIOS</button>`
                  : isEquipped
                    ? `<button type="button" class="briefing-action-btn briefing-action-btn--equipped" disabled>✓ EQUIPADO</button>`
                    : isOwnedAcc
                      ? `<button type="button" class="briefing-action-btn briefing-action-btn--equip" data-equip-acc="${r.accessoryId}">⚡ EQUIPAR</button>`
                      : `<button type="button" class="briefing-action-btn briefing-action-btn--locked" disabled title="Completá la misión de este mapa para desbloquearlo">🔒 BLOQUEADO: Completa la misión</button>`
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Renderizar canvases pixel art
    const enemyCv = root.querySelector('.briefing-threat-canvas');
    if (enemyCv) {
      const ectx = enemyCv.getContext('2d');
      ectx.clearRect(0, 0, 48, 48);
      drawFood(ectx, r.enemyId, 24, 24, 0.70, 0, true);
    }

    const accCv = root.querySelector('.briefing-reward-canvas');
    if (accCv) {
      const actx = accCv.getContext('2d');
      actx.clearRect(0, 0, 48, 48);
      drawAccessoryIcon(actx, r.accessoryId, 24, 24, 38);
    }

    // Interacción con pills de mapa
    root.querySelectorAll('.briefing-map-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const targetMap = pill.dataset.briefingMap;
        if (!targetMap || !this.mapInput) return;
        const opt = [...this.mapInput.options].find(o => o.value === targetMap);
        if (opt && opt.disabled) {
          this.game.audio?.play?.('error');
          this.game.showToast?.('¡Este mapa aún está bloqueado en el local!');
          return;
        }
        this.mapInput.value = targetMap;
        this.mapInput.dispatchEvent(new Event('change', { bubbles: true }));
        this.game.audio?.play?.('navigate');
      });
    });

    // Interacción botón de invitado
    root.querySelector('[data-briefing-guest]')?.addEventListener('click', () => {
      this.game.audio?.play?.('error');
      this.game.showToast?.('¡Solo para socios! Creá tu tarjeta en la recepción para desbloquear accesorios.');
    });

    // Interacción botón equipar accesorio
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

  // El selector ocupa toda la pantalla sin scroll: se escala entero (zoom) para que entre justo,
  // achicándose en pantallas bajas y agrandándose en las grandes
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
