// Los GIF dibujados con ctx.drawImage() sobre un <img> quedan congelados en el primer cuadro.
// createAnimatedGif() devuelve un <canvas> que siempre muestra el cuadro correcto del GIF,
// así se puede usar en drawImage() como cualquier imagen (con .complete y .naturalWidth).
//
// 1) Con ImageDecoder (WebCodecs) se decodifica el GIF una sola vez a ImageBitmaps y el canvas
//    solo se redibuja cuando cambia de cuadro (no en cada fotograma del juego).
// 2) Si el navegador no lo soporta, se usa un <img> invisible en el DOM (el navegador lo anima)
//    copiado al canvas a ritmo de GIF (~20 fps).

const live = new Set();
let loopStarted = false;

function startLoop() {
  if (loopStarted) return;
  loopStarted = true;
  const tick = now => {
    for (const gif of live) gif(now);
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

async function decodeFrames(url) {
  const response = await fetch(url);
  if (!response.ok) throw Error('GIF no disponible');
  const decoder = new ImageDecoder({ data: response.body, type: 'image/gif' });
  await decoder.tracks.ready;
  const count = decoder.tracks.selectedTrack.frameCount;
  const frames = [], ends = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const { image } = await decoder.decode({ frameIndex: i });
    frames.push(await createImageBitmap(image));
    total += Math.max(20, image.duration ? image.duration / 1000 : 100);
    ends.push(total);
    image.close();
  }
  decoder.close();
  return { frames, ends, total };
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
      let last = -1;
      live.add(now => {
        const step = Math.floor(now / 50);
        if (step === last) return;
        last = step;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      });
      startLoop();
    };
    const attach = () => document.body.appendChild(img);
    if (document.body) attach(); else document.addEventListener('DOMContentLoaded', attach, { once: true });
    img.src = url;
  };

  if (typeof ImageDecoder !== 'undefined' && typeof fetch !== 'undefined' && typeof createImageBitmap === 'function') {
    decodeFrames(url).then(({ frames, ends, total }) => {
      markReady(canvas, frames[0].width, frames[0].height);
      let shown = -1;
      live.add(now => {
        const t = now % total;
        let index = 0;
        while (index < ends.length - 1 && ends[index] <= t) index++;
        if (index === shown) return;
        shown = index;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frames[index], 0, 0);
      });
      startLoop();
    }).catch(useDomImage);
  } else {
    useDomImage();
  }
  return canvas;
}
