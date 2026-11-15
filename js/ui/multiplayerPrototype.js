const classInfo = {
  red: { name: 'Rojo / Impulsor', upper: 'ROJO / IMPULSOR' },
  green: { name: 'Verde / Sanador', upper: 'VERDE / SANADOR' },
  blue: { name: 'Azul / Guardián', upper: 'AZUL / GUARDIÁN' },
};

export class MultiplayerPrototype {
  constructor(game) {
    this.game = game;
    this.mode = 'coop';
    this.supportClass = 'red';
    this.ready = false;
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
    document.querySelector('#multiPlayerName').textContent = name;
    document.querySelector('#multiPlayerClass').textContent = role.upper;
    document.querySelector('#multiPartySummary').textContent = `${modeNames[this.mode]} · ${role.name}`;
    const button = document.querySelector('#multiReadyButton');
    button.classList.toggle('is-ready', this.ready);
    button.querySelector('span').textContent = this.ready ? 'LISTO PARA JUGAR' : 'MARCAR LISTO';
    button.setAttribute('aria-pressed', String(this.ready));
    document.querySelector('#multiFeedback').textContent = this.ready
      ? 'Configuración guardada en esta vista previa. La conexión entre jugadores todavía no está implementada.'
      : 'Prototipo local: modos y clases ya se pueden explorar; no conecta jugadores todavía.';
  }
}
