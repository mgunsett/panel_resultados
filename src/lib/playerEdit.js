import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { EDIT_KEYS, PROFILE_KEYS, PLAYERS } from './roster'

// ─── EDITAR JUGADOR (navegador) ──────────────────────────────────
// Arma el formulario de "Editar jugador" a partir de la ficha actual,
// lo valida con las mismas reglas del alta y lo guarda:
//   · Alta en el panel (panel: true): los campos van directo a su doc.
//   · De players.js: sólo lo que difiere del archivo va a `panelEdit`
//     en players/{slug}, con `panelEdited: true` (ver roster.js).
// Las reglas actuales ya dejan escribir players/{slug} al admin
// logueado. El slug no se edita: es la ruta de sus partidos y el
// VITE_PLAYER_SLUG de su landing.

export const PROFILE_FIELDS = [
  ['birthDate', 'Fecha de nacimiento', 'dd/mm/aaaa', 'date'],
  ['birthPlace', 'Lugar de nacimiento', 'Ciudad, país'],
  ['nationality', 'Nacionalidad', 'País'],
  ['height', 'Altura', '180 cm'],
  ['weight', 'Peso', '75 kg'],
  ['position', 'Posición', 'Ej: Defensor'],
  ['number', 'Dorsal', 'Número'],
  ['foot', 'Pie hábil', 'Derecho / Izquierdo'],
]

const txt = (v) => (v == null ? '' : String(v))

export function formFromPlayer(player) {
  const profile = {}
  PROFILE_KEYS.forEach((k) => { profile[k] = txt(player?.profile?.[k]) })
  return {
    name: txt(player?.name),
    role: player?.role === 'DT' ? 'DT' : '',
    clubId: txt(player?.clubId),
    apiPlayerId: player?.apiPlayerId ? String(player.apiPlayerId) : '',
    photo: txt(player?.photo),
    landingUrl: txt(player?.landingUrl),
    driveUrl: txt(player?.driveUrl),
    profile,
  }
}

// Mismos chequeos que el paso "Links y clave" del alta.
export function checkUrl(v, re, okMsg) {
  if (!v) return { bad: false, msg: 'Si no tiene, dejalo vacío: el botón queda deshabilitado.' }
  let ok = false
  try { ok = new URL(v).protocol === 'https:' && re.test(v) } catch { ok = false }
  return ok ? { bad: false, msg: okMsg } : { bad: true, msg: 'El link no parece válido (tiene que empezar con https://).' }
}
export const LANDING_RE = /^https:\/\/[^\s/.]+\.[^\s]+/
export const DRIVE_RE = /^https:\/\/drive\.google\.com\//

export function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Falta el nombre.'
  else if (form.name.trim().length > 80) errors.name = 'Máximo 80 caracteres.'
  if (form.apiPlayerId && !/^\d{1,9}$/.test(form.apiPlayerId)) errors.apiPlayerId = 'Solo números.'
  if (checkUrl(form.landingUrl, LANDING_RE).bad) errors.landingUrl = 'El link de la landing no es válido.'
  if (checkUrl(form.driveUrl, DRIVE_RE).bad) errors.driveUrl = 'El link de fotos tiene que ser de drive.google.com.'
  return errors
}

// Formulario → valores para Firestore (null = vacío).
function clean(form) {
  const s = (v, max = 120) => v.trim().slice(0, max) || null
  const profile = {}
  PROFILE_KEYS.forEach((k) => { profile[k] = s(form.profile[k]) })
  return {
    name: s(form.name, 80),
    role: form.role === 'DT' ? 'DT' : null,
    clubId: s(form.clubId, 60),
    apiPlayerId: Number(form.apiPlayerId) || null,
    photo: s(form.photo, 1000),
    landingUrl: s(form.landingUrl, 500),
    driveUrl: s(form.driveUrl, 500),
    profile,
  }
}

const norm = (k, v) => {
  if (k === 'profile') return JSON.stringify(PROFILE_KEYS.map((p) => txt(v?.[p]).trim()))
  if (k === 'apiPlayerId') return Number(v) || null
  return txt(v).trim() || null
}

// Campos que difieren de `base` (la ficha de players.js).
export function diffFromFile(values, base) {
  const out = {}
  EDIT_KEYS.forEach((k) => {
    if (norm(k, values[k]) !== norm(k, base?.[k])) out[k] = values[k]
  })
  return out
}

// Guarda y devuelve cuántos campos quedaron distintos del archivo
// (para el aviso), o null si es un jugador de alta en el panel.
export async function savePlayerEdit({ player, base, form, crest }) {
  if (!db || !auth?.currentUser) throw new Error('No hay sesión iniciada.')
  const values = clean(form)
  const ref = doc(db, PLAYERS, player.slug)
  const meta = { editedAt: new Date().toISOString(), editedBy: auth.currentUser.uid }

  if (player.panel) {
    const patch = { ...values, ...meta }
    if (crest && player.panelClub && player.panelClub.id === values.clubId) patch['panelClub.crest'] = crest
    await updateDoc(ref, patch)
    return null
  }

  const panelEdit = diffFromFile(values, base)
  const count = Object.keys(panelEdit).length
  // mergeFields reemplaza panelEdit entero (no lo mezcla con el viejo)
  // y no toca nada más del doc.
  await setDoc(ref, { panelEdit, panelEdited: count > 0, ...meta }, { mergeFields: ['panelEdit', 'panelEdited', 'editedAt', 'editedBy'] })
  return count
}

// Deshace los cambios del panel de un jugador de players.js.
export async function resetPlayerEdit(player) {
  if (!db || !auth?.currentUser) throw new Error('No hay sesión iniciada.')
  await setDoc(doc(db, PLAYERS, player.slug),
    { panelEdit: {}, panelEdited: false, editedAt: new Date().toISOString(), editedBy: auth.currentUser.uid },
    { mergeFields: ['panelEdit', 'panelEdited', 'editedAt', 'editedBy'] })
}
