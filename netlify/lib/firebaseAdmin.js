import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { roleOf, loadAdminEmails, ROLE_ADMIN } from './roles.js'

// ─── FIREBASE ADMIN (solo servidor) ──────────────────────────────
// Las funciones escriben en Firestore con una cuenta de servicio, que
// no pasa por las reglas de seguridad. Las credenciales salen de la
// cuenta de servicio del proyecto (Firebase Console → Configuración →
// Cuentas de servicio → Generar nueva clave privada) y se cargan en
// Netlify como tres variables sueltas, no como el JSON entero: AWS
// Lambda limita a 4 KB el total de variables de una función.

function getAdminApp() {
  if (getApps().length) return getApps()[0]

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  // Netlify guarda los saltos de línea de la clave como "\n" literales.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Faltan las variables FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL o FIREBASE_ADMIN_PRIVATE_KEY en Netlify.'
    )
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
}

export function adminDb() {
  return getFirestore(getAdminApp())
}

export function adminAuth() {
  return getAuth(getAdminApp())
}

// Valida el token de Firebase que manda el panel y devuelve el token
// decodificado con su rol (ver roles.js), o null si es inválido.
export async function verifyRequest(req) {
  const header = req.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  try {
    const decoded = await adminAuth().verifyIdToken(token)
    const admins = decoded.role === 'player' ? [] : await loadAdminEmails(adminDb())
    return { ...decoded, access: roleOf(decoded, admins) }
  } catch {
    return null
  }
}

// Sólo admins: las funciones del panel (sincronización, alta de
// jugadores) no las puede usar una cuenta de jugador.
export async function requireAdmin(req) {
  const user = await verifyRequest(req)
  return user?.access.role === ROLE_ADMIN ? user : null
}
