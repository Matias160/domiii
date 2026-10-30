import { drawFood } from '../core/art.js';
export class Hud {
  constructor() {
    this.root = document.querySelector('#hud');
    this.hpFill = document.querySelector('#hpFill'); this.xpFill = document.querySelector('#xpFill');
    this.dashControl = document.querySelector('#dashControl');
    this.dashControl.addEventListener('animationend', () => this.dashControl.classList.remove('dash-refilled'));
    // Valores ya escritos en el DOM: solo se toca un elemento cuando su valor cambia
    this.written = new Map();
    const stats = document.querySelector('#hudStats');
    stats.innerHTML = '<span>TIEMPO<b id="timeValue">00:00</b></span><span>KOs<b id="killsValue">0</b></span><span>PUNTOS<b id="scoreValue">000000</b></span>';
    this.nodes = Object.fromEntries(['hpValue','levelValue','scoreValue','timeValue','killsValue','dashLabel','dashFill'].map(id=>[id,document.getElementById(id)]));
    this.root.addEventListener('animationend',()=>this.root.classList.remove('hud--hit'));
  }
  show(isPaused = false) {
    this.root.hidden = false;
    this.dashControl.hidden = isPaused;
  }
  hide() { this.root.hidden = true; this.dashControl.hidden = true; }
  set(id, text) { if (this.nodes[id] && this.nodes[id].textContent !== text) this.nodes[id].textContent = text; }
  // Escribe estilos/atributos solo si cambiaron: evita que el navegador recalcule el HUD en cada cuadro
  style(element, prop, value) { const key = element.id + '|' + prop; if (this.written.get(key) === value) return; this.written.set(key, value); element.style.setProperty(prop, value); }
  data(element, name, value) { if (element.dataset[name] !== value) element.dataset[name] = value; }
  attr(element, name, value) { if (element.getAttribute(name) !== value) element.setAttribute(name, value); }
  update(state) {
    const p = state.player;
    if (this.previousLevel !== undefined && p.level > this.previousLevel) {
      this.xpFill.classList.remove('xp-level-up');
      requestAnimationFrame(() => this.xpFill.classList.add('xp-level-up'));
    }
    this.previousLevel = p.level;

    if(this.previousHp!==undefined&&p.hp<this.previousHp){
      this.root.classList.remove('hud--hit');
      requestAnimationFrame(() => this.root.classList.add('hud--hit'));
    }
    this.previousHp=p.hp;
    this.data(this.root,'danger',String(p.hp/p.maxHp<.25));
    this.style(this.hpFill,'width',`${Math.max(0,p.hp/p.maxHp*100).toFixed(1)}%`);
    this.style(this.xpFill,'width',`${(p.xp/p.xpToNext*100).toFixed(1)}%`);
    this.set('hpValue',`${Math.ceil(p.hp)} / ${p.maxHp}`); this.set('levelValue',`NV ${p.level}`);
    this.set('scoreValue',String(Math.floor(state.score)).padStart(6,'0'));
    this.set('timeValue',formatTime(state.time)); this.set('killsValue',String(state.kills));
    // Combo, jefe, evento y mejoras activas ahora son imágenes en el canvas de carteles (hudCanvas.js)
    const isDashReady = p.dashCooldown <= 0;
    if (isDashReady && this.wasDashReady === false) this.dashControl.classList.add('dash-refilled');
    this.wasDashReady = isDashReady;
    const maxDashCd = 2.8 * (p.dashCooldownMultiplier || 1);
    this.attr(this.dashControl,'aria-disabled', String(!isDashReady));
    this.data(this.dashControl,'active',String(p.dashTime > 0));
    this.set('dashLabel',p.dashTime>0?'IMPACTO':p.dashCooldown>0?`${p.dashCooldown.toFixed(1)} s`:'LISTO');
    if (this.dashControl) {
      this.data(this.dashControl,'status',isDashReady ? 'ready' : 'cooldown');
      this.data(this.dashControl,'ready',String(isDashReady));
      if (this.dashControl.classList.contains('is-ready') !== isDashReady) {
        this.dashControl.classList.toggle('is-ready', isDashReady);
        this.dashControl.classList.toggle('is-cooldown', !isDashReady);
      }
      this.style(this.dashControl,'--charge', `${Math.round(Math.max(0, Math.min(1, 1-p.dashCooldown/maxDashCd))*100)}%`);
    }
    if (this.nodes.dashFill) {
      this.style(this.nodes.dashFill,'width', `${Math.round(Math.max(0, Math.min(1, 1-p.dashCooldown/maxDashCd))*100)}%`);
    }
    this.skin=p.skin.id;
  }
}
export function formatTime(seconds) { return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`; }
