import {drawFood} from '../core/art.js';
import {drawPet} from '../core/presentation.js';

function box(c,x,y,w,h,color,shadow=true){
  if(shadow){
    c.fillStyle='rgba(4,10,14,0.45)';c.fillRect(x+4,y+5,w+4,h+3);
  }
  c.fillStyle='#0e1b20';c.fillRect(x-2,y-2,w+4,h+4);
  c.fillStyle=color;c.fillRect(x,y,w,h);
  c.fillStyle='rgba(255,255,255,0.22)';c.fillRect(x+2,y+2,w-4,2);
  c.fillStyle='rgba(0,0,0,0.3)';c.fillRect(x+2,y+h-3,w-4,2);
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
  drawArrow(620,470,'left','ARMARIO');
  drawArrow(1300,470,'right','MASCOTAS');
  drawArrow(960,370,'up','A LA COCINA');
  drawArrow(620,670,'left','DON DOMI');
  drawArrow(1300,670,'right','TIENDA');

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
  box(c,60,36,260,68,'#162a30');
  text(c,'COMBO DE LA CASA',190,62,11,'#ffe078');
  text(c,'SOBREVIVIR AL TURNO',190,82,8,'#8ad8b8');

  box(c,370,36,250,68,'#1c2638');
  text(c,'01 / VESTUARIO',495,62,11,'#ff7597');
  text(c,'NUEVAS SKINS EN CARTA',495,82,8,'#ffb0c4');

  box(c,1290,36,260,68,'#163226');
  text(c,'02 / GUARDERIA',1420,62,11,'#56e39f');
  text(c,'MASCOTAS Y ALIADOS',1420,82,8,'#9cf5ca');

  box(c,1600,36,260,68,'#362a14');
  text(c,'03 / BAZAR ARCADE',1730,62,11,'#ffd000');
  text(c,'CANJEA TUS PUNTOS',1730,82,8,'#ffea88');

  // Decorative Arcade Cabinets along back wall
  drawArcadeCabinet(c,660,102,'PAC', '#2b4d8a','#38d9ff',0);
  drawArcadeCabinet(c,700,102,'STR', '#b83b5e','#ff7597',1);
  drawArcadeCabinet(c,1200,102,'BUR', '#8a6b2b','#ffd000',2);
  drawArcadeCabinet(c,1240,102,'CAR', '#2b8a4f','#00ffaa',3);

  // Decorative Arcade Cabinets in bottom lounge
  drawArcadeCabinet(c,760,860,'RET', '#5c2b8a','#c084fc',1);
  drawArcadeCabinet(c,800,860,'TUR', '#8a2b4b','#ff3b69',2);
  drawArcadeCabinet(c,1100,860,'DOM', '#2b778a','#38bdf8',3);
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

  // Portal motes at (960, 260)
  for(let i=0;i<18;i++){
    const phase=(t*0.2+i/18)%1;
    const x=960+Math.sin(i*2.1+t*0.9)*(14+phase*48);
    const y=290-phase*150;
    c.globalAlpha=Math.sin(phase*Math.PI)*0.85;
    c.fillStyle=i%3===0?'#00ffcc':i%3===1?'#ffe066':'#ff3b69';
    c.shadowColor=c.fillStyle;c.shadowBlur=8;
    const s=2+(i%3)*1.5;
    c.fillRect(Math.round(x),Math.round(y),s,s);
  }
  c.globalAlpha=1;c.shadowBlur=0;
  c.restore();
}

export function drawStation(c,s,t,active){
  const {x,y,id,color,label,action='INTERACTUAR'}=s;
  c.save();c.translate(x,y);
  
  // Floor cast shadow
  c.fillStyle='rgba(0,0,0,0.45)';
  c.beginPath();
  c.ellipse(0,44,id==='portal'?85:75,id==='portal'?22:18,0,0,7);
  c.fill();

  // Active floor glowing ring
  if(active){
    c.save();
    c.fillStyle=color+'26';
    c.beginPath();c.ellipse(0,42,88,26,0,0,7);c.fill();
    c.strokeStyle=color;c.lineWidth=3;
    c.beginPath();c.ellipse(0,42,88+Math.sin(t*4)*3,26+Math.sin(t*4)*1.5,0,0,7);c.stroke();
    // Inward pointing floor chevron pulses
    const pulse=Math.sin(t*5)*6;
    c.fillStyle=color;
    for(const side of [-1,1]){
      c.beginPath();
      c.moveTo(side*(70+pulse),36);c.lineTo(side*(60+pulse),42);c.lineTo(side*(70+pulse),48);
      c.fill();
    }
    c.restore();
  }

  // --- 1. STATION BODY ---
  if(id==='portal'){
    // Massive portal gate
    box(c,-65,-105,130,140,'#1a2a30');
    box(c,-54,-95,108,124,'#09161a');
    
    // Portal ring
    c.save();
    c.shadowColor='#ffe066';c.shadowBlur=18+Math.sin(t*3)*8;
    c.strokeStyle='#ffe066';c.lineWidth=5;
    c.beginPath();c.ellipse(0,-32,34+Math.sin(t*2.5)*3,48,0,0,7);c.stroke();
    
    c.strokeStyle='#00e5ff';c.lineWidth=3;
    c.beginPath();c.ellipse(0,-32,24,38,Math.sin(t)*0.15,0,7);c.stroke();
    c.restore();

    // Portal rift core
    const riftGrad=c.createRadialGradient(0,-32,4,0,-32,32);
    riftGrad.addColorStop(0,'#ffffff');
    riftGrad.addColorStop(0.35,'#ffe066');
    riftGrad.addColorStop(0.7,'#00e5ff');
    riftGrad.addColorStop(1,'#04121a');
    c.fillStyle=riftGrad;
    c.beginPath();c.ellipse(0,-32,20,34,0,0,7);c.fill();

    // Orbiting portal particles
    for(let i=0;i<8;i++){
      const ang=t*1.2+i*0.78;
      c.fillStyle=i%2?'#ffffff':'#ffe066';
      c.fillRect(Math.sin(ang)*34-2,-32+Math.cos(ang)*46-2,4,4);
    }
    box(c,-75,32,150,14,'#b2ba99');
    c.fillStyle='#ff2a44';for(let i=0;i<7;i++)c.fillRect(-70+i*22,34,10,10); // Warning stripes
  }
  else if(id==='wardrobe'){
    box(c,-60,-82,120,118,'#b94b63');
    box(c,-50,-72,100,98,'#36222e');
    // Mirror with reflection
    c.fillStyle='#65c5db';c.fillRect(-40,-62,38,80);
    c.fillStyle='#a6efff';c.fillRect(-38,-60,10,76); // Shimmer
    c.fillStyle='#fff';c.fillRect(-22,-50,4,50);
    // Clothes hanger rack
    c.fillStyle='#d4aa7d';c.fillRect(8,-60,34,4);c.fillRect(23,-60,4,80);
    drawFood(c,'nugget',24,-30,0.55,t);
    drawFood(c,'pizza',24,5,0.55,t);
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
  else if(id==='npc'){
    // Don Domi Chef booth
    drawFood(c,'empanada',0,-18,1.1,t);
    // Chef hat
    c.fillStyle='#ffffff';
    c.fillRect(-22,-62,44,14);c.fillRect(-16,-72,32,14);c.fillRect(-8,-80,16,10);
    // Hot dog counter
    box(c,-68,8,136,28,'#aa5438');
    text(c,'DON DOMI',0,27,11,'#fff0a8');
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
    // Trophy
    c.fillStyle='#ffe066';
    c.fillRect(-14,-62,28,16);c.fillRect(-8,-46,16,12);c.fillRect(-16,-34,32,6);
    c.strokeStyle='#b38600';c.lineWidth=2;c.strokeRect(-14,-62,28,16);
    // Trophy ears
    c.strokeStyle='#ffe066';c.lineWidth=3;
    c.beginPath();c.arc(-14,-54,8,1.5,4.7);c.stroke();
    c.beginPath();c.arc(14,-54,8,4.7,1.5);c.stroke();
    // Marquee scrolling text
    box(c,-64,8,128,20,'#c73e6a');
    text(c,'HALL OF FAME',0,23,9,'#fff0a8');
  }

  // --- 2. EYE-CATCHING PIXEL ART MARQUEE SIGN ---
  const signFloat=Math.sin(t*2.4+s.x*0.01)*3;
  c.save();c.translate(0,signFloat);

  const signW=174,signH=42;
  const signX=-signW/2,signY=54;

  // Sign Drop shadow
  c.fillStyle='rgba(0,0,0,0.6)';
  c.fillRect(signX+5,signY+6,signW,signH);

  // Outer Casing (Dark steel with pixel border)
  c.fillStyle='#071116';c.fillRect(signX-3,signY-3,signW+6,signH+6);
  c.fillStyle='#182730';c.fillRect(signX,signY,signW,signH);

  // Neon Frame
  c.lineWidth=2;
  c.strokeStyle=active?color:'rgba(100,140,150,0.6)';
  if(active){
    c.shadowColor=color;c.shadowBlur=14+Math.sin(t*4)*6;
  }
  c.strokeRect(signX+2,signY+2,signW-4,signH-4);
  c.shadowBlur=0;

  // Sign Interior Face
  c.fillStyle=active?'#0b1d24':'#0c161c';
  c.fillRect(signX+4,signY+4,signW-8,signH-8);

  // Corner Pixel Accents
  c.fillStyle=color;
  c.fillRect(signX,signY,4,4);
  c.fillRect(signX+signW-4,signY,4,4);
  c.fillRect(signX,signY+signH-4,4,4);
  c.fillRect(signX+signW-4,signY+signH-4,4,4);

  // Blinking Marquee Bulbs along the top/bottom rim
  const bulbCycle=Math.floor(t*6)%3;
  for(let b=0;b<5;b++){
    c.fillStyle=(b%3===bulbCycle)?color:'#2a4049';
    c.fillRect(signX+12+b*34,signY+2,4,2);
    c.fillRect(signX+12+b*34,signY+signH-4,4,2);
  }

  // Station Label
  text(c,label,0,signY+24,10,active?'#ffffff':'#d5e4df');

  // Interactive Prompt Badge [E] when player is near or active
  if(active){
    const promptW=130,promptH=22;
    const promptX=-promptW/2,promptY=signY+signH+6;
    
    // Pixel key button
    c.fillStyle='rgba(0,0,0,0.7)';c.fillRect(promptX+3,promptY+4,promptW,promptH);
    box(c,promptX,promptY,promptW,promptH,'#ffe066');
    
    c.fillStyle='#ad8141';c.fillRect(promptX,promptY+promptH-3,promptW,3);
    
    // Key indicator [E]
    c.fillStyle='#18232b';c.fillRect(promptX+5,promptY+4,18,14);
    text(c,'E',promptX+14,promptY+15,9,'#ffe066');
    
    // Action text
    text(c,action.toUpperCase(),promptX+72,promptY+15,8,'#18232b');
  }

  c.restore();
  c.restore();
}
