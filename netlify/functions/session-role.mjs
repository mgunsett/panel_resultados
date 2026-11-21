import { adminAuth, verifyRequest } from '../lib/firebaseAdmin.js'
import { ROLE_ADMIN } from '../lib/roles.js'

// ─── ROL DE LA SESIÓN ────────────────────────────────────────────
// El panel la llama al iniciar sesión cuando la cuenta todavía no tiene
// rol (los admins de antes de los roles). Si el email está en
// panelAdmins (Firestore) le pone el claim role: 'admin' y el panel refresca el
// token. Devuelve { role, slug? }; 403 si la cuenta no tiene acceso.
// Nunca le cambia el rol a una cuenta que ya tiene uno.

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Usá POST.' })
  const user = await verifyRequest(req)
  if (!user) return json(401, { error: 'Sesión inválida. Volvé a iniciar sesión.' })

  const { role, slug, needsClaim, legacy } = user.access
  if (!role) return json(403, { role: null, error: 'Esta cuenta no tiene acceso al panel. Pedile al equipo de LED Sports que la habilite.' })

  if (needsClaim) {
    try {
      // Sólo cuentas sin ningún claim llegan acá: no se pisa nada.
      await adminAuth().setCustomUserClaims(user.uid, { role: ROLE_ADMIN })
      return json(200, { role, refreshed: true })
    } catch (err) {
      console.error('session-role:', err)
      // Igual es admin por la lista; el claim se reintenta la próxima vez.
      return json(200, { role, refreshed: false })
    }
  }
  return json(200, { role, slug: slug || null, legacy: Boolean(legacy) })
}
