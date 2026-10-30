import { Input } from "./core/input.js";
import { drawDiner, drawFood, drawWeapon } from "./core/art.js";
import { drawPet } from "./core/presentation.js";
import { drawWorldProps } from "./core/worldProps.js";
import { skins } from "./data/skins.js";
import { phrases } from "./data/phrases.js";
import { getAbilityChoices, applyAbility, abilities as abilityCatalog, rarities } from "./data/abilities.js";
import { updateEnemies } from "./systems/enemySystem.js";
import { updateProjectiles } from "./systems/projectileSystem.js";
import { updatePlayer } from "./systems/playerSystem.js";
import { addSurvivalScore, resolveDeaths } from "./systems/scoreSystem.js";
import { getBestScore, getRanking, saveRun, qualifiesForRanking } from "./systems/rankingSystem.js";
import { Hud, formatTime } from "./ui/hud.js";
import { MenuScreen } from "./ui/menuScreen.js";
import { GameOverScreen } from "./ui/gameOverScreen.js";
import { updateItems, drawPickupAnimations } from "./systems/itemSystem.js";
import { AudioSystem } from "./systems/audioSystem.js";
import { recordRun, unlockedAchievements } from "./systems/achievementSystem.js";
import { updateEffects, capEffects, MUSTARD } from './systems/effectSystem.js';
import { createRunState } from './core/runState.js';
import { updateDirector, modes, RUSH_BOSS_GOAL } from './systems/directorSystem.js';
import { companions } from './entities/Companion.js';
import {currentAccount,logout,awardRun,grantItem,guestLogin,isGuest} from './systems/accountSystem.js';
import { weapons } from './data/weapons.js';
import { TouchControls } from './core/touchControls.js';
import { playSplash } from './ui/splash.js';
import {bindAuth} from './ui/authScreen.js';
import {isOwned} from './data/shop.js';
import {Lobby} from './ui/lobby.js';
import {Shop} from './ui/shop.js';
import {DomiScreen} from './ui/domi.js';
import {AtlasScreen} from './ui/atlasScreen.js';
import {PrizeMachine} from './ui/prizeMachine.js';
import {updateMap,drawMapObstacles} from './systems/mapSystem.js';
import {primes,updatePrimes,activatePrime,drawPrimeEffects} from './systems/primeSystem.js';
import {icon,refreshIcons,abilityIcons} from './ui/icons.js';
import {canvasPoint} from './core/presentation.js';
import {drawCombatFeedback, drawScreenCombatOverlays} from './ui/combatFeedback.js';
import {drawFloatingText, warmFloatingText} from './ui/floatingText.js';
import { HudCanvas } from './ui/hudCanvas.js';
import { enemyTypes } from './entities/Enemy.js';
import { trackFrame, resetQuality } from './core/quality.js';
import { bankCard, cardIsDue } from './systems/cardPacing.js';
import { startBossEntrance, startBossRage, updateBossEntrance, skipBossEntrance, drawBossEntranceWorld, drawBossEntranceScreen } from './ui/bossEntrance.js';
import { evolveWeapon } from './data/weaponEvolutions.js';
import { burst, damageEnemy } from './systems/effectSystem.js';
import { modLoader } from './mods/ModLoader.js';
import { FrostbiteMod } from './mods/sampleFrostMod.js';

const PAUSE_THEMES = [
  { border: '#00f0ff', glow: 'rgba(0, 240, 255, 0.65)' },
  { border: '#ff007f', glow: 'rgba(255, 0, 127, 0.65)' },
  { border: '#ffe066', glow: 'rgba(255, 224, 102, 0.7)' },
  { border: '#39ff14', glow: 'rgba(57, 255, 20, 0.65)' },
  { border: '#ff5500', glow: 'rgba(255, 85, 0, 0.7)' },
  { border: '#a855f7', glow: 'rgba(168, 85, 247, 0.65)' },
];

// Minimapa en coordenadas del visor (marco exterior incluido)
const MINIMAP = { x: 26, y: 82, w: 124, h: 68 };

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = new Input();
    this.hud = new Hud();
    // Carteles del combate (combo, jefe, evento, avisos, mejoras) dibujados como imágenes
    this.hudCanvas = new HudCanvas(document.querySelector('#app'));
    this.audio = new AudioSystem();
    this.menu = new MenuScreen(this);
    this.gameOver = new GameOverScreen(this);
    this.lobby=new Lobby(this);this.shop=new Shop(this);this.domi=new DomiScreen(this);this.atlas=new AtlasScreen(this);this.prizeMachine=new PrizeMachine(this);this.choice=null;
    this.renderSortBuffer = [];
    // Visor lógico de la partida: alto base 540, ancho según la proporción de la pantalla
    this.view = { w: 960, h: 540 };
    this.touchControls = new TouchControls(this);
    const touchToggle = document.querySelector('#touchToggle');
    if (touchToggle) {
      touchToggle.checked = this.touchControls.isTouch;
      touchToggle.addEventListener('change', () => this.touchControls.setForced(touchToggle.checked));
    }
    window.addEventListener('resize', () => { if (this.state && ['gameScreen','pauseScreen'].includes(this.screenId)) this.resizeView(); if (this.screenId === 'setupScreen') this.menu?.fitSetup?.(); });
    bindAuth(this);
    modLoader.loadMod(FrostbiteMod);
    document.querySelector('#logoutButton').addEventListener('click',()=>{
      logout();
      this.openAuth?.('login');
      this.showToast('Cerraste sesión.');
    });
    this.lastSetup = null;
    this.state = null;
    this.lastTime = 0;
    this.running = false;
    this.toast = document.querySelector("#toast");
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    refreshIcons();
    document.querySelector('#aimButton').addEventListener('click',()=>{
      if(!this.running)return;
      this.state.manualAim=!this.state.manualAim;
      this.state.aimPoint ||= {x:Math.min(900,this.state.player.x+120),y:this.state.player.y};
      this.updateAimButton();this.audio.play('navigate');
    });
    canvas.addEventListener('pointerdown',()=>{ if (this.entrance && this.running) skipBossEntrance(this.entrance); });
    canvas.addEventListener('pointermove',event=>{
      if(this.running){
        const point=canvasPoint(canvas.getBoundingClientRect(),this.view.w,this.view.h,event.clientX,event.clientY);
        if(point){
          const cam = this.state?.camera || { x: 0, y: 0 };
          this.state.aimPoint = { x: point.x + cam.x, y: point.y + cam.y };
        }
      }
    });
    document.querySelector('#pauseButton').addEventListener('click', () => this.pause());
    document.querySelector('#dashControl').addEventListener('click', () => {
      if (this.running && !this.choice && !this.entrance && this.state.player.dashCooldown <= 0) this.input.pressed.add(' ');
      document.querySelector('#dashControl').blur();
    });
    document.querySelector('#resumeButton').addEventListener('click', () => this.resume());
    document.querySelector('#primeIntroButton')?.addEventListener('click', () => this.closePrimeIntro(true));
    document.querySelector('#lobbyRegister')?.addEventListener('click', () => {
      this.audio?.play('confirm');
      this.openRegistration();
    });
    document.querySelector('#lobbyHelp')?.addEventListener('click', () => {
      this.audio?.play('navigate');
      this.showScreen('onboardingScreen');
    });
    document.querySelector('#onboardingProceedBtn')?.addEventListener('click', () => {
      this.audio?.play('door_bell');
      this.showScreen('lobbyScreen');
    });
    // No alterar zoom ni dimensiones al abrir o cerrar la guía de controles
    document.querySelector('#abandonButton').addEventListener('click', () => this.endRun('abandoned'));
    // Trucos secretos: escribir "domilava" fuera de partida (o Ctrl+Shift+L) desbloquea el Caldero de Lava;
    // escribir "killboss" o "matar" en partida (o Ctrl+Shift+K) liquida al jefe. También desde la consola.
    let secretBuffer = '';
    window.unlockLavaMap = window.unlockLava = () => this.unlockLavaCheat();
    window.killBoss = window.killFinalBoss = () => this.killBossCheat();
    window.addEventListener('keydown', event => {
      if (event.target.closest?.('input, select, textarea')) return;
      const key = event.key.toLowerCase();
      if (event.ctrlKey && event.shiftKey && key === 'l' && !this.running) { event.preventDefault(); this.unlockLavaCheat(); return; }
      if (event.ctrlKey && event.shiftKey && key === 'k' && this.running) { event.preventDefault(); this.killBossCheat(); return; }
      if (key.length === 1) {
        secretBuffer = (secretBuffer + key).slice(-8);
        if (!this.running && secretBuffer.endsWith('domilava')) { secretBuffer = ''; this.unlockLavaCheat(); return; }
        if (this.running && (secretBuffer.endsWith('killboss') || secretBuffer.endsWith('matar'))) { secretBuffer = ''; this.killBossCheat(); return; }
      }
      // Durante la entrada del jefe, espacio/enter la saltean
      if (this.entrance && this.running && [' ', 'Enter'].includes(event.key)) { skipBossEntrance(this.entrance); return; }
      if (this.screenId === 'onboardingScreen' && (key === 'e' || event.key === 'Enter' || event.key === ' ')) {
        this.audio?.play('door_bell');
        this.showScreen('lobbyScreen');
        return;
      }
      if (event.key === 'Escape' && !event.repeat) { if (this.running) this.pause(); else if (this.screenId === 'pauseScreen') this.resume(); }
      if(this.running&&!event.repeat){
        if(this.choice&&['1','2','3'].includes(event.key))document.querySelectorAll('.ability-card')[Number(event.key)-1]?.click();
        if(['q','e','r'].includes(event.key.toLowerCase()))this.triggerPrime(event.key.toLowerCase());
        if(this.primeIntro&&event.key==='Enter')this.closePrimeIntro(true);
      }
    });
    window.addEventListener('blur', () => this.pause());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); });
    document.addEventListener('pointerdown', () => this.audio.unlock(), { once: true });
    document.addEventListener('keydown', () => this.audio.unlock(), { once: true });

    // Audio click feedback para todos los botones pixel art del juego
    document.addEventListener('click', (event) => {
      const btn = event.target.closest('button');
      if (btn && !btn.disabled) {
        this.audio?.play('button_click');
      }
    });
  }

  start() {
    // Se entra directo al local: sin sesión, como invitado. Registrarse es opcional (escritorio de socios)
    if (currentAccount() || this.enterAsGuest()) this.showScreen('lobbyScreen');
    else this.showScreen('authScreen');
    // Al cargar la página: presentación PanchOS x BurgosCorp encima del local
    playSplash({ reducedMotion: this.reducedMotion });
    requestAnimationFrame((time) => this.loop(time));
  }

  showScreen(id) {
    this.screenId = id;
    this.touchControls?.onScreenChange(id);
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.toggle("screen--active", screen.id === id);
    });
    if(!['gameScreen','pauseScreen'].includes(id))this.choice=null;
    document.querySelector('#abilityScreen').classList.toggle('screen--active',id==='gameScreen'&&Boolean(this.choice));
    const inRun = ['gameScreen','abilityScreen','pauseScreen'].includes(id);
    const isPaused = id === 'pauseScreen';
    document.querySelector('#app').dataset.playing = String(inRun);
    document.querySelector('#app').dataset.screen=id;
    document.querySelector('#app').dataset.choosing=String(Boolean(this.choice));
    document.querySelector('#combatRail').hidden=!inRun || isPaused;
    if (inRun) {
      this.hud.show(isPaused);
      if (id === 'gameScreen') this.layoutOverlays();
    } else {
      this.hud.hide();
    }
    this.running = id === "gameScreen";
    this.input.enabled = this.running||id==='lobbyScreen';
    this.input.clear();
    this.audio.setScene(id === 'gameScreen' && this.state?.enemies.some(enemy=>enemy.isBoss) ? 'boss' : id);
    if (id === 'menuScreen') document.querySelector('#menuBest').textContent = String(getBestScore()).padStart(6,'0');
    if (id !== 'gameScreen') { clearTimeout(this.toastTimer); this.toast.hidden = true; }
    document.querySelector('#primeBar').hidden=!inRun || isPaused;
    if(id==='lobbyScreen')this.lobby.enter();
    if(id==='setupScreen')requestAnimationFrame(()=>this.menu?.fitSetup?.());
    if (id === 'pauseScreen') this.renderBuild();
    if(id==='domiScreen')this.domi.render();
    if (id !== 'gameScreen' && id !== 'abilityScreen') {
      document.querySelector('#'+id)?.querySelector('button:not(:disabled),input')?.focus({preventScroll:true});
    } else if (id === 'gameScreen') document.activeElement?.blur();
  }

  pause() {
    if (this.running) {
      this.pauseThemeIndex = ((this.pauseThemeIndex ?? -1) + 1) % PAUSE_THEMES.length;
      const theme = PAUSE_THEMES[this.pauseThemeIndex];
      const panel = document.querySelector('#pauseScreen .pause-panel');
      if (panel) {
        panel.style.setProperty('--pause-border', theme.border);
        panel.style.setProperty('--pause-glow', theme.glow);
      }
      this.showScreen('pauseScreen');
      document.querySelector('#resumeButton')?.focus();
    }
  }
  // --- Mini tutorial de inicio: moverse y hacer dash (se completa haciéndolo) ---
  startTutorial() {
    this.tutorial = { step: 'move', moved: 0, doneTimer: 0 };
    if (this.state) this.state.holdSpawns = true; // sin enemigos hasta completar el tutorial
    this.renderTutorial();
  }

  tutorialIsTouch() {
    return this.touchControls?.layer?.style.display === 'block';
  }

  renderTutorial() {
    const box = document.querySelector('#runTutorial');
    if (!box) return;
    const t = this.tutorial, touch = this.tutorialIsTouch();
    if (!t) { box.hidden = true; return; }
    const keys = document.querySelector('#runTutorialKeys');
    const key = label => { const k = document.createElement('kbd'); k.className = 'pixel-key'; k.textContent = label; return k; };
    keys.replaceChildren();
    box.dataset.step = t.step;
    if (t.step === 'move') {
      document.querySelector('#runTutorialStep').textContent = '1/2';
      this.setTutorialProgress(0);
      if (touch) keys.append(key('JOYSTICK'));
      else keys.append(key('W'), key('A'), key('S'), key('D'));
      document.querySelector('#runTutorialText').textContent = touch ? 'Arrastrá el joystick para moverte. ¡El ataque es automático!' : 'Movete con WASD o las flechas. ¡El ataque es automático!';
    } else if (t.step === 'dash') {
      document.querySelector('#runTutorialStep').textContent = '2/2';
      this.setTutorialProgress(0);
      keys.append(key(touch ? 'DASH' : 'ESPACIO'));
      document.querySelector('#runTutorialText').textContent = touch ? 'Tocá DASH para salir disparado: un instante sos invencible.' : 'Apretá ESPACIO para hacer dash: salís disparado y un instante sos invencible.';
    } else {
      document.querySelector('#runTutorialStep').textContent = '✓';
      this.setTutorialProgress(1);
      document.querySelector('#runTutorialText').textContent = '¡Perfecto! Ahí vienen los clientes... ¡a sobrevivir!';
    }
  }

  setTutorialProgress(value) {
    const bar = document.querySelector('#runTutorialFill');
    const width = `${Math.round(Math.min(1, value) * 100)}%`;
    if (bar && bar.style.width !== width) bar.style.width = width;
  }

  updateTutorial(delta) {
    const t = this.tutorial;
    if (!t || !this.state) return;
    if (t.step === 'move') {
      const axis = this.input.getAxis();
      if (axis.x || axis.y) t.moved += delta;
      this.setTutorialProgress(t.moved / 0.7);
      if (t.moved > 0.7) { t.step = 'dash'; this.renderTutorial(); this.audio?.play('confirm'); }
    } else if (t.step === 'dash') {
      if (this.state.player.dashTime > 0) {
        t.step = 'done';
        t.doneTimer = 2.2;
        this.state.holdSpawns = false;
        try { localStorage.setItem('domi2pancho.tutorialDone', 'true'); } catch {}
        this.renderTutorial();
        this.audio?.play('level');
      }
    } else {
      t.doneTimer -= delta;
      if (t.doneTimer <= 0) { this.tutorial = null; this.renderTutorial(); }
    }
  }

  // El cartel se esconde mientras hay cartas, entrada de jefe o anuncio de poder
  updateTutorialVisibility() {
    const box = document.querySelector('#runTutorial');
    if (!box) return;
    const show = Boolean(this.tutorial && this.running && this.screenId === 'gameScreen' && !this.choice && !this.entrance && !this.primeIntro);
    if (box.hidden === show) box.hidden = !show;
    const intro = document.querySelector('#primeIntro');
    const showIntro = Boolean(this.primeIntro && this.screenId === 'gameScreen');
    if (intro && intro.hidden === showIntro) intro.hidden = !showIntro;
  }

  // --- Pausa al habilitarse un poder: explica qué hace y pide apretarlo ---
  checkPrimeUnlocks() {
    const state = this.state;
    if (!state || this.primeIntro || this.choice || this.entrance || !this.running || state.mapId === 'lava') return;
    state.primesAnnounced = state.primesAnnounced || {};
    const prime = primes.find(p => !state.primesAnnounced[p.key] && state.player.level >= p.level);
    if (!prime) return;
    state.primesAnnounced[prime.key] = true;
    this.openPrimeIntro(prime);
  }

  openPrimeIntro(prime) {
    this.primeIntro = prime;
    this.input?.clear();
    const touch = this.tutorialIsTouch();
    document.querySelector('#primeIntroKey').textContent = prime.key.toUpperCase();
    document.querySelector('#primeIntroName').textContent = prime.name;
    document.querySelector('#primeIntroInfo').textContent = prime.info || '';
    document.querySelector('#primeIntroHint').textContent = touch
      ? `Tocá el botón ${prime.key.toUpperCase()} para usarlo. Después se recarga en ${prime.cooldown} s.`
      : `Apretá ${prime.key.toUpperCase()} para usarlo. Después se recarga en ${prime.cooldown} s.`;
    document.querySelector('#primeIntroButton').textContent = `¡USARLO AHORA! (${prime.key.toUpperCase()})`;
    document.querySelector('#primeIntro').hidden = false;
    this.audio?.play('level');
  }

  // useIt: además de cerrar, dispara el poder (botón o Enter). silent: al reiniciar la partida
  closePrimeIntro(useIt, silent = false) {
    const prime = this.primeIntro;
    this.primeIntro = null;
    const box = document.querySelector('#primeIntro');
    if (box) box.hidden = true;
    if (!prime || silent) return;
    this.input?.clear();
    if (useIt) this.triggerPrime(prime.key);
  }

  unlockLavaCheat() {
    if (!currentAccount()) guestLogin();
    try {
      grantItem('map', 'lava');
      grantItem('accessory', 'leg_lava_crown');
    } catch (error) { this.showToast(error.message); return false; }
    this.audio?.play('victory');
    this.showToast('¡COMANDO SECRETO! Caldero de Lava y Corona Magmática desbloqueados.');
    this.menu?.prepareAccount?.();
    if (this.menu?.mapInput) { this.menu.mapInput.value = 'lava'; this.menu.syncCards?.(); }
    if (this.screenId === 'domiScreen') this.domi?.render?.();
    return true;
  }

  killBossCheat() {
    const boss = this.running && this.state?.enemies.find(e => e.isBoss && e.hp > 0);
    if (!boss) { this.showToast('No hay ningún jefe en la arena.'); return false; }
    // Sin segunda vida: el truco lo liquida de una
    boss.enraged = true;
    this.audio?.play('boss');
    this.state.shake = 0.95;
    burst(this.state, boss.x, boss.y, '#ffffff', 40, 340);
    burst(this.state, boss.x, boss.y, '#ffd700', 40, 300);
    damageEnemy(this.state, boss, boss.hp + 999999, 'crit');
    resolveDeaths(this.state, () => {});
    this.showToast('¡COMANDO SECRETO! Jefe aniquilado.');
    return true;
  }

  enterAsGuest() {
    try { guestLogin(); } catch { return false; }
    this.menu?.prepareAccount?.();
    if (this.screenId && this.screenId !== 'lobbyScreen') this.showScreen('lobbyScreen');
    return true;
  }

  openRegistration() {
    this.openAuth?.(isGuest() || !currentAccount() ? 'register' : 'switch');
  }

  showAtlas() {
    this.atlas?.show();
  }

  showPrizeMachine() {
    this.prizeMachine?.show();
  }

  skipEntrance() { if (this.entrance && this.running) skipBossEntrance(this.entrance); }
  resume() { if (this.screenId === 'pauseScreen') this.showScreen('gameScreen'); }

  renderBuild() {
    const root = document.querySelector('#buildList');
    if (!root || !this.state) return;
    root.replaceChildren();
    const state = this.state;
    const p = state.player;
    document.querySelector('#pauseScreen').dataset.danger = String(p.hp / p.maxHp < .25);
    const combo = state.combo || 0;
    const peakCombo = state.peakCombo || combo;
    const multiplier = Math.min(3, 1 + Math.floor(combo / 5) * 0.25);
    const values = {
      pauseHp: Math.ceil(p.hp) + ' / ' + p.maxHp,
      pauseLevel: String(p.level),
      pauseTime: formatTime(state.time),
      pauseKills: String(state.kills),
      pauseScore: Math.floor(state.score).toLocaleString('es-AR'),
      pauseCombo: combo > 0 ? `${combo} (x${multiplier.toFixed(2)})` : `${peakCombo} MÁX`,
      pauseLoadout: p.skin.name + ' / ' + (p.weaponEvolution?.name || p.weapon.name),
    };
    for (const [id, value] of Object.entries(values)) {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    }
    const addRecipe = (name, level, evolved = false) => {
      const item = document.createElement('div');
      item.className = 'pause-recipe-item' + (evolved ? ' is-evolved' : '');
      const title = document.createElement('strong');
      const rank = document.createElement('small');
      title.textContent = name;
      rank.textContent = level;
      item.append(title, rank);
      root.append(item);
    };
    if (p.weaponEvolution) {
      addRecipe(p.weaponEvolution.name, 'EVOLUCIÓN', true);
    }
    for (const [id, count] of Object.entries(p.abilities || {})) {
      const ab = abilityCatalog.find(ability => ability.id === id);
      addRecipe(ab?.name || id, 'NV ' + count);
    }
    if (!root.children.length) addRecipe('Combo original', 'SIN MEJORAS');
    const powers = document.querySelector('#pausePowers');
    if (powers) {
      powers.replaceChildren();
      const available = primes.map(prime => ({
        key: prime.key.toUpperCase(),
        name: prime.name,
        locked: this.state?.mapId !== 'lava' && p.level < prime.level,
        level: prime.level,
        remaining: state.primeCooldowns[prime.key] || 0,
      }));
      available.push({key: 'ESPACIO', name: 'Acelerón', locked: false, remaining: p.dashCooldown || 0});
      for (const power of available) {
        const item = document.createElement('div');
        item.className = 'pause-power ' + (power.locked ? 'is-locked' : power.remaining > 0 ? 'is-cooling' : 'is-ready');
        const key = document.createElement('kbd');
        const name = document.createElement('strong');
        const status = document.createElement('span');
        key.textContent = power.key;
        name.textContent = power.name;
        status.textContent = power.locked ? 'NV ' + power.level : power.remaining > 0 ? Math.ceil(power.remaining) + ' s' : 'LISTO';
        item.append(key, name, status);
        powers.append(item);
      }
    }
    const goal = document.querySelector('#pauseGoal');
    if (goal && modes[this.state.modeId]) {
      goal.textContent = modes[this.state.modeId].goal;
    }
  }

  showRanking() {
    const account = currentAccount();
    const ranking = getRanking();
    const list = document.querySelector("#rankingList");
    list.replaceChildren();
    const icon = (size, title, paint) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size; canvas.title = title;
      const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false; paint(ctx);
      return canvas;
    };
    const span = (text, className) => { const el = document.createElement('span'); el.textContent = text; if (className) el.className = className; return el; };
    ranking.forEach((run, index) => {
      const { skinId, weaponId, companionId } = resolveLoadout(run);
      const row = document.createElement('li'); row.className = 'ranking-row';
      const pos = span(`#${index + 1}`, `ranking-pos${index < 3 ? ` ranking-pos--${index + 1}` : ''}`);
      const loadout = document.createElement('div'); loadout.className = 'ranking-loadout';
      loadout.append(
        icon(44, `Personaje: ${run.skin || skinId}`, ctx => drawFood(ctx, skinId, 22, 24, .65)),
        icon(34, `Arma: ${run.weapon || weaponId}`, ctx => drawWeapon(ctx, weaponId, 17, 17, .65)),
        icon(34, `Mascota: ${run.companion || 'ninguna'}`, ctx => {
          if (companionId !== 'none') { drawPet(ctx, companionId, 17, 17, 0, 1.05); return; }
          ctx.fillStyle = '#475569'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('—', 17, 17);
        }),
      );
      const info = document.createElement('div'); info.className = 'ranking-info';
      const head = document.createElement('div'); head.className = 'ranking-header';
      const name = document.createElement('strong'); name.className = 'ranking-name';
      name.textContent = run.name || account?.name || 'Pancho';
      const isVictory = run.outcome === 'victory';
      head.append(name, span(isVictory ? 'VICTORIA' : run.outcome === 'abandoned' ? 'ABANDONO' : 'CAÍDO', `ranking-badge ${isVictory ? 'ranking-badge--victory' : 'ranking-badge--defeat'}`));
      // Datos guardados en el navegador: siempre como texto, nunca como HTML
      const stats = document.createElement('div'); stats.className = 'ranking-stats';
      [`NV ${run.level || 1}`, `${run.kills || 0} KOs`, run.timeText || '00:00', run.date || ''].filter(Boolean)
        .forEach((text, i) => { if (i) stats.append(span('·')); stats.append(span(text)); });
      info.append(head, stats);
      const score = document.createElement('div'); score.className = 'ranking-score';
      score.textContent = `${Number(run.score || 0).toLocaleString('es-AR')} PT`;
      row.append(pos, loadout, info, score);
      list.append(row);
    });
    if (!ranking.length) {
      const empty = document.createElement('li'); empty.className = 'ranking-empty';
      empty.textContent = 'El primer lugar te está esperando. ¡Jugá una partida para inaugurar el ranking!';
      list.append(empty);
    }
    this.showScreen("rankingScreen");
  }

  startRun(setup) {
    this.closePrimeIntro?.(false, true);
    const account=currentAccount();if(!account){this.showScreen('authScreen');return;}
    setup={...setup,name:account.name,weaponId:weapons[setup.weaponId]?setup.weaponId:'fork',skinId:isOwned(account,'skin',setup.skinId)?setup.skinId:'pancho',mapId:isOwned(account,'map',setup.mapId)?setup.mapId:'diner',companionId:isOwned(account,'pet',setup.companionId)?setup.companionId:'none',accessoryId:isOwned(account,'accessory',setup.accessoryId)?setup.accessoryId:'none'};
    this.lastSetup = setup;
    this.state = createRunState(setup, this.audio);
    this.lobby.centerNext = true; // al terminar la partida se vuelve al centro del local
    // El tutorial de partida aparece siempre (para practicar movimiento y dash al inicio)
    if (setup.mapId !== 'lava') {
      this.startTutorial();
    } else {
      this.tutorial = null;
      if (this.state) this.state.holdSpawns = false;
      const box = document.querySelector('#runTutorial');
      if (box) box.hidden = true;
    }
    this.resizeView();
    resetQuality();
    this.warmUpRun();
    this.choice=null;this.entrance=null;this.buildSignature=null;this.updateAimButton();
    this.audio.unlock();
    this.hud.update(this.state);
    this.showScreen("gameScreen");
    this.showToast("Pedido #002. Que empiece el turno.");
  }

  // Ajusta el visor a la proporción de la ventana para que la partida ocupe toda la pantalla
  resizeView() {
    const area = this.canvas.parentElement;
    const aspect = (area?.clientWidth || window.innerWidth || 960) / (area?.clientHeight || window.innerHeight || 540);
    const world = this.state?.world || { width: 1920, height: 1080 };
    let w = 960, h = 540;
    if (aspect >= 16 / 9) w = Math.round(540 * aspect);
    else h = Math.round(960 / aspect);
    this.view.w = Math.min(world.width, w);
    this.view.h = Math.min(world.height, h);
    if (this.canvas.width !== this.view.w || this.canvas.height !== this.view.h) {
      this.canvas.width = this.view.w;
      this.canvas.height = this.view.h;
    }
    this.layoutOverlays();
    if (this.state) {
      this.state.view = this.view;
      if (this.state.camera) { this.state.camera.w = this.view.w; this.state.camera.h = this.view.h; }
    }
  }

  // Ubica el minimapa debajo del HUD y publica en CSS dónde terminan ambos, para apilar
  // los carteles HTML (combo, evento, jefe, mejoras) sin que se encimen
  layoutOverlays() {
    const app = this.canvas.parentElement, rect = this.canvas.getBoundingClientRect();
    if (!app || !rect.height) return;
    const scale = Math.min(rect.width / this.view.w, rect.height / this.view.h);
    const offsetY = (rect.height - this.view.h * scale) / 2;
    let hudBottom = 0;
    const hud = document.querySelector('#hud');
    if (hud && !hud.hidden) for (const child of hud.children) {
      const box = child.getBoundingClientRect();
      if (box.height && box.bottom > hudBottom) hudBottom = box.bottom;
    }
    hudBottom -= app.getBoundingClientRect().top;
    // +14 deja lugar para la etiqueta "MAPA" que se dibuja encima del marco
    this.minimapY = Math.max(MINIMAP.y, Math.ceil((hudBottom - offsetY) / scale) + 14);
    app.style.setProperty('--hud-bottom', Math.round(hudBottom) + 'px');
    this.overlayLayout = { hudBottom: Math.round(hudBottom), minimapBottom: Math.round(offsetY + (this.minimapY + MINIMAP.h + 4) * scale) };
    app.style.setProperty('--minimap-bottom', Math.round(offsetY + (this.minimapY + MINIMAP.h + 4) * scale) + 'px');
  }

  restartLastRun() {
    this.startRun(this.lastSetup || { name: "Pancho", skinId: "pancho", weaponId: "fork", difficultyId: "picante" });
  }

  // El próximo cuadro se pide ANTES de ejecutar este: si un cuadro falla, el juego no queda congelado
  loop(time) {
    requestAnimationFrame((nextTime) => this.loop(nextTime));
    try {
      this.frame(time);
      this.frameErrors = 0;
    } catch (error) {
      this.frameErrors = (this.frameErrors || 0) + 1;
      console.error('Error en un cuadro del juego:', error);
      // Un dibujo cortado a la mitad no debe dejar el canvas movido o transparente
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); this.ctx.globalAlpha = 1; this.ctx.globalCompositeOperation = 'source-over';
      // Si falla una y otra vez, se pausa con aviso en lugar de repetir el error 60 veces por segundo
      if (this.frameErrors > 30 && this.running) {
        this.frameErrors = 0;
        this.entrance = null;
        this.pause();
        this.showToast?.('Hubo un problema. La partida se pausó: podés seguir o volver al local.');
      }
    }
  }

  frame(time) {
    if (this.running && !this.choice && !this.entrance && !this.primeIntro && this.lastTime) trackFrame(time - this.lastTime);
    const delta = Math.min(0.033, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;
    this.drawBackground();
    if(this.screenId==='lobbyScreen'){this.lobby.update(delta,this.input);this.touchControls?.update(null);}
    if(this.screenId==='shopScreen')this.shop.update(time/1000);
    if(this.screenId==='domiScreen')this.domi.update(time/1000);
    if (this.state && ['gameScreen','abilityScreen','pauseScreen'].includes(this.screenId)) {
      // Mientras se elige una carta de mejora o entra un jefe la partida queda congelada
      if (this.running && this.entrance) {
        this.focusCameraOn(this.entrance.boss, delta);
        if (updateBossEntrance(this.entrance, delta, this.audio)) this.finishBossEntrance();
      } else if (this.running && !this.choice && !this.primeIntro) this.update(delta);
      this.draw();
      // Los carteles se ocultan en pausa y durante la entrada del jefe (tiene su propio cartel)
      this.hudCanvas.render(this.state, this.overlayLayout || { hudBottom: 84, minimapBottom: 210 }, delta, this.screenId === 'pauseScreen' || Boolean(this.entrance));
    } else {
      this.hudCanvas.hide();
    }
    this.updateTutorialVisibility();
  }

  update(delta) {
    const state = this.state;
    state.time += delta;
    state.delta = delta;
    state.shake = Math.max(0, state.shake - delta);

    // Rebuild Spatial Hash Grid for O(1) broadphase queries
    if (state.spatialGrid) {
      state.spatialGrid.clear();
      const enemyLen = state.enemies.length;
      for (let i = 0; i < enemyLen; i++) {
        const e = state.enemies[i];
        if (e.hp > 0) state.spatialGrid.insert(e);
      }
    }

    // Update Player modular skills
    state.player.skills?.update(delta, state);

    // Caldero de Lava: el suelo tiembla hasta que emerge el Coloso
    if (state.mapId === 'lava' && state.time < (state.nextBossAt || 3.5)) {
      state.shake = Math.max(state.shake || 0, 0.3 + Math.min(1, state.time / (state.nextBossAt || 3.5)) * 0.3);
    }
    // Muerte del Coloso Final: explosiones encadenadas y recién ahí cuenta la victoria
    if (state.bossDying) {
      const dying = state.bossDying;
      dying.timer -= delta;
      dying.explosionTimer -= delta;
      state.shake = Math.max(state.shake || 0, 0.6);
      if (dying.explosionTimer <= 0) {
        dying.explosionTimer = Math.max(0.06, (dying.timer / dying.duration) * 0.18);
        const ox = (Math.random() - 0.5) * dying.radius * 1.5, oy = (Math.random() - 0.5) * dying.radius * 1.5;
        burst(state, dying.x + ox, dying.y + oy, Math.random() < 0.5 ? '#ff2200' : '#ffd700', 18, 240);
        state.rings?.push({ x: dying.x + ox, y: dying.y + oy, radius: 50 + Math.random() * 45, life: 0.45, maxLife: 0.45, color: '#ff3700' });
        this.audio?.play('damage');
      }
      if (dying.timer <= 0) {
        burst(state, dying.x, dying.y, '#ffffff', 60, 560);
        burst(state, dying.x, dying.y, '#ffd700', 60, 380);
        state.rings?.push({ x: dying.x, y: dying.y, radius: 520, life: 1.6, maxLife: 1.6, color: '#ffffff' });
        state.bossesKilled = (state.bossesKilled || 0) + 1;
        state.bossDying = null;
      }
    }
    updateDirector(state, delta, this.canvas);
    updatePrimes(state,delta);updateMap(state,delta);
    if (state.bossIntro) {
      state.bossIntro.timer -= delta;
      if (state.bossIntro.timer <= 0) state.bossIntro = null;
    }
    if (state.directorNotice) { this.showToast(state.directorNotice); state.directorNotice = ''; }
    const before = { x:state.player.x, y:state.player.y };
    const dashBefore=state.player.dashTime;
    const bounds = state.world || this.canvas;
    updatePlayer(state, delta, this.input, bounds);
    if(dashBefore<=0&&state.player.dashTime>0){
      this.audio.play('dash');
      const dashEl = document.querySelector('#dashControl');
      if (dashEl) {
        dashEl.classList.remove('dash-active');
        requestAnimationFrame(() => dashEl.classList.add('dash-active'));
        setTimeout(() => dashEl.classList.remove('dash-active'), 220);
      }
    }
    state.distance += Math.hypot(state.player.x - before.x, state.player.y - before.y);

    // Suave seguimiento de cámara al jugador
    if (state.camera && state.world) {
      const view = this.view;
      const targetCamX = Math.max(0, Math.min(state.world.width - view.w, state.player.x - view.w / 2));
      const targetCamY = Math.max(0, Math.min(state.world.height - view.h, state.player.y - view.h / 2));
      state.camera.x += (targetCamX - state.camera.x) * Math.min(1, delta * 8.5);
      state.camera.y += (targetCamY - state.camera.y) * Math.min(1, delta * 8.5);
    }

    updateEffects(state, delta);
    for (const hazard of state.hazards) hazard.life -= delta;
    state.hazards = state.hazards.filter(hazard => hazard.life > 0);
    // La velocidad de los enemigos se recalcula cada cuadro: charcos y salpicaduras de mostaza la bajan mientras duran
    for (const enemy of state.enemies) enemy.speedMultiplier = enemy.frozenUntil > state.time ? 0.3 : enemy.mustardSlowUntil > state.time ? 0.5 : 1;
    for (const hazard of state.hazards) {
      const friendly = hazard.isKetchupPuddle || hazard.isMustardPuddle;
      if (!friendly && Math.hypot(hazard.x - state.player.x, hazard.y - state.player.y) < hazard.radius + state.player.radius) {
        state.player.buffs.slowTime = Math.max(state.player.buffs.slowTime, 0.35);
      }
      if (hazard.isMustardPuddle) {
        for (const enemy of state.enemies) {
          if (enemy.hp > 0 && Math.hypot(hazard.x - enemy.x, hazard.y - enemy.y) < hazard.radius + enemy.radius) {
            enemy.speedMultiplier = Math.min(enemy.speedMultiplier, 0.6);
            enemy.hp -= 9 * delta * (state.player.buffs.damageMultiplier || 1);
          }
        }
      }
      if (hazard.isKetchupPuddle) {
        for (const enemy of state.enemies) {
          if (enemy.hp > 0 && Math.hypot(hazard.x - enemy.x, hazard.y - enemy.y) < hazard.radius + enemy.radius) {
            enemy.speedMultiplier = Math.min(enemy.speedMultiplier || 1, 0.55);
            if (Math.random() < 0.15) {
              enemy.hp -= 2.5 * delta * (state.player.buffs.damageMultiplier || 1);
            }
          }
        }
      }
    }
    if (updateEnemies(state, delta, bounds)) this.announceBoss();
    state.companion.update(state, delta);
    updateProjectiles(state, delta, bounds);
    updateItems(state, delta, bounds);
    if (state.itemNotice) { this.showToast(state.itemNotice); this.audio.play('pickup'); state.itemNotice = ''; }
    resolveDeaths(state, (isCard) => this.onLevelUp(isCard));
    capEffects(state);
    // El jefe se quedó sin vida por primera vez: pausa corta y épica de su segunda fase
    if (state.bossRage) {
      this.entrance = startBossRage(state, state.bossRage);
      state.bossRage = null;
      this.input.clear();
      this.audio.setScene('boss');
    }
    if (state.bossDefeated) {
      state.bossDefeated = false;
      this.showToast(phrases.bossDefeated[Math.floor(Math.random() * phrases.bossDefeated.length)]);
      this.audio.play('boss');
      this.audio.setScene('gameScreen');
    }
    addSurvivalScore(state, delta);
    this.hud.update(state);
    if (state.player.hp <= 0) {
      this.endRun();
    } else if (state.victory || (state.modeId === 'rush' && state.bossesKilled >= RUSH_BOSS_GOAL)) {
      this.endRun('victory');
    } else if (!this.choice && (state.pendingLevels > 0 || cardIsDue(state))) {
      // Muestra la selección de mejora de inmediato al subir de nivel (cada 2 niveles)
      this.showAbilityChoices();
    }
    this.renderPrimeBar();
    this.touchControls?.update(state);
    this.updateTutorial(delta);
    this.checkPrimeUnlocks();
    this.renderLiveBuild();
  }

  // isAbilityLevel=true: nivel con carta de mejora (cada 2 niveles: NV 2, 4, 6...); false: nivel regular
  onLevelUp(isAbilityLevel = true) {
    if (isAbilityLevel) {
      this.state.pendingLevels = Math.min(1, (this.state.pendingLevels || 0) + 1);
    }
    this.state.score = (this.state.score || 0) + 50;
    // Recompensa pasiva normal al subir de nivel
    this.state.player.hp = Math.min(this.state.player.maxHp, this.state.player.hp + 12);
    if (!isAbilityLevel) {
      this.state.floaters?.push({
        x: this.state.player.x,
        y: this.state.player.y - 36,
        text: `NV ${this.state.player.level} (+12 HP)`,
        life: 0.9,
        color: '#c084fc',
        scale: 1.1
      });
    }

    const evolution=evolveWeapon(this.state.player);
    if(evolution){
      const player=this.state.player;
      this.state.directorNotice=`EVOLUCION / ${evolution.name.toUpperCase()}`;
      this.state.rings.push({x:player.x,y:player.y,radius:95,life:.9,maxLife:.9,color:'#ffe569'});
      burst(this.state,player.x,player.y,'#ffe569',34,210);
      this.state.shake=Math.max(this.state.shake||0,.24);
      this.audio?.play('level');this.buildSignature=null;
    }
  }

  showAbilityChoices() {
    if(this.choice)return;
    const choices = getAbilityChoices(this.state.player);
    if (choices.length === 0) {
      this.state.pendingLevels = 0;
      return;
    }
    const options = document.querySelector("#abilityOptions");
    options.replaceChildren();
    choices.forEach((ability, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ability-card";
      const count = this.state.player.abilities[ability.id] || 0;
      button.innerHTML = `<kbd class="pixel-key choice-key">${index+1}</kbd><span class="ability-icon">${icon(abilityIcons[ability.id]||'Sparkles')}</span><span class="ability-card__top"><span>${ability.category}</span><span>${count+1}/${ability.maxStacks}</span></span><strong>${ability.name}</strong><span class="ability-card__description">${ability.description}</span>`;
      // Rareza: color de la carta y chispas que suben (más chispas cuanto más rara)
      const rarity = rarities[ability.rarity] || rarities.common;
      button.dataset.rarity = rarity.id;
      button.style.setProperty('--card-tint', rarity.color);
      const badge = document.createElement('span'); badge.className = 'ability-rarity'; badge.textContent = rarity.name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase(); // la fuente pixel no trae tildes
      const fx = document.createElement('span'); fx.className = 'card-fx'; fx.setAttribute('aria-hidden', 'true');
      for (let s = 0; s < 6 + rarity.weight * 3; s++) {
        const spark = document.createElement('i');
        spark.style.cssText = `--x:${Math.round(Math.random() * 92 + 4)}%;--dur:${(1.6 + Math.random() * 1.8).toFixed(2)}s;--delay:-${(Math.random() * 3).toFixed(2)}s;--size:${Math.random() < .3 ? 6 : 4}px;--drift:${Math.round(Math.random() * 30 - 15)}px`;
        fx.append(spark);
      }
      button.prepend(fx);
      button.append(badge);
      button.setAttribute('aria-keyshortcuts',String(index+1));
      button.setAttribute('aria-label',`Tecla ${index+1}: ${ability.name}. ${ability.description}. Nivel ${count+1} de ${ability.maxStacks}`);
      button.addEventListener("click", () => this.chooseAbility(ability), { once: true });
      options.append(button);
    });
    this.choice={};
    this.input?.clear();
    document.querySelector('#abilityScreen').classList.add('screen--active');
    document.querySelector('#app').dataset.choosing='true';
  }

  chooseAbility(ability) {
    if (!this.choice||!applyAbility(this.state.player, ability)) return;
    this.audio?.play('level');
    this.dismissAbility();
    this.hud.update(this.state);
    this.renderLiveBuild();
    this.showToast(phrases.levelUp[Math.floor(Math.random() * phrases.levelUp.length)]);
  }

  dismissAbility(){if(!this.choice)return;this.choice=null;this.input?.clear();this.state.pendingLevels=Math.max(0,this.state.pendingLevels-1);document.querySelector('#abilityScreen').classList.remove('screen--active');document.querySelector('#app').dataset.choosing='false';document.activeElement?.blur();}

  triggerPrime(key){
    if(this.primeIntro){if(key!==this.primeIntro.key)return false;this.closePrimeIntro(false);}
    if(!this.running||this.choice||this.entrance||!activatePrime(this.state,key))return false;
    this.audio.play('level');this.showToast(primes.find(prime=>prime.key===key).name.toUpperCase());return true;
  }

  updateAimButton(){
    const manual=Boolean(this.state?.manualAim),button=document.querySelector('#aimButton');
    button.setAttribute('aria-pressed',String(manual));
    button.title=manual?'Punteria manual / mouse':'Punteria automatica / enemigo cercano';
    this.canvas.style.cursor=manual?'crosshair':'default';
  }

  renderLiveBuild(){
    const entries=Object.entries(this.state.player.abilities),evolution=this.state.player.weaponEvolution;
    const pickups=Object.entries(this.state.pickups||{});
    const signature=JSON.stringify(entries)+'/'+(evolution?.id||'base')+'/'+JSON.stringify(pickups);
    if(signature!==this.buildSignature){
      this.buildSignature=signature;const root=document.querySelector('#liveBuild');root.replaceChildren();
      const rarityWeights = { legendary: 4, epic: 3, rare: 2, common: 1 };
      const sorted = [...entries].sort((a,b)=>{
        const abA = abilityCatalog.find(x => x.id === a[0]);
        const abB = abilityCatalog.find(x => x.id === b[0]);
        const wA = rarityWeights[abA?.rarity || 'common'] || 1;
        const wB = rarityWeights[abB?.rarity || 'common'] || 1;
        if(wB !== wA) return wB - wA;
        return b[1] - a[1];
      });
      for(const [id,count] of sorted){
        const ability=abilityCatalog.find(x=>x.id===id);
        const rarity=ability?.rarity||'common';
        const isMax=count>=(ability?.maxStacks||count);
        const token=document.createElement('div');
        token.className=`build-token build-token--${rarity}`;
        token.dataset.rarity=rarity;
        token.dataset.max=String(isMax);
        token.tabIndex=0;
        const countBadge = isMax ? 'MAX' : `x${count}`;
        const rarityName = rarities[rarity]?.name || rarity;
        token.innerHTML=`
          <div class="token-frame">
            <span class="token-rarity-gem"></span>
            ${icon(abilityIcons[id]||'Sparkles','token-icon')}
            <b class="token-stack">${countBadge}</b>
          </div>
          <div class="build-tooltip">
            <div class="tooltip-header">
              <span class="tooltip-rarity">${rarityName.toUpperCase()}</span>
              <strong>${ability?.name||id}</strong>
            </div>
            <p class="tooltip-desc">${ability?.description||''}</p>
            <div class="tooltip-meta">NIVEL ${count}/${ability?.maxStacks||count}${isMax?' · ¡COMPLETO!':''}</div>
          </div>
        `;
        root.append(token);
      }
      if(evolution){
        const token=document.createElement('div');
        token.className='build-token build-token--evolution';
        token.tabIndex=0;
        token.innerHTML=`
          <div class="token-frame">
            <span class="token-rarity-gem"></span>
            ${icon('Zap','token-icon')}
            <b class="token-stack">EV</b>
          </div>
          <div class="build-tooltip">
            <div class="tooltip-header">
              <span class="tooltip-rarity">EVOLUCIÓN</span>
              <strong>${evolution.name}</strong>
            </div>
            <p class="tooltip-desc">${evolution.description}</p>
          </div>
        `;
        root.prepend(token);
      }
      // Fichas de consumibles recolectados
      const itemIcons = { ketchup: 'Flame', mayo: 'Heart', mustard: 'Zap', hotSauce: 'Sparkles', barbecue: 'Bomb' };
      for (const [pId, pCount] of pickups) {
        if (!pCount) continue;
        const token = document.createElement('div');
        token.className = 'build-token build-token--consumable';
        token.tabIndex = 0;
        token.innerHTML = `
          <div class="token-frame">
            <span class="token-rarity-gem" style="background:#00e5ff;color:#00e5ff;"></span>
            ${icon(itemIcons[pId] || 'Package', 'token-icon')}
            <b class="token-stack">x${pCount}</b>
          </div>
          <div class="build-tooltip">
            <div class="tooltip-header">
              <span class="tooltip-rarity" style="color:#00e5ff;">CONSUMIBLE</span>
              <strong>${pId.toUpperCase()}</strong>
            </div>
            <p class="tooltip-desc">Recolectado en el turno.</p>
            <div class="tooltip-meta">${pCount} veces obtenido</div>
          </div>
        `;
        root.append(token);
      }
      if(!entries.length&&!evolution&&!pickups.length)root.textContent='Receta original';
    }
    const next=primes.find(prime=>prime.level>this.state.player.level);
    document.querySelector('#nextPrimeLabel').textContent=next?'ACTIVA EN NIVEL '+next.level:'ACTIVAS COMPLETAS';
  }

  renderPrimeBar(){
    const root=document.querySelector('#primeBar');if(root.hidden||!this.state)return;
    for(const [index,prime] of primes.entries()){
      let node=root.querySelector('[data-prime="'+prime.key+'"]');
      if(!node){
        node=document.createElement('button');node.type='button';node.dataset.prime=prime.key;node.className='prime-slot';
        node.innerHTML='<kbd class="prime-key pixel-key">'+prime.key.toUpperCase()+'</kbd><span class="prime-symbol"></span><span class="prime-label"></span><span class="prime-cool"></span><i></i>';
        node.setAttribute('aria-keyshortcuts',prime.key);
        node.onclick=()=>this.triggerPrime(prime.key);root.append(node);
      }
      // En el Caldero de Lava se empieza en nivel 1 con todos los poderes listos
      const locked=this.state.mapId!=='lava'&&this.state.player.level<prime.level,cool=this.state.primeCooldowns[prime.key],status=locked?'locked':cool>0?'cooldown':'ready';
      node.disabled=locked||cool>0;node.dataset.ready=String(status==='ready');
      if(node.dataset.status!==status){
        const previousStatus=node.dataset.status;
        node.dataset.status=status;node.querySelector('.prime-symbol').innerHTML=icon(locked?'LockKeyhole':['Radio','Copy','ShieldCheck'][index]);
        node.querySelector('.prime-label').textContent=locked?'NIVEL '+prime.level:prime.name;
        if(status==='ready'&&previousStatus){
          node.classList.remove('prime-ready-flash');
          requestAnimationFrame(() => node.classList.add('prime-ready-flash'));
          node.addEventListener('animationend',()=>node.classList.remove('prime-ready-flash'),{once:true});
        }
      }
      const remaining=!locked&&cool>0?Math.ceil(cool)+'s':'';
      node.querySelector('.prime-cool').textContent=remaining;
      node.querySelector('.prime-cool').hidden=!remaining;
      node.querySelector('i').style.width=(locked?0:100*(1-cool/prime.cooldown))+'%';
      node.style.setProperty('--charge',(locked?0:100*(1-(cool||0)/prime.cooldown))+'%');
      node.title=prime.name+' / '+prime.key.toUpperCase()+(locked?' / desbloquea en nivel '+prime.level:remaining?' / '+remaining:' / lista');
      node.setAttribute('aria-label',node.title);
    }
  }

  endRun(outcome = 'defeat') {
    if (!this.state || this.screenId === 'gameOverScreen') return;
    const previousBest = getBestScore();
    const result = {
      id:crypto.randomUUID(),
      name: this.state.player.name,
      score: Math.floor(this.state.score),
      time: Math.floor(this.state.time),
      timeText: this.formatTime(this.state.time),
      kills: this.state.kills,
      level: this.state.player.level,
      skin: this.state.player.skin.name,
      skinId: this.state.player.skin.id || 'pancho',
      weapon: this.state.player.weapon.name,
      weaponId: this.state.player.weapon.id || 'fork',
      difficulty: this.state.difficulty.name,
      map: this.state.mapId,
      bossesKilled: this.state.bossesKilled,
      distance: Math.floor(this.state.distance),
      pickups: this.state.pickups,
      mode: modes[this.state.modeId].name,
      modeId: this.state.modeId,
      companion: companions[this.state.companion?.id]?.name || 'Sin compañero',
      companionId: this.state.companion?.id || 'none',
      peakCombo: this.state.peakCombo,
      outcome,
      wave: this.state.wave,
      abilities: {...this.state.player.abilities},
      cartographyProgress: this.state.cartographyProgress || {},
    };
    const previousUnlocks = new Set(unlockedAchievements().map(item=>item.id));
    result.newAchievements = recordRun(result).filter(item=>!previousUnlocks.has(item.id)).map(item=>item.name);
    if (outcome === 'victory' && this.state.mapId === 'lava') {
      // Premio por vencer al Coloso Final: la Corona Magmática
      try { grantItem('accessory', 'leg_lava_crown'); result.newAchievements.push('Corona Magmática Imperial'); } catch {}
    }
    this.audio.play(outcome === 'victory' ? 'victory' : 'death');
    // Socios: su partida entra sola al ranking. Invitados: si hacen Top 10 eligen un nombre de 5 letras
    const guest = isGuest();
    const guestTopTen = guest && qualifiesForRanking(result.score);
    if (!guest) saveRun(result);
    try { awardRun(result); } catch (error) { this.showToast(error.message); }
    this.running = false;
    this.hud.hide();
    this.gameOver.render(result, previousBest);
    if (guestTopTen) this.gameOver.offerArcadeName(result);
    this.showScreen("gameOverScreen");
    // Celebración visual si hay nuevos desbloqueos
    if (result.newAchievements?.length) {
      setTimeout(() => {
        const summary = document.querySelector('#gameOverScreen .result-summary');
        const unlock = document.querySelector('#gameOverScreen .result-unlock');
        if (summary) summary.classList.add('unlock-pop');
        if (unlock) unlock.classList.add('unlock-pop');
      }, 300);
    }
  }

  draw() {
    const state = this.state;
    const cam = state.camera || { x: 0, y: 0 };
    const vw = this.view.w, vh = this.view.h;
    const time = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : this.lastTime / 1000;

    this.ctx.save();
    const shaking = state.shake > 0 || this.entrance?.shake > 0;
    if (shaking && !this.reducedMotion) {
      this.ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }

    // Cámara en espacio de mundo
    this.ctx.save();
    // Acercamiento de cámara sobre el jefe durante su transformación de segunda fase
    const zoom = this.entrance?.zoom || 1;
    if (zoom > 1.001) {
      const zx = this.entrance.boss.x - cam.x, zy = this.entrance.boss.y - cam.y;
      this.ctx.translate(zx, zy); this.ctx.scale(zoom, zoom); this.ctx.translate(-zx, -zy);
    }
    this.ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

    // Dibujamos el suelo y props del mundo en coordenadas mundiales
    const worldW = state.world?.width || 1920;
    const worldH = state.world?.height || 1080;
    // Solo se pinta lo que ve la cámara: piso, luces y viñetas del mapa quedan idénticos pero no se rasteriza el resto del mundo
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(Math.floor(cam.x), Math.floor(cam.y), vw + 2, vh + 2);
    this.ctx.clip();
    drawDiner(this.ctx, worldW, worldH, time, false, state.mapId);
    this.ctx.restore();
    this.ctx.imageSmoothingEnabled = false; // drawDiner lo dejaba así para el resto del cuadro
    drawWorldProps(this.ctx, state.mapId || 'diner', time, state.world, cam);

    for (const hazard of state.hazards) {
      this.ctx.save();
      if (hazard.isMustardPuddle) {
        // Charco de mostaza burbujeante
        this.ctx.globalAlpha = Math.min(0.75, hazard.life * 0.4);
        this.ctx.fillStyle = '#d99a06';
        this.ctx.beginPath(); this.ctx.ellipse(hazard.x, hazard.y, hazard.radius, hazard.radius * 0.62, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#ffd34f';
        this.ctx.beginPath(); this.ctx.ellipse(hazard.x - 4, hazard.y - 3, hazard.radius * 0.6, hazard.radius * 0.36, 0, 0, Math.PI * 2); this.ctx.fill();
        const bubble = (state.time * 3 + hazard.x) % 1;
        this.ctx.fillStyle = '#fff3b0';
        this.ctx.fillRect(Math.round(hazard.x + 8 - bubble * 4), Math.round(hazard.y - 4 - bubble * 6), 3, 3);
      } else if (hazard.isKetchupPuddle) {
        this.ctx.globalAlpha = Math.min(0.7, hazard.life * 0.18);
        this.ctx.fillStyle = '#b31818';
        this.ctx.beginPath();
        this.ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#e52c2c';
        this.ctx.beginPath();
        this.ctx.arc(hazard.x - 3, hazard.y - 3, hazard.radius * 0.55, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.globalAlpha = Math.min(.25, hazard.life * .05);
        this.ctx.fillStyle = '#c898ee';
        this.ctx.beginPath();
        this.ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
    drawMapObstacles(this.ctx,state);
    drawMustardDrops(this.ctx, state);
    drawCombatFeedback(this.ctx,state,this.reducedMotion);
    for (let i = 0; i < state.items.length; i++) {
      const it = state.items[i];
      if (it && typeof it.draw === 'function' && it.x >= cam.x - 40 && it.x <= cam.x + vw + 40 && it.y >= cam.y - 40 && it.y <= cam.y + vh + 40) {
        it.draw(this.ctx, state.time);
      }
    }
    drawPickupAnimations(this.ctx, state);
    if (state.player.auraLevel) {
      this.ctx.strokeStyle='#86e3bf44';this.ctx.lineWidth=2;this.ctx.beginPath();this.ctx.arc(state.player.x,state.player.y,105,0,Math.PI*2);this.ctx.stroke();
    }
    for (const ring of state.rings) {
      if (ring.x < cam.x - 160 || ring.x > cam.x + vw + 160 || ring.y < cam.y - 160 || ring.y > cam.y + vh + 160) continue;
      const remaining=Math.max(0,Math.min(1,ring.life/(ring.maxLife||ring.life||1)));
      this.ctx.save();this.ctx.globalAlpha=remaining;this.ctx.strokeStyle=ring.color;this.ctx.lineWidth=1+3*remaining;
      this.ctx.beginPath();this.ctx.arc(ring.x,ring.y,ring.radius*(.25+.75*(1-remaining)),0,Math.PI*2);this.ctx.stroke();this.ctx.restore();
    }
    this.ctx.save();this.ctx.globalCompositeOperation='lighter';
    // Balas en dos pasadas (todas las estelas, luego todos los cuerpos): alternar entre cuadraditos
    // e imágenes bala por bala era ~3 veces más lento; con mezcla aditiva el orden no cambia el resultado
    const visibleShots = this.visibleShots ||= [];
    visibleShots.length = 0;
    for (let i = 0; i < state.projectiles.length; i++) {
      const proj = state.projectiles[i];
      if (proj.x >= cam.x - 50 && proj.x <= cam.x + vw + 50 && proj.y >= cam.y - 50 && proj.y <= cam.y + vh + 50) visibleShots.push(proj);
    }
    for (let i = 0; i < visibleShots.length; i++) {
      if (typeof visibleShots[i].drawTrail === 'function') visibleShots[i].drawTrail(this.ctx);
    }
    for (let i = 0; i < visibleShots.length; i++) {
      if (typeof visibleShots[i].drawBody === 'function') visibleShots[i].drawBody(this.ctx);
    }
    for (const shot of state.enemyProjectiles) {
      if (shot.x < cam.x - 60 || shot.x > cam.x + vw + 60 || shot.y < cam.y - 60 || shot.y > cam.y + vh + 60) continue;
      const speed=Math.hypot(shot.vx,shot.vy)||1;
      for(let i=0;i<(shot.trail?.length||0);i++){const point=shot.trail[i],ratio=(i+1)/shot.trail.length,s=Math.max(1,shot.radius*ratio*.8);this.ctx.globalAlpha=ratio*.35;this.ctx.fillStyle=shot.color||'#ff6573';this.ctx.fillRect(point.x-s/2,point.y-s/2,s,s);}
      this.ctx.globalAlpha=1;
      this.ctx.strokeStyle=(shot.color||'#ff6573')+'99';this.ctx.lineWidth=shot.radius;
      this.ctx.beginPath();this.ctx.moveTo(shot.x-shot.vx/speed*18,shot.y-shot.vy/speed*18);this.ctx.lineTo(shot.x,shot.y);this.ctx.stroke();
      this.ctx.fillStyle=shot.color||'#ff6874';
      this.ctx.beginPath();this.ctx.arc(shot.x,shot.y,shot.radius,0,Math.PI*2);this.ctx.fill();
      this.ctx.fillStyle='#fff0d8';this.ctx.beginPath();this.ctx.arc(shot.x,shot.y,shot.radius*.4,0,Math.PI*2);this.ctx.fill();
    }
    this.ctx.restore();

    // Reusable sort buffer with camera frustum culling (zero allocation)
    this.renderSortBuffer.length = 0;
    const enemyLen = state.enemies.length;
    for (let i = 0; i < enemyLen; i++) {
      const e = state.enemies[i];
      if (this.entrance?.boss === e) continue; // se dibuja animado en la entrada
      if (e.x >= cam.x - 70 && e.x <= cam.x + vw + 70 && e.y >= cam.y - 70 && e.y <= cam.y + vh + 70) {
        this.renderSortBuffer.push(e);
      }
    }
    this.renderSortBuffer.push(state.player);
    if (state.companion && state.companion.x >= cam.x - 70 && state.companion.x <= cam.x + vw + 70 && state.companion.y >= cam.y - 70 && state.companion.y <= cam.y + vh + 70) {
      this.renderSortBuffer.push(state.companion);
    }
    this.renderSortBuffer.sort((a,b)=>a.y-b.y);
    const actorLen = this.renderSortBuffer.length;
    for (let i = 0; i < actorLen; i++) {
      this.renderSortBuffer[i].draw(this.ctx, state.time);
    }
    drawPrimeEffects(this.ctx,state);
    this.ctx.save();this.ctx.globalCompositeOperation='lighter';
    // Partículas agrupadas por color y por escalón de transparencia (8 pasos, fundido pixel art):
    // un cambio de pintura por grupo en vez de uno por partícula
    const buckets = this.particleBuckets ||= new Map();
    for (const list of buckets.values()) list.length = 0;
    for (const p of state.particles) {
      if (p.x < cam.x - 30 || p.x > cam.x + vw + 30 || p.y < cam.y - 30 || p.y > cam.y + vh + 30) continue;
      const ratio=Math.max(0,Math.min(1,p.life/(p.maxLife||.6)));
      const palette=p.palette,color=palette?palette[Math.min(palette.length-1,Math.floor((1-ratio)*palette.length))]||p.color:p.color;
      const step=Math.max(1,Math.ceil(ratio*8));
      const key=color+step;
      let list=buckets.get(key);
      if(!list){list=[];list.color=color;list.alpha=step/8;buckets.set(key,list);}
      list.push(p);
    }
    for (const list of buckets.values()) {
      if (!list.length) continue;
      this.ctx.globalAlpha = list.alpha;
      this.ctx.fillStyle = list.color;
      for (const p of list) {
        const ratio=Math.max(0,Math.min(1,p.life/(p.maxLife||.6)));
        const s = (p.size || 4)*(.25+.75*ratio);
        this.ctx.fillRect(p.x - s/2, p.y - s/2, s, s);
      }
    }
    if (buckets.size > 400) buckets.clear();
    this.ctx.restore();
    this.ctx.globalAlpha = 1;
    this.ctx.textAlign='center';
    for (const text of state.floaters) {
      if (text.x >= cam.x - 80 && text.x <= cam.x + vw + 80 && text.y >= cam.y - 80 && text.y <= cam.y + vh + 80) {
        drawFloatingText(this.ctx,text,this.reducedMotion);
      }
    }
    if (this.entrance) drawBossEntranceWorld(this.ctx, this.entrance, state.time);
    this.ctx.restore(); // Salimos del espacio de mundo (cámara)

    // Overlays en coordenadas de pantalla (visor completo)
    this.ctx.globalAlpha=1;
    drawScreenCombatOverlays(this.ctx, state, this.reducedMotion);
    if(state.player.hitFlash>0&&!this.reducedMotion){this.ctx.strokeStyle=`rgba(255,80,75,${state.player.hitFlash*3})`;this.ctx.lineWidth=12;this.ctx.strokeRect(6,6,vw-12,vh-12);}

    // Animación de aparición cinemática del Jefe (Pixel Art Boss Intro)
    if (this.entrance) {
      drawBossEntranceScreen(this.ctx, this.entrance, vw, vh, this.bossBannerSprite(this.entrance.boss.type.name.toUpperCase()));
    } else if (state.bossIntro) {
      this.drawBossIntro(state.bossIntro);
    }

    // Miniradar táctico Pixel Art en esquina superior derecha
    this.drawMinimap(state);

    this.ctx.restore();
  }

  drawMinimap(state) {
    const ctx = this.ctx;
    const worldW = state.world?.width || 1920;
    const worldH = state.world?.height || 1080;
    const cam = state.camera || { x: 0, y: 0 };
    const p = state.player;

    // Dimensiones y posición del minimapa (ubicado a la izquierda, debajo del contador de combo)
    const mapW = MINIMAP.w;
    const mapH = MINIMAP.h;
    const mapX = MINIMAP.x;
    const mapY = this.minimapY ?? MINIMAP.y;

    ctx.save();
    // 1. Parte fija (marco, fondo, cuadrícula y etiqueta) pre-dibujada una vez como imagen
    ctx.drawImage(this.minimapFrame(), mapX - 6, mapY - 16);

    // Fondo temático sutil de terreno según mapa
    if (state.mapId === 'beach') {
      ctx.fillStyle = '#0284c755'; ctx.fillRect(mapX, mapY, mapW, mapH * 0.35);
      ctx.fillStyle = '#eab30833'; ctx.fillRect(mapX, mapY + mapH * 0.35, mapW, mapH * 0.65);
    } else if (state.mapId === 'desert') {
      ctx.fillStyle = '#eab30833'; ctx.fillRect(mapX, mapY, mapW, mapH);
    } else if (state.mapId === 'snow') {
      ctx.fillStyle = '#38bdf82b'; ctx.fillRect(mapX, mapY, mapW, mapH);
    } else if (state.mapId === 'lava') {
      ctx.fillStyle = '#ef444433'; ctx.fillRect(mapX, mapY, mapW, mapH);
    }

    // 2. Rectángulo de la cámara actual (Viewport activo)
    const camXRatio = cam.x / worldW;
    const camYRatio = cam.y / worldH;
    const camWRatio = this.view.w / worldW;
    const camHRatio = this.view.h / worldH;
    ctx.strokeStyle = '#486574';
    ctx.fillStyle = '#22384433';
    ctx.fillRect(mapX + camXRatio * mapW, mapY + camYRatio * mapH, camWRatio * mapW, camHRatio * mapH);
    ctx.strokeRect(mapX + camXRatio * mapW, mapY + camYRatio * mapH, camWRatio * mapW, camHRatio * mapH);

    // 3. Items coleccionables / botines (puntos coloreados por rareza)
    for (let i = 0; i < state.items.length; i++) {
      const it = state.items[i];
      const ix = mapX + (it.x / worldW) * mapW;
      const iy = mapY + (it.y / worldH) * mapH;
      ctx.fillStyle = it.rarity?.color || '#38bdf8';
      ctx.fillRect(Math.round(ix) - 1, Math.round(iy) - 1, 3, 3);
    }

    // 4. Enemigos comunes (puntos rojos)
    ctx.fillStyle = '#ff4d4d';
    for (let i = 0; i < state.enemies.length; i++) {
      const enemy = state.enemies[i];
      if (enemy.hp <= 0 || enemy.isBoss) continue;
      const ex = mapX + (enemy.x / worldW) * mapW;
      const ey = mapY + (enemy.y / worldH) * mapH;
      ctx.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 2, 2);
    }

    // 5. Jefes (calaveras/iconos dorados grandes y pulsantes)
    for (let i = 0; i < state.enemies.length; i++) {
      const boss = state.enemies[i];
      if (boss.hp <= 0 || !boss.isBoss) continue;
      const bx = mapX + (boss.x / worldW) * mapW;
      const by = mapY + (boss.y / worldH) * mapH;
      const pulse = Math.sin(performance.now() / 120) * 1.5;
      // Anillo de alerta jefe
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(bx) - 3 - pulse / 2, Math.round(by) - 3 - pulse / 2, 6 + pulse, 6 + pulse);
      // Punto central del jefe
      ctx.fillStyle = '#ff2a44';
      ctx.fillRect(Math.round(bx) - 2, Math.round(by) - 2, 4, 4);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(Math.round(bx) - 1, Math.round(by) - 1, 2, 2);
    }

    // 6. Jugador (punto verde lima brillante con flecha/indicador)
    const px = mapX + (p.x / worldW) * mapW;
    const py = mapY + (p.y / worldH) * mapH;
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(Math.round(px) - 2, Math.round(py) - 2, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2);

    ctx.restore();
  }

  // Marco del minimapa: misma estética de radar pixel, armado una sola vez
  minimapFrame() {
    if (this.minimapFrameCanvas) return this.minimapFrameCanvas;
    const mapW = MINIMAP.w, mapH = MINIMAP.h, ox = 6, oy = 16;
    const canvas = document.createElement('canvas');
    canvas.width = mapW + 12; canvas.height = mapH + 22;
    const c = canvas.getContext('2d');
    c.fillStyle = '#0a1014cc';
    c.fillRect(ox - 4, oy - 4, mapW + 8, mapH + 8);
    c.strokeStyle = '#2d424b'; c.lineWidth = 2;
    c.strokeRect(ox - 4, oy - 4, mapW + 8, mapH + 8);
    c.strokeStyle = '#39535f'; c.lineWidth = 1;
    c.strokeRect(ox - 1, oy - 1, mapW + 2, mapH + 2);
    c.fillStyle = '#121c22ee';
    c.fillRect(ox, oy, mapW, mapH);
    c.strokeStyle = '#1d2f38'; c.lineWidth = 1;
    c.beginPath();
    c.moveTo(ox + mapW / 2, oy); c.lineTo(ox + mapW / 2, oy + mapH);
    c.moveTo(ox, oy + mapH / 2); c.lineTo(ox + mapW, oy + mapH / 2);
    c.stroke();
    c.font = 'bold 8px monospace'; c.fillStyle = '#839da9'; c.textAlign = 'left';
    c.fillText('MAPA', ox, oy - 6);
    this.minimapFrameCanvas = canvas;
    return canvas;
  }

  drawBossIntro(intro) {
    const elapsed = intro.duration - intro.timer;
    const progress = Math.min(1, elapsed / intro.duration);
    const ctx = this.ctx;
    const W = this.view.w, H = this.view.h;

    // 1. Barras de cine negras pixeladas superior e inferior
    const barHeight = 64;
    ctx.fillStyle = '#080c10';
    ctx.fillRect(0, 0, W, barHeight);
    ctx.fillRect(0, H - barHeight, W, barHeight);

    // Borde neón peligro
    ctx.fillStyle = '#ff2a44';
    ctx.fillRect(0, barHeight, W, 4);
    ctx.fillRect(0, H - barHeight - 4, W, 4);

    // Hazard stripes en las barras
    ctx.fillStyle = '#ffcc0033';
    for (let x = -60 + (elapsed * 80) % 60; x < W; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x + 18, 0); ctx.lineTo(x, barHeight); ctx.lineTo(x - 18, barHeight); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, H - barHeight); ctx.lineTo(x + 18, H - barHeight); ctx.lineTo(x, H); ctx.lineTo(x - 18, H); ctx.fill();
    }

    // 2. Flash estroboscópico de alerta roja al inicio
    if (elapsed < 0.35) {
      const flash = (1 - elapsed / 0.35) * 0.38;
      ctx.fillStyle = `rgba(255, 30, 60, ${flash})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 3. Cartel central tipo banner arcade de advertencia (pre-dibujado una vez por jefe)
    const bannerY = Math.round(H * 0.444);
    const slideIn = Math.min(1, elapsed / 0.3);
    const scale = 0.8 + 0.2 * Math.sin(slideIn * Math.PI / 2);
    const banner = this.bossBannerSprite(intro.bossName, intro.eventSubtitle, intro.isEvent);
    ctx.save();
    ctx.translate(W / 2, bannerY);
    ctx.scale(scale, scale);
    ctx.drawImage(banner, -banner.width / 2, -banner.height / 2);
    ctx.restore();
  }

  // Cartel de alerta de jefe/evento: se arma una sola vez por nombre (fondo, borde, esquinas y textos)
  bossBannerSprite(bossName, subtitle, isEvent) {
    this.bossBanners ||= new Map();
    const key = bossName + (subtitle || '');
    const cached = this.bossBanners.get(key);
    if (cached) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = 776; canvas.height = 112;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Fondo del banner con borde pixel-art
    ctx.fillStyle = '#0f171cee';
    ctx.fillRect(-380, -48, 760, 96);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ff3344';
    ctx.strokeRect(-380, -48, 760, 96);

    // Decoración de esquinas pixel
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(-380, -48, 12, 12);
    ctx.fillRect(368, -48, 12, 12);
    ctx.fillRect(-380, 36, 12, 12);
    ctx.fillRect(368, 36, 12, 12);

    // Texto: WARNING / ALERTA DE JEFE O EVENTO
    ctx.textAlign = 'center';
    ctx.font = '900 13px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffcc00';
    const warningText = isEvent || bossName.includes('OLEADA') || bossName.includes('EVENTO') || bossName.includes('LLUVIA') || bossName.includes('PROMO') || bossName.includes('HORA')
      ? '⚠ ¡ALERTA DE EVENTO ESPECIAL! ⚠'
      : '⚠ ¡ALERTA DE PEDIDO ESPECIAL! ⚠';
    ctx.fillText(warningText, 0, -22);

    // Nombre gigante del Boss / Evento
    ctx.font = '900 24px "Press Start 2P", monospace';
    // Sombra pixel
    ctx.fillStyle = '#660011';
    ctx.fillText(bossName, 3, 17);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(bossName, 0, 14);

    // Subtítulo temático
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#86e3bf';
    const sub = subtitle || (bossName.includes('OLEADA') ? '¡ENJAMBRE MASIVO: EL TRIPLE DE ENEMIGOS!' : 'NIVEL DE AMENAZA: EXTREMO · ¡PREPARATE!');
    ctx.fillText(sub, 0, 36);

    // Solo se guarda si la fuente pixel ya cargó; si no, se reintenta en el próximo cuadro
    if (!document.fonts || document.fonts.check('900 24px "Press Start 2P"')) this.bossBanners.set(key, canvas);
    return canvas;
  }

  // Precarga al iniciar la partida: fuente, carteles de jefes, sprites de enemigos y textos frecuentes,
  // para que la llegada de un jefe o el primer combo no traben el juego
  async warmUpRun() {
    try { await document.fonts?.load('900 24px "Press Start 2P"'); await document.fonts?.load('900 13px "Press Start 2P"'); } catch {}
    const scratch = document.createElement('canvas').getContext('2d');
    for (const type of enemyTypes) {
      if (type.boss) this.bossBannerSprite(type.name.toUpperCase());
      drawFood(scratch, type.id, 32, 36, 1, 0, true, false);
      drawFood(scratch, type.id, 32, 36, 1, 0, true, true);
    }
    warmFloatingText([
      { text: 'COMBO 5 / x1.25', kind: 'combo', comboVal: 5 },
      { text: 'COMBO 20 / x2.00', kind: 'combo', comboVal: 20 },
      { text: 'COMBO 30 / x2.50', kind: 'combo', comboVal: 30 },
      { text: 'CHOQUE +15', kind: 'dash', scale: 1.1 },
      { text: '+12 HP', kind: 'heal' },
    ], this.reducedMotion);
  }

  drawBackground() {
    const inGame = ['gameScreen','abilityScreen','pauseScreen'].includes(this.screenId);
    if (inGame) return; // Se dibuja dentro de draw() bajo la cámara
    const menu = ['menuScreen','authScreen','lobbyScreen','shopScreen'].includes(this.screenId);
    const width = menu ? this.canvas.clientWidth : 960;
    const height = menu ? this.canvas.clientHeight : 540;
    if(this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width; this.canvas.height = height;
    }
    const time = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : this.lastTime / 1000;
    drawDiner(this.ctx,width,height,time,menu,this.state?.mapId);
    if (!menu) drawWorldProps(this.ctx, this.state?.mapId || 'diner', time);
  }

  showToast(message) {
    // En partida el aviso se dibuja como imagen; en menús y local sigue siendo el cartel HTML
    if (this.state && ['gameScreen', 'abilityScreen', 'pauseScreen'].includes(this.screenId)) {
      this.hudCanvas?.showToast(message);
      return;
    }
    this.toast.textContent = message;
    this.toast.hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.hidden = true;
    }, 1800);
  }

  // Durante la entrada y la segunda fase la cámara viaja hasta el jefe, aunque el jugador esté lejos;
  // al reanudar, update() la devuelve suavemente al jugador
  focusCameraOn(target, delta) {
    const state = this.state, cam = state?.camera, world = state?.world;
    if (!cam || !world || !target) return;
    const tx = Math.max(0, Math.min(world.width - this.view.w, target.x - this.view.w / 2));
    const ty = Math.max(0, Math.min(world.height - this.view.h, target.y - this.view.h / 2));
    const k = Math.min(1, delta * 7);
    cam.x += (tx - cam.x) * k;
    cam.y += (ty - cam.y) * k;
  }

  // Al terminar la entrada arranca la pelea con ondas de impacto donde aterrizó el jefe
  finishBossEntrance() {
    const boss = this.entrance?.boss;
    this.entrance = null;
    this.input.clear();
    if (!boss || !this.state) return;
    this.state.rings.push({ x: boss.x, y: boss.y, radius: 240, life: 1.2, maxLife: 1.2, color: '#ff3344' });
    this.state.rings.push({ x: boss.x, y: boss.y, radius: 150, life: 0.9, maxLife: 0.9, color: '#ffcc00' });
    this.state.shake = Math.max(this.state.shake || 0, 0.3);
  }

  announceBoss() {
    this.audio.setScene('boss'); this.audio.play('boss');
    const bosses = this.state.enemies.filter(enemy=>enemy.isBoss && enemy.hp > 0);
    if (!bosses.length) return;
    const boss = bosses[0];
    const bossName = bosses.length > 1 ? `¡${bosses.length} GRANDES JEFES!` : boss.type.name.toUpperCase();
    this.showToast('JEFE: ' + bossName);

    // Entrada épica con la partida en pausa: el jefe cae por un pilar de luz
    this.entrance = startBossEntrance(this.state, boss, this.state.camera || { x: 0, y: 0 }, this.view);
    this.state.bossIntro = null;
    this.input.clear();
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${rest}`;
  }
}

// Gotas de mostaza: sombra de aviso que crece en el suelo y la gota pixelada cayendo con estela
function drawMustardDrops(ctx, state) {
  const drops = state.mustardDrops;
  if (!drops?.length) return;
  ctx.save();
  for (const drop of drops) {
    if (drop.delay > 0) continue;
    const p = 1 - Math.max(0, drop.fall) / MUSTARD.fallTime; // 0 arriba -> 1 al tocar el suelo
    ctx.globalAlpha = 0.25 + p * 0.45;
    ctx.fillStyle = '#5c3d00';
    ctx.beginPath(); ctx.ellipse(drop.x, drop.y + 6, 8 + p * 16, 3 + p * 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd34f'; ctx.lineWidth = 2; ctx.globalAlpha = 0.5 + p * 0.4;
    ctx.beginPath(); ctx.ellipse(drop.x, drop.y + 6, MUSTARD.splashRadius * (1.15 - p * 0.15), MUSTARD.splashRadius * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
    const y = drop.y - (1 - p * p) * 260;
    const x = drop.x + Math.sin(drop.wobble + p * 6) * 3;
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#ffe066';
    for (let i = 1; i <= 3; i++) ctx.fillRect(Math.round(x - 2), Math.round(y - 14 - i * 9), 4, 6);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#7a4b00'; ctx.fillRect(Math.round(x - 6), Math.round(y - 10), 12, 16);
    ctx.fillStyle = '#f5b70a'; ctx.fillRect(Math.round(x - 5), Math.round(y - 9), 10, 14);
    ctx.fillStyle = '#ffd34f'; ctx.fillRect(Math.round(x - 4), Math.round(y - 13), 8, 6);
    ctx.fillStyle = '#fff6c2'; ctx.fillRect(Math.round(x - 3), Math.round(y - 7), 3, 5);
  }
  ctx.restore();
}

// Partidas viejas guardaron solo nombres: se traducen a ids para dibujar su combo en el ranking
function resolveLoadout(run) {
  const pick = (id, name, table, fallback) => {
    if (id) return id;
    const text = String(name || '').toLowerCase();
    return table.find(([word]) => text.includes(word))?.[1] || fallback;
  };
  return {
    skinId: pick(run.skinId, run.skin, [['nugget', 'nugget'], ['papa', 'papas'], ['pizza', 'pizza'], ['empanada', 'empanada'], ['chori', 'choripan'], ['domi', 'domi']], 'pancho'),
    weaponId: pick(run.weaponId, run.weapon, [['sniper', 'mustardSniper'], ['mostaza', 'mustardSniper'], ['lluvia', 'friesRain'], ['papa', 'friesRain'], ['explosiv', 'explosiveBread'], ['pan', 'explosiveBread'], ['salsa', 'sauce'], ['chimi', 'sauce'], ['brocheta', 'skewer'], ['espada', 'skewer']], 'fork'),
    companionId: pick(run.companionId, run.companion, [['ketchup', 'ketchup'], ['dron', 'drone'], ['taco', 'taco'], ['soda', 'soda'], ['botell', 'soda'], ['parrilla', 'parrilla']], 'none'),
  };
}
