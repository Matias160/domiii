import { login, register, guestLogin, resetPassword } from '../systems/accountSystem.js';

export function bindAuth(game) {
  const form = document.querySelector('#authForm');
  const name = document.querySelector('#authName');
  const password = document.querySelector('#authPassword');
  const submit = document.querySelector('#authSubmit');
  const switchMode = document.querySelector('#authSwitch');
  const guestBtn = document.querySelector('#authGuest');
  const resetBtn = document.querySelector('#authReset');
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

  function setMode(newMode, clearError = true) {
    mode = newMode;
    const signingUp = mode === 'register';
    document.querySelector('#authTitle').textContent = signingUp ? 'Creá tu cuenta' : 'Entrá al club';
    submit.textContent = signingUp ? 'CREAR CUENTA' : 'ENTRAR';
    switchMode.textContent = signingUp ? 'Ya tengo cuenta' : 'Crear cuenta';
    resetBtn.hidden = signingUp;
    guestBtn.hidden = signingUp;
    password.autocomplete = signingUp ? 'new-password' : 'current-password';
    document.querySelector('#authNameHint').hidden = !signingUp;
    document.querySelector('#authPasswordHint').hidden = !signingUp;
    if (clearError) error.hidden = true;
  }

  switchMode.addEventListener('click', () => {
    if (busy) return;
    setMode(mode === 'login' ? 'register' : 'login');
    password.value = '';
    concealPassword();
    name.focus();
  });

  guestBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    try {
      guestLogin();
      game.menu?.prepareAccount?.();
      game.showScreen('lobbyScreen');
      game.showToast?.('¡Bienvenido al local! Entraste como Invitado.');
    } catch (err) {
      console.error('Error entering guest mode:', err);
      game.showScreen('lobbyScreen');
    }
  });

  resetBtn?.addEventListener('click', async () => {
    const username = name.value.trim();
    if (!username) {
      error.textContent = 'Escribí tu nombre de usuario arriba antes de restablecer clave.';
      error.hidden = false;
      name.focus();
      return;
    }
    const newPass = prompt(`Ingresá una nueva contraseña para "${username}" (mínimo 6 caracteres):`);
    if (!newPass) return;
    if (newPass.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      await resetPassword(username, newPass);
      alert(`¡Contraseña restablecida con éxito para "${username}"! Ingresando al juego...`);
      game.menu.prepareAccount();
      game.showScreen('lobbyScreen');
    } catch (err) {
      alert(err.message || 'No se pudo restablecer la contraseña.');
    }
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
    if (guestBtn) guestBtn.disabled = true;
    name.readOnly = password.readOnly = true;
    submit.textContent = mode === 'login' ? 'ENTRANDO...' : 'CREANDO CUENTA...';
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
      if (guestBtn) guestBtn.disabled = false;
      name.readOnly = password.readOnly = false;
      setMode(mode, false);
    }
  });
}
