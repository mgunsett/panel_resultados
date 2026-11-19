import { useMemo, useState } from 'react'
import {
  Box, Flex, HStack, Text, Select, Spinner, Image, Avatar, ButtonGroup, Button,
} from '@chakra-ui/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAllPlayersStats } from '../hooks/usePlayerStats'
import { getClubsWithPlayers, playerInitials } from '../data/players'
import { SEASON_COLUMNS, PER90_COLUMNS, MATCH_COLUMNS, PLAYER_COLUMNS } from '../lib/statsSchema'
import { availableSeasons } from '../lib/playerStats'
import { exportFileName } from '../lib/exporters'
import PageContainer from '../components/layout/PageContainer'
import PageHeader from '../components/layout/PageHeader'
import DataTable from '../components/stats/DataTable'
import ExportMenu from '../components/stats/ExportMenu'
import SeasonSelect from '../components/stats/SeasonSelect'
import { inputStyle } from '../components/ui/formStyles'

// ─── ESTADÍSTICAS: COMPARAR Y EXPORTAR ───────────────────────────
// Todos los jugadores en una tabla, filtrable por club y temporada.
//   Temporada      totales del año (stats/seasons)
//   Cada 90'       los mismos totales normalizados por minutos jugados
//   Último partido la ficha de stats/last de cada uno
//   Partidos       todos los partidos de todos, uno por fila
// Exportar baja la vista actual; el Excel trae las cuatro en hojas.

const VIEWS = [
  { id: 'temporada', label: 'Temporada' },
  { id: 'p90', label: "Cada 90'" },
  { id: 'ultimo', label: 'Último partido' },
  { id: 'partidos', label: 'Partidos' },
]

const P90_VIEW_COLUMNS = [
  ...SEASON_COLUMNS.filter((c) => ['partidos', 'minutos', 'rating', 'precisionPases'].includes(c.key)),
  ...PER90_COLUMNS,
]

function PlayerCell({ row }) {
  return (
    <HStack spacing={2.5} minW="170px">
      <Avatar size="xs" src={row.photo} name={playerInitials(row.jugador)} bg="brand.brownLight" color="brand.amber" />
      <Box minW={0}>
        <Text fontSize="sm" color="white" noOfLines={1}>{row.jugador}</Text>
        <HStack spacing={1}>
          {row.clubCrest && <Image src={row.clubCrest} boxSize="12px" objectFit="contain" alt="" />}
          <Text fontSize="10px" color="brand.gray" noOfLines={1}>{row.club}</Text>
        </HStack>
      </Box>
    </HStack>
  )
}

export default function StatsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { rows, loading } = useAllPlayersStats()
  const clubs = getClubsWithPlayers()

  const view = VIEWS.some((v) => v.id === params.get('vista')) ? params.get('vista') : 'temporada'
  const clubId = params.get('club') || ''
  const setParam = (k, v) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v); else next.delete(k)
    setParams(next, { replace: true })
  }

  const seasons = useMemo(() => {
    const set = new Set()
    rows.forEach(({ stats }) => availableSeasons(stats).forEach((y) => set.add(y)))
    return [...set].sort((a, b) => b - a)
  }, [rows])
  const [pickedSeason, setPickedSeason] = useState(null)
  const season = pickedSeason ?? seasons[0] ?? new Date().getFullYear()

  // Sólo jugadores con estadísticas (los DT y los que no tienen
  // apiPlayerId no suman nada a la comparación).
  const scoped = useMemo(
    () => rows.filter(({ player }) => player.apiPlayerId && (!clubId || player.clubId === clubId)),
    [rows, clubId],
  )

  const ident = ({ player, club }) => ({
    slug: player.slug, jugador: player.name, club: club?.name || '—', photo: player.photo, clubCrest: club?.crest,
  })

  const seasonRows = useMemo(
    () => scoped.map((r) => ({ ...ident(r), ...(r.stats.seasons[season] || {}) })),
    [scoped, season],
  )
  const lastRows = useMemo(
    () => scoped.filter((r) => r.stats.last).map((r) => ({ ...ident(r), ...r.stats.last })),
    [scoped],
  )
  const matchRows = useMemo(
    () => scoped.flatMap((r) => (r.stats.history[season] || []).map((m) => ({ ...ident(r), ...m }))),
    [scoped, season],
  )

  const sheets = [
    { sheet: `Temporada ${season}`, columns: [...PLAYER_COLUMNS, ...SEASON_COLUMNS], rows: seasonRows },
    { sheet: `Cada 90 ${season}`, columns: [...PLAYER_COLUMNS, ...P90_VIEW_COLUMNS], rows: seasonRows },
    { sheet: 'Último partido', columns: [...PLAYER_COLUMNS, ...MATCH_COLUMNS], rows: lastRows },
    { sheet: `Partidos ${season}`, columns: [...PLAYER_COLUMNS, ...MATCH_COLUMNS], rows: matchRows },
  ]
  const current = sheets[VIEWS.findIndex((v) => v.id === view)]
  // La vista actual primero: es la que baja el CSV.
  const exportSheets = [current, ...sheets.filter((s) => s !== current)]

  const tableColumns = view === 'temporada' ? SEASON_COLUMNS : view === 'p90' ? P90_VIEW_COLUMNS : MATCH_COLUMNS
  const tableRows = current.rows
  const clubName = clubs.find((c) => c.id === clubId)?.name

  return (
    <PageContainer maxW="1400px">
      <PageHeader eyebrow={`${scoped.length} jugadores con estadísticas`} title="Estadísticas">
        <ExportMenu
          name={exportFileName('estadisticas', clubName || 'todos', view === 'ultimo' ? 'ultimo' : season)}
          sheets={exportSheets} isDisabled={loading}
        />
      </PageHeader>

      <Flex gap={3} mb={4} wrap="wrap" align="center">
        <ButtonGroup size="sm" isAttached variant="outline" overflowX="auto" maxW="100%">
          {VIEWS.map((v) => (
            <Button
              key={v.id} onClick={() => setParam('vista', v.id === 'temporada' ? '' : v.id)}
              fontFamily="mono" fontSize="xs" letterSpacing="wider" textTransform="uppercase"
              borderColor="brand.brownDark"
              bg={view === v.id ? 'brand.amber' : 'transparent'}
              color={view === v.id ? 'brand.brown' : 'brand.gray'}
              _hover={{ bg: view === v.id ? 'brand.amber' : 'brand.brownLight' }}
            >
              {v.label}
            </Button>
          ))}
        </ButtonGroup>

        <Select {...inputStyle} size="sm" h="32px" w="190px" value={clubId} onChange={(e) => setParam('club', e.target.value)}>
          <option value="" style={{ background: '#1E1B19' }}>Todos los clubes</option>
          {clubs.map((c) => <option key={c.id} value={c.id} style={{ background: '#1E1B19' }}>{c.name}</option>)}
        </Select>

        {view !== 'ultimo' && seasons.length > 0 && (
          <SeasonSelect seasons={seasons} value={season} onChange={setPickedSeason} w="150px" />
        )}
      </Flex>

      {loading ? (
        <Flex justify="center" py={16}><Spinner color="brand.amber" /></Flex>
      ) : (
        <>
          <DataTable
            key={view}
            columns={tableColumns}
            rows={tableRows}
            rowKey={(r, i) => `${r.slug}-${r.fixtureId || ''}-${i}`}
            lead={{ label: 'Jugador', render: (r) => <PlayerCell row={r} />, sortValue: (r) => r.jugador }}
            defaultSort={view === 'partidos' ? { key: 'fecha', dir: 'desc' } : view === 'ultimo' ? { key: 'rating', dir: 'desc' } : { key: 'minutos', dir: 'desc' }}
            highlight={view !== 'partidos'}
            onRowClick={(r) => navigate(`/jugador/${r.slug}${view === 'partidos' ? '?tab=partidos' : ''}`)}
            emptyText={view === 'partidos'
              ? `No hay partidos guardados de ${season}. Completá el historial desde Sincronización.`
              : 'No hay datos para este filtro.'}
          />
          <Text fontSize="xs" color="brand.gray" mt={2}>
            Tocá un encabezado para ordenar y una fila para abrir la ficha del jugador.
            {view !== 'partidos' && ' En naranja, el mejor valor de cada columna.'}
          </Text>
        </>
      )}
    </PageContainer>
  )
}
