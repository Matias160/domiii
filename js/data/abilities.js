export const rarities = {
  legendary: { id: 'legendary', name: 'Legendaria', color: '#ffbe3b', border: '#ffe885', weight: 4 },
  epic:      { id: 'epic',      name: 'Épica',      color: '#c084fc', border: '#e9d5ff', weight: 3 },
  rare:      { id: 'rare',      name: 'Rara',       color: '#38bdf8', border: '#bae6fd', weight: 2 },
  common:    { id: 'common',    name: 'Común',      color: '#4ade80', border: '#bbf7d0', weight: 1 },
};

export const abilities = [
  { id:'extraShot',name:'Pedido doble',category:'Ataque',rarity:'legendary',description:'Dispara +2 proyectiles adicionales en abanico.',maxStacks:3,apply:player=>{player.extraProjectiles+=2;} },
  { id:'mustardRain',name:'Lluvia de mostaza',category:'Especial',rarity:'legendary',description:'Cada 8 segundos caen 7 gotas de mostaza (+2 por nivel): explotan en área, frenan y dejan charcos que queman.',maxStacks:3,apply:player=>{player.mustardLevel+=1;} },
  { id:'hotSauce',name:'Salsa picante',category:'Ataque',rarity:'epic',description:'Multiplica el daño de proyectiles un +50%.',maxStacks:5,apply:player=>{player.damageMultiplier*=1.5;} },
  { id:'deathBlast',name:'Salchicha explosiva',category:'Especial',rarity:'epic',description:'Los enemigos derrotados estallan: 40 de daño en área.',maxStacks:3,apply:player=>{player.explosionDamage+=40;} },
  { id:'armor',name:'Pan más duro',category:'Defensa',rarity:'epic',description:'Reduce todo el daño recibido un 35%.',maxStacks:3,apply:player=>{player.defense*=1.35;} },
  { id:'bigShot',name:'Combo agrandado',category:'Ataque',rarity:'rare',description:'Proyectiles 50% más gigantescos y +30% de daño.',maxStacks:3,apply:player=>{player.projectileScale*=1.5;player.damageMultiplier*=1.3;} },
  { id:'rapidFire',name:'Manos veloces',category:'Ataque',rarity:'rare',description:'Aumenta tu cadencia de disparo un 35%.',maxStacks:4,apply:player=>{player.fireRateMultiplier*=0.65;} },
  { id:'piercing',name:'Tenedor afilado',category:'Ataque',rarity:'rare',description:'Tus proyectiles perforan a +2 enemigos adicionales.',maxStacks:2,apply:player=>{player.pierceBonus+=2;} },
  { id:'grease',name:'Grasa resbalosa',category:'Control',rarity:'rare',description:'Aura que frena un 25% (hasta 44%) a los enemigos cercanos.',maxStacks:2,apply:player=>{player.auraLevel+=1;} },
  { id:'sneakers',name:'Zapatillas express',category:'Movimiento',rarity:'common',description:'Velocidad de movimiento +30%.',maxStacks:4,apply:player=>{player.speed*=1.30;} },
  { id:'extraPortion',name:'Porción extra',category:'Defensa',rarity:'common',description:'+50 de vida máxima y te cura 60 de vida al instante.',maxStacks:4,apply:player=>{player.maxHp+=50;player.hp=Math.min(player.maxHp,player.hp+60);} },
  { id:'longSauce',name:'Aderezo doble',category:'Especial',rarity:'common',description:'Los potenciadores duran el doble (+100%).',maxStacks:2,apply:player=>{player.itemDuration*=2.0;} },
];

export function getAbilityChoices(player, random = Math.random) {
  const available = abilities.filter(ability =>
    (player.abilities[ability.id] || 0) < ability.maxStacks,
  );
  for (let index = available.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [available[index], available[other]] = [available[other], available[index]];
  }
  return available.slice(0, 3);
}

export function applyAbility(player, ability) {
  if (!abilities.includes(ability) || (player.abilities[ability.id] || 0) >= ability.maxStacks) return false;
  ability.apply(player);
  player.abilities[ability.id] = (player.abilities[ability.id] || 0) + 1;
  return true;
}
