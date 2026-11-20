import { createApiFootballClient } from '../lib/apiFootball.js'
import { adminDb } from '../lib/firebaseAdmin.js'
import { runSync } from '../lib/sync.js'
import { loadRoster } from '../lib/roster.js'
import { isScheduledRun } from '../../src/lib/syncSchedule.js'

// ─── SINCRONIZACIÓN PROGRAMADA ───────────────────────────────────
// Netlify la corre sola según `schedule` (cron en UTC):
//   lunes a viernes  1 vez por día, 06:00 de Argentina (09:00 UTC)
//   sábado y domingo 2 veces, 06:00 y 18:00 de Argentina (09:00 y 21:00 UTC)
// El cron dispara todos los días a las 09 y 21 UTC; la pasada de las
// 21 se saltea de lunes a viernes. Son ~26 requests por pasada con 13
// clubes, más uno por club los días de partido. "Sincronizar ahora"
// del panel sigue funcionando igual, a cualquier hora.
//
// Para pausarla sin redeployar código: SYNC_ENABLED=false en Netlify.
// El log de cada pasada queda en Netlify → Logs → Functions.

export default async () => {
  if (process.env.SYNC_ENABLED === 'false') {
    console.log('Sincronización pausada (SYNC_ENABLED=false).')
    return
  }
  if (!isScheduledRun(new Date())) {
    console.log('Pasada de las 21 UTC: sólo corre sábados y domingos.')
    return
  }

  const db = adminDb()
  const { clubs, players } = await loadRoster(db)
  const report = await runSync({
    db,
    api: createApiFootballClient(),
    clubs,
    players,
  })
  console.log(JSON.stringify(report, null, 2))
}

export const config = {
  schedule: '0 9,21 * * *',
}
