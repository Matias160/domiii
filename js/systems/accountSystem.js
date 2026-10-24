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

function all(){
  let raw = null;
  try{raw=localStorage.getItem(KEY);}catch{return Object.create(null);}
  if(!raw)return Object.create(null);
  try{
    const data=JSON.parse(raw);
    if(!data||typeof data!=='object'||Array.isArray(data))return Object.create(null);
    return Object.assign(Object.create(null),data);
  }catch{
    return Object.create(null);
  }
}
function write(data){try{localStorage.setItem(KEY,JSON.stringify(data));}catch{}}
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
export function logout(){sessionStorage.removeItem(SESSION);}

export function guestLogin(){
  const id='invitado';
  const data=all();
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

export async function register(name,password){
  name=name.trim();if(!/^[\p{L}\p{N}_ -]{3,16}$/u.test(name))throw Error('Nombre: 3 a 16 letras o números.');
  if(password.length<6)throw Error('La contraseña necesita al menos 6 caracteres.');
  const id=clean(name);if(Object.hasOwn(all(),id))throw Error('Ese nombre ya existe. Hacé clic en "Iniciar sesión" o elegí otro nombre.');
  const salt=getSalt();
  const hash=await digest(password,salt);
  const data=all();if(Object.hasOwn(data,id))throw Error('Ese nombre ya existe.');
  data[id]={name,salt,hash,bank:0,totalEarned:0,purchases:[],loadout:{skin:'pancho',map:'diner',pet:'none',accessory:'none'},runs:[]};
  write(data);setSession(id);return data[id];
}

export async function login(name,password){
  const data=all(),id=clean(name),profile=data[id];
  if(!profile){
    throw Error('Ese usuario no está registrado. Usá "Crear cuenta" o jugá como invitado.');
  }
  if(!profile.hash){
    throw Error('Datos de cuenta dañados. Creá una cuenta nueva o entrá como Invitado.');
  }
  let hash='';
  try { hash=await digest(password,profile.salt||'00'); } catch {}
  const fallbackH=sha256Sync(password+':'+(profile.salt||'00'));
  const isMatch=(hash&&hash===profile.hash)||(fallbackH===profile.hash)||(profile.hash==='guest');
  if(!isMatch){
    throw Error('Contraseña incorrecta. Revisá mayúsculas o hacé clic en "Restablecer clave".');
  }
  setSession(id);return profile;
}

export async function resetPassword(name,newPassword){
  name=name.trim();
  const id=clean(name),data=all();
  if(!data[id])throw Error(`La cuenta "${name}" no existe.`);
  if(newPassword.length<6)throw Error('La nueva contraseña necesita al menos 6 caracteres.');
  const salt=getSalt();
  const hash=await digest(newPassword,salt);
  data[id].salt=salt;
  data[id].hash=hash;
  write(data);
  setSession(id);
  return data[id];
}
function mutate(change){const id=sessionStorage.getItem(SESSION),data=all();if(!id||!data[id])throw Error('Inicia sesión para continuar.');
  const result=change(data[id]);write(data);return result;
}
export function purchase(type,id){const item=shopItems.find(x=>x.type===type&&x.id===id);if(!item)throw Error('Articulo desconocido.');
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
  p.runs.unshift({id:result.id,score:points,kills:result.kills,level:result.level,timeText:result.timeText,date:new Date().toLocaleDateString('es-AR'),map:result.map,outcome:result.outcome});
  p.runs=p.runs.slice(0,40);return p;
});}
