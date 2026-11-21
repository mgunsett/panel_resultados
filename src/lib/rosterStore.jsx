import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
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
// También aplica los cambios hechos con "Editar jugador" a los de
// players.js (panelEdit en su doc, ver roster.js).
// Una cuenta de jugador sólo lee su propio doc: las reglas no le dejan
// listar a los demás (ver firebase/firestore.rules).

const RosterContext = createContext({ ready: false, version: 0, error: null, refresh: async () => {} })

// Copia de lo que traen los archivos, antes de cualquier override:
// cada refresh vuelve a armar todo desde acá, así deshacer un cambio
// del panel devuelve el valor de players.js.
const filePlayers = [...players]
const fileClubs = [...clubs]

// Ficha de players.js tal cual está en el archivo (null si es de alta
// en el panel). La usa "Editar jugador" para guardar sólo lo que cambia.
export function filePlayer(slug) {
  return filePlayers.find((p) => p.slug === slug) || null
}

function applyRoster(extraPlayers, edits) {
  const merged = mergeRoster({ players: filePlayers, clubs: fileClubs, extraPlayers, edits })
  // Mismo array, contenido nuevo: los imports existentes ven el cambio.
  players.splice(0, players.length, ...merged.players)
  clubs.splice(0, clubs.length, ...merged.clubs)
}

export function RosterProvider({ children }) {
  const { user, isPlayer, playerSlug, loading } = useAuth()
  const [state, setState] = useState({ ready: false, version: 0, error: null })

  const refresh = useCallback(async () => {
    try {
      if (isPlayer) {
        const snap = await getDoc(doc(db, PLAYERS, playerSlug))
        const own = snap.exists() ? [{ ...snap.data(), slug: snap.id }] : []
        applyRoster(own.filter((d) => d.panel), own.filter((d) => d.panelEdited))
        setState((s) => ({ ready: true, version: s.version + 1, error: null }))
        return
      }
      const [ps, es] = await Promise.all([
        getDocs(query(collection(db, PLAYERS), where('panel', '==', true))),
        getDocs(query(collection(db, PLAYERS), where('panelEdited', '==', true))),
      ])
      const rows = (snap) => snap.docs.map((d) => ({ ...d.data(), slug: d.id }))
      applyRoster(rows(ps), rows(es))
      setState((s) => ({ ready: true, version: s.version + 1, error: null }))
    } catch (err) {
      console.error('No se pudieron leer los jugadores dados de alta en el panel:', err)
      setState((s) => ({ ...s, ready: true, error: err }))
    }
  }, [isPlayer, playerSlug])

  useEffect(() => {
    if (!user || !db || loading) return
    // Otra cuenta (ej.: de admin a jugador): no mostrar el plantel viejo.
    setState((s) => ({ ...s, ready: false }))
    refresh()
  }, [user, loading, refresh])

  return <RosterContext.Provider value={{ ...state, refresh }}>{children}</RosterContext.Provider>
}

export function useRoster() {
  return useContext(RosterContext)
}
