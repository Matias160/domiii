// ============================================================================
// DOMI 2: PANCHO - CARTELES DEL COMBATE COMO IMÁGENES
// Combo, barra del jefe, evento, avisos y mejoras activas se dibujan en un canvas
// transparente sobre el juego (a la resolución real de la pantalla, texto nítido).
// Cada cartel se arma UNA vez por contenido y queda cacheado como imagen; el canvas
// solo se redibuja cuando algo cambia o hay una animación en curso. Reemplaza a los
// <div> con degradados y drop-shadow de CSS que el navegador repintaba sin parar.
// ============================================================================

import { RUSH_BOSS_GOAL } from '../systems/directorSystem.js';

const PIXEL_FONT = "'Press Start 2P', monospace";
const CACHE_LIMIT = 90;
const COMBO_STEPS = [10, 20, 30];

function gradientText(ctx, text, x, y, size, stops) {
  const grad = ctx.createLinearGradient(0, y - size * 0.6, 0, y + size * 0.5);
  for (const [offset, color] of stops) grad.addColorStop(offset, color);
  return grad;
}

export class HudCanvas {
  constructor(app) {
    this.app = app;
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'hudCanvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    app.insertBefore(this.canvas, app.querySelector('#hud'));
    this.ctx = this.canvas.getContext('2d');
    this.cache = new Map();
    this.signature = '';
    this.toast = null;
    this.comboPop = 0;
    this.previousCombo = 0;
    this.visible = false;
    // Texto accesible: los carteles importantes se anuncian a lectores de pantalla
    this.live = document.createElement('div');
    this.live.className = 'sr-only';
    this.live.setAttribute('aria-live', 'polite');
    app.append(this.live);
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.app.clientWidth, h = this.app.clientHeight;
    if (this.w === w && this.h === h && this.dpr === dpr) return;
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.cache.clear();
    this.signature = '';
  }

  showToast(text) {
    this.toast = { text, t: 0, life: 1.8 };
    this.signature = '';
    if (this.live.textContent !== text) this.live.textContent = text;
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.signature = '';
  }

  // Imagen cacheada por contenido (LRU): se dibuja una sola vez a la resolución de pantalla
  sprite(key, w, h, draw) {
    let entry = this.cache.get(key);
    if (entry) { this.cache.delete(key); this.cache.set(key, entry); return entry; }
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * this.dpr); canvas.height = Math.ceil(h * this.dpr);
    const c = canvas.getContext('2d');
    c.scale(this.dpr, this.dpr);
    draw(c, w, h);
    entry = { canvas, w, h };
    this.cache.set(key, entry);
    if (this.cache.size > CACHE_LIMIT) this.cache.delete(this.cache.keys().next().value);
    return entry;
  }

  measure(text, font) {
    this.ctx.font = font;
    return Math.ceil(this.ctx.measureText(text).width);
  }

  // layout: { hudBottom, minimapBottom } en px de pantalla (los mismos que usaba el CSS)
  render(state, layout, delta, paused) {
    this.resize();
    if (paused || !state) { this.hide(); return; }
    this.visible = true;
    const narrow = this.w <= 700;
    const combo = state.combo || 0;
    if (combo > this.previousCombo) this.comboPop = 0.22;
    this.previousCombo = combo;
    this.comboPop = Math.max(0, this.comboPop - delta);
    if (this.toast) { this.toast.t += delta; if (this.toast.t >= this.toast.life) this.toast = null; }

    const activeBosses = state.enemies.filter(e => e.isBoss && e.hp > 0);
    const boss = activeBosses[0];
    const event = state.activeEvent;
    const snowAlert = state.mapId === 'snow' && (state.mapWarning || state.wasFreezing);
    const buffs = this.buffText(state.player);
    const eventInfo = this.eventInfo(state, event, snowAlert);
    const totalHp = activeBosses.reduce((s, b) => s + b.hp, 0);
    const totalMaxHp = activeBosses.reduce((s, b) => s + b.maxHp, 0) || 1;
    const bossFill = boss ? Math.round(Math.max(0, totalHp / totalMaxHp) * 200) : -1;
    const signature = [this.w, this.h, layout.hudBottom, layout.minimapBottom,
      bossFill, activeBosses.length, boss?.type.name, boss?.enraged, boss?.bossRank, eventInfo?.text, buffs,
      this.toast?.text, this.toast && (this.toast.t < 0.22 || this.toast.t > this.toast.life - 0.3)].join('|');
    // Sin cambios ni animaciones en curso: el canvas queda como está
    if (signature === this.signature && !(this.toast && (this.toast.t < 0.22 || this.toast.t > this.toast.life - 0.3))) return;
    this.signature = signature;

    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const left = narrow ? 8 : 24;
    // El contador de racha se eliminó del HUD en combate por diseño; se mantiene en la pantalla de pausa
    if (eventInfo) this.drawEvent(ctx, eventInfo, left, layout.minimapBottom + 12);
    if (boss) this.drawBossMeter(ctx, boss, narrow, layout.hudBottom, activeBosses);
    if (buffs) this.drawBuffs(ctx, buffs, narrow ? layout.hudBottom + 6 : 91);
    if (this.toast) this.drawToast(ctx, this.toast, narrow);
  }

  buffText(p) {
    const labels = [['damageTime', 'DANO'], ['speedTime', 'VELOCIDAD'], ['fireTime', 'CADENCIA']];
    const active = labels.filter(([key]) => p.buffs[key] > 0).map(([key, label]) => `${label} ${Math.ceil(p.buffs[key])}s`);
    if (p.comboFeverTime > 0) active.push(`FIEBRE ${Math.ceil(p.comboFeverTime)}s`);
    return active.join(' / ');
  }

  eventInfo(state, event, snowAlert) {
    if (snowAlert) {
      return { name: state.wasFreezing ? 'VENTISCA / SUELO HELADO' : 'SE ACERCA UNA VENTISCA', time: Math.ceil((state.wasFreezing ? 34 : 28) - state.mapClock % 34) + 's', color: '#a2aaa4' };
    }
    if (event) return { name: event.name, time: Math.ceil(state.eventRemaining) + 's', color: event.color || '#a2aaa4' };
    if (state.nightShift) return { name: `🌙 NOCTURNO 24HS (NV ${state.nightShiftLevel || 1})`, time: `x${((state.nightShiftLevel || 1) * 0.5 + 1).toFixed(1)}`, color: '#c084fc' };
    if (state.modeId === 'rush') return { name: `DUELO DE JEFES ${state.bossesKilled || 0}/${RUSH_BOSS_GOAL}`, time: '', color: '#a2aaa4' };
    return null;
  }

  drawCombo(ctx, combo, x, y, narrow) {
    const multiplier = Math.min(3, 1 + Math.floor(combo / 5) * 0.25);
    const next = COMBO_STEPS.find(goal => combo < goal);
    const key = `combo|${multiplier}|${combo}|${narrow}`;
    const W = 220, H = 78;
    const sprite = this.sprite(key, W + 6, H + 6, c => {
      // Sombra del panel (antes filter: drop-shadow)
      c.fillStyle = '#071014aa'; c.fillRect(4, 4, W, 46);
      c.fillStyle = '#111b1d'; c.fillRect(0, 0, W, 46);
      c.strokeStyle = '#dbe7dc'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, W - 3, 43);
      // Ícono: llama pixelada de racha
      const flame = [[2, 0, '#ffe066'], [1, 1, '#ffb02e'], [2, 1, '#ffe066'], [3, 1, '#ffb02e'], [0, 2, '#ff6b35'], [1, 2, '#ffb02e'], [2, 2, '#fff3b0'], [3, 2, '#ffb02e'], [4, 2, '#ff6b35'], [0, 3, '#ff6b35'], [1, 3, '#ffb02e'], [2, 3, '#ffe066'], [3, 3, '#ffb02e'], [4, 3, '#ff6b35'], [1, 4, '#ff6b35'], [2, 4, '#ff4b2b'], [3, 4, '#ff6b35']];
      for (const [fx, fy, color] of flame) { c.fillStyle = color; c.fillRect(12 + fx * 5, 9 + fy * 5, 5, 5); }
      // Multiplicador con degradado y brillo
      const text = `x${multiplier.toFixed(2)}`;
      c.font = `18px ${PIXEL_FONT}`; c.textBaseline = 'middle';
      c.fillStyle = '#050a0e'; c.fillText(text, 44, 26);
      c.save();
      c.shadowColor = 'rgba(255, 120, 0, 0.75)'; c.shadowBlur = 8;
      c.fillStyle = gradientText(c, text, 42, 24, 18, [[0, '#ffffff'], [0.35, '#ffe600'], [0.7, '#ff5500'], [1, '#d60036']]);
      c.fillText(text, 42, 24);
      c.restore();
      if (!narrow) {
        c.font = `9px ${PIXEL_FONT}`; c.textAlign = 'right';
        c.save(); c.shadowColor = 'rgba(0, 255, 255, 0.65)'; c.shadowBlur = 6;
        c.fillStyle = '#00ffff'; c.fillText(combo ? `${combo} KOs` : 'INICIÁ LA RACHA', W - 10, 24);
        c.restore(); c.textAlign = 'left';
      }
      // Escalones x10 / x20 / x30
      c.font = `bold 14px ${PIXEL_FONT}`; c.textAlign = 'center';
      COMBO_STEPS.forEach((goal, i) => {
        const sx = W / 2 + (i - 1) * 66, reached = combo >= goal, isNext = goal === next;
        const sy = 66 - (isNext ? 2 : 0), label = `x${goal}`;
        c.save();
        if (reached) { c.shadowColor = 'rgba(0, 230, 118, 0.85)'; c.shadowBlur = 6; c.fillStyle = gradientText(c, label, sx, sy, 14, [[0, '#ffffff'], [0.5, '#38ffff'], [1, '#00e676']]); }
        else if (isNext) { c.shadowColor = 'rgba(255, 110, 0, 0.75)'; c.shadowBlur = 6; c.fillStyle = gradientText(c, label, sx, sy, 14, [[0, '#ffffff'], [0.4, '#ffbe3b'], [1, '#ff5500']]); }
        else c.fillStyle = '#65716e';
        c.fillText(label, sx, sy);
        c.restore();
      });
    });
    const scale = (narrow ? 0.72 : 1) * (1 + 0.12 * (this.comboPop / 0.22));
    ctx.save();
    ctx.globalAlpha = combo > 0 ? 1 : 0.55;
    ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.drawImage(sprite.canvas, 0, 0, sprite.w, sprite.h);
    ctx.restore();
  }

  drawEvent(ctx, info, x, y) {
    const font = `9px ${PIXEL_FONT}`;
    const nameW = this.measure(info.name, font), timeW = info.time ? this.measure(info.time, font) + 12 : 0;
    const W = Math.min(260, nameW + timeW + 34), H = 35;
    const sprite = this.sprite(`event|${info.name}|${info.time}|${info.color}|${W}`, W + 5, H + 5, c => {
      c.fillStyle = '#000'; c.fillRect(4, 4, W, H);
      c.fillStyle = '#0f171bfa'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#000'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, W - 3, H - 3);
      c.fillStyle = info.color; c.fillRect(0, 0, 6, H);
      c.font = font; c.textBaseline = 'middle';
      c.save(); c.beginPath(); c.rect(14, 0, W - 18, H); c.clip();
      c.fillStyle = info.color; c.fillText(info.name, 18, H / 2 + 1);
      if (info.time) { c.fillStyle = '#e7f1ea'; c.fillText(info.time, 18 + nameW + 12, H / 2 + 1); }
      c.restore();
    });
    ctx.drawImage(sprite.canvas, x, y, sprite.w, sprite.h);
  }

  drawBossMeter(ctx, boss, narrow, hudBottom, activeBosses = [boss]) {
    const W = narrow ? 220 : Math.min(360, this.w * 0.9), H = 52;
    const x = narrow ? this.w - 8 - W : (this.w - W) / 2;
    const y = narrow ? hudBottom + 24 : Math.max(88, hudBottom + 22);
    const count = activeBosses?.length || 1;
    const base = count > 1
      ? `¡${count} GRANDES JEFES!`
      : (boss.bossRank ? `#${boss.bossRank} ${boss.type.name.toUpperCase()}` : boss.type.name.toUpperCase());
    const title = count > 1 ? base : (boss.enraged ? `${base} · ¡FURIOSO!` : `${base} · FASE 1/2`);
    const border = boss.enraged || count > 1 ? '#ff2a44' : '#ff3344';
    // El título se achica hasta entrar en la barra (nombres largos en pantallas angostas)
    let titleSize = 10;
    while (titleSize > 6 && this.measure(title, `${titleSize}px ${PIXEL_FONT}`) > W - 18) titleSize -= 1;
    const frame = this.sprite(`boss|${title}|${W}|${titleSize}`, W + 24, H + 24, c => {
      c.translate(10, 8);
      c.save(); c.shadowColor = 'rgba(255, 51, 68, 0.45)'; c.shadowBlur = 18;
      c.fillStyle = '#0d161ae6'; c.fillRect(0, 0, W, H); c.restore();
      c.fillStyle = '#000'; c.fillRect(4, H, W, 4); c.fillRect(W, 4, 4, H);
      c.fillStyle = '#0d161ae6'; c.fillRect(0, 0, W, H);
      c.strokeStyle = border; c.lineWidth = 3; c.strokeRect(1.5, 1.5, W - 3, H - 3);
      c.fillStyle = '#000'; c.fillRect(0, H - 5, W, 5);
      c.font = `${titleSize}px ${PIXEL_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#000'; c.fillText(title, W / 2 + 1, 17);
      c.fillStyle = '#ffcc00'; c.fillText(title, W / 2, 16);
      c.fillStyle = '#000'; c.fillRect(13, 27, W - 26, 16);
      c.fillStyle = '#180508'; c.fillRect(15, 29, W - 30, 12);
    });
    ctx.drawImage(frame.canvas, x - 10, y - 8, frame.w, frame.h);
    // El relleno de vida se calcula con la suma de vida de todos los jefes activos
    const totalHp = activeBosses.reduce((s, b) => s + b.hp, 0);
    const totalMaxHp = activeBosses.reduce((s, b) => s + b.maxHp, 0) || 1;
    const ratio = Math.max(0, totalHp / totalMaxHp), fillW = Math.round((W - 30) * ratio);
    if (fillW > 0) {
      const grad = ctx.createLinearGradient(x + 15, 0, x + W - 15, 0);
      grad.addColorStop(0, '#d00000'); grad.addColorStop(0.5, '#e85d04'); grad.addColorStop(1, '#ffba08');
      ctx.fillStyle = grad; ctx.fillRect(x + 15, y + 29, fillW, 12);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.fillRect(x + 15, y + 29, fillW, 2);
    }
  }

  drawBuffs(ctx, text, y) {
    const font = `bold 11px monospace`;
    const W = this.measure(text, font) + 12, H = 18;
    const sprite = this.sprite(`buffs|${text}`, W, H, c => {
      c.fillStyle = '#15191ccc'; c.fillRect(0, 0, W, H);
      c.font = font; c.textBaseline = 'middle';
      c.fillStyle = '#000'; c.fillText(text, 7, H / 2 + 1);
      c.fillStyle = '#f6d25b'; c.fillText(text, 6, H / 2);
    });
    ctx.drawImage(sprite.canvas, this.w - 18 - W, y, sprite.w, sprite.h);
  }

  drawToast(ctx, toast, narrow) {
    const font = `9px ${PIXEL_FONT}`;
    const W = Math.min(this.w - 24, this.measure(toast.text, font) + toast.text.length + 46), H = 34;
    const sprite = this.sprite(`toast|${toast.text}|${W}`, W + 24, H + 24, c => {
      c.translate(10, 8);
      c.save(); c.shadowColor = 'rgba(255, 204, 0, 0.4)'; c.shadowBlur = 16;
      c.fillStyle = '#141f24'; c.fillRect(0, 0, W, H); c.restore();
      c.fillStyle = '#000'; c.fillRect(5, H, W, 5); c.fillRect(W, 5, 5, H);
      c.fillStyle = '#141f24'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#000'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, W - 3, H - 3);
      c.fillStyle = '#ffcc00'; c.fillRect(0, 0, 6, H);
      c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '1px';
      c.fillStyle = '#000'; c.fillText(toast.text, W / 2 + 4, H / 2 + 2);
      c.fillStyle = '#ffea75'; c.fillText(toast.text, W / 2 + 3, H / 2 + 1);
    });
    // Entra deslizándose (0.22 s) y se desvanece al final
    const enter = Math.min(1, toast.t / 0.22), exit = Math.min(1, (toast.life - toast.t) / 0.3);
    const x = (this.w - W) / 2, y = this.h - (narrow ? 80 : 104) - H + (1 - enter) * 10;
    ctx.save();
    ctx.globalAlpha = Math.min(enter, exit);
    ctx.drawImage(sprite.canvas, x - 10, y - 8, sprite.w, sprite.h);
    ctx.restore();
  }
}
