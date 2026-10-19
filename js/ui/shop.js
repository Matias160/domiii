import {shopItems,isOwned} from '../data/shop.js';
import {currentAccount,purchase,equip} from '../systems/accountSystem.js';
import {drawItemPreview} from '../core/presentation.js';
import {skins} from '../data/skins.js';
import {icon} from './icons.js';
import {companions} from '../entities/Companion.js';

const tabs=[['skin','Personajes','UserRound'],['accessory','Accesorios','Shirt'],['map','Escenarios','Map'],['pet','Mascotas','PawPrint']];
const basics=[
  {id:'pancho',type:'skin',name:'Pancho',cost:0,description:'El original. Equilibrado y fiel al mostrador.'},
  {id:'none',type:'accessory',name:'Al natural',cost:0,description:'Tu personaje sin accesorios.'},
  {id:'none',type:'pet',name:'Turno solitario',cost:0,description:'Sin mascota equipada.'},
  {id:'diner',type:'map',name:'Local DOMI',cost:0,description:'La cocina de siempre. El turno nunca termina.'},
  {id:'kitchen',type:'map',name:'Cocina industrial',cost:0,description:'Los enemigos se mueven un 8% más rápido.'},
  {id:'parking',type:'map',name:'Estacionamiento',cost:0,description:'Último delivery de la noche.'},
];
export const catalog=[...basics,...shopItems];
const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
export function filterCatalog(profile,{type='skin',ownedOnly=false,query='',affordable=false,sort='featured'}={}){
  const result=catalog.filter(item=>item.type===type&&(!ownedOnly||isOwned(profile,item.type,item.id))&&(!affordable||isOwned(profile,item.type,item.id)||item.cost<=profile.bank)&&normalize(item.name+' '+item.description).includes(normalize(query.trim())));
  if(sort==='price')result.sort((a,b)=>a.cost-b.cost);
  if(sort==='name')result.sort((a,b)=>a.name.localeCompare(b.name,'es'));
  return result;
}
function node(tag,className,text){const el=document.createElement(tag);el.className=className;if(text!==undefined)el.textContent=text;return el;}

export class Shop{
  constructor(game,account={currentAccount,purchase,equip}){
    this.game=game;this.account=account;this.type='skin';this.selected=null;this.ownedOnly=false;
    this.query='';this.sort='featured';this.affordable=false;
    document.querySelector('#shopBackButton').addEventListener('click',()=>game.showScreen('lobbyScreen'));
  }
  resetFilters(){this.query='';this.affordable=false;}
  setMode(ownedOnly){this.show(this.type,ownedOnly);this.game.audio.play('navigate');}
  show(type='skin',ownedOnly=false){
    this.type=type;this.ownedOnly=ownedOnly;this.selected=null;this.resetFilters();document.querySelector('#shopFeedback').textContent='';
    this.mode=ownedOnly?(type==='pet'?'pets':'wardrobe'):'store';
    if(!this.account.currentAccount()){this.game.showScreen('authScreen');return;}
    this.render();this.game.showScreen('shopScreen');document.querySelector('#shopScreen').scrollTop=0;
  }
  selectCategory(type){this.type=type;this.selected=null;this.render();this.game.audio.play('navigate');document.querySelector(`#shopTabs [data-type="${type}"]`)?.focus({preventScroll:true});}
  render(){
    this.profile=this.account.currentAccount();if(!this.profile){this.game.showScreen('authScreen');return;}
    const profile=this.profile;
    document.querySelector('#shopScreen').dataset.mode=this.mode;
    document.querySelector('#shopTitle').textContent=this.mode==='pets'?'Mascotas':this.ownedOnly?'Mi armario':'Tienda';
    document.querySelector('#shopSubtitle').textContent=this.mode==='pets'?'Conocé qué hace cada compañero y seleccioná el tuyo.':this.ownedOnly?'Tus personajes, sus características y tus accesorios.':'Cuatro categorías. Lo que ya tenés y lo que te falta descubrir.';
    document.querySelector('.shop-balance').hidden=this.ownedOnly;
    document.querySelector('#shopBank').textContent=profile.bank.toLocaleString('es-AR');
    const tabsRoot=document.querySelector('#shopTabs');tabsRoot.replaceChildren();
    const visibleTabs=tabs.filter(([id])=>this.mode==='store'||(this.mode==='pets'?id==='pet':['skin','accessory'].includes(id)));
    tabsRoot.hidden=this.mode==='pets';
    for(const [id,label,symbol] of visibleTabs){
      const button=node('button',id===this.type?'active':'');button.type='button';button.dataset.type=id;
      const count=catalog.filter(item=>item.type===id).length;
      button.innerHTML=icon(symbol);button.append(node('span','',label),node('b','category-count',String(count)));button.setAttribute('aria-pressed',String(id===this.type));
      button.onclick=()=>this.selectCategory(id);tabsRoot.append(button);
    }
    this.renderCatalog();
  }
  renderCatalog(){
    const profile=this.account.currentAccount();if(!profile)return;this.profile=profile;
    const items=filterCatalog(profile,{...this,ownedOnly:false});
    if(!items.some(item=>item.id===this.selected?.id&&item.type===this.selected?.type))this.selected=items.find(item=>profile.loadout[item.type]===item.id)||items[0]||null;
    document.querySelector('#shopCategory').textContent=tabs.find(tab=>tab[0]===this.type)[1];
    const ownedCount=items.filter(item=>isOwned(profile,item.type,item.id)).length;
    document.querySelector('#shopCount').textContent=`${ownedCount} de ${items.length} en tu colección`;
    const root=document.querySelector('#shopGrid');root.replaceChildren();
    for(const item of items){
      const owned=isOwned(profile,item.type,item.id),equipped=profile.loadout[item.type]===item.id;
      const button=node('button','catalog-item');button.type='button';button.dataset.item=item.id;button.dataset.type=item.type;button.dataset.owned=String(Boolean(owned));
      button.setAttribute('aria-label',`${item.name}, ${equipped?'equipado':owned?'en tu colección':item.cost+' puntos'}. Ver detalle`);button.setAttribute('aria-pressed',String(this.selected?.id===item.id));button.setAttribute('aria-controls','shopDetail');
      const art=node('div','catalog-art');const canvas=document.createElement('canvas');canvas.width=280;canvas.height=180;canvas.setAttribute('aria-hidden','true');drawItemPreview(canvas,item,profile);
      art.append(canvas,node('span','catalog-badge',equipped?'✓ EN USO':owned?'✓ LO TENÉS':'🔒 NO LO TENÉS'));
      if(!owned){const lock=node('span','catalog-lock');lock.innerHTML=icon('LockKeyhole');lock.setAttribute('aria-hidden','true');art.append(lock);}
      const copy=node('div','catalog-copy');copy.append(node('strong','catalog-name',item.name),node('span','catalog-description',item.description));
      const footer=node('span','catalog-status');footer.innerHTML=icon(equipped?'CircleCheck':owned?'Check':'Coins');footer.append(node('span','',equipped?'Equipado':owned?'Listo para equipar':`${item.cost.toLocaleString('es-AR')} PT`),node('span','catalog-arrow','↗'));
      copy.append(footer);button.append(art,copy);
      button.onclick=()=>{
        this.selected=item;root.querySelectorAll('.catalog-item').forEach(card=>card.setAttribute('aria-pressed',String(card===button)));this.renderDetail();this.game.audio.play('navigate');
        if(matchMedia('(max-width: 760px)').matches){const detail=document.querySelector('#shopDetail');detail.scrollIntoView({behavior:this.game.reducedMotion?'instant':'smooth',block:'start'});detail.querySelector('h3')?.focus({preventScroll:true});}
      };root.append(button);
    }
    if(!items.length){
      const empty=node('div','shop-empty');empty.append(node('strong','','Nada por acá… todavía.'),node('p','',this.query||this.affordable?'Probá otra búsqueda o quitá los filtros.':'Descubrí nuevos artículos en la tienda para ampliar tu colección.'));
      const reset=node('button','pixel-button pixel-button--secondary',this.query||this.affordable?'QUITAR FILTROS':'IR A LA TIENDA');
      reset.onclick=()=>{this.resetFilters();this.setMode(false);};empty.append(reset);root.append(empty);
    }
    this.renderDetail();
  }
  renderDetail(){
    const root=document.querySelector('#shopDetail');root.replaceChildren();this.previewCanvas=null;const item=this.selected;
    if(!item){root.append(node('p','detail-placeholder','Elegí un artículo para verlo en el probador.'));return;}
    const profile=this.account.currentAccount();if(!profile)return;
    const owned=isOwned(profile,item.type,item.id),equipped=profile.loadout[item.type]===item.id;
    const top=node('div','detail-top');top.append(node('span','','EL PROBADOR'),node('span','detail-state',equipped?'EN USO':owned?'EN TU COLECCIÓN':'VISTA PREVIA'));
    const stage=node('div','detail-stage'),canvas=document.createElement('canvas');canvas.width=480;canvas.height=300;canvas.id='shopPreview';canvas.setAttribute('aria-label',`Vista previa de ${item.name}`);this.previewCanvas=canvas;
    stage.append(canvas,node('span','preview-caption',item.type==='accessory'?'Así queda en tu personaje':'Probalo. Encontrá tu estilo.'));
    const body=node('div','detail-body'),heading=node('h3','',item.name);heading.tabIndex=-1;body.append(heading,node('p','shop-description',item.description));
    if(item.type==='skin'){
      const stats=node('div','preview-stats'),skin=skins[item.id];
      for(const [label,value] of [['VIDA',skin.maxHp],['VELOCIDAD',skin.speed],['DEFENSA',skin.defense.toFixed(2)],['DAÑO',`${Math.round(skin.damageMultiplier*100)}%`],['PROYECTILES',`+${skin.extraProjectiles}`]]){const stat=node('span','');stat.append(node('small','',label),node('b','',String(value)));stats.append(stat);}body.append(stats);
    }
    if(item.type==='pet')body.append(node('p','pet-function',`FUNCIÓN · ${companions[item.id].detail}`));
    if(this.ownedOnly&&!owned){
      const locked=node('div','detail-action');locked.append(node('p','purchase-explainer','Todavía no lo tenés. Disponible para comprar en la tienda.'));
      root.append(top,stage,body,locked);drawItemPreview(canvas,item,profile);return;
    }
    const action=node('div','detail-action'),missing=Math.max(0,item.cost-profile.bank);
    action.append(node('p','purchase-explainer',equipped?'Ya forma parte de tu combo actual.':owned?'Es tuyo. Equiparlo no cuesta puntos.':missing?`Te faltan ${missing.toLocaleString('es-AR')} PT. Ganá puntos jugando partidas.`:`Tu saldo después de comprar: ${(profile.bank-item.cost).toLocaleString('es-AR')} PT.`));
    if(!owned){const progress=node('progress','purchase-progress');progress.max=item.cost;progress.value=Math.min(profile.bank,item.cost);progress.setAttribute('aria-label','Puntos disponibles para comprar este artículo');action.append(progress);}
    const button=node('button','pixel-button purchase-button');button.type='button';button.disabled=equipped||(!owned&&missing>0);
    button.innerHTML=icon(equipped?'CircleCheck':owned?'Shirt':'ShoppingBag');button.append(node('span','',equipped?'EQUIPADO':owned?'EQUIPAR':missing?'PUNTOS INSUFICIENTES':`COMPRAR Y EQUIPAR · ${item.cost} PT`));
    button.onclick=()=>{
      button.disabled=true;
      try{const alreadyOwned=isOwned(this.account.currentAccount(),item.type,item.id);if(!alreadyOwned)this.account.purchase(item.type,item.id);
        this.account.equip(item.type,item.id);this.game.audio.play('purchase');this.game.menu.prepareAccount();this.render();
        document.querySelector('#shopFeedback').textContent=`${item.name}: ${alreadyOwned?'equipado. ¡Listo para el turno!':'comprado y equipado. ¡Ya es tuyo!'}`;
        document.querySelector(`#shopGrid [data-item="${item.id}"]`)?.focus({preventScroll:true});
      }catch(error){document.querySelector('#shopFeedback').textContent=error.message;button.disabled=false;}
    };
    action.append(button);root.append(top,stage,body,action);drawItemPreview(canvas,item,profile);
  }
  update(time){if(this.previewCanvas&&this.selected)drawItemPreview(this.previewCanvas,this.selected,this.profile,this.game.reducedMotion?0:time);}
}
