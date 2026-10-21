export const shopItems = [
  {id:'nugget',type:'skin',name:'Nugget',cost:450,icon:'N',description:'Rapido y escurridizo.'},
  {id:'papas',type:'skin',name:'Papas fritas',cost:650,icon:'P',description:'Un proyectil adicional.'},
  {id:'pizza',type:'skin',name:'Pizza',cost:850,icon:'Z',description:'Resistente y contundente.'},
  {id:'empanada',type:'skin',name:'Empanada',cost:950,icon:'E',description:'Defensa superior.'},
  {id:'choripan',type:'skin',name:'Choripan',cost:1600,icon:'C',description:'Especialista en jefes.'},
  {id:'snow',type:'map',name:'Nevado',cost:800,icon:'❄',description:'Ventiscas que congelan el tablero.'},
  {id:'desert',type:'map',name:'Desierto',cost:1000,icon:'✳',description:'Cactus rodantes que hacen daño.'},
  {id:'football',type:'map',name:'Cancha de futbol',cost:1200,icon:'⚽',description:'Pelotas peligrosas en juego.'},
  {id:'ketchup',type:'pet',name:'Mini ketchup',cost:700,icon:'K',description:'Dispara salsa picante y deja charcos pegajosos.'},
  {id:'drone',type:'pet',name:'Dron delivery',cost:850,icon:'D',description:'Imán de ingredientes y descarga rayos relámpago.'},
  {id:'taco',type:'pet',name:'Taco Guardián',cost:950,icon:'T',description:'Otorga escudo al jugador y embiste enemigos cercanos.'},
  {id:'soda',type:'pet',name:'Botellita Soda',cost:1100,icon:'S',description:'Burbujas curativas y salpicaduras de gas efervescente.'},
  {id:'parrilla',type:'pet',name:'Mini Parrilla',cost:0,icon:'♨',description:'Exclusiva de Don Domi: lanza ascuas y genera ondas ardientes.'},
  {id:'headband',type:'accessory',name:'Vincha turbo',cost:350,icon:'▰',description:'+5% velocidad.'},
  {id:'shades',type:'accessory',name:'Anteojos',cost:450,icon:'◉',description:'+5% daño.'},
  {id:'crown',type:'accessory',name:'Corona del local',cost:650,icon:'♛',description:'+10 vida maxima.'},
  {id:'chef_hat',type:'accessory',name:'Gorro de Chef',cost:0,icon:'★',description:'Exclusivo de Don Domi: +10% daño y maestría gastronómica.'},
];
export const freeItems = {skin:['pancho'],map:['diner','kitchen','parking'],pet:['none'],accessory:['none']};
export function isOwned(profile,type,id){return freeItems[type]?.includes(id)||profile?.purchases?.includes(`${type}:${id}`);}
