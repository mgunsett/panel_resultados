// ─── HORARIO DE LA SINCRONIZACIÓN AUTOMÁTICA ─────────────────────
// Lo usan la función programada (netlify/functions/sync-results.mjs)
// y el panel, para mostrar cuándo es la próxima. Todo en UTC.
//   lunes a viernes  09:00 UTC (06:00 en Argentina)
//   sábado y domingo 09:00 y 21:00 UTC (06:00 y 18:00 en Argentina)

const DAILY_HOUR = 9
const WEEKEND_EXTRA_HOUR = 21
const isWeekend = (d) => d.getUTCDay() === 0 || d.getUTCDay() === 6

function runsOf(day) {
  return isWeekend(day) ? [DAILY_HOUR, WEEKEND_EXTRA_HOUR] : [DAILY_HOUR]
}

// ¿A esta hora (UTC) le toca correr? El cron dispara 09 y 21 todos los
// días; la de las 21 se descarta de lunes a viernes.
export function isScheduledRun(now = new Date()) {
  return runsOf(now).includes(now.getUTCHours())
}

// Próxima pasada programada después de `now`.
export function nextScheduledSync(now = new Date()) {
  for (let add = 0; add < 3; add++) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + add))
    for (const h of runsOf(day)) {
      const t = new Date(day.getTime() + h * 3600 * 1000)
      if (t > now) return t
    }
  }
  return null
}
