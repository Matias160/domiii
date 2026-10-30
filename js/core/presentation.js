import {drawFood, drawDiner} from './art.js';
import {Companion} from '../entities/Companion.js';
import {drawWorldProps} from './worldProps.js';
import {drawAccessory, drawAccessoryIcon, resolveAccessory} from './accessories.js';
import {isOwned} from '../data/shop.js';

export { drawAccessory, drawAccessoryIcon, resolveAccessory };

export function drawOrangePixelSkull(c, w, h, time = 0) {
  // Fondo oscuro misterioso sin imagen del mapa
  const bg = c.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, Math.max(w, h) * 0.65);
  bg.addColorStop(0, '#260e06');
  bg.addColorStop(0.55, '#120604');
  bg.addColorStop(1, '#070303');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  // Halo naranja pulsante detrás de la calavera
  const pulse = 0.25 + Math.sin(time * 3) * 0.08;
  const glow = c.createRadialGradient(w / 2, h * 0.46, 4, w / 2, h * 0.46, Math.min(w, h) * 0.38);
  glow.addColorStop(0, `rgba(255, 115, 0, ${pulse})`);
  glow.addColorStop(0.6, `rgba(255, 50, 0, ${pulse * 0.4})`);
  glow.addColorStop(1, 'transparent');
  c.fillStyle = glow;
  c.fillRect(0, 0, w, h);

  // Calavera pixel-art naranja centrada
  const unit = Math.max(2, Math.floor(Math.min(w, h) / 28));
  const cx = Math.floor(w / 2 - 8 * unit);
  const cy = Math.floor(h * 0.46 - 8 * unit);
  const px = (x, y, pw, ph, col) => {
    c.fillStyle = col;
    c.fillRect(cx + x * unit, cy + y * unit, pw * unit, ph * unit);
  };

  // Sombra exterior pixelada
  px(3, 0, 10, 1, '#5a1800');
  px(2, 1, 12, 1, '#5a1800');
  px(1, 2, 14, 8, '#5a1800');
  px(2, 10, 12, 2, '#5a1800');
  px(4, 12, 8, 4, '#5a1800');

  // Cráneo naranja brillante
  px(4, 1, 8, 1, '#ff9900');
  px(2, 2, 12, 7, '#ff6a00');
  px(3, 2, 6, 2, '#ffb700'); // brillo superior
  px(3, 9, 10, 2, '#e65100');
  px(4, 11, 8, 4, '#ff6a00');

  // Cuencas de los ojos oscuras con pupila ardiente
  px(3, 5, 3, 3, '#140503');
  px(10, 5, 3, 3, '#140503');
  px(4, 6, 1, 1, '#ffdd44');
  px(11, 6, 1, 1, '#ffdd44');

  // Cavidad nasal
  px(7, 8, 2, 2, '#140503');

  // Dientes / mandíbula
  px(5, 13, 1, 2, '#140503');
  px(7, 13, 2, 2, '#140503');
  px(10, 13, 1, 2, '#140503');

  if (h >= 80) {
    c.fillStyle = '#07111688';
    c.fillRect(0, h - 22, w, 22);
    c.fillStyle = '#ff8800';
    c.font = '900 12px monospace';
    c.textAlign = 'center';
    c.fillText('???', w / 2, h - 7);
  }
}

export function drawPet(ctx,id,x,y,time=0,scale=1){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const pet=new Companion(id,{x:40,y:-30});pet.x=0;pet.y=0;pet.draw(ctx,time);ctx.restore();
}

export function drawItemPreview(canvas,item,profile,time=0){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  c.clearRect(0,0,w,h);c.imageSmoothingEnabled=false;
  if(item.type==='map'){
    if(item.id==='lava'&&!isOwned(profile,'map','lava')){
      drawOrangePixelSkull(c,w,h,time);
      return;
    }
    const preview=document.createElement('canvas');preview.width=960;preview.height=540;
    const scene=preview.getContext('2d');drawDiner(scene,960,540,time,false,item.id);drawWorldProps(scene,item.id,time);
    c.drawImage(preview,0,82,960,458,0,0,w,h);
    c.fillStyle='#07111666';c.fillRect(0,h-22,w,22);c.fillStyle='#fff0b0';c.font='900 11px monospace';c.textAlign='left';c.fillText(item.name.toUpperCase(),10,h-7);
    return;
  }
  // Fondo de vitrina con degradado atmosférico
  const accMeta = item.type === 'accessory' ? resolveAccessory(item.id) : null;
  const isLegendary = accMeta?.tier === 'legendary' || item.tier === 'legendary';
  const isCartography = accMeta?.tier === 'cartography' || item.tier === 'cartography' || item.cartographyExclusive;

  const bgGrad = c.createRadialGradient(w/2, h*0.5, 10, w/2, h*0.5, w*0.7);
  if (isLegendary) {
    bgGrad.addColorStop(0, '#3d2b0f');
    bgGrad.addColorStop(0.5, '#241a08');
    bgGrad.addColorStop(1, '#0e0b04');
  } else if (isCartography) {
    bgGrad.addColorStop(0, '#350b45');
    bgGrad.addColorStop(0.5, '#1e0529');
    bgGrad.addColorStop(1, '#0d0212');
  } else {
    bgGrad.addColorStop(0, '#1a333a');
    bgGrad.addColorStop(0.6, '#102227');
    bgGrad.addColorStop(1, '#091316');
  }
  c.fillStyle = bgGrad; c.fillRect(0, 0, w, h);

  const gridColor = isLegendary ? 'rgba(251, 191, 36, 0.08)' : isCartography ? 'rgba(192, 132, 252, 0.08)' : '#38bdf80a';
  for(let x=0;x<w;x+=24){c.fillStyle=gridColor;c.fillRect(x,0,1,h);}

  // Pedestal con resplandor de vitrina
  const pedGlow = c.createRadialGradient(w/2, h*.78, 5, w/2, h*.78, w*.35);
  if (isLegendary) {
    pedGlow.addColorStop(0, 'rgba(251, 191, 36, 0.42)');
    pedGlow.addColorStop(0.6, '#31230d');
    pedGlow.addColorStop(1, 'transparent');
  } else if (isCartography) {
    pedGlow.addColorStop(0, 'rgba(192, 132, 252, 0.45)');
    pedGlow.addColorStop(0.6, '#280738');
    pedGlow.addColorStop(1, 'transparent');
  } else {
    pedGlow.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
    pedGlow.addColorStop(0.6, '#0f1e24');
    pedGlow.addColorStop(1, 'transparent');
  }
  c.fillStyle = pedGlow; c.beginPath(); c.ellipse(w/2, h*.78, w*.33, h*.13, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = isLegendary ? '#fbbf24' : isCartography ? '#c084fc' : '#38bdf888'; c.lineWidth = 2; c.stroke();

  // Partículas y destellos en la vitrina
  if (isLegendary || isCartography) {
    c.save();
    for (let i = 0; i < 6; i++) {
      const px = (w * 0.22) + ((i * 47 + Math.sin(time * 3 + i) * 18) % (w * 0.56));
      const py = (h * 0.72) - ((time * 25 + i * 28) % (h * 0.45));
      const sparkAlpha = Math.max(0, Math.sin(time * 4 + i));
      if (isLegendary) {
        c.fillStyle = `rgba(254, 240, 138, ${sparkAlpha * 0.85})`;
        c.fillRect(px, py, 2.5, 2.5);
        c.fillStyle = `rgba(251, 191, 36, ${sparkAlpha * 0.45})`;
        c.fillRect(px - 1, py, 4.5, 1);
        c.fillRect(px, py - 1, 1, 4.5);
      } else {
        c.fillStyle = `rgba(243, 232, 255, ${sparkAlpha * 0.85})`;
        c.fillRect(px, py, 2.5, 2.5);
        c.fillStyle = `rgba(192, 132, 252, ${sparkAlpha * 0.55})`;
        c.fillRect(px - 1, py, 4.5, 1);
        c.fillRect(px, py - 1, 1, 4.5);
      }
    }
    c.restore();
  }
  const scale=Math.min(w/115,h/84);
  if(item.type==='pet'){
    if(item.id==='none'){c.fillStyle='#9aafa1';c.font='bold 14px monospace';c.textAlign='center';c.fillText('SIN MASCOTA',w/2,h*.5);}
    else drawPet(c,item.id,w/2,h*.5,time,scale*1.6);
  }else{
    const skinId = item.type==='skin'?item.id:profile?.loadout.skin||'pancho';
    const accId = item.type==='accessory'?item.id:profile?.loadout.accessory;
    const py = h * 0.54;
    const bob = Math.round(Math.sin(time * 5) * 1.5);
    drawAccessory(c, accId, w/2, py + bob, scale, 'back');
    drawFood(c, skinId, w/2, py, scale, time);
    drawAccessory(c, accId, w/2, py + bob, scale, 'front');
  }
}

export function canvasPoint(rect,width,height,clientX,clientY){
  const scale=Math.min(rect.width/width,rect.height/height);
  const x=(clientX-rect.left-(rect.width-width*scale)/2)/scale;
  const y=(clientY-rect.top-(rect.height-height*scale)/2)/scale;
  return x<0||x>width||y<0||y>height?null:{x,y};
}

// Igual que canvasPoint pero para un canvas con object-fit: cover (sin franjas negras).
export function canvasPointCover(rect,width,height,clientX,clientY){
  const scale=Math.max(rect.width/width,rect.height/height);
  const x=(clientX-rect.left-(rect.width-width*scale)/2)/scale;
  const y=(clientY-rect.top-(rect.height-height*scale)/2)/scale;
  return x<0||x>width||y<0||y>height?null:{x,y};
}

export function approachPoint(position,target,speed,delta){
  const dx=target.x-position.x,dy=target.y-position.y,distance=Math.hypot(dx,dy);
  const step=Math.min(distance,speed*delta);
  return {x:position.x+(distance?dx/distance*step:0),y:position.y+(distance?dy/distance*step:0),arrived:distance<=step+.1};
}
