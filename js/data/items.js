export const items = {
  ketchup: { id:'ketchup', name:'Ketchup', color:'#ef5960', rarity:'Comun', kind:'damage', duration:12, value:.35, weight:26 },
  mayo: { id:'mayo', name:'Mayonesa', color:'#fff0c7', rarity:'Comun', kind:'heal', value:32, weight:25 },
  mustard: { id:'mustard', name:'Mostaza', color:'#ffd34f', rarity:'Comun', kind:'speed', duration:10, value:.3, weight:23 },
  hotSauce: { id:'hotSauce', name:'Salsa picante', color:'#ff713e', rarity:'Raro', kind:'fire', duration:10, value:.28, weight:17 },
  barbecue: { id:'barbecue', name:'Barbacoa', color:'#b9784c', rarity:'Epico', kind:'blast', value:55, weight:9 },
};

export const rarities = [
  { id:'Comun', color:'#d7e5d8', multiplier:1, weight:68 },
  { id:'Raro', color:'#77ccff', multiplier:1.45, weight:22 },
  { id:'Epico', color:'#db96ff', multiplier:2, weight:8 },
  { id:'Legendario', color:'#ffb650', multiplier:2.8, weight:1.7 },
  { id:'Mitico', color:'#ff668f', multiplier:4, weight:.3 },
];
