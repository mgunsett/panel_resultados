// ─── PLANTEL: ARCHIVOS + FIRESTORE ───────────────────────────────
// Los jugadores y clubes históricos siguen en src/data (players.js y
// clubs.js). Los que se dan de alta desde el panel (/jugadores/nuevo)
// se guardan en el propio doc `players/{slug}` de Firestore, marcado
// con `panel: true`. Si el jugador trajo un club que no existía, el
// club viaja dentro de su doc (`panelClub`). Así alcanza con las reglas
// que ya están: `players/{slug}` se lee público y lo escribe el admin.
// La cuenta del jugador (uid y email) va aparte, en
// `playerAccounts/{slug}`, que sólo toca el servidor.
// Este módulo es puro (sin Firebase): lo usan el navegador y las
// funciones de Netlify.

export const PLAYERS = 'players'
export const PLAYER_ACCOUNTS = 'playerAccounts'

// ─── EDICIÓN DESDE EL PANEL ──────────────────────────────────────
// Los de alta en el panel se editan en su propio doc (son de Firestore).
// Los de players.js no se pueden reescribir desde el navegador, así que
// sus cambios van como "override" en players/{slug}: `panelEdit` (sólo
// los campos que difieren del archivo) y `panelEdited: true` para
// poder buscarlos. Las landings no leen ese doc raíz (sólo matches,
// stats y shields), así que no se enteran.
export const EDIT_KEYS = ['name', 'role', 'clubId', 'apiPlayerId', 'photo', 'landingUrl', 'driveUrl', 'profile']
export const PROFILE_KEYS = ['birthDate', 'birthPlace', 'nationality', 'height', 'weight', 'position', 'number', 'foot']

// Aplica un override a la ficha del archivo sin tocar el original.
export function applyEdit(player, edit) {
  if (!edit || typeof edit !== 'object') return player
  const out = { ...player, edited: true }
  EDIT_KEYS.forEach((k) => {
    if (!(k in edit)) return
    out[k] = k === 'profile' ? { ...(player.profile || {}), ...(edit.profile || {}) } : edit[k]
  })
  return out
}

// Une lo de los archivos con lo de Firestore. Si un slug o un id de
// club ya existe en los archivos, gana el archivo: Firestore sólo suma.
// `edits` = docs con panelEdit ({ slug, panelEdit }): pisan campos de
// los jugadores del archivo.
export function mergeRoster({ players, clubs, extraPlayers = [], edits = [] }) {
  const clubIds = new Set(clubs.map((c) => c.id))
  const slugs = new Set(players.map((p) => p.slug))
  const extraClubs = []
  extraPlayers.forEach((p) => {
    const c = p?.panelClub
    if (c?.id && !clubIds.has(c.id)) { clubIds.add(c.id); extraClubs.push(c) }
  })
  const bySlug = new Map(edits.filter((e) => e?.slug && e.panelEdit).map((e) => [e.slug, e.panelEdit]))
  return {
    clubs: [...clubs, ...extraClubs],
    players: [
      ...players.map((p) => (bySlug.has(p.slug) ? applyEdit(p, bySlug.get(p.slug)) : p)),
      ...extraPlayers.filter((p) => p?.slug && !slugs.has(p.slug)),
    ],
  }
}

// "Nicolás Fernández" → "nicolas_fernandez". La mayoría de los slugs
// del panel usan guion bajo; los viejos con guion (keki-piovi) se
// respetan, pero los nuevos se sugieren con "_".
export function slugify(text) {
  return String(text || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export const SLUG_RE = /^[a-z0-9]+([_-][a-z0-9]+)*$/

// Valida un slug contra los que ya existen. Devuelve
// { state: 'ok' | 'warn' | 'bad', message, similar }.
// "warn" = no choca exacto pero sólo difiere en "-" / "_" de uno que
// existe (keki_piovi vs keki-piovi): casi seguro es el mismo jugador.
export function checkSlug(slug, existing) {
  if (!slug) return { state: 'bad', message: 'Falta el slug.' }
  if (slug.length > 60) return { state: 'bad', message: 'Máximo 60 caracteres.' }
  if (!SLUG_RE.test(slug)) {
    return { state: 'bad', message: 'Solo minúsculas, números y _ o - entre palabras. Sin espacios ni tildes.' }
  }
  if (existing.includes(slug)) return { state: 'bad', message: `Ya existe un jugador con “${slug}”. Elegí otro.` }
  const flat = (s) => s.replace(/[-_]/g, '')
  const similar = existing.find((s) => flat(s) === flat(slug))
  if (similar) {
    return { state: 'warn', similar, message: `Se parece a “${similar}”, que ya existe. Revisá que no sea el mismo jugador.` }
  }
  return { state: 'ok', message: 'Disponible.' }
}

// Usuario → email de Firebase Authentication. Si ya es un email se usa
// tal cual; si no, se le agrega el dominio interno de los jugadores.
export const DEFAULT_LOGIN_DOMAIN = 'jugadores.ledsports.app'

export function loginEmail(username, domain = DEFAULT_LOGIN_DOMAIN) {
  const u = String(username || '').trim().toLowerCase()
  if (!u) return ''
  return u.includes('@') ? u : `${u}@${domain}`
}

export const USERNAME_RE = /^[a-z0-9._-]{3,40}$/
