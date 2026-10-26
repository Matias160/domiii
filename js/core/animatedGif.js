// Los GIF dibujados con ctx.drawImage() sobre un <img> fuera del DOM se quedan congelados en el
// primer cuadro. Este helper devuelve un <canvas> "vivo" que se actualiza solo con el cuadro
// correcto del GIF, de modo que se pueda usar en drawImage() como cualquier imagen.
//
// 1) Con ImageDecoder (WebCodecs) se decodifican todos los cuadros y sus duraciones reales.
// 2) Si no existe, se usa un <img> adjunto al DOM (el navegador lo anima) copiado al canvas.

const live = new Set();
let loopStarted = false;

function startLoop() {
  if (loopStarted) return;
  loopStarted = true;
  const tick = (now) => {
    for (const gif of live) gif.update(now);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function markReady(canvas, w, h) {
  canvas.width = w;
  canvas.height = h;
  canvas.naturalWidth = w;
  canvas.naturalHeight = h;
  canvas.complete = true;
}

export function createAnimatedGif(src) {
  if (typeof document === 'undefined' || typeof requestAnimationFrame === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.complete = false;
  canvas.naturalWidth = 0;
  canvas.naturalHeight = 0;
  const ctx = canvas.getContext('2d');
  const url = encodeURI(src);

  const useDomImage = () => {
    const img = new Image();
    img.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:-1';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.onload = () => {
      markReady(canvas, img.naturalWidth, img.naturalHeight);
      live.add({
        update() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        },
      });
      startLoop();
    };
    const attach = () => document.body.appendChild(img);
    if (document.body) attach(); else document.addEventListener('DOMContentLoaded', attach, { once: true });
    img.src = url;
  };

  const useDecoder = async () => {
    const response = await fetch(url);
    const decoder = new ImageDecoder({ data: response.body, type: 'image/gif' });
    await decoder.tracks.ready;
    const count = decoder.tracks.selectedTrack.frameCount;
    const frames = [];
    const starts = [];
    let total = 0;
    for (let i = 0; i < count; i++) {
      const { image } = await decoder.decode({ frameIndex: i });
      const frame = document.createElement('canvas');
      frame.width = image.displayWidth;
      frame.height = image.displayHeight;
      frame.getContext('2d').drawImage(image, 0, 0);
      const ms = image.duration ? image.duration / 1000 : 100;
      image.close();
      frames.push(frame);
      starts.push(total);
      total += Math.max(20, ms);
    }
    markReady(canvas, frames[0].width, frames[0].height);
    live.add({
      update(now) {
        const t = now % total;
        let index = frames.length - 1;
        for (let i = 0; i < frames.length; i++) {
          if (starts[i] > t) { index = i - 1; break; }
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frames[Math.max(0, index)], 0, 0);
      },
    });
    startLoop();
  };

  if (typeof ImageDecoder !== 'undefined' && typeof fetch !== 'undefined') {
    useDecoder().catch(useDomImage);
  } else {
    useDomImage();
  }
  return canvas;
}
