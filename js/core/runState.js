import { Player } from '../entities/Player.js';
import { Companion } from '../entities/Companion.js';
import { skins } from '../data/skins.js';
import { weapons } from '../data/weapons.js';
import { difficulties } from '../systems/enemySystem.js';
import { initializeDirector } from '../systems/directorSystem.js';
import { SpatialHashGrid } from './SpatialHashGrid.js';
import { SkillController } from '../skills/SkillSystem.js';
import { resolveAccessory } from './accessories.js';

export function createRunState(setup = {}, audio = null) {
  const world = { width: 1920, height: 1080 };
  const player = new Player({
    name: setup.name || 'Pancho',
    skin: skins[setup.skinId] || skins.pancho,
    weapon: weapons[setup.weaponId] || weapons.fork,
    x: 960,
    y: 540
  });
  player.skills = new SkillController(player);

  const state = {
    player, audio,
    world,
    camera: { x: 480, y: 270 },
    companion: new Companion(setup.companionId, player),
    difficulty: difficulties[setup.difficultyId] || difficulties.picante,
    mapId: ['diner','kitchen','parking','snow','desert','football'].includes(setup.mapId) ? setup.mapId : 'diner',
    mapClock: 0, mapObstacles: [], wasFreezing: false, decoy: null, primeCooldowns: {q:0,e:0,r:0},
    modeId: setup.modeId,
    enemies: [], projectiles: [], enemyProjectiles: [], items: [], hazards: [], bossZones: [],
    particles: [], floaters: [], rings: [], dashGhosts: [], manualAim: false, aimPoint: null, target: null,
    bossIntro: null,
    spatialGrid: new SpatialHashGrid(120, 120, world.width, world.height),
    itemTimer: 4, pickups: {}, score: 0, time: 0, kills: 0, spawnTimer: .3,
    shake: 0, combo: 0, comboTime: 0, pendingLevels: 0, bossesKilled: 0, distance: 0,
  };
  initializeDirector(state);
  const resolvedAcc = resolveAccessory(setup.accessoryId);
  player.accessory = resolvedAcc ? resolvedAcc.id : 'none';
  const a = player.accessory;

  // --- Bonificaciones de Accesorios Estándar (8 reales de accesorios.png) ---
  if (a === 'bowtie') player.projectileSpeedMultiplier = (player.projectileSpeedMultiplier || 1) * 1.15;
  if (a === 'shades') player.damageMultiplier *= 1.08;
  if (a === 'party_hat') { player.speed *= 1.06; player.damageMultiplier *= 1.06; }
  if (a === 'cap') player.speed *= 1.10;
  if (a === 'headphones') player.speed *= 1.08;
  if (a === 'crown') { player.maxHp += 15; player.hp += 15; }
  if (a === 'top_hat') player.critChance = (player.critChance || 0) + 0.12;
  if (a === 'wizard_hat') player.fireRateMultiplier = (player.fireRateMultiplier || 1) * 1.12;

  // --- Accesorio Especial ---
  if (a === 'chef_hat') player.damageMultiplier *= 1.12;

  // --- Bonificaciones de Accesorios Legendarios (11 reliquias del Señor Domi) ---
  if (a === 'leg_crown') { player.maxHp += 25; player.hp += 25; player.damageMultiplier *= 1.15; }
  if (a === 'leg_halo') { player.speed *= 1.15; player.regen = (player.regen || 0) + 1.2; }
  if (a === 'leg_viking') { player.maxHp += 20; player.hp += 20; player.damageMultiplier *= 1.20; }
  if (a === 'leg_horns') { player.speed *= 1.08; player.damageMultiplier *= 1.28; }
  if (a === 'leg_visor') { player.critChance = (player.critChance || 0) + 0.20; player.magnetRadius = (player.magnetRadius || 80) * 1.6; }
  if (a === 'leg_archmage') { player.damageMultiplier *= 1.22; player.fireRateMultiplier = (player.fireRateMultiplier || 1) * 1.15; }
  if (a === 'leg_cape') { player.maxHp += 30; player.hp += 30; player.damageMultiplier *= 1.12; }
  if (a === 'leg_angel_wings') { player.speed *= 1.22; player.dashCooldownMultiplier = 0.78; }
  if (a === 'leg_fire_wings') { player.speed *= 1.12; player.damageMultiplier *= 1.25; }
  if (a === 'leg_excalibur') { player.damageMultiplier *= 1.18; player.extraProjectiles = (player.extraProjectiles || 0) + 1; }
  if (a === 'leg_medallion') { player.maxHp += 40; player.hp += 40; player.defense = (player.defense || 1) + 0.1; }

  // --- Sinergias Especiales Culinarias (Accesorios + Mascotas / Personajes) ---
  const pet = setup.companionId;
  const skin = setup.skinId;
  let activeSynergy = null;

  if (a === 'leg_fire_wings' && pet === 'parrilla') {
    activeSynergy = 'FUEGO ETERNO (Alas Fénix + Parrilla)';
    player.damageMultiplier *= 1.15;
    player.explosionDamage = (player.explosionDamage || 0) + 25;
  } else if ((a === 'crown' || a === 'leg_crown' || a === 'leg_cape') && skin === 'choripan') {
    activeSynergy = 'REALEZA CRIOLLA (Corona/Capa + Choripán)';
    player.maxHp += 25; player.hp += 25;
    player.damageMultiplier *= 1.10;
  } else if (a === 'chef_hat' && (pet === 'papas' || pet === 'parrilla')) {
    activeSynergy = 'COCINA MAESTRA (Gorro Chef + Mascota Culinaria)';
    player.fireRateMultiplier = (player.fireRateMultiplier || 1) * 1.15;
    player.regen = (player.regen || 0) + 0.8;
  } else if (a === 'leg_visor' && (skin === 'double' || skin === 'burger')) {
    activeSynergy = 'CYBER BURGER (Visor Láser + Hamburguesa)';
    player.critChance = (player.critChance || 0) + 0.15;
    player.speed *= 1.10;
  }

  if (activeSynergy) {
    state.synergy = activeSynergy;
    state.directorNotice = `¡SINERGIA ACTIVA: ${activeSynergy}!`;
    state.audio?.play('synergy');
  }

  return state;
}
