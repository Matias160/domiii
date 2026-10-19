const KEY='domi2pancho.achievements';
function storageKey(){try{const id=sessionStorage.getItem('domi2pancho.session.v1');return id?`${KEY}.${id}`:KEY;}catch{return KEY;}}
export const achievements=[
  {id:'firstBite',name:'Primer bocado',description:'Derrota 10 enemigos.',test:stats=>stats.kills>=10},
  {id:'ketchupFan',name:'Sin ketchup no hay paraiso',description:'Recoge 20 botellas de ketchup.',test:stats=>stats.pickups.ketchup>=20},
  {id:'immortal',name:'Pancho inmortal',description:'Sobrevive 10 minutos en total.',test:stats=>stats.seconds>=600},
  {id:'chef',name:'Chef del caos',description:'Derrota al primer jefe.',test:stats=>stats.bosses>=1},
  {id:'delivery',name:'Maestro del delivery',description:'Recorre 10.000 metros entre todas tus partidas.',test:stats=>stats.distance>=1000000},
  {id:'comboKing',name:'Rey del combo',description:'Derrota 3 jefes y desbloquea el choripan.',test:stats=>stats.bosses>=3},
];

export function readAchievementStats(){
  try{
    const saved=JSON.parse(localStorage.getItem(storageKey()))||{};
    const total={kills:0,seconds:0,bosses:0,distance:0,pickups:{}};
    for(const key of ['kills','seconds','bosses','distance'])total[key]=Number.isFinite(saved[key])?Math.max(0,saved[key]):0;
    for(const key of ['ketchup','mayo','mustard','hotSauce','barbecue'])total.pickups[key]=Number.isFinite(saved.pickups?.[key])?Math.max(0,saved.pickups[key]):0;
    return total;
  }
  catch{return {kills:0,seconds:0,bosses:0,distance:0,pickups:{}};}
}

export function recordRun(result){
  const total=readAchievementStats();
  total.kills+=result.kills;total.seconds+=result.time;total.bosses+=result.bossesKilled||0;
  total.distance+=result.distance||0;
  for(const [id,count] of Object.entries(result.pickups||{}))total.pickups[id]=(total.pickups[id]||0)+count;
  try{localStorage.setItem(storageKey(),JSON.stringify(total));}catch{}
  return achievements.filter(item=>item.test(total));
}

export function unlockedAchievements(){
  const stats=readAchievementStats();return achievements.filter(item=>item.test(stats));
}
