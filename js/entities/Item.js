import { rarities } from '../data/items.js';

export class Item {
  constructor({ type, x, y, random = Math.random }) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.life = 20;
    this.maxLife = 20;
    this.age = 0;
    this.phase = random() * Math.PI * 2;
    this.particleTimer = 0;
    const roll = random() * rarities.reduce((sum, rarity) => sum + rarity.weight, 0);
    let total = 0;
    this.rarity = rarities.find(rarity => (total += rarity.weight) >= roll) || rarities[0];
  }

  update(delta) {
    this.life -= delta;
    this.age += delta;
  }

  draw(ctx, time) {
    const spawnScale = Math.min(1, this.age / 0.25);
    const pulse = 0.85 + Math.sin(time * 5 + this.phase) * 0.15;
    const bob = Math.sin(time * 4.2 + this.phase) * 3.5;
    const rCol = this.rarity.color || '#38ef7d';
    const rGlow = this.rarity.glow || 'rgba(56, 239, 125, 0.35)';
    const rAccent = this.rarity.accent || '#ffffff';
    const isHighTier = ['Epico', 'Legendario', 'Mitico'].includes(this.rarity.id);
    const isTopTier = ['Legendario', 'Mitico'].includes(this.rarity.id);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(spawnScale, spawnScale);
    if (this.life < 4) {
      ctx.globalAlpha = 0.45 + Math.sin(time * 16) * 0.45;
    }

    // 1. Pilar / Haz de luz vertical para rarezas altas (Épico, Legendario, Mítico)
    if (isHighTier) {
      const pillarW = isTopTier ? 26 : 18;
      const pillarH = isTopTier ? 68 : 46;
      const beam = ctx.createLinearGradient(0, 12, 0, -pillarH);
      beam.addColorStop(0, rGlow);
      beam.addColorStop(0.5, rCol + '33');
      beam.addColorStop(1, 'transparent');
      ctx.fillStyle = beam;
      ctx.fillRect(-pillarW / 2, -pillarH, pillarW, pillarH + 12);
    }

    // 2. Aura radial pulsante en el suelo según rareza
    const auraRadius = (isTopTier ? 34 : isHighTier ? 28 : 23) * pulse;
    const groundAura = ctx.createRadialGradient(0, 10, 2, 0, 10, auraRadius);
    groundAura.addColorStop(0, rCol + 'aa');
    groundAura.addColorStop(0.45, rGlow);
    groundAura.addColorStop(1, 'transparent');
    ctx.fillStyle = groundAura;
    ctx.beginPath();
    ctx.ellipse(0, 12, auraRadius, auraRadius * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    // Anillo rúnico / energético giratorio en la base
    ctx.save();
    ctx.translate(0, 12);
    ctx.scale(1, 0.5);
    ctx.rotate(time * (isTopTier ? 2.4 : 1.5) + this.phase);
    ctx.strokeStyle = rCol;
    ctx.lineWidth = isTopTier ? 2.2 : 1.6;
    ctx.setLineDash(isTopTier ? [6, 4] : [4, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, 20 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Cuerpo del ítem flotante con su aura exterior
    ctx.save();
    ctx.translate(0, bob);

    // Resplandor detrás del icono
    const backGlow = ctx.createRadialGradient(0, 0, 3, 0, 0, 22);
    backGlow.addColorStop(0, rAccent);
    backGlow.addColorStop(0.45, rCol + '88');
    backGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = backGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Marco octogonal/circular de rareza
    ctx.fillStyle = '#0b1920';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rCol;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Dibujo pixel-art del ingrediente
    ctx.fillStyle = this.type.color;
    if (this.type.id === 'mayo') {
      ctx.beginPath(); ctx.arc(0, -2, 7, Math.PI, 0); ctx.lineTo(7, 5); ctx.quadraticCurveTo(0, 12, -7, 5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-3, -4, 3, 6);
    } else if (this.type.id === 'mustard' || this.type.id === 'ketchup') {
      ctx.fillRect(-6, -6, 12, 13);
      ctx.fillRect(-3, -10, 6, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-5, -1, 10, 4);
    } else if (this.type.id === 'hotSauce') {
      ctx.fillRect(-6, -5, 12, 12);
      ctx.beginPath(); ctx.moveTo(-6, -5); ctx.lineTo(0, -11); ctx.lineTo(6, -5); ctx.fill();
      ctx.fillStyle = '#22c55e'; ctx.fillRect(-2, -11, 4, 3);
      ctx.fillStyle = '#fef08a'; ctx.fillRect(-3, 0, 6, 3);
    } else {
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffdba6';
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(2, -1); ctx.lineTo(7, 0); ctx.lineTo(2, 2); ctx.lineTo(0, 7); ctx.lineTo(-2, 2); ctx.lineTo(-7, 0); ctx.lineTo(-2, -1); ctx.closePath(); ctx.fill();
    }

    // 4. Partículas orbitales / destellos propios alrededor del ítem
    const sparkCount = isTopTier ? 4 : isHighTier ? 3 : 2;
    for (let i = 0; i < sparkCount; i++) {
      const angle = time * 3.2 + this.phase + (i * Math.PI * 2 / sparkCount);
      const orbitR = 16 + Math.sin(time * 6 + i) * 3;
      const sx = Math.cos(angle) * orbitR;
      const sy = Math.sin(angle) * orbitR * 0.75;
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : rCol;
      ctx.fillRect(Math.round(sx) - 1.5, Math.round(sy) - 1.5, 3, 3);
    }
    ctx.restore();

    // 5. Etiqueta pixel-art de rareza con sombra nítida
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#050b10';
    ctx.fillText(this.rarity.id.toUpperCase(), 1, 27);
    ctx.fillStyle = rCol;
    ctx.fillText(this.rarity.id.toUpperCase(), 0, 26);

    ctx.restore();
  }
}
