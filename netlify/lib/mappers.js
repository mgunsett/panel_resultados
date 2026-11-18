// ─── DE API-FOOTBALL A NUESTRO FORMATO ───────────────────────────
// Funciones puras: reciben lo que devuelve la API y arman exactamente
// lo que leen las landings. Sin red ni Firestore, así se prueban solas.

// Estados de partido terminado en API-Football: final, alargue, penales.
export const FINISHED_STATUSES = ['FT', 'AET', 'PEN']

// Zona horaria por país, para que fecha y hora salgan en hora local
// del club y no en UTC.
const COUNTRY_TIMEZONES = {
  Argentina: 'America/Argentina/Buenos_Aires',
  'Perú': 'America/Lima',
  'México': 'America/Mexico_City',
  Ecuador: 'America/Guayaquil',
  Colombia: 'America/Bogota',
  Chile: 'America/Santiago',
}

export function clubTimezone(club) {
  return COUNTRY_TIMEZONES[club?.country] || 'America/Argentina/Buenos_Aires'
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// "2025-06-22T21:00:00-03:00" → "22 Jun 2025", el mismo formato que se
// carga a mano en el panel. Se toma la parte local del string (la API
// ya la devuelve en la zona pedida) para no depender de la zona del
// servidor.
export function formatMatchDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''))
  if (!m) return ''
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`
}

// "2025-06-22T21:00:00-03:00" → "21:00"
export function formatMatchTime(iso) {
  const m = /T(\d{2}):(\d{2})/.exec(String(iso || ''))
  return m ? `${m[1]}:${m[2]}` : ''
}

// Del listado de `/fixtures?team=X&last=N` se queda con el último
// partido realmente terminado (descarta suspendidos o postergados).
export function pickLastFinished(fixtures) {
  return [...(fixtures || [])]
    .filter((f) => FINISHED_STATUSES.includes(f?.fixture?.status?.short))
    .sort((a, b) => (b.fixture.timestamp || 0) - (a.fixture.timestamp || 0))[0] || null
}

// Del listado de `/fixtures?team=X&next=N` se queda con el más próximo.
export function pickNext(fixtures) {
  return [...(fixtures || [])]
    .sort((a, b) => (a.fixture.timestamp || 0) - (b.fixture.timestamp || 0))[0] || null
}

// Nombre para mostrar: nuestro club usa el nombre de clubs.js (el
// mismo que ve la gente en todo el sitio); el rival, el de la API.
function teamName(team, club) {
  return team?.id === club?.apiTeamId ? club.name : team?.name || ''
}

// Mismo contrato que `buildMatchPayload` del panel
// (players/{slug}/matches/{last|next}) más algunos campos extra que las
// landings ignoran y que la sincronización usa para no repetir trabajo.
export function fixtureToMatchPayload(fx, club, now = new Date().toISOString()) {
  const isFinished = FINISHED_STATUSES.includes(fx.fixture.status?.short)
  return {
    home_team: teamName(fx.teams.home, club),
    away_team: teamName(fx.teams.away, club),
    home_score: isFinished ? fx.goals.home ?? null : null,
    away_score: isFinished ? fx.goals.away ?? null : null,
    match_date: formatMatchDate(fx.fixture.date),
    stadium: fx.fixture.venue?.name || '',
    competition: fx.league?.name || '',
    home_shield: fx.teams.home.logo || null,
    away_shield: fx.teams.away.logo || null,
    updated_at: now,
    // Extras de la sincronización.
    source: 'api',
    locked: false,
    api_fixture_id: fx.fixture.id,
    api_status: fx.fixture.status?.short || null,
    match_time: formatMatchTime(fx.fixture.date),
    match_datetime: fx.fixture.date || null,
  }
}

// Campos que deciden si vale la pena reescribir un partido. Si nada de
// esto cambió, no tocamos el documento (y `updated_at` queda igual).
const MATCH_CONTENT_FIELDS = [
  'home_team', 'away_team', 'home_score', 'away_score', 'match_date',
  'stadium', 'competition', 'home_shield', 'away_shield',
  'api_fixture_id', 'api_status', 'match_time',
]

export function matchContentChanged(current, next) {
  if (!current) return true
  return MATCH_CONTENT_FIELDS.some((f) => (current[f] ?? null) !== (next[f] ?? null))
}

// Posiciones de la API → las que usa la ficha de LED Sports.
const POSITIONS = { G: 'ARQ', D: 'DEF', M: 'MED', F: 'DEL' }

function num(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// Busca al jugador en la respuesta de `/fixtures/players?fixture=X` y
// arma sus estadísticas con las mismas claves que la ficha de partido
// (minutos, rating, goles, pasesOk, duelosG...). Un null significa "sin
// dato" y la ficha no muestra esa fila.
export function playerStatsFromFixture(fx, fixturePlayers, club, apiPlayerId, now = new Date().toISOString()) {
  const isHome = fx.teams.home.id === club.apiTeamId
  const rival = isHome ? fx.teams.away : fx.teams.home
  const gf = isHome ? fx.goals.home : fx.goals.away
  const gc = isHome ? fx.goals.away : fx.goals.home

  const base = {
    fixtureId: fx.fixture.id,
    fecha: String(fx.fixture.date || '').slice(0, 10),
    competicion: fx.league?.name || '',
    rival: rival?.name || '',
    rivalLogo: rival?.logo || null,
    condicion: isHome ? 'L' : 'V',
    gf: num(gf),
    gc: num(gc),
    fuente: 'API-Football',
    source: 'api',
    locked: false,
    updated_at: now,
  }

  const teamBlock = (fixturePlayers || []).find((t) => t?.team?.id === club.apiTeamId)
  const entry = teamBlock?.players?.find((p) => p?.player?.id === apiPlayerId)
  const s = entry?.statistics?.[0]

  // No estuvo en la planilla o no sumó minutos: lo dejamos explícito
  // para que la landing pueda decir "no jugó" en vez de mostrar ceros.
  if (!s || !num(s.games?.minutes)) {
    return { ...base, jugo: false }
  }

  const pases = num(s.passes?.total)
  const pasesOk = num(s.passes?.accuracy)

  return {
    ...base,
    jugo: true,
    minutos: num(s.games.minutes),
    posicion: POSITIONS[s.games.position] || null,
    rating: num(s.games.rating),
    titular: s.games.substitute ? '0' : '1',
    capitan: Boolean(s.games.captain),
    // La API manda null cuando es 0 en goles y asistencias; para quien
    // jugó, 0 es el dato correcto.
    goles: num(s.goals?.total) ?? 0,
    asistencias: num(s.goals?.assists) ?? 0,
    golesRec: num(s.goals?.conceded),
    atajadas: num(s.goals?.saves),
    tiros: num(s.shots?.total),
    tirosArco: num(s.shots?.on),
    pases,
    // En las estadísticas por partido `accuracy` es la cantidad de pases
    // correctos. Si no cierra con el total, no lo mostramos.
    pasesOk: pasesOk !== null && pases !== null && pasesOk <= pases ? pasesOk : null,
    pasesClave: num(s.passes?.key),
    quites: num(s.tackles?.total),
    intercepciones: num(s.tackles?.interceptions),
    duelos: num(s.duels?.total),
    duelosG: num(s.duels?.won),
    regates: num(s.dribbles?.success),
    regatesInt: num(s.dribbles?.attempts),
    faltasR: num(s.fouls?.drawn),
    faltasC: num(s.fouls?.committed),
    amarillas: num(s.cards?.yellow),
    rojas: num(s.cards?.red),
  }
}
