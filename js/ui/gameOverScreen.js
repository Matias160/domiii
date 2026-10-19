import { phrases } from "../data/phrases.js";
import { formatTime } from "./hud.js";
import {currentAccount} from '../systems/accountSystem.js';
import {shopItems,isOwned} from '../data/shop.js';

export function nextUnlock(profile){
  if(!profile)return '';
  const next=shopItems.filter(item=>!isOwned(profile,item.type,item.id)).sort((a,b)=>a.cost-b.cost)[0];
  if(!next)return '¡Completaste la colección!';
  const missing=Math.max(0,next.cost-profile.bank);
  return missing?`Próximo desbloqueo: ${next.name}. Te faltan ${missing} PT.`:`¡Ya podés comprar ${next.name} en la tienda!`;
}

export class GameOverScreen {
  constructor(game) {
    this.game = game;
    this.phrase = document.querySelector("#gameOverPhrase");
    this.stats = document.querySelector("#gameOverStats");
    document.querySelector("#retryButton").addEventListener("click", () => game.restartLastRun());
    document.querySelector("#gameOverMenuButton").addEventListener("click", () => game.showScreen("lobbyScreen"));
  }

  render(result, previousBest) {
    const isVictory = result.outcome === 'victory';
    const isAbandoned = result.outcome === 'abandoned';
    const bannerText = isVictory ? '¡GANASTE!' : isAbandoned ? 'TURNO ABANDONADO' : 'GAME OVER';
    const bannerColor = isVictory ? '#00ff88' : isAbandoned ? '#ffcc00' : '#ff2244';
    
    const bannerElem = document.querySelector('#gameOverPixelBanner');
    if (bannerElem) {
      bannerElem.textContent = bannerText;
      bannerElem.style.color = bannerColor;
      bannerElem.className = `gameover-pixel-banner ${isVictory ? 'gameover-pixel-banner--win' : 'gameover-pixel-banner--loss'}`;
    }

    document.querySelector('#resultTitle').textContent = isVictory ? '¡COMBO COMPLETO!' : isAbandoned ? 'TURNO CERRADO' : '¡TE HICIERON COMPLETO!';
    document.querySelector('#resultEyebrow').textContent = isVictory ? '★ VICTORIA TOTAL ★' : 'FIN DE LA PARTIDA';
    
    const phrase = phrases.gameOver[Math.floor(Math.random() * phrases.gameOver.length)];
    this.phrase.textContent = isVictory ? '¡La cocina tiene un nuevo rey indiscutido!' : isAbandoned ? 'El mostrador siempre estará listo para tu regreso.' : phrase;
    
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
    const unlock=document.createElement('p');unlock.className='result-unlock';unlock.textContent=nextUnlock(currentAccount());this.stats.append(unlock);
    const unlocked = document.querySelector('#newAchievements');unlocked.replaceChildren();
    for (const name of result.newAchievements || []) {
      const item = document.createElement('p');item.textContent='NUEVO LOGRO / '+name;unlocked.append(item);
    }
  }
}
