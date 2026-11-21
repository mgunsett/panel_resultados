import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, storage, normalizeTeamName } from './firebase'
import { callApiFootball } from './apiFootball'

// ─── ALTA DE JUGADOR (navegador) ─────────────────────────────────
// Helpers del asistente de /jugadores/nuevo: API-Football, imágenes,
// contraseña y el pedido final a la función create-player.

export const POSITIONS = { Goalkeeper: 'Arquero', Defender: 'Defensor', Midfielder: 'Mediocampista', Attacker: 'Delantero' }
export const positionEs = (p) => POSITIONS[p] || p || ''

export const searchApiPlayers = (q) => callApiFootball('players', { q })
export const fetchApiProfile = (id) => callApiFootball('profile', { id })

// 14 caracteres sin los que se confunden al dictarlos (0/O, 1/l/I).
const PASS_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*'
export function generatePassword(length = 14) {
  const out = new Uint32Array(length)
  crypto.getRandomValues(out)
  return Array.from(out, (n) => PASS_CHARS[n % PASS_CHARS.length]).join('')
}

export const MAX_IMAGE_MB = 5

// Achica la imagen (lado mayor `max` px) y la pasa a WebP antes de subirla.
export async function toWebp(file, max = 900) {
  if (!file?.type?.startsWith('image/')) throw new Error('El archivo no es una imagen.')
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    throw new Error(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1).replace('.', ',')} MB. El máximo es ${MAX_IMAGE_MB} MB.`)
  }
  if (file.type === 'image/svg+xml') return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', 0.86))
  if (!blob) throw new Error('No se pudo procesar la imagen.')
  return blob
}

async function upload(path, blob) {
  const r = ref(storage, path)
  await uploadBytes(r, blob, { contentType: blob.type || 'image/webp', cacheControl: 'public,max-age=31536000' })
  return getDownloadURL(r)
}

// Las reglas de Storage hoy sólo dejan escribir en players/{slug}/shields/,
// así que la foto va ahí con un nombre que ningún equipo puede tener
// (normalizeTeamName nunca empieza con "_").
export const uploadPlayerPhoto = (slug, blob) => upload(`players/${slug}/shields/_foto.webp`, blob)
export const uploadClubCrest = (slug, clubName, blob) =>
  upload(`players/${slug}/shields/${normalizeTeamName(clubName)}.${blob.type === 'image/svg+xml' ? 'svg' : 'webp'}`, blob)

export const createPlayerRequest = (payload) => callCreatePlayer(payload)

// Usuario y contraseña de un jugador que ya está cargado (ver
// netlify/lib/playerAccounts.js). Sólo para admins.
export const accountStatus = (slug) => callCreatePlayer({ action: 'account-status', slug })
export const createAccount = (slug, account) => callCreatePlayer({ action: 'account-create', slug, account })
export const resetAccountPassword = (slug, password) => callCreatePlayer({ action: 'account-reset', slug, password })

async function callCreatePlayer(payload) {
  const user = auth?.currentUser
  if (!user) throw new Error('No hay sesión iniciada.')
  const res = await fetch('/.netlify/functions/create-player', {
    method: 'POST',
    headers: { Authorization: `Bearer ${await user.getIdToken()}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (res.status === 404) throw new Error('La función de Netlify no está disponible. En local corré el panel con `netlify dev`.')
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// "1999-03-14" → "14/03/1999"
export const formatDate = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.split('-').reverse().join('/') : iso || '')
