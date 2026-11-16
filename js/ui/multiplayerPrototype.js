import { refreshIcons } from './icons.js';
import { supportClasses as classInfo } from '../systems/teamTrainingSystem.js';
import { TeamTraining } from './teamTraining.js';
import { currentAccount } from '../systems/accountSystem.js';


export class MultiplayerPrototype {
  constructor(game) {
    this.game = game;
    this.mode = 'coop';
    this.supportClass = 'red';
    this.ready = false;
    this.simulatedPlayers = [];
    document.querySelectorAll('[data-multi-mode]').forEach(button => {
      button.addEventListener('click', () => {
        this.mode = button.dataset.multiMode;
        this.ready = false;
        this.render();
      });
    });
    document.querySelectorAll('[data-support-class]').forEach(button => {
      button.addEventListener('click', () => {
        this.supportClass = button.dataset.supportClass;
        this.ready = false;
        this.render();
      });
    });
    document.querySelector('#multiBackButton')?.addEventListener('click', () => game.showScreen('lobbyScreen'));
    document.querySelector('#multiReadyButton')?.addEventListener('click', () => {
      this.ready = !this.ready;
      this.render();
    });
    document.querySelector('#multiAddBot')?.addEventListener('click', () => {
      if (this.simulatedPlayers.length >= 3) return;
      const botClasses = ['green', 'blue', 'red'];
      this.simulatedPlayers.push({ id: `test-${Date.now()}-${this.simulatedPlayers.length}`, supportClass: botClasses[this.simulatedPlayers.length] });
      this.ready = false;
      this.render();
    });
    document.querySelector('#multiClearBots')?.addEventListener('click', () => {
      this.simulatedPlayers = [];
      this.ready = false;
      this.render();
    });
    document.querySelector('#multiTrainButton')?.addEventListener('click',()=>{
      if(!this.ready||!this.simulatedPlayers.length)return;
      this.training ||= new TeamTraining(this.game);
      this.training.start({mode:this.mode,supportClass:this.supportClass,players:this.simulatedPlayers.map(player=>({...player})),skinId:currentAccount()?.loadout?.skin||'pancho'});
    });
  }

  show() {
    this.game.showScreen('multiScreen');
  }

  render() {
    const modeNames = { coop: 'Cooperativo', versus: 'Versus' };
    const role = classInfo[this.supportClass];
    document.querySelectorAll('[data-multi-mode]').forEach(button => {
      const selected = button.dataset.multiMode === this.mode;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-support-class]').forEach(button => {
      const selected = button.dataset.supportClass === this.supportClass;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const name = document.querySelector('#lobbyWelcome')?.textContent || 'JUGADOR LOCAL';
    document.querySelector('#multiPartySummary').textContent = `${modeNames[this.mode]} · ${role.name}`;
    this.renderParty(name, role);
    const addBot = document.querySelector('#multiAddBot');
    addBot.disabled = this.simulatedPlayers.length >= 3;
    addBot.querySelector('span').textContent = addBot.disabled ? 'GRUPO COMPLETO' : 'SUMAR ALIADO DE PRUEBA';
    const button = document.querySelector('#multiReadyButton');
    button.classList.toggle('is-ready', this.ready);
    button.querySelector('span').textContent = this.ready ? 'LISTO PARA JUGAR' : 'MARCAR LISTO';
    button.setAttribute('aria-pressed', String(this.ready));
    document.querySelector('#multiTrainButton').disabled=!this.ready||!this.simulatedPlayers.length;
    document.querySelector('#multiFeedback').textContent = this.ready
      ? this.simulatedPlayers.length?'Grupo listo. Entrenamiento local sin monedas ni progreso.':'Falta un aliado de prueba.'
      : 'Preparando equipo. Conexión online pendiente.';
  }

  renderParty(name, role) {
    const root = document.querySelector('#multiSlots');
    root.replaceChildren();
    const addSlot = ({ label, detail, badge = '', local = false }) => {
      const slot = document.createElement('div');
      slot.className = `multi-slot${local ? ' multi-slot--local' : ''}`;
      const icon = document.createElement('i');
      icon.dataset.lucide = local ? 'user-round' : 'user-round-check';
      const copy = document.createElement('span');
      const title = document.createElement('strong');
      const subtitle = document.createElement('small');
      title.textContent = label;
      subtitle.textContent = detail;
      copy.append(title, subtitle);
      slot.append(icon, copy);
      if (badge) {
        const tag = document.createElement('b');
        tag.textContent = badge;
        slot.append(tag);
      }
      root.append(slot);
    };
    addSlot({ label: name, detail: role.upper, badge: this.mode === 'versus' ? 'A' : 'VOS', local: true });
    this.simulatedPlayers.forEach((player, index) => {
      const playerRole = classInfo[player.supportClass];
      const team = this.mode === 'versus' && index % 2 === 0 ? 'B' : this.mode === 'versus' ? 'A' : 'ALIADO';
      addSlot({ label: `ALIADO DE PRUEBA ${index + 1}`, detail: `${playerRole.upper} · SIMULADO`, badge: team });
    });
    for (let i = this.simulatedPlayers.length + 1; i < 4; i++) {
      addSlot({ label: 'ESPACIO LIBRE', detail: 'Invitaciones online, más adelante.' });
    }
    refreshIcons();
  }
}
