import {shopItems,isOwned} from '../data/shop.js';
const KEY='domi2pancho.accounts.v1', SESSION='domi2pancho.session.v1';
const encoder=new TextEncoder();
function all(){
  let raw;
  try{raw=localStorage.getItem(KEY);}catch{throw Error('El navegador no permite leer el progreso. Habilitá el almacenamiento del sitio.');}
  if(raw===null)return Object.create(null);
  try{
    const data=JSON.parse(raw);
    if(!data||typeof data!=='object'||Array.isArray(data))throw Error();
    return Object.assign(Object.create(null),data);
  }catch{throw Error('No se pudo leer el progreso guardado. No se sobrescribió ningún dato. Conservá los datos de este navegador para poder recuperarlos.');}
}
function write(data){try{localStorage.setItem(KEY,JSON.stringify(data));}catch{throw Error('No se pudo guardar el progreso. Revisá el espacio y los permisos de almacenamiento del navegador.');}}
function setSession(id){try{sessionStorage.setItem(SESSION,id);}catch{throw Error('El navegador no permite iniciar la sesión. Habilitá el almacenamiento del sitio e intentá entrar de nuevo.');}}
function bytesToHex(bytes){return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function digest(password,salt){
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  return bytesToHex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:Uint8Array.from(salt.match(/../g).map(x=>parseInt(x,16))),iterations:160000,hash:'SHA-256'},key,256)));
}
function clean(name){return name.trim().toLocaleLowerCase('es');}
export function currentAccount(){try{const id=sessionStorage.getItem(SESSION);return id?all()[id]||null:null;}catch{return null;}}
export function logout(){sessionStorage.removeItem(SESSION);}
export async function register(name,password){
  name=name.trim();if(!/^[\p{L}\p{N}_ -]{3,16}$/u.test(name))throw Error('Nombre: 3 a 16 letras o numeros.');
  if(password.length<6)throw Error('La contraseña necesita al menos 6 caracteres.');
  const id=clean(name);if(Object.hasOwn(all(),id))throw Error('Ese nombre ya existe.');
  const salt=bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash=await digest(password,salt);
  // Read again after hashing so another completed registration is preserved.
  const data=all();if(Object.hasOwn(data,id))throw Error('Ese nombre ya existe.');
  data[id]={name,salt,hash,bank:0,totalEarned:0,purchases:[],loadout:{skin:'pancho',map:'diner',pet:'none',accessory:'none'},runs:[]};
  write(data);setSession(id);return data[id];
}
export async function login(name,password){const data=all(),id=clean(name),profile=data[id];
  if(!profile||typeof profile.salt!=='string'||!/^[a-f0-9]{32}$/.test(profile.salt)||typeof profile.hash!=='string')throw Error('Usuario o contraseña incorrectos.');
  const hash=await digest(password,profile.salt);
  if(hash.length!==profile.hash.length||![...hash].every((x,i)=>x===profile.hash[i]))throw Error('Usuario o contraseña incorrectos.');
  setSession(id);return profile;
}
function mutate(change){const id=sessionStorage.getItem(SESSION),data=all();if(!id||!data[id])throw Error('Inicia sesión para continuar.');
  const result=change(data[id]);write(data);return result;
}
export function purchase(type,id){const item=shopItems.find(x=>x.type===type&&x.id===id);if(!item)throw Error('Articulo desconocido.');
  return mutate(p=>{if(isOwned(p,type,id))throw Error('Ya lo tenes.');if(p.bank<item.cost)throw Error('No alcanzan los puntos.');p.bank-=item.cost;p.purchases.push(`${type}:${id}`);return p;});
}
export function equip(type,id){return mutate(p=>{if(!isOwned(p,type,id))throw Error('Primero tenes que comprarlo.');p.loadout[type]=id;return p;});}
export function awardRun(result){return mutate(p=>{
  if(p.runs.some(x=>x.id===result.id))return p;
  const points=Math.max(0,Math.floor(result.score));p.bank+=points;p.totalEarned+=points;
  p.runs.unshift({id:result.id,score:points,kills:result.kills,level:result.level,timeText:result.timeText,date:new Date().toLocaleDateString('es-AR'),map:result.map,outcome:result.outcome});
  p.runs=p.runs.slice(0,40);return p;
});}
