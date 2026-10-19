import { Input } from "./core/input.js";
import { drawDiner } from "./core/art.js";
import { drawWorldProps } from "./core/worldProps.js";
import { skins } from "./data/skins.js";
import { phrases } from "./data/phrases.js";
import { getAbilityChoices, applyAbility, abilities as abilityCatalog, rarities } from "./data/abilities.js";
import { updateEnemies } from "./systems/enemySystem.js";
import { updateProjectiles } from "./systems/projectileSystem.js";
import { updatePlayer } from "./systems/playerSystem.js";
import { addSurvivalScore, resolveDeaths } from "./systems/scoreSystem.js";
import { getBestScore, getRanking, saveRun } from "./systems/rankingSystem.js";
import { Hud } from "./ui/hud.js";
import { MenuScreen } from "./ui/menuScreen.js";
import { GameOverScreen } from "./ui/gameOverScreen.js";
import { updateItems } from "./systems/itemSystem.js";
import { AudioSystem } from "./systems/audioSystem.js";
import { recordRun, unlockedAchievements } from "./systems/achievementSystem.js";
import { updateEffects } from './systems/effectSystem.js';
import { createRunState } from './core/runState.js';
import { updateDirector, modes } from './systems/directorSystem.js';
import { companions } from './entities/Companion.js';
import {currentAccount,logout,awardRun} from './systems/accountSystem.js';
import {bindAuth} from './ui/authScreen.js';
import {isOwned} from './data/shop.js';
import {Lobby} from './ui/lobby.js';
import {Shop} from './ui/shop.js';
import {updateMap,drawMapObstacles} from './systems/mapSystem.js';
import {primes,updatePrimes,activatePrime,drawPrimeEffects} from './systems/primeSystem.js';
import {icon,refreshIcons,abilityIcons} from './ui/icons.js';
import {canvasPoint} from './core/presentation.js';
import {drawCombatFeedback} from './ui/combatFeedback.js';
import {drawFloatingText} from './ui/floatingText.js';
import {evolveWeapon} from './data/weaponEvolutions.js';
import {burst} from './systems/effectSystem.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = new Input();
    this.hud = new Hud();
    this.audio = new AudioSystem();
    this.menu = new MenuScreen(this);
    this.gameOver = new GameOverScreen(this);
    this.lobby=new Lobby(this);this.shop=new Shop(this);this.choice=null;
    bindAuth(this);
    document.querySelector('#logoutButton').addEventListener('click',()=>{logout();this.showScreen('authScreen');});
    this.lastSetup = null;
    this.state = null;
    this.lastTime = 0;
    this.running = false;
    this.toast = document.querySelector("#toast");
    this.bossAlert = document.querySelector('#bossAlert');
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    refreshIcons();
    document.querySelector('#aimButton').addEventListener('click',()=>{
      if(!this.running)return;
      this.state.manualAim=!this.state.manualAim;
      this.state.aimPoint ||= {x:Math.min(900,this.state.player.x+120),y:this.state.player.y};
      this.updateAimButton();this.audio.play('navigate');
    });
    canvas.addEventListener('pointermove',event=>{
      if(this.running){const point=canvasPoint(canvas.getBoundingClientRect(),960,540,event.clientX,event.clientY);if(point)this.state.aimPoint=point;}
    });
    document.querySelector('#pauseButton').addEventListener('click', () => this.pause());
    document.querySelector('#resumeButton').addEventListener('click', () => this.resume());
    document.querySelector('#abandonButton').addEventListener('click', () => this.endRun('abandoned'));
    window.addEventListener('keydown', event => {
      if (event.target.closest?.('input, select, textarea')) return;
      if (event.key === 'Escape' && !event.repeat) { if (this.running) this.pause(); else if (this.screenId === 'pauseScreen') this.resume(); }
      if(this.running&&!event.repeat){
        if(this.choice&&['1','2','3'].includes(event.key))document.querySelectorAll('.ability-card')[Number(event.key)-1]?.click();
        if(['q','e','r'].includes(event.key.toLowerCase()))this.triggerPrime(event.key.toLowerCase());
      }
    });
    window.addEventListener('blur', () => this.pause());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); });
    document.addEventListener('pointerdown', () => this.audio.unlock(), { once: true });
    document.addEventListener('keydown', () => this.audio.unlock(), { once: true });
  }

  start() {
    this.showScreen(currentAccount()?'lobbyScreen':'authScreen');
    requestAnimationFrame((time) => this.loop(time));
  }

  showScreen(id) {
    this.screenId = id;
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
    } else {
      this.hud.hide();
    }
    this.running = id === "gameScreen";
    this.input.enabled = this.running||id==='lobbyScreen';
    this.input.clear();
    this.audio.setScene(id === 'gameScreen' && this.state?.enemies.some(enemy=>enemy.isBoss) ? 'boss' : id);
    if (id === 'menuScreen') document.querySelector('#menuBest').textContent = String(getBestScore()).padStart(6,'0');
    if (id !== 'gameScreen') this.bossAlert.hidden = true;
    if (id !== 'gameScreen') { clearTimeout(this.toastTimer); this.toast.hidden = true; }
    if (!inRun || isPaused) this.hud.eventBanner.hidden = true;
    document.querySelector('#primeBar').hidden=!inRun || isPaused;
    if(id==='lobbyScreen')this.lobby.enter();
    if (id === 'pauseScreen') this.renderBuild();
    if (id !== 'gameScreen' && id !== 'abilityScreen') {
      document.querySelector('#'+id)?.querySelector('button:not(:disabled),input')?.focus({preventScroll:true});
    } else if (id === 'gameScreen') document.activeElement?.blur();
  }

  pause() { if (this.running) this.showScreen('pauseScreen'); }
  resume() { if (this.screenId === 'pauseScreen') this.showScreen('gameScreen'); }

  renderBuild() {
    const root = document.querySelector('#buildList'); root.replaceChildren();
    for (const [id,count] of Object.entries(this.state.player.abilities)) {
      const item = document.createElement('span');
      item.textContent = (abilityCatalog.find(ability=>ability.id===id)?.name || id) + ' / ' + count;
      root.append(item);
    }
    if (!root.children.length) root.textContent = 'Combo original';
    document.querySelector('#pauseGoal').textContent = modes[this.state.modeId].goal;
  }

  showRanking() {
    const ranking = currentAccount()?.runs||getRanking();
    const list = document.querySelector("#rankingList");
    list.replaceChildren();
    for (const run of ranking) {
      const row = document.createElement('li'), name = document.createElement('strong');
      name.textContent = run.name||currentAccount()?.name||'Jugador'; row.append(name, ` / ${run.score} pts / NV ${run.level||'?'} / ${run.timeText} / ${run.date}`); list.append(row);
    }
    if (!ranking.length) { const row = document.createElement('li'); row.textContent = 'El primer lugar te esta esperando.'; list.append(row); }
    this.showScreen("rankingScreen");
  }

  startRun(setup) {
    const account=currentAccount();if(!account){this.showScreen('authScreen');return;}
    setup={...setup,name:account.name,skinId:isOwned(account,'skin',setup.skinId)?setup.skinId:'pancho',mapId:isOwned(account,'map',setup.mapId)?setup.mapId:'diner',companionId:isOwned(account,'pet',setup.companionId)?setup.companionId:'none',accessoryId:isOwned(account,'accessory',setup.accessoryId)?setup.accessoryId:'none'};
    this.canvas.width = 960;
    this.canvas.height = 540;
    this.lastSetup = setup;
    this.state = createRunState(setup, this.audio);
    this.choice=null;this.buildSignature=null;this.updateAimButton();
    this.audio.unlock();
    this.hud.update(this.state);
    this.showScreen("gameScreen");
    this.showToast("Pedido #002. Que empiece el turno.");
  }

  restartLastRun() {
    this.startRun(this.lastSetup || { name: "Pancho", skinId: "pancho", weaponId: "fork", difficultyId: "picante" });
  }

  loop(time) {
    const delta = Math.min(0.033, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;
    this.drawBackground();
    if(this.screenId==='lobbyScreen')this.lobby.update(delta,this.input);
    if(this.screenId==='shopScreen')this.shop.update(time/1000);
    if (this.state && ['gameScreen','abilityScreen','pauseScreen'].includes(this.screenId)) {
      if (this.running) this.update(delta);
      this.draw();
    }
    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  update(delta) {
    const state = this.state;
    state.time += delta;
    state.shake = Math.max(0, state.shake - delta);
    updateDirector(state, delta, this.canvas);
    updatePrimes(state,delta);updateMap(state,delta);
    if (state.directorNotice) { this.showToast(state.directorNotice); state.directorNotice = ''; }
    const before = { x:state.player.x, y:state.player.y };
    const dashBefore=state.player.dashTime;
    updatePlayer(state, delta, this.input, this.canvas);
    if(dashBefore<=0&&state.player.dashTime>0)this.audio.play('dash');
    state.distance += Math.hypot(state.player.x - before.x, state.player.y - before.y);
    updateEffects(state, delta);
    for (const hazard of state.hazards) hazard.life -= delta;
    state.hazards = state.hazards.filter(hazard => hazard.life > 0);
    for (const hazard of state.hazards) {
      if (Math.hypot(hazard.x - state.player.x, hazard.y - state.player.y) < hazard.radius + state.player.radius) {
        state.player.buffs.slowTime = Math.max(state.player.buffs.slowTime, 0.35);
      }
    }
    if (updateEnemies(state, delta, this.canvas)) this.announceBoss();
    state.companion.update(state, delta);
    updateProjectiles(state, delta, this.canvas);
    updateItems(state, delta, this.canvas);
    if (state.itemNotice) { this.showToast(state.itemNotice); this.audio.play('pickup'); state.itemNotice = ''; }
    resolveDeaths(state, () => this.onLevelUp());
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
    } else if (state.victory || (state.modeId === 'rush' && state.bossesKilled >= 3)) {
      this.endRun('victory');
    } else if (state.pendingLevels > 0&&!this.choice) {
      this.showAbilityChoices();
    }
    if(this.choice){this.choice.remaining-=delta;document.querySelector('#abilityTimerFill').style.width=`${Math.max(0,this.choice.remaining/this.choice.duration*100)}%`;if(this.choice.remaining<=0)this.dismissAbility();}
    this.renderPrimeBar();
    this.renderLiveBuild();
  }

  onLevelUp() {
    this.state.pendingLevels += 1;
    this.state.score = (this.state.score || 0) + 50;
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
      button.setAttribute('aria-keyshortcuts',String(index+1));
      button.setAttribute('aria-label',`Tecla ${index+1}: ${ability.name}. ${ability.description}. Nivel ${count+1} de ${ability.maxStacks}`);
      button.addEventListener("click", () => this.chooseAbility(ability), { once: true });
      options.append(button);
    });
    this.choice={remaining:9,duration:9};
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

  dismissAbility(){if(!this.choice)return;this.choice=null;this.state.pendingLevels=Math.max(0,this.state.pendingLevels-1);document.querySelector('#abilityScreen').classList.remove('screen--active');document.querySelector('#app').dataset.choosing='false';document.activeElement?.blur();}

  triggerPrime(key){
    if(!this.running||!activatePrime(this.state,key))return false;
    this.audio.play('level');this.showToast(primes.find(prime=>prime.key===key).name.toUpperCase());return true;
  }

  updateAimButton(){
    const manual=Boolean(this.state?.manualAim),button=document.querySelector('#aimButton');
    button.setAttribute('aria-pressed',String(manual));
    button.title=manual?'Punteria manual / mouse':'Punteria automatica / enemigo cercano';
    this.canvas.style.cursor=manual?'crosshair':'default';
  }

  renderLiveBuild(){
    const entries=Object.entries(this.state.player.abilities),evolution=this.state.player.weaponEvolution,signature=JSON.stringify(entries)+'/'+(evolution?.id||'base');
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
      if(!entries.length&&!evolution)root.textContent='Receta original';
    }
    const next=primes.find(prime=>prime.level>this.state.player.level);
    document.querySelector('#nextPrimeLabel').textContent=next?'PRIME EN NIVEL '+next.level:'RECETA PRIME COMPLETA';
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
      const locked=this.state.player.level<prime.level,cool=this.state.primeCooldowns[prime.key],status=locked?'locked':cool>0?'cooldown':'ready';
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
      weapon: this.state.player.weapon.name,
      difficulty: this.state.difficulty.name,
      map: this.state.mapId,
      bossesKilled: this.state.bossesKilled,
      distance: Math.floor(this.state.distance),
      pickups: this.state.pickups,
      mode: modes[this.state.modeId].name,
      modeId: this.state.modeId,
      companion: companions[this.state.companion.id].name,
      peakCombo: this.state.peakCombo,
      outcome,
      wave: this.state.wave,
      abilities: {...this.state.player.abilities},
    };
    const previousUnlocks = new Set(unlockedAchievements().map(item=>item.id));
    result.newAchievements = recordRun(result).filter(item=>!previousUnlocks.has(item.id)).map(item=>item.name);
    this.audio.play('death');
    saveRun(result);
    awardRun(result);
    this.running = false;
    this.hud.hide();
    this.gameOver.render(result, previousBest);
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
    this.ctx.save();
    if (state.shake > 0 && !this.reducedMotion) {
      this.ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }
    for (const hazard of state.hazards) {
      this.ctx.save();this.ctx.globalAlpha=Math.min(.25,hazard.life*.05);this.ctx.fillStyle='#c898ee';
      this.ctx.beginPath();this.ctx.arc(hazard.x,hazard.y,hazard.radius,0,Math.PI*2);this.ctx.fill();this.ctx.restore();
    }
    drawMapObstacles(this.ctx,state);
    drawCombatFeedback(this.ctx,state,this.reducedMotion);
    state.items.forEach(item => item.draw(this.ctx, state.time));
    if (state.player.auraLevel) {
      this.ctx.strokeStyle='#86e3bf44';this.ctx.lineWidth=2;this.ctx.beginPath();this.ctx.arc(state.player.x,state.player.y,105,0,Math.PI*2);this.ctx.stroke();
    }
    for (const ring of state.rings) {
      const remaining=Math.max(0,Math.min(1,ring.life/(ring.maxLife||ring.life||1)));
      this.ctx.save();this.ctx.globalAlpha=remaining;this.ctx.strokeStyle=ring.color;this.ctx.lineWidth=1+3*remaining;
      this.ctx.beginPath();this.ctx.arc(ring.x,ring.y,ring.radius*(.25+.75*(1-remaining)),0,Math.PI*2);this.ctx.stroke();this.ctx.restore();
    }
    this.ctx.save();this.ctx.globalCompositeOperation='lighter';
    state.projectiles.forEach((projectile) => projectile.draw(this.ctx));
    for (const shot of state.enemyProjectiles) {
      const speed=Math.hypot(shot.vx,shot.vy)||1;
      for(let i=0;i<(shot.trail?.length||0);i++){const point=shot.trail[i],ratio=(i+1)/shot.trail.length,s=Math.max(1,shot.radius*ratio*.8);this.ctx.globalAlpha=ratio*.35;this.ctx.fillStyle=shot.color||'#ff6573';this.ctx.fillRect(point.x-s/2,point.y-s/2,s,s);}
      this.ctx.globalAlpha=1;
      this.ctx.strokeStyle=(shot.color||'#ff6573')+'99';this.ctx.lineWidth=shot.radius;
      this.ctx.beginPath();this.ctx.moveTo(shot.x-shot.vx/speed*18,shot.y-shot.vy/speed*18);this.ctx.lineTo(shot.x,shot.y);this.ctx.stroke();
      this.ctx.fillStyle=shot.color||'#ff6874';this.ctx.shadowColor=shot.color||'#ff6874';this.ctx.shadowBlur=10;
      this.ctx.beginPath();this.ctx.arc(shot.x,shot.y,shot.radius,0,Math.PI*2);this.ctx.fill();this.ctx.shadowBlur=0;
      this.ctx.fillStyle='#fff0d8';this.ctx.beginPath();this.ctx.arc(shot.x,shot.y,shot.radius*.4,0,Math.PI*2);this.ctx.fill();
    }
    this.ctx.restore();
    [...state.enemies,state.player,state.companion].sort((a,b)=>a.y-b.y).forEach(actor=>actor.draw(this.ctx,state.time));
    drawPrimeEffects(this.ctx,state);
    this.ctx.save();this.ctx.globalCompositeOperation='lighter';
    for (const p of state.particles) {
      const ratio=Math.max(0,Math.min(1,p.life/(p.maxLife||.6))),palette=p.palette||[p.color],index=Math.min(palette.length-1,Math.floor((1-ratio)*palette.length));
      this.ctx.globalAlpha = ratio;
      this.ctx.fillStyle = palette[index]||p.color;
      const s = (p.size || 4)*(.25+.75*ratio);
      this.ctx.fillRect(p.x - s/2, p.y - s/2, s, s);
    }
    this.ctx.restore();
    this.ctx.globalAlpha = 1;
    this.ctx.textAlign='center';
    for (const text of state.floaters) {
      drawFloatingText(this.ctx,text,this.reducedMotion);
    }
    this.ctx.globalAlpha=1;
    if(state.player.hitFlash>0&&!this.reducedMotion){this.ctx.strokeStyle=`rgba(255,80,75,${state.player.hitFlash*3})`;this.ctx.lineWidth=12;this.ctx.strokeRect(6,6,948,528);}
    this.ctx.restore();
  }

  drawBackground() {
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
    this.toast.textContent = message;
    this.toast.hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.hidden = true;
    }, 1800);
  }

  announceBoss() {
    this.audio.setScene('boss'); this.audio.play('boss');
    const boss = this.state.enemies.find(enemy=>enemy.isBoss);
    this.bossAlert.textContent = 'PEDIDO ESPECIAL / ' + boss.type.name.toUpperCase();
    this.bossAlert.hidden = false;
    clearTimeout(this.bossAlertTimer);
    this.bossAlertTimer = setTimeout(() => { this.bossAlert.hidden = true; }, 4000);
    this.showToast('JEFE: ' + boss.type.name.toUpperCase());
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${rest}`;
  }
}
