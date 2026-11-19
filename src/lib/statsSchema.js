// ─── COLUMNAS DE ESTADÍSTICAS ────────────────────────────────────
// Una sola definición para las tablas del panel y para los archivos
// exportados (CSV / Excel), así lo que se ve es lo mismo que se baja.
// Las claves son las que escribe la sincronización (netlify/lib/mappers.js).
//
//   key      campo en Firestore (o función que lo calcula)
//   label    encabezado largo (archivos exportados, tooltips)
//   short    encabezado corto para la tabla
//   kind     'num' | 'text' | 'pct' | 'rating' | 'date' — formato y orden
//   lowerIsBetter  para resaltar (amarillas, goles recibidos)

const n = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v))

// Precisión de pases de un partido: la API manda pases correctos (no %).
const passPct = (s) => {
  const ok = n(s.pasesOk)
  const total = n(s.pases)
  return ok !== null && total ? Math.round((ok / total) * 100) : null
}

const duelPct = (s) => {
  const won = n(s.duelosG)
  const total = n(s.duelos)
  return won !== null && total ? Math.round((won / total) * 100) : null
}

const resultado = (s) => {
  const gf = n(s.gf)
  const gc = n(s.gc)
  if (gf === null || gc === null) return null
  return gf > gc ? 'G' : gf < gc ? 'P' : 'E'
}

// Columnas de los totales de una temporada (stats/season, stats/seasons).
export const SEASON_COLUMNS = [
  { key: 'partidos', label: 'Partidos jugados', short: 'PJ', kind: 'num' },
  { key: 'titular', label: 'Partidos de titular', short: 'Tit', kind: 'num' },
  { key: 'minutos', label: 'Minutos', short: 'Min', kind: 'num' },
  { key: 'rating', label: 'Rating promedio', short: 'Rat', kind: 'rating' },
  { key: 'goles', label: 'Goles', short: 'G', kind: 'num' },
  { key: 'asistencias', label: 'Asistencias', short: 'A', kind: 'num' },
  { key: 'tiros', label: 'Tiros', short: 'Tir', kind: 'num' },
  { key: 'tirosArco', label: 'Tiros al arco', short: 'TA', kind: 'num' },
  { key: 'pases', label: 'Pases', short: 'Pas', kind: 'num' },
  { key: 'pasesClave', label: 'Pases clave', short: 'PC', kind: 'num' },
  { key: 'precisionPases', label: 'Precisión de pases (%)', short: '%Pas', kind: 'pct' },
  { key: 'quites', label: 'Quites', short: 'Qui', kind: 'num' },
  { key: 'intercepciones', label: 'Intercepciones', short: 'Int', kind: 'num' },
  { key: 'duelos', label: 'Duelos', short: 'Due', kind: 'num' },
  { key: 'duelosG', label: 'Duelos ganados', short: 'DG', kind: 'num' },
  { key: 'regates', label: 'Regates exitosos', short: 'Reg', kind: 'num' },
  { key: 'atajadas', label: 'Atajadas', short: 'Ata', kind: 'num' },
  { key: 'golesRec', label: 'Goles recibidos', short: 'GR', kind: 'num', lowerIsBetter: true },
  { key: 'amarillas', label: 'Amarillas', short: 'Am', kind: 'num', lowerIsBetter: true },
  { key: 'rojas', label: 'Rojas', short: 'Ro', kind: 'num', lowerIsBetter: true },
]

// Columnas de un partido (stats/last, stats/prev, stats/history_{año}).
export const MATCH_COLUMNS = [
  { key: 'fecha', label: 'Fecha', short: 'Fecha', kind: 'date' },
  { key: 'competicion', label: 'Competición', short: 'Comp.', kind: 'text' },
  { key: 'condicion', label: 'Condición (L/V)', short: 'L/V', kind: 'text' },
  { key: 'rival', label: 'Rival', short: 'Rival', kind: 'text' },
  { key: 'resultado', label: 'Resultado (G/E/P)', short: 'Res', kind: 'text', get: resultado },
  { key: 'marcador', label: 'Marcador', short: 'Marc.', kind: 'text', get: (s) => (n(s.gf) === null ? null : `${s.gf}-${s.gc}`) },
  { key: 'jugo', label: 'Jugó', short: 'Jugó', kind: 'text', get: (s) => (s.sinDatos ? 'Sin datos' : s.jugo ? 'Sí' : 'No') },
  { key: 'titular', label: 'Titular', short: 'Tit', kind: 'text', get: (s) => (s.jugo ? (s.titular === '1' ? 'Sí' : 'No') : null) },
  { key: 'minutos', label: 'Minutos', short: 'Min', kind: 'num' },
  { key: 'posicion', label: 'Posición', short: 'Pos', kind: 'text' },
  { key: 'rating', label: 'Rating', short: 'Rat', kind: 'rating' },
  { key: 'goles', label: 'Goles', short: 'G', kind: 'num' },
  { key: 'asistencias', label: 'Asistencias', short: 'A', kind: 'num' },
  { key: 'tiros', label: 'Tiros', short: 'Tir', kind: 'num' },
  { key: 'tirosArco', label: 'Tiros al arco', short: 'TA', kind: 'num' },
  { key: 'pases', label: 'Pases', short: 'Pas', kind: 'num' },
  { key: 'pasesOk', label: 'Pases correctos', short: 'PasOk', kind: 'num' },
  { key: 'precisionPases', label: 'Precisión de pases (%)', short: '%Pas', kind: 'pct', get: passPct },
  { key: 'pasesClave', label: 'Pases clave', short: 'PC', kind: 'num' },
  { key: 'quites', label: 'Quites', short: 'Qui', kind: 'num' },
  { key: 'intercepciones', label: 'Intercepciones', short: 'Int', kind: 'num' },
  { key: 'duelos', label: 'Duelos', short: 'Due', kind: 'num' },
  { key: 'duelosG', label: 'Duelos ganados', short: 'DG', kind: 'num' },
  { key: 'duelosPct', label: 'Duelos ganados (%)', short: '%DG', kind: 'pct', get: duelPct },
  { key: 'regates', label: 'Regates exitosos', short: 'Reg', kind: 'num' },
  { key: 'regatesInt', label: 'Regates intentados', short: 'RegI', kind: 'num' },
  { key: 'faltasR', label: 'Faltas recibidas', short: 'FR', kind: 'num' },
  { key: 'faltasC', label: 'Faltas cometidas', short: 'FC', kind: 'num', lowerIsBetter: true },
  { key: 'atajadas', label: 'Atajadas', short: 'Ata', kind: 'num' },
  { key: 'golesRec', label: 'Goles recibidos', short: 'GR', kind: 'num', lowerIsBetter: true },
  { key: 'amarillas', label: 'Amarillas', short: 'Am', kind: 'num', lowerIsBetter: true },
  { key: 'rojas', label: 'Rojas', short: 'Ro', kind: 'num', lowerIsBetter: true },
]

// Columnas de identificación del jugador, para tablas y archivos de
// varios jugadores.
export const PLAYER_COLUMNS = [
  { key: 'jugador', label: 'Jugador', short: 'Jugador', kind: 'text' },
  { key: 'club', label: 'Club', short: 'Club', kind: 'text' },
]

// Columnas "cada 90 minutos", calculadas sobre los totales.
const PER90_KEYS = ['goles', 'asistencias', 'tiros', 'tirosArco', 'pasesClave', 'quites', 'intercepciones', 'duelosG', 'regates']
export const PER90_COLUMNS = PER90_KEYS.map((key) => {
  const base = SEASON_COLUMNS.find((c) => c.key === key)
  return {
    key: `${key}_90`,
    label: `${base.label} cada 90'`,
    short: `${base.short}/90`,
    kind: 'rating',
    get: (s) => {
      const v = n(s[key])
      const min = n(s.minutos)
      return v !== null && min ? Math.round((v / min) * 90 * 100) / 100 : null
    },
  }
})

export function cellValue(row, col) {
  const v = col.get ? col.get(row) : row?.[col.key]
  return v === undefined ? null : v
}

export function formatCell(value, col) {
  if (value === null || value === undefined || value === '') return '—'
  switch (col.kind) {
    case 'rating': return Number(value).toFixed(2)
    case 'pct': return `${Math.round(Number(value))}%`
    case 'date': {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value))
      return m ? `${m[3]}/${m[2]}/${m[1].slice(2)}` : String(value)
    }
    default: return String(value)
  }
}

// Comparador para ordenar por una columna. Los vacíos van siempre al final.
export function compareBy(col, dir = 'desc') {
  const sign = dir === 'asc' ? 1 : -1
  return (a, b) => {
    const va = cellValue(a, col)
    const vb = cellValue(b, col)
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    if (col.kind === 'text' || col.kind === 'date') return String(va).localeCompare(String(vb), 'es') * sign
    return (Number(va) - Number(vb)) * sign
  }
}
