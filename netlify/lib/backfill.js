import {
  clubTimezone, FINISHED_STATUSES, playerStatsFromFixture, seasonStatsFromPlayer,
  historyDocId, historyEntryFromStats, historyEntryWithoutData,
} from './mappers.js'

// ─── COMPLETAR HISTORIAL (a pedido, desde el panel) ──────────────
// La sincronización programada sólo agrega el partido nuevo. Para
// llenar lo que pasó antes hay dos acciones, pensadas para llamarse en
// tandas chicas (las funciones de Netlify cortan a los ~10 s y la API
// tiene límite por minuto):
//
//   backfillClubHistory  → partidos de una temporada de un club.
//     1 request para listar los partidos + 1 por partido que falte.
//     Procesa hasta `limit` partidos y devuelve cuántos quedan: el
//     panel la vuelve a llamar hasta que `remaining` sea 0.
//
//   backfillPlayerSeason → totales de un jugador en un año.
//     1 request. Se guarda en stats/seasons.
//
// Nunca toca stats/last, stats/prev ni stats/season (lo que leen las
// landings): sólo los documentos del panel.

const DEFAULT_LIMIT = 6

async function readDoc(db, path) {
  const snap = await db.doc(path).get()
  return snap.exists ? snap.data() : null
}

export async function backfillClubHistory({
  db, api, club, clubPlayers, season, limit = DEFAULT_LIMIT, dryRun = false, now = new Date().toISOString(),
}) {
  const statPlayers = clubPlayers.filter((p) => p.apiPlayerId)
  if (!club.apiTeamId) throw new Error(`${club.name} no tiene apiTeamId en clubs.js.`)
  if (!statPlayers.length) {
    return { club: club.name, season, total: 0, fetched: 0, remaining: 0, note: 'sin jugadores con apiPlayerId' }
  }

  const list = await api.get('/fixtures', { team: club.apiTeamId, season, timezone: clubTimezone(club) })
  const finished = (list || [])
    .filter((f) => FINISHED_STATUSES.includes(f?.fixture?.status?.short))
    .sort((a, b) => (a.fixture.timestamp || 0) - (b.fixture.timestamp || 0))

  const docId = historyDocId(season)
  const histories = {}
  for (const player of statPlayers) {
    histories[player.slug] = (await readDoc(db, `players/${player.slug}/stats/${docId}`))?.partidos || {}
  }

  // Un partido falta si algún jugador del club no lo tiene.
  const missing = finished.filter((fx) => statPlayers.some((p) => !histories[p.slug][fx.fixture.id]))
  const batchFx = missing.slice(0, limit)

  const perPlayer = Object.fromEntries(statPlayers.map((p) => [p.slug, {}]))
  let withoutData = 0
  for (const fx of batchFx) {
    const fixturePlayers = await api.get('/fixtures/players', { fixture: fx.fixture.id })
    const hasData = (fixturePlayers || []).some((t) => t?.team?.id === club.apiTeamId && t.players?.length)
    if (!hasData) withoutData += 1
    for (const player of statPlayers) {
      if (histories[player.slug][fx.fixture.id]) continue
      const entry = hasData
        ? historyEntryFromStats(playerStatsFromFixture(fx, fixturePlayers, club, player.apiPlayerId, now), fx)
        : historyEntryWithoutData(fx, club, now)
      perPlayer[player.slug][fx.fixture.id] = entry
    }
  }

  const writes = Object.entries(perPlayer)
    .filter(([, partidos]) => Object.keys(partidos).length)
    .map(([slug, partidos]) => ({
      path: `players/${slug}/stats/${docId}`,
      data: { temporada: season, partidos, updated_at: now },
    }))

  if (!dryRun && writes.length) {
    const batch = db.batch()
    writes.forEach(({ path, data }) => batch.set(db.doc(path), data, { merge: true }))
    await batch.commit()
  }

  return {
    club: club.name,
    season,
    total: finished.length,
    fetched: batchFx.length,
    withoutData,
    remaining: missing.length - batchFx.length,
    writes: writes.map((w) => w.path),
    usage: api.usage(),
  }
}

export async function backfillPlayerSeason({ db, api, player, season, dryRun = false, now = new Date().toISOString() }) {
  if (!player.apiPlayerId) throw new Error(`${player.name} no tiene apiPlayerId en players.js.`)
  const response = await api.get('/players', { id: player.apiPlayerId, season })
  const totals = seasonStatsFromPlayer(response, season, now)
  if (totals && !dryRun) {
    await db.doc(`players/${player.slug}/stats/seasons`).set(
      { temporadas: { [season]: totals }, updated_at: now },
      { merge: true },
    )
  }
  return { player: player.slug, season, found: Boolean(totals), usage: api.usage() }
}
