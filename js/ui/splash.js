// Presentación al abrir el juego: "PanchOS x BurgosCorp".
// Se dibuja en pixel art sobre un lienzo lógico de 320x180 escalado entero (nítido en cualquier pantalla).
// Se puede saltar con clic, toque o cualquier tecla; con "reducir movimiento" se muestra quieta y breve.

const W = 320, H = 180;
export const SPLASH = { panchoAt: 0.35, crossAt: 1.9, shieldAt: 2.4, togetherAt: 3.9, fadeAt: 5.0, end: 5.5, skipAfter: 0.3 };

const C = {
  bunLight: '#f5c77a', bun: '#e0a050', bunDark: '#b8752f', sausage: '#c8463a', sausageLight: '#e8735e', sausageDark: '#8f2a22',
  mustard: '#ffd23f', ink: '#0b0f14', terminal: '#4ade80',
};

function px(c, color, x, y, w, h) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); }
const ease = k => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

// Pancho del logo de PanchOS (~74x32 lógicos a escala 1): salchicha con brillo y marcas de parrilla,
// pan con volumen (luz arriba, sombra abajo, miga en la abertura), mostaza en zigzag con brillo y contorno oscuro.
function drawHotdog(c, cx, cy, s = 1) {
  const p = (color, x, y, w, h) => px(c, color, cx + x * s, cy + y * s, w * s, h * s);
  // Rectángulo con esquinas recortadas (radio en píxeles) para que se vea redondeado
  const round = (color, x, y, w, h, r) => {
    for (let i = 0; i < h; i++) {
      const edge = i < r ? r - i : i >= h - r ? i - (h - r - 1) : 0;
      const cut = Math.round(edge * 0.9);
      p(color, x + cut, y + i, w - cut * 2, 1);
    }
  };
  // Sombra en el piso
  p('#00000055', -30, 17, 60, 3); p('#00000033', -34, 18, 68, 2);
  // Pan de atrás (asoma detrás de la salchicha)
  round(C.ink, -31, -15, 62, 8, 3); round(C.bunDark, -30, -14, 60, 6, 3); p(C.bun, -26, -13, 52, 2);
  // Salchicha
  round(C.ink, -38, -13, 76, 13, 5);
  round(C.sausageDark, -37, -12, 74, 11, 5);
  round(C.sausage, -37, -12, 74, 8, 4);
  p(C.sausageLight, -31, -11, 56, 2);
  p('#ffc2b2', -27, -11, 10, 1); p('#ffc2b2', -12, -11, 4, 1);
  for (const x of [-22, -8, 6, 20]) { p('#7a2016', x, -6, 2, 1); p('#7a2016', x + 2, -7, 2, 1); p('#7a2016', x + 4, -8, 2, 1); }
  // Mostaza en zigzag con brillo y sombra
  for (let i = 0; i < 12; i++) {
    const x = -30 + i * 5, y = -11 + (i % 2) * 3;
    p('#b8860b', x, y + 2, 5, 1);
    p(C.mustard, x, y, 5, 2);
    p('#fff3a0', x + 1, y, 2, 1);
  }
  // Pan de adelante con volumen
  round(C.ink, -34, -4, 68, 18, 5);
  round(C.bunDark, -33, -3, 66, 16, 5);
  round(C.bun, -33, -3, 66, 12, 5);
  p(C.bunLight, -27, -2, 40, 2); p('#ffe2a8', -24, -2, 12, 1);
  p('#f7d49a', -30, -3, 60, 1);                         // miga en la abertura
  p('#a8622a', -26, 9, 52, 1); p('#8f5221', -22, 11, 44, 1); // panza del pan en sombra
  for (const [x, y] of [[-18, 3], [-4, 5], [12, 3], [22, 6], [-26, 6]]) p('#c97d38', x, y, 2, 1); // poros tostados
}

// Pancho mini para la lluvia de fondo y la barra de carga (12x6)
function drawMiniHotdog(c, x, y) {
  px(c, C.sausage, x, y, 12, 3); px(c, C.mustard, x + 3, y, 2, 1); px(c, C.mustard, x + 7, y + 1, 2, 1);
  px(c, C.bun, x + 1, y + 3, 10, 3); px(c, C.bunDark, x + 1, y + 5, 10, 1);
}

function text(c, value, x, y, size, color, shadow = C.ink) {
  c.font = `${size}px 'Press Start 2P', monospace`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  if (shadow) { c.fillStyle = shadow; c.fillText(value, x + 1, y + 1); }
  c.fillStyle = color; c.fillText(value, x, y);
}

export function drawSplashFrame(c, t) {
  px(c, '#05070c', 0, 0, W, H);
  // Lluvia de panchos de fondo (pixel art), más densa durante la parte de PanchOS
  const rain = t < SPLASH.shieldAt ? 1 : Math.max(0.25, 1 - (t - SPLASH.shieldAt));
  c.globalAlpha = 0.18 * rain;
  for (let i = 0; i < 18; i++) {
    const x = (i * 53) % (W - 12), y = ((i * 37 + t * (22 + (i % 4) * 9)) % (H + 20)) - 10;
    drawMiniHotdog(c, x, y);
  }
  c.globalAlpha = 1;

  // 1) PanchOS: el pancho cae, rebota y "bootea" el sistema
  if (t >= SPLASH.panchoAt) {
    const k = (t - SPLASH.panchoAt) / 0.5;
    const fall = k < 1 ? (1 - ease(k)) * -90 : Math.sin(Math.min(1, k - 1) * Math.PI) * -4 * Math.max(0, 1.6 - k);
    const leave = t > SPLASH.crossAt ? ease((t - SPLASH.crossAt) / 0.4) : 0;
    const cx = W / 2 - leave * 70, cy = 70 + fall;
    // Se atenúa mientras entra el escudo y vuelve a brillar cuando aparecen juntos
    c.globalAlpha = t >= SPLASH.togetherAt ? Math.min(1, 0.4 + (t - SPLASH.togetherAt) * 2) : 1 - leave * 0.6;
    // Grande mientras se presenta PanchOS; a mitad del corrimiento pasa a tamaño normal (escala entera, pixel nítido)
    drawHotdog(c, cx, cy - (leave < 0.5 ? 6 : 0), leave < 0.5 ? 2 : 1);
    const typed = Math.max(0, Math.floor((t - SPLASH.panchoAt - 0.35) * 14));
    const name = 'PanchOS'.slice(0, typed);
    if (name) text(c, name, cx, 112, 16, '#ffffff');
    if (typed > 0 && typed < 8 && Math.floor(t * 6) % 2) px(c, C.terminal, cx + c.measureText(name).width / 2 + 3, 98, 6, 14);
    if (t < SPLASH.crossAt) {
      const boot = Math.min(1, (t - SPLASH.panchoAt - 0.5) / 1.0);
      if (boot > 0) {
        text(c, 'booteando panchos...', cx, 132, 6, C.terminal, null);
        px(c, '#1f2937', cx - 60, 138, 120, 10);
        const n = Math.floor(boot * 9);
        for (let i = 0; i < n; i++) drawMiniHotdog(c, cx - 58 + i * 13, 140);
      }
    }
    c.globalAlpha = 1;
  }

  // 2) La "x" gira y crece entre las dos marcas
  if (t >= SPLASH.crossAt) {
    const k = Math.min(1, (t - SPLASH.crossAt) / 0.35);
    const size = 6 + ease(k) * 14 - (t > SPLASH.togetherAt ? 6 : 0);
    c.save(); c.translate(W / 2, t < SPLASH.togetherAt ? 72 : 70); c.rotate((1 - ease(k)) * Math.PI * 2);
    c.fillStyle = C.mustard;
    for (let i = -Math.round(size / 2); i <= Math.round(size / 2); i += 2) { c.fillRect(i - 1, i - 1, 3, 3); c.fillRect(i - 1, -i - 1, 3, 3); }
    c.restore();
  }

  // 3) BurgosCorp: el isologo y el nombre del proyecto RN3 entran como capa HTML (ver index.html y playSplash);
  // acá solo va el destello del golpe cuando aterriza
  if (t >= SPLASH.shieldAt + 0.35 && t < SPLASH.shieldAt + 0.6) {
    c.globalAlpha = (SPLASH.shieldAt + 0.6 - t) / 0.25 * 0.5; px(c, '#ffffff', 0, 0, W, H); c.globalAlpha = 1;
  }

  // 4) Juntos: firma de la presentación
  if (t >= SPLASH.togetherAt) {
    const k = Math.min(1, (t - SPLASH.togetherAt - 0.2) / 0.4);
    c.globalAlpha = Math.max(0, k);
    text(c, 'P R E S E N T A N', W / 2, 166, 6, C.mustard, null);
    c.globalAlpha = 1;
  }

  // Cierre a negro
  if (t >= SPLASH.fadeAt) { c.globalAlpha = Math.min(1, (t - SPLASH.fadeAt) / (SPLASH.end - SPLASH.fadeAt)); px(c, '#05070c', 0, 0, W, H); c.globalAlpha = 1; }
}

// Muestra la presentación sobre el juego y la saca sola al terminar (o al saltearla)
export function playSplash({ reducedMotion = false } = {}) {
  const root = document.querySelector('#splashScreen');
  const canvas = document.querySelector('#splashCanvas');
  if (!root || !canvas) return Promise.resolve();
  const c = canvas.getContext('2d');
  const stage = document.querySelector('#splashStage');
  return new Promise(resolve => {
    let start = null, finished = false, skipAt = Infinity;
    const resize = () => {
      const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
      canvas.width = W * scale; canvas.height = H * scale;
      c.setTransform(scale, 0, 0, scale, 0, 0); c.imageSmoothingEnabled = false;
      stage?.style.setProperty('--u', `${scale}px`);
    };
    resize();
    const finish = () => {
      if (finished) return;
      finished = true;
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', skip, true);
      root.removeEventListener('pointerdown', skip);
      root.classList.add('splash--out');
      setTimeout(() => { root.hidden = true; resolve(); }, 350);
    };
    const skip = event => {
      event?.preventDefault?.(); event?.stopPropagation?.();
      if (start !== null && performance.now() - start > SPLASH.skipAfter * 1000) skipAt = Math.min(skipAt, performance.now());
    };
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', skip, true);
    root.addEventListener('pointerdown', skip);
    const tick = now => {
      if (finished) return;
      if (start === null) start = now;
      let t = (now - start) / 1000;
      // Reducir movimiento: se muestra quieta la imagen final con las dos marcas y se cierra
      if (reducedMotion) t = t < 1.8 ? SPLASH.togetherAt + 0.7 : SPLASH.end;
      if (now >= skipAt) { finish(); return; }
      drawSplashFrame(c, t);
      const phase = t >= SPLASH.togetherAt ? 'together' : t >= SPLASH.shieldAt ? 'burgos' : '';
      if (root.dataset.phase !== phase) root.dataset.phase = phase;
      if (t >= SPLASH.end) { finish(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
