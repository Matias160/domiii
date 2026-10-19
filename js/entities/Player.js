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
      this.dashTime = .19; this.dashCooldown = 2.8; this.invulnerable = Math.max(this.invulnerable, .26);
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
    ctx.strokeStyle = '#95d6a888';
    ctx.lineWidth = 2;
    ctx.beginPath();ctx.ellipse(this.x,this.y+18,27,10,0,0,7);ctx.stroke();
    drawFood(ctx, this.skin.id, this.x, this.y, 0.85, this.walkTime);
    drawWeapon(ctx, this.weapon.id, this.x + Math.cos(this.aimAngle) * 22, this.y + Math.sin(this.aimAngle) * 15, .48, this.aimAngle + Math.PI / 2);
    drawAccessory(ctx,this.accessory,this.x,this.y);
    if(this.muzzleTime>0&&(this.weapon.id==='fork'||this.weapon.id==='skewer')){
      ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.aimAngle);ctx.globalAlpha=Math.min(1,this.muzzleTime/.06);
      const slash=ctx.createRadialGradient(0,0,8,0,0,52);slash.addColorStop(0,'#ffffff00');slash.addColorStop(.55,this.weapon.color+'dd');slash.addColorStop(1,'#ffffff00');
      ctx.strokeStyle=slash;ctx.shadowColor=this.weapon.color;ctx.shadowBlur=12;ctx.lineWidth=9;ctx.beginPath();ctx.arc(0,0,43,-.72,.72);ctx.stroke();ctx.restore();
    }
    if(this.muzzleTime>0){
      ctx.translate(this.x+Math.cos(this.aimAngle)*30,this.y+Math.sin(this.aimAngle)*24);ctx.rotate(this.aimAngle);
      const flash=Math.max(.3,this.muzzleTime/.09);
      ctx.scale(flash,flash);ctx.fillStyle=this.weapon.color||'#f6c867';
      ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(5,-9);ctx.lineTo(8,-3);ctx.lineTo(23,0);ctx.lineTo(8,3);ctx.lineTo(5,9);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fffbe8';ctx.fillRect(0,-2,12,4);
    }
    ctx.restore();
  }
}
