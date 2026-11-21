import { adminAuth, adminDb, requireAdmin } from '../lib/firebaseAdmin.js'
import { loadRoster } from '../lib/roster.js'
import { createPlayer, CreatePlayerError } from '../lib/createPlayer.js'
import { playerAccess, AccountError, ACCOUNT_ACTIONS } from '../lib/playerAccounts.js'

// ─── ALTA DE JUGADOR ─────────────────────────────────────────────
// POST con el JSON del asistente de /jugadores/nuevo y el token del
// admin logueado. La cuenta del jugador se crea acá con el Admin SDK:
// hacerlo desde el navegador cerraría la sesión del admin. Detalle de
// lo que hace en netlify/lib/createPlayer.js.
// Con `action` (account-status / account-create / account-reset) y un
// `slug` del plantel, en cambio, maneja el usuario y la contraseña de
// un jugador que ya estaba cargado: netlify/lib/playerAccounts.js.

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Usá POST.' })
  const user = await requireAdmin(req)
  if (!user) return json(401, { error: 'Sesión inválida. Volvé a iniciar sesión en el panel.' })

  const payload = await req.json().catch(() => null)
  if (!payload) return json(400, { error: 'El pedido no trae datos.' })

  try {
    const db = adminDb()
    const roster = await loadRoster(db)
    const run = ACCOUNT_ACTIONS.includes(payload.action) ? playerAccess : createPlayer
    const result = await run({ db, auth: adminAuth(), roster, payload, adminUid: user.uid })
    return json(200, result)
  } catch (err) {
    if (err instanceof CreatePlayerError || err instanceof AccountError) return json(err.status, { error: err.message })
    console.error('create-player:', err)
    return json(500, { error: err.message || 'No se pudo crear el jugador.' })
  }
}
