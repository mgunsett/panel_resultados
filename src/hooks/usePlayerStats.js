import { useEffect, useMemo, useState, useCallback } from 'react'
import { emptyPlayerStats, fetchPlayerStats } from '../lib/playerStats'
import { players, getPlayer } from '../data/players'
import { getClub } from '../data/clubs'
import { fetchPlayerMatches } from '../lib/matches'
import { enrichRow } from '../lib/homeData'
import { useRoster } from '../lib/rosterStore'

// Estadísticas de un jugador. `reload` vuelve a leer (después de
// completar el historial, por ejemplo).
export function usePlayerStats(slug) {
  const [stats, setStats] = useState(emptyPlayerStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPlayerStats(slug)
      .then((res) => { if (!cancelled) setStats(res) })
      .catch((err) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { stats, loading, error, reload }
}

// Las de todos los jugadores, para comparar y exportar. Son tantas
// lecturas como jugadores (una consulta cada uno), en paralelo.
export function useAllPlayersStats() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all(
      players.map(async (player) => ({
        player,
        club: getClub(player.clubId),
        stats: await fetchPlayerStats(player.slug).catch(() => emptyPlayerStats),
      })),
    )
      .then((res) => { if (!cancelled) setRows(res) })
      .catch((err) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { rows, loading, error }
}

// Todo lo que muestra el home: estadísticas y partidos (last/next) de
// cada jugador. Una consulta a stats y dos lecturas de matches por
// jugador, en paralelo. `refreshKey` fuerza otra lectura (después de
// "Sincronizar ahora").
export function useHomeData(refreshKey) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all(
      players.map(async (player) => {
        const [stats, matches] = await Promise.all([
          fetchPlayerStats(player.slug).catch(() => emptyPlayerStats),
          fetchPlayerMatches(player.slug).catch(() => ({ last: {}, next: {} })),
        ])
        return { player, club: getClub(player.clubId), stats, matches }
      }),
    )
      .then((res) => { if (!cancelled) setRows(res) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [refreshKey])

  // Después de "Editar jugador" la ficha (nombre, club, links…) cambia
  // sin volver a leer partidos ni estadísticas.
  const { version } = useRoster()
  const fresh = useMemo(() => rows.map((r) => {
    const player = getPlayer(r.player.slug) || r.player
    return player === r.player ? r : { ...r, player, club: getClub(player.clubId) }
  }), [rows, version]) // eslint-disable-line react-hooks/exhaustive-deps

  return { rows: fresh, loading }
}

// Las mismas filas con el estado de la landing y el próximo partido
// ya calculados (lista de Jugadores).
export function usePanelRows(refreshKey) {
  const { rows, loading } = useHomeData(refreshKey)
  const enriched = useMemo(() => rows.map(enrichRow), [rows])
  return { rows: enriched, loading }
}
