# Panel Central de Jugadores

Panel de administración general de las landings: carga del **último resultado** y
el **próximo partido** de todos los jugadores (sin entrar al admin de cada
landing), y la ficha de estadísticas de cada uno (temporada en curso, último
partido, historial de partidos y temporadas anteriores) para comparar y exportar.

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
| `/` | Home "Vitrina de jugadores": buscador, partidos de la semana, ranking de la temporada, ficha rápida y grilla de jugadores con el estado de cada landing |
| `/jugadores` | Grilla de jugadores |
| `/jugador/:slug` | Ficha del jugador en pestañas: Resumen, Partidos, Temporadas y Carga manual (`?tab=carga`) |
| `/estadisticas` | Todos los jugadores en una tabla: temporada, cada 90', último partido y todos los partidos. Filtro por club y temporada, orden por columna, exporta CSV y Excel |
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

### Navegación, login y pantalla de carga

- Barra superior con las secciones y **Sincronizar ahora** (sincroniza club por club, igual que `/sincronizacion`). En el celular, las secciones salen en un menú lateral.
- `/login` usa `src/assets/fondo_led.webp` a la izquierda (arriba en el celular).
- Pantalla de carga (`src/components/ui/Splash.jsx`): se muestra al abrir el panel (una vez por pestaña) y después de iniciar sesión, con un mínimo de 2,3 s. Usa `fondo_led.webp` en desktop y `fondo_led2.webp` en el celular.

## Alta de jugadores

En **Jugadores → Nuevo jugador** (`/jugadores/nuevo`) hay un asistente de 5
pasos: buscar al jugador en API-Football (por apellido o por ID), importar sus
datos (lo que la API no trae se completa a mano), foto y escudo, links de
landing y Drive, slug, y usuario y contraseña.

Dónde queda cada cosa:

- **Ficha**: en `players/{slug}` de Firestore, con `panel: true`. El panel y
  las funciones la suman a lo de `src/data/players.js`. Si el club no existía,
  viaja dentro de la ficha (`panelClub`) y aparece como un club más.
- **Foto y escudo subido a mano**: en Storage, `players/{slug}/shields/`
  (`_foto.webp` y el escudo con el nombre del equipo), la única ruta que hoy
  permiten las reglas.
- **Cuenta**: en Firebase Authentication, creada por la función
  `create-player` con el Admin SDK. Lleva los claims `role: 'player'` y
  `slug`. En Firestore sólo queda `playerAccounts/{slug}` con el uid y el
  email; la contraseña no se guarda en ningún lado y se muestra una sola vez.
  Con esa cuenta el jugador entra al panel y sólo ve su propia ficha (ver
  "Acceso por rol").

### Jugadores que ya estaban cargados

Los de `src/data/players.js` y los que se dieron de alta sin cuenta se
manejan desde **Editar jugador** (el lápiz junto al nombre, sólo admin),
sección **Acceso al panel**:

- **Crear acceso**: elegís el usuario (por defecto el slug), se genera la
  contraseña y se crea la cuenta con los mismos claims y el mismo
  `playerAccounts/{slug}` que en el alta. Si el jugador ya tiene cuenta no
  deja crear otra.
- **Restablecer contraseña**: le pone una contraseña nueva a la cuenta que ya
  tiene (la vieja deja de andar y se cierran sus sesiones).

La contraseña se muestra una sola vez. Las dos acciones van por la misma
función `create-player` (`action: account-create | account-reset`, ver
`netlify/lib/playerAccounts.js`).

### Cómo entra el jugador

- **Login con el usuario solo**: el jugador escribe `nicolas_fernandez` y el
  panel le agrega `@VITE_PLAYER_LOGIN_DOMAIN`. Si lo que se escribe tiene `@`
  (los admins) se usa tal cual.
- **Cambio de contraseña obligatorio**: con "Pedirle que la cambie" tildado
  (viene tildado en el alta, en Crear acceso y en Restablecer contraseña) la
  cuenta lleva el claim `mustChangePassword: true`. Al entrar, el jugador ve
  "Elegí tu contraseña" en vez de su ficha. La cambia en el navegador
  (reautenticación + `updatePassword`) y la función `session-role`
  (`action: 'password-changed'`) le saca el claim y anota `passwordChangedAt`
  en `playerAccounts/{slug}`.
- **Cambiarla cuando quiera**: "Cambiar contraseña" en el menú de la cuenta
  (arriba a la derecha) y en su ficha. Los admins también la tienen en el menú.
- "¿Olvidaste tu contraseña?" sólo manda email a cuentas con email real. A un
  jugador le dice que pida un restablecimiento al equipo.

### Antes de activar las cuentas

Las reglas desplegadas hoy dejan escribir a **cualquier** usuario logueado:
una cuenta de jugador podría editar los partidos de todos. Por eso la
función no crea cuentas hasta que `PLAYER_ACCOUNTS_ENABLED=true` (sin eso,
el alta anda igual destildando "Crear la cuenta del jugador ahora").
Activalo recién después de desplegar las reglas de
[`firebase/`](firebase/README.md). `PLAYER_LOGIN_DOMAIN` (servidor) y
`VITE_PLAYER_LOGIN_DOMAIN` (panel) son el dominio que se agrega al usuario
para armar el email de login.

## Acceso por rol

Cada cuenta tiene un rol, guardado como custom claim de Firebase Auth:

| Rol | Quién | Qué ve |
| --- | --- | --- |
| `admin` | equipo de LED Sports, con su email en `panelAdmins` (Firestore) | todo el panel |
| `player` (+ `slug`) | la cuenta que crea el alta de jugadores | sólo `/jugador/<su slug>`, en lectura |

- **Jugador**: cualquier otra ruta lo devuelve a su ficha. Sin barra de
  secciones, sin Sincronizar, sin Carga manual, sin editar ni cambiar de
  jugador. Ve Resumen, Partidos, Temporadas, Landing, Fotos y Exportar.
- **Admin**: la primera vez que entra, `netlify/functions/session-role.mjs`
  le pone `role: 'admin'` si su email está en `panelAdmins`. Mientras esa
  colección esté vacía, toda cuenta que no sea de jugador entra como admin
  (como antes), así nadie queda afuera.
- Las funciones de Netlify (`api-football`, `create-player`) sólo atienden
  admins (`requireAdmin` en `netlify/lib/firebaseAdmin.js`).
- La puerta de verdad son las reglas: [`firebase/README.md`](firebase/README.md)
  tiene las nuevas, qué cambia y el orden para desplegarlas.
- En local (`pnpm dev`, sin funciones) el panel entra como admin sin rol.
  Para probar roles usá `netlify dev`.

## Editar un jugador

En el banner de **Jugadores** y en la ficha hay un lápiz discreto junto al
nombre (abre todo) y otro chiquito en la esquina de **Landing** y **Fotos**
(aparece al pasar el mouse; en el celular queda siempre visible). Abren el
panel lateral **Editar jugador**: foto, nombre, rol, club, links, datos
personales (con **Traer de API-Football**) e ID de API-Football. El slug no se
edita.

- **Alta en el panel**: los cambios van directo a su doc `players/{slug}`.
- **De `players.js`**: el archivo no se toca. Lo que difiere se guarda en
  `players/{slug}` como `panelEdit` (más `panelEdited: true`) y el panel y la
  sincronización lo aplican encima del archivo. **Volver a players.js**
  descarta esos cambios.
- Las landings no leen el doc raíz `players/{slug}`, así que no cambian. Con
  las reglas actuales alcanza y con las de `firebase/` también.

## Sumar un jugador a mano

También se puede seguir editando [`src/data/players.js`](src/data/players.js) a
mano y dejando la foto en `public/players/`.

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

Las desplegadas hoy (versionadas en cada landing, las 13 iguales) autorizan
la escritura con `allow write: if request.auth != null`: cualquier cuenta
logueada escribe en todos los jugadores. Las nuevas, con roles, están en
[`firebase/`](firebase/README.md), listas y sin desplegar.

## Sincronización con API-Football

Los partidos (`players/{slug}/matches/{last|next}`) y las estadísticas
del último partido de cada jugador se actualizan solos desde
[API-Football](https://www.api-football.com/documentation-v3). La key
**nunca** llega al navegador: todo pasa por funciones de Netlify.

| Archivo | Qué hace |
| --- | --- |
| `netlify/functions/sync-results.mjs` | Corre sola: lunes a viernes a las 06:00 y fines de semana a las 06:00 y 18:00 (Argentina) |
| `netlify/functions/api-football.mjs` | Puente para el panel: estado, búsquedas y "Sincronizar ahora". Exige el token del admin logueado |
| `netlify/lib/sync.js` | La lógica de sincronización |
| `netlify/lib/mappers.js` | Traduce la respuesta de la API a nuestro formato |
| `src/pages/SyncPage.jsx` | Sección `/sincronizacion` del panel |

### Qué escribe

- **`matches/last` y `matches/next`**: mismo formato que la carga
  manual, así que las landings no cambian. Suma `source: 'api'`,
  `api_fixture_id`, `match_time` y los escudos con el logo de la API.
- **`stats/last`** (nuevo): las estadísticas del jugador en su último
  partido, con las mismas claves que la ficha de LED Sports (`minutos`,
  `rating`, `goles`, `asistencias`, `pasesOk`, `duelosG`…). Cuando hay un
  partido nuevo, la ficha anterior pasa a **`stats/prev`**. Si no jugó,
  queda `jugo: false`.
- **`stats/season`** (nuevo): totales del jugador en la temporada en
  curso (`temporada: 2026`), sumando todas las competencias: `partidos`,
  `minutos`, `goles`, `asistencias`, `rating` (promedio por minutos),
  `tiros`, `pases`, `precisionPases`, etc., más el detalle en
  `competiciones`. Se actualiza con cada partido nuevo y una vez por día.
  En pretemporada (sin partidos en el año) se mantienen los anteriores.

- **`stats/history_{año}`** (sólo panel): un mapa `partidos` con la ficha
  de cada partido del club en esa temporada, indexado por fixtureId. La
  sincronización suma cada partido nuevo sin requests extra.
- **`stats/seasons`** (sólo panel): `temporadas: { 2025: {...}, 2026: {...} }`,
  los totales de cada año con el mismo formato que `stats/season`.

Todo queda dentro de `stats/`, que las reglas ya permiten: no hace falta
redeployar reglas. Las landings no leen `history_*` ni `seasons`.

### Completar historial

En `/sincronizacion` → **Completar historial**:

- **Completar partidos**: trae los partidos anteriores de la temporada, club
  por club, en tandas de 6 (función `api-football?action=history`). 1 request
  para listar + 1 por partido que falte: la primera vez, unos 45 por club
  (~650 en total). Lo ya guardado no se vuelve a pedir. Usa el club actual
  del jugador.
- **Traer temporadas**: totales de años anteriores (`action=season`),
  1 request por jugador por año.

### Reglas

- Sólo se sincronizan los clubes con `apiTeamId` en `clubs.js`. Las
  estadísticas, sólo para los jugadores con `apiPlayerId` en `players.js`.
- Un partido guardado desde el panel con **Bloquear** activado no se pisa
  nunca. Sin bloquear, la próxima pasada lo reemplaza con lo de la API.
- Si nada cambió, no se escribe nada.
- Consumo: 2 requests por club en cada pasada, más 1 por club cuando
  jugó. Con 13 clubes: unos 26 por día de semana y 52 por día de fin de semana.

### Puesta en marcha

1. Netlify → **Site configuration → Environment variables**, con scope
   **Functions**: `API_FOOTBALL_KEY`, `API_FOOTBALL_PROVIDER`,
   `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL` y
   `FIREBASE_ADMIN_PRIVATE_KEY` (ver `.env.example`).
2. Deploy.
3. En el panel, `/sincronizacion` → **Verificar conexión**.
4. En la misma pantalla, buscá el ID de cada club y pegalo en
   `src/data/clubs.js`. Deploy. Después hacé lo mismo con los jugadores
   en `src/data/players.js`.
5. **Probar sin guardar** para revisar qué escribiría. Si está bien,
   **Sincronizar ahora**. Desde ahí sigue sola.

Para pausarla: `SYNC_ENABLED=false` en Netlify.

En local, `pnpm dev` no levanta las funciones. Para probar esta sección
usá `netlify dev` (Netlify CLI) con las variables en tu `.env`.

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
