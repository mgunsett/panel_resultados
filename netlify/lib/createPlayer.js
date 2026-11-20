import {
  checkSlug, loginEmail, slugify, DEFAULT_LOGIN_DOMAIN, USERNAME_RE,
  PLAYERS, PLAYER_ACCOUNTS, PROFILE_KEYS,
} from '../../src/lib/roster.js'

// ─── ALTA DE JUGADOR (servidor) ──────────────────────────────────
// Lo llama la función create-player con lo que se cargó en el asistente
// de /jugadores/nuevo. Hace tres cosas, en este orden:
//   1. Crea la cuenta del jugador en Firebase Authentication (si se
//      pidió). La contraseña viaja sólo en este pedido: no se guarda en
//      ningún lado. La cuenta lleva el claim role: 'player' para que no
//      pueda entrar al panel.
//   2. Guarda la ficha en players/{slug} (con panel: true y, si el club
//      no existía, el club en `panelClub`).
//   3. Guarda la cuenta (uid y email, nunca la contraseña) en
//      playerAccounts/{slug}, que sólo lee y escribe el servidor.
// Reintentar con el mismo requestId no duplica nada: si la cuenta ya
// existe para ese slug se reusa, y si la ficha ya está se devuelve ok.

export class CreatePlayerError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const fail = (status, msg) => { throw new CreatePlayerError(status, msg) }
const str = (v, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '') || null
const httpsUrl = (v) => {
  const s = str(v, 500)
  if (!s) return null
  try {
    const u = new URL(s)
    return u.protocol === 'https:' ? u.toString() : fail(400, `El link ${s} tiene que empezar con https://`)
  } catch (e) {
    if (e instanceof CreatePlayerError) throw e
    return fail(400, `El link ${s} no es válido.`)
  }
}

export async function createPlayer({ db, auth, roster, payload, env = process.env, now = new Date().toISOString(), adminUid = null }) {
  const p = payload || {}
  const slug = str(p.slug, 60)
  const name = str(p.name, 80)
  const requestId = str(p.requestId, 64)
  if (!name) fail(400, 'Falta el nombre del jugador.')
  if (!requestId) fail(400, 'Falta requestId.')

  // ── Slug libre (o ya creado por este mismo pedido) ──
  // players/{slug} puede existir sin `panel` (sólo con partidos de un
  // jugador viejo): eso no cuenta como ocupado si el slug no está en el
  // plantel; la ficha se suma al doc sin tocar sus subcolecciones.
  const existingDoc = slug ? await db.collection(PLAYERS).doc(slug).get() : null
  const existing = existingDoc?.exists ? existingDoc.data() : null
  if (existing?.panel && existing.requestId === requestId) {
    const acc = await db.collection(PLAYER_ACCOUNTS).doc(slug).get()
    return { slug, clubId: existing.clubId, email: acc.exists ? acc.data().email : null, alreadyCreated: true }
  }
  const slugCheck = checkSlug(slug, roster.players.map((x) => x.slug).concat(existing?.panel ? [slug] : []))
  if (slugCheck.state === 'bad') fail(409, slugCheck.message)

  // ── Club: uno que ya existe o uno nuevo ──
  let clubId = null
  let newClub = null
  if (p.club?.id) {
    if (!roster.clubs.some((c) => c.id === p.club.id)) fail(400, `El club ${p.club.id} no existe.`)
    clubId = p.club.id
  } else if (p.club?.name) {
    const apiTeamId = Number(p.club.apiTeamId) || null
    const same = apiTeamId && roster.clubs.find((c) => c.apiTeamId === apiTeamId)
    if (same) {
      clubId = same.id
    } else {
      const base = slugify(p.club.name) || 'club'
      let id = base
      for (let i = 2; roster.clubs.some((c) => c.id === id); i++) id = `${base}_${i}`
      clubId = id
      newClub = {
        id, name: str(p.club.name, 80), country: str(p.club.country, 60), competition: str(p.club.competition, 80),
        stadium: str(p.club.stadium, 120), crest: httpsUrl(p.club.crest), apiTeamId,
      }
    }
  }

  const profile = {}
  PROFILE_KEYS.forEach((k) => { profile[k] = str(p.profile?.[k] == null ? '' : String(p.profile[k]), 120) })
  const sources = {}
  PROFILE_KEYS.forEach((k) => { if (p.sources?.[k] === 'api' || p.sources?.[k] === 'manual') sources[k] = p.sources[k] })
  const career = (Array.isArray(p.career) ? p.career : []).slice(0, 40)
    .map((c) => ({ years: str(c?.years, 20), club: str(c?.club, 80) }))
    .filter((c) => c.club)

  const player = {
    panel: true, slug, name, clubId,
    photo: httpsUrl(p.photo),
    apiPlayerId: Number(p.apiPlayerId) || null,
    landingUrl: httpsUrl(p.landingUrl),
    driveUrl: httpsUrl(p.driveUrl),
    profile, sources, career,
    requestId, createdAt: now,
  }
  if (newClub) player.panelClub = newClub
  if (player.driveUrl && !/^https:\/\/drive\.google\.com\//.test(player.driveUrl)) fail(400, 'El link de fotos tiene que ser de drive.google.com.')

  // ── 1. Cuenta en Firebase Authentication ──
  let account = null
  if (p.account) {
    if (env.PLAYER_ACCOUNTS_ENABLED !== 'true') {
      fail(403, 'La creación de cuentas de jugador está apagada. Activá PLAYER_ACCOUNTS_ENABLED=true en Netlify después de actualizar las reglas de Firestore (ver README).')
    }
    const username = String(p.account.username || '').trim().toLowerCase()
    const email = loginEmail(username, env.PLAYER_LOGIN_DOMAIN || DEFAULT_LOGIN_DOMAIN)
    if (!username.includes('@') && !USERNAME_RE.test(username)) fail(400, 'El usuario tiene que tener entre 3 y 40 caracteres: letras, números, punto, guion o guion bajo.')
    if (username.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) fail(400, 'El email no es válido.')
    const password = String(p.account.password || '')
    if (password.length < 10) fail(400, 'La contraseña tiene que tener al menos 10 caracteres.')

    let user = await auth.getUserByEmail(email).catch((e) => (e?.code === 'auth/user-not-found' ? null : Promise.reject(e)))
    if (user) {
      // Reintento después de un fallo en Firestore: la cuenta es de este
      // mismo jugador, así que se reusa (y se le pone la contraseña nueva).
      if (user.customClaims?.role !== 'player' || user.customClaims?.slug !== slug) fail(409, `El usuario ${email} ya está en uso.`)
      await auth.updateUser(user.uid, { password, displayName: name })
    } else {
      user = await auth.createUser({ email, password, displayName: name })
    }
    await auth.setCustomUserClaims(user.uid, { role: 'player', slug })
    account = { uid: user.uid, email, mustChangePassword: Boolean(p.account.mustChange), createdAt: now, createdBy: adminUid }
  }
  player.hasAccount = Boolean(account)

  // ── 2 y 3. Ficha y cuenta, juntas ──
  const batch = db.batch()
  batch.set(db.collection(PLAYERS).doc(slug), player, { merge: true })
  if (account) batch.set(db.collection(PLAYER_ACCOUNTS).doc(slug), account)
  await batch.commit()

  return { slug, clubId, email: account?.email || null, newClub: Boolean(newClub) }
}
