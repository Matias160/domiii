export function circlesOverlap(a, b) {
  return distance(a, b) <= a.radius + b.radius;
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Sweep the complete segment so fast shots cannot skip small targets between frames.
export function sweptOverlap(shot, target) {
  const x = shot.previousX ?? shot.x, y = shot.previousY ?? shot.y;
  const dx = shot.x - x, dy = shot.y - y, lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? clamp(((target.x-x)*dx+(target.y-y)*dy)/lengthSquared,0,1) : 0;
  return Math.hypot(target.x-(x+t*dx),target.y-(y+t*dy)) <= shot.radius + target.radius;
}
