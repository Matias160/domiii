import {drawFood, domiGifImage, drawBurgosMark} from '../core/art.js';
import {drawPet} from '../core/presentation.js';

import {createAnimatedGif} from '../core/animatedGif.js';

export const portalGifImage = createAnimatedGif('./portal.gif');
export const copaGifImage = createAnimatedGif('./copa rankin.gif');

function box(c,x,y,w,h,color,shadow=true){
  if(shadow){
    c.fillStyle='rgba(4,10,14,0.45)';c.fillRect(x+4,y+5,w+4,h+3);
  }
  c.fillStyle='#0e1b20';c.fillRect(x-2,y-2,w+4,h+4);
  c.fillStyle=color;c.fillRect(x,y,w,h);
  c.fillStyle='rgba(255,255,255,0.22)';c.fillRect(x+2,y+2,w-4,2);
  c.fillStyle='rgba(0,0,0,0.3)';c.fillRect(x+2,y+h-3,w-4,2);
}

function pixelDisk(c,x,y,r,color,step=3){
  c.fillStyle=color;
  for(let row=-r;row<r;row+=step){
    const half=Math.floor(Math.sqrt(Math.max(0,r*r-row*row))/step)*step;
    c.fillRect(x-half,y+row,Math.max(step,half*2),step);
  }
}

function text(c,value,x,y,size=11,color='#f6edcf',align='center'){
  c.textAlign=align;c.fillStyle=color;c.font=`900 ${size}px 'Press Start 2P', monospace`;
  c.shadowColor='#000';c.shadowBlur=3;
  c.fillText(value,x,y);
  c.shadowBlur=0;
}

function drawPlant(c,x,y){
  c.fillStyle='rgba(0,0,0,0.35)';c.beginPath();c.ellipse(x,y+16,18,6,0,0,7);c.fill();
  box(c,x-12,y+2,24,18,'#b86550');
  c.fillStyle='#8c4434';c.fillRect(x-14,y+2,28,4);
  // Leaves
  const leaves=[[-10,-12,12,14,'#2d8a5b'],[4,-14,14,16,'#36a36c'],[-4,-22,12,18,'#41bf80'],[10,-8,12,12,'#2d8a5b'],[-16,-6,10,12,'#256f4a']];
  for(const [lx,ly,lw,lh,col] of leaves){
    c.fillStyle=col;c.fillRect(x+lx,y+ly,lw,lh);
    c.fillStyle='#65df9d';c.fillRect(x+lx+2,y+ly+2,lw-4,3);
  }
}

function drawArcadeCabinet(c,x,y,name,col1,col2,t=0){
  c.fillStyle='rgba(0,0,0,0.4)';c.beginPath();c.ellipse(x+16,y+60,26,8,0,0,7);c.fill();
  box(c,x,y,32,58,col1);
  c.fillStyle=col2;c.fillRect(x+4,y+6,24,10); // Marquee
  c.fillStyle='#fff';c.fillRect(x+6,y+8,20,3);
  // Screen
  c.fillStyle='#060d12';c.fillRect(x+4,y+20,24,20);
  const screenCycle=Math.floor(t*4)%4;
  c.fillStyle=['#00ffcc','#ff0066','#ffe066','#38ef7d'][screenCycle];
  c.fillRect(x+8+(screenCycle*3)%12,y+24+((screenCycle*5)%10),6,5);
  // Controls
  c.fillStyle='#1e2f38';c.fillRect(x+2,y+42,28,8);
  c.fillStyle='#ff3366';c.fillRect(x+8,y+44,4,4); // Joystick
  c.fillStyle='#ffe066';c.fillRect(x+18,y+45,3,3);c.fillRect(x+23,y+45,3,3); // Buttons
  // Coin door
  c.fillStyle='#0b151a';c.fillRect(x+6,y+52,20,5);
  c.fillStyle='#ff9900';c.fillRect(x+14,y+53,3,2);
}

function drawDinerBooth(c,x,y){
  c.fillStyle='rgba(0,0,0,0.3)';c.beginPath();c.ellipse(x+35,y+42,48,12,0,0,7);c.fill();
  // Left seat
  box(c,x,y+6,16,32,'#b93b4f');
  c.fillStyle='#e06579';c.fillRect(x+3,y+8,10,28);
  // Right seat
  box(c,x+54,y+6,16,32,'#b93b4f');
  c.fillStyle='#e06579';c.fillRect(x+57,y+8,10,28);
  // Table
  box(c,x+18,y+10,34,24,'#2d414a');
  // Checkered tablecloth
  for(let row=0;row<3;row++)for(let col=0;col<4;col++){
    c.fillStyle=(row+col)%2===0?'#f5ecd5':'#b84444';
    c.fillRect(x+20+col*7,y+12+row*6,7,6);
  }
  // Condiments
  c.fillStyle='#ff2233';c.fillRect(x+32,y+15,3,6); // Ketchup
  c.fillStyle='#ffcc00';c.fillRect(x+36,y+15,3,6); // Mustard
}

export function makeRoom(){
  const canvas=document.createElement('canvas');
  canvas.width=1920;canvas.height=1080;
  const c=canvas.getContext('2d');
  
  // Base background
  c.fillStyle='#08131d';c.fillRect(0,0,1920,1080);
  
  // Floor tiles (from y:150 to y:1060)
  const tileSize=48;
  for(let y=150;y<1060;y+=tileSize){
    for(let x=24;x<1896;x+=tileSize){
      const tx=Math.floor(x/tileSize),ty=Math.floor(y/tileSize);
      const isPath=(Math.abs(x-960)<96)||(Math.abs(y-540)<50)||(Math.abs(x-400)<70)||(Math.abs(x-1520)<70);
      const alternate=(tx+ty)%2;
      
      c.fillStyle='rgba(6,16,22,0.6)';c.fillRect(x+3,y+4,tileSize-1,tileSize-1);
      
      if(isPath){
        c.fillStyle=alternate?'#1e464c':'#275a5e';
      } else {
        c.fillStyle=alternate?'#1b393f':'#23494e';
      }
      c.fillRect(x,y,tileSize-1,tileSize-1);
      
      c.fillStyle='rgba(255,255,255,0.06)';c.fillRect(x+2,y+2,tileSize-5,2);
      c.fillStyle='rgba(0,0,0,0.2)';c.fillRect(x+2,y+tileSize-4,tileSize-5,2);
      
      // Random worn floor specs
      if((tx*7+ty*13)%19===0){
        c.fillStyle='rgba(0,255,180,0.18)';c.fillRect(x+12,y+14,6,3);
      }
    }
  }

  // Central Grand Plaza Carpet
  const carpetX=740,carpetY=380,carpetW=440,carpetH=320;
  c.fillStyle='rgba(4,10,16,0.6)';c.fillRect(carpetX+6,carpetY+8,carpetW+6,carpetH+6);
  box(c,carpetX,carpetY,carpetW,carpetH,'#3b184d',false);
  c.strokeStyle='#ff2a7a';c.lineWidth=5;c.strokeRect(carpetX+10,carpetY+10,carpetW-20,carpetH-20);
  c.strokeStyle='#00ffcc';c.lineWidth=3;c.strokeRect(carpetX+18,carpetY+18,carpetW-36,carpetH-36);
  
  // Neon center emblem
  c.save();
  c.fillStyle='rgba(255,42,122,0.15)';c.beginPath();c.arc(960,540,110,0,7);c.fill();
  c.strokeStyle='#ffe066';c.lineWidth=3;c.beginPath();c.arc(960,540,90,0,7);c.stroke();
  text(c,'DOMI 2',960,535,26,'#fff0a0');
  text(c,'ARCADE CLUB · 24/7',960,562,9,'#8ef2dc');
  c.restore();

  // Directional floor arrows painted on tiles
  const drawArrow=(ax,ay,dir='right',lbl='')=>{
    c.save();c.translate(ax,ay);
    c.fillStyle='rgba(0,255,200,0.25)';
    if(dir==='right'){
      c.fillRect(-20,-4,30,8);c.beginPath();c.moveTo(10,-12);c.lineTo(24,0);c.lineTo(10,12);c.fill();
    } else if(dir==='left'){
      c.fillRect(-10,-4,30,8);c.beginPath();c.moveTo(-10,-12);c.lineTo(-24,0);c.lineTo(-10,12);c.fill();
    } else if(dir==='up'){
      c.fillRect(-4,-10,8,30);c.beginPath();c.moveTo(-12,-10);c.lineTo(0,-24);c.lineTo(12,-10);c.fill();
    }
    if(lbl){
      text(c,lbl,0,24,7,'#8ee8d8');
    }
    c.restore();
  };
  drawArrow(620,470,'left','TIENDA');
  drawArrow(1300,470,'right','MASCOTAS');
  drawArrow(960,370,'up','A LA COCINA');
  drawArrow(620,670,'left','SEÑOR DOMI');
  drawArrow(1300,670,'right','REGISTRO');

  // Back Wall (y: 0 to 150)
  box(c,20,16,1880,136,'#12202b');
  c.fillStyle='#091118';c.fillRect(20,146,1880,12);
  c.fillStyle='#ff2a7a';c.fillRect(20,148,1880,4);
  c.fillStyle='#00e5ff';c.fillRect(20,152,1880,3);

  // Grand Header Sign
  box(c,760,26,400,82,'#c92a58');
  c.fillStyle='#ff5787';c.fillRect(768,34,384,6);
  text(c,'DOMI ARCADE',960,76,34,'#fff0a8');
  text(c,'EL CLUB DEL ULTIMO TURNO · FAST FOOD COMBAT',960,98,9,'#a3eedf');

  // Side Wall Posters and Neon Signs
  // Plaquita "construido por BurgosCorp" entre los carteles de la pared
  drawBurgosMark(c,330,58,2,0.85);
  box(c,60,36,260,68,'#162a30');
  text(c,'COMBO DE LA CASA',190,62,11,'#ffe078');
  text(c,'SOBREVIVIR AL TURNO',190,82,8,'#8ad8b8');

  box(c,370,36,250,68,'#1c2638');
  text(c,'01 / BAZAR ARCADE',495,62,11,'#ffd000');
  text(c,'SKINS, MAPAS Y MAS',495,82,8,'#ffea88');

  box(c,1290,36,260,68,'#163226');
  text(c,'02 / GUARDERIA',1420,62,11,'#56e39f');
  text(c,'MASCOTAS Y ALIADOS',1420,82,8,'#9cf5ca');

  box(c,1600,36,260,68,'#362a14');
  text(c,'03 / REGISTRO',1730,62,11,'#7dd3fc');
  text(c,'HACETE SOCIO DEL CLUB',1730,82,8,'#bae6fd');

  // Decorative Arcade Cabinets along back wall
  drawArcadeCabinet(c,660,102,'PAC', '#2b4d8a','#38d9ff',0);
  drawArcadeCabinet(c,700,102,'STR', '#b83b5e','#ff7597',1);
  drawArcadeCabinet(c,1200,102,'BUR', '#8a6b2b','#ffd000',2);
  drawArcadeCabinet(c,1240,102,'CAR', '#2b8a4f','#00ffaa',3);

  // Decorative Arcade Cabinets in bottom lounge
  drawArcadeCabinet(c,760,860,'RET', '#5c2b8a','#c084fc',1);
  drawArcadeCabinet(c,800,860,'TUR', '#8a2b4b','#ff3b69',2);
  drawArcadeCabinet(c,1100,860,'DOM', '#2b778a','#38bdf8',3);
  drawBurgosMark(c,1123,906,1,0.8); // calcomanía BC en el costado de la máquina DOM
  drawArcadeCabinet(c,1140,860,'MAX', '#2b8a77','#34d399',0);

  // Diner Tables & Seating
  drawDinerBooth(c,160,500);
  drawDinerBooth(c,160,640);
  drawDinerBooth(c,1680,500);
  drawDinerBooth(c,1680,640);

  // Plants
  drawPlant(c,70,180);
  drawPlant(c,70,980);
  drawPlant(c,1850,180);
  drawPlant(c,1850,980);
  drawPlant(c,630,220);
  drawPlant(c,1290,220);
  drawPlant(c,630,760);
  drawPlant(c,1290,760);

  // Wall Footing and Borders
  c.fillStyle='#071016';c.fillRect(16,146,8,914);c.fillRect(1896,146,8,914);
  c.fillStyle='#7e999c';c.fillRect(24,146,4,910);c.fillRect(1892,146,4,910);
  c.fillStyle='#122026';c.fillRect(20,1056,1880,16);

  return canvas;
}

export function drawRoomLight(c,t){
  c.save();
  // Spotlights from ceiling
  const lights=[
    {x:960,y:150,radius:260,col:'#ffe066'},
    {x:400,y:150,radius:220,col:'#ff7597'},
    {x:1520,y:150,radius:220,col:'#56e39f'},
    {x:400,y:700,radius:200,col:'#5ce1e6'},
    {x:960,y:780,radius:220,col:'#c084fc'},
    {x:1520,y:700,radius:200,col:'#ffd000'},
  ];
  for(const lt of lights){
    const grad=c.createRadialGradient(lt.x,lt.y+80,10,lt.x,lt.y+140,lt.radius);
    grad.addColorStop(0,lt.col+'1c');
    grad.addColorStop(0.6,lt.col+'08');
    grad.addColorStop(1,'transparent');
    c.fillStyle=grad;
    c.beginPath();c.arc(lt.x,lt.y+140,lt.radius,0,7);c.fill();
    
    // Light fixture beam
    c.fillStyle=lt.col+'0d';
    c.beginPath();c.moveTo(lt.x-24,lt.y);c.lineTo(lt.x+24,lt.y);c.lineTo(lt.x+lt.radius*0.65,lt.y+260);c.lineTo(lt.x-lt.radius*0.65,lt.y+260);c.fill();
  }

  // Portal motes at (960, 260) - 50% larger aura
  for(let i=0;i<24;i++){
    const phase=(t*0.2+i/24)%1;
    const x=960+Math.sin(i*2.1+t*0.9)*(20+phase*72);
    const y=300-phase*220;
    c.globalAlpha=Math.sin(phase*Math.PI)*0.85;
    c.fillStyle=i%3===0?'#00ffcc':i%3===1?'#ffe066':'#ff3b69';
    const s=3+(i%3)*2;
    const a=c.globalAlpha;c.globalAlpha=a*0.3;c.fillRect(Math.round(x-s),Math.round(y-s),s*3,s*3);c.globalAlpha=a;
    c.fillRect(Math.round(x),Math.round(y),s,s);
  }
  c.globalAlpha=1;c.shadowBlur=0;
  c.restore();
}

export function drawStation(c,s,t,active){
  const {x,y,id,color,label,action='INTERACTUAR'}=s;
  c.save();c.translate(x,y);
  
  // Floor cast shadow (portal +50%)
  c.fillStyle='rgba(0,0,0,0.45)';
  c.beginPath();
  c.ellipse(0,48,id==='portal'?128:75,id==='portal'?33:18,0,0,7);
  c.fill();

  // Active floor glowing ring (portal +50%)
  if(active){
    c.save();
    const ringW = id==='portal'?132:88;
    const ringH = id==='portal'?39:26;
    c.fillStyle=color+'26';
    c.beginPath();c.ellipse(0,46,ringW,ringH,0,0,7);c.fill();
    c.strokeStyle=color;c.lineWidth=3;
    c.beginPath();c.ellipse(0,46,ringW+Math.sin(t*4)*3,ringH+Math.sin(t*4)*1.5,0,0,7);c.stroke();
    // Inward pointing floor chevron pulses
    const pulse=Math.sin(t*5)*6;
    c.fillStyle=color;
    const chevDist = id==='portal'?105:70;
    for(const side of [-1,1]){
      c.beginPath();
      c.moveTo(side*(chevDist+pulse),40);c.lineTo(side*(chevDist-12+pulse),46);c.lineTo(side*(chevDist+pulse),52);
      c.fill();
    }
    c.restore();
  }

  // --- 1. STATION BODY ---
  if(id==='portal'){
    // Sombra de vórtice en el piso (+50%)
    c.save();
    c.fillStyle='rgba(0,0,0,0.45)';
    c.beginPath();c.ellipse(0,38,111,30,0,0,7);c.fill();
    c.restore();

    if (portalGifImage && portalGifImage.complete && portalGifImage.naturalWidth > 0) {
      c.save();
      c.imageSmoothingEnabled = false;
      const pw = 240, ph = 240; // 160 * 1.5 = 240 (+50%)
      const bob = Math.sin(t * 2.8) * 5;
      c.drawImage(portalGifImage, -pw / 2, -pw / 2 - 32 + bob, pw, ph);
      c.restore();
    } else {
      // Massive portal gate fallback (+50%)
      box(c,-98,-158,195,210,'#1a2a30');
      box(c,-81,-142,162,186,'#09161a');
      c.save();
      c.shadowColor='#ffe066';c.shadowBlur=26+Math.sin(t*3)*12;
      c.strokeStyle='#ffe066';c.lineWidth=7;
      c.beginPath();c.ellipse(0,-48,51+Math.sin(t*2.5)*4,72,0,0,7);c.stroke();
      c.strokeStyle='#00e5ff';c.lineWidth=4;
      c.beginPath();c.ellipse(0,-48,36,57,Math.sin(t)*0.15,0,7);c.stroke();
      c.restore();
      const riftGrad=c.createRadialGradient(0,-48,6,0,-48,48);
      riftGrad.addColorStop(0,'#ffffff');riftGrad.addColorStop(0.35,'#ffe066');riftGrad.addColorStop(0.7,'#00e5ff');riftGrad.addColorStop(1,'#04121a');
      c.fillStyle=riftGrad;c.beginPath();c.ellipse(0,-48,30,51,0,0,7);c.fill();
      for(let i=0;i<8;i++){
        const ang=t*1.2+i*0.78;c.fillStyle=i%2?'#ffffff':'#ffe066';c.fillRect(Math.sin(ang)*51-3,-48+Math.cos(ang)*69-3,6,6);
      }
      box(c,-112,48,225,20,'#b2ba99');
      c.fillStyle='#ff2a44';for(let i=0;i<7;i++)c.fillRect(-105+i*33,51,15,15);
    }
  }
  else if(id==='pets'){
    // Day care enclosure
    box(c,-72,-48,144,82,'#3e6f54');
    box(c,-64,-40,128,66,'#8db37d');
    // Grass patch
    c.fillStyle='#5b9967';c.fillRect(-60,-36,120,58);
    // Pet sprites
    drawPet(c,'ketchup',-34,-10,t,1.4);
    drawPet(c,'drone',36,-16,t,0.85);
    // Fence pickets
    c.fillStyle='#f0dfb2';
    for(let i=0;i<6;i++)box(c,-66+i*24,14,12,28,'#ebd5a1',false);
  }
  else if(id==='shop'){
    // Bazaar stall
    box(c,-65,-88,130,124,'#d99b26');
    box(c,-56,-78,74,80,'#1c2d33');
    // Product shelves
    for(let i=0;i<6;i++){
      const sx=-48+(i%2)*28,sy=-66+Math.floor(i/2)*24;
      c.fillStyle=['#ff4d6d','#52b788','#ffd166'][i%3];
      c.fillRect(sx,sy,16,18);
      c.fillStyle='#fff';c.fillRect(sx+2,sy+2,12,3);
    }
    // Cash register
    box(c,24,-52,28,34,'#253a40');
    // Spinning Dollar Coin
    const coinPhase=Math.cos(t*3);
    c.save();c.translate(38,-35);c.scale(coinPhase,1);
    c.fillStyle='#ffe066';c.beginPath();c.arc(0,0,12,0,7);c.fill();
    c.strokeStyle='#b38600';c.lineWidth=2;c.stroke();
    text(c,'$',0,5,12,'#1a1500');
    c.restore();
    box(c,-48,18,96,16,'#1a2928');
  }
  else if(id==='prize' || id==='atlas' || id==='desk'){
    // Si el jugador está cerca o pasa el mouse por encima, resaltar el puesto con borde neón
    if(active){
      c.save();
      c.strokeStyle='#f43f5e';
      c.lineWidth=2;
      c.strokeRect(-76,-110,152,148);
      c.restore();
    }

    // The lobby cabinet uses the same silhouette and color cues as its close-up.
    box(c,-60,-104,120,24,'#a93a65');
    c.fillStyle='#0d1726';c.fillRect(-53,-98,106,12);
    text(c,'PREMIOS',0,-88,9,'#fff4c4');
    for(let i=0;i<10;i++){
      c.fillStyle=(Math.floor(t*8)+i)%3===0?'#fff8d0':'#ffb653';
      c.fillRect(-53+i*11,-103,5,3);
      c.fillRect(-53+i*11,-83,5,3);
    }

    pixelDisk(c,0,-38,39,'#09111c');
    pixelDisk(c,0,-38,36,'#ffe17a');
    pixelDisk(c,0,-38,32,'#1a354e');
    const positions=[[-19,-52],[-5,-62],[13,-55],[-22,-35],[-6,-37],[15,-35],[-13,-20],[8,-20]];
    const capColors=['#7ce5ff','#f472b6','#82e8ae','#ffe17a','#d7a4ff','#ff9d78','#75a7ff','#ffe17a'];
    positions.forEach(([px,py],i)=>{
      const bob=Math.round(Math.sin(t*2+i)*2);
      c.fillStyle='#07111c';c.fillRect(px-6,py-5+bob,12,12);
      c.fillStyle=capColors[i];c.fillRect(px-4,py-4+bob,8,5);
      c.fillStyle='#f1f4ff';c.fillRect(px-4,py+2+bob,8,4);
      c.fillStyle='#14202b';c.fillRect(px-5,py+1+bob,10,2);
    });
    c.fillStyle='rgba(230,255,255,0.35)';
    c.fillRect(-24,-62,10,3);c.fillRect(-27,-59,3,12);
    c.fillRect(18,-68,6,3);
    for(let i=0;i<14;i++){
      const angle=i*Math.PI/7;
      c.fillStyle=(Math.floor(t*10)+i)%4===0?'#fff7c4':'#f472b6';
      c.fillRect(Math.round(Math.cos(angle)*35)-2,Math.round(-38+Math.sin(angle)*35)-2,4,4);
    }

    box(c,-52,0,104,40,'#a93a65');
    c.fillStyle='#f472b6';c.fillRect(-52,0,104,4);c.fillRect(-52,36,104,4);
    c.fillStyle='#7ce5dc';c.fillRect(-12,3,24,6);
    c.fillStyle='#08111d';c.fillRect(-15,13,30,20);
    c.fillStyle='#ffe17a';c.fillRect(-17,11,34,3);c.fillRect(-17,32,34,3);
    c.fillStyle='#351b38';c.fillRect(-12,16,24,14);
    c.fillStyle='#09111b';c.fillRect(-43,9,25,25);
    c.fillStyle='#ffe17a';c.fillRect(-40,12,19,19);
    c.fillStyle='#29485a';c.fillRect(-37,15,13,13);
    c.save();c.translate(-30,21);c.rotate(t*1.5);
    c.fillStyle='#e7f5f4';c.fillRect(-2,-2,14,4);
    c.fillStyle='#f472b6';c.fillRect(10,-4,7,8);
    c.restore();
    c.fillStyle='#08111d';c.fillRect(28,10,16,23);
    c.fillStyle='#ffe17a';c.fillRect(31,12,10,3);c.fillRect(35,18,3,11);

    // Globito flotante: invita a probar la máquina
    if(!active){
      const float=Math.sin(t*3)*3;
      c.save();c.translate(-68,-142+float);
      box(c,0,0,136,26,'#fff7e0');
      c.fillStyle='#fff7e0';c.fillRect(60,26,10,6);c.fillRect(63,32,4,3);
      text(c,'¡PREMIOS 150 PT!',68,17,7,'#831843');
      c.restore();
    }
  }
  else if(id==='npc'){
    // Señor Domi Chef booth
    if (domiGifImage && domiGifImage.complete && domiGifImage.naturalWidth > 0) {
      const bob = Math.sin(t * 5) * 3;
      const dw = 64, dh = 66;
      c.drawImage(domiGifImage, -dw / 2, -38 - dh / 2 + bob, dw, dh);
    } else {
      drawFood(c,'domi',0,-24,1.3,t);
    }
    // Mostrador de cocina arcade
    box(c,-68,8,136,28,'#aa5438');
    text(c,'SEÑOR DOMI',0,27,11,'#fff0a8');
    if(!active){
      const float=Math.sin(t*3+1.2)*3;
      c.save();c.translate(36,-78+float);
      box(c,0,0,28,26,'#ffe8a8');
      text(c,'!',14,19,16,'#22332e');
      c.restore();
    }
  }
  else if(id==='ranking'){
    // Hall of Fame arcade podium
    box(c,-58,-84,116,120,'#4a5482');
    box(c,-48,-74,96,68,'#151c2e');
    
    // Copa animada dorada (copa rankin.gif)
    if (copaGifImage && copaGifImage.complete && copaGifImage.naturalWidth > 0) {
      c.save();
      c.imageSmoothingEnabled = false;
      const cw = 74, ch = 74;
      const float = Math.sin(t * 3.2) * 3;
      c.drawImage(copaGifImage, -cw / 2, -42 - ch / 2 + float, cw, ch);
      c.restore();
    } else {
      c.fillStyle='#ffe066';
      c.fillRect(-14,-62,28,16);c.fillRect(-8,-46,16,12);c.fillRect(-16,-34,32,6);
      c.strokeStyle='#b38600';c.lineWidth=2;c.strokeRect(-14,-62,28,16);
      c.strokeStyle='#ffe066';c.lineWidth=3;
      c.beginPath();c.arc(-14,-54,8,1.5,4.7);c.stroke();
      c.beginPath();c.arc(14,-54,8,4.7,1.5);c.stroke();
    }
    // Marquee scrolling text
    box(c,-64,8,128,20,'#c73e6a');
    text(c,'HALL OF FAME',0,23,9,'#fff0a8');
  }

  // --- 2. EYE-CATCHING PIXEL ART MARQUEE SIGN ---
  const signFloat=Math.sin(t*2.4+s.x*0.01)*3;
  c.save();c.translate(0,signFloat);

  const isPortal = (id === 'portal');
  // Cuadro del portal aumentado en un 50% (174 * 1.5 = 260, 42 * 1.5 = 63)
  const signW = isPortal ? 260 : 174;
  const signH = isPortal ? 63 : 42;
  const signX = -signW / 2;
  const signY = isPortal ? 70 : 54;

  // Sign Drop shadow
  c.fillStyle='rgba(0,0,0,0.6)';
  c.fillRect(signX+(isPortal?7:5),signY+(isPortal?8:6),signW,signH);

  // Outer Casing (Dark steel with pixel border)
  c.fillStyle='#071116';c.fillRect(signX-(isPortal?4:3),signY-(isPortal?4:3),signW+(isPortal?8:6),signH+(isPortal?8:6));
  c.fillStyle='#182730';c.fillRect(signX,signY,signW,signH);

  // Neon Frame
  c.lineWidth=isPortal?3:2;
  c.strokeStyle=active?color:'rgba(100,140,150,0.6)';
  if(active){
    c.shadowColor=color;c.shadowBlur=(isPortal?22:14)+Math.sin(t*4)*6;
  }
  c.strokeRect(signX+2,signY+2,signW-4,signH-4);
  c.shadowBlur=0;

  // Sign Interior Face
  c.fillStyle=active?'#0b1d24':'#0c161c';
  c.fillRect(signX+4,signY+4,signW-8,signH-8);

  // Corner Pixel Accents
  c.fillStyle=color;
  const cornerSize = isPortal ? 6 : 4;
  c.fillRect(signX,signY,cornerSize,cornerSize);
  c.fillRect(signX+signW-cornerSize,signY,cornerSize,cornerSize);
  c.fillRect(signX,signY+signH-cornerSize,cornerSize,cornerSize);
  c.fillRect(signX+signW-cornerSize,signY+signH-cornerSize,cornerSize,cornerSize);

  // Blinking Marquee Bulbs along the top/bottom rim
  const bulbCycle=Math.floor(t*6)%3;
  const bulbCount = isPortal ? 7 : 5;
  const bulbStep = isPortal ? 36 : 34;
  const bulbOffset = isPortal ? 18 : 12;
  for(let b=0;b<bulbCount;b++){
    c.fillStyle=(b%3===bulbCycle)?color:'#2a4049';
    c.fillRect(signX+bulbOffset+b*bulbStep,signY+2,isPortal?5:4,isPortal?3:2);
    c.fillRect(signX+bulbOffset+b*bulbStep,signY+signH-(isPortal?5:4),isPortal?5:4,isPortal?3:2);
  }

  // Station Label (tipografía aumentada 50% para el portal: 10 -> 16px)
  text(c,label,0,signY+(isPortal?38:24),isPortal?16:10,active?'#ffffff':'#d5e4df');

  // Interactive Prompt Badge [E] when player is near or active (+50% para el portal)
  if(active){
    const promptW = isPortal ? 195 : 130;
    const promptH = isPortal ? 33 : 22;
    const promptX = -promptW / 2, promptY = signY + signH + (isPortal ? 8 : 6);
    
    // Pixel key button
    c.fillStyle='rgba(0,0,0,0.7)';c.fillRect(promptX+4,promptY+5,promptW,promptH);
    box(c,promptX,promptY,promptW,promptH,'#ffe066');
    
    c.fillStyle='#ad8141';c.fillRect(promptX,promptY+promptH-(isPortal?4:3),promptW,isPortal?4:3);
    
    // Key indicator [E]
    const keyW = isPortal ? 26 : 18;
    const keyH = isPortal ? 21 : 14;
    c.fillStyle='#18232b';c.fillRect(promptX+(isPortal?8:5),promptY+(isPortal?6:4),keyW,keyH);
    text(c,'E',promptX+(isPortal?21:14),promptY+(isPortal?22:15),isPortal?13:9,'#ffe066');
    
    // Action text
    text(c,action.toUpperCase(),promptX+(isPortal?108:72),promptY+(isPortal?22:15),isPortal?12:8,'#18232b');
  }

  c.restore();
  c.restore();
}

// Vida del local: todo se dibuja con rectángulos simples (sin sombras difusas) para no pesar
const CABINETS=[[660,102],[700,102],[1200,102],[1240,102],[760,860],[800,860],[1100,860],[1140,860]];
const BOOTHS=[[160,500],[160,640],[1680,500],[1680,640]];
const BULB_COLORS=['#ffe066','#ff3b69','#00e5ff'];
export function drawLobbyLife(c,t){
  c.save();
  // Pantallas de las máquinas arcade: cada una corre su propio "jueguito"
  CABINETS.forEach(([x,y],i)=>{
    const k=t*1.6+i*0.9;
    c.fillStyle='#060d12';c.fillRect(x+4,y+20,24,20);
    c.fillStyle=['#00ffcc','#ff0066','#ffe066','#38ef7d'][i%4];
    c.fillRect(x+6+Math.round((Math.sin(k)*0.5+0.5)*16),y+22+Math.round((Math.cos(k*1.3)*0.5+0.5)*13),4,4);
    c.fillStyle='#ffffff';c.fillRect(x+6+Math.round(((k*6)%18)),y+36,2,2);
    if(Math.sin(t*9+i*2)>0.92){c.globalAlpha=0.35;c.fillStyle='#ffffff';c.fillRect(x+4,y+20,24,20);c.globalAlpha=1;}
  });
  // Foquitos que corren alrededor del cartel DOMI ARCADE
  const bulbs=40,step=Math.floor(t*10);
  for(let b=0;b<bulbs;b++){
    const side=b<15?0:b<20?1:b<35?2:3,u=side===0?b/15:side===1?(b-15)/5:side===2?(b-20)/15:(b-35)/5;
    const bx=side===0?762+u*396:side===1?1158:side===2?1158-u*396:762,by=side===0?27:side===1?27+u*80:side===2?107:107-u*80;
    c.fillStyle=(b+step)%3===0?BULB_COLORS[(b+step)%BULB_COLORS.length]:'#3a1c26';
    c.fillRect(Math.round(bx)-2,Math.round(by)-2,4,4);
  }
  // Pulso de luz que recorre la tira de neón de la pared
  const runX=20+((t*420)%1880);
  c.globalAlpha=0.85;c.fillStyle='#ffd1e6';c.fillRect(Math.round(runX),148,90,4);
  c.fillStyle='#d6fbff';c.fillRect(Math.round(1880-((t*360)%1860)),152,70,3);c.globalAlpha=1;
  // Vapor de los cafés en los reservados
  BOOTHS.forEach(([x,y],i)=>{
    for(let s=0;s<3;s++){
      const p=(t*0.55+s/3+i*0.21)%1;
      c.globalAlpha=Math.sin(p*Math.PI)*0.45;c.fillStyle='#e8f4ff';
      c.fillRect(Math.round(x+29+Math.sin(p*6+s)*3),Math.round(y+12-p*26),3,3);
    }
  });
  c.globalAlpha=1;
  // Luces de boliche girando sobre la alfombra central
  const dots=['#ff3b69','#00e5ff','#ffe066','#38ef7d','#c084fc'];
  dots.forEach((col,i)=>{
    const a=t*0.7+i*Math.PI*2/dots.length;
    c.globalAlpha=0.16;c.fillStyle=col;
    c.beginPath();c.ellipse(960+Math.cos(a)*230,540+Math.sin(a*1.3)*120,46,18,0,0,7);c.fill();
  });
  c.globalAlpha=1;
  // Robot barrendero que patrulla el local con su luz que titila
  const lap=(t*0.045)%1,path=[[560,430],[1360,430],[1360,640],[560,640]];
  const seg=Math.floor(lap*4),f=lap*4-seg,[ax,ay]=path[seg],[bx2,by2]=path[(seg+1)%4];
  const rx=Math.round(ax+(bx2-ax)*f),ry=Math.round(ay+(by2-ay)*f);
  c.fillStyle='rgba(0,0,0,0.35)';c.beginPath();c.ellipse(rx,ry+9,15,5,0,0,7);c.fill();
  c.fillStyle='#22313b';c.fillRect(rx-13,ry-6,26,14);c.fillStyle='#8fa9b5';c.fillRect(rx-11,ry-8,22,6);
  c.fillStyle=Math.sin(t*8)>0?'#38ef7d':'#0d3b24';c.fillRect(rx-2,ry-7,4,3);
  c.fillStyle='#e11d2e';c.fillRect(rx+6,ry-4,3,3);c.fillStyle='#18181b';c.fillRect(rx+7,ry-3,1,1); // sello BC del fabricante del robot
  c.fillStyle='#ffe066';c.fillRect(rx-9,ry+1,3,2);c.fillRect(rx+6,ry+1,3,2);
  // Chispitas de limpieza detrás del robot
  for(let s=1;s<=3;s++){c.globalAlpha=0.5-s*0.13;c.fillStyle='#d6fbff';c.fillRect(rx-(bx2-ax?Math.sign(bx2-ax):0)*s*12-1,ry-(by2-ay?Math.sign(by2-ay):0)*s*12+2,2,2);}
  c.restore();
}

// ---------------------------------------------------------------------------
// Clientes del local (NPCs): caminan rutas fijas, juegan a los arcades y charlan.
// La posición sale del tiempo (sin estado), así siempre están en movimiento y no cuestan nada.
// ---------------------------------------------------------------------------
const NPC_WALKERS = [
  { kind: 'nugget',   speed: 70, path: [[240, 430], [660, 430], [660, 560], [240, 560]], lines: ['¡Que hambre!', 'Hoy salgo top 10'] },
  { kind: 'pizza',    speed: 60, path: [[1260, 450], [1700, 450], [1700, 590], [1260, 590]], lines: ['¿Y si pruebo el desierto?', '¡Mozzarella!'] },
  { kind: 'papas',    speed: 85, path: [[720, 960], [1200, 960]], lines: ['Me faltan puntos...', '¡Vamos turno!'] },
  { kind: 'empanada', speed: 55, path: [[1240, 360], [1240, 660], [1180, 660], [1180, 360]], lines: ['¿Viste el jefe nuevo?'] },
];
const NPC_PLAYERS = [
  { kind: 'choripan', x: 676, y: 186, lines: ['¡Record!', 'Una ficha mas...'] },
  { kind: 'nugget',   x: 1216, y: 186, lines: ['¡Dale, dale!'] },
  { kind: 'pizza',    x: 776, y: 944, lines: ['¡Game over! :('] },
];
const NPC_CHAT = [
  { kind: 'papas', x: 250, y: 660, other: { kind: 'empanada', x: 300, y: 660 }, lines: ['¿Jugaste en la lava?', '¡Todavia no!', 'Dicen que hay un Coloso...'] },
];

function walkerPosition(npc, t) {
  const pts = npc.path, closed = pts.length > 2;
  const segs = closed ? pts.map((p, i) => [p, pts[(i + 1) % pts.length]]) : [[pts[0], pts[1]], [pts[1], pts[0]]];
  const lengths = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const total = lengths.reduce((s, l) => s + l, 0);
  let d = (t * npc.speed) % total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= lengths[i]) { const [a, b] = segs[i], k = d / lengths[i]; return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k }; }
    d -= lengths[i];
  }
  return { x: pts[0][0], y: pts[0][1] };
}

function speechBubble(c, x, y, line) {
  c.font = "8px 'Press Start 2P', monospace";
  const w = Math.ceil(c.measureText(line).width) + 14;
  c.fillStyle = '#071116'; c.fillRect(Math.round(x - w / 2) - 2, y - 22, w + 4, 22);
  c.fillStyle = '#fff7e0'; c.fillRect(Math.round(x - w / 2), y - 20, w, 18);
  c.fillRect(Math.round(x) - 3, y - 2, 6, 4);
  c.fillStyle = '#1e293b'; c.textAlign = 'center'; c.fillText(line, Math.round(x), y - 7);
}

// Cada NPC habla de vez en cuando (unos segundos cada tanto, desfasados entre sí)
function talking(t, seed, lines) {
  const cycle = 9, phase = (t + seed * 3.7) % cycle;
  return phase < 2.6 ? lines[Math.floor((t + seed * 3.7) / cycle) % lines.length] : null;
}

function npcBody(c, kind, x, y, t, moving) {
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x, y + 22, 18, 6, 0, 0, 7); c.fill();
  drawFood(c, kind, x, y, 0.62, moving ? t : 0);
}

export function lobbyNpcLayers(c, t) {
  const layers = [];
  NPC_WALKERS.forEach((npc, i) => {
    const p = walkerPosition(npc, t);
    layers.push({ y: p.y + 24, draw: () => {
      npcBody(c, npc.kind, p.x, p.y, t + i, true);
      const line = talking(t, i, npc.lines); if (line) speechBubble(c, p.x, p.y - 26, line);
    } });
  });
  NPC_PLAYERS.forEach((npc, i) => {
    layers.push({ y: npc.y + 24, draw: () => {
      // Se balancea frente a la máquina como si apretara botones
      const jiggle = Math.round(Math.sin(t * 14 + i) * 1.5);
      npcBody(c, npc.kind, npc.x + jiggle, npc.y, 0, false);
      const line = talking(t, i + 5, npc.lines); if (line) speechBubble(c, npc.x, npc.y - 26, line);
    } });
  });
  NPC_CHAT.forEach((npc, i) => {
    layers.push({ y: npc.y + 24, draw: () => {
      const nod = Math.sin(t * 3) > 0.6 ? -2 : 0;
      npcBody(c, npc.kind, npc.x, npc.y + nod, 0, false);
      npcBody(c, npc.other.kind, npc.other.x, npc.other.y - nod, 0, false);
      const step = Math.floor(t / 3) % npc.lines.length;
      if ((t % 3) < 2.3) speechBubble(c, step % 2 ? npc.other.x : npc.x, npc.y - 26, npc.lines[step]);
    } });
  });
  return layers;
}
