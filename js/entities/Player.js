import { clamp } from "../core/collision.js";
import { drawFood, drawWeapon } from "../core/art.js";
import {drawAccessory} from '../core/presentation.js';

export class Player {
  constructor({ name, skin, weapon, x, y }) {
    this.name = name || "Pancho";
    this.skin = skin;
    this.weapon = weapon;
    this.weaponEvolution = null;
    this.shotsFired = 0;
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.maxHp = skin.maxHp;
    this.hp = this.maxHp;
    this.speed = skin.speed;
    this.damageMultiplier = skin.damageMultiplier;
    this.defense = skin.defense;
    this.extraProjectiles = skin.extraProjectiles || 0;
    this.fireRateMultiplier = 1;
    this.pierceBonus = 0;
    this.abilities = {};
    this.buffs = {damageMultiplier:1,speedMultiplier:1,fireRateMultiplier:1,damageTime:0,speedTime:0,fireTime:0,slowTime:0};
    this.fireCooldown = 0;
    this.invulnerable = 0;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 24;
    this.dashCooldown = 0;
    this.dashTime = 0;
    this.dashSequence = 0;
    this.facing = { x: 1, y: 0 };
    this.dashDirection = { x: 1, y: 0 };
    this.aimAngle = 0;
    this.regen = 0;
    this.projectileScale = 1;
    this.itemDuration = 1;
    this.explosionDamage = 0;
    this.mustardLevel = 0;
    this.auraLevel = 0;
    this.rainTimer = 1;
    this.hitFlash = 0;
    this.muzzleTime=0;this.walkTime=0;
    this.comboFeverTime=0;
  }

  update(delta, input, bounds) {
    for(const [timer, multiplier] of [['damageTime','damageMultiplier'],['speedTime','speedMultiplier'],['fireTime','fireRateMultiplier']]){
      this.buffs[timer]=Math.max(0,this.buffs[timer]-delta);
      if(this.buffs[timer]===0)this.buffs[multiplier]=1;
    }
    this.buffs.slowTime=Math.max(0,this.buffs.slowTime-delta);
    const axis = input.getAxis();
    this.walkTime+=(axis.x||axis.y)?delta:0;
    this.muzzleTime=Math.max(0,this.muzzleTime-delta);
    this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    this.dashTime = Math.max(0, this.dashTime - delta);
    this.hitFlash = Math.max(0, this.hitFlash - delta);
    this.comboFeverTime = Math.max(0, this.comboFeverTime - delta);
    if (axis.x || axis.y) this.facing = axis;
    if (input.consume?.(' ') && this.dashCooldown <= 0) {
      this.dashDirection = { ...this.facing };
      this.dashSequence += 1;
      this.dashTime = .19; this.dashCooldown = 2.8 * (this.dashCooldownMultiplier || 1); this.invulnerable = Math.max(this.invulnerable, .26);
    }
    const speed=this.speed*this.buffs.speedMultiplier*(this.buffs.slowTime>0?.58:1);
    const movement = this.dashTime > 0 ? this.dashDirection : axis;
    const actualSpeed = this.dashTime > 0 ? 760 : speed;
    this.x = clamp(this.x + movement.x * actualSpeed * delta, 60, bounds.width - 60);
    this.y = clamp(this.y + movement.y * actualSpeed * delta, 120, bounds.height - 38);
    if (this.hp > 0) this.hp = Math.min(this.maxHp, this.hp + this.regen * delta);
    this.fireCooldown = Math.max(0, this.fireCooldown - delta);
    this.invulnerable = Math.max(0, this.invulnerable - delta);
  }

  takeDamage(amount) {
    if (this.invulnerable > 0) return false;
    this.hp = Math.max(0, this.hp - amount / this.defense);
    this.invulnerable = 0.75;
    this.hitFlash = .2;
    return true;
  }

  gainXp(amount) {
    this.xp += amount;
    let levels = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = Math.round(this.xpToNext * 1.35 + 10);
      levels += 1;
    }
    return levels;
  }

  draw(ctx) {
    ctx.save();
    if (this.invulnerable > 0) ctx.globalAlpha = 0.55 + Math.sin(performance.now() / 45) * 0.25;
    if (this.inLavaMap || this.hasLavaAura) {
      // Luz cálida ambiental reflejada desde el magma y aura de brasas bajo Pancho
      const t = performance.now() / 1000;
      const pulseR = 42 + Math.sin(t * 4.2) * 4;
      const auraGrad = ctx.createRadialGradient(this.x, this.y + 14, 4, this.x, this.y + 14, pulseR);
      auraGrad.addColorStop(0, 'rgba(255, 90, 10, 0.52)');
      auraGrad.addColorStop(0.5, 'rgba(255, 45, 0, 0.26)');
      auraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = auraGrad;
      ctx.beginPath(); ctx.ellipse(this.x, this.y + 16, pulseR, 18, 0, 0, Math.PI * 2); ctx.fill();
      if (this.hasLavaAura) {
        for (let i = 0; i < 4; i++) {
          const ex = this.x + Math.sin(t * 5 + i * 2) * 18;
          const ey = this.y + 16 - ((t * 28 + i * 14) % 26);
          ctx.fillStyle = (i % 2 === 0) ? '#ff4400' : '#ffcc00';
          ctx.fillRect(ex, ey, 2, 2);
        }
      }
    }
    ctx.strokeStyle = (this.inLavaMap || this.hasLavaAura) ? '#ff6611cc' : '#95d6a888';
    ctx.lineWidth = 2;
    ctx.beginPath();ctx.ellipse(this.x,this.y+18,27,10,0,0,7);ctx.stroke();
    const bob = Math.round(Math.sin(this.walkTime * 7 + this.x * .05) * 1.5);
    ctx.save();
    drawAccessory(ctx, this.accessory, this.x, this.y + bob, 0.85, 'back');
    drawFood(ctx, this.skin.id, this.x, this.y, 0.85, this.walkTime);
    drawAccessory(ctx, this.accessory, this.x, this.y + bob, 0.85, 'front');
    ctx.restore();
    if (this.inLavaMap) {
      // Reflejo cálido naranja/rojizo ascendente proyectado sobre el cuerpo de Pancho
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rimGrad = ctx.createRadialGradient(this.x, this.y + 10, 2, this.x, this.y + 4, 26);
      rimGrad.addColorStop(0, 'rgba(255, 110, 20, 0.28)');
      rimGrad.addColorStop(0.6, 'rgba(255, 40, 0, 0.14)');
      rimGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rimGrad;
      ctx.beginPath(); ctx.arc(this.x, this.y + 4, 24, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    drawWeapon(ctx, this.weapon.id, this.x + Math.cos(this.aimAngle) * 22, this.y + Math.sin(this.aimAngle) * 15, .48, this.aimAngle + Math.PI / 2);
    if(this.muzzleTime>0&&(this.weapon.id==='fork'||this.weapon.id==='skewer')){
      ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.aimAngle);ctx.globalAlpha=Math.min(1,this.muzzleTime/.06);
      const slash=ctx.createRadialGradient(0,0,8,0,0,52);slash.addColorStop(0,'#ffffff00');slash.addColorStop(.55,this.weapon.color+'dd');slash.addColorStop(1,'#ffffff00');
      ctx.beginPath();ctx.arc(0,0,43,-.72,.72);ctx.strokeStyle=this.weapon.color+'44';ctx.lineWidth=17;ctx.stroke();ctx.strokeStyle=slash;ctx.lineWidth=9;ctx.stroke();ctx.restore();
    }
    if(this.muzzleTime>0){
      ctx.translate(this.x+Math.cos(this.aimAngle)*30,this.y+Math.sin(this.aimAngle)*24);ctx.rotate(this.aimAngle);
      const flash=Math.max(.3,this.muzzleTime/.09);
      ctx.scale(flash,flash);ctx.fillStyle=this.weapon.color||'#f6c867';
      ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(5,-9);ctx.lineTo(8,-3);ctx.lineTo(23,0);ctx.lineTo(8,3);ctx.lineTo(5,9);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fffbe8';ctx.fillRect(0,-2,12,4);
    }
    // Mini barra de salud pixel art arriba del protagonista
    const hpRatio = Math.max(0, Math.min(1, this.hp / (this.maxHp || 1)));
    const barW = 34, barH = 4;
    const barX = Math.round(this.x - barW / 2);
    const barY = Math.round(this.y - 34);
    ctx.fillStyle = '#060d10';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#172225';
    ctx.fillRect(barX, barY, barW, barH);
    const hpColor = hpRatio > 0.5 ? '#35d9aa' : hpRatio > 0.25 ? '#ffe066' : '#ef414f';
    ctx.fillStyle = hpColor;
    const fillW = Math.round(barW * hpRatio);
    if (fillW > 0) {
      ctx.fillRect(barX, barY, fillW, barH);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(barX, barY, fillW, 1);
    }
    ctx.restore();
  }
}
