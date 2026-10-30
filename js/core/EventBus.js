/**
 * High-performance, prioritized EventBus for core engine decoupling and Modding support.
 * Allows mods and skills to hook into, alter, or cancel game events safely.
 */
export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event with priority (higher priority runs first).
   * @param {string} eventName
   * @param {(data: any) => void} handler
   * @param {number} priority
   * @returns {() => void} Unsubscribe function
   */
  on(eventName, handler, priority = 100) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    const list = this.listeners.get(eventName);
    list.push({ handler, priority });
    list.sort((a, b) => b.priority - a.priority);
    return () => this.off(eventName, handler);
  }

  /**
   * Unsubscribe a handler from an event.
   */
  off(eventName, handler) {
    const list = this.listeners.get(eventName);
    if (!list) return;
    const idx = list.findIndex(entry => entry.handler === handler);
    if (idx !== -1) list.splice(idx, 1);
  }

  /**
   * Emit an event. Allows handlers to cancel or mutate event data.
   * @param {string} eventName
   * @param {any} eventData
   * @returns {any} Mutated eventData
   */
  emit(eventName, eventData = {}) {
    const list = this.listeners.get(eventName);
    if (!list || list.length === 0) return eventData;

    eventData.cancelled = false;
    eventData.cancel = () => { eventData.cancelled = true; };

    const len = list.length;
    for (let i = 0; i < len; i++) {
      list[i].handler(eventData);
      if (eventData.cancelled) break;
    }
    return eventData;
  }

  /**
   * Clear all listeners.
   */
  clear() {
    this.listeners.clear();
  }
}

export const gameEvents = new EventBus();
