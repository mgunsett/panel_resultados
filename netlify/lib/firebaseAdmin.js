import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

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

// Valida el token de Firebase que manda el panel. Cualquier usuario
// logueado es admin, igual que en las reglas de Firestore.
export async function requireUser(req) {
  const header = req.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  try {
    return await adminAuth().verifyIdToken(token)
  } catch {
    return null
  }
}
