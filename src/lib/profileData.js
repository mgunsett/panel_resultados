// ─── DATOS DE LA FICHA Y DE LA LISTA DE JUGADORES ────────────────
// Funciones puras sobre lo que ya trae fetchPlayerStats (stats/*) y
// matches/{last|next}. Nada de lecturas extra.

import { availableSeasons } from './playerStats'
import { matchDate, formatDay } from './homeData'

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v))
export const dash = (v, fmt) => (v === null || v === undefined || v === '' ? '—' : fmt ? fmt(v) : String(v))
export const fmtInt = (v) => Number(v).toLocaleString('es-AR')
export const fmtRating = (v, dec = 1) => (num(v) === null ? '—' : Number(v).toFixed(dec))

// "2026-11-16" → "16 nov"
export function shortDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''))
  return m ? `${Number(m[3])} ${MES[Number(m[2]) - 1]}` : ''
}

export const currentYear = (stats) => availableSeasons(stats)[0] ?? new Date().getFullYear()

// Partidos de una temporada, del más viejo al más nuevo.
export function seasonMatches(stats, year) {
  return [...(stats?.history?.[year] || [])].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
}

export function resultOf(m) {
  const gf = num(m?.gf)
  const gc = num(m?.gc)
  if (gf === null || gc === null) return null
  return gf > gc ? 'G' : gf < gc ? 'P' : 'E'
}

export const RESULT = {
  G: { word: 'Ganó', bg: '#24392b', color: '#8fe3ae' },
  E: { word: 'Empató', bg: '#2a2420', color: '#DBCCAF' },
  P: { word: 'Perdió', bg: '#3d1f1f', color: '#ff9b9b' },
}

export const rivalLabel = (m) => (m?.rival ? `${m.condicion === 'V' ? 'en' : 'vs'} ${m.rival}` : '')

// Últimos `n` partidos del club (jugados o no). Sin historial todavía,
// usa los dos que guarda la sincronización para las landings.
export function recentForm(stats, n = 5) {
  const year = currentYear(stats)
  const list = seasonMatches(stats, year).filter((m) => resultOf(m))
  if (list.length) return list.slice(-n)
  return [stats?.prev, stats?.last].filter((m) => m && resultOf(m))
}

// Cómo llega a la landing cada partido (último / próximo).
export function slotSource(match, club) {
  if (!match?.home_team) {
    return { id: 'vacio', label: 'Sin cargar', help: 'Todavía no hay partido cargado: la landing no muestra nada acá.' }
  }
  if (match.locked) {
    return { id: 'bloq', label: 'Bloqueado', help: 'Lo cargaste a mano y la sincronización no lo pisa. Revisá que esté bien.' }
  }
  if (match.source === 'api' && club?.apiTeamId) {
    return { id: 'auto', label: 'Automático', help: 'Se actualiza solo con API-Football.' }
  }
  if (club?.apiTeamId) {
    return { id: 'auto', label: 'Automático', help: 'Lo cargaste a mano; la próxima sincronización lo reemplaza por el de API-Football.' }
  }
  return { id: 'manual', label: 'Manual', help: 'Su club no se sincroniza: este partido se carga a mano.' }
}

export const SOURCE_COLORS = {
  auto: { bg: '#24392b', color: '#8fe3ae' },
  bloq: { bg: '#3a2a17', color: '#F9A03F' },
  manual: { bg: '#3a2a17', color: '#F9A03F' },
  vacio: { bg: '#2a2420', color: '#AFA08D' },
}

const hasScore = (m) => num(m?.home_score) !== null && num(m?.away_score) !== null

// Título y detalle de un partido de matches/{last|next} para mostrarlo
// como en la landing.
export function slotView(match) {
  if (!match?.home_team) return null
  const d = matchDate(match)
  const when = d ? formatDay(d) : match.match_date || ''
  return {
    title: hasScore(match)
      ? `${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team}`
      : `${match.home_team} vs ${match.away_team}`,
    meta: [match.competition, when, match.match_time].filter(Boolean).join(' · '),
    homeShield: match.home_shield,
    awayShield: match.away_shield,
  }
}

// Diferencia con la temporada anterior: { text, color } o null.
export function deltaVs(cur, prev, prevYear, decimals = 0) {
  const a = num(cur)
  const b = num(prev)
  if (a === null || b === null) return null
  const d = a - b
  const fmt = (x) => (decimals ? Math.abs(x).toFixed(decimals) : fmtInt(Math.abs(Math.round(x))))
  if (Math.abs(d) < (decimals ? 0.005 : 0.5)) return { text: `= igual que ${prevYear}`, color: 'brand.gray' }
  return d > 0
    ? { text: `▲ ${fmt(d)} vs ${prevYear}`, color: '#8fe3ae' }
    : { text: `▼ ${fmt(d)} vs ${prevYear}`, color: '#ff9b9b' }
}

export function per90(value, minutes) {
  const v = num(value)
  const m = num(minutes)
  return v !== null && m ? (v / m) * 90 : null
}
