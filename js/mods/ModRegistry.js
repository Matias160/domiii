import { gameEvents } from '../core/EventBus.js';
import { weapons } from '../data/weapons.js';
import { enemyTypes } from '../entities/Enemy.js';
import { abilities } from '../data/abilities.js';
import { skins } from '../data/skins.js';

/**
 * ModRegistry handles dynamic registration of game content from mods.
 */
export class ModRegistry {
  constructor() {
    this.mods = new Map();
    this.customWeapons = new Map();
    this.customEnemies = new Map();
    this.customSkills = new Map();
    this.customSkins = new Map();
  }

  /**
   * Register a new weapon.
   */
  registerWeapon(id, weaponDef) {
    const fullDef = { id, ...weaponDef };
    weapons[id] = fullDef;
    this.customWeapons.set(id, fullDef);
    gameEvents.emit('mod:weaponRegistered', { id, def: fullDef });
    return fullDef;
  }

  /**
   * Register a new enemy type.
   */
  registerEnemy(id, enemyDef) {
    const fullDef = { id, ...enemyDef };
    // Check if enemy already exists in array to avoid duplicates
    const idx = enemyTypes.findIndex(e => e.id === id);
    if (idx !== -1) {
      enemyTypes[idx] = fullDef;
    } else {
      enemyTypes.push(fullDef);
    }
    this.customEnemies.set(id, fullDef);
    gameEvents.emit('mod:enemyRegistered', { id, def: fullDef });
    return fullDef;
  }

  /**
   * Register a new ability / skill card.
   */
  registerAbility(id, abilityDef) {
    const fullDef = { id, ...abilityDef };
    const idx = abilities.findIndex(a => a.id === id);
    if (idx !== -1) {
      abilities[idx] = fullDef;
    } else {
      abilities.push(fullDef);
    }
    this.customSkills.set(id, fullDef);
    gameEvents.emit('mod:abilityRegistered', { id, def: fullDef });
    return fullDef;
  }

  /**
   * Register a custom player skin.
   */
  registerSkin(id, skinDef) {
    const fullDef = { id, ...skinDef };
    skins[id] = fullDef;
    this.customSkins.set(id, fullDef);
    gameEvents.emit('mod:skinRegistered', { id, def: fullDef });
    return fullDef;
  }

  /**
   * Add an event hook conveniently from a mod.
   */
  hook(eventName, handler, priority = 100) {
    return gameEvents.on(eventName, handler, priority);
  }
}

export const modRegistry = new ModRegistry();
