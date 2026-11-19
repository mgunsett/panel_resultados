import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'

// ─── ESTADÍSTICAS DE UN JUGADOR (lectura) ────────────────────────
// Todo vive en la subcolección players/{slug}/stats, que las reglas ya
// permiten leer. Una sola consulta trae todos los documentos:
//
//   last / prev        último y anteúltimo partido (lo leen las landings)
//   season             totales de la temporada en curso (landings)
//   seasons            { temporadas: { 2025: {...}, 2026: {...} } } (panel)
//   history_{año}      { partidos: { fixtureId: {...} } } (panel)
//
// Lo escriben la sincronización y "Completar historial"; el panel sólo lee.

export const emptyPlayerStats = { last: null, prev: null, season: null, seasons: {}, history: {} }

export async function fetchPlayerStats(slug) {
  const snap = await getDocs(collection(db, 'players', slug, 'stats'))
  const result = { last: null, prev: null, season: null, seasons: {}, history: {} }

  snap.forEach((d) => {
    const data = d.data()
    if (d.id === 'last' || d.id === 'prev' || d.id === 'season') {
      result[d.id] = data
    } else if (d.id === 'seasons') {
      Object.entries(data.temporadas || {}).forEach(([year, totals]) => { result.seasons[year] = totals })
    } else if (d.id.startsWith('history_')) {
      const year = d.id.slice('history_'.length)
      result.history[year] = Object.entries(data.partidos || {})
        .map(([fixtureId, m]) => ({ fixtureId: Number(fixtureId), ...m }))
        .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
    }
  })

  // La temporada en curso de stats/season es la más fresca: pisa a la
  // copia de stats/seasons (que se actualiza en la misma pasada, pero
  // puede no existir todavía).
  if (result.season?.temporada) result.seasons[result.season.temporada] = result.season

  return result
}

// Años con algún dato (totales o partidos), del más nuevo al más viejo.
export function availableSeasons(stats) {
  const years = new Set([...Object.keys(stats?.seasons || {}), ...Object.keys(stats?.history || {})])
  return [...years].map(Number).filter(Boolean).sort((a, b) => b - a)
}
