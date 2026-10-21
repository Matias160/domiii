---
name: domi2-vfx-gamefeel
description: Sistema de partículas temáticas de comida, temblor de pantalla (screen shake), ondas de impacto, telégrafos de combate y game feel para DOMI 2 PANCHO.
---

# DOMI 2: PANCHO - Visual Effects (VFX) & Game Feel Master Skill

Esta skill define cómo generar impacto visual, sensaciones de impacto satisfactorias (*game feel*) y retroalimentación táctica en **DOMI 2: PANCHO**.

---

## 1. Muerte Temática por Tipo de Enemigo (Food Debris Explosion)

Cada eliminación debe sentirse única y apetitosa:
- **Hamburguesas (`burger`, `double`)**: 26 partículas que simulan rodajas de pepinillo (`#48a867`), migas de pan tostado (`#e8a956`), trozos de queso derretido (`#ffbe3b`) y carne picada (`#6d3e2e`).
- **Gaseosas & Batidos (`soda`, `shake`)**: 28 gotas de salpicadura efervescente cian (`#00e5ff`), rosada (`#ff3377`), burbujas blancas y anillos de onda expansiva translúcida.
- **Papas (`fries`)**: 24 bastones dorados crocantes (`#ffe066`, `#ffae19`) con gravedad pesada.
- **Panchos & Salchichas (`hotdog`, `sausage`)**: Salpicaduras de mostaza (`#ffe853`), chimichurri y rodajas de salchicha roja (`#c73838`).
- **Pizzas (`pizza`)**: Queso derretido estirado (`#ffcf40`), salsa de tomate (`#d62828`) y orégano (`#40916c`).
- **Jefes**: Destello masivo con sacudida de pantalla (`shake = 0.55`), ondas estelares doradas y 45 chispas de confeti arcade.

---

## 2. Telégrafos de Combate con Timing de Evasión

Para que el combate sea justo y dependa de la habilidad:
1. **Zonas de Advertencia (`bossZones`)**:
   - Franjas oblicuas de peligro estilo *hazard tape*.
   - Círculo de advertencia con borde segmentado.
   - **Anillo de Cuenta Regresiva Decreciente**: Un círculo interior que se encoge hacia el centro marcando los milisegundos exactos hasta la detonación del golpe.
2. **Telégrafo de Embestida Lineal**:
   - Flechas rojas directas que proyectan la trayectoria de choque del jefe.
3. **Salva Radial Circular**:
   - Anillo concéntrico que gira y se ilumina progresivamente antes de disparar.

---

## 3. Síntesis Auditiva Chiptune y Screen Shake

- **Screen Shake Inteligente**:
  - Daño recibido leve: `shake = 0.18`.
  - Colisión con dash: `shake = 0.12`.
  - Explosiones y bombas: `shake = 0.28`.
  - Aparición o muerte de Jefes: `shake = 0.45` a `0.55`.
  - Respeta siempre el modo de accesibilidad `reducedMotion`.
- **Audio Chiptune Web Audio API**:
  - Sonidos generados mediante ondas `square`, `sawtooth` y `triangle` con frecuencias dinámicas.
  - No usa archivos de audio externos para mantener cero latencia y peso mínimo.
