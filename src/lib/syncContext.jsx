import { createContext, useCallback, useContext, useState } from 'react'
import { useToast } from '@chakra-ui/react'
import { getClubsWithPlayers } from '../data/players'
import { callApiFootball } from './apiFootball'

// ─── "SINCRONIZAR AHORA" GLOBAL ──────────────────────────────────
// El botón vive en la barra superior, así que el estado (corriendo,
// progreso, última corrida) se comparte por contexto. Sincroniza club
// por club, igual que la sección Sincronización: cada llamada a la
// función es corta y los requests a la API quedan espaciados.
// `lastRunAt` cambia al terminar: el home lo usa para volver a leer.

const SyncContext = createContext(null)

export function SyncProvider({ children }) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [lastRunAt, setLastRunAt] = useState(null)
  const toast = useToast()

  const runSync = useCallback(async () => {
    if (running) return
    const targets = getClubsWithPlayers().filter((c) => c.apiTeamId)
    setRunning(true)
    let failed = 0
    let requests = 0
    try {
      for (const [i, club] of targets.entries()) {
        setProgress(`${club.name} (${i + 1}/${targets.length})`)
        try {
          const res = await callApiFootball('sync', { club: club.id }, { method: 'POST' })
          requests += res.usage?.requestsUsed || 0
          failed += (res.clubs || []).filter((c) => c.error).length
        } catch {
          failed += 1
        }
      }
      setLastRunAt(new Date())
      toast({
        title: failed ? `Sincronización terminada con ${failed} club(es) con error` : 'Sincronización terminada',
        description: `${requests} consultas a la API. El detalle está en Sincronización.`,
        status: failed ? 'warning' : 'success',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setRunning(false)
      setProgress('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  return (
    <SyncContext.Provider value={{ running, progress, lastRunAt, runSync }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSyncAll() {
  return useContext(SyncContext) || { running: false, progress: '', lastRunAt: null, runSync: () => {} }
}
