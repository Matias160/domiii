import { phrases } from "../data/phrases.js";
import { formatTime } from "./hud.js";
import {currentAccount} from '../systems/accountSystem.js';
import {shopItems,isOwned} from '../data/shop.js';
import {drawItemPreview} from '../core/presentation.js';
import {saveRun, getRanking, cleanArcadeName, ARCADE_NAME_LENGTH} from '../systems/rankingSystem.js';

export function nextUnlock(profile){
  if(!profile)return '';
  // Solo se sugieren artículos comprables: los de costo 0 son premios exclusivos de Don Domi
  const next=shopItems.filter(item=>item.cost>0&&!isOwned(profile,item.type,item.id)).sort((a,b)=>a.cost-b.cost)[0];
  if(!next)return '¡Completaste la colección!';
  const missing=Math.max(0,next.cost-profile.bank);
  return missing?`Próximo desbloqueo: ${next.name}. Te faltan ${missing} PT.`:`¡Ya podés comprar ${next.name} en la tienda!`;
}

export class GameOverScreen {
  constructor(game) {
    this.game = game;
    this.phrase = document.querySelector("#gameOverPhrase");
    this.stats = document.querySelector("#gameOverStats");
    this.victorySection = document.querySelector("#victoryCelebration");
    this.victoryGif = document.querySelector("#victoryGif");
    document.querySelector("#retryButton").addEventListener("click", () => game.restartLastRun());
    document.querySelector("#gameOverMenuButton").addEventListener("click", () => game.showScreen("lobbyScreen"));
    // Top 10 para invitados: nombre de arcade de hasta 5 letras
    this.topTen = document.querySelector('#topTenEntry');
    this.topTenName = document.querySelector('#topTenName');
    this.topTenStatus = document.querySelector('#topTenStatus');
    this.topTenName?.addEventListener('input', () => {
      const clean = cleanArcadeName(this.topTenName.value);
      if (clean !== this.topTenName.value) this.topTenName.value = clean;
    });
    this.topTen?.addEventListener('submit', event => {
      event.preventDefault();
      this.saveArcadeName();
    });
  }

  // Se llama solo cuando juega un invitado y su puntaje entra en el Top 10
  offerArcadeName(result) {
    if (!this.topTen) return;
    this.pendingRun = result;
    this.topTen.hidden = false;
    this.topTen.classList.remove('is-saved');
    this.topTenName.value = '';
    this.topTenName.disabled = false;
    document.querySelector('#topTenSave').disabled = false;
    this.topTenStatus.textContent = `Puntaje: ${Math.floor(result.score).toLocaleString('es-AR')} PT`;
    setTimeout(() => this.topTenName.focus(), 50);
  }

  hideArcadeName() {
    this.pendingRun = null;
    if (this.topTen) this.topTen.hidden = true;
  }

  saveArcadeName() {
    const name = cleanArcadeName(this.topTenName.value);
    if (!this.pendingRun) return false;
    if (!name) {
      this.topTenStatus.textContent = `Escribí de 1 a ${ARCADE_NAME_LENGTH} letras o números.`;
      this.topTenName.focus();
      return false;
    }
    const run = { ...this.pendingRun, name };
    this.pendingRun = null;
    saveRun(run);
    const position = getRanking().findIndex(entry => entry.id === run.id) + 1;
    this.topTenName.disabled = true;
    document.querySelector('#topTenSave').disabled = true;
    this.topTen.classList.add('is-saved');
    this.topTenStatus.textContent = position ? `¡Guardado! ${name} quedó en el puesto #${position}.` : '¡Guardado!';
    this.game.audio?.play('confirm');
    return true;
  }

  render(result, previousBest) {
    this.hideArcadeName();
    const isLavaBossVictory = result.outcome === 'victory' && result.map === 'lava';
    const isVictory = result.outcome === 'victory';
    const isAbandoned = result.outcome === 'abandoned';

    const bannerElem = document.querySelector('#gameOverPixelBanner');
    const eyebrowElem = document.querySelector('#resultEyebrow');
    const titleElem = document.querySelector('#resultTitle');
    const achievementsElem = document.querySelector('#newAchievements');
    const panel = document.querySelector('.gameOver-panel-enhanced');

    if (panel) {
      panel.classList.toggle('is-legendary-lava-victory', isLavaBossVictory);
    }

    // SI ES LA VICTORIA DEL JEFE FINAL EN EL ÚLTIMO MAPA:
    // SOLO el GIF, NADA de información adicional.
    if (isLavaBossVictory) {
      if (bannerElem) { bannerElem.hidden = true; bannerElem.style.display = 'none'; }
      if (eyebrowElem) { eyebrowElem.hidden = true; eyebrowElem.style.display = 'none'; }
      if (titleElem) { titleElem.hidden = true; titleElem.style.display = 'none'; }
      if (this.phrase) { this.phrase.hidden = true; this.phrase.style.display = 'none'; }
      if (this.stats) { this.stats.hidden = true; this.stats.style.display = 'none'; this.stats.innerHTML = ''; }
      if (achievementsElem) { achievementsElem.hidden = true; achievementsElem.style.display = 'none'; achievementsElem.replaceChildren(); }

      if (this.victorySection) {
        this.victorySection.hidden = false;
        this.victorySection.style.display = 'flex';
        if (this.victoryGif) {
          this.victoryGif.src = './final.gif?v=' + Date.now();
        }
      }
      return;
    }

    // MODO NORMAL (Derrota o victoria en cualquier otro mapa)
    if (this.victorySection) {
      this.victorySection.hidden = true;
      this.victorySection.style.display = 'none';
    }

    if (bannerElem) {
      bannerElem.hidden = false;
      bannerElem.style.display = '';
      const bannerText = isVictory ? '¡GANASTE!' : isAbandoned ? 'TURNO ABANDONADO' : 'GAME OVER';
      const bannerColor = isVictory ? '#00ff88' : isAbandoned ? '#ffcc00' : '#ff2244';
      bannerElem.textContent = bannerText;
      bannerElem.style.color = bannerColor;
      bannerElem.className = `gameover-pixel-banner ${isVictory ? 'gameover-pixel-banner--win' : isAbandoned ? 'gameover-pixel-banner--abandoned' : 'gameover-pixel-banner--loss'}`;
    }

    if (eyebrowElem) {
      eyebrowElem.hidden = false;
      eyebrowElem.style.display = '';
      eyebrowElem.textContent = isVictory ? '★ VICTORIA TOTAL ★' : 'FIN DE LA PARTIDA';
    }
    if (titleElem) {
      titleElem.hidden = false;
      titleElem.style.display = '';
      titleElem.textContent = isVictory ? '¡COMBO COMPLETO!' : isAbandoned ? 'TURNO CERRADO' : '¡TE HICIERON COMPLETO!';
    }
    if (this.phrase) {
      this.phrase.hidden = false;
      this.phrase.style.display = '';
      const phrase = phrases.gameOver[Math.floor(Math.random() * phrases.gameOver.length)];
      this.phrase.textContent = isVictory ? '¡La cocina tiene un nuevo rey indiscutido!' : isAbandoned ? 'El mostrador siempre estará listo para tu regreso.' : phrase;
    }

    if (this.stats) {
      this.stats.hidden = false;
      this.stats.style.display = '';
      const isRecord = result.score > previousBest;
      this.stats.innerHTML = `
        <div class="result-summary">
          <span class="result-summary-label">${isRecord ? '¡NUEVO RÉCORD!' : 'PUNTOS GANADOS'}</span>
          <div class="result-points">
            <b>+${Math.max(0, Math.floor(result.score))} PT</b>
            <i class="result-coin" aria-hidden="true"><span class="result-coin-glyph">$</span></i>
          </div>
          <span class="result-summary-best">Tu mejor marca: ${Math.max(previousBest, result.score)}</span>
        </div>
        <div class="result-stats-grid">
          <div class="result-stat-box"><strong>Tiempo</strong><b>${formatTime(result.time)}</b></div>
          <div class="result-stat-box"><strong>Enemigos</strong><b>${result.kills} KOs</b></div>
          <div class="result-stat-box"><strong>Jefes K.O.</strong><b>${result.bossesKilled || 0}</b></div>
          <div class="result-stat-box"><strong>Objetos</strong><b>${Object.values(result.pickups || {}).reduce((sum, count) => sum + count, 0)}</b></div>
          <div class="result-stat-box"><strong>Recorrido</strong><b>${Math.floor((result.distance || 0) / 100)} m</b></div>
          <div class="result-stat-box"><strong>Dificultad</strong><b>${result.difficulty}</b></div>
          <div class="result-stat-box"><strong>Nivel</strong><b>Nv. ${result.level}</b></div>
          <div class="result-stat-box"><strong>Combo Max</strong><b>${result.peakCombo || 0} KOs</b></div>
          <div class="result-stat-box"><strong>Skin</strong><b>${result.skin}</b></div>
          <div class="result-stat-box"><strong>Arma</strong><b>${result.weapon}</b></div>
          <div class="result-stat-box"><strong>Modo</strong><b>${result.mode}</b></div>
          <div class="result-stat-box"><strong>Mascota</strong><b>${result.companion}</b></div>
        </div>
      `;

      const profile = currentAccount();
      const unlockText = nextUnlock(profile);
      if (unlockText) {
        const nextItem = profile ? shopItems.filter(item => item.cost > 0 && !isOwned(profile, item.type, item.id)).sort((a, b) => a.cost - b.cost)[0] : null;
        const unlockWrapper = document.createElement('div');
        unlockWrapper.className = 'result-unlock-wrapper';

        if (nextItem) {
          const thumb = document.createElement('canvas');
          thumb.width = 44;
          thumb.height = 44;
          thumb.className = 'result-unlock-thumb';
          try {
            drawItemPreview(thumb, nextItem, profile, 0);
            unlockWrapper.append(thumb);
          } catch {}
        }

        const unlock = document.createElement('p');
        unlock.className = 'result-unlock';
        unlock.textContent = unlockText;
        unlockWrapper.append(unlock);
        this.stats.append(unlockWrapper);
      }
    }

    if (achievementsElem) {
      achievementsElem.hidden = false;
      achievementsElem.replaceChildren();
      for (const name of result.newAchievements || []) {
        const item = document.createElement('p');item.textContent='NUEVO LOGRO / '+name;achievementsElem.append(item);
      }
    }
  }
}
