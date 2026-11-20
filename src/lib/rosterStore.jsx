import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebase'
import { useAuth } from './auth'
import { players } from '../data/players'
import { clubs } from '../data/clubs'
import { mergeRoster, PLAYERS } from './roster'

// ─── PLANTEL EN EL NAVEGADOR ─────────────────────────────────────
// Todo el panel lee `players` y `clubs` de src/data de forma
// sincrónica. Para no reescribir cada pantalla, al iniciar sesión se
// leen los jugadores dados de alta desde el panel (players/{slug} con
// panel: true en Firestore, con su club si era nuevo) y se suman a esos mismos
// arrays. El panel espera a que termine antes de mostrarse (ver
// Protected en App.jsx). Si Firestore falla, sigue con los archivos.

const RosterContext = createContext({ ready: false, version: 0, error: null, refresh: async () => {} })

const fileSlugs = new Set(players.map((p) => p.slug))
const fileClubIds = new Set(clubs.map((c) => c.id))

function applyRoster(extraPlayers) {
  const merged = mergeRoster({
    players: players.filter((p) => fileSlugs.has(p.slug)),
    clubs: clubs.filter((c) => fileClubIds.has(c.id)),
    extraPlayers,
  })
  // Mismo array, contenido nuevo: los imports existentes ven el cambio.
  players.splice(0, players.length, ...merged.players)
  clubs.splice(0, clubs.length, ...merged.clubs)
}

export function RosterProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState({ ready: false, version: 0, error: null })

  const refresh = useCallback(async () => {
    try {
      const ps = await getDocs(query(collection(db, PLAYERS), where('panel', '==', true)))
      applyRoster(ps.docs.map((d) => ({ ...d.data(), slug: d.id })))
      setState((s) => ({ ready: true, version: s.version + 1, error: null }))
    } catch (err) {
      console.error('No se pudieron leer los jugadores dados de alta en el panel:', err)
      setState((s) => ({ ...s, ready: true, error: err }))
    }
  }, [])

  useEffect(() => {
    if (user && db) refresh()
  }, [user, refresh])

  return <RosterContext.Provider value={{ ...state, refresh }}>{children}</RosterContext.Provider>
}

export function useRoster() {
  return useContext(RosterContext)
}
