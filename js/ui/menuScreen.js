import { skins } from "../data/skins.js";
import { weapons } from "../data/weapons.js";
import { drawFood, drawWeapon } from "../core/art.js";
import { unlockedAchievements, readAchievementStats, achievements } from "../systems/achievementSystem.js";
import {currentAccount} from '../systems/accountSystem.js';
import {isOwned} from '../data/shop.js';
import {refreshIcons} from './icons.js';

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
    document.querySelector("#playButton").addEventListener("click", () => { this.renderOptions(); game.showScreen("setupScreen"); });
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

  syncCards() {
    const getCleanLabel = (sel) => {
      if (!sel || !sel.options || sel.selectedIndex < 0) return '';
      const opt = sel.options[sel.selectedIndex];
      return opt ? opt.textContent.replace(/ \[TIENDA\]$/, '') : '';
    };

    if (this.cardModeVal) this.cardModeVal.textContent = getCleanLabel(this.modeInput);
    if (this.cardMapVal) this.cardMapVal.textContent = getCleanLabel(this.mapInput);
    if (this.cardCompanionVal) this.cardCompanionVal.textContent = getCleanLabel(this.companionInput);
    if (this.cardDifficultyVal) this.cardDifficultyVal.textContent = getCleanLabel(this.difficultyInput);
    if (this.cardAccessoryVal) this.cardAccessoryVal.textContent = getCleanLabel(this.accessoryInput);
    refreshIcons();
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
    this.nameInput.value=p.name;
    this.selectedSkin=p.loadout.skin;
    this.mapInput.value=p.loadout.map;
    this.companionInput.value=p.loadout.pet;
    this.accessoryInput.value=p.loadout.accessory;
    for(const [input,type] of [[this.mapInput,'map'],[this.companionInput,'pet'],[this.accessoryInput,'accessory']]){
      for(const option of input.options){const owned=isOwned(p,type,option.value);option.disabled=!owned;option.textContent=option.textContent.replace(/ \[TIENDA\]$/,'')+(owned?'':' [TIENDA]');}
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
        localStorage.removeItem('domi2pancho.ranking');this.game.showToast('Ranking borrado.');
      }
    });
    document.querySelector('#clearAchievementsButton').addEventListener('click',()=>{
      if(confirm('Se borrara todo el progreso de logros. Continuar?')){
        localStorage.removeItem(`domi2pancho.achievements.${currentAccount()?.name.toLocaleLowerCase('es')}`);this.game.showToast('Progreso de logros borrado.');
        this.renderOptions();
      }
    });
  }
}
