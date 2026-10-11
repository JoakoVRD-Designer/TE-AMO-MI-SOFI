# Para Sofía, mi bebé ♡

Una sorpresa de Joako para Sofía, su «mi bebé»: un jardín ilustrado con un conejito, corazones que caen, una melodía original de cajita de música y seis flores que guardan mensajes de amor. La carta original espera al terminar.

Mueve la cestita con el dedo, el ratón o las flechas para recoger corazones. También puedes tocar los corazones o usar Espacio / el botón de ayuda. Cada tres corazones florece un mensaje. No hay reloj, vidas ni penalización por dejar caer uno. Al recoger 18 se abre la carta; las flores permiten volver a leer cada mensaje.

## Abrir la página

Es una web estática, sin instalación ni dependencias. Abre `index.html` o publícala con GitHub Pages desde la rama `main`, carpeta raíz `/`.

Dirección prevista de GitHub Pages: https://joakovrd-designer.github.io/TE-AMO-MI-SOFI/

## Personalizar

- Los seis mensajes están en `app.js`.
- La bienvenida y la carta están en `index.html`.
- La escena, las flores y el conejito se dibujan en `app.js`.
- Los colores y el diseño están en `styles.css`.
- La melodía y los efectos originales se sintetizan en `sound.js`, sin archivos ni servicios de música externos.

El diseño se adapta al celular y permite jugar con teclado. Con movimiento reducido, los corazones se quedan quietos para tocarlos; desaparecen los destellos en movimiento y la lluvia de pétalos. El progreso y la preferencia de sonido se guardan solo en el navegador; si el almacenamiento está deshabilitado, se puede jugar igual.

El sonido comienza tras pulsar «Entrar a mi jardín», se puede silenciar arriba y se suspende al ocultar la pestaña. Si el navegador no admite audio, todo el juego sigue disponible. Las fuentes y los dibujos forman parte de la propia página; no hay rastreadores, cuentas ni servicios externos para jugar.
