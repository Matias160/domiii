---
name: domi2-gamedev
description: Guía de arquitectura, balance de combate, pixel art procedural y convenciones de código para DOMI 2 PANCHO.
---

# DOMI 2: PANCHO - Guía de Desarrollo y Convenciones del Juego

Esta skill documenta las reglas de arquitectura, sistemas de combate, arte procedural pixel art y convenciones técnicas para extender **DOMI 2: PANCHO**.

---

## 1. Arquitectura del Proyecto

El juego corre sobre HTML5 Canvas y JavaScript ES Modules vanilla sin frameworks externos.

- `index.html`: Estructura del DOM, pantallas (`screen`), Canvas principal (960x540) y HUD.
- `js/game.js`: Orquestador principal (`Game`), bucle de juego (`requestAnimationFrame`), gestión de estados y transiciones de pantalla.
- `js/core/`:
  - `runState.js`: Inicialización del estado de una partida (`world: 1920x1080`, cámara, entidades, temporizadores).
  - `art.js`: Motor de dibujado pixel art nativo (procedural con rectángulos, buffers cacheados, comida y personajes).
  - `worldProps.js`: Decorados de escenario según el mapa (mesas, reflectores, vitrinas, puestos).
  - `input.js`: Manejo de entradas de teclado y mouse con vector de movimiento.
  - `collision.js`: Colisiones circulares, swept AABB y utilidades matemáticas (`clamp`, `distance`).
  - `presentation.js`: Escalado de canvas, dibujado de accesorios y previsualizaciones.
- `js/entities/`:
  - `Player.js`: Jugador, estadísticas base, niveles, retrocesos, animaciones y esquiva (*dash*).
  - `Enemy.js`: Enemigos comunes y jefes con IA, fases, ataques telegrafiados y separación física.
  - `Companion.js`: Mascotas activas (Mini Ketchup, Dron, Taco Guardián, Botellita Soda).
  - `Projectile.js`: Proyectiles del jugador y enemigos (balas, salsas, búmerans, burbujas).
  - `Item.js`: Objetos recogibles en el suelo (curaciones, aumentos de daño, velocidad y cadencia).
- `js/systems/`:
  - `enemySystem.js`: Oleadas, escalado de dificultad, spawns descentralizados y zonas de impacto.
  - `scoreSystem.js`: Combos, multiplicadores, muertes temáticas por enemigo y desbloqueo de niveles.
  - `effectSystem.js`: Partículas, anillos de choque, explosiones y daño a entidades.
  - `mapSystem.js`: Peligros ambientales interactivos por mapa (aceite, ventisca, pelotas de fútbol).
  - `audioSystem.js`: Sintetizador Web Audio API Chiptune (sin archivos de audio pesados).
  - `directorSystem.js`: Modos de juego (Supervivencia, 8 Oleadas, Rush de Jefes).
  - `rankingSystem.js`: Puntuaciones máximas y persistencia local.
  - `accountSystem.js`: Perfil de jugador y monedas.
- `js/ui/`:
  - `hud.js`: Barras de vida, XP, combo, habilidades y advertencias.
  - `combatFeedback.js`: Zonas de impacto, retículas, alertas y overlays de vida baja.
  - `shop.js` & `lobby.js`: Tienda y local interactivo con cámara libre.
  - `menuScreen.js` & `gameOverScreen.js`: Menús principales y fin de partida.

---

## 2. Reglas de Balance y Combate

1. **Desbloqueo de Habilidades**:
   - Las cartas de habilidad (`showAbilityChoices`) se desbloquean estrictamente **cada 2 niveles** (NV 2, 4, 6, 8, 10...).
   - En niveles regulares intermedios, el jugador gana +50 puntos y una curación pasiva de **+12 HP**.

2. **Cámara y Coordenadas del Mundo**:
   - El mundo mide **1920x1080**.
   - El canvas interno mide **960x540**.
   - Toda entidad en el mundo se dibuja entre `ctx.save(); ctx.translate(-cam.x, -cam.y); ... ctx.restore();`.
   - Cualquier overlay de pantalla (HUD, viñetas de peligro, minimapa, intros) debe dibujarse **después** de restaurar la cámara para ocupar el viewport fijo de 960x540.

3. **Inteligencia Artificial de Enemigos**:
   - Utilizar siempre el algoritmo de separación física (*anti-clumping*) y componentes tangenciales de flanqueo para que los enemigos no colapsen en un solo punto ciego.

4. **Estilo Pixel Art**:
   - Usar `imageSmoothingEnabled = false` en los canvas.
   - Sprites dibujados mediante primitivas geométricas con contorno `#161c20` y sombras pixeladas.
   - Prohibido cargar imágenes PNG/JPG externas: todo el arte es generado proceduralmente en código.

---

## 3. Guía para Agregar Contenido Nuevo

### Añadir una Nueva Mascota
1. Declarar su registro en `js/entities/Companion.js` dentro del objeto `companions`.
2. Implementar su lógica de ataque/apoyo en `Companion.prototype.update(state, delta)`.
3. Dibujar su sprite pixel art en `Companion.prototype.draw(ctx, time)`.
4. Registrar el ítem en la tienda en `js/data/shop.js`.
5. Agregar la opción en el `<select id="companionSelect">` en `index.html`.

### Añadir un Nuevo Jefe
1. Declarar la configuración en `enemyTypes` dentro de `js/entities/Enemy.js` con `boss: true` y un `bossStyle` único.
2. Definir su ataque telegrafiado en `Enemy.prototype.updateBoss` o en las salvas de `volleyTimer` / `specialTimer`.
3. Registrar el color y etiqueta del telégrafo en `js/ui/combatFeedback.js`.
4. El sistema cinemático `drawBossIntro` lo anunciará automáticamente al aparecer.
