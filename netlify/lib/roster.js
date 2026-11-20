import { clubs as fileClubs } from '../../src/data/clubs.js'
import { players as filePlayers } from '../../src/data/players.js'
import { mergeRoster, PLAYERS } from '../../src/lib/roster.js'

// Plantel completo para las funciones: los archivos de src/data más los
// jugadores y clubes dados de alta desde el panel (Firestore). Si
// Firestore falla, la sincronización sigue con los de los archivos.
// Los cambios hechos desde "Editar jugador" a los de players.js
// (panelEdit) también se aplican: un apiPlayerId o club corregido en el
// panel se usa en la próxima sincronización.
export async function loadRoster(db) {
  try {
    const [ps, es] = await Promise.all([
      db.collection(PLAYERS).where('panel', '==', true).get(),
      db.collection(PLAYERS).where('panelEdited', '==', true).get(),
    ])
    return mergeRoster({
      players: filePlayers,
      clubs: fileClubs,
      extraPlayers: ps.docs.map((d) => ({ ...d.data(), slug: d.id })),
      edits: es.docs.map((d) => ({ ...d.data(), slug: d.id })),
    })
  } catch (err) {
    console.error('No se pudo leer el plantel de Firestore:', err.message)
    return { players: filePlayers, clubs: fileClubs }
  }
}
