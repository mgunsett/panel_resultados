import { Box, Text, SimpleGrid, Image, Flex, Button } from '@chakra-ui/react'
import { FiCalendar, FiActivity, FiRefreshCw } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { SEASON_COLUMNS, PER90_COLUMNS, cellValue, formatCell } from '../../lib/statsSchema'
import { StatTile, StatGrid } from './StatTile'
import SectionCard from './SectionCard'
import LastMatchCard from './LastMatchCard'

const col = (k) => SEASON_COLUMNS.find((c) => c.key === k)
const MAIN = ['partidos', 'minutos', 'goles', 'asistencias', 'rating', 'titular'].map(col)
const per90 = (k) => PER90_COLUMNS.find((c) => c.key === `${k}_90`)

function relative(iso) {
  const ms = Date.parse(iso || '')
  if (!ms) return null
  const h = Math.round((Date.now() - ms) / 3600000)
  if (h < 1) return 'hace menos de una hora'
  if (h < 48) return `hace ${h} h`
  return `hace ${Math.round(h / 24)} días`
}

// Pestaña "Resumen": temporada en curso + último partido.
export default function PlayerSummary({ player, stats }) {
  const navigate = useNavigate()
  const season = stats.season
  const rest = SEASON_COLUMNS.filter((c) => !MAIN.includes(c) && cellValue(season || {}, c) !== null)

  if (!player.apiPlayerId) {
    return (
      <SectionCard>
        <Text fontSize="sm" color="brand.gray" mb={3}>
          Este jugador no tiene <b>apiPlayerId</b> en <code>src/data/players.js</code>, así que no se le sincronizan estadísticas.
          Buscalo en Sincronización → IDs de API-Football.
        </Text>
        <Button size="sm" leftIcon={<FiRefreshCw />} variant="outline" color="brand.amber" borderColor="brand.brownDark"
          onClick={() => navigate('/sincronizacion')}>Ir a Sincronización</Button>
      </SectionCard>
    )
  }

  return (
    <>
      <SectionCard
        title={season ? `Temporada ${season.temporada}` : 'Temporada en curso'} icon={FiCalendar}
        right={season?.updated_at && <Text fontSize="xs" color="brand.gray">Actualizado {relative(season.updated_at)}</Text>}
      >
        {!season ? (
          <Text fontSize="sm" color="brand.gray">Todavía no hay totales de la temporada. Se cargan solos en la próxima sincronización.</Text>
        ) : (
          <>
            <StatGrid>
              {MAIN.map((c, i) => <StatTile key={c.key} label={c.label} value={formatCell(cellValue(season, c), c)} accent index={i} />)}
            </StatGrid>
            <Box mt={2.5}>
              <StatGrid>
                {rest.map((c, i) => <StatTile key={c.key} label={c.label} value={formatCell(cellValue(season, c), c)} index={i + 6} />)}
                {['goles', 'asistencias', 'tiros', 'pasesClave'].map((k, i) => {
                  const c = per90(k)
                  return <StatTile key={c.key} label={c.label} value={formatCell(cellValue(season, c), c)} index={i + 6 + rest.length} />
                })}
              </StatGrid>
            </Box>

            {season.competiciones?.length > 0 && (
              <Box mt={5}>
                <Text fontFamily="mono" fontSize="10px" color="brand.gray" textTransform="uppercase" letterSpacing="widest" mb={2}>
                  Por competición
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                  {season.competiciones.map((c) => (
                    <Flex key={`${c.nombre}-${c.club}`} align="center" gap={3} bg="brand.dark" border="1px solid" borderColor="brand.brownDark" borderRadius="md" px={3} py={2}>
                      {c.logo && <Image src={c.logo} boxSize="24px" objectFit="contain" alt="" />}
                      <Box flex={1} minW={0}>
                        <Text fontSize="sm" color="white" noOfLines={1}>{c.nombre}</Text>
                        <Text fontSize="xs" color="brand.gray" noOfLines={1}>{c.club}</Text>
                      </Box>
                      <Text fontFamily="mono" fontSize="sm" color="brand.amber" whiteSpace="nowrap">
                        {c.partidos ?? 0} PJ · {c.minutos ?? 0}' · {c.goles} G · {c.asistencias} A
                      </Text>
                    </Flex>
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </>
        )}
      </SectionCard>

      <SectionCard title="Último partido" icon={FiActivity}
        right={stats.last?.updated_at && <Text fontSize="xs" color="brand.gray">Actualizado {relative(stats.last.updated_at)}</Text>}>
        <LastMatchCard match={stats.last} title="Último" />
        {stats.prev && (
          <Box mt={6} pt={5} borderTop="1px solid" borderColor="brand.brownDark" opacity={0.85}>
            <LastMatchCard match={stats.prev} title="Anterior" />
          </Box>
        )}
      </SectionCard>
    </>
  )
}
