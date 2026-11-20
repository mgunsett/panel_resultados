# Reglas de Firebase con roles

`firestore.rules` y `storage.rules` de esta carpeta reemplazan a las que hoy
están desplegadas (copiadas en cada landing). **No están desplegadas.**

## Qué cambia

| Ruta | Hoy | Con estas reglas |
| --- | --- | --- |
| `players/{slug}/matches/*`, `players/{slug}/stats/*`, `matches/*` (legacy) | lectura pública, escribe cualquier logueado | lectura pública (las landings siguen igual), escribe sólo admin |
| `players/{slug}` (ficha del panel) | lectura pública, escribe cualquier logueado | lee admin o el propio jugador, escribe sólo admin |
| `playerAccounts/*`, `panelAdmins/*` | sin regla (cerrado) | cerrado explícito: sólo el servidor |
| Storage `shields/*`, `players/{slug}/shields/*` | lectura pública, escribe cualquier logueado | lectura pública, escribe sólo admin |

Admin = claim `role: 'admin'` **y** su email en `panelAdmins`. Jugador = claim
`role: 'player'` y `slug`: no escribe nada, sólo ve su ficha en el panel.

Los partidos y estadísticas siguen siendo públicos porque las landings los
leen sin login: un jugador puede leer los de otro igual que cualquier
visitante de su landing. Lo que no puede es modificarlos.

## Antes de desplegar (en este orden)

1. **Mergear y deployar el panel** con los roles (este PR).
2. **Firestore → crear la colección `panelAdmins`**: un documento por admin,
   con el **email en minúsculas como ID del documento** (ej.
   `matias@ledsports.com`). Los campos dan igual (podés poner `nombre`).
3. **Cada admin entra una vez al panel.** Al entrar, la función
   `session-role` le pone el claim `role: 'admin'`. Hasta que no entre, con
   las reglas nuevas no va a poder escribir (ni en el panel ni en el admin de
   las landings).
4. Probar con una cuenta de jugador en el preview (ver README principal).
5. **Desplegar las reglas**: copiá estos dos archivos sobre `firestore.rules`
   y `storage.rules` de una landing (o pegalos en Firebase Console → Firestore
   → Reglas y Storage → Reglas) y desplegá con `firebase deploy --only
   firestore:rules,storage`. La primera vez, Firebase pide permiso para que
   las reglas de Storage consulten Firestore (por `firestore.exists`): aceptalo.
6. Recién ahí, `PLAYER_ACCOUNTS_ENABLED=true` en Netlify y redeploy.
7. Copiá las reglas nuevas a los `firestore.rules`/`storage.rules` de las
   demás landings, para que un deploy futuro desde cualquiera no las pise
   con las viejas.

## Altas y bajas de admins

- **Sumar**: crear su cuenta en Authentication (email y contraseña) y su doc
  en `panelAdmins`. Entra al panel y listo.
- **Sacar**: borrar su doc de `panelAdmins`. Pierde la escritura al instante
  y las funciones lo rechazan en menos de un minuto. Para cortarle también la
  sesión, deshabilitá la cuenta en Authentication.
- Mientras `panelAdmins` esté vacía, el panel trata como admin a toda cuenta
  que no sea de jugador (como antes). Con estas reglas desplegadas, en cambio,
  nadie podría escribir: por eso el paso 2 va antes que el 5.

## Recomendado

Firebase Console → Authentication → Settings → **User actions**: destildar
"Enable create (sign-up)". Así nadie puede crearse una cuenta desde afuera;
las de jugador las sigue creando el panel con el Admin SDK.
