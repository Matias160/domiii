export const items = {
  ketchup: { id:'ketchup', name:'Ketchup', color:'#ef5960', rarity:'Comun', kind:'damage', duration:12, value:.35, weight:26 },
  mayo: { id:'mayo', name:'Mayonesa', color:'#fff0c7', rarity:'Comun', kind:'heal', value:32, weight:25 },
  mustard: { id:'mustard', name:'Mostaza', color:'#ffd34f', rarity:'Comun', kind:'speed', duration:10, value:.3, weight:23 },
  hotSauce: { id:'hotSauce', name:'Salsa picante', color:'#ff713e', rarity:'Raro', kind:'fire', duration:10, value:.28, weight:17 },
  barbecue: { id:'barbecue', name:'Barbacoa', color:'#b9784c', rarity:'Epico', kind:'blast', value:55, weight:9 },
};

export const rarities = [
  { id:'Comun', color:'#38ef7d', glow:'rgba(56, 239, 125, 0.35)', accent:'#a7f3d0', multiplier:1, weight:54 },
  { id:'Raro', color:'#00f0ff', glow:'rgba(0, 240, 255, 0.42)', accent:'#bae6fd', multiplier:1.45, weight:26 },
  { id:'Epico', color:'#d946ef', glow:'rgba(217, 70, 239, 0.48)', accent:'#f5d0fe', multiplier:2, weight:13 },
  { id:'Legendario', color:'#ffd000', glow:'rgba(255, 208, 0, 0.55)', accent:'#fef08a', multiplier:2.8, weight:5.5 },
  { id:'Mitico', color:'#ff0055', glow:'rgba(255, 0, 85, 0.62)', accent:'#fecdd3', multiplier:4, weight:1.5 },
];
