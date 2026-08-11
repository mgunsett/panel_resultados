import { initializeApp } from 'firebase/app'
import { getFirestore, doc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage, ref } from 'firebase/storage'

// ─── FIREBASE (proyecto compartido con todas las landings) ───────
// Mismas variables VITE_FIREBASE_* que usan las landings individuales.
// La diferencia clave: acá NO hay VITE_PLAYER_SLUG fijo — el panel
// administra a todos los jugadores, así que el slug se recibe como
// parámetro en cada helper.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const requiredKeys = ['apiKey', 'projectId']
export const isFirebaseConfigured = requiredKeys.every((k) => Boolean(firebaseConfig[k]))

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null
export const db = app ? getFirestore(app) : null
export const auth = app ? getAuth(app) : null
export const storage = app ? getStorage(app) : null

// Slots válidos de la subcolección `matches` de cada jugador.
export const MATCH_SLOTS = ['last', 'next']

function assertSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    throw new Error('Falta el slug del jugador (viene del parámetro de la URL).')
  }
}

// Doc de partidos: players/{slug}/matches/{last|next}
export function playerMatchDoc(slug, slot) {
  assertSlug(slug)
  if (!MATCH_SLOTS.includes(slot)) {
    throw new Error(`Slot inválido: "${slot}". Esperado: ${MATCH_SLOTS.join(' | ')}.`)
  }
  return doc(db, 'players', slug, 'matches', slot)
}

// Normaliza el nombre de un equipo para usarlo como nombre de archivo,
// igual que en las landings: espacios → "_" y todo en minúsculas.
export function normalizeTeamName(name) {
  return String(name || '').trim().replace(/\s+/g, '_').toLowerCase()
}

// Ref de Storage para un escudo: players/{slug}/shields/{equipo}.{ext}
export function playerShieldRef(slug, teamName, ext) {
  assertSlug(slug)
  return ref(storage, `players/${slug}/shields/${normalizeTeamName(teamName)}.${ext}`)
}
