import { clubs } from '../../src/data/clubs.js'
import { players } from '../../src/data/players.js'
import { createApiFootballClient } from '../lib/apiFootball.js'
import { adminDb, requireUser } from '../lib/firebaseAdmin.js'
import { runSync } from '../lib/sync.js'
import { backfillClubHistory, backfillPlayerSeason } from '../lib/backfill.js'
import { currentSeason } from '../lib/mappers.js'

// ─── PUENTE PANEL ↔ API-FOOTBALL ─────────────────────────────────
// El panel nunca llama a API-Football directo (la key quedaría en el
// navegador): llama a esta función con el token de Firebase del admin
// logueado, y la función hace el pedido con la key del servidor.
//
//   GET  ?action=status               plan y consumo del día (no gasta cuota)
//   GET  ?action=teams&q=talleres     buscar equipos por nombre
//   GET  ?action=squad&team=435       plantel de un equipo (con IDs)
//   GET  ?action=players&q=mainero    buscar jugadores por apellido
//   POST ?action=sync[&club=id][&dryRun=1]   sincronizar ahora
//   POST ?action=history&club=id[&season=2026]  completar historial de
//        partidos de un club (en tandas: repetir mientras remaining > 0)
//   POST ?action=season&player=slug&season=2025  totales de un año

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

export default async (req) => {
  const user = await requireUser(req)
  if (!user) return json(401, { error: 'Sesión inválida. Volvé a iniciar sesión en el panel.' })

  const params = new URL(req.url).searchParams
  const action = params.get('action')

  try {
    const api = createApiFootballClient()

    switch (action) {
      case 'status': {
        const status = await api.get('/status')
        return json(200, {
          account: status?.account || null,
          plan: status?.subscription?.plan || null,
          active: status?.subscription?.active ?? null,
          endsAt: status?.subscription?.end || null,
          requests: status?.requests || null,
        })
      }

      case 'teams': {
        const q = (params.get('q') || '').trim()
        if (q.length < 3) return json(400, { error: 'Escribí al menos 3 letras.' })
        const res = await api.get('/teams', { search: q })
        return json(200, {
          results: res.map(({ team, venue }) => ({
            id: team.id, name: team.name, country: team.country, logo: team.logo, venue: venue?.name || null,
          })),
        })
      }

      case 'squad': {
        const team = params.get('team')
        if (!team) return json(400, { error: 'Falta el parámetro team.' })
        const res = await api.get('/players/squads', { team })
        return json(200, {
          results: (res?.[0]?.players || []).map((p) => ({
            id: p.id, name: p.name, number: p.number, position: p.position, photo: p.photo,
          })),
        })
      }

      case 'players': {
        // La API sólo acepta letras sin tildes en la búsqueda por apellido.
        const q = (params.get('q') || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
        if (q.length < 3) return json(400, { error: 'Escribí al menos 3 letras.' })
        const res = await api.get('/players/profiles', { search: q })
        return json(200, {
          results: res.map(({ player }) => ({
            id: player.id, name: `${player.firstname || ''} ${player.lastname || ''}`.trim() || player.name,
            nationality: player.nationality, birth: player.birth?.date || null, photo: player.photo,
          })),
        })
      }

      case 'sync': {
        if (req.method !== 'POST') return json(405, { error: 'Usá POST para sincronizar.' })
        const report = await runSync({
          db: adminDb(),
          api,
          clubs,
          players,
          clubId: params.get('club') || null,
          dryRun: params.get('dryRun') === '1',
        })
        return json(200, report)
      }

      case 'history': {
        if (req.method !== 'POST') return json(405, { error: 'Usá POST.' })
        const club = clubs.find((c) => c.id === params.get('club'))
        if (!club) return json(400, { error: 'Club desconocido.' })
        const report = await backfillClubHistory({
          db: adminDb(),
          api,
          club,
          clubPlayers: players.filter((p) => p.clubId === club.id),
          season: Number(params.get('season')) || currentSeason(),
          dryRun: params.get('dryRun') === '1',
        })
        return json(200, report)
      }

      case 'season': {
        if (req.method !== 'POST') return json(405, { error: 'Usá POST.' })
        const player = players.find((p) => p.slug === params.get('player'))
        if (!player) return json(400, { error: 'Jugador desconocido.' })
        const season = Number(params.get('season'))
        if (!season) return json(400, { error: 'Falta el parámetro season.' })
        const report = await backfillPlayerSeason({ db: adminDb(), api, player, season })
        return json(200, report)
      }

      default:
        return json(400, { error: `Acción desconocida: ${action}` })
    }
  } catch (err) {
    return json(502, { error: err.message })
  }
}
