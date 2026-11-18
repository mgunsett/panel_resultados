import { clubs } from '../../src/data/clubs.js'
import { players } from '../../src/data/players.js'
import { createApiFootballClient } from '../lib/apiFootball.js'
import { adminDb } from '../lib/firebaseAdmin.js'
import { runSync } from '../lib/sync.js'

// ─── SINCRONIZACIÓN PROGRAMADA ───────────────────────────────────
// Netlify la corre sola según `schedule` (cron en UTC). Cada 3 horas
// son 8 pasadas por día: ~210 requests diarios con 13 clubes, más uno
// por club los días de partido.
//
// Para pausarla sin redeployar código: SYNC_ENABLED=false en Netlify.
// El log de cada pasada queda en Netlify → Logs → Functions.

export default async () => {
  if (process.env.SYNC_ENABLED === 'false') {
    console.log('Sincronización pausada (SYNC_ENABLED=false).')
    return
  }

  const report = await runSync({
    db: adminDb(),
    api: createApiFootballClient(),
    clubs,
    players,
  })
  console.log(JSON.stringify(report, null, 2))
}

export const config = {
  schedule: '0 */3 * * *',
}
