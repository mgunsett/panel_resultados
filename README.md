# Panel Central de Jugadores

Panel de administración único para cargar el **último resultado** y el **próximo
partido** de todos los jugadores, sin tener que entrar al admin de cada landing
por separado.

Apunta al mismo proyecto de Firebase que las landings individuales (`cainfara`),
namespaceado por slug: `players/{slug}/matches/{last|next}`.

## Stack

Vite + React 18 · Chakra UI · Framer Motion · react-router-dom · Firebase SDK
Gestor de paquetes: **pnpm** (no npm — no hay `package-lock.json` a propósito).

## Desarrollo

```bash
pnpm install
pnpm dev
```

Requiere un `.env` en la raíz con las credenciales de Firebase. Copiá
`.env.example` y completá los valores desde cualquier landing individual:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

> Este proyecto **no** lleva `VITE_PLAYER_SLUG`. El slug sale del parámetro de la
> URL (`/jugador/:slug`), que es lo que le permite administrar a todos.

## Secciones

| Ruta | Qué hace |
| --- | --- |
| `/` | Home con la portada de LED Sports y los accesos |
| `/jugadores` | Grilla de jugadores |
| `/jugador/:slug` | Carga de partidos de **un** jugador |
| `/clubes` | Grilla de clubes (uno por club, sin repetir) |
| `/club/:clubId` | Carga de partidos para **todos** los jugadores del club |

### Carga por club

La sección de clubes no agrega una colección nueva a Firestore: escribe los
mismos documentos de siempre — `players/{slug}/matches/{last|next}`, con el
mismo payload — en todos los jugadores del club de una sola pasada, dentro de un
`writeBatch` (atómico: o se actualizan todos o ninguno). Para las landings es
indistinguible de una edición individual.

Antes de guardar pide confirmación listando a quiénes va a pisar. Si los
jugadores de un club no tienen el mismo partido cargado (porque alguien editó a
uno por separado), el editor lo avisa, muestra el más reciente y al guardar los
vuelve a emparejar.

## Sumar un jugador

Editá [`src/data/players.js`](src/data/players.js) a mano y dejá la foto en
`public/players/`. No hay UI para esto y no sale de Firestore.

El `slug` **debe coincidir con el `VITE_PLAYER_SLUG` de la landing individual**,
que no siempre es igual al nombre de la carpeta del repo (ej: la carpeta
`jp_ruizdiaz` usa el slug `jp_ruizgomez`).

El `clubId` apunta a una entrada de [`src/data/clubs.js`](src/data/clubs.js) y es
lo que agrupa al jugador en `/clubes`. Sin `clubId` el jugador sigue andando,
pero queda fuera de la carga masiva por club.

## Sumar un club

Agregá la entrada en [`src/data/clubs.js`](src/data/clubs.js), dejá el escudo en
`public/clubs/` con el nombre del campo `crest`, y poné su `id` en el `clubId`
de los jugadores. Un club sin jugadores no aparece en la grilla.

## Imágenes de marca

`public/brand/led-sports-logo.png` y `public/brand/hero-bg.jpg`. Ver
[`public/brand/README.md`](public/brand/README.md). Si faltan, el panel funciona
igual con un wordmark tipográfico y un degradado de respaldo.

## Reglas de Firebase

Ya están desplegadas y son compatibles con este panel: `players/{slug}` usa un
wildcard y autoriza la escritura con `allow write: if request.auth != null`, sin
restricción por slug ni por uid. Cualquier admin logueado puede escribirle a
todos los jugadores. Están versionadas en cada landing (`firestore.rules` /
`storage.rules`), las 13 con contenido idéntico.

## Deploy en Netlify

Site **nuevo e independiente** — no toca el de ninguna landing.

`netlify.toml` ya deja resuelto el build, el redirect de SPA y los headers, así
que en la UI de Netlify no hace falta configurar nada de eso a mano.

### Pasos

1. Subí el repo a GitHub (si todavía no está).
2. Netlify → **Add new site** → **Import an existing project** → elegí el repo.
3. No toques build command ni publish directory: los toma de `netlify.toml`
   (`pnpm run build` → `dist`).
4. **Site configuration → Environment variables**: cargá las 6 variables
   `VITE_FIREBASE_*` de arriba. Esto es obligatorio — el `.env` está en
   `.gitignore`, así que no viaja al repo, y sin esas variables el panel
   levanta mostrando "Firebase no configurado".
   Se leen en build time: si las cargás después del primer deploy, hay que
   redesplegar (**Deploys → Trigger deploy → Clear cache and deploy site**).
5. Deploy.

### Después del deploy

- **Firebase Console → Authentication → Settings → Authorized domains**: agregá
  el dominio de Netlify (`tu-sitio.netlify.app`). Sin eso el login falla con
  `auth/unauthorized-domain`.

### Notas

- Netlify detecta `pnpm-lock.yaml` y usa pnpm. El campo `packageManager` del
  `package.json` fija pnpm 11 vía corepack: el lockfile es v9 y pnpm 8 no lo lee.
- `pnpm-workspace.yaml` autoriza los scripts de instalación de `esbuild`,
  `@firebase/util` y `protobufjs`. El de esbuild es el que baja su binario nativo;
  sin esa autorización el build falla.
