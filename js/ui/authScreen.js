import { login, register, guestLogin, currentAccount, logout, isGuest } from '../systems/accountSystem.js';

export function bindAuth(game) {
  const form = document.querySelector('#authForm');
  const name = document.querySelector('#authName');
  const submit = document.querySelector('#authSubmit');
  const switchMode = document.querySelector('#authSwitch');
  const guestBtn = document.querySelector('#authGuest');
  const error = document.querySelector('#authError');
  let mode = 'login';
  let busy = false;

  function showWelcomeBanner(account, isGuestMode = false) {
    const userSpan = document.querySelector('#onboardingUserName');
    const statusBadge = document.querySelector('#onboardingStatusBadge');
    const statusDesc = document.querySelector('#onboardingStatusDesc');
    const eyebrow = document.querySelector('#onboardingScreen .eyebrow');

    if (userSpan) {
      userSpan.textContent = isGuestMode ? 'INVITADO' : (account?.name || 'SOCIO').toUpperCase();
    }
    if (statusBadge) {
      if (isGuestMode) {
        statusBadge.textContent = 'MODO INVITADO (SIN REGISTRO)';
        statusBadge.className = 'onboarding-status-badge onboarding-status-badge--guest';
      } else {
        statusBadge.textContent = '✓ SOCIO REGISTRADO CON ÉXITO';
        statusBadge.className = 'onboarding-status-badge';
      }
    }
    if (statusDesc) {
      if (isGuestMode) {
        statusDesc.textContent = 'Estás jugando como invitado. Para reclamar misiones y guardar accesorios, creá tu carnet en el mostrador.';
      } else {
        statusDesc.textContent = `¡Bienvenido al club, ${account?.name}! Tu cuenta está activa y tu progreso se guardará en este navegador.`;
      }
    }
  }

  function setMode(newMode, clearError = true) {
    mode = newMode;
    const signingUp = mode === 'register';
    const isSwitching = mode === 'switch';
    const curr = currentAccount();

    if (isSwitching && curr && !isGuest()) {
      document.querySelector('#authTitle').textContent = `Registro de Socios`;
      submit.textContent = 'ENTRAR / CAMBIAR';
      switchMode.textContent = 'Crear cuenta nueva';
    } else {
      document.querySelector('#authTitle').textContent = signingUp ? 'Creá tu cuenta' : 'Entrá al club';
      submit.textContent = signingUp ? 'CREAR CUENTA' : 'ENTRAR';
      switchMode.textContent = signingUp ? 'Ya tengo cuenta' : 'Crear cuenta';
    }

    const hint = document.querySelector('#authNameHint');
    if (hint) hint.hidden = !signingUp && !isSwitching;
    if (clearError && error) error.hidden = true;
  }

  // El escritorio de registro del local abre esta pantalla
  game.openAuth = (startMode = 'register') => {
    setMode(startMode);
    const curr = currentAccount();
    if (name) {
      name.value = (curr && !isGuest()) ? curr.name : '';
    }
    game.showScreen('authScreen');
    setTimeout(() => {
      name?.focus();
      if (name?.value) name.select();
    }, 50);
  };

  switchMode?.addEventListener('click', () => {
    if (busy) return;
    setMode(mode === 'login' ? 'register' : 'login');
    name?.focus();
  });

  guestBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    try {
      const guestAcc = guestLogin();
      showWelcomeBanner(guestAcc, true);
      game.menu?.prepareAccount?.();
      game.showScreen('onboardingScreen');
    } catch (err) {
      console.error('Error entering guest mode:', err);
      game.showToast?.(err.message || 'No se pudo entrar como Invitado.');
      game.showScreen('lobbyScreen');
    }
  });

  form?.addEventListener('input', () => { if (error) error.hidden = true; });

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    if (error) error.hidden = true;
    form.setAttribute('aria-busy', 'true');
    if (submit) submit.disabled = true;
    if (switchMode) switchMode.disabled = true;
    if (guestBtn) guestBtn.disabled = true;
    if (name) name.readOnly = true;

    if (submit) {
      submit.textContent = mode === 'register' ? 'CREANDO CUENTA...' : 'ENTRANDO...';
    }

    try {
      const username = name.value.trim();
      const account = await (mode === 'register' ? register : login)(username);
      showWelcomeBanner(account, false);
      game.menu?.prepareAccount?.();
      game.showScreen('onboardingScreen');
    } catch (failure) {
      if (error) {
        error.textContent = failure.message || 'No se pudo entrar. Intentá nuevamente.';
        error.hidden = false;
        error.focus();
      }
    } finally {
      busy = false;
      form.setAttribute('aria-busy', 'false');
      if (submit) submit.disabled = false;
      if (switchMode) switchMode.disabled = false;
      if (guestBtn) guestBtn.disabled = false;
      if (name) name.readOnly = false;
      setMode(mode, false);
    }
  });
}
