// ─── DATOS DE LA SECCIÓN CLUBES ──────────────────────────────────
// Funciones puras sobre lo que ya trae useHomeData por jugador
// (matches/{last|next} y stats/*), agrupado por club. Sin lecturas
// extra: el club no tiene documento propio en Firestore.

import { consolidateSlot } from './matches'
import { availableSeasons } from './playerStats'
import { matchDate, formatDay, formatTime } from './homeData'
import { num, resultOf } from './profileData'

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim()
const STOP = new Set(['club', 'deportivo', 'deportes', 'dep', 'atletico', 'cf', 'fc', 'fbc', 'ca', 'sc', 'de', 'la', 'el', 'los', 'lp'])

// Palabra que identifica al club en los nombres que manda la API
// ("Estudiantes L.P.", "Club Atlético Platense"…): la más larga que no
// sea genérica.
function keyword(name) {
  const words = norm(name).split(/\s+/).filter((w) => w && !STOP.has(w))
  return words.sort((a, b) => b.length - a.length)[0] || norm(name)
}

const isClub = (team, club) => {
  const t = norm(team)
  const c = norm(club?.name)
  return Boolean(t && c) && (t === c || t.includes(c) || c.includes(t) || t.includes(keyword(club.name)))
}

// 'home' | 'away' | null: de qué lado juega el club en ese partido.
export function clubSide(match, club) {
  if (!match?.home_team || !club) return null
  if (isClub(match.home_team, club)) return 'home'
  if (isClub(match.away_team, club)) return 'away'
  return null
}

// Un partido visto desde el club: rival, condición, goles a favor y en
// contra, resultado y cuándo.
export function clubView(match, club) {
  if (!match?.home_team) return null
  const side = clubSide(match, club)
  const away = side === 'away'
  const d = matchDate(match)
  const gf = num(away ? match.away_score : match.home_score)
  const gc = num(away ? match.home_score : match.away_score)
  const played = gf !== null && gc !== null
  return {
    side,
    rival: side ? (away ? match.home_team : match.away_team) : null,
    cond: side ? (away ? 'V' : 'L') : null,
    gf, gc, played,
    res: side && played ? resultOf({ gf, gc }) : null,
    date: d,
    day: d ? formatDay(d) : match.match_date || '',
    time: match.match_time || (match.match_datetime && d ? formatTime(d) : ''),
  }
}

export const CLUB_STATUS = {
  ok: { label: 'Al día', bg: '#24392b', color: '#8fe3ae' },
  lock: { label: 'Bloqueado', bg: '#3a2a17', color: '#F9A03F' },
  dif: { label: 'Revisar', bg: '#3a2a17', color: '#F9A03F' },
  manual: { label: 'Carga manual', bg: '#3a2a17', color: '#F9A03F' },
  vacio: { label: 'Sin partidos', bg: '#2a2420', color: '#AFA08D' },
}

const SLOT_NAME = { last: 'último', next: 'próximo' }

// Estado del club y el aviso que lo explica, a partir de los dos
// partidos ya consolidados y de si los jugadores coinciden.
export function clubStatus(club, matches, outOfSync = {}) {
  const locked = ['last', 'next'].find((s) => matches?.[s]?.locked)
  const dif = ['last', 'next'].find((s) => outOfSync[s])
  if (locked) return { id: 'lock', warn: `El ${SLOT_NAME[locked]} partido está bloqueado: la sincronización no lo actualiza.` }
  if (dif) return { id: 'dif', warn: `Los jugadores no tienen todos el mismo ${SLOT_NAME[dif]} partido. Al guardar desde acá quedan iguales.` }
  if (!club?.apiTeamId) return { id: 'manual', warn: 'El club no tiene ID de API-Football: sus partidos se cargan a mano.' }
  if (!matches?.last?.home_team && !matches?.next?.home_team) return { id: 'vacio', warn: 'Todavía no hay partidos cargados para este club.' }
  return { id: 'ok', warn: '' }
}

// Agrupa las filas de useHomeData por club: partidos consolidados,
// estado y filas de sus jugadores.
export function clubsOverview(clubs, rows) {
  return clubs.map((club) => {
    const own = rows.filter((r) => r.player.clubId === club.id)
    const bySlug = Object.fromEntries(own.map((r) => [r.player.slug, r.matches || {}]))
    const last = consolidateSlot(bySlug, 'last')
    const next = consolidateSlot(bySlug, 'next')
    const matches = { last: last.value, next: next.value }
    const outOfSync = { last: own.length > 0 && last.outOfSync, next: own.length > 0 && next.outOfSync }
    return { club, rows: own, matches, outOfSync, status: clubStatus(club, matches, outOfSync) }
  })
}

// Totales de la temporada del club, sumando a sus jugadores. Los
// partidos son los del jugador que más jugó (el club juega uno solo
// aunque tenga cuatro jugadores en cancha) y el rating se pondera por
// minutos.
export function clubSeason(rows) {
  const years = new Set()
  rows.forEach(({ stats }) => availableSeasons(stats).forEach((y) => years.add(y)))
  const year = [...years].sort((a, b) => b - a)[0] ?? new Date().getFullYear()
  const seasons = rows.map(({ stats }) => stats?.seasons?.[year] || null)
  const sum = (k) => seasons.reduce((a, s) => a + (num(s?.[k]) || 0), 0)
  const rated = seasons.filter((s) => num(s?.rating) && num(s?.minutos))
  const mins = rated.reduce((a, s) => a + Number(s.minutos), 0)
  return {
    year,
    partidos: Math.max(0, ...seasons.map((s) => num(s?.partidos) || 0)),
    goles: sum('goles'),
    asistencias: sum('asistencias'),
    rating: mins ? rated.reduce((a, s) => a + Number(s.rating) * Number(s.minutos), 0) / mins : null,
    bySlug: Object.fromEntries(rows.map((r, i) => [r.player.slug, seasons[i]])),
  }
}

export const matchesText = (text, q) => norm(text).includes(norm(q))
