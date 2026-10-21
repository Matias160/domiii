---
name: domi2-combat-gameplay
description: Reglas maestras de diseño de combate, bucle de juego, balance de armas, sinergias e IA de enemigos para DOMI 2 PANCHO.
---

# DOMI 2: PANCHO - Gameplay & Combat Design Master Skill

Esta skill gobierna todo el diseño de combate, balance numérico, flujo de partida y comportamiento de entidades en **DOMI 2: PANCHO**.

---

## 1. El Bucle Central de Juego (Core Gameplay Loop)

El juego es un *retro roguelite survivor* de ritmo frenético:
1. **Movimiento & Posicionamiento**: El jugador se mueve con WASD / Flechas esquivando peligros.
2. **Esquiva Activa (Dash)**:
   - Cooldown: 2.8s.
   - Duración: 0.19s con velocidad 760 px/s e invulnerabilidad parcial.
   - Daño por embestida: Arrolla enemigos causándoles `(18 + lvl * 1.35) * damageMultiplier`.
   - Interacción con objetos: Patear pelotas de fútbol, atravesar proyectiles y escapar de zonas de impacto.
3. **Disparo Automático & Apuntado**:
   - Por defecto: Dispara automáticamente al enemigo más cercano.
   - Manual: Con botón de retícula o clic, apunta hacia el cursor del mouse dentro del espacio de mundo.
4. **Progresión de Niveles & Habilidades**:
   - **Regla estricta**: Las cartas de habilidad se eligen cada 5 niveles (NV 5, 10, 15, 20...).
   - En niveles intermedios se otorga +50 puntos de score y +12 HP de curación pasiva.
   - Al nivel 15 el arma principal evoluciona automáticamente si se cumplen las condiciones.

---

## 2. Inteligencia Artificial de Enemigos y Manejo de Hordas

Para garantizar dinamismo y evitar embotellamientos:
- **Flocking & Flanqueo**: Los enemigos nunca deben avanzar todos en línea recta al centro del jugador. Se calcula un vector tangencial para rodearlo por los costados.
- **Separación Física (Anti-Clumping)**: Los enemigos cercanos aplican una fuerza de repulsión entre sí de radio `radius * 2.2` para mantener una formación de asedio abierta.
- **Spawn Perimetral**:
  - 70% spawnean en los bordes de la cámara activa.
  - 30% spawnean en abanico circular de 500-750 px alrededor del mapa.
- **Jefes**: Cuentan con dos fases (la fase 2 se activa al 50% de HP con aumento de velocidad y ataques especiales telegrafiados).

---

## 3. Sistema de Mascotas y Sinergias Activas

Cada compañero debe aportar una función táctica diferenciada:
- **Mini Ketchup**: Control de masas con charcos de salsa (ralentización 50% y daño continuo).
- **Dron Delivery**: Utilidad e imán de ítems + descargas eléctricas de choque en cadena.
- **Taco Guardián**: Defensa con escudo protector periódico e impactos giratorios.
- **Botellita Soda**: Regeneración periódica de salud + ráfagas perforantes efervescentes.

---

## 4. Modos de Juego y Objetivos

- **Supervivencia (Survival)**: Sobrevivir oleadas continuas con jefes cada 85 segundos.
- **8 Oleadas (Waves)**: Completar 8 oleadas consecutivas con tiempos de descanso y jefes intermedios.
- **Duelo de Jefes (Boss Rush)**: Enfrentarse consecutivamente a 3 jefes de alta intensidad.
