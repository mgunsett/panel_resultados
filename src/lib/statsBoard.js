import { MATCH_COLUMNS, PLAYER_COLUMNS, SEASON_COLUMNS, PER90_COLUMNS, cellValue } from './statsSchema'

// ─── ESTADÍSTICAS: LÍDERES, TABLA Y EXPORTACIÓN ──────────────────
// Todo lo que la página de Estadísticas calcula a partir de
// useAllPlayersStats(). Las columnas siguen el formato de
// statsSchema.js, así la tabla y los archivos exportados usan la
// misma definición.

// Por debajo de estos minutos los números "cada 90'" engañan (dos
// partidos buenos y lidera todo), así que no entran en esa vista.
export const MIN_MINUTES_P90 = 450

const n = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v))

export const per90 = (value, minutes) => {
  const v = n(value)
  const m = n(minutes)
  return v !== null && m ? (v / m) * 90 : null
}

// Una fila por jugador con los totales de la temporada elegida.
export function seasonRows(rows, season) {
  return rows
    .filter(({ player, stats }) => player.apiPlayerId && stats.seasons?.[season])
    .map(({ player, club, stats }) => ({
      ...stats.seasons[season],
      slug: player.slug,
      jugador: player.name,
      club: club?.name || '—',
      clubId: player.clubId,
      clubCrest: club?.crest || null,
      photo: player.photo || null,
    }))
}

const ident = ({ player, club }) => ({
  slug: player.slug, jugador: player.name, club: club?.name || '—', clubId: player.clubId,
})

// Último partido de cada uno (stats/last).
export function lastMatchRows(rows) {
  return rows.filter((r) => r.player.apiPlayerId && r.stats.last).map((r) => ({ ...ident(r), ...r.stats.last }))
}

// Todos los partidos guardados de la temporada, uno por fila.
export function matchRows(rows, season) {
  return rows
    .filter((r) => r.player.apiPlayerId)
    .flatMap((r) => (r.stats.history?.[season] || []).map((m) => ({ ...ident(r), ...m })))
}

export const hasMinutes = (r) => (n(r.minutos) || 0) >= MIN_MINUTES_P90

// ── Columnas de la tabla ──
const base = (key) => SEASON_COLUMNS.find((c) => c.key === key)
const col = (key, short, o = {}) => ({ ...base(key), short, ...o })

const GA = { key: 'ga', label: 'Goles + asistencias', short: 'G+A', kind: 'num', get: (s) => (n(s.goles) === null && n(s.asistencias) === null ? null : (n(s.goles) || 0) + (n(s.asistencias) || 0)) }
const DUEL_PCT = { key: 'duelosPct', label: 'Duelos ganados (%)', short: '% duelos', kind: 'pct', get: (s) => (n(s.duelos) && n(s.duelosG) !== null ? Math.round((n(s.duelosG) / n(s.duelos)) * 100) : null) }

// `rate`: se puede pasar a "cada 90'". El resto (partidos, minutos,
// rating, porcentajes) se muestra igual en las dos vistas.
export const TABLE_GROUPS = [
  {
    id: 'general', label: 'General', sortKey: 'minutos',
    columns: [col('partidos', 'PJ'), col('titular', 'Tit.'), col('minutos', 'Min'), col('rating', 'Rating'),
      col('goles', 'Goles', { rate: true }), col('asistencias', 'Asist.', { rate: true }), { ...GA, rate: true }, col('precisionPases', '% pases')],
  },
  {
    id: 'ataque', label: 'Ataque', sortKey: 'goles',
    columns: [col('goles', 'Goles', { rate: true }), col('tiros', 'Tiros', { rate: true }), col('tirosArco', 'Al arco', { rate: true }),
      col('regates', 'Regates', { rate: true }), col('minutos', 'Min')],
  },
  {
    id: 'creacion', label: 'Creación', sortKey: 'asistencias',
    columns: [col('asistencias', 'Asist.', { rate: true }), col('pasesClave', 'Pases clave', { rate: true }), col('pases', 'Pases', { rate: true }),
      col('precisionPases', '% pases'), col('minutos', 'Min')],
  },
  {
    id: 'defensa', label: 'Defensa', sortKey: 'quites',
    columns: [col('quites', 'Quites', { rate: true }), col('intercepciones', 'Intercep.', { rate: true }), col('duelosG', 'Duelos gan.', { rate: true }),
      DUEL_PCT, col('amarillas', 'Amarillas'), col('rojas', 'Rojas')],
  },
]

// Versión "cada 90'" de una columna: misma clave base + _90.
function toPer90(c) {
  if (!c.rate) return c
  return {
    ...c, key: `${c.key}_90`, baseKey: c.key, label: `${c.label} cada 90'`, short: `${c.short}/90`, kind: 'rating',
    get: (s) => { const v = per90(cellValue(s, c), s.minutos); return v === null ? null : Math.round(v * 100) / 100 },
  }
}

export function tableColumns(groupId, p90) {
  const g = TABLE_GROUPS.find((x) => x.id === groupId) || TABLE_GROUPS[0]
  return p90 ? g.columns.map(toPer90) : g.columns
}

// ── Líderes por rubro ──
// `minMinutes`: el rating promedio sólo cuenta con minutos suficientes,
// si no lidera alguien que jugó 20 minutos.
export function leaderMetrics(p90) {
  const rating = { key: 'rating', title: 'Rating promedio', unit: 'promedio', kind: 'rating', minMinutes: true }
  const m = (key, title) => ({ key, title, unit: p90 ? "cada 90'" : 'total', kind: p90 ? 'rating' : 'num', rate: true })
  return p90
    ? [m('goles', 'Goles'), m('asistencias', 'Asistencias'), { ...m('ga', 'Goles + asistencias'), get: GA.get }, rating, m('pasesClave', 'Pases clave'), m('quites', 'Quites')]
    : [m('goles', 'Goles'), m('asistencias', 'Asistencias'), rating, { key: 'minutos', title: 'Minutos jugados', unit: 'total', kind: 'num' }, m('pasesClave', 'Pases clave'), m('quites', 'Quites')]
}

export function metricValue(row, metric, p90) {
  const raw = metric.get ? metric.get(row) : n(row[metric.key])
  if (raw === null) return null
  return p90 && metric.rate ? per90(raw, row.minutos) : raw
}

export function leaderboard(rows, metric, p90) {
  return rows
    .filter((r) => !metric.minMinutes || hasMinutes(r))
    .map((r) => ({ row: r, value: metricValue(r, metric, p90) }))
    .filter((x) => x.value !== null)
    .sort((a, b) => b.value - a.value)
}

// ── Exportación ──
// Todas las columnas de la temporada (o las de cada 90').
export const ALL_TOTAL_COLUMNS = [...PLAYER_COLUMNS, ...SEASON_COLUMNS]
export const ALL_P90_COLUMNS = [
  ...PLAYER_COLUMNS,
  ...SEASON_COLUMNS.filter((c) => ['partidos', 'titular', 'minutos', 'rating', 'precisionPases'].includes(c.key)),
  ...PER90_COLUMNS,
]
export const LAST_MATCH_COLUMNS = [...PLAYER_COLUMNS, ...MATCH_COLUMNS]

// Texto separado por tabulaciones: es lo que Excel y Google Sheets
// entienden al pegar, una celda por valor.
export function toTsv(columns, rows) {
  const esc = (v) => (v === null || v === undefined ? '' : String(typeof v === 'number' ? Math.round(v * 100) / 100 : v).replace(/[\t\r\n]+/g, ' '))
  return [columns.map((c) => c.label).join('\t'), ...rows.map((r) => columns.map((c) => esc(cellValue(r, c))).join('\t'))].join('\n')
}

// Búsqueda sin importar tildes ni mayúsculas.
const fold = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export const matchesText = (text, q) => !q.trim() || fold(text).includes(fold(q.trim()))
