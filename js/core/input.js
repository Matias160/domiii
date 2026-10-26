export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    this.enabled = false;
    this.touchAxis = { x: 0, y: 0 };
    if (typeof window !== "undefined") {
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
      window.addEventListener('contextmenu', () => this.clear());
    }
  }

  clear() {
    this.keys.clear();
    this.pressed.clear();
    this.touchAxis = { x: 0, y: 0 };
  }
  consume(key) { const pressed = this.pressed.has(key); this.pressed.delete(key); return pressed; }

  getAxis() {
    let x = 0;
    let y = 0;
    const left = this.keys.has("a") || this.keys.has("arrowleft");
    const right = this.keys.has("d") || this.keys.has("arrowright");
    const up = this.keys.has("w") || this.keys.has("arrowup");
    const down = this.keys.has("s") || this.keys.has("arrowdown");
    x += Number(right) - Number(left);
    y += Number(down) - Number(up);

    if (Math.abs(this.touchAxis.x) > 0.05 || Math.abs(this.touchAxis.y) > 0.05) {
      x += this.touchAxis.x;
      y += this.touchAxis.y;
    }

    const length = Math.hypot(x, y);
    if (length > 1) {
      return { x: x / length, y: y / length };
    }
    return { x, y };
  }
}
