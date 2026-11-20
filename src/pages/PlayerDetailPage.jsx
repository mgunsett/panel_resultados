import {
  Box, Flex, Text, Button, Code, Image, Select, Spinner, Tabs, TabList, Tab, TabPanels, TabPanel,
} from '@chakra-ui/react'
import { FiArrowLeft, FiEdit3, FiShield, FiBarChart2 } from 'react-icons/fi'
import { useNavigate, useParams, useSearchParams, Link as RouterLink } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { getPlayer, players, playerInitials } from '../data/players'
import { getClub } from '../data/clubs'
import { usePlayerMatches } from '../hooks/usePlayerMatches'
import { usePlayerStats } from '../hooks/usePlayerStats'
import { playerStatus, nextMatchLabel } from '../lib/homeData'
import { SEASON_COLUMNS, PER90_COLUMNS, MATCH_COLUMNS } from '../lib/statsSchema'
import { exportFileName } from '../lib/exporters'
import { currentYear, dash, deltaVs, fmtInt, seasonMatches } from '../lib/profileData'
import NotFoundNotice from '../components/ui/NotFoundNotice'
import ClubCrest from '../components/clubs/ClubCrest'
import PlayerLinks from '../components/players/PlayerLinks'
import MatchEditor from '../components/match/MatchEditor'
import ExportMenu from '../components/stats/ExportMenu'
import PlayerSeasons from '../components/stats/PlayerSeasons'
import RatingChart from '../components/profile/RatingChart'
import MatchLog from '../components/profile/MatchLog'
import { Card, LastMatchPanel, StatAreas, CompetitionList, SeasonBars } from '../components/profile/ProfileCards'
import { STATUS_COLORS } from '../components/home/ShowcaseCard'
import { inputStyle } from '../components/ui/formStyles'
import heroTexture from '../assets/fondo_led3.webp'

const MotionBox = motion(Box)

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'partidos', label: 'Partidos' },
  { id: 'temporadas', label: 'Temporadas' },
  { id: 'carga', label: 'Carga manual' },
]

const tabStyle = {
  fontFamily: 'mono', fontSize: '15px', letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'brand.gray', borderBottom: '2px solid', borderColor: 'transparent', px: 0.5, pb: 3, pt: 3, minH: '44px',
  whiteSpace: 'nowrap', _selected: { color: 'white', borderColor: 'brand.orange' }, _hover: { color: 'white' },
}

const btn = { h: '44px', fontFamily: 'mono', fontSize: '14px', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '8px' }

function NoStats({ player, onSync }) {
  return (
    <Card>
      <Text fontSize="15px" color="brand.gray">
        {player.role === 'DT'
          ? 'Los directores técnicos no tienen estadísticas de jugador. Sus partidos se cargan en «Carga manual».'
          : 'Este jugador no tiene ID de API-Football, así que no se le sincronizan estadísticas. Buscalo en Sincronización → IDs de API-Football.'}
      </Text>
      {player.role !== 'DT' && (
        <Button alignSelf="flex-start" size="sm" variant="outline" borderColor="brand.brownDark" color="brand.amber" onClick={onSync}>
          Ir a Sincronización
        </Button>
      )}
    </Card>
  )
}

// ─── FICHA DEL JUGADOR: PERFIL DEPORTIVO ─────────────────────────
// Portada con foto y estado de la landing, la temporada en curso
// comparada con la anterior y cuatro pestañas:
//   Resumen      rating partido a partido, último partido, totales por
//                área de juego y por competición
//   Partidos     todos los partidos del año; cada uno se abre (history_{año})
//   Temporadas   barras por año y la tabla completa (stats/seasons)
//   Carga manual el editor de players/{slug}/matches de siempre
// La pestaña activa va en la URL (?tab=carga) para poder compartirla.
export default function PlayerDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const player = getPlayer(slug)
  const club = getClub(player?.clubId)
  // Los hooks van siempre (no pueden ir después de un return); con un
  // slug inexistente la lectura falla sin efecto sobre la vista.
  const controller = usePlayerMatches(slug)
  const { stats, loading: statsLoading } = usePlayerStats(slug)
  const [params, setParams] = useSearchParams()
  const tabIndex = Math.max(0, TABS.findIndex((t) => t.id === params.get('tab')))

  if (!player) {
    return (
      <NotFoundNotice
        title="Jugador no encontrado"
        description={
          <>
            No hay ningún jugador con el slug <Code fontSize="12px">{slug}</Code> en{' '}
            <Code fontSize="12px">src/data/players.js</Code>. Revisá la URL o sumá la entrada al archivo.
          </>
        }
        backTo="/jugadores"
        backLabel="Jugadores"
      />
    )
  }

  const status = playerStatus(player, club, controller.matches)
  const nextLabel = nextMatchLabel(controller.matches?.next, club)
  const year = currentYear(stats)
  const season = stats.seasons[year] || stats.season
  const prev = stats.seasons[year - 1]
  const hasStats = Boolean(player.apiPlayerId)
  const goTab = (id) => setParams(id === 'resumen' ? {} : { tab: id }, { replace: true })

  const kpis = [
    ['Partidos', season?.partidos, prev?.partidos, 0, (v) => v],
    ['Minutos', season?.minutos, prev?.minutos, 0, fmtInt],
    ['Goles', season?.goles, prev?.goles, 0, (v) => v],
    ['Asistencias', season?.asistencias, prev?.asistencias, 0, (v) => v],
    ['Rating', season?.rating, prev?.rating, 2, (v) => Number(v).toFixed(2)],
    ['Titular', season?.titular, prev?.titular, 0, (v) => v],
  ]

  const deleteDescription = (slotLabel) =>
    `Se va a borrar "${slotLabel}" de este jugador. La landing va a dejar de mostrarlo. Esta acción no se puede deshacer.`

  const seasonRows = Object.entries(stats.seasons).map(([y, s]) => ({ ...s, temporada: String(y) }))
  const exportSheets = [
    { sheet: `Partidos ${year}`, columns: MATCH_COLUMNS, rows: seasonMatches(stats, year).reverse() },
    { sheet: 'Temporadas', columns: [{ key: 'temporada', label: 'Temporada', kind: 'text' }, ...SEASON_COLUMNS, ...PER90_COLUMNS], rows: seasonRows },
  ]

  return (
    <Box>
      {/* Portada */}
      <Box
        px={{ base: 4, md: 6, lg: 10 }} pt={5} borderBottom="1px solid" borderColor="#2e2825"
        bgImage={`linear-gradient(90deg, rgba(13,12,11,.97) 0%, rgba(13,12,11,.86) 45%, rgba(13,12,11,.45) 100%), url(${heroTexture})`}
        bgSize="cover" bgPosition="center right"
      >
        <Flex maxW="1360px" mx="auto" direction="column" gap={5}>
          <Flex wrap="wrap" align="center" justify="space-between" gap={3}>
            <Button as={RouterLink} to={`/jugadores?j=${player.slug}`} variant="link" leftIcon={<FiArrowLeft />} color="brand.orange"
              fontFamily="mono" fontSize="14px" letterSpacing="0.14em" textTransform="uppercase" minH="44px" fontWeight="normal">
              Jugadores
            </Button>
            <Flex align="center" gap={2}>
              <Text as="label" htmlFor="otro-jugador" fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray">
                Ver otro jugador
              </Text>
              <Select id="otro-jugador" {...inputStyle} h="40px" w={{ base: '190px', md: '230px' }} value={player.slug}
                onChange={(e) => navigate(`/jugador/${e.target.value}${params.get('tab') ? `?tab=${params.get('tab')}` : ''}`)}>
                {[...players].sort((a, b) => a.name.localeCompare(b.name, 'es')).map((p) => (
                  <option key={p.slug} value={p.slug} style={{ background: '#1E1B19' }}>{p.name}</option>
                ))}
              </Select>
            </Flex>
          </Flex>

          <Flex wrap="wrap" gap={{ base: 5, md: 7 }} align="flex-end">
            <MotionBox
              key={player.slug} flexShrink={0}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            >
              {player.photo ? (
                <Image src={player.photo} alt={player.name} w={{ base: '150px', md: '220px' }} h={{ base: '185px', md: '270px' }}
                  borderRadius="16px 16px 0 0" objectFit="cover" objectPosition="top" bg="#2a2420" />
              ) : (
                <Flex w={{ base: '150px', md: '220px' }} h={{ base: '185px', md: '270px' }} borderRadius="16px 16px 0 0" bg="brand.brownLight"
                  align="center" justify="center" fontFamily="heading" fontSize="6xl" color="brand.amber">{playerInitials(player.name)}</Flex>
              )}
            </MotionBox>
            <Flex direction="column" gap={3} flex="1 1 420px" minW={0} pb={{ base: 5, md: 7 }}>
              <Flex align="center" gap={2.5}>
                {club && <ClubCrest club={club} size="34px" fontSize="9px" />}
                <Text fontFamily="mono" fontSize="13px" letterSpacing="0.18em" textTransform="uppercase" color="brand.orange">
                  {[club?.name || 'Sin club', club?.competition, club?.country].filter(Boolean).join(' · ')}
                </Text>
              </Flex>
              <Text as="h1" fontFamily="heading" fontSize={{ base: '54px', md: '96px' }} lineHeight={0.86} letterSpacing="0.01em">{player.name}</Text>
              <Flex wrap="wrap" align="center" gap={2.5}>
                <Flex align="center" gap={2} px={3.5} py={1.5} borderRadius="full" bg="rgba(13,12,11,.75)" border="1px solid" borderColor="#2e2825"
                  fontSize="14px" color="brand.amber">
                  <Box boxSize="8px" borderRadius="full" bg={STATUS_COLORS[status.id]} flexShrink={0} />{status.reason}
                </Flex>
                {nextLabel && <Text fontSize="14px" color="brand.gray">Próximo: {nextLabel}</Text>}
              </Flex>
              <Flex wrap="wrap" gap={2.5} mt={1}>
                <Button {...btn} leftIcon={<FiEdit3 />} bg="brand.orange" color="brand.brown" _hover={{ bg: '#ffb35e' }} onClick={() => goTab('carga')}>
                  Cargar resultado
                </Button>
                {club && (
                  <Button {...btn} leftIcon={<FiShield />} variant="outline" borderColor="brand.brownDark" color="brand.amber"
                    _hover={{ bg: 'brand.brownLight', color: 'white' }} onClick={() => navigate(`/club/${club.id}`)}>
                    Cargar para todo el club
                  </Button>
                )}
                {hasStats && (
                  <Button {...btn} leftIcon={<FiBarChart2 />} variant="outline" borderColor="brand.brownDark" color="brand.amber"
                    _hover={{ bg: 'brand.brownLight', color: 'white' }} onClick={() => navigate(`/estadisticas?club=${player.clubId || ''}`)}>
                    Comparar
                  </Button>
                )}
                <PlayerLinks player={player} btn={btn} />
                {hasStats && <Box alignSelf="center"><ExportMenu name={exportFileName(player.slug, year)} sheets={exportSheets} isDisabled={statsLoading} /></Box>}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Box>

      {/* Temporada en curso vs. la anterior */}
      {hasStats && season && (
        <Box bg="#151312" borderBottom="1px solid" borderColor="#2e2825" px={{ base: 4, md: 6, lg: 10 }} py={4}>
          <Flex maxW="1360px" mx="auto" wrap="wrap" align="center" rowGap={3}>
            <Flex direction="column" pr={7} mr={5} borderRight="1px solid" borderColor="#2e2825">
              <Text fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray">Temporada</Text>
              <Text fontFamily="heading" fontSize="44px" lineHeight={1} color="brand.orange">{year}</Text>
            </Flex>
            {kpis.map(([k, v, o, dec, fmt]) => {
              const d = deltaVs(v, o, year - 1, dec)
              return (
                <Flex key={k} direction="column" gap={0.5} pr={5} py={1} flex="1 1 120px" minW="110px">
                  <Text fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray">{k}</Text>
                  <Text fontFamily="heading" fontSize="44px" lineHeight={1}>{dash(v, fmt)}</Text>
                  <Text fontSize="13px" color={d?.color || '#8c7f70'}>{d ? d.text : `Sin dato de ${year - 1}`}</Text>
                </Flex>
              )
            })}
          </Flex>
        </Box>
      )}

      <Box px={{ base: 4, md: 6, lg: 10 }} pb={14}>
        <Box maxW="1360px" mx="auto">
          <Tabs index={tabIndex} onChange={(i) => goTab(TABS[i].id)} variant="unstyled" isLazy>
            <Box overflowX="auto" mb={6} borderBottom="1px solid" borderColor="#2e2825">
              <TabList gap={{ base: 5, md: 7 }}>
                {TABS.map((t) => <Tab key={t.id} {...tabStyle}>{t.label}</Tab>)}
              </TabList>
            </Box>
            <TabPanels>
              <TabPanel p={0}>
                {!hasStats ? <NoStats player={player} onSync={() => navigate('/sincronizacion')} /> : statsLoading ? (
                  <Flex justify="center" py={12}><Spinner color="brand.amber" /></Flex>
                ) : (
                  <Flex direction="column" gap={5}>
                    <Flex wrap="wrap" gap={5}>
                      <Card title="Rating partido a partido" flex="999 1 560px">
                        <RatingChart matches={seasonMatches(stats, year)} />
                      </Card>
                      <Box flex="1 1 340px" minW={0} display="flex"><LastMatchPanel match={stats.last} /></Box>
                    </Flex>
                    <StatAreas season={season} />
                    <CompetitionList season={season} />
                  </Flex>
                )}
              </TabPanel>
              <TabPanel p={0}>
                {!hasStats ? <NoStats player={player} onSync={() => navigate('/sincronizacion')} /> : statsLoading ? (
                  <Flex justify="center" py={12}><Spinner color="brand.amber" /></Flex>
                ) : <MatchLog key={slug} player={player} stats={stats} />}
              </TabPanel>
              <TabPanel p={0}>
                {!hasStats ? <NoStats player={player} onSync={() => navigate('/sincronizacion')} /> : statsLoading ? (
                  <Flex justify="center" py={12}><Spinner color="brand.amber" /></Flex>
                ) : (
                  <Flex direction="column" gap={5}>
                    <SeasonBars seasons={stats.seasons} current={year} />
                    <PlayerSeasons player={player} stats={stats} />
                  </Flex>
                )}
              </TabPanel>
              <TabPanel p={0}>
                <Box maxW="900px">
                  {/* key={slug}: al saltar de un jugador a otro remonta el editor
                      entero, así no quedan formularios con estado viejo. */}
                  <MatchEditor key={slug} controller={controller} deleteDescription={deleteDescription} />
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>
    </Box>
  )
}
