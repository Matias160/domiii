import { gameEvents } from '../core/EventBus.js';

/**
 * Universal Skill component and manager.
 * Can be attached to Player, Enemies, Bosses, or Companions.
 */
export class Skill {
  /**
   * @param {Object} config
   * @param {string} config.id Unique skill ID
   * @param {string} config.name Display name
   * @param {number} [config.cooldown] Cooldown in seconds (0 for passive/onHit)
   * @param {string} [config.castType] 'instant' | 'periodic' | 'passive' | 'onHit' | 'onDamaged'
   * @param {Object} [config.modifiers] Stat multipliers/bonuses (e.g. { damageMultiplier: 1.2 })
   * @param {(ctx: { source: any, target: any, state: any, delta?: number, eventBus?: any }) => boolean | void} config.execute Execution logic
   */
  constructor(config) {
    this.id = config.id;
    this.name = config.name || config.id;
    this.description = config.description || '';
    this.cooldown = config.cooldown || 0;
    this.castType = config.castType || 'instant';
    this.modifiers = config.modifiers || {};
    this.execute = config.execute || (() => true);
  }
}

export class SkillController {
  constructor(owner) {
    this.owner = owner;
    this.skills = new Map();
    this.cooldowns = new Map();
  }

  /**
   * Attach a skill.
   * @param {Skill} skill
   */
  addSkill(skill) {
    this.skills.set(skill.id, skill);
    this.cooldowns.set(skill.id, 0);

    // Apply permanent passive modifiers if any
    if (skill.modifiers && this.owner) {
      for (const [key, val] of Object.entries(skill.modifiers)) {
        if (typeof this.owner[key] === 'number') {
          this.owner[key] *= val;
        }
      }
    }

    gameEvents.emit('skill:equipped', { owner: this.owner, skill });
  }

  /**
   * Remove a skill.
   * @param {string} skillId
   */
  removeSkill(skillId) {
    const skill = this.skills.get(skillId);
    if (!skill) return;

    if (skill.modifiers && this.owner) {
      for (const [key, val] of Object.entries(skill.modifiers)) {
        if (typeof this.owner[key] === 'number' && val !== 0) {
          this.owner[key] /= val;
        }
      }
    }

    this.skills.delete(skillId);
    this.cooldowns.delete(skillId);
    gameEvents.emit('skill:unequipped', { owner: this.owner, skillId });
  }

  /**
   * Update cooldowns and trigger periodic skills.
   * @param {number} delta
   * @param {any} state
   */
  update(delta, state) {
    for (const [id, currentCd] of this.cooldowns.entries()) {
      if (currentCd > 0) {
        this.cooldowns.set(id, Math.max(0, currentCd - delta));
      }

      const skill = this.skills.get(id);
      if (skill && skill.castType === 'periodic' && this.cooldowns.get(id) <= 0) {
        this.cast(id, null, state);
      }
    }
  }

  /**
   * Execute skill.
   * @param {string} skillId
   * @param {any} [target]
   * @param {any} [state]
   * @returns {boolean} Whether casting was successful
   */
  cast(skillId, target = null, state = null) {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    const remaining = this.cooldowns.get(skillId) || 0;
    if (remaining > 0) return false;

    const eventResult = gameEvents.emit('beforeSkillCast', {
      owner: this.owner,
      skill,
      target,
      state
    });
    if (eventResult.cancelled) return false;

    skill.execute({ source: this.owner, target, state, eventBus: gameEvents });
    this.cooldowns.set(skillId, skill.cooldown);

    gameEvents.emit('afterSkillCast', { owner: this.owner, skill, target, state });
    return true;
  }

  getCooldown(skillId) {
    return this.cooldowns.get(skillId) || 0;
  }

  hasSkill(skillId) {
    return this.skills.has(skillId);
  }
}
