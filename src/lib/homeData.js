// ─── DATOS DEL HOME ("Vitrina de jugadores") ─────────────────────
// Funciones puras que arman lo que muestra el home a partir de lo que
// ya hay en Firestore por jugador: matches/{last|next} y stats/*.
// Sin lecturas extra ni consultas a la API.

const MONTHS = {
  ene: 0, jan: 0, feb: 1, mar: 2, abr: 3, apr: 3, may: 4, jun: 5, jul: 6,
  ago: 7, aug: 7, sep: 8, set: 8, oct: 9, nov: 10, dic: 11, dec: 11,
}

export const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Fecha de un partido como Date local. La sincronización guarda
// `match_datetime` (ISO con zona); lo cargado a mano sólo tiene
// `match_date` en texto libre ("22 Jun 2025") y quizás `match_time`.
export function matchDate(match) {
  if (!match) return null
  if (match.match_datetime) {
    const d = new Date(match.match_datetime)
    if (!Number.isNaN(d.getTime())) return d
  }
  const m = /(\d{1,2})\s+([a-záéíóú]+)\.?\s+(\d{4})/i.exec(String(match.match_date || ''))
  if (!m) return null
  const month = MONTHS[m[2].normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 3).toLowerCase()]
  if (month === undefined) return null
  const [hh, mm] = /^(\d{1,2}):(\d{2})/.exec(match.match_time || '')?.slice(1) || [12, 0]
  return new Date(Number(m[3]), month, Number(m[1]), Number(hh), Number(mm))
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime()

// Lunes a domingo de la semana de `now`.
export function weekDays(now = new Date()) {
  const today = startOfDay(now)
  const offset = (today.getDay() + 6) % 7 // lunes = 0
  return Array.from({ length: 7 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset + i))
}

export function formatTime(d) {
  return d ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : ''
}

export function formatDay(d) {
  return d ? `${DAY_SHORT[d.getDay()]} ${d.getDate()}` : ''
}

const hasScore = (m) => m?.home_score !== null && m?.home_score !== undefined && m?.home_score !== ''

export function scoreline(m) {
  if (!m?.home_team) return ''
  return hasScore(m) ? `${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team}` : `${m.home_team} vs ${m.away_team}`
}

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// "vs Lanús (L)" o "en Boca" desde el punto de vista del club del jugador.
export function opponentLabel(match, club) {
  if (!match?.home_team) return ''
  const home = norm(match.home_team)
  const isHome = club && (home === norm(club.name) || home.includes(norm(club.name)) || norm(club.name).includes(home))
  const isAway = club && !isHome && norm(match.away_team).includes(norm(club.name))
  if (isHome) return `vs ${match.away_team} (L)`
  if (isAway) return `en ${match.home_team}`
  return `${match.home_team} vs ${match.away_team}`
}

// Estado de la landing para la tarjeta del jugador.
//   ok   todo se actualiza solo
//   rev  necesita algo a mano (sin ID de API, club sin ID, bloqueado)
//   dt   director técnico: sin estadísticas
export function playerStatus(player, club, matches) {
  if (player.role === 'DT') return { id: 'dt', label: 'DT', reason: 'Director técnico: lleva partidos, no estadísticas.' }
  if (!club?.apiTeamId) return { id: 'rev', label: 'Revisar', reason: 'Su club no tiene ID de API-Football: los partidos se cargan a mano.' }
  if (!player.apiPlayerId) return { id: 'rev', label: 'Revisar', reason: 'Sin ID de API-Football: no recibe estadísticas automáticas.' }
  if (matches?.last?.locked || matches?.next?.locked) return { id: 'rev', label: 'Revisar', reason: 'Tiene un partido bloqueado: la sincronización no lo actualiza.' }
  return { id: 'ok', label: 'Al día', reason: 'Se actualiza solo con API-Football.' }
}

// "Dom 22 19:00 · en Boca" para el próximo partido de un jugador.
export function nextMatchLabel(next, club) {
  if (!next?.home_team) return ''
  const d = matchDate(next)
  const time = next.match_time || (next.match_datetime ? formatTime(d) : '')
  const when = d ? `${formatDay(d)}${time ? ` ${time}` : ''} · ` : next.match_date ? `${next.match_date} · ` : ''
  return `${when}${opponentLabel(next, club)}`
}

// Fila lista para mostrar: estado de la landing y próximo partido.
export function enrichRow(r) {
  const nextDate = matchDate(r.matches?.next)
  return { ...r, status: playerStatus(r.player, r.club, r.matches), nextDate, nextLabel: nextMatchLabel(r.matches?.next, r.club) }
}

// Partidos de la semana, uno por partido real (no por jugador): los
// jugadores del mismo club que juegan el mismo partido se agrupan.
export function weekMatches(rows, now = new Date()) {
  const days = weekDays(now)
  const first = days[0]
  const end = new Date(days[6].getFullYear(), days[6].getMonth(), days[6].getDate() + 1)
  const byKey = new Map()

  rows.forEach(({ player, club, matches }) => {
    ;['last', 'next'].forEach((slot) => {
      const m = matches?.[slot]
      const d = matchDate(m)
      if (!m?.home_team || !d || d < first || d >= end) return
      const key = `${startOfDay(d).getTime()}|${norm(m.home_team)}|${norm(m.away_team)}`
      if (!byKey.has(key)) {
        const played = slot === 'last' && hasScore(m)
        let status
        if (m.locked) status = 'bloq'
        else if (played) status = 'jugado'
        else if (club?.apiTeamId && m.source === 'api') status = 'auto'
        else if (!club?.apiTeamId) status = 'manual'
        else status = 'pendiente'
        byKey.set(key, { key, date: d, match: m, club, status, players: [] })
      }
      const entry = byKey.get(key)
      if (!entry.players.some((p) => p.slug === player.slug)) entry.players.push(player)
    })
  })

  const list = [...byKey.values()].sort((a, b) => a.date - b.date)
  return days.map((day) => ({ day, matches: list.filter((x) => sameDay(x.date, day)) }))
}

export const MATCH_BADGES = {
  jugado: { label: 'Jugado', bg: '#2a2420', color: '#DBCCAF' },
  auto: { label: 'Automático', bg: '#24392b', color: '#8fe3ae' },
  pendiente: { label: 'Se sincroniza', bg: '#24392b', color: '#8fe3ae' },
  manual: { label: 'Cargar a mano', bg: '#3d1f1f', color: '#ff9b9b' },
  bloq: { label: 'Bloqueado', bg: '#3a2a17', color: '#F9A03F' },
}

// Última vez que la sincronización escribió algo (el dato más nuevo
// con source: 'api' entre partidos y estadísticas).
export function lastApiUpdate(rows) {
  let max = 0
  rows.forEach(({ matches, stats }) => {
    ;[matches?.last, matches?.next, stats?.last, stats?.season].forEach((d) => {
      if (d?.source !== 'api') return
      const t = Date.parse(d.updated_at || '')
      if (t > max) max = t
    })
  })
  return max ? new Date(max) : null
}

// Horario de la sincronización programada: ver syncSchedule.js.
export { nextScheduledSync } from './syncSchedule'

// "06:00" si es hoy, "Sáb 21 06:00" si es otro día.
export function formatWhen(d, now = new Date()) {
  if (!d) return ''
  return d.toDateString() === now.toDateString() ? formatTime(d) : `${formatDay(d)} ${formatTime(d)}`
}

export function relativeTime(date, now = new Date()) {
  if (!date) return null
  const min = Math.round((now - date) / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 48) return `hace ${h} h`
  return `hace ${Math.round(h / 24)} días`
}
