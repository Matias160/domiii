import {shopItems,isOwned} from '../data/shop.js';
const KEY='domi2pancho.accounts.v1', SESSION='domi2pancho.session.v1';
const encoder=new TextEncoder();

// Implementación SHA-256 síncrona en JS puro para entornos sin SubtleCrypto (HTTP, file://, etc.)
function sha256Sync(ascii) {
  function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
  const mathPow = Math.pow, maxWord = mathPow(2, 32);
  let result = '', words = [], asciiBitLength = ascii.length * 8, hash = [], k = [], primeCounter = 0, isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 300; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = (asciiBitLength);
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16), oldHash = hash;
    hash = hash.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + w[i]) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  for (let i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

const LOGIN_ERROR='Usuario o contraseña incorrectos. Revisá mayúsculas o hacé clic en "Restablecer clave".';
const READ_ERROR='No se pudo leer los datos guardados de las cuentas. No se modificaron para no perderlos.';
const WRITE_ERROR='No se pudo guardar en este navegador. Revisá el espacio disponible o salí del modo privado.';
// strict: antes de escribir, nunca tratar datos dañados o ilegibles como "vacío" (evita sobrescribirlos)
function all(strict=false){
  const empty=()=>{if(strict)throw Error(READ_ERROR);return Object.create(null);};
  let raw = null;
  try{raw=localStorage.getItem(KEY);}catch{return empty();}
  if(raw===null||raw===undefined||raw==='')return Object.create(null);
  try{
    const data=JSON.parse(raw);
    if(!data||typeof data!=='object'||Array.isArray(data))return empty();
    return Object.assign(Object.create(null),data);
  }catch{
    return empty();
  }
}
function write(data){try{localStorage.setItem(KEY,JSON.stringify(data));}catch{throw Error(WRITE_ERROR);}}
function setSession(id){try{sessionStorage.setItem(SESSION,id);}catch{}}
function bytesToHex(bytes){return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');}

function getSalt(){
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    try { crypto.getRandomValues(bytes); return bytesToHex(bytes); } catch {}
  }
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytesToHex(bytes);
}

async function digest(password,salt){
  if (globalThis.crypto?.subtle) {
    try {
      const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
      return bytesToHex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:Uint8Array.from(salt.match(/../g).map(x=>parseInt(x,16))),iterations:160000,hash:'SHA-256'},key,256)));
    } catch {}
  }
  return sha256Sync(password + ':' + salt);
}
function clean(name){return name.trim().toLocaleLowerCase('es');}
export function currentAccount(){try{const id=sessionStorage.getItem(SESSION);return id?all()[id]||null:null;}catch{return null;}}
export function logout(){try{sessionStorage.removeItem(SESSION);}catch{}}
// El invitado es la cuenta compartida 'invitado': no tiene nombre propio ni contraseña
export function isGuest(){try{return sessionStorage.getItem(SESSION)==='invitado';}catch{return false;}}

export function guestLogin(){
  const id='invitado';
  const data=all(true);
  if(!data[id]){
    data[id]={
      name:'Invitado',
      salt:'0123456789abcdef0123456789abcdef',
      hash:'guest',
      bank:500,
      totalEarned:0,
      purchases:[],
      loadout:{skin:'pancho',map:'diner',pet:'none',accessory:'none'},
      runs:[]
    };
    write(data);
  }
  setSession(id);
  return data[id];
}

export async function register(name, _password = ''){
  name=name.trim();if(!/^[\p{L}\p{N}_ -]{3,16}$/u.test(name))throw Error('Nombre: 3 a 16 letras o números.');
  const id=clean(name);
  const data=all(true);
  if(Object.hasOwn(data,id))throw Error('Ese nombre ya existe. Hacé clic en "Iniciar sesión" o elegí otro nombre.');
  data[id]={name,salt:'none',hash:'none',bank:0,totalEarned:0,purchases:[],loadout:{skin:'pancho',map:'diner',pet:'none',accessory:'none'},runs:[]};
  write(data);setSession(id);return data[id];
}

export async function login(name, _password = ''){
  name=name.trim();if(!name)throw Error('Ingresá tu nombre de usuario.');
  const data=all(),id=clean(name),profile=data[id];
  if(!profile){
    throw Error(`La cuenta "${name}" no existe. Hacé clic en "Crear cuenta" para registrarte.`);
  }
  setSession(id);return profile;
}

export async function resetPassword(name, _newPassword = ''){
  name=name.trim();
  const id=clean(name),data=all(true);
  if(!data[id])throw Error(`La cuenta "${name}" no existe.`);
  setSession(id);
  return data[id];
}
export function mutate(change){const id=sessionStorage.getItem(SESSION),data=all(true);if(!id||!data[id])throw Error('Inicia sesión para continuar.');
  const result=change(data[id]);write(data);return result;
}
export function purchase(type,id){const item=shopItems.find(x=>x.type===type&&x.id===id);if(!item)throw Error('Articulo desconocido.');
  if(item.domiExclusive)throw Error('Este artículo exclusivo se obtiene en las misiones de Don Domi.');
  if(item.cartographyExclusive)throw Error('Este accesorio exclusivo se obtiene completando la misión del mapa en la Mesa de Cartografía.');
  return mutate(p=>{if(isOwned(p,type,id))throw Error('Ya lo tenes.');if(p.bank<item.cost)throw Error('No alcanzan los puntos.');p.bank-=item.cost;p.purchases.push(`${type}:${id}`);return p;});
}
export function equip(type,id){return mutate(p=>{if(!isOwned(p,type,id))throw Error('Primero tenes que comprarlo.');p.loadout[type]=id;return p;});}
export function grantItem(type,id){
  return mutate(p=>{
    const key=`${type}:${id}`;
    if(!p.purchases.includes(key)){p.purchases.push(key);}
    return p;
  });
}
export function awardRun(result){return mutate(p=>{
  if(p.runs.some(x=>x.id===result.id))return p;
  const points=Math.max(0,Math.floor(result.score));p.bank+=points;p.totalEarned+=points;
  const runTime = result.time ?? (() => { const [m, s] = String(result.timeText || '0:0').split(':').map(Number); return (m || 0) * 60 + (s || 0); })();
  const runCombo = result.peakCombo || result.combo || 0;
  const runBosses = result.bossesKilled || 0;
  p.stats = p.stats || { maxLevel: 0, maxKills: 0, maxCombo: 0, maxTime: 0, totalKills: 0, totalRuns: 0, totalBosses: 0 };
  p.stats.maxLevel = Math.max(p.stats.maxLevel || 0, result.level || 0);
  p.stats.maxKills = Math.max(p.stats.maxKills || 0, result.kills || 0);
  p.stats.maxCombo = Math.max(p.stats.maxCombo || 0, runCombo);
  p.stats.maxTime = Math.max(p.stats.maxTime || 0, runTime);
  p.stats.totalKills = (p.stats.totalKills || 0) + (result.kills || 0);
  p.stats.totalRuns = (p.stats.totalRuns || 0) + 1;
  p.stats.totalBosses = (p.stats.totalBosses || 0) + runBosses;

  // Estadísticas permanentes por mapa (sin límite de historial de 40 partidas)
  p.mapStats = p.mapStats || {};
  const mapKey = result.map || 'diner';
  if (!p.mapStats[mapKey]) {
    p.mapStats[mapKey] = { runs: 0, victories: 0, defeats: 0, maxTime: 0, kills: 0, maxScore: 0 };
  }
  const ms = p.mapStats[mapKey];
  ms.runs += 1;
  const isVictory = result.outcome === 'victory' || result.victory || (mapKey === 'lava' && runBosses >= 1);
  if (isVictory) ms.victories += 1;
  else ms.defeats += 1;
  ms.maxTime = Math.max(ms.maxTime, runTime);
  ms.kills += (result.kills || 0);
  ms.maxScore = Math.max(ms.maxScore, points);

  // Misiones temáticas de cartografía acumulativas (y victoria en 1 partida para el Coloso)
  const DEFAULT_MISSIONS = {
    diner:    { progress: 0, target: 10, completed: false, accessory: 'ticket_gold' },
    kitchen:  { progress: 0, target: 10, completed: false, accessory: 'thermal_gloves' },
    parking:  { progress: 0, target: 12, completed: false, accessory: 'reflect_vest' },
    snow:     { progress: 0, target: 10, completed: false, accessory: 'thermal_scarf' },
    desert:   { progress: 0, target: 10, completed: false, accessory: 'thorn_boots' },
    football: { progress: 0, target: 8,  completed: false, accessory: 'captain_cleats' },
    beach:    { progress: 0, target: 8,  completed: false, accessory: 'tropical_visor' },
    beach_alt:{ progress: 0, target: 30, completed: false, accessory: 'pineapple_hat' },
    lava:     { progress: 0, target: 1,  completed: false, accessory: 'leg_lava_crown' }
  };
  p.cartographyMissions = p.cartographyMissions || {};
  for (const [k, v] of Object.entries(DEFAULT_MISSIONS)) {
    if (!p.cartographyMissions[k]) p.cartographyMissions[k] = { ...v };
  }

  const progressMap = Object.assign({}, result.cartographyProgress || {}, result.cartographyGains || {});
  if (mapKey === 'lava' && isVictory) {
    progressMap.lava = 1;
  }

  for (const [mId, amount] of Object.entries(progressMap)) {
    if (p.cartographyMissions[mId]) {
      const m = p.cartographyMissions[mId];
      if (mId === 'lava') {
        if (amount >= 1) m.progress = 1;
      } else {
        m.progress = Math.min(m.target, (m.progress || 0) + (amount || 0));
      }
      if (m.progress >= m.target && !m.completed) {
        m.completed = true;
        m.rewardedAt = Date.now();
        if (m.accessory && !p.purchases.includes(`accessory:${m.accessory}`)) {
          p.purchases.push(`accessory:${m.accessory}`);
          p.newlyUnlockedAccessory = m.accessory;
        }
      }
    }
  }

  p.runs.unshift({
    id: result.id,
    name: result.name || p.name,
    score: points,
    kills: result.kills,
    level: result.level,
    time: runTime,
    combo: runCombo,
    bossesKilled: runBosses,
    timeText: result.timeText,
    date: new Date().toLocaleDateString('es-AR'),
    map: result.map,
    outcome: result.outcome,
    skinId: result.skinId || result.skin,
    weaponId: result.weaponId || result.weapon,
    companionId: result.companionId || result.companion,
  });
  p.runs=p.runs.slice(0,40);return p;
});}
export function clearAccountRuns(){try{return mutate(p=>{p.runs=[];return p;});}catch{return null;}}

export function getMapStats(mapId) {
  const profile = currentAccount();
  if (!profile || !profile.mapStats) return { runs: 0, victories: 0, defeats: 0, maxTime: 0, kills: 0, maxScore: 0 };
  return profile.mapStats[mapId] || { runs: 0, victories: 0, defeats: 0, maxTime: 0, kills: 0, maxScore: 0 };
}

export function getCartographyMissions() {
  const profile = currentAccount();
  const DEFAULT_MISSIONS = {
    diner:    { progress: 0, target: 10, completed: false, accessory: 'ticket_gold' },
    kitchen:  { progress: 0, target: 10, completed: false, accessory: 'thermal_gloves' },
    parking:  { progress: 0, target: 12, completed: false, accessory: 'reflect_vest' },
    snow:     { progress: 0, target: 10, completed: false, accessory: 'thermal_scarf' },
    desert:   { progress: 0, target: 10, completed: false, accessory: 'thorn_boots' },
    football: { progress: 0, target: 8,  completed: false, accessory: 'captain_cleats' },
    beach:    { progress: 0, target: 8,  completed: false, accessory: 'tropical_visor' },
    beach_alt:{ progress: 0, target: 30, completed: false, accessory: 'pineapple_hat' },
    lava:     { progress: 0, target: 1,  completed: false, accessory: 'leg_lava_crown' }
  };
  if (!profile) return DEFAULT_MISSIONS;
  profile.cartographyMissions = profile.cartographyMissions || {};
  const res = {};
  for (const [k, v] of Object.entries(DEFAULT_MISSIONS)) {
    res[k] = Object.assign({}, v, profile.cartographyMissions[k] || {});
  }
  return res;
}

export function clearNewUnlock() {
  try {
    return mutate(p => {
      const acc = p.newlyUnlockedAccessory;
      delete p.newlyUnlockedAccessory;
      return acc;
    });
  } catch {
    return null;
  }
}
