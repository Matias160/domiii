import { primes } from '../systems/primeSystem.js';

const TOUCH_KEY = 'domi_touch_controls';
// El almacenamiento puede estar bloqueado (modo privado, cookies apagadas): nunca debe romper el juego
function readPreference() { try { return localStorage.getItem(TOUCH_KEY); } catch { return null; } }
function writePreference(value) { try { if (value === null) localStorage.removeItem(TOUCH_KEY); else localStorage.setItem(TOUCH_KEY, value); } catch {} }
// Solo toca el DOM cuando el valor cambia (se llama en cada cuadro)
function setText(node, text) { if (node && node.textContent !== text) node.textContent = text; }

export class TouchControls {
  constructor(game) {
    this.game = game;
    this.enabled = false;
    this.forced = readPreference();
    this.isTouch = this.detectTouch();
    this.joystickPointerId = null;
    this.baseX = 0;
    this.baseY = 0;
    this.maxRadius = 46;
    this.domCreated = false;

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.initDOM();
      this.bindEvents();
      this.updateVisibility();
    }
  }

  detectTouch() {
    if (typeof window === 'undefined') return false;
    if (this.forced === 'true') return true;
    if (this.forced === 'false') return false;
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia?.('(pointer: coarse)')?.matches;
  }

  setForced(value) {
    this.forced = value === null ? null : String(Boolean(value));
    writePreference(this.forced);
    this.isTouch = this.detectTouch();
    this.updateVisibility();
  }

  initDOM() {
    if (this.domCreated || document.querySelector('#mobileControlsLayer')) return;
    this.domCreated = true;

    const layer = document.createElement('div');
    layer.id = 'mobileControlsLayer';
    layer.className = 'mobile-controls-layer';
    layer.setAttribute('aria-hidden', 'true');

    layer.innerHTML = `
      <!-- Zona del Joystick Táctil (Izquierda) -->
      <div id="mobileJoystickZone" class="mobile-joystick-zone">
        <div id="mobileJoystickBase" class="mobile-joystick-base">
          <div class="joystick-ring-outer"></div>
          <div class="joystick-crosshair-h"></div>
          <div class="joystick-crosshair-v"></div>
          <div id="mobileJoystickKnob" class="mobile-joystick-knob">
            <div class="knob-pip"></div>
          </div>
        </div>
      </div>

      <!-- Barra de Acciones Rápidas Superior Móvil -->
      <div id="mobileTopActions" class="mobile-top-actions">
        <button type="button" id="mobilePauseBtn" class="mobile-icon-btn" aria-label="Pausa">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        </button>
        <button type="button" id="mobileAimBtn" class="mobile-icon-btn" aria-label="Alternar Puntería">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="8" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </button>
      </div>

      <!-- Zona de Botones de Acción (Derecha) -->
      <div id="mobileActionsZone" class="mobile-actions-zone">
        <!-- Primes / Poderes (Q, E, R) -->
        <div id="mobilePrimesCluster" class="mobile-primes-cluster">
          <button type="button" id="mobilePrimeQ" class="mobile-prime-btn" data-key="q" aria-label="Ráfaga 360">
            <span class="prime-btn-badge">Q</span>
            <span class="prime-btn-symbol">✳</span>
            <span class="prime-btn-cool"></span>
            <div class="prime-btn-meter"></div>
          </button>
          <button type="button" id="mobilePrimeE" class="mobile-prime-btn" data-key="e" aria-label="Doble señuelo">
            <span class="prime-btn-badge">E</span>
            <span class="prime-btn-symbol">◈</span>
            <span class="prime-btn-cool"></span>
            <div class="prime-btn-meter"></div>
          </button>
          <button type="button" id="mobilePrimeR" class="mobile-prime-btn" data-key="r" aria-label="Campana blindada">
            <span class="prime-btn-badge">R</span>
            <span class="prime-btn-symbol">⬡</span>
            <span class="prime-btn-cool"></span>
            <div class="prime-btn-meter"></div>
          </button>
        </div>

        <!-- Botón de Dash / Acelerón -->
        <button type="button" id="mobileDashBtn" class="mobile-dash-btn" aria-label="Acelerón">
          <svg class="mobile-dash-svg" viewBox="0 0 24 24" width="30" height="30" shape-rendering="crispEdges">
            <polygon points="13,2 6,13 12,13 9,22 19,10 13,10" fill="#22d3ee" />
            <polygon points="13,4 8,12 12,12 10,19 17,11 13,11" fill="#ffe066" />
          </svg>
          <span class="mobile-dash-text">DASH</span>
          <span id="mobileDashTimer" class="mobile-dash-timer"></span>
          <svg class="mobile-dash-cooldown-ring" viewBox="0 0 68 68">
            <circle class="ring-bg" cx="34" cy="34" r="30" />
            <circle id="mobileDashRingFill" class="ring-fill" cx="34" cy="34" r="30" />
          </svg>
        </button>

        <!-- Botón de Interactuar en Lobby (E) -->
        <button type="button" id="mobileInteractBtn" class="mobile-interact-btn" hidden aria-label="Interactuar">
          <span>ENTRAR</span>
          <kbd class="pixel-key">E</kbd>
        </button>
      </div>
    `;

    const app = document.querySelector('#app') || document.body;
    app.appendChild(layer);

    this.layer = layer;
    this.joystickZone = layer.querySelector('#mobileJoystickZone');
    this.joystickBase = layer.querySelector('#mobileJoystickBase');
    this.joystickKnob = layer.querySelector('#mobileJoystickKnob');
    this.dashBtn = layer.querySelector('#mobileDashBtn');
    this.dashTimer = layer.querySelector('#mobileDashTimer');
    this.dashRingFill = layer.querySelector('#mobileDashRingFill');
    this.interactBtn = layer.querySelector('#mobileInteractBtn');
    this.primeBtns = {
      q: layer.querySelector('#mobilePrimeQ'),
      e: layer.querySelector('#mobilePrimeE'),
      r: layer.querySelector('#mobilePrimeR'),
    };
    this.pauseBtn = layer.querySelector('#mobilePauseBtn');
    this.aimBtn = layer.querySelector('#mobileAimBtn');
  }

  bindEvents() {
    if (!this.joystickZone) return;

    // === JOYSTICK TÁCTIL VIRTUAL DINÁMICO ===
    const onTouchStart = (event) => {
      if (this.joystickPointerId !== null) return;
      event.preventDefault();
      const touch = event.changedTouches ? event.changedTouches[0] : event;
      this.joystickPointerId = touch.identifier ?? event.pointerId ?? 1;

      const rect = this.joystickZone.getBoundingClientRect();
      const clientX = touch.clientX;
      const clientY = touch.clientY;

      this.baseX = clientX;
      this.baseY = clientY;

      this.joystickBase.style.left = `${clientX}px`;
      this.joystickBase.style.top = `${clientY}px`;
      this.joystickBase.style.transform = 'translate(-50%, -50%)';
      this.joystickBase.classList.add('is-active');
      this.joystickKnob.style.transform = 'translate(0px, 0px)';
    };

    const onTouchMove = (event) => {
      if (this.joystickPointerId === null) return;
      event.preventDefault();

      let touch = null;
      if (event.changedTouches) {
        for (let i = 0; i < event.changedTouches.length; i++) {
          if (event.changedTouches[i].identifier === this.joystickPointerId) {
            touch = event.changedTouches[i];
            break;
          }
        }
      } else if ((event.pointerId ?? 1) === this.joystickPointerId) {
        touch = event;
      }
      if (!touch) return;

      const dx = touch.clientX - this.baseX;
      const dy = touch.clientY - this.baseY;
      const dist = Math.hypot(dx, dy);

      const maxR = this.maxRadius;
      const clampedDist = Math.min(dist, maxR);
      const angle = Math.atan2(dy, dx);

      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

      // Zona muerta mínima para no temblar
      if (dist < 4) {
        this.game.input.touchAxis = { x: 0, y: 0 };
      } else {
        this.game.input.touchAxis = {
          x: knobX / maxR,
          y: knobY / maxR
        };
      }
    };

    const onTouchEnd = (event) => {
      if (this.joystickPointerId === null) return;
      let matched = false;
      if (event.changedTouches) {
        for (let i = 0; i < event.changedTouches.length; i++) {
          if (event.changedTouches[i].identifier === this.joystickPointerId) {
            matched = true;
            break;
          }
        }
      } else if ((event.pointerId ?? 1) === this.joystickPointerId) {
        matched = true;
      }
      if (!matched) return;

      event.preventDefault();
      this.joystickPointerId = null;
      this.game.input.touchAxis = { x: 0, y: 0 };
      this.joystickKnob.style.transform = 'translate(0px, 0px)';
      this.joystickBase.classList.remove('is-active');

      // Regresar suavemente a la posición de descanso en pantalla
      this.joystickBase.style.left = '';
      this.joystickBase.style.top = '';
      this.joystickBase.style.transform = '';
    };

    // Usar PointerEvents si están soportados, o TouchEvents
    if (window.PointerEvent) {
      this.joystickZone.addEventListener('pointerdown', onTouchStart, { passive: false });
      window.addEventListener('pointermove', onTouchMove, { passive: false });
      window.addEventListener('pointerup', onTouchEnd, { passive: false });
      window.addEventListener('pointercancel', onTouchEnd, { passive: false });
    } else {
      this.joystickZone.addEventListener('touchstart', onTouchStart, { passive: false });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd, { passive: false });
      window.addEventListener('touchcancel', onTouchEnd, { passive: false });
    }

    // === BOTÓN DE DASH TÁCTIL ===
    const triggerDash = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Durante la entrada del jefe, el botón grande sirve para saltearla
      if (this.game.entrance) { this.game.skipEntrance?.(); return; }
      if (this.game.running && this.game.state?.player) {
        if (this.game.state.player.dashCooldown <= 0) {
          this.game.input.pressed.add(' ');
          this.dashBtn.classList.add('dash-pressed');
          setTimeout(() => this.dashBtn.classList.remove('dash-pressed'), 120);
          if (navigator.vibrate) navigator.vibrate(20);
        }
      }
    };
    this.dashBtn.addEventListener('pointerdown', triggerDash);

    // === BOTONES DE PRIMES (Q, E, R) ===
    ['q', 'e', 'r'].forEach(key => {
      const btn = this.primeBtns[key];
      if (!btn) return;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.game.running) {
          const ok = this.game.triggerPrime(key);
          if (ok && navigator.vibrate) navigator.vibrate([15, 25, 20]);
        }
      });
    });

    // === BOTÓN DE INTERACTUAR (LOBBY) ===
    this.interactBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.game.lobby?.near) {
        this.game.lobby.activate(this.game.lobby.near.id);
        if (navigator.vibrate) navigator.vibrate(15);
      }
    });

    // === BOTÓN DE PAUSA MÓVIL ===
    this.pauseBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.game.running) this.game.pause();
    });

    // === BOTÓN DE APUNTADO MÓVIL ===
    this.aimBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelector('#aimButton')?.click();
    });

    // Resize / orientación
    const handleOrientation = () => {
      const isPortrait = (window.innerHeight > window.innerWidth) && (window.innerWidth <= 950);
      if (isPortrait && this.game.running) {
        this.game.pause();
      }
      this.updateVisibility();
    };

    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', () => setTimeout(handleOrientation, 150));

    // Botón de pantalla completa / bloqueo horizontal
    const fsBtn = document.querySelector('#rotateFullscreenBtn');
    if (fsBtn) {
      fsBtn.addEventListener('click', async () => {
        try {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
          if (screen.orientation?.lock) {
            await screen.orientation.lock('landscape');
          }
        } catch {
          // Ignorar restricciones del navegador si no se permite bloqueo programático
        }
      });
    }
  }

  onScreenChange(screenId) {
    this.currentScreen = screenId;
    this.updateVisibility();
  }

  updateVisibility() {
    if (!this.layer) return;
    const shouldShow = (this.isTouch || this.forced === 'true') && 
      ['gameScreen', 'lobbyScreen'].includes(this.currentScreen);

    this.layer.style.display = shouldShow ? 'block' : 'none';
    // Con controles táctiles, la ayuda de teclado del local sobra y tapa el joystick
    document.body.classList.toggle('touch-controls-on', shouldShow);

    // Ajustar visibilidad de botones según sea partida o lobby
    const inLobby = this.currentScreen === 'lobbyScreen';
    if (this.dashBtn) this.dashBtn.hidden = inLobby;
    if (this.primeBtns.q) this.primeBtns.q.parentElement.hidden = inLobby;
    if (this.pauseBtn) this.pauseBtn.parentElement.hidden = inLobby;

    if (this.interactBtn) {
      const showInteract = inLobby && Boolean(this.game.lobby?.near);
      this.interactBtn.hidden = !showInteract;
      if (showInteract && this.game.lobby?.near) {
        this.interactBtn.querySelector('span').textContent = this.game.lobby.near.label || 'INTERACTUAR';
      }
    }
  }

  update(state) {
    if (!this.layer || this.layer.style.display === 'none') return;
    // En el local no hay partida: solo se actualiza el botón de interactuar
    if (this.currentScreen === 'lobbyScreen' && this.interactBtn) {
      const near = this.game.lobby?.near;
      this.interactBtn.hidden = !near;
      if (near) setText(this.interactBtn.querySelector('span'), near.label || 'INTERACTUAR');
    }
    if (!state) return;

    // Actualizar Dash en pantalla móvil
    const p = state.player;
    if (p && this.dashBtn) {
      const isReady = p.dashCooldown <= 0;
      const maxDashCd = 2.8 * (p.dashCooldownMultiplier || 1);
      const pct = Math.max(0, Math.min(1, 1 - p.dashCooldown / maxDashCd));

      this.dashBtn.dataset.ready = String(isReady);
      this.dashBtn.disabled = !isReady;
      setText(this.dashTimer, p.dashTime > 0 ? 'DASH!' : p.dashCooldown > 0 ? `${p.dashCooldown.toFixed(1)}s` : 'LISTO');

      // Anillo circular de enfriamiento (stroke-dashoffset para radio 30: circunferencia ~ 188.5)
      const circ = 188.5;
      const offset = circ * (1 - pct);
      if (this.dashRingFill) {
        this.dashRingFill.style.strokeDashoffset = isReady ? '0' : String(offset);
        this.dashRingFill.style.stroke = isReady ? '#22d3ee' : '#eab308';
      }
    }

    // Actualizar Primes en pantalla móvil
    const allUnlocked = state.mapId === 'lava';
    for (const prime of primes) {
      const btn = this.primeBtns[prime.key];
      if (!btn) continue;
      const locked = !allUnlocked && p.level < prime.level;
      const cool = state.primeCooldowns[prime.key] || 0;
      const isReady = !locked && cool <= 0;

      btn.disabled = !isReady;
      btn.dataset.status = locked ? 'locked' : isReady ? 'ready' : 'cooldown';

      const coolText = btn.querySelector('.prime-btn-cool');
      const meter = btn.querySelector('.prime-btn-meter');
      if (locked) {
        setText(coolText, `NV ${prime.level}`);
        meter.style.height = '0%';
      } else if (cool > 0) {
        setText(coolText, `${Math.ceil(cool)}s`);
        meter.style.height = `${(1 - cool / prime.cooldown) * 100}%`;
      } else {
        setText(coolText, 'LISTO');
        meter.style.height = '100%';
      }
    }

  }
}
