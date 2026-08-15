import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'
import { setDoc, deleteDoc } from 'firebase/firestore'
import { playerMatchDoc } from '../lib/firebase'
import { emptyMatches, buildMatchPayload, fetchPlayerMatches } from '../lib/matches'

// ─── PARTIDOS DE UN JUGADOR ──────────────────────────────────────
// Misma lógica de carga/guardado/borrado del AdminPage de las
// landings, pero recibiendo el slug como parámetro en vez de leerlo
// de VITE_PLAYER_SLUG.
//
// Devuelve la misma forma que useClubMatches, así MatchEditor sirve
// para las dos vistas sin saber cuál lo está usando.

export function usePlayerMatches(slug) {
  const [matches, setMatches] = useState(emptyMatches)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  // `toast` es estable entre renders, por eso no va en las deps de los
  // efectos/callbacks de abajo: sólo el slug debe dispararlos.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    // Limpiamos primero: al cambiar de jugador no queremos ver por un
    // instante los partidos del anterior.
    setMatches(emptyMatches)

    const load = async () => {
      try {
        const result = await fetchPlayerMatches(slug)
        if (!cancelled) setMatches(result)
      } catch (err) {
        if (!cancelled) {
          toast({ title: 'No se pudieron cargar los partidos', description: err.message, status: 'error', duration: 5000 })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    // Corta la respuesta en vuelo si navegás a otro jugador antes de
    // que llegue, para que no pise los datos del jugador nuevo.
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const saveMatch = useCallback(async (slot, form, shieldFiles) => {
    setSaving(true)
    try {
      const payload = await buildMatchPayload(form, shieldFiles, slug)
      await setDoc(playerMatchDoc(slug, slot), payload)
      setMatches((prev) => ({ ...prev, [slot]: payload }))
      toast({ title: 'Partido guardado', status: 'success', duration: 3000 })
    } catch (err) {
      toast({ title: 'No se pudo guardar', description: err.message, status: 'error', duration: 5000 })
    } finally {
      setSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const deleteMatch = useCallback(async (slot) => {
    try {
      await deleteDoc(playerMatchDoc(slug, slot))
      setMatches((prev) => ({ ...prev, [slot]: {} }))
      toast({ title: 'Partido eliminado', status: 'info', duration: 3000 })
    } catch (err) {
      toast({ title: 'No se pudo eliminar', description: err.message, status: 'error', duration: 5000 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  return { matches, loading, saving, saveMatch, deleteMatch, outOfSync: {} }
}
