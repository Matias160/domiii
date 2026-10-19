import { login, register } from '../systems/accountSystem.js';

export function bindAuth(game) {
  const form = document.querySelector('#authForm');
  const name = document.querySelector('#authName');
  const password = document.querySelector('#authPassword');
  const submit = document.querySelector('#authSubmit');
  const switchMode = document.querySelector('#authSwitch');
  const toggle = document.querySelector('#authPasswordToggle');
  const error = document.querySelector('#authError');
  const capsLock = document.querySelector('#authCapsLock');
  let mode = 'login';
  let busy = false;

  function concealPassword() {
    password.type = 'password';
    toggle.textContent = 'Mostrar';
    toggle.setAttribute('aria-label', 'Mostrar contraseña');
    toggle.setAttribute('aria-pressed', 'false');
    capsLock.hidden = true;
  }

  function renderMode() {
    const signingUp = mode === 'register';
    document.querySelector('#authTitle').textContent = signingUp ? 'Sumate al club.' : 'Entrar al local.';
    submit.textContent = signingUp ? 'CREAR CUENTA' : 'INICIAR SESIÓN';
    switchMode.textContent = signingUp ? 'Ya tengo cuenta' : 'Crear una cuenta nueva';
    password.autocomplete = signingUp ? 'new-password' : 'current-password';
    document.querySelector('#authNameHint').hidden = !signingUp;
    document.querySelector('#authPasswordHint').hidden = !signingUp;
  }

  switchMode.addEventListener('click', () => {
    if (busy) return;
    mode = mode === 'login' ? 'register' : 'login';
    error.hidden = true;
    password.value = '';
    concealPassword();
    renderMode();
    name.focus();
  });

  toggle.addEventListener('click', () => {
    const showing = password.type === 'password';
    password.type = showing ? 'text' : 'password';
    toggle.textContent = showing ? 'Ocultar' : 'Mostrar';
    toggle.setAttribute('aria-label', showing ? 'Ocultar contraseña' : 'Mostrar contraseña');
    toggle.setAttribute('aria-pressed', String(showing));
  });
  for (const eventName of ['keydown', 'keyup']) {
    password.addEventListener(eventName, event => {
      capsLock.hidden = !event.getModifierState('CapsLock');
    });
  }
  password.addEventListener('blur', () => { capsLock.hidden = true; });
  form.addEventListener('input', () => { error.hidden = true; });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    error.hidden = true;
    form.setAttribute('aria-busy', 'true');
    submit.disabled = switchMode.disabled = toggle.disabled = true;
    name.readOnly = password.readOnly = true;
    submit.textContent = mode === 'login' ? 'ENTRANDO…' : 'CREANDO CUENTA…';
    try {
      await (mode === 'login' ? login : register)(name.value, password.value);
      password.value = '';
      concealPassword();
      game.menu.prepareAccount();
      game.showScreen('lobbyScreen');
    } catch (failure) {
      error.textContent = failure.message || 'No se pudo entrar. Intentá nuevamente.';
      error.hidden = false;
      error.focus();
    } finally {
      busy = false;
      form.setAttribute('aria-busy', 'false');
      submit.disabled = switchMode.disabled = toggle.disabled = false;
      name.readOnly = password.readOnly = false;
      renderMode();
    }
  });
}
