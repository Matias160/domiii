import { Player } from '../entities/Player.js';
import { Companion } from '../entities/Companion.js';
import { skins } from '../data/skins.js';
import { weapons } from '../data/weapons.js';
import { difficulties } from '../systems/enemySystem.js';
import { initializeDirector } from '../systems/directorSystem.js';
import { SpatialHashGrid } from './SpatialHashGrid.js';
import { SkillController } from '../skills/SkillSystem.js';

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
  player.accessory = setup.accessoryId || 'none';
  const a = player.accessory;
  // Accesorios Estándar
  if (a === 'headband') player.speed *= 1.07;
  if (a === 'shades') player.damageMultiplier *= 1.06;
  if (a === 'cyber_shades') player.damageMultiplier *= 1.08;
  if (a === 'red_bandana') player.speed *= 1.08;
  if (a === 'headphones') player.speed *= 1.06;
  if (a === 'neon_cap') { player.speed *= 1.05; player.damageMultiplier *= 1.05; }
  if (a === 'crown') { player.maxHp += 15; player.hp += 15; }
  if (a === 'blue_visor') player.projectileSpeedMultiplier = (player.projectileSpeedMultiplier || 1) * 1.15;
  if (a === 'magic_hat') player.attackCooldownMultiplier = (player.attackCooldownMultiplier || 1) * 0.90;
  if (a === 'void_hood') player.critChance = (player.critChance || 0) + 0.12;
  if (a === 'cyber_helmet') { player.maxHp += 15; player.hp += 15; player.defense = (player.defense || 0) + 0.05; }
  if (a === 'energy_halo') { player.maxHp += 12; player.hp += 12; player.damageMultiplier *= 1.06; }
  if (a === 'chef_hat') player.damageMultiplier *= 1.12;

  // Accesorios Legendarios (Señor Domi)
  if (a === 'leg_crown') { player.maxHp += 25; player.hp += 25; player.damageMultiplier *= 1.15; }
  if (a === 'leg_tiara') { player.speed *= 1.15; player.hpRegen = (player.hpRegen || 0) + 1; }
  if (a === 'leg_valkyrie') { player.maxHp += 15; player.hp += 15; player.damageMultiplier *= 1.20; }
  if (a === 'leg_visor') { player.critChance = (player.critChance || 0) + 0.20; player.magnetRadius = (player.magnetRadius || 80) * 1.5; }
  if (a === 'leg_void_crown') player.damageMultiplier *= 1.22;
  if (a === 'leg_crimson_cape') { player.maxHp += 25; player.hp += 25; player.damageMultiplier *= 1.10; }
  if (a === 'leg_angel_wings') { player.speed *= 1.22; player.dashCooldownMultiplier = 0.8; }
  if (a === 'leg_dragon_wings') player.damageMultiplier *= 1.25;
  if (a === 'leg_golden_staff') { player.damageMultiplier *= 1.15; player.bonusProjectiles = (player.bonusProjectiles || 0) + 1; }
  if (a === 'leg_golden_chalice') { player.maxHp += 35; player.hp += 35; }
  return state;
}
