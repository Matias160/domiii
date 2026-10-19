# DOMI 2: PANCHO

## Esta version 2D

Abri `http://127.0.0.1:4177/` despues de ejecutar `npm start` (si el puerto esta ocupado, el servidor muestra otro en la consola). Crea un usuario local para entrar al lobby. Camina con WASD o flechas, interactua con E y usa el portal para preparar una partida. Los puntos ganados al terminar cada partida se guardan en ese usuario y sirven para comprar personajes, accesorios, mascotas y escenarios.

Durante la partida, usa Espacio para esquivar. Las mejoras de nivel aparecen a un costado: elegi con 1, 2 o 3 antes de que se agote la barra. Las prime se desbloquean en los niveles 10, 20 y 30 y se activan con Q, E y R. Cada una tiene su propio tiempo de recarga.

Las cuentas y contraseñas se guardan exclusivamente en el navegador de este dispositivo. La contraseña se deriva con PBKDF2 y no se almacena en texto plano, pero no hay servidor, sincronizacion ni recuperacion de cuenta. Borrar los datos del navegador elimina el progreso.

Es un juego de supervivencia pixel art hecho con HTML, CSS, JavaScript y Canvas. Hay tres modos de partida, jefes, armas, mascotas, logros e historial por usuario. El mapa nevado tiene ventiscas periodicas; desierto y cancha agregan peligros moviles. Ejecuta `npm test` para revisar las pruebas automatizadas.

## Mejoras de acceso y usabilidad

El acceso permite mostrar u ocultar la contraseña, avisa si está activo Bloq Mayús y muestra los requisitos al crear una cuenta. Durante el ingreso se bloquean los envíos repetidos y los cambios de formulario. Los errores de almacenamiento se explican sin reemplazar datos dañados.

El lobby muestra los controles de movimiento e interacción. La preparación de partida incluye una guía desplegable de ataques, esquive, mejoras, pausa y poderes. El juego requiere teclado; las pantallas de acceso y preparación se adaptan a anchos pequeños, pero no se agregaron controles táctiles de combate.

Las pruebas también cubren registros simultáneos dentro de una misma página, nombres especiales, datos dañados, fallos de almacenamiento y uso del teclado sobre botones.
