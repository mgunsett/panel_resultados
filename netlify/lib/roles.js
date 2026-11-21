// ─── ROLES DEL PANEL (servidor) ──────────────────────────────────
// Dos roles, guardados como custom claims de Firebase Auth en la cuenta:
//   role: 'admin'                  equipo de LED Sports: todo el panel
//   role: 'player', slug: '<slug>' jugador: sólo su ficha, en lectura
// Los jugadores los recibe create-player al crear la cuenta. Los admins,
// la función session-role la primera vez que entran al panel, si su
// email está en la colección `panelAdmins` de Firestore: un doc por
// admin, con el email (en minúsculas) como ID del documento. Se edita
// desde la consola de Firebase, sin redeploy. Las reglas no dejan que
// el navegador la lea ni la escriba: sólo el Admin SDK.
//
// Mientras `panelAdmins` esté vacía, toda cuenta que no sea de jugador
// se toma como admin (igual que antes de los roles), así nadie del
// equipo queda afuera hasta que se configure.

export const ROLE_ADMIN = 'admin'
export const ROLE_PLAYER = 'player'

export const PANEL_ADMINS = 'panelAdmins'

// Emails de panelAdmins. Cache corto: cada función lo lee una vez por
// minuto como mucho, y sacar a alguien tarda eso en aplicarse.
let cache = null
export async function loadAdminEmails(db, now = Date.now()) {
  if (cache && now - cache.at < 60_000) return cache.emails
  const snap = await db.collection(PANEL_ADMINS).get()
  const emails = snap.docs.map((d) => d.id.trim().toLowerCase()).filter(Boolean)
  cache = { at: now, emails }
  return emails
}

// Rol de un token ya verificado (decodificado), con la lista de
// emails de panelAdmins. Devuelve
// { role: 'admin' | 'player' | null, slug?, needsClaim? }.
// needsClaim: es admin por la lista pero todavía no tiene el claim
// (session-role se lo pone).
export function roleOf(decoded, list = []) {
  if (!decoded) return { role: null }
  if (decoded.role === ROLE_PLAYER) return decoded.slug ? { role: ROLE_PLAYER, slug: decoded.slug } : { role: null }
  const email = String(decoded.email || '').toLowerCase()
  const listed = Boolean(email) && list.includes(email)
  // Con la lista cargada, borrar un email de panelAdmins le corta el
  // acceso a las funciones aunque conserve el claim (para Firestore,
  // además, deshabilitá la cuenta en Firebase: ver README).
  if (decoded.role === ROLE_ADMIN) return !list.length || listed ? { role: ROLE_ADMIN } : { role: null }
  if (decoded.role) return { role: null } // un rol desconocido no entra
  if (!list.length) return { role: ROLE_ADMIN, legacy: true }
  return listed ? { role: ROLE_ADMIN, needsClaim: true } : { role: null }
}
