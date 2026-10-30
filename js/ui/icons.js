export function icon(name,className=''){
  const library=globalThis.lucide,shape=library?.icons?.[name];
  return shape?library.createElement(shape,{class:`ui-icon ${className}`,'aria-hidden':'true','stroke-width':1.8}).outerHTML:'';
}
export function refreshIcons(){globalThis.lucide?.createIcons({attrs:{'aria-hidden':'true','stroke-width':1.8,class:'ui-icon'}});}
export const abilityIcons={mustardRain:'CloudRain',deathBlast:'Bomb',regen:'HeartPulse',armor:'Shield',bigShot:'Expand',longSauce:'Droplets',grease:'Waves',extraShot:'Copy',rapidFire:'Zap',hotSauce:'Flame',piercing:'Utensils',sneakers:'Footprints',extraPortion:'Heart'};
