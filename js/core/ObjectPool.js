/**
 * High-performance, zero-allocation Object Pool.
 * Pre-allocates objects and recycles them to avoid Garbage Collection spikes.
 */
export class ObjectPool {
  /**
   * @param {() => any} factoryFn Function that creates a fresh object instance.
   * @param {(obj: any) => void} resetFn Function that cleans up an object before returning to pool.
   * @param {number} initialCapacity Number of pre-allocated instances.
   * @param {number} maxCapacity Maximum capacity to prevent memory bloat.
   */
  constructor(factoryFn, resetFn = () => {}, initialCapacity = 256, maxCapacity = 4096) {
    this.factoryFn = factoryFn;
    this.resetFn = resetFn;
    this.maxCapacity = maxCapacity;
    this.pool = new Array(initialCapacity);
    this.size = initialCapacity;

    for (let i = 0; i < initialCapacity; i++) {
      this.pool[i] = this.factoryFn();
    }
  }

  /**
   * Acquire an instance from the pool.
   * @returns {any}
   */
  acquire() {
    if (this.size > 0) {
      this.size--;
      const obj = this.pool[this.size];
      this.pool[this.size] = null; // Clean reference
      return obj;
    }
    // Pool exhausted: allocate new instance
    return this.factoryFn();
  }

  /**
   * Return an instance to the pool.
   * @param {any} obj
   */
  release(obj) {
    if (!obj) return;
    if (this.size < this.maxCapacity) {
      this.resetFn(obj);
      this.pool[this.size] = obj;
      this.size++;
    }
  }

  /**
   * Pre-warm pool with additional instances.
   * @param {number} count
   */
  prewarm(count) {
    for (let i = 0; i < count && this.size < this.maxCapacity; i++) {
      this.pool[this.size++] = this.factoryFn();
    }
  }

  /**
   * Current number of available objects in the pool.
   */
  get available() {
    return this.size;
  }
}
