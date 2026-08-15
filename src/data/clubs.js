// ─── CLUBES DEL PANEL ────────────────────────────────────────────
// Archivo estático mantenido a mano, igual que players.js. NO sale de
// Firestore: es sólo el catálogo visual (banner + escudo) de la sección
// /clubes. Los partidos siguen viviendo en players/{slug}/matches.
//
// El `id` es la clave de agrupación: es lo que enlaza a un jugador con
// su club vía el campo `clubId` de players.js. Se usa `id` y no el
// nombre porque el mismo club venía escrito de formas distintas
// ("Cusco F.C." vs "Cusco FC") y eso partía el grupo en dos.
//
// Para sumar un club: agregá la entrada acá, dejá el escudo en
// public/clubs/ y poné su `id` en el `clubId` de los jugadores.

export const clubs = [
  {
    id: 'universitario',
    name: 'Universitario',
    country: 'Perú',
    competition: 'Liga 1',
    stadium: 'Estadio Monumental "U"',
    crest: '/clubs/universitario.png',
  },
  {
    id: 'cusco_fc',
    name: 'Cusco FC',
    country: 'Perú',
    competition: 'Liga 1',
    stadium: 'Estadio Inca Garcilaso de la Vega',
    crest: '/clubs/cusco_fc.png',
  },
  {
    id: 'alianza_lima',
    name: 'Alianza Lima',
    country: 'Perú',
    competition: 'Liga 1',
    stadium: 'Estadio Alejandro Villanueva',
    crest: '/clubs/alianza_lima.png',
  },
  {
    id: 'fbc_melgar',
    name: 'FBC Melgar',
    country: 'Perú',
    competition: 'Liga 1',
    stadium: 'Estadio Monumental de la UNSA',
    crest: '/clubs/fbc_melgar.png',
  },
  {
    id: 'emelec',
    name: 'Emelec',
    country: 'Ecuador',
    competition: 'LigaPro Serie A',
    stadium: 'Estadio George Capwell',
    crest: '/clubs/emelec.png',
  },
  {
    id: 'independiente_medellin',
    name: 'Independiente Medellín',
    country: 'Colombia',
    competition: 'Liga BetPlay Dimayor',
    stadium: 'Estadio Atanasio Girardot',
    crest: '/clubs/independiente_medellin.png',
  },
  {
    id: 'deportes_la_serena',
    name: 'Deportes La Serena',
    country: 'Chile',
    competition: 'Liga de Primera',
    stadium: 'Estadio La Portada',
    crest: '/clubs/deportes_la_serena.png',
  },
  {
    id: 'estudiantes_lp',
    name: 'Estudiantes de La Plata',
    country: 'Argentina',
    competition: 'Liga Profesional',
    stadium: 'Estadio Jorge Luis Hirschi',
    crest: '/clubs/estudiantes_lp.png',
  },
  {
    id: 'atlanta',
    name: 'Atlanta',
    country: 'Argentina',
    competition: 'Primera Nacional',
    stadium: 'Estadio Don León Kolbowski',
    crest: '/clubs/atlanta.png',
  },
]

export function getClub(id) {
  return clubs.find((c) => c.id === id) || null
}

// Iniciales para el fallback cuando todavía no está el escudo en
// public/clubs/. Toma hasta 3 letras y descarta las partículas que no
// aportan nada a la sigla ("de", "la", "FC"…).
const IGNORED_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'fc', 'fbc', 'cf', 'ac'])

export function clubInitials(name) {
  const words = String(name || '')
    .split(/\s+/)
    .filter((w) => w && !IGNORED_WORDS.has(w.toLowerCase()))

  // Nombre de una sola palabra ("Emelec", "Universitario"): no hay
  // iniciales que sacar, así que usamos sus primeras 3 letras.
  if (words.length < 2) return String(name || '').slice(0, 3).toUpperCase()

  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
}
