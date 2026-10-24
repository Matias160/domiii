import {drawFood, drawDiner} from './art.js';
import {Companion} from '../entities/Companion.js';
import {drawWorldProps} from './worldProps.js';
import {drawAccessory, drawAccessoryIcon} from './accessories.js';

export { drawAccessory, drawAccessoryIcon };

export function drawPet(ctx,id,x,y,time=0,scale=1){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const pet=new Companion(id,{x:40,y:-30});pet.x=0;pet.y=0;pet.draw(ctx,time);ctx.restore();
}

export function drawItemPreview(canvas,item,profile,time=0){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  c.clearRect(0,0,w,h);c.imageSmoothingEnabled=false;
  if(item.type==='map'){
    const preview=document.createElement('canvas');preview.width=960;preview.height=540;
    const scene=preview.getContext('2d');drawDiner(scene,960,540,time,false,item.id);drawWorldProps(scene,item.id,time);
    c.drawImage(preview,0,82,960,458,0,0,w,h);
    c.fillStyle='#07111666';c.fillRect(0,h-22,w,22);c.fillStyle='#fff0b0';c.font='900 11px monospace';c.textAlign='left';c.fillText(item.name.toUpperCase(),10,h-7);
    return;
  }
  // Fondo de vitrina con degradado atmosférico
  const bgGrad = c.createRadialGradient(w/2, h*0.5, 10, w/2, h*0.5, w*0.7);
  bgGrad.addColorStop(0, '#1a333a');
  bgGrad.addColorStop(0.6, '#102227');
  bgGrad.addColorStop(1, '#091316');
  c.fillStyle = bgGrad; c.fillRect(0, 0, w, h);
  for(let x=0;x<w;x+=24){c.fillStyle='#38bdf80a';c.fillRect(x,0,1,h);}

  // Pedestal con resplandor de vitrina
  const pedGlow = c.createRadialGradient(w/2, h*.78, 5, w/2, h*.78, w*.35);
  pedGlow.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
  pedGlow.addColorStop(0.6, '#0f1e24');
  pedGlow.addColorStop(1, 'transparent');
  c.fillStyle = pedGlow; c.beginPath(); c.ellipse(w/2, h*.78, w*.33, h*.13, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#38bdf888'; c.lineWidth = 2; c.stroke();
  const scale=Math.min(w/115,h/84);
  if(item.type==='pet'){
    if(item.id==='none'){c.fillStyle='#9aafa1';c.font='bold 14px monospace';c.textAlign='center';c.fillText('SIN MASCOTA',w/2,h*.5);}
    else drawPet(c,item.id,w/2,h*.5,time,scale*1.6);
  }else{
    drawFood(c,item.type==='skin'?item.id:profile?.loadout.skin||'pancho',w/2,h*.48,scale,time);
    drawAccessory(c,item.type==='accessory'?item.id:profile?.loadout.accessory,w/2,h*.48,scale/.85);
  }
}

export function canvasPoint(rect,width,height,clientX,clientY){
  const scale=Math.min(rect.width/width,rect.height/height);
  const x=(clientX-rect.left-(rect.width-width*scale)/2)/scale;
  const y=(clientY-rect.top-(rect.height-height*scale)/2)/scale;
  return x<0||x>width||y<0||y>height?null:{x,y};
}

export function approachPoint(position,target,speed,delta){
  const dx=target.x-position.x,dy=target.y-position.y,distance=Math.hypot(dx,dy);
  const step=Math.min(distance,speed*delta);
  return {x:position.x+(distance?dx/distance*step:0),y:position.y+(distance?dy/distance*step:0),arrived:distance<=step+.1};
}
