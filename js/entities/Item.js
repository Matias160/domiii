import { rarities } from '../data/items.js';

export class Item {
  constructor({ type, x, y, random = Math.random }) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = 13;
    this.life = 18;
    this.phase = random() * Math.PI * 2;
    const roll = random() * rarities.reduce((sum, rarity) => sum + rarity.weight, 0);
    let total = 0;
    this.rarity = rarities.find(rarity => (total += rarity.weight) >= roll) || rarities[0];
  }

  update(delta) { this.life -= delta; }

  draw(ctx, time) {
    const bob = Math.sin(time * 4 + this.phase) * 3;
    ctx.save();ctx.translate(this.x,this.y + bob);
    ctx.globalAlpha = this.life < 4 ? .45 + Math.sin(time * 15) * .4 : 1;
    ctx.fillStyle='#071b2466';ctx.beginPath();ctx.ellipse(0,15,15,5,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=this.rarity.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#10272b';ctx.fillRect(-10,-11,20,22);ctx.fillStyle=this.type.color;
    if(this.type.id==='mayo') {ctx.beginPath();ctx.arc(0,-2,7,Math.PI,0);ctx.lineTo(7,5);ctx.quadraticCurveTo(0,13,-7,5);ctx.closePath();ctx.fill();}
    else if(this.type.id==='mustard'||this.type.id==='ketchup') {ctx.fillRect(-6,-7,12,14);ctx.fillRect(-3,-11,6,5);ctx.fillRect(-8,-1,16,4);}
    else if(this.type.id==='hotSauce') {ctx.fillRect(-6,-6,12,12);ctx.beginPath();ctx.moveTo(-6,-6);ctx.lineTo(0,-12);ctx.lineTo(6,-6);ctx.fill();ctx.fillRect(-2,-11,4,3);}
    else {ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffdba6';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(2,-1);ctx.lineTo(7,0);ctx.lineTo(2,2);ctx.lineTo(0,7);ctx.lineTo(-2,2);ctx.lineTo(-7,0);ctx.lineTo(-2,-1);ctx.closePath();ctx.fill();}
    ctx.globalAlpha=1;ctx.textAlign='center';ctx.font='bold 8px monospace';ctx.fillStyle=this.rarity.color;ctx.fillText(this.rarity.id.toUpperCase(),0,28);ctx.restore();
  }
}
