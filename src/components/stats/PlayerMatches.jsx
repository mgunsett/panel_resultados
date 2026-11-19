import { useMemo, useState } from 'react'
import { Box, Flex, HStack, Text, Button, SimpleGrid } from '@chakra-ui/react'
import { FiList, FiRefreshCw } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { MATCH_COLUMNS } from '../../lib/statsSchema'
import { availableSeasons } from '../../lib/playerStats'
import { exportFileName } from '../../lib/exporters'
import DataTable from './DataTable'
import ExportMenu from './ExportMenu'
import SectionCard from './SectionCard'
import SeasonSelect from './SeasonSelect'
import { StatTile } from './StatTile'

// Pestaña "Partidos": todos los partidos de una temporada con la
// ficha completa de cada uno.
export default function PlayerMatches({ player, stats }) {
  const navigate = useNavigate()
  const seasons = availableSeasons(stats)
  const [season, setSeason] = useState(seasons[0] ?? new Date().getFullYear())
  const matches = useMemo(() => stats.history[season] || [], [stats, season])

  const played = matches.filter((m) => m.jugo)
  const sum = (k) => played.reduce((a, m) => a + (Number(m[k]) || 0), 0)

  return (
    <SectionCard
      title="Partidos" icon={FiList}
      right={
        <HStack>
          {seasons.length > 0 && <SeasonSelect seasons={seasons} value={season} onChange={setSeason} />}
          <ExportMenu name={exportFileName(player.slug, 'partidos', season)}
            sheets={[{ sheet: `Partidos ${season}`, columns: MATCH_COLUMNS, rows: matches }]} />
        </HStack>
      }
    >
      {matches.length > 0 && (
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={2.5} mb={4}>
          <StatTile label="Partidos del club" value={matches.length} />
          <StatTile label="Jugó" value={played.length} accent />
          <StatTile label="Minutos" value={sum('minutos')} />
          <StatTile label="Goles" value={sum('goles')} />
          <StatTile label="Asistencias" value={sum('asistencias')} />
        </SimpleGrid>
      )}

      <DataTable
        columns={MATCH_COLUMNS}
        rows={matches}
        rowKey={(r) => r.fixtureId}
        defaultSort={{ key: 'fecha', dir: 'desc' }}
        emptyText={`Todavía no hay partidos guardados de ${season}. Los nuevos se suman solos; para los anteriores usá "Completar historial" en Sincronización.`}
      />

      {matches.length === 0 && (
        <Flex justify="center" mt={3}>
          <Button size="sm" variant="ghost" color="brand.orange" leftIcon={<FiRefreshCw />} onClick={() => navigate('/sincronizacion')}>
            Ir a Sincronización
          </Button>
        </Flex>
      )}
      {matches.length > 0 && (
        <Box mt={2}>
          <Text fontSize="xs" color="brand.gray">
            Incluye todos los partidos del club en la temporada: en los que no sumó minutos figura "Jugó: No".
            Tocá un encabezado para ordenar.
          </Text>
        </Box>
      )}
    </SectionCard>
  )
}
