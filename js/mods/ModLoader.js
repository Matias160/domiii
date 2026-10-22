import { modRegistry } from './ModRegistry.js';
import { gameEvents } from '../core/EventBus.js';

/**
 * ModLoader manages discovery and activation of user-generated content.
 */
export class ModLoader {
  constructor(registry = modRegistry, events = gameEvents) {
    this.registry = registry;
    this.events = events;
    this.loadedMods = new Map();
  }

  /**
   * Register and initialize a mod.
   * @param {Object} mod
   * @param {string} mod.id
   * @param {string} mod.name
   * @param {string} [mod.version]
   * @param {(ctx: { registry: typeof modRegistry, events: typeof gameEvents }) => void} mod.init
   */
  loadMod(mod) {
    if (!mod || !mod.id || !mod.init) {
      console.warn('[ModLoader] Invalid mod format:', mod);
      return false;
    }
    if (this.loadedMods.has(mod.id)) {
      console.warn(`[ModLoader] Mod ${mod.id} is already loaded.`);
      return false;
    }

    try {
      mod.init({ registry: this.registry, events: this.events });
      this.loadedMods.set(mod.id, mod);
      console.log(`[ModLoader] Successfully initialized mod: "${mod.name || mod.id}" v${mod.version || '1.0'}`);
      this.events.emit('mod:loaded', { mod });
      return true;
    } catch (err) {
      console.error(`[ModLoader] Failed to load mod "${mod.id}":`, err);
      return false;
    }
  }

  /**
   * Dynamically import an external mod script.
   * @param {string} url
   */
  async loadFromUrl(url) {
    try {
      const module = await import(url);
      const mod = module.default || module;
      return this.loadMod(mod);
    } catch (err) {
      console.error(`[ModLoader] Error importing mod from ${url}:`, err);
      return false;
    }
  }

  getLoadedMods() {
    return Array.from(this.loadedMods.values());
  }
}

export const modLoader = new ModLoader();
