import { getDoc } from 'firebase/firestore'
import { uploadBytes, getDownloadURL } from 'firebase/storage'
import { playerMatchDoc, playerShieldRef, MATCH_SLOTS } from './firebase'

// ─── NÚCLEO COMPARTIDO DE PARTIDOS ───────────────────────────────
// Lo usan por igual la edición individual (usePlayerMatches) y la
// edición por club (useClubMatches). El payload se arma en un solo
// lugar a propósito: es el contrato exacto que leen las landings en
// producción, así que las dos vistas tienen que escribir lo mismo.

export const emptyMatches = { last: {}, next: {} }

// Campos del partido que se comparan entre jugadores para saber si un
// club está sincronizado. `updated_at` queda afuera: cambia en cada
// guardado y no hace al contenido del partido.
const COMPARED_FIELDS = [
  'home_team', 'away_team', 'home_score', 'away_score',
  'match_date', 'stadium', 'competition', 'home_shield', 'away_shield',
]

function fileExtension(file) {
  const parts = file.name.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : 'png'
}

export async function uploadShield(slug, file, teamName) {
  const shieldRef = playerShieldRef(slug, teamName, fileExtension(file))
  await uploadBytes(shieldRef, file)
  return getDownloadURL(shieldRef)
}

// Sube los escudos que hayan cambiado y devuelve el documento listo
// para escribir. `ownerSlug` define bajo qué carpeta de Storage queda
// el archivo; al guardar por club se sube una sola vez y la URL se
// reusa en todos los jugadores, en vez de subir el mismo archivo N
// veces.
export async function buildMatchPayload(form, shieldFiles, ownerSlug) {
  let homeShieldUrl = form.home_shield || null
  let awayShieldUrl = form.away_shield || null

  if (shieldFiles?.home) {
    homeShieldUrl = await uploadShield(ownerSlug, shieldFiles.home, form.home_team || 'home')
  }
  if (shieldFiles?.away) {
    awayShieldUrl = await uploadShield(ownerSlug, shieldFiles.away, form.away_team || 'away')
  }

  return {
    home_team: form.home_team,
    away_team: form.away_team,
    home_score: form.home_score !== '' ? Number(form.home_score) : null,
    away_score: form.away_score !== '' ? Number(form.away_score) : null,
    match_date: form.match_date,
    stadium: form.stadium,
    competition: form.competition,
    home_shield: homeShieldUrl,
    away_shield: awayShieldUrl,
    updated_at: new Date().toISOString(),
  }
}

// Lee los dos slots (last / next) de un jugador.
export async function fetchPlayerMatches(slug) {
  const snaps = await Promise.all(
    MATCH_SLOTS.map((slot) => getDoc(playerMatchDoc(slug, slot)))
  )
  const result = { last: {}, next: {} }
  snaps.forEach((snap, i) => {
    if (snap.exists()) result[MATCH_SLOTS[i]] = snap.data()
  })
  return result
}

function isSameMatch(a, b) {
  return COMPARED_FIELDS.every((field) => (a?.[field] ?? null) === (b?.[field] ?? null))
}

function updatedAtMs(match) {
  const ms = Date.parse(match?.updated_at || '')
  return Number.isNaN(ms) ? 0 : ms
}

// Consolida el mismo slot leído de varios jugadores en un único valor
// para mostrar. Gana el más recientemente actualizado, y avisamos si
// no todos coinciden: eso pasa cuando alguien editó a un jugador por
// separado y el club quedó desparejo.
export function consolidateSlot(matchesBySlug, slot) {
  const found = Object.values(matchesBySlug)
    .map((m) => m?.[slot])
    .filter((m) => m && m.home_team)

  if (!found.length) return { value: {}, outOfSync: false }

  const winner = found.reduce((a, b) => (updatedAtMs(b) > updatedAtMs(a) ? b : a))
  const total = Object.keys(matchesBySlug).length
  const outOfSync = found.length !== total || found.some((m) => !isSameMatch(m, winner))

  return { value: winner, outOfSync }
}
