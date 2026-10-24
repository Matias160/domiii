import {currentAccount, grantItem, equip} from '../systems/accountSystem.js';
import {shopItems, isOwned} from '../data/shop.js';
import {drawItemPreview, drawAccessoryIcon} from '../core/presentation.js';
import {icon, refreshIcons} from './icons.js';

const tabs = [
  ['missions', 'Misiones', 'Scroll'],
  ['advice', 'Consejos', 'MessageSquare'],
  ['collectibles', 'Colección', 'Star']
];

export const adviceList = [
  {
    id: 'adv_dash',
    category: 'movement',
    title: 'Acelerón Gourmet',
    badge: 'MOVIMIENTO',
    description: 'Espacio activa la embestida invulnerable: atraviesa masas de clientes sin recibir daño y daña a todos los enemigos que cruce. Recarga en 2.8 s.'
  },
  {
    id: 'adv_movement',
    category: 'movement',
    title: 'El Juego de Pies',
    badge: 'MOVIMIENTO',
    description: 'Mantenete siempre en círculos amplios. Nunca te arrincones contra mostradores ni paredes; juntá a los clientes en racimos.'
  },
  {
    id: 'adv_lighting',
    category: 'movement',
    title: 'Visión y Derrapes',
    badge: 'MOVIMIENTO',
    description: 'En el estacionamiento la luz neón refleja sobre el asfalto húmedo y las manchas de aceite alteran la tracción.'
  },
  {
    id: 'adv_skills',
    category: 'combat',
    title: 'Poderes Activos',
    badge: 'COMBATE',
    description: 'Se desbloquean por nivel de partida: Q al Nivel 5 (ráfaga radial), E al Nivel 10 (clon señuelo) y R al Nivel 15 (escudo de inmunidad).'
  },
  {
    id: 'adv_primes',
    category: 'combat',
    title: 'Habilidades Primarias',
    badge: 'COMBATE',
    description: 'Q desata una ráfaga radial en el Nivel 5, E invoca un clon señuelo en el Nivel 10 y R genera un escudo de invulnerabilidad temporal en el Nivel 15.'
  },
  {
    id: 'adv_evo',
    category: 'combat',
    title: 'Evolución de Armas',
    badge: 'COMBATE',
    description: 'Maximizá tu receta base para forjar su evolución definitiva dorada con disparos gigantes, charcos de salsa y ondas de choque.'
  },
  {
    id: 'adv_combos',
    category: 'combat',
    title: 'Racha de Combos',
    badge: 'COMBATE',
    description: 'Bajas consecutivas elevan el multiplicador a x1.5, x2.0 y x3.0. A las 30 bajas seguidas se activa Fiebre Arcade con velocidad extrema.'
  },
  {
    id: 'adv_pets',
    category: 'combat',
    title: 'Mascotas de Apoyo',
    badge: 'COMBATE',
    description: 'Equipá un compañero desde el lobby: atacan automáticamente, aplican salsa ralentizadora o generan zonas seguras para curarte.'
  }
];

export class DomiScreen {
  constructor(game) {
    this.game = game;
    this.type = 'missions';
    this.adviceFilter = 'all';
    this.selectedSlot = null;
    this.previewCanvas = null;

    document.querySelector('#domiBackButton')?.addEventListener('click', () => {
      this.game.showScreen('lobbyScreen');
    });
  }

  show(tab = 'missions') {
    this.type = tab;
    this.selectedSlot = null;
    const profile = currentAccount();
    if (!profile) {
      this.game.showScreen('authScreen');
      return;
    }
    const feedback = document.querySelector('#domiFeedback');
    if (feedback) feedback.textContent = '';
    this.render();
    this.game.showScreen('domiScreen');
    const screen = document.querySelector('#domiScreen');
    if (screen) screen.scrollTop = 0;
  }

  selectCategory(type) {
    this.type = type;
    this.selectedSlot = null;
    this.render();
    this.game.audio.play('navigate');
    document.querySelector(`#domiTabs [data-type="${type}"]`)?.focus({preventScroll: true});
  }

  getMissions(profile) {
    const runs = profile.runs || [];
    const maxLevel = runs.reduce((m, r) => Math.max(m, r.level || 0), 0);
    const maxKills = runs.reduce((m, r) => Math.max(m, r.kills || 0), 0);
    const maxCombo = runs.reduce((m, r) => Math.max(m, r.combo || 0), 0);
    const maxTime = runs.reduce((m, r) => Math.max(m, r.time || 0), 0);
    const totalKills = runs.reduce((sum, r) => sum + (r.kills || 0), 0);
    const totalRuns = runs.length;
    const totalBosses = runs.reduce((sum, r) => sum + (r.bossesKilled || 0), 0);

    return [
      {
        id: 'm_level5',
        type: 'mission',
        rewardType: 'accessory',
        rewardId: 'chef_hat',
        rewardName: 'Gorro de Chef',
        rewardTooltip: 'GORRO DE CHEF: +12% de daño permanente en combate (Especial Don Domi)',
        name: 'Prueba de Fuego',
        iconType: 'star',
        description: 'Sobrevive y alcanza el Nivel 5 en combate.',
        current: Math.min(5, maxLevel),
        target: 5,
        unit: 'Nivel',
        isDone: maxLevel >= 5,
        isClaimed: isOwned(profile, 'accessory', 'chef_hat'),
        claim: () => { grantItem('accessory', 'chef_hat'); }
      },
      {
        id: 'm_kills50',
        type: 'mission',
        rewardType: 'pet',
        rewardId: 'parrilla',
        rewardName: 'Mini Parrilla',
        rewardTooltip: 'MINI PARRILLA: Mascota ígnea que escupe ascuas a enemigos (Compañero)',
        name: 'Maestro Asador',
        iconType: 'skull',
        description: 'Elimina 50 clientes molestos en una sola partida.',
        current: Math.min(50, maxKills),
        target: 50,
        unit: 'KOs',
        isDone: maxKills >= 50,
        isClaimed: isOwned(profile, 'pet', 'parrilla'),
        claim: () => { grantItem('pet', 'parrilla'); }
      },
      {
        id: 'm_combo20',
        type: 'mission',
        rewardType: 'accessory',
        rewardId: 'leg_crown',
        rewardName: 'Corona Imperial',
        rewardTooltip: 'CORONA IMPERIAL: +25 Vida Máx y +15% Daño total (Legendario Don Domi)',
        name: 'Soberano del Local',
        iconType: 'crown',
        description: 'Encadena al menos 20 bajas seguidas en combo.',
        current: Math.min(20, maxCombo),
        target: 20,
        unit: 'Combo',
        isDone: maxCombo >= 20,
        isClaimed: isOwned(profile, 'accessory', 'leg_crown'),
        claim: () => { grantItem('accessory', 'leg_crown'); }
      },
      {
        id: 'm_time3min',
        type: 'mission',
        rewardType: 'accessory',
        rewardId: 'leg_halo',
        rewardName: 'Aureola Celestial',
        rewardTooltip: 'AUREOLA CELESTIAL: +15% Velocidad y Regeneración pasiva (Legendario Don Domi)',
        name: 'Luz de Medianoche',
        iconType: 'time',
        description: 'Sobrevive más de 3 minutos (180 s) bajo asedio.',
        current: Math.min(180, Math.floor(maxTime)),
        target: 180,
        unit: 'segundos',
        isDone: maxTime >= 180,
        isClaimed: isOwned(profile, 'accessory', 'leg_halo'),
        claim: () => { grantItem('accessory', 'leg_halo'); }
      },
      {
        id: 'm_kills100',
        type: 'mission',
        rewardType: 'accessory',
        rewardId: 'leg_viking',
        rewardName: 'Casco Vikingo',
        rewardTooltip: 'CASCO VIKINGO: +20% Daño masivo y +20 Vida (Legendario Don Domi)',
        name: 'Furia Nórdica',
        iconType: 'skull',
        description: 'Elimina 100 clientes molestos en una sola partida.',
        current: Math.min(100, maxKills),
        target: 100,
        unit: 'KOs',
        isDone: maxKills >= 100,
        isClaimed: isOwned(profile, 'accessory', 'leg_viking'),
        claim: () => { grantItem('accessory', 'leg_viking'); }
      },
      {
        id: 'm_combo35',
        type: 'mission',
        rewardType: 'accessory',
        rewardId: 'leg_horns',
        rewardName: 'Cuernos Demoníacos',
        rewardTooltip: 'CUERNOS DEMONÍACOS: +28% Daño puro y +8% Velocidad (Legendario Don Domi)',
        name: 'Fiebre Infernal',
        iconType: 'combo',
        description: 'Alcanza una racha de 35 bajas seguidas en combo.',
        current: Math.min(35, maxCombo),
        target: 35,
        unit: 'Combo',
        isDone: maxCombo >= 35,
        isClaimed: isOwned(profile, 'accessory', 'leg_horns'),
        claim: () => { grantItem('accessory', 'leg_horns'); }
      },
      {
        id: 'm_runs5',
        type: 'mission',
        rewardType: 'accessory',
        rewardId: 'leg_visor',
        rewardName: 'Visor Cibernético',
        rewardTooltip: 'VISOR CIBERNÉTICO: +20% Crítico y Súper Imán de botín (Legendario Don Domi)',
        name: 'Ojo de Halcón',
        iconType: 'god',
        description: 'Completa 5 turnos de servicio en cualquier modo.',
        current: Math.min(5, totalRuns),
        target: 5,
        unit: 'Turnos',
        isDone: totalRuns >= 5,
        isClaimed: isOwned(profile, 'accessory', 'leg_visor'),
        claim: () => { grantItem('accessory', 'leg_visor'); }
      },
      {
        id: 'm_level10',
        type: 'mission',
        rewardType: 'accessory',
        rewardId: 'leg_archmage',
        rewardName: 'Sombrero Arquimago',
        rewardTooltip: 'SOMBRERO DE ARQUIMAGO: +22% Daño y +15% Cadencia (Legendario Don Domi)',
        name: 'Alquimia Suprema',
        iconType: 'star',
        description: 'Alcanza el Nivel 10 en una partida.',
        current: Math.min(10, maxLevel),
        target: 10,
        unit: 'Nivel',
        isDone: maxLevel >= 10,
        isClaimed: isOwned(profile, 'accessory', 'leg_archmage'),
        claim: () => { grantItem('accessory', 'leg_archmage'); }
      },
      {
        id: 'm_totalkills300',
        type: 'mission',
        rewardType: 'accessory',
        rewardId: 'leg_cape',
        rewardName: 'Manto Real Carmesí',
        rewardTooltip: 'MANTO REAL CARMESÍ: +30 Vida Máx y +12% Daño (Legendario Don Domi)',
        name: 'Honor de la Casa',
        iconType: 'skull',
        description: 'Acumula 300 clientes atendidos entre todas tus partidas.',
        current: Math.min(300, totalKills),
        target: 300,
        unit: 'KOs Totales',
        isDone: totalKills >= 300,
        isClaimed: isOwned(profile, 'accessory', 'leg_cape'),
        claim: () => { grantItem('accessory', 'leg_cape'); }
      },
      {
        id: 'm_time4min',
        type: 'mission',
        rewardType: 'accessory',
        rewardId: 'leg_angel_wings',
        rewardName: 'Alas de Ángel',
        rewardTooltip: 'ALAS DE ÁNGEL: +22% Velocidad y recarga de acelerón reducida (Legendario Don Domi)',
        name: 'Vuelo del Maestro',
        iconType: 'time',
        description: 'Sobrevive 4 minutos (240 s) continuos en el tablero.',
        current: Math.min(240, Math.floor(maxTime)),
        target: 240,
        unit: 'segundos',
        isDone: maxTime >= 240,
        isClaimed: isOwned(profile, 'accessory', 'leg_angel_wings'),
        claim: () => { grantItem('accessory', 'leg_angel_wings'); }
      },
      {
        id: 'm_level8',
        type: 'mission',
        rewardType: 'accessory',
        rewardId: 'leg_fire_wings',
        rewardName: 'Alas de Fénix Ígneo',
        rewardTooltip: 'ALAS DE FÉNIX ÍGNEO: +25% Daño y +12% Velocidad (Legendario Don Domi)',
        name: 'Horno Solar',
        iconType: 'star',
        description: 'Alcanza el Nivel 8 en combate.',
        current: Math.min(8, maxLevel),
        target: 8,
        unit: 'Nivel',
        isDone: maxLevel >= 8,
        isClaimed: isOwned(profile, 'accessory', 'leg_fire_wings'),
        claim: () => { grantItem('accessory', 'leg_fire_wings'); }
      },
      {
        id: 'm_boss1',
        type: 'mission',
        rewardType: 'accessory',
        rewardId: 'leg_excalibur',
        rewardName: 'Espada Excalibur',
        rewardTooltip: 'ESPADA DORADA EXCALIBUR: +1 Proyectil Extra y +18% Daño (Legendario Don Domi)',
        name: 'Mandato Culinario',
        iconType: 'star',
        description: 'Derrota a un Gran Jefe de la Cocina en turno.',
        current: Math.min(1, totalBosses),
        target: 1,
        unit: 'Jefe',
        isDone: totalBosses >= 1,
        isClaimed: isOwned(profile, 'accessory', 'leg_excalibur'),
        claim: () => { grantItem('accessory', 'leg_excalibur'); }
      },
      {
        id: 'm_boss3',
        type: 'mission',
        rewardType: 'accessory',
        rewardId: 'leg_medallion',
        rewardName: 'Medallón Rubí Sagrado',
        rewardTooltip: 'MEDALLÓN RUBÍ SAGRADO: +40 Vida Máxima y blindaje real (Legendario Don Domi)',
        name: 'Campeón de Jefes',
        iconType: 'god',
        description: 'Derrota a 3 Grandes Jefes acumulados en tus partidas.',
        current: Math.min(3, totalBosses),
        target: 3,
        unit: 'Jefes',
        isDone: totalBosses >= 3,
        isClaimed: isOwned(profile, 'accessory', 'leg_medallion'),
        claim: () => { grantItem('accessory', 'leg_medallion'); }
      }
    ];
  }

  getCollectionSlots(profile) {
    return [
      { id: 'pancho', type: 'skin', name: 'Pancho Clásico', category: 'CHEF', stats: { hp: '100', spd: '100', dmg: '100', perk: 'Disparo Balanceado' }, desc: 'El héroe del mostrador. Preciso y confiable.', lockText: 'INICIAL', isUnlocked: true },
      { id: 'nugget', type: 'skin', name: 'Nugget Veloz', category: 'CHEF', stats: { hp: '80', spd: '130', dmg: '90', perk: '+30% Velocidad' }, desc: 'Escurridizo entre las comandas rápidas.', lockText: '450 PT', isUnlocked: isOwned(profile, 'skin', 'nugget') },
      { id: 'papas', type: 'skin', name: 'Papas Fritas', category: 'CHEF', stats: { hp: '90', spd: '105', dmg: '110', perk: '+1 Proyectil' }, desc: 'Lluvia constante de bastones dorados.', lockText: '650 PT', isUnlocked: isOwned(profile, 'skin', 'papas') },
      { id: 'pizza', type: 'skin', name: 'Pizza Suprema', category: 'CHEF', stats: { hp: '130', spd: '90', dmg: '120', perk: 'Resistencia Máx' }, desc: 'Masa gruesa que absorbe castigo pesado.', lockText: '850 PT', isUnlocked: isOwned(profile, 'skin', 'pizza') },
      { id: 'empanada', type: 'skin', name: 'Empanada Criolla', category: 'CHEF', stats: { hp: '110', spd: '115', dmg: '105', perk: 'Defensa Blindada' }, desc: 'Repulgue de acero y esquiva rápida.', lockText: '950 PT', isUnlocked: isOwned(profile, 'skin', 'empanada') },
      { id: 'choripan', type: 'skin', name: 'Choripán Bravo', category: 'CHEF', stats: { hp: '120', spd: '95', dmg: '140', perk: 'Cazajefes' }, desc: 'Impacto brutal con chimichurri picante.', lockText: '1600 PT', isUnlocked: isOwned(profile, 'skin', 'choripan') },
      { id: 'parrilla', type: 'pet', name: 'Mini Parrilla', category: 'MASCOTA', stats: { hp: 'AUTO', spd: 'ALTO', dmg: '85', perk: 'Lanza Brasas' }, desc: 'Compañero ígneo exclusivo de Don Domi.', lockText: 'Misión 50 KOs', isUnlocked: isOwned(profile, 'pet', 'parrilla') },
      { id: 'ketchup', type: 'pet', name: 'Mini Ketchup', category: 'MASCOTA', stats: { hp: 'AUTO', spd: 'MED', dmg: '45', perk: 'Charcos Lentos' }, desc: 'Frena el avance de masas de clientes.', lockText: '700 PT', isUnlocked: isOwned(profile, 'pet', 'ketchup') },
      { id: 'drone', type: 'pet', name: 'Dron Delivery', category: 'MASCOTA', stats: { hp: 'AUTO', spd: 'MAX', dmg: '65', perk: 'Imán + Rayos' }, desc: 'Atrae ingredientes y descarga voltios.', lockText: '850 PT', isUnlocked: isOwned(profile, 'pet', 'drone') },
      { id: 'taco', type: 'pet', name: 'Taco Guardián', category: 'MASCOTA', stats: { hp: 'AUTO', spd: 'MED', dmg: '75', perk: 'Escudo Frontal' }, desc: 'Bloquea proyectiles e impactos directos.', lockText: '950 PT', isUnlocked: isOwned(profile, 'pet', 'taco') },
      { id: 'chef_hat', type: 'accessory', name: 'Gorro de Chef', category: 'ACCESORIO', stats: { hp: '-', spd: '-', dmg: '+12%', perk: '+12% Daño Total' }, desc: 'Gorro artesanal concedido por Don Domi.', lockText: 'Misión Nivel 5', isUnlocked: isOwned(profile, 'accessory', 'chef_hat') },
      { id: 'leg_crown', type: 'accessory', name: 'Corona Imperial', category: 'LEGENDARIO', stats: { hp: '+25', spd: '-', dmg: '+15%', perk: '+25 HP +15% Dmg' }, desc: 'Símbolo del amo absoluto del local.', lockText: 'Misión Combo 20', isUnlocked: isOwned(profile, 'accessory', 'leg_crown') },
      { id: 'leg_halo', type: 'accessory', name: 'Aureola Celestial', category: 'LEGENDARIO', stats: { hp: 'REGEN', spd: '+15%', dmg: '-', perk: '+15% Spd +Regen' }, desc: 'Bendición culinaria con regeneración pasiva.', lockText: 'Misión 3 Min', isUnlocked: isOwned(profile, 'accessory', 'leg_halo') },
      { id: 'leg_viking', type: 'accessory', name: 'Casco Vikingo', category: 'LEGENDARIO', stats: { hp: '+20', spd: '-', dmg: '+20%', perk: '+20 HP +20% Dmg' }, desc: 'Yelmo nórdico para batallas voraces.', lockText: 'Misión 100 KOs', isUnlocked: isOwned(profile, 'accessory', 'leg_viking') },
      { id: 'leg_horns', type: 'accessory', name: 'Cuernos Demoníacos', category: 'LEGENDARIO', stats: { hp: '-', spd: '+8%', dmg: '+28%', perk: '+28% Daño Puro' }, desc: 'Forjados en las brasas del infierno.', lockText: 'Misión Combo 35', isUnlocked: isOwned(profile, 'accessory', 'leg_horns') },
      { id: 'leg_visor', type: 'accessory', name: 'Visor Cibernético', category: 'LEGENDARIO', stats: { hp: '-', spd: '-', dmg: '+20% Crit', perk: '+20% Crit +Imán' }, desc: 'Óptica láser esmeralda de Don Domi.', lockText: 'Misión 5 Turnos', isUnlocked: isOwned(profile, 'accessory', 'leg_visor') },
      { id: 'leg_archmage', type: 'accessory', name: 'Sombrero de Arquimago', category: 'LEGENDARIO', stats: { hp: '-', spd: '-', dmg: '+22%', perk: '+22% Dmg +Cadencia' }, desc: 'Reliquia estelar de la cocina arcana.', lockText: 'Misión Nivel 10', isUnlocked: isOwned(profile, 'accessory', 'leg_archmage') },
      { id: 'leg_cape', type: 'accessory', name: 'Manto Real Carmesí', category: 'LEGENDARIO', stats: { hp: '+30', spd: '-', dmg: '+12%', perk: '+30 HP +12% Dmg' }, desc: 'Manto de terciopelo real y cuello de armiño.', lockText: 'Misión 300 KOs', isUnlocked: isOwned(profile, 'accessory', 'leg_cape') },
      { id: 'leg_angel_wings', type: 'accessory', name: 'Alas de Ángel', category: 'LEGENDARIO', stats: { hp: '-', spd: '+22%', dmg: '-', perk: '+22% Spd -Recarga' }, desc: 'Plumas sagradas sobre el aceite hirviendo.', lockText: 'Misión 4 Min', isUnlocked: isOwned(profile, 'accessory', 'leg_angel_wings') },
      { id: 'leg_fire_wings', type: 'accessory', name: 'Alas de Fénix Ígneo', category: 'LEGENDARIO', stats: { hp: '-', spd: '+12%', dmg: '+25%', perk: '+25% Dmg +12% Spd' }, desc: 'Envergadura de fuego que calcina comandas.', lockText: 'Misión Nivel 8', isUnlocked: isOwned(profile, 'accessory', 'leg_fire_wings') },
      { id: 'leg_excalibur', type: 'accessory', name: 'Espada Dorada Excalibur', category: 'LEGENDARIO', stats: { hp: '-', spd: '-', dmg: '+18% +1Proy', perk: '+1 Proyectil Extra' }, desc: 'Hoja sagrada de soberanía gastronómica.', lockText: 'Vencer 1 Jefe', isUnlocked: isOwned(profile, 'accessory', 'leg_excalibur') },
      { id: 'leg_medallion', type: 'accessory', name: 'Medallón Rubí Sagrado', category: 'LEGENDARIO', stats: { hp: '+40', spd: '-', dmg: '-', perk: '+40 Vida +Defensa' }, desc: 'Joya real encantada por el Señor Domi.', lockText: 'Vencer 3 Jefes', isUnlocked: isOwned(profile, 'accessory', 'leg_medallion') }
    ];
  }

  render() {
    this.profile = currentAccount();
    if (!this.profile) return;
    const profile = this.profile;

    const bankEl = document.querySelector('#domiBank');
    if (bankEl) bankEl.textContent = profile.bank.toLocaleString('es-AR');

    // Tabs
    const tabsRoot = document.querySelector('#domiTabs');
    if (tabsRoot) {
      tabsRoot.replaceChildren();
      for (const [id, label, symbol] of tabs) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = id === this.type ? 'active' : '';
        btn.dataset.type = id;
        btn.innerHTML = `${icon(symbol)} <span>${label}</span>`;
        btn.setAttribute('aria-pressed', String(id === this.type));
        btn.onclick = () => this.selectCategory(id);
        tabsRoot.append(btn);
      }
    }

    const container = document.querySelector('#domiContent');
    if (!container) return;
    container.replaceChildren();

    if (this.type === 'missions') {
      this.renderMissions(container, profile);
    } else if (this.type === 'advice') {
      this.renderAdvice(container);
    } else if (this.type === 'collectibles') {
      this.renderCollectibles(container, profile);
    }

    refreshIcons();
  }

  /* =========================================================================
     1. MISIONES: Barra gruesa cian/oro y lista vertical ordenada
     ========================================================================= */
  renderMissions(container, profile) {
    this.previewCanvas = null;
    const missions = this.getMissions(profile);
    const claimedCount = missions.filter(m => m.isClaimed).length;
    const pct = Math.round((claimedCount / missions.length) * 100);

    const header = document.createElement('div');
    header.className = 'domi-missions-header';
    header.innerHTML = `
      <div class="domi-progress-title-row">
        <span class="domi-progress-label">REGISTRO DE MISIONES</span>
        <b class="domi-progress-count">(${claimedCount} / ${missions.length})</b>
      </div>
      <div class="domi-progress-bar-thick" role="progressbar" aria-valuenow="${claimedCount}" aria-valuemin="0" aria-valuemax="${missions.length}">
        <div class="domi-progress-fill-thick" style="width: ${pct}%;"></div>
      </div>
    `;
    container.append(header);

    const list = document.createElement('div');
    list.className = 'domi-missions-list';

    for (const m of missions) {
      const card = document.createElement('div');
      card.className = `domi-mission-card ${m.isClaimed ? 'is-claimed' : m.isDone ? 'is-done' : 'is-progress'}`;

      const iconBox = document.createElement('div');
      iconBox.className = 'domi-mission-icon-box';
      iconBox.innerHTML = this.getMissionIcon(m.iconType);

      const center = document.createElement('div');
      center.className = 'domi-mission-center';
      const mPct = Math.min(100, Math.round((m.current / m.target) * 100));
      center.innerHTML = `
        <div class="domi-mission-head">
          <strong class="domi-mission-title">${m.name}</strong>
          <span class="domi-mission-ratio">${m.current}/${m.target} ${m.unit}</span>
        </div>
        <p class="domi-mission-desc">${m.description}</p>
        <div class="domi-mission-mini-bar">
          <div class="domi-mini-fill" style="width: ${mPct}%;"></div>
        </div>
      `;

      const right = document.createElement('div');
      right.className = 'domi-mission-right';

      const rewardWrap = document.createElement('div');
      rewardWrap.className = 'domi-reward-wrap';

      const badge = document.createElement('span');
      badge.className = 'domi-reward-badge';
      badge.textContent = m.rewardName;

      const tooltip = document.createElement('div');
      tooltip.className = 'domi-pixel-tooltip';
      tooltip.textContent = m.rewardTooltip || m.rewardName;

      rewardWrap.append(badge, tooltip);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pixel-button domi-claim-btn';

      if (m.isClaimed) {
        btn.disabled = true;
        btn.classList.add('btn-claimed');
        btn.textContent = '✓ RECLAMADA';
      } else if (m.isDone) {
        btn.classList.add('pixel-button--claim');
        btn.textContent = '¡RECLAMAR!';
        btn.onclick = () => {
          btn.disabled = true;
          m.claim();
          this.game.audio.play('levelUp');
          this.game.menu?.prepareAccount?.();
          this.game.showToast?.(`¡RECOMPENSA OBTENIDA: ${m.rewardName}!`);
          const fb = document.querySelector('#domiFeedback');
          if (fb) fb.textContent = `¡Excelente trabajo! Desbloqueaste: ${m.rewardName}.`;
          this.render();
        };
      } else {
        btn.disabled = true;
        btn.classList.add('btn-locked');
        btn.textContent = 'EN CURSO';
      }

      right.append(rewardWrap, btn);
      card.append(iconBox, center, right);
      list.append(card);
    }

    container.append(list);
  }

  getMissionIcon(type) {
    if (type === 'star') {
      return `<svg viewBox="0 0 16 16" width="24" height="24" shape-rendering="crispEdges"><rect x="7" y="1" width="2" height="3" fill="#ffe066"/><rect x="5" y="4" width="6" height="3" fill="#ffe066"/><rect x="1" y="6" width="14" height="3" fill="#ffd000"/><rect x="3" y="9" width="10" height="3" fill="#ffd000"/><rect x="2" y="12" width="4" height="3" fill="#e69900"/><rect x="10" y="12" width="4" height="3" fill="#e69900"/></svg>`;
    }
    if (type === 'skull') {
      return `<svg viewBox="0 0 16 16" width="24" height="24" shape-rendering="crispEdges"><rect x="4" y="2" width="8" height="8" fill="#e2e8f0"/><rect x="2" y="4" width="12" height="5" fill="#e2e8f0"/><rect x="4" y="5" width="2" height="3" fill="#0f172a"/><rect x="10" y="5" width="2" height="3" fill="#0f172a"/><rect x="5" y="11" width="6" height="3" fill="#cbd5e1"/><rect x="6" y="12" width="1" height="2" fill="#0f172a"/><rect x="8" y="12" width="1" height="2" fill="#0f172a"/></svg>`;
    }
    if (type === 'god') {
      return `<svg viewBox="0 0 16 16" width="24" height="24" shape-rendering="crispEdges"><circle cx="8" cy="8" r="6" fill="#38bdf8" opacity="0.3"/><rect x="7" y="2" width="2" height="12" fill="#ffe066"/><rect x="2" y="7" width="12" height="2" fill="#ffe066"/><rect x="4" y="4" width="8" height="8" fill="#fff" opacity="0.8"/></svg>`;
    }
    if (type === 'combo') {
      return `<svg viewBox="0 0 16 16" width="24" height="24" shape-rendering="crispEdges"><rect x="6" y="1" width="4" height="3" fill="#f97316"/><rect x="4" y="4" width="8" height="4" fill="#fbbf24"/><rect x="3" y="7" width="10" height="6" fill="#ef4444"/><rect x="6" y="9" width="4" height="4" fill="#fef08a"/></svg>`;
    }
    return `<svg viewBox="0 0 16 16" width="24" height="24" shape-rendering="crispEdges"><rect x="3" y="2" width="10" height="2" fill="#94a3b8"/><rect x="5" y="4" width="6" height="3" fill="#38bdf8"/><rect x="7" y="7" width="2" height="2" fill="#22d3ee"/><rect x="5" y="9" width="6" height="3" fill="#38bdf8"/><rect x="3" y="12" width="10" height="2" fill="#94a3b8"/></svg>`;
  }

  /* =========================================================================
     2. CONSEJOS: Filtros superiores ("Todos", "Combate", "Movimientos") y tickets
     ========================================================================= */
  renderAdvice(container) {
    this.previewCanvas = null;

    const filtersBar = document.createElement('div');
    filtersBar.className = 'domi-advice-filters';
    filtersBar.innerHTML = `
      <button type="button" class="pixel-button btn-filter ${this.adviceFilter === 'all' ? 'active' : ''}" data-filter="all">TODOS</button>
      <button type="button" class="pixel-button btn-filter ${this.adviceFilter === 'combat' ? 'active' : ''}" data-filter="combat">COMBATE</button>
      <button type="button" class="pixel-button btn-filter ${this.adviceFilter === 'movement' ? 'active' : ''}" data-filter="movement">MOVIMIENTOS</button>
    `;

    filtersBar.querySelectorAll('button').forEach(b => {
      b.onclick = () => {
        this.adviceFilter = b.dataset.filter;
        this.game.audio.play('navigate');
        this.render();
      };
    });
    container.append(filtersBar);

    const list = document.createElement('div');
    list.className = 'domi-tickets-list';

    const filtered = adviceList.filter(a => this.adviceFilter === 'all' || a.category === this.adviceFilter);

    filtered.forEach((adv, idx) => {
      const ticket = document.createElement('div');
      ticket.className = 'domi-recipe-ticket';

      const artBox = document.createElement('div');
      artBox.className = 'domi-ticket-art';
      artBox.innerHTML = adv.category === 'movement'
        ? `<svg viewBox="0 0 24 24" width="32" height="32" shape-rendering="crispEdges"><rect x="3" y="11" width="5" height="2" fill="#38bdf8"/><polygon points="14,2 7,13 13,13 10,22 20,10 14,10" fill="#22d3ee"/><polygon points="14,4 9,12 13,12 11,19 18,11 14,11" fill="#ffe066"/></svg>`
        : `<svg viewBox="0 0 24 24" width="32" height="32" shape-rendering="crispEdges"><rect x="10" y="2" width="4" height="2" fill="#fbbf24"/><rect x="8" y="4" width="8" height="4" fill="#f59e0b"/><rect x="4" y="8" width="16" height="5" fill="#ef4444"/><rect x="7" y="13" width="10" height="4" fill="#fbbf24"/><rect x="10" y="17" width="4" height="5" fill="#e2e8f0"/></svg>`;

      const body = document.createElement('div');
      body.className = 'domi-ticket-body';
      body.innerHTML = `
        <div class="domi-ticket-badge-row">
          <span class="ticket-tag">RECETA #${idx + 1}</span>
          <span class="ticket-cat">${adv.badge}</span>
        </div>
        <strong class="domi-ticket-title">${adv.title}</strong>
        <p class="domi-ticket-desc">${adv.description}</p>
      `;

      ticket.append(artBox, body);
      list.append(ticket);
    });

    container.append(list);
  }

  /* =========================================================================
     3. COLECCIÓN: Grilla 4x3 de ranuras oscuras + Pedestal de exhibición
     ========================================================================= */
  renderCollectibles(container, profile) {
    const slots = this.getCollectionSlots(profile);
    if (!this.selectedSlot || !slots.some(s => s.id === this.selectedSlot.id)) {
      this.selectedSlot = slots[0];
    }
    const current = this.selectedSlot;

    const layout = document.createElement('div');
    layout.className = 'domi-collection-layout';

    const grid = document.createElement('div');
    grid.className = 'domi-grid-4x3';

    for (const slot of slots) {
      const slotBtn = document.createElement('button');
      slotBtn.type = 'button';
      slotBtn.className = `domi-slot ${slot.isUnlocked ? 'is-unlocked' : 'is-locked'} ${current.id === slot.id ? 'is-selected' : ''}`;
      slotBtn.setAttribute('aria-pressed', String(current.id === slot.id));
      slotBtn.title = slot.name;

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      canvas.className = 'domi-slot-canvas';
      this.drawSlotIcon(canvas, slot, profile);

      slotBtn.append(canvas);

      if (!slot.isUnlocked) {
        const lockOverlay = document.createElement('div');
        lockOverlay.className = 'domi-slot-lock';
        lockOverlay.innerHTML = `
          <svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges">
            <rect x="5" y="3" width="6" height="4" fill="#ffe066" opacity="0.8"/>
            <rect x="4" y="6" width="8" height="7" fill="#f59e0b"/>
            <rect x="7" y="8" width="2" height="3" fill="#0f172a"/>
          </svg>
          <span class="domi-lock-label">${slot.lockText}</span>
        `;
        slotBtn.append(lockOverlay);
      }

      slotBtn.onclick = () => {
        this.selectedSlot = slot;
        this.renderCollectibles(container, profile);
        this.game.audio.play('navigate');
      };

      grid.append(slotBtn);
    }

    const panel = document.createElement('aside');
    panel.className = 'domi-pedestal-panel';

    const stage = document.createElement('div');
    stage.className = 'domi-pedestal-stage';
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = 320;
    previewCanvas.height = 220;
    previewCanvas.id = 'domiPreview';
    this.previewCanvas = previewCanvas;
    stage.append(previewCanvas);

    const badge = document.createElement('span');
    badge.className = 'domi-pedestal-cat-badge';
    badge.textContent = `${current.category} · ${current.isUnlocked ? 'DESBLOQUEADO' : 'BLOQUEADO'}`;
    stage.append(badge);

    const body = document.createElement('div');
    body.className = 'domi-pedestal-body';
    body.innerHTML = `
      <strong class="domi-pedestal-title">${current.name}</strong>
      <p class="domi-pedestal-desc">${current.desc}</p>
      <div class="domi-pedestal-stats">
        <div class="stat-box"><small>VIDA</small><b>${current.stats.hp}</b></div>
        <div class="stat-box"><small>VEL</small><b>${current.stats.spd}</b></div>
        <div class="stat-box"><small>DAÑO</small><b>${current.stats.dmg}</b></div>
      </div>
      <div class="stat-perk">
        <small>EFECTO ESPECIAL</small>
        <b>${current.stats.perk}</b>
      </div>
    `;

    const action = document.createElement('div');
    action.className = 'domi-pedestal-action';
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'pixel-button domi-action-btn';

    if (current.isUnlocked) {
      if (current.type === 'accessory') {
        const isEquipped = profile.loadout?.accessory === current.id;
        actionBtn.textContent = isEquipped ? '✓ EN USO' : 'EQUIPAR ACCESORIO';
        actionBtn.disabled = isEquipped;
        actionBtn.onclick = () => {
          equip('accessory', current.id);
          this.game.menu?.prepareAccount?.();
          this.game.audio.play('purchase');
          this.render();
        };
      } else {
        actionBtn.textContent = current.type === 'skin' ? 'VER EN ARMARIO' : 'VER MASCOTAS';
        actionBtn.onclick = () => {
          if (current.type === 'skin') this.game.shop.show('skin', true);
          else if (current.type === 'pet') this.game.shop.show('pet', true);
        };
      }
    } else {
      actionBtn.disabled = true;
      actionBtn.textContent = `BLOQUEADO (${current.lockText})`;
    }
    action.append(actionBtn);

    panel.append(stage, body, action);
    layout.append(grid, panel);
    container.append(layout);

    this.drawPedestalPreview(previewCanvas, current, profile);
  }

  drawSlotIcon(canvas, slot, profile) {
    const c = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    c.clearRect(0, 0, w, h);
    c.imageSmoothingEnabled = false;

    if (!slot.isUnlocked) {
      c.save();
      c.filter = 'brightness(0.22) contrast(1.2)';
    }

    if (slot.type === 'accessory') {
      // Fondo oscuro de casilla con resplandor sutil
      const bg = c.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.55);
      bg.addColorStop(0, slot.category === 'LEGENDARIO' ? '#2c1f0e' : '#132830');
      bg.addColorStop(1, '#081115');
      c.fillStyle = bg;
      c.fillRect(0, 0, w, h);
      drawAccessoryIcon(c, slot.id, w / 2, h / 2, 48);
    } else {
      drawItemPreview(canvas, { type: slot.type, id: slot.id, name: slot.name }, profile, 0);
    }

    if (!slot.isUnlocked) {
      c.restore();
    }
  }

  drawPedestalPreview(canvas, item, profile, time = 0) {
    const c = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    c.clearRect(0, 0, w, h);

    c.save();
    if (!item.isUnlocked) {
      c.filter = 'brightness(0.3) saturate(0.2)';
    }

    if (item.id === 'domi') {
      this.drawDomiCharacter(c, w / 2, h * 0.65, 2.2, time);
    } else {
      drawItemPreview(canvas, { type: item.type, id: item.id, name: item.name }, profile, time);
    }
    c.restore();
  }

  drawDomiCharacter(c, cx, cy, scale = 2, time = 0) {
    c.save();
    c.translate(cx, cy + Math.sin(time * 3) * 3);
    c.scale(scale, scale);

    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(0, 10, 18, 5, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#f59e0b';
    c.beginPath();
    c.arc(0, 4, 18, Math.PI, 0, false);
    c.closePath();
    c.fill();
    c.strokeStyle = '#92400e';
    c.lineWidth = 2;
    c.stroke();

    c.fillStyle = '#fde68a';
    for (let a = Math.PI; a <= 0.05; a += Math.PI / 6.5) {
      const rx = Math.cos(a) * 18;
      const ry = 4 - Math.sin(a) * 18;
      c.fillRect(rx - 1.5, ry - 1.5, 3, 3);
    }

    c.fillStyle = '#f43f5e';
    c.fillRect(-11, 4, 4, 2);
    c.fillRect(7, 4, 4, 2);

    const blink = Math.sin(time * 1.5) > 0.96;
    c.fillStyle = '#0a0f14';
    if (blink) {
      c.fillRect(-8, 1, 3, 1);
      c.fillRect(5, 1, 3, 1);
    } else {
      c.fillRect(-8, 0, 3, 4);
      c.fillRect(5, 0, 3, 4);
      c.fillStyle = '#ffffff';
      c.fillRect(-8, 0, 1, 1);
      c.fillRect(5, 0, 1, 1);
    }

    c.fillStyle = '#78350f';
    c.fillRect(-5, 6, 10, 2);
    c.fillRect(-2, 8, 4, 2);

    c.fillStyle = '#ffffff';
    c.fillRect(-13, -18, 26, 7);
    c.fillRect(-17, -27, 34, 10);
    c.fillRect(-11, -33, 22, 7);
    c.strokeStyle = '#cbd5e1';
    c.lineWidth = 1;
    c.strokeRect(-17, -27, 34, 10);
    c.fillStyle = '#94a3b8';
    c.fillRect(-8, -24, 2, 7);
    c.fillRect(0, -25, 2, 8);
    c.fillRect(7, -24, 2, 7);

    const steamY = -36 - ((time * 20) % 18);
    const steamAlpha = Math.max(0, 1 - ((time * 20) % 18) / 18);
    c.fillStyle = `rgba(255, 255, 255, ${steamAlpha * 0.7})`;
    c.beginPath();
    c.arc(-4 + Math.sin(time * 4) * 3, steamY, 3, 0, Math.PI * 2);
    c.arc(4 + Math.cos(time * 4) * 3, steamY - 4, 2.5, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  update(time) {
    if (this.previewCanvas && this.type === 'collectibles' && this.selectedSlot) {
      this.drawPedestalPreview(this.previewCanvas, this.selectedSlot, this.profile, this.game.reducedMotion ? 0 : time);
    }
  }
}
