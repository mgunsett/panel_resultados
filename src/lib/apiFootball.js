import { auth } from './firebase'

// ─── API-FOOTBALL DESDE EL PANEL ─────────────────────────────────
// El panel no conoce la API Key: le pide todo a la función de Netlify
// `api-football`, mandando el token del admin logueado para que la
// función sepa que el pedido viene del panel.
//
// Ojo en desarrollo: `pnpm dev` levanta sólo Vite, sin funciones. Para
// probar esta parte en local hay que usar `netlify dev`.

const ENDPOINT = '/.netlify/functions/api-football'

export async function callApiFootball(action, params = {}, { method = 'GET' } = {}) {
  const user = auth?.currentUser
  if (!user) throw new Error('No hay sesión iniciada.')
  const token = await user.getIdToken()

  const url = new URL(ENDPOINT, window.location.origin)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  })

  const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` } })

  if (res.status === 404) {
    throw new Error('La función de Netlify no está disponible. En local corré el panel con `netlify dev` en vez de `pnpm dev`.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// Normaliza nombres para comparar "Rondelli" con "M. Rondelli" o
// "Martínez" con "Martinez".
export function normalizeName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Busca al jugador dentro del plantel que devuelve la API: gana el que
// comparta el apellido (última palabra del nombre en players.js).
export function guessSquadMatch(playerName, squad) {
  const words = normalizeName(playerName).split(' ')
  const last = words[words.length - 1]
  return squad.find((p) => normalizeName(p.name).split(' ').includes(last)) || null
}
