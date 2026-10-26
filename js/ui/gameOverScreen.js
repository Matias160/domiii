import { phrases } from "../data/phrases.js";
import { formatTime } from "./hud.js";
import {currentAccount} from '../systems/accountSystem.js';
import {shopItems,isOwned} from '../data/shop.js';
import {drawItemPreview} from '../core/presentation.js';

export function nextUnlock(profile){
  if(!profile)return '';
  const next=shopItems.filter(item=>item.cost > 0 && !isOwned(profile,item.type,item.id)).sort((a,b)=>a.cost-b.cost)[0];
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
  }

  render(result, previousBest) {
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
      if (bannerElem) bannerElem.hidden = true;
      if (eyebrowElem) eyebrowElem.hidden = true;
      if (titleElem) titleElem.hidden = true;
      if (this.phrase) this.phrase.hidden = true;
      if (this.stats) { this.stats.hidden = true; this.stats.innerHTML = ''; }
      if (achievementsElem) { achievementsElem.hidden = true; achievementsElem.replaceChildren(); }

      if (this.victorySection) {
        this.victorySection.hidden = false;
        if (this.victoryGif) {
          this.victoryGif.src = './final.gif?v=' + Date.now();
        }
      }
      return;
    }

    // MODO NORMAL (Derrota o victoria en cualquier otro mapa)
    if (this.victorySection) {
      this.victorySection.hidden = true;
    }

    if (bannerElem) {
      bannerElem.hidden = false;
      const bannerText = isVictory ? '¡GANASTE!' : isAbandoned ? 'TURNO ABANDONADO' : 'GAME OVER';
      const bannerColor = isVictory ? '#00ff88' : isAbandoned ? '#ffcc00' : '#ff2244';
      bannerElem.textContent = bannerText;
      bannerElem.style.color = bannerColor;
      bannerElem.className = `gameover-pixel-banner ${isVictory ? 'gameover-pixel-banner--win' : 'gameover-pixel-banner--loss'}`;
    }

    if (eyebrowElem) {
      eyebrowElem.hidden = false;
      eyebrowElem.textContent = isVictory ? '★ VICTORIA TOTAL ★' : 'FIN DE LA PARTIDA';
    }
    if (titleElem) {
      titleElem.hidden = false;
      titleElem.textContent = isVictory ? '¡COMBO COMPLETO!' : isAbandoned ? 'TURNO CERRADO' : '¡TE HICIERON COMPLETO!';
    }
    if (this.phrase) {
      this.phrase.hidden = false;
      const phrase = phrases.gameOver[Math.floor(Math.random() * phrases.gameOver.length)];
      this.phrase.textContent = isVictory ? '¡La cocina tiene un nuevo rey indiscutido!' : isAbandoned ? 'El mostrador siempre estará listo para tu regreso.' : phrase;
    }

    if (this.stats) {
      this.stats.hidden = false;
      const isRecord = result.score > previousBest;
      this.stats.innerHTML = `
        <div class="result-summary"><span>${isRecord?'¡NUEVO RÉCORD!':'PUNTOS GANADOS'}</span><div class="result-points"><b>+${Math.max(0,Math.floor(result.score))} PT</b><i class="result-coin" aria-hidden="true"><em></em></i></div><span>Tu mejor marca: ${Math.max(previousBest,result.score)}</span></div>
        <p><strong>Tiempo:</strong> ${formatTime(result.time)}</p>
        <p><strong>Enemigos derrotados:</strong> ${result.kills}</p>
        <p><strong>Jefes derrotados:</strong> ${result.bossesKilled || 0}</p>
        <p><strong>Objetos recogidos:</strong> ${Object.values(result.pickups || {}).reduce((sum, count) => sum + count, 0)}</p>
        <p><strong>Recorrido:</strong> ${Math.floor((result.distance || 0) / 100)} m</p>
        <p><strong>Dificultad:</strong> ${result.difficulty}</p>
        <p><strong>Nivel alcanzado:</strong> ${result.level}</p>
        <p><strong>Skin:</strong> ${result.skin}</p>
        <p><strong>Arma:</strong> ${result.weapon}</p>
        <p><strong>Récord anterior:</strong> ${previousBest}</p>
        <p><strong>Mejor combo:</strong> ${result.peakCombo || 0} KOs</p>
        <p><strong>Modo:</strong> ${result.mode}</p>
        <p><strong>Compañero:</strong> ${result.companion}</p>
      `;

      const profile = currentAccount();
      const unlockText = nextUnlock(profile);
      if (unlockText) {
        const nextItem = profile ? shopItems.filter(item => item.cost > 0 && !isOwned(profile, item.type, item.id)).sort((a, b) => a.cost - b.cost)[0] : null;
        const unlockWrapper = document.createElement('div');
        unlockWrapper.className = 'result-unlock-wrapper';

        if (nextItem) {
          const thumb = document.createElement('canvas');
          thumb.width = 36;
          thumb.height = 36;
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
