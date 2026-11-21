import { loginEmail, DEFAULT_LOGIN_DOMAIN, USERNAME_RE, PLAYERS, PLAYER_ACCOUNTS } from '../../src/lib/roster.js'

// ─── CUENTAS DE JUGADOR (servidor) ───────────────────────────────
// Lo comparten el alta (/jugadores/nuevo) y "Acceso al panel" del
// panel "Editar jugador", que le da usuario y contraseña a un jugador
// que ya estaba cargado (players.js o Firestore). Las dos cosas pasan
// por la función create-player:
//   · alta: createPlayer() llama a ensureAccount()
//   · jugador ya cargado: payload { action, slug, ... } → playerAccess()
// La contraseña viaja sólo en el pedido: no se guarda en ningún lado.
// La cuenta lleva los claims role: 'player' y slug, y en Firestore sólo
// queda playerAccounts/{slug} con el uid y el email.

export class AccountError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const fail = (status, msg) => { throw new AccountError(status, msg) }
const notFound = (e) => (e?.code === 'auth/user-not-found' ? null : Promise.reject(e))

export const ACCOUNT_ACTIONS = ['account-status', 'account-create', 'account-reset']

// Claims de una cuenta de jugador. mustChangePassword le pide al panel
// que muestre la pantalla de cambio de contraseña antes que la ficha;
// lo saca markPasswordChanged() cuando el jugador la cambia.
export function playerClaims(slug, mustChange) {
  return mustChange ? { role: 'player', slug, mustChangePassword: true } : { role: 'player', slug }
}

export function checkEnabled(env) {
  if (env.PLAYER_ACCOUNTS_ENABLED !== 'true') {
    fail(403, 'La creación de cuentas de jugador está apagada. Activá PLAYER_ACCOUNTS_ENABLED=true en Netlify después de actualizar las reglas de Firestore (ver README).')
  }
}

function checkPassword(password) {
  if (password.length < 10) fail(400, 'La contraseña tiene que tener al menos 10 caracteres.')
  if (password.length > 128) fail(400, 'La contraseña es demasiado larga.')
}

// Crea (o reusa, si es un reintento del mismo jugador) la cuenta en
// Firebase Authentication y devuelve lo que va a playerAccounts/{slug}.
export async function ensureAccount({ auth, slug, name, account, env, now, adminUid }) {
  checkEnabled(env)
  const username = String(account?.username || '').trim().toLowerCase()
  const email = loginEmail(username, env.PLAYER_LOGIN_DOMAIN || DEFAULT_LOGIN_DOMAIN)
  if (!username.includes('@') && !USERNAME_RE.test(username)) fail(400, 'El usuario tiene que tener entre 3 y 40 caracteres: letras, números, punto, guion o guion bajo.')
  if (username.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) fail(400, 'El email no es válido.')
  const password = String(account?.password || '')
  checkPassword(password)

  let user = await auth.getUserByEmail(email).catch(notFound)
  if (user) {
    // Reintento después de un fallo en Firestore: la cuenta es de este
    // mismo jugador, así que se reusa (y se le pone la contraseña nueva).
    if (user.customClaims?.role !== 'player' || user.customClaims?.slug !== slug) fail(409, `El usuario ${email} ya está en uso.`)
    await auth.updateUser(user.uid, { password, displayName: name || undefined, disabled: false })
  } else {
    user = await auth.createUser({ email, password, displayName: name || undefined })
  }
  const mustChange = Boolean(account.mustChange)
  await auth.setCustomUserClaims(user.uid, playerClaims(slug, mustChange))
  return { uid: user.uid, email, mustChangePassword: mustChange, createdAt: now, createdBy: adminUid }
}

// La cuenta guardada de un slug, si todavía existe en Authentication.
// Si alguien la borró desde la consola de Firebase, cuenta como que no
// tiene: se le puede crear otra.
async function currentAccount(db, auth, slug) {
  const snap = await db.collection(PLAYER_ACCOUNTS).doc(slug).get()
  if (!snap.exists) return null
  const data = snap.data()
  const user = data.uid ? await auth.getUser(data.uid).catch(notFound) : null
  return user ? { ...data, user } : null
}

const publicInfo = (acc) => ({
  hasAccount: true,
  email: acc.email,
  createdAt: acc.createdAt || null,
  passwordResetAt: acc.passwordResetAt || null,
  passwordChangedAt: acc.passwordChangedAt || null,
  mustChangePassword: Boolean(acc.mustChangePassword),
  disabled: Boolean(acc.user?.disabled),
})

// Acceso de un jugador que ya está en el plantel.
//   account-status: { hasAccount, email, ... } (nunca la contraseña)
//   account-create: crea usuario y contraseña. Si ya tiene, 409.
//   account-reset:  le pone una contraseña nueva a la cuenta que tiene.
export async function playerAccess({ db, auth, roster, payload, env = process.env, now = new Date().toISOString(), adminUid = null }) {
  const p = payload || {}
  const slug = typeof p.slug === 'string' ? p.slug.trim() : ''
  const player = roster.players.find((x) => x.slug === slug)
  if (!player) fail(404, `No hay ningún jugador con el slug ${slug || '(vacío)'}.`)

  const acc = await currentAccount(db, auth, slug)

  if (p.action === 'account-status') {
    return acc ? publicInfo(acc) : { hasAccount: false, enabled: env.PLAYER_ACCOUNTS_ENABLED === 'true' }
  }

  if (p.action === 'account-create') {
    if (acc) fail(409, `${player.name} ya tiene cuenta (${acc.email}). Si no se acuerda la contraseña, restablecela.`)
    const account = await ensureAccount({ auth, slug, name: player.name, account: p.account, env, now, adminUid })
    const batch = db.batch()
    batch.set(db.collection(PLAYER_ACCOUNTS).doc(slug), account)
    // Los de alta en el panel ya tienen el doc con hasAccount; los de
    // players.js no tienen ficha en Firestore y no se les crea una.
    if (player.panel) batch.set(db.collection(PLAYERS).doc(slug), { hasAccount: true }, { merge: true })
    await batch.commit()
    return { ...publicInfo({ ...account, user: null }), created: true }
  }

  if (p.action === 'account-reset') {
    checkEnabled(env)
    if (!acc) fail(404, `${player.name} todavía no tiene cuenta. Creala primero.`)
    const password = String(p.password || '')
    checkPassword(password)
    // Cambiar la contraseña cierra las sesiones que tenía abiertas.
    // Salvo que el admin lo destilde, al entrar con la contraseña nueva
    // se le vuelve a pedir que la cambie por una suya.
    const mustChange = p.mustChange !== false
    await auth.updateUser(acc.uid, { password, disabled: false })
    await auth.setCustomUserClaims(acc.uid, playerClaims(slug, mustChange))
    const patch = { passwordResetAt: now, passwordResetBy: adminUid, mustChangePassword: mustChange }
    await db.collection(PLAYER_ACCOUNTS).doc(slug).set(patch, { merge: true })
    return { ...publicInfo({ ...acc, ...patch, user: { disabled: false } }), reset: true }
  }

  return fail(400, 'Acción desconocida.')
}

// El jugador cambió su contraseña desde el panel (reauth + updatePassword
// en el navegador): se le saca el pedido de cambio obligatorio. Sólo
// con un token de un login reciente (la reautenticación renueva
// auth_time), así un token viejo robado no alcanza para esto.
const RECENT_LOGIN_S = 10 * 60
export async function markPasswordChanged({ db, auth, user, now = new Date().toISOString(), nowS = Math.floor(Date.now() / 1000) }) {
  const { role, slug } = user.access || {}
  if (role !== 'player' || !slug) fail(403, 'Sólo las cuentas de jugador usan esto.')
  if (!user.auth_time || nowS - user.auth_time > RECENT_LOGIN_S) fail(401, 'Volvé a escribir tu contraseña actual.')
  await auth.setCustomUserClaims(user.uid, playerClaims(slug, false))
  await db.collection(PLAYER_ACCOUNTS).doc(slug).set({ mustChangePassword: false, passwordChangedAt: now }, { merge: true })
  return { role, slug, mustChangePassword: false, refreshed: true }
}
