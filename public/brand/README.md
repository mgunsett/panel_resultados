# Marca LED Sports

| Archivo | Dónde se usa | Recomendado |
| --- | --- | --- |
| `public/brand/led-sports-logo.png` | Sidebar, barra mobile, login y Home | PNG con fondo transparente, ~600px de ancho |
| `src/assets/fondo_led.png` | Foto de portada del Home | Imagen ancha, ~1600px de ancho |

El logo se referencia por URL desde `public/`; mientras no esté, el panel
no se rompe: cae a un wordmark tipográfico ("LED" en naranja + "SPORTS").
La portada, en cambio, se importa desde `src/assets/` — los archivos de
`public/` no se pueden importar desde JavaScript, Vite lo rechaza.

El logo original viene con mucho aire alrededor. Si se ve chico en el
sidebar, recortalo al borde de las letras antes de guardarlo.
