---
name: domi2-pixelart-graphics
description: Estándares de pixel art procedural, paleta retro de 16 bits, arquitectura de renderizado por capas y minimapa para DOMI 2 PANCHO.
---

# DOMI 2: PANCHO - Pixel Art Graphics & Procedural Rendering Skill

Esta skill define la identidad visual, estándares de renderizado pixel-art y manejo de capas de canvas en **DOMI 2: PANCHO**.

---

## 1. Principio Fundamental: Arte Procedural sin Archivos Externos

En este proyecto **está estrictamente prohibido cargar imágenes externas (.png, .jpg, .svg)** para entidades de gameplay:
- Todo personaje, enemigo, prop, proyectil e ítem se dibuja en tiempo real mediante primitivas de Canvas 2D (`fillRect`, `arc`, `ellipse`, trazado de paths).
- Contorno nítido de tinta: Usar contornos oscuros `#161c20` / `#101b20` con bordes de 2 a 4 píxeles.
- Sombra de contacto: Elipses oscuras translúcidas `rgba(8, 13, 19, 0.38)` en la base de los personajes.
- Caché de sprites nativos: Para rendimiento extremo a 60 FPS, los sprites repetitivos se generan una sola vez en un canvas en memoria (`foodSprite`) y se reutilizan con `drawImage`.

---

## 2. Paleta de Colores Retro Arcade (16-Bit)

- **Fondos e Interiores**: `#0c1013` (negro carbón), `#141c20` (superficie), `#2d3e47` (líneas), `#20282a` (baldosas oscuras).
- **Alimentos & Personajes**:
  - Pan / Masa: `#f9c477`, `#d7954d`, `#e8ad61`, `#ffe5a0`.
  - Carnes & Embutidos: `#d85744`, `#974d3c`, `#754633`, `#c73838`.
  - Queso / Mostaza / Papas: `#ffcc00`, `#ffd33d`, `#ffe569`, `#f3b846`.
  - Vegetales: `#81b965`, `#48a867`, `#b8e177`.
  - Salsas & Cristales: `#ff3344`, `#ef5960`, `#00e5ff`, `#38bdf8`.
- **Efectos Neón**:
  - Mint / Jugador: `#00ff88` / `#86e3bf`.
  - Alerta / Peligro: `#ff2a44` / `#ff4f9a`.
  - Oro / Jefes: `#ffd700` / `#ffe569`.

---

## 3. Arquitectura de Dos Capas de Renderizado

### Capa 1: Espacio de Mundo (1920x1080)
Se ejecuta bajo la matriz de transformación de la cámara:
```js
ctx.save();
ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
// Suelo y props
// Peligros y charcos
// Ítems y proyectiles
// Entidades ordenadas por eje Y (sort((a,b) => a.y - b.y))
// Partículas y textos flotantes
ctx.restore();
```

### Capa 2: Espacio de Pantalla / Viewport (960x540)
Se ejecuta **después** de restaurar la cámara para anclarse fijamente a la pantalla:
- Borde de peligro de vida baja (viñeta roja completa de 960x540 y esquinas pixel).
- Flash de daño recibido (`state.player.hitFlash`).
- Banner cinemático de presentación de jefes (`drawBossIntro`).
- Minimapa radar táctico en la esquina superior derecha (`drawMinimap`).
