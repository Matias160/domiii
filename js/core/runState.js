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
  if (player.accessory === 'headband') player.speed *= 1.05;
  if (player.accessory === 'shades') player.damageMultiplier *= 1.05;
  if (player.accessory === 'crown') { player.maxHp += 10; player.hp += 10; }
  return state;
}
