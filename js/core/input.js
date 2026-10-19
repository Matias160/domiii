export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    this.enabled = false;
    window.addEventListener("keydown", (event) => {
      if (!this.enabled || event.target.closest?.('input, select, textarea, [contenteditable]:not([contenteditable="false"])')) return;
      const key = event.key.toLowerCase();
      if (event.target.closest?.('button, a, summary') && [' ', 'enter'].includes(key)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (!event.repeat) this.pressed.add(key);
      this.keys.add(key);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        event.preventDefault();
      }
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
    window.addEventListener('blur', () => this.clear());
  }

  clear() { this.keys.clear(); this.pressed.clear(); }
  consume(key) { const pressed = this.pressed.has(key); this.pressed.delete(key); return pressed; }

  getAxis() {
    const left = this.keys.has("a") || this.keys.has("arrowleft");
    const right = this.keys.has("d") || this.keys.has("arrowright");
    const up = this.keys.has("w") || this.keys.has("arrowup");
    const down = this.keys.has("s") || this.keys.has("arrowdown");
    const x = Number(right) - Number(left);
    const y = Number(down) - Number(up);
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  }
}
