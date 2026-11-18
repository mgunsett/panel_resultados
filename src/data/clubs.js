// ─── CLUBES DEL PANEL ────────────────────────────────────────────
// Archivo de datos puro (sin imports de imágenes): lo leen el panel y
// también las funciones de Netlify que sincronizan con API-Football.
//
// `crest` es la ruta pública del escudo dentro de public/clubs/.
// `apiTeamId` es el ID del equipo en API-Football. Se busca desde el
// panel en /sincronizacion → Clubes. Con null, el club no se sincroniza
// y se sigue cargando a mano como siempre.

export const clubs = [
  {
    id: 'universitario',
    name: 'Universitario',
    country: 'Perú',
    competition: 'Liga 1',
    stadium: 'Estadio Monumental "U"',
    crest: '/clubs/escudo_universitario.webp',
    apiTeamId: null,
  },
  {
    id: 'platense',
    name: 'Platense',
    country: 'Argentina',
    competition: 'Liga Profesional',
    stadium: 'Estadio Ciudad de Vicente López',
    crest: '/clubs/escudo_platense.webp',
    apiTeamId: null,
  },    
  {
    id: 'cusco_fc',
    name: 'Cusco FC',
    country: 'Perú',
    competition: 'Liga 1',
    stadium: 'Estadio Inca Garcilaso de la Vega',
    crest: '/clubs/escudo_cusco.webp',
    apiTeamId: null,
  },
  {
    id: 'alianza_lima',
    name: 'Alianza Lima',
    country: 'Perú',
    competition: 'Liga 1',
    stadium: 'Estadio Alejandro Villanueva',
    crest: '/clubs/escudo_alianzalima.webp',
    apiTeamId: null,
  },
  {
    id: 'cruz_azul',
    name: 'Cruz Azul',
    country: 'México',
    competition: 'Liga MX',
    stadium: 'Estadio Azteca',
    crest: '/clubs/escudo_cruzazul.webp',
    apiTeamId: null,
  },
  {
    id: 'fbc_melgar',
    name: 'FBC Melgar',
    country: 'Perú',
    competition: 'Liga 1',
    stadium: 'Estadio Monumental de la UNSA',
    crest: '/clubs/escudo_melgar.webp',
    apiTeamId: null,
  },
  {
    id: 'emelec',
    name: 'Emelec',
    country: 'Ecuador',
    competition: 'LigaPro Serie A',
    stadium: 'Estadio George Capwell',
    crest: '/clubs/escudo_emelec.webp',
    apiTeamId: null,
  },
  {
    id: 'junior',
    name: 'Junior de Barranquilla',
    country: 'Colombia',
    competition: 'Liga BetPlay Dimayor',
    stadium: 'Estadio Atanasio Girardot',
    crest: '/clubs/escudo_junior.webp',
    apiTeamId: null,
  },
  {
    id: 'deportes_la_serena',
    name: 'Deportes La Serena',
    country: 'Chile',
    competition: 'Liga de Primera',
    stadium: 'Estadio La Portada',
    crest: '/clubs/escudo_serena.webp',
    apiTeamId: null,
  },
  {
    id: 'estudiantes_lp',
    name: 'Estudiantes de La Plata',
    country: 'Argentina',
    competition: 'Liga Profesional',
    stadium: 'Estadio Jorge Luis Hirschi',
    crest: '/clubs/escudo_estudiantes.webp',
    apiTeamId: null,
  },
  {
    id: 'atlanta',
    name: 'Atlanta',
    country: 'Argentina',
    competition: 'Primera Nacional',
    stadium: 'Estadio Don León Kolbowski',
    crest: '/clubs/escudo_atlanta.webp',
    apiTeamId: null,
  },
  {
    id: 'talleres',
    name: 'Talleres',
    country: 'Argentina',
    competition: 'Liga Profesional',
    stadium: 'Estadio Mario Alberto Kempes',
    crest: '/clubs/escudo_talleres.webp',
    apiTeamId: null,
  },
  {
    id: 'dep_riestra',
    name: 'Deportivo Riestra',
    country: 'Argentina', 
    competition: 'Liga Profesional',
    stadium: 'Estadio Guillermo Laza',
    crest: '/clubs/escudo_riestra.webp',
    apiTeamId: null,
  }
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
