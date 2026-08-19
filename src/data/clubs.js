// ─── CLUBES DEL PANEL ────────────────────────────────────────────

import universitario from '../../public/clubs/escudo_universitario.webp'
import cusco from '../../public/clubs/escudo_cusco.webp'
import emelec from '../../public/clubs/escudo_emelec.webp'
import melgar from '../../public/clubs/escudo_melgar.webp'
import serena from '../../public/clubs/escudo_serena.webp'
import alianza from '../../public/clubs/escudo_alianzalima.webp'
import atlanta from '../../public/clubs/escudo_atlanta.webp'
import junior from '../../public/clubs/escudo_junior.webp'
import estudiantes from '../../public/clubs/escudo_estudiantes.webp'
import cruzAzul from '../../public/clubs/escudo_cruzazul.webp'
import talleres from '../../public/clubs/escudo_talleres.webp'
import platense from '../../public/clubs/escudo_platense.webp'

export const clubs = [
  {
    id: 'universitario',
    name: 'Universitario',
    country: 'Perú',
    competition: 'Liga 1',
    stadium: 'Estadio Monumental "U"',
    crest: universitario,
  },
  {
    id: 'platense',
    name: 'Platense',
    country: 'Argentina',
    competition: 'Liga Profesional',
    stadium: 'Estadio Ciudad de Vicente López',
    crest: platense,
  },    
  {
    id: 'cusco_fc',
    name: 'Cusco FC',
    country: 'Perú',
    competition: 'Liga 1',
    stadium: 'Estadio Inca Garcilaso de la Vega',
    crest: cusco,
  },
  {
    id: 'alianza_lima',
    name: 'Alianza Lima',
    country: 'Perú',
    competition: 'Liga 1',
    stadium: 'Estadio Alejandro Villanueva',
    crest: alianza,
  },
  {
    id: 'cruz_azul',
    name: 'Cruz Azul',
    country: 'México',
    competition: 'Liga MX',
    stadium: 'Estadio Azteca',
    crest: cruzAzul,
  },
  {
    id: 'fbc_melgar',
    name: 'FBC Melgar',
    country: 'Perú',
    competition: 'Liga 1',
    stadium: 'Estadio Monumental de la UNSA',
    crest: melgar,
  },
  {
    id: 'emelec',
    name: 'Emelec',
    country: 'Ecuador',
    competition: 'LigaPro Serie A',
    stadium: 'Estadio George Capwell',
    crest: emelec,
  },
  {
    id: 'junior',
    name: 'Junior de Barranquilla',
    country: 'Colombia',
    competition: 'Liga BetPlay Dimayor',
    stadium: 'Estadio Atanasio Girardot',
    crest: junior,
  },
  {
    id: 'deportes_la_serena',
    name: 'Deportes La Serena',
    country: 'Chile',
    competition: 'Liga de Primera',
    stadium: 'Estadio La Portada',
    crest: serena,
  },
  {
    id: 'estudiantes_lp',
    name: 'Estudiantes de La Plata',
    country: 'Argentina',
    competition: 'Liga Profesional',
    stadium: 'Estadio Jorge Luis Hirschi',
    crest: estudiantes,
  },
  {
    id: 'atlanta',
    name: 'Atlanta',
    country: 'Argentina',
    competition: 'Primera Nacional',
    stadium: 'Estadio Don León Kolbowski',
    crest: atlanta,
  },
  {
    id: 'talleres',
    name: 'Talleres',
    country: 'Argentina',
    competition: 'Liga Profesional',
    stadium: 'Estadio Mario Alberto Kempes',
    crest: talleres,
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
