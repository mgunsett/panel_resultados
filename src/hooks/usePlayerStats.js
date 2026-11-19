import { useEffect, useState, useCallback } from 'react'
import { emptyPlayerStats, fetchPlayerStats } from '../lib/playerStats'
import { players } from '../data/players'
import { getClub } from '../data/clubs'

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
