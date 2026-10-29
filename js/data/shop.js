export const shopItems = [
  {id:'nugget',type:'skin',name:'Nugget',cost:450,icon:'N',description:'Rapido y escurridizo.'},
  {id:'papas',type:'skin',name:'Papas fritas',cost:650,icon:'P',description:'Un proyectil adicional.'},
  {id:'pizza',type:'skin',name:'Pizza',cost:850,icon:'Z',description:'Resistente y contundente.'},
  {id:'empanada',type:'skin',name:'Empanada',cost:950,icon:'E',description:'Defensa superior.'},
  {id:'choripan',type:'skin',name:'Choripan',cost:1600,icon:'C',description:'Especialista en jefes.'},
  {id:'domi',type:'skin',name:'Señor Domi',cost:0,domiExclusive:true,icon:'👨‍🍳',description:'Skin animada legendaria del fundador Señor Domi.'},
  {id:'snow',type:'map',name:'Nevado',cost:800,icon:'❄',description:'Ventiscas que congelan el tablero.'},
  {id:'desert',type:'map',name:'Desierto',cost:1000,icon:'✳',description:'Cactus rodantes que hacen daño.'},
  {id:'football',type:'map',name:'Cancha de futbol',cost:1200,icon:'⚽',description:'Pelotas peligrosas en juego.'},
  {id:'lava',type:'map',name:'Caldero de Lava',cost:0,domiExclusive:true,icon:'🌋',description:'Tierra volcánica y magma ardiente. El dominio del Coloso Final.'},
  {id:'beach',type:'map',name:'Playa Tropical',cost:0,icon:'🏖️',description:'Mar turquesa con olas animadas, arena dorada, cangrejitos y cocos.'},
  {id:'ketchup',type:'pet',name:'Mini ketchup',cost:700,icon:'K',description:'Dispara salsa picante y deja charcos pegajosos.'},
  {id:'drone',type:'pet',name:'Dron delivery',cost:850,icon:'D',description:'Imán de ingredientes y descarga rayos relámpago.'},
  {id:'taco',type:'pet',name:'Taco Guardián',cost:950,icon:'T',description:'Otorga escudo al jugador y embiste enemigos cercanos.'},
  {id:'soda',type:'pet',name:'Botellita Soda',cost:1100,icon:'S',description:'Burbujas curativas y salpicaduras de gas efervescente.'},
  {id:'parrilla',type:'pet',name:'Mini Parrilla',cost:0,domiExclusive:true,icon:'♨',description:'Exclusiva de Don Domi: lanza ascuas y genera ondas ardientes.'},
  // 8 Accesorios Estándar reales de accesorios.png
  {id:'bowtie',type:'accessory',name:'Moño Elegante Azul',cost:400,icon:'⋈',description:'+15% velocidad de proyectiles con distinción gourmet.'},
  {id:'shades',type:'accessory',name:'Gafas de Sol Retro',cost:450,icon:'◉',description:'+8% daño con estilo arcade.'},
  {id:'party_hat',type:'accessory',name:'Bonete de Fiesta',cost:500,icon:'🎉',description:'+6% velocidad y +6% daño festivo.'},
  {id:'cap',type:'accessory',name:'Gorra Urbana Celeste',cost:550,icon:'◆',description:'+10% velocidad de movimiento callejero.'},
  {id:'headphones',type:'accessory',name:'Auriculares Gamer',cost:600,icon:'♫',description:'+8% velocidad al ritmo del sintetizador.'},
  {id:'crown',type:'accessory',name:'Corona Real',cost:650,icon:'♛',description:'+15 vida máxima para el rey del local.'},
  {id:'top_hat',type:'accessory',name:'Galera Elegante',cost:700,icon:'🎩',description:'+12% probabilidad de golpe crítico.'},
  {id:'wizard_hat',type:'accessory',name:'Sombrero de Brujo',cost:750,icon:'★',description:'+12% cadencia de ataque arcana.'},
  // Accesorio Especial de Misión Inicial
  {id:'chef_hat',type:'accessory',name:'Gorro de Chef',cost:0,domiExclusive:true,icon:'👨‍🍳',description:'Exclusivo de Don Domi: +12% daño y maestría gastronómica.'},
  // Accesorios Legendarios otorgados por el Señor Domi
  {id:'leg_crown',type:'accessory',name:'Corona Imperial',cost:0,domiExclusive:true,icon:'👑',description:'Legendario Don Domi: +25 Vida y +15% Daño.'},
  {id:'leg_halo',type:'accessory',name:'Aureola Celestial',cost:0,domiExclusive:true,icon:'✧',description:'Legendario Don Domi: +15% Velocidad y Regeneración.'},
  {id:'leg_viking',type:'accessory',name:'Casco Vikingo',cost:0,domiExclusive:true,icon:'⚔',description:'Legendario Don Domi: +20 Vida y +20% Daño Total.'},
  {id:'leg_horns',type:'accessory',name:'Cuernos Demoníacos',cost:0,domiExclusive:true,icon:'😈',description:'Legendario Don Domi: +28% Daño y +8% Velocidad.'},
  {id:'leg_visor',type:'accessory',name:'Visor Cibernético',cost:0,domiExclusive:true,icon:'⌖',description:'Legendario Don Domi: +20% Crítico y Súper Imán.'},
  {id:'leg_archmage',type:'accessory',name:'Sombrero de Arquimago',cost:0,domiExclusive:true,icon:'🌀',description:'Legendario Don Domi: +22% Daño y +15% Cadencia.'},
  {id:'leg_cape',type:'accessory',name:'Manto Real Carmesí',cost:0,domiExclusive:true,icon:'⚜',description:'Legendario Don Domi: +30 Vida y +12% Daño.'},
  {id:'leg_angel_wings',type:'accessory',name:'Alas de Ángel',cost:0,domiExclusive:true,icon:'🪶',description:'Legendario Don Domi: +22% Velocidad y menor recarga.'},
  {id:'leg_fire_wings',type:'accessory',name:'Alas de Fénix Ígneo',cost:0,domiExclusive:true,icon:'🔥',description:'Legendario Don Domi: +25% Daño y +12% Velocidad.'},
  {id:'leg_excalibur',type:'accessory',name:'Espada Dorada Excalibur',cost:0,domiExclusive:true,icon:'🗡',description:'Legendario Don Domi: +1 Proyectil Extra y +18% Daño.'},
  {id:'leg_medallion',type:'accessory',name:'Medallón Rubí Sagrado',cost:0,domiExclusive:true,icon:'🎖',description:'Legendario Don Domi: +40 Vida Máxima y Defensa.'},
  {id:'leg_lava_crown',type:'accessory',name:'Corona Magmática Imperial',cost:0,domiExclusive:true,icon:'🌋',description:'Legendario Jefe Final: +50 Vida Máxima, +30% Daño Ígneo y Rastro de Magma.'},
  // Accesorios Exclusivos de Cartografía (Recompensa de Misiones de Mapa)
  {id:'ticket_gold',type:'accessory',name:'Lentes de Fiesta',cost:0,cartographyExclusive:true,icon:'🕶',description:'Misión Local DOMI: Lentes de fiesta retro (+10% puntos/monedas y +5% daño con combo x5 o superior).'},
  {id:'thermal_gloves',type:'accessory',name:'Farol Gourmet',cost:0,cartographyExclusive:true,icon:'🏮',description:'Misión Cocina: Farol de hornallas (Inmunidad al aceite y +7% cadencia de disparo).'},
  {id:'reflect_vest',type:'accessory',name:'Guitarra Callejera',cost:0,cartographyExclusive:true,icon:'🎸',description:'Misión Estacionamiento: Guitarra acústica de reparto (+20% daño de embestida con dash y -12% recarga).'},
  {id:'thermal_scarf',type:'accessory',name:'Gorro Invernal',cost:0,cartographyExclusive:true,icon:'🎅',description:'Misión Nevado: Gorro festivo con pompón (-60% ralentización por frío y +12 HP máx).'},
  {id:'thorn_boots',type:'accessory',name:'Estrella de Sheriff',cost:0,cartographyExclusive:true,icon:'⭐',description:'Misión Desierto: Insignia dorada (Inmunidad al daño de cactus y +8% velocidad en arena).'},
  {id:'captain_cleats',type:'accessory',name:'Botines de Capitán',cost:0,cartographyExclusive:true,icon:'👟',description:'Misión Cancha: Botines con tapones de fútbol (+30% velocidad y daño al patear pelotas/cocos y +8% velocidad).'},
  {id:'tropical_visor',type:'accessory',name:'Sombrero de Piña',cost:0,cartographyExclusive:true,icon:'🍍',description:'Misión Playa: Casco tropical (+15% duración de comida y +7% golpe crítico).'}
];

const LEGACY_MAP = {
  cyber_shades: 'shades',
  headband: 'cap',
  pineapple_hat: 'tropical_visor',
  red_bandana: 'party_hat',
  neon_cap: 'cap',
  magic_hat: 'wizard_hat',
  void_hood: 'top_hat',
  cyber_helmet: 'headphones',
  blue_visor: 'bowtie',
  energy_halo: 'crown',
  leg_tiara: 'leg_halo',
  leg_valkyrie: 'leg_viking',
  leg_void_crown: 'leg_archmage',
  leg_crimson_cape: 'leg_cape',
  leg_dragon_wings: 'leg_fire_wings',
  leg_golden_staff: 'leg_excalibur',
  leg_golden_chalice: 'leg_medallion'
};

export const freeItems = {skin:['pancho'],map:['diner','kitchen','parking','beach'],pet:['none'],accessory:['none']};
export function isOwned(profile,type,id){
  if (freeItems[type]?.includes(id)) return true;
  if (type === 'map' && id === 'lava' && profile?.unlockedLava) return true;
  if (!profile?.purchases) return false;
  if (profile.purchases.includes(`${type}:${id}`)) return true;
  if (type === 'accessory') {
    for (const [oldId, newId] of Object.entries(LEGACY_MAP)) {
      if (newId === id && profile.purchases.includes(`accessory:${oldId}`)) return true;
    }
  }
  return false;
}
