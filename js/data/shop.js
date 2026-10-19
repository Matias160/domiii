export const shopItems = [
  {id:'nugget',type:'skin',name:'Nugget',cost:450,icon:'N',description:'Rapido y escurridizo.'},
  {id:'papas',type:'skin',name:'Papas fritas',cost:650,icon:'P',description:'Un proyectil adicional.'},
  {id:'pizza',type:'skin',name:'Pizza',cost:850,icon:'Z',description:'Resistente y contundente.'},
  {id:'empanada',type:'skin',name:'Empanada',cost:950,icon:'E',description:'Defensa superior.'},
  {id:'choripan',type:'skin',name:'Choripan',cost:1600,icon:'C',description:'Especialista en jefes.'},
  {id:'snow',type:'map',name:'Nevado',cost:800,icon:'❄',description:'Ventiscas que congelan el tablero.'},
  {id:'desert',type:'map',name:'Desierto',cost:1000,icon:'✳',description:'Cactus rodantes que hacen daño.'},
  {id:'football',type:'map',name:'Cancha de futbol',cost:1200,icon:'⚽',description:'Pelotas peligrosas en juego.'},
  {id:'ketchup',type:'pet',name:'Mini ketchup',cost:700,icon:'K',description:'Ataca por vos.'},
  {id:'drone',type:'pet',name:'Dron delivery',cost:850,icon:'D',description:'Junta objetos cercanos.'},
  {id:'headband',type:'accessory',name:'Vincha turbo',cost:350,icon:'▰',description:'+5% velocidad.'},
  {id:'shades',type:'accessory',name:'Anteojos',cost:450,icon:'◉',description:'+5% daño.'},
  {id:'crown',type:'accessory',name:'Corona del local',cost:650,icon:'♛',description:'+10 vida maxima.'},
];
export const freeItems = {skin:['pancho'],map:['diner','kitchen','parking'],pet:['none'],accessory:['none']};
export function isOwned(profile,type,id){return freeItems[type]?.includes(id)||profile?.purchases?.includes(`${type}:${id}`);}
