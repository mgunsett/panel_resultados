import { useMemo, useState } from 'react'
import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { MATCH_COLUMNS, cellValue } from '../../lib/statsSchema'
import { availableSeasons } from '../../lib/playerStats'
import { exportFileName } from '../../lib/exporters'
import { RESULT, dash, num, resultOf, rivalLabel, seasonMatches, shortDate } from '../../lib/profileData'
import ExportMenu from '../stats/ExportMenu'
import SeasonSelect from '../stats/SeasonSelect'
import { Card } from './ProfileCards'

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'jugo', label: 'Jugó' },
  { id: 'tit', label: 'Titular' },
]

const GRID = '70px minmax(160px,1.6fr) 74px 60px 64px 40px 40px 56px 70px 28px'
const pctPases = MATCH_COLUMNS.find((c) => c.key === 'precisionPases')
const pctDuelos = MATCH_COLUMNS.find((c) => c.key === 'duelosPct')

const chip = (on) => ({
  size: 'sm', h: '36px', px: 3.5, borderRadius: 'full', variant: 'unstyled', display: 'inline-flex',
  fontFamily: 'mono', fontSize: '13px', fontWeight: 'normal', letterSpacing: '0.1em', textTransform: 'uppercase',
  border: '1px solid', borderColor: on ? 'brand.amber' : 'brand.brownDark',
  bg: on ? 'brand.amber' : 'transparent', color: on ? 'brand.brown' : 'brand.gray',
  _hover: { color: on ? 'brand.brown' : 'white', borderColor: on ? 'brand.amber' : 'brand.gray' },
})

const Head = ({ children, right }) => (
  <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray" textAlign={right ? 'right' : 'left'}>
    {children}
  </Text>
)

function Detail({ m }) {
  if (m.sinDatos) return <Text fontSize="14px" color="brand.gray">API-Football no publicó estadísticas por jugador para este partido.</Text>
  if (!m.jugo) return <Text fontSize="14px" color="brand.gray">No sumó minutos en este partido.</Text>
  const pp = cellValue(m, pctPases)
  const pd = cellValue(m, pctDuelos)
  const tiles = [
    ['Condición', m.condicion === 'V' ? 'Visitante' : 'Local'], ['Titular', m.titular === '1' ? 'Sí' : 'No'], ['Posición', dash(m.posicion)],
    ['Minutos', dash(m.minutos)], ['Rating', num(m.rating) !== null ? Number(m.rating).toFixed(1) : '—'],
    ['Goles', dash(m.goles)], ['Asistencias', dash(m.asistencias)], ['Tiros', dash(m.tiros)], ['Al arco', dash(m.tirosArco)],
    ['Pases', dash(m.pases)], ['Pases clave', dash(m.pasesClave)], ['% pases', pp === null ? '—' : `${pp}%`],
    ['Quites', dash(m.quites)], ['Intercep.', dash(m.intercepciones)], ['% duelos', pd === null ? '—' : `${pd}%`],
    ['Regates', dash(m.regates)], ['Amarillas', dash(m.amarillas)], ['Rojas', dash(m.rojas)],
  ]
  return (
    <Flex wrap="wrap" gap={2}>
      {tiles.map(([k, v]) => (
        <Box key={k} px={3} py={2} borderRadius="10px" bg="#151312" minW="96px">
          <Text fontFamily="mono" fontSize="11px" letterSpacing="0.14em" textTransform="uppercase" color="brand.gray">{k}</Text>
          <Text fontFamily="heading" fontSize="24px" lineHeight={1.1}>{v}</Text>
        </Box>
      ))}
    </Flex>
  )
}

// ─── PARTIDOS DE LA TEMPORADA ────────────────────────────────────
// Todos los partidos del club en el año, del más nuevo al más viejo.
// Cada fila se abre con la ficha completa de ese partido.
export default function MatchLog({ player, stats }) {
  const seasons = availableSeasons(stats)
  const [season, setSeason] = useState(seasons[0] ?? new Date().getFullYear())
  const [filter, setFilter] = useState('todos')
  const [open, setOpen] = useState(null)
  const all = useMemo(() => seasonMatches(stats, season).reverse(), [stats, season])
  const list = all.filter((m) => (filter === 'jugo' ? m.jugo : filter === 'tit' ? m.jugo && m.titular === '1' : true))
  const played = all.filter((m) => m.jugo)

  return (
    <Card
      title={`Partidos ${season}`}
      right={(
        <HStack>
          {seasons.length > 1 && <SeasonSelect seasons={seasons} value={season} onChange={(y) => { setSeason(y); setOpen(null) }} />}
          <ExportMenu name={exportFileName(player.slug, 'partidos', season)} sheets={[{ sheet: `Partidos ${season}`, columns: MATCH_COLUMNS, rows: all }]} />
        </HStack>
      )}
    >
      <Flex wrap="wrap" align="center" gap={2}>
        {FILTERS.map((f) => (
          <Button key={f.id} {...chip(filter === f.id)} aria-pressed={filter === f.id} onClick={() => { setFilter(f.id); setOpen(null) }}>{f.label}</Button>
        ))}
        <Box flex={1} />
        <Text fontSize="14px" color="brand.gray">{all.length} partidos del club · jugó {played.length}</Text>
      </Flex>

      {all.length === 0 ? (
        <Text fontSize="15px" color="brand.gray">
          Todavía no hay partidos guardados de {season}. Los nuevos se suman solos; para los anteriores usá «Completar historial» en Sincronización.
        </Text>
      ) : (
        <Box mx={-5} overflowX="auto" borderTop="1px solid" borderColor="#2e2825">
          <Box minW="780px">
            <Box display="grid" gridTemplateColumns={GRID} columnGap={2.5} px={5} py={2.5} bg="#151312" borderBottom="1px solid" borderColor="#2e2825">
              <Head>Fecha</Head><Head>Rival</Head><Head>Res.</Head><Head right>Min</Head><Head right>Rating</Head>
              <Head right>G</Head><Head right>A</Head><Head right>Tiros</Head><Head right>% pases</Head><span />
            </Box>
            {list.map((m) => {
              const key = m.fixtureId || m.fecha
              const isOpen = open === key
              const res = resultOf(m)
              const tone = RESULT[res] || RESULT.E
              const rating = num(m.rating)
              const pp = cellValue(m, pctPases)
              const off = !m.jugo
              return (
                <Box key={key}>
                  <Box
                    as="button" type="button" w="100%" textAlign="left" display="grid" gridTemplateColumns={GRID} columnGap={2.5}
                    alignItems="center" px={5} py={2.5} minH="50px" borderBottom="1px solid" borderColor="#2e2825"
                    bg={isOpen ? '#221e1b' : 'transparent'} _hover={{ bg: '#221e1b' }} color={off ? '#8c7f70' : 'white'}
                    aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : key)}
                    sx={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    <Text fontSize="14px" color="brand.gray">{shortDate(m.fecha)}</Text>
                    <Box minW={0}>
                      <Text fontSize="15px" noOfLines={1}>{rivalLabel(m)}</Text>
                      <Text fontSize="12px" color="#8c7f70" noOfLines={1}>{m.competicion}</Text>
                    </Box>
                    <Flex align="center" gap={1.5}>
                      {res && (
                        <Flex boxSize="22px" borderRadius="6px" align="center" justify="center" bg={tone.bg} color={tone.color}
                          fontFamily="mono" fontWeight="700" fontSize="13px">{res}</Flex>
                      )}
                      <Text fontSize="14px">{num(m.gf) !== null ? `${m.gf}-${m.gc}` : '—'}</Text>
                    </Flex>
                    <Text textAlign="right" fontSize="15px">{m.jugo ? `${m.minutos}'` : m.sinDatos ? 'S/D' : 'No jugó'}</Text>
                    <Text textAlign="right" fontSize="15px" fontWeight="600" color={rating !== null && rating >= 7.5 ? 'brand.orange' : undefined}>
                      {rating !== null ? rating.toFixed(1) : '—'}
                    </Text>
                    <Text textAlign="right" fontSize="15px">{m.jugo ? dash(m.goles) : '—'}</Text>
                    <Text textAlign="right" fontSize="15px">{m.jugo ? dash(m.asistencias) : '—'}</Text>
                    <Text textAlign="right" fontSize="15px">{m.jugo ? dash(m.tiros) : '—'}</Text>
                    <Text textAlign="right" fontSize="15px">{pp === null ? '—' : `${pp}%`}</Text>
                    <Box color="brand.gray" justifySelf="center">{isOpen ? <FiChevronUp /> : <FiChevronDown />}</Box>
                  </Box>
                  {isOpen && (
                    <Box px={5} py={3.5} bg="#221e1b" borderBottom="1px solid" borderColor="#2e2825"><Detail m={m} /></Box>
                  )}
                </Box>
              )
            })}
          </Box>
        </Box>
      )}
      {all.length > 0 && (
        <Text fontSize="13px" color="#8c7f70">Incluye todos los partidos del club en la temporada. Tocá una fila para ver la ficha completa del partido.</Text>
      )}
    </Card>
  )
}
