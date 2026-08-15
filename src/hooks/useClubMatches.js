import { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from '@chakra-ui/react'
import { writeBatch } from 'firebase/firestore'
import { db, playerMatchDoc } from '../lib/firebase'
import { getClubPlayers } from '../data/players'
import {
  emptyMatches, buildMatchPayload, fetchPlayerMatches, consolidateSlot,
} from '../lib/matches'

// ─── PARTIDOS DE UN CLUB ─────────────────────────────────────────
// El club no tiene documento propio en Firestore: no existe una
// colección `clubs`. Este hook es un multiplicador sobre los mismos
// docs de siempre — players/{slug}/matches/{last|next} —, escribiendo
// el mismo payload en todos los jugadores del club de una sola vez.
//
// Para las landings esto es indistinguible de una edición individual:
// leen exactamente el mismo documento con el mismo formato.
//
// La escritura va en writeBatch: es atómica, así que un club nunca
// queda a medio actualizar si se corta la conexión en el medio.

export function useClubMatches(clubId) {
  const [matches, setMatches] = useState(emptyMatches)
  // Por slot: true si los jugadores del club no tienen todos el mismo
  // partido cargado (alguien lo editó individualmente).
  const [outOfSync, setOutOfSync] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  // Memoizado por clubId para que los callbacks de abajo no se
  // recreen en cada render.
  const slugs = useMemo(() => getClubPlayers(clubId).map((p) => p.slug), [clubId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setMatches(emptyMatches)
    setOutOfSync({})

    const load = async () => {
      try {
        const results = await Promise.all(slugs.map((slug) => fetchPlayerMatches(slug)))
        if (cancelled) return

        const bySlug = Object.fromEntries(slugs.map((slug, i) => [slug, results[i]]))
        const last = consolidateSlot(bySlug, 'last')
        const next = consolidateSlot(bySlug, 'next')

        setMatches({ last: last.value, next: next.value })
        setOutOfSync({ last: last.outOfSync, next: next.outOfSync })
      } catch (err) {
        if (!cancelled) {
          toast({ title: 'No se pudieron cargar los partidos del club', description: err.message, status: 'error', duration: 5000 })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (slugs.length) load()
    else setLoading(false)

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs])

  const saveMatch = useCallback(async (slot, form, shieldFiles) => {
    if (!slugs.length) return
    setSaving(true)
    try {
      // El escudo se sube una única vez (bajo el primer jugador del
      // club) y la URL resultante se replica en todos. Storage no
      // guarda N copias del mismo archivo.
      const payload = await buildMatchPayload(form, shieldFiles, slugs[0])

      const batch = writeBatch(db)
      slugs.forEach((slug) => batch.set(playerMatchDoc(slug, slot), payload))
      await batch.commit()

      setMatches((prev) => ({ ...prev, [slot]: payload }))
      setOutOfSync((prev) => ({ ...prev, [slot]: false }))
      toast({
        title: `Actualizado en ${slugs.length} ${slugs.length === 1 ? 'jugador' : 'jugadores'}`,
        status: 'success',
        duration: 3000,
      })
    } catch (err) {
      toast({ title: 'No se pudo guardar', description: err.message, status: 'error', duration: 5000 })
    } finally {
      setSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs])

  const deleteMatch = useCallback(async (slot) => {
    if (!slugs.length) return
    try {
      const batch = writeBatch(db)
      slugs.forEach((slug) => batch.delete(playerMatchDoc(slug, slot)))
      await batch.commit()

      setMatches((prev) => ({ ...prev, [slot]: {} }))
      setOutOfSync((prev) => ({ ...prev, [slot]: false }))
      toast({
        title: `Eliminado en ${slugs.length} ${slugs.length === 1 ? 'jugador' : 'jugadores'}`,
        status: 'info',
        duration: 3000,
      })
    } catch (err) {
      toast({ title: 'No se pudo eliminar', description: err.message, status: 'error', duration: 5000 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs])

  return { matches, outOfSync, loading, saving, saveMatch, deleteMatch }
}
