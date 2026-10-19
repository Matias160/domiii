export function drawFloatingText(ctx, text, reducedMotion = false) {
  text.maxLife ??= text.life;
  text.originY ??= text.y;
  text.tilt ??= (Math.random() - .5) * Math.PI / 6;
  const progress = Math.max(0, Math.min(1, 1 - text.life / text.maxLife));
  const kind = text.kind || (/COMBO|RACHA|FIEBRE/.test(text.text) ? 'combo' : /[✦]/.test(text.text) ? 'crit' : /^\+/.test(text.text) ? 'gain' : 'normal');
  const scale = (kind === 'crit' ? 1.8 : text.scale || 1) * (reducedMotion ? 1 : 1.5 - progress * .65);
  const color = kind === 'crit' ? '#ff633e' : kind === 'combo' ? '#ffe066' : kind === 'gain' || kind === 'heal' || kind === 'xp' ? '#00ffcc' : text.color || '#ffffff';
  const shake = kind === 'crit' && !reducedMotion && progress < .4 ? 2 : 0;
  ctx.save();
  ctx.translate(text.x + Math.sin(text.tilt) * progress * 35 + (Math.random() * 2 - 1) * shake, text.y - (reducedMotion ? 0 : Math.sin(progress * Math.PI) * 16));
  if (!reducedMotion) ctx.rotate(text.tilt * (1 - progress));
  ctx.globalAlpha = Math.min(1, (1 - progress) * 2);
  ctx.font = `bold ${Math.round(12 * scale)}px 'Press Start 2P', Impact, monospace`;
  ctx.textAlign = 'center';ctx.lineJoin = 'round';ctx.lineWidth = 3;ctx.strokeStyle = '#000000';ctx.fillStyle = color;
  ctx.strokeText(text.text, 0, 0);
  if (kind === 'combo') { ctx.shadowColor = '#ffe066';ctx.shadowBlur = 8; }
  ctx.fillText(text.text, 0, 0);ctx.restore();
}
