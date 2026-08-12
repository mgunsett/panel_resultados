import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'
import { getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { uploadBytes, getDownloadURL } from 'firebase/storage'
import { playerMatchDoc, playerShieldRef, MATCH_SLOTS } from '../lib/firebase'

// ─── PARTIDOS DE UN JUGADOR ──────────────────────────────────────
// Misma lógica de carga/guardado/borrado del AdminPage de las
// landings, pero recibiendo el slug como parámetro en vez de leerlo
// de VITE_PLAYER_SLUG.

const emptyMatches = { last: {}, next: {} }

function fileExtension(file) {
  const parts = file.name.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : 'png'
}

async function uploadShield(slug, file, teamName) {
  const shieldRef = playerShieldRef(slug, teamName, fileExtension(file))
  await uploadBytes(shieldRef, file)
  return getDownloadURL(shieldRef)
}

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
        const snaps = await Promise.all(
          MATCH_SLOTS.map((slot) => getDoc(playerMatchDoc(slug, slot)))
        )
        if (cancelled) return
        const result = { ...emptyMatches }
        snaps.forEach((snap, i) => {
          if (snap.exists()) result[MATCH_SLOTS[i]] = snap.data()
        })
        setMatches(result)
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
      let homeShieldUrl = form.home_shield || null
      let awayShieldUrl = form.away_shield || null

      if (shieldFiles.home) {
        homeShieldUrl = await uploadShield(slug, shieldFiles.home, form.home_team || 'home')
      }
      if (shieldFiles.away) {
        awayShieldUrl = await uploadShield(slug, shieldFiles.away, form.away_team || 'away')
      }

      const payload = {
        home_team: form.home_team,
        away_team: form.away_team,
        home_score: form.home_score !== '' ? Number(form.home_score) : null,
        away_score: form.away_score !== '' ? Number(form.away_score) : null,
        match_date: form.match_date,
        stadium: form.stadium,
        competition: form.competition,
        home_shield: homeShieldUrl,
        away_shield: awayShieldUrl,
        updated_at: new Date().toISOString(),
      }

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

  return { matches, loading, saving, saveMatch, deleteMatch }
}
