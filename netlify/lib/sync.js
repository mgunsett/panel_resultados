import {
  clubTimezone, pickLastFinished, pickNext, fixtureToMatchPayload,
  matchContentChanged, playerStatsFromFixture,
} from './mappers.js'

// ─── SINCRONIZACIÓN CON API-FOOTBALL ─────────────────────────────
// Por cada club con `apiTeamId`:
//   1. Pide su último partido terminado y el próximo (2 requests).
//   2. Los escribe en players/{slug}/matches/{last|next} de todos sus
//      jugadores, con el mismo formato que el panel.
//   3. Si el último partido es nuevo para algún jugador con
//      `apiPlayerId`, pide las estadísticas de ese partido (1 request
//      por club) y las guarda en players/{slug}/stats/last. La ficha
//      anterior pasa a players/{slug}/stats/prev.
//
// Nunca pisa un documento con `locked: true` (se marca desde el panel)
// y no reescribe nada si el contenido no cambió.
//
// Consumo por pasada: 2 requests por club, más 1 por club en los días
// en que ese club jugó. Con 13 clubes: ~26 requests por pasada.

const CONCURRENCY = 3

async function mapLimit(items, limit, fn) {
  const results = []
  let i = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx])
    }
  })
  await Promise.all(workers)
  return results
}

async function readDoc(db, path) {
  const snap = await db.doc(path).get()
  return snap.exists ? snap.data() : null
}

async function syncClub({ db, api, club, clubPlayers, dryRun, now }) {
  const report = {
    clubId: club.id,
    club: club.name,
    last: null,
    next: null,
    writes: [],
    skippedLocked: [],
    stats: 'sin jugadores con apiPlayerId',
  }

  const timezone = clubTimezone(club)
  const [lastList, nextList] = await Promise.all([
    api.get('/fixtures', { team: club.apiTeamId, last: 5, timezone }),
    api.get('/fixtures', { team: club.apiTeamId, next: 1, timezone }),
  ])
  const lastFx = pickLastFinished(lastList)
  const nextFx = pickNext(nextList)

  const fixtures = { last: lastFx, next: nextFx }
  report.last = lastFx ? `${lastFx.teams.home.name} ${lastFx.goals.home}-${lastFx.goals.away} ${lastFx.teams.away.name}` : null
  report.next = nextFx ? `${nextFx.teams.home.name} vs ${nextFx.teams.away.name} (${nextFx.fixture.date?.slice(0, 10)})` : null

  const writes = [] // [{ path, data }]

  // ── Partidos (match box) ──
  for (const player of clubPlayers) {
    for (const slot of ['last', 'next']) {
      const fx = fixtures[slot]
      // Si la API no tiene partido (fin de temporada, receso) dejamos
      // lo que haya: mejor un dato viejo que un match box vacío.
      if (!fx) continue
      const path = `players/${player.slug}/matches/${slot}`
      const current = await readDoc(db, path)
      if (current?.locked) {
        report.skippedLocked.push(`${player.slug}/${slot}`)
        continue
      }
      const payload = fixtureToMatchPayload(fx, club, now)
      if (matchContentChanged(current, payload)) writes.push({ path, data: payload })
    }
  }

  // ── Estadísticas del último partido ──
  const statPlayers = clubPlayers.filter((p) => p.apiPlayerId)
  if (lastFx && statPlayers.length) {
    const pending = []
    for (const player of statPlayers) {
      const lastPath = `players/${player.slug}/stats/last`
      const current = await readDoc(db, lastPath)
      if (current?.locked) {
        report.skippedLocked.push(`${player.slug}/stats`)
        continue
      }
      if (current?.fixtureId !== lastFx.fixture.id) pending.push({ player, current })
    }

    if (!pending.length) {
      report.stats = 'al día'
    } else {
      const fixturePlayers = await api.get('/fixtures/players', { fixture: lastFx.fixture.id })
      // La API carga las estadísticas un rato después del partido. Si
      // todavía no están, no escribimos nada y se reintenta en la
      // próxima pasada.
      if (!fixturePlayers?.length) {
        report.stats = 'todavía no publicadas, se reintenta en la próxima pasada'
      } else {
        for (const { player, current } of pending) {
          const stats = playerStatsFromFixture(lastFx, fixturePlayers, club, player.apiPlayerId, now)
          if (current) writes.push({ path: `players/${player.slug}/stats/prev`, data: current })
          writes.push({ path: `players/${player.slug}/stats/last`, data: stats })
        }
        report.stats = `actualizadas para ${pending.length} jugador(es)`
      }
    }
  }

  report.writes = writes.map((w) => w.path)

  if (!dryRun && writes.length) {
    // Todo el club en un solo batch: o se actualizan todos o ninguno,
    // igual que la carga por club del panel.
    const batch = db.batch()
    writes.forEach(({ path, data }) => batch.set(db.doc(path), data))
    await batch.commit()
  }

  return report
}

export async function runSync({ db, api, clubs, players, clubId = null, dryRun = false, now = new Date().toISOString() }) {
  const targets = clubs
    .filter((c) => !clubId || c.id === clubId)
    .map((club) => ({ club, clubPlayers: players.filter((p) => p.clubId === club.id) }))
    .filter(({ clubPlayers }) => clubPlayers.length > 0)

  const withoutId = targets.filter(({ club }) => !club.apiTeamId).map(({ club }) => club.name)
  const ready = targets.filter(({ club }) => club.apiTeamId)

  const clubsReport = await mapLimit(ready, CONCURRENCY, async ({ club, clubPlayers }) => {
    try {
      return await syncClub({ db, api, club, clubPlayers, dryRun, now })
    } catch (err) {
      // Un club que falla no frena al resto.
      return { clubId: club.id, club: club.name, error: err.message }
    }
  })

  return {
    ranAt: now,
    dryRun,
    clubs: clubsReport,
    clubsWithoutApiId: withoutId,
    usage: api.usage(),
  }
}
