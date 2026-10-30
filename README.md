# DOMI 2: PANCHO

## Cómo jugarlo

Necesitás [Node.js](https://nodejs.org/) instalado (cualquier versión actual). Descomprimí la carpeta, abrí una terminal adentro y ejecutá:

```
node server.cjs
```

Después abrí en el navegador la dirección que muestra la consola (normalmente `http://127.0.0.1:4177/`; si el puerto está ocupado usa el siguiente libre). El servidor solo acepta conexiones de tu propia computadora.

No hace falta instalar nada con npm: los íconos (librería [lucide](https://lucide.dev) v0.468.0, licencia ISC) ya vienen incluidos en `js/vendor/`. `npm start` también funciona y hace lo mismo que `node server.cjs`.

No se puede abrir `index.html` con doble clic: el navegador bloquea los módulos de JavaScript fuera de un servidor.

## Esta version 2D

Crea un usuario local (o entrá como invitado) para ir al lobby. Camina con WASD o flechas, interactua con E y usa el portal para preparar una partida. Los puntos ganados al terminar cada partida se guardan en ese usuario y sirven para comprar personajes, accesorios, mascotas y escenarios.

Durante la partida, usa Espacio para esquivar. Las cartas de mejora salen cada 20-45 segundos con la partida en pausa: elegí con 1, 2 o 3 o con un clic. Los poderes se desbloquean en los niveles 5, 10 y 15 y se activan con Q, E y R.

Los jefes llegan con una entrada animada y despejan la arena; mientras viven invocan ayudantes de a poco. Al bajarles toda la vida pasan a una segunda fase furiosa con un ataque propio, más velocidad y más fuerza. Entre un jefe y el siguiente hay 35 segundos de respiro.

El **Caldero de Lava** es el mapa final: se desbloquea completando las misiones de Don Domi y es un duelo contra **Domi Colosal**, un jefe de tres fases (pisotones, anillos de fuego que se esquivan con un dash, rayo de lava y aturdimiento si choca contra una pared). Vencerlo muestra el festejo final y da la Corona Magmática. Don Domi también es un personaje jugable animado.

La preparación de partida va en dos pasos (partida, después personaje y arma) y el ranking muestra el combo con que se jugó cada partida.

Las cuentas y contraseñas se guardan exclusivamente en el navegador de este dispositivo. La contraseña se deriva con PBKDF2 y no se almacena en texto plano, pero no hay servidor, sincronizacion ni recuperacion de cuenta. Borrar los datos del navegador elimina el progreso.

Es un juego de supervivencia pixel art hecho con HTML, CSS, JavaScript y Canvas. Hay tres modos de partida, jefes, armas, mascotas, logros e historial por usuario. El mapa nevado tiene ventiscas periodicas; desierto y cancha agregan peligros moviles. Ejecuta `npm test` para revisar las pruebas automatizadas.

## Mejoras de acceso y usabilidad

El acceso permite mostrar u ocultar la contraseña, avisa si está activo Bloq Mayús y muestra los requisitos al crear una cuenta. Durante el ingreso se bloquean los envíos repetidos y los cambios de formulario. Los errores de almacenamiento se explican sin reemplazar datos dañados.

El lobby muestra los controles de movimiento e interacción. La preparación de partida incluye una guía desplegable de ataques, esquive, mejoras, pausa y poderes. En celulares y tablets aparecen controles táctiles (joystick, dash, poderes Q/E/R, pausa y mira); se pueden forzar o apagar en Opciones. Con el teléfono vertical se pide girarlo.

Las pruebas también cubren registros simultáneos dentro de una misma página, nombres especiales, datos dañados, fallos de almacenamiento y uso del teclado sobre botones.
