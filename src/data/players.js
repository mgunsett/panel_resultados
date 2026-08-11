// ─── JUGADORES DEL PANEL ─────────────────────────────────────────
// Archivo estático mantenido a mano. NO sale de Firestore.
// Para sumar un jugador nuevo: agregá una entrada acá y dejá su foto
// en public/players/.
//
// IMPORTANTE: `slug` debe coincidir con el VITE_PLAYER_SLUG de la
// landing individual, que no siempre es igual al nombre de la carpeta
// del repo (ej: la carpeta jp_ruizdiaz usa el slug jp_ruizgomez).

export const players = [
  {
    slug: 'andres_zanini',
    name: 'Andrés Zanini',
    club: 'Deportes La Serena',
    photo: '/players/andres_zanini.webp',
  },
  {
    slug: 'francisco_fydriszewski',
    name: 'Polaco Fydriszewski',
    club: 'Independiente Medellín',
    photo: '/players/francisco_fydriszewski.png',
  },
  {
    slug: 'hector_fertoli',
    name: 'Héctor Fertoli',
    club: 'Universitario',
    photo: '/players/hector_fertoli.webp',
  },
  {
    slug: 'ivan_colman',
    name: 'Iván Colman',
    club: 'Cusco F.C.',
    photo: '/players/ivan_colman.webp',
  },
  {
    slug: 'jp_ruizgomez',
    name: 'Juan Pablo Ruiz Gómez',
    club: 'Emelec',
    photo: '/players/jp_ruizgomez.webp',
  },
  {
    slug: 'licha_alzugaray',
    name: 'Lisandro Alzugaray',
    club: 'Universitario',
    photo: '/players/licha_alzugaray.png',
  },
  {
    slug: 'matias_dibenedetto',
    name: 'Matías Di Benedetto',
    club: 'Universitario',
    photo: '/players/matias_dibenedetto.webp',
  },
  {
    slug: 'miguel_rondelli',
    name: 'Miguel Rondelli',
    club: 'FBC Melgar',
    photo: '/players/miguel_rondelli.webp',
    role: 'DT',
  },
  {
    slug: 'nicolas_silva',
    name: 'Nicolás Silva',
    club: 'Cusco FC',
    photo: '/players/nicolas_silva.webp',
  },
]

export function getPlayer(slug) {
  return players.find((p) => p.slug === slug) || null
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
