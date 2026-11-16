# DOMI 2: PANCHO

## Cómo jugarlo

Necesitás [Node.js](https://nodejs.org/) instalado (cualquier versión actual). Descomprimí la carpeta, abrí una terminal adentro y ejecutá:

```
npm install
npm start
```

Después abrí en el navegador la dirección que muestra la consola (normalmente `http://127.0.0.1:4177/`; si el puerto está ocupado usa el siguiente libre). El servidor solo acepta conexiones de tu propia computadora.

Los iconos siguen incluidos en `js/vendor/`. La dependencia `ws` conecta las salas; solo hace falta instalarla una vez. `npm start` abre el juego y el servidor de salas juntos.

No se puede abrir `index.html` con doble clic: el navegador bloquea los módulos de JavaScript fuera de un servidor.

## Esta version 2D

Crea un usuario local (o entrá como invitado) para ir al lobby. Camina con WASD o flechas, interactua con E y usa el portal para preparar una partida. Los puntos ganados al terminar cada partida se guardan en ese usuario y sirven para comprar personajes, accesorios, mascotas y escenarios.

Durante la partida, usa Espacio para esquivar. Las cartas de mejora salen cada 20-45 segundos con la partida en pausa: elegí con 1, 2 o 3 o con un clic. Los poderes se desbloquean en los niveles 5, 10 y 15 y se activan con Q, E y R.

Los jefes llegan con una entrada animada y despejan la arena; mientras viven invocan ayudantes de a poco. Al bajarles toda la vida pasan a una segunda fase furiosa con un ataque propio, más velocidad y más fuerza. Entre un jefe y el siguiente hay 35 segundos de respiro.

El **Caldero de Lava** es el mapa final: se desbloquea completando las misiones de Don Domi y es un duelo contra **Domi Colosal**, un jefe de tres fases (pisotones, anillos de fuego que se esquivan con un dash, rayo de lava y aturdimiento si choca contra una pared). Vencerlo muestra el festejo final y da la Corona Magmática. Don Domi también es un personaje jugable animado.

La preparación de partida va en dos pasos (partida, después personaje y arma) y el ranking muestra el combo con que se jugó cada partida.

Las cuentas y el progreso siguen guardados exclusivamente en el navegador de este dispositivo. El servidor sincroniza salas y partidas, no cuentas: no existe todavia autenticacion online ni recuperacion de compras entre dispositivos. Borrar los datos del navegador elimina el progreso.

Es un juego de supervivencia pixel art hecho con HTML, CSS, JavaScript y Canvas. Hay tres modos de partida, jefes, armas, mascotas, logros e historial por usuario. El mapa nevado tiene ventiscas periodicas; desierto y cancha agregan peligros moviles. Ejecuta `npm test` para revisar las pruebas automatizadas.

## Prototipo de equipo

Equipo permite crear una sala privada de dos jugadores, invitar por codigo y elegir clase. Ambos aparecen en el lobby con su personaje, accesorios y mascota. Para jugar usan el portal y la preparacion normales: el anfitrion elige mapa/modo/dificultad; cada jugador confirma su equipo y entonces arranca un unico mundo compartido. Sin compañero se mantiene la partida individual.

La simulacion cooperativa corre en el servidor y reutiliza los sistemas del juego. WASD/flechas, Espacio para esquivar, Q/E/R para las activas y F para apoyo: Rojo aumenta 25% el dano cercano, Verde cura 6 HP/s y Azul protege brevemente y aparta enemigos. Mantener E cerca de un compañero caido durante tres segundos lo revive. El menu personal y la eleccion de mejoras no congelan el mundo. Las recompensas se guardan en cada cuenta al terminar; abandonar o perder la conexion definitivamente cancela la partida sin premios. Hay veinte segundos de reserva para reconectar. Versus queda para otra etapa.

Para probar dos jugadores en una PC, abrir dos perfiles/ventanas de navegador en la misma direccion. Para dos dispositivos de la misma red, iniciar en PowerShell con `$env:HOST='0.0.0.0'; npm start` y abrir en ambos `http://IP-DE-LA-PC:puerto/` (permitir Node en el firewall de red privada). Por defecto solo se escucha en 127.0.0.1. No se publica automaticamente en Internet ni en Vercel: el despliegue actual sigue siendo estatico. El campo Servidor de salas admite un backend publicado; debe permitir el origen exacto de la web mediante `ALLOWED_ORIGINS`. Este primer prototipo usa salas temporales en memoria y esta pensado para pruebas privadas, no para competir con cuentas verificadas.

`npm test` incluye las reglas de las clases y los tres cuadros de Logros. La prueba visual opcional `node tools/verify-team-ui.cjs` necesita Playwright; admite `PLAYWRIGHT_MODULE`, `QA_BROWSER`, `QA_URL` y `QA_OUTPUT` para usar una instalacion existente y guardar capturas fuera del proyecto.

## Acceso y controles

El acceso permite mostrar u ocultar la contraseña, avisa si está activo Bloq Mayús y muestra los requisitos al crear una cuenta. Durante el ingreso se bloquean los envíos repetidos y los cambios de formulario. Los errores de almacenamiento se explican sin reemplazar datos dañados.

El lobby muestra los controles de movimiento e interacción. La preparación de partida incluye una guía desplegable de ataques, esquive, mejoras, pausa y poderes. En celulares y tablets aparecen controles táctiles (joystick, dash, poderes Q/E/R, pausa y mira); se pueden forzar o apagar en Opciones. Con el teléfono vertical se pide girarlo.

Las pruebas también cubren registros simultáneos dentro de una misma página, nombres especiales, datos dañados, fallos de almacenamiento y uso del teclado sobre botones.
