// ─── JUGADORES DEL PANEL ─────────────────────────────────────────
// Archivo estático mantenido a mano. NO sale de Firestore.
// Para sumar un jugador nuevo: agregá una entrada acá y dejá su foto
// en public/players/.
//
// IMPORTANTE: `slug` debe coincidir con el VITE_PLAYER_SLUG de la
// landing individual, que no siempre es igual al nombre de la carpeta
// del repo (ej: la carpeta jp_ruizdiaz usa el slug jp_ruizgomez).
//
// `clubId` apunta a una entrada de clubs.js y es lo que agrupa a los
// jugadores en la sección /clubes. Sin él, el jugador queda fuera de la
// edición por club (sigue funcionando su edición individual).
//
// `apiPlayerId` es el ID del jugador en API-Football. Se busca desde el
// panel en /sincronizacion → Jugadores. Con null, el jugador recibe el
// resultado y el próximo partido de su club, pero no sus estadísticas.

import { clubs, getClub } from './clubs.js'

export const players = [
  {
    slug: 'gonzalo_piovi',
    name: 'Gonzalo Piovi',
    clubId: 'cruz_azul',
    photo: '/players/gonza_piovi.webp',
    apiPlayerId: null,
  },
  {
    slug: 'guido_mainero',
    name: 'Guido Mainero',
    clubId: 'platense',
    photo: '/players/guido_mainero.webp',
    apiPlayerId: null,
  },
  {
    slug: 'ronaldo_martinez',
    name: 'Ronaldo Martínez',
    clubId: 'talleres',
    photo: '/players/ronaldo_martinez.webp',
    apiPlayerId: null,
  },
  {
    slug: 'andres_zanini',
    name: 'Andrés Zanini',
    clubId: 'deportes_la_serena',
    photo: '/players/andres_zanini.webp',
    apiPlayerId: null,
  },
  {
    slug: 'francisco_fydriszewski',
    name: 'Polaco Fydriszewski',
    clubId: 'junior',
    photo: '/players/francisco_fydriszewski.webp',
    apiPlayerId: null,
  },
  {
    slug: 'hector_fertoli',
    name: 'Héctor Fertoli',
    clubId: 'universitario',
    photo: '/players/hector_fertoli.webp',
    apiPlayerId: null,
  },
  {
    slug: 'ivan_colman',
    name: 'Iván Colman',
    clubId: 'cusco_fc',
    photo: '/players/ivan_colman.webp',
    apiPlayerId: null,
  },
  {
    slug: 'jp_ruizgomez',
    name: 'Juan Pablo Ruiz Gómez',
    clubId: 'emelec',
    photo: '/players/jp_ruizgomez.webp',
    apiPlayerId: null,
  },
  {
    slug: 'licha_alzugaray',
    name: 'Lisandro Alzugaray',
    clubId: 'universitario',
    photo: '/players/licha_alzugaray.webp',
    apiPlayerId: null,
  },
  {
    slug: 'matias_dibenedetto',
    name: 'Matías Di Benedetto',
    clubId: 'universitario',
    photo: '/players/matias_dibenedetto.webp',
    apiPlayerId: null,
  },
  {
    slug: 'miguel_rondelli',
    name: 'Miguel Rondelli',
    clubId: 'fbc_melgar',
    photo: '/players/miguel_rondelli.webp',
    apiPlayerId: null,
    role: 'DT',
  },
  {
    slug: 'nicolas_silva',
    name: 'Nicolás Silva',
    clubId: 'cusco_fc',
    photo: '/players/nicolas_silva.webp',
    apiPlayerId: null,
  },
  {
    slug: 'cain_fara',
    name: 'Caín Fara',
    clubId: 'universitario',
    photo: '/players/cainf_fara.webp',
    apiPlayerId: null,
  },
  {
    slug: 'facu_callejo',
    name: 'Facundo Callejo',
    clubId: 'cusco_fc',
    photo: '/players/facundo_callejo.webp',
    apiPlayerId: null,
  },
  {
    slug: 'julian_aquino',
    name: 'Julián Aquino',
    clubId: 'atlanta',
    photo: '/players/julian_aquino.webp',
    apiPlayerId: null,
  },
  {
    slug: 'keki-piovi',
    name: 'Keki Piovi',
    clubId: 'estudiantes_lp',
    photo: '/players/keki_piovi.webp',
    apiPlayerId: null,
  },
  {
    slug: 'luis_ramos',
    name: 'Luis Ramos',
    clubId: 'alianza_lima',
    photo: '/players/luis_ramos.webp',
    apiPlayerId: null,
  },
  {
    slug: 'francisco_dezuniga',
    name: 'Francisco De Zúniga',
    clubId: 'dep_riestra',
    photo: '/players/francisco_dezuniga.webp',
    apiPlayerId: null,
  }
]

export function getPlayer(slug) {
  return players.find((p) => p.slug === slug) || null
}

// Nombre del club listo para mostrar. Sale de clubs.js para que un
// cambio de nombre se haga en un solo lugar y no jugador por jugador.
export function playerClubName(player) {
  return getClub(player?.clubId)?.name || '—'
}

export function getClubPlayers(clubId) {
  return clubId ? players.filter((p) => p.clubId === clubId) : []
}

// Clubes que hoy tienen al menos un jugador, con su plantel adjunto.
// Esto es lo que alimenta la grilla de /clubes: un club con 4 jugadores
// aparece una sola vez, y uno cargado en clubs.js pero sin jugadores no
// aparece.
export function getClubsWithPlayers() {
  return clubs
    .map((club) => ({ ...club, players: getClubPlayers(club.id) }))
    .filter((club) => club.players.length > 0)
}

// Iniciales para el fallback cuando falta la foto.
export function playerInitials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
