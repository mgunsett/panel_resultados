import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box, Flex, HStack, Text, Select, SimpleGrid, Spinner,
} from '@chakra-ui/react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { players } from '../data/players'
import { useHomeData } from '../hooks/usePlayerStats'
import { useSyncAll } from '../lib/syncContext'
import {
  matchDate, formatDay, formatTime, opponentLabel, playerStatus, weekMatches, lastApiUpdate, relativeTime,
} from '../lib/homeData'
import WeekAgenda from '../components/home/WeekAgenda'
import SeasonRanking from '../components/home/SeasonRanking'
import ShowcaseCard from '../components/home/ShowcaseCard'
import QuickProfile from '../components/home/QuickProfile'
import PlayerSearch, { matchesQuery } from '../components/home/PlayerSearch'
import heroTexture from '../assets/fondo_led3.webp'

const MotionBox = motion(Box)

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'ok', label: 'Al día' },
  { id: 'rev', label: 'Para revisar' },
]


// ─── HOME: VITRINA DE JUGADORES ──────────────────────────────────
// Portada con buscador, la semana de partidos, el ranking de la
// temporada, la ficha rápida del jugador elegido y la grilla de todos.
// Todo sale de Firestore (matches + stats de cada jugador): no gasta
// consultas a la API.
export default function HomePage() {
  const reduceMotion = useReducedMotion()
  const { lastRunAt } = useSyncAll()
  const { rows: raw, loading } = useHomeData(lastRunAt?.getTime())
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('todos')
  const [sort, setSort] = useState('next')
  const [picked, setPicked] = useState(null)
  const profileRef = useRef(null)

  const rows = useMemo(() => raw.map((r) => {
    const next = r.matches?.next
    const nextDate = matchDate(next)
    const nextLabel = next?.home_team
      ? `${nextDate ? `${formatDay(nextDate)}${next.match_time || next.match_datetime ? ` ${next.match_time || formatTime(nextDate)}` : ''} · ` : next.match_date ? `${next.match_date} · ` : ''}${opponentLabel(next, r.club)}`
      : ''
    return { ...r, status: playerStatus(r.player, r.club, r.matches), nextDate, nextLabel }
  }), [raw])

  const week = useMemo(() => weekMatches(rows), [rows])
  const updated = useMemo(() => lastApiUpdate(rows), [rows])

  const cards = useMemo(() => {
    let list = rows.filter((r) => matchesQuery(r, q))
    if (filter !== 'todos') list = list.filter((r) => r.status.id === filter)
    const by = {
      next: (a, b) => (a.nextDate?.getTime() ?? Infinity) - (b.nextDate?.getTime() ?? Infinity),
      rating: (a, b) => (b.stats.season?.rating ?? -1) - (a.stats.season?.rating ?? -1),
      goles: (a, b) => (b.stats.season?.goles ?? -1) - (a.stats.season?.goles ?? -1),
      name: (a, b) => a.player.name.localeCompare(b.player.name, 'es'),
    }
    return [...list].sort(by[sort])
  }, [rows, q, filter, sort])

  const pickedRow = rows.find((r) => r.player.slug === picked)

  // Al elegir un jugador, la ficha rápida queda a la vista.
  useEffect(() => {
    if (picked && profileRef.current) {
      profileRef.current.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    }
  }, [picked, reduceMotion])

  return (
    <Box>
      <Box
        as="header" px={{ base: 4, md: 8, lg: 12 }} pt={{ base: 8, md: 12 }} pb={{ base: 8, md: 10 }}
        borderBottom="1px solid" borderColor="#2e2825"
        bgImage={`linear-gradient(90deg, rgba(13,12,11,.96) 0%, rgba(13,12,11,.82) 45%, rgba(13,12,11,.35) 100%), url(${heroTexture})`}
        bgSize="cover" bgPosition="center right"
      >
        <MotionBox
          maxW="720px" display="flex" flexDirection="column" gap={3.5}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <Text fontFamily="mono" fontSize="13px" letterSpacing="0.22em" textTransform="uppercase" color="brand.orange">
            Panel de administración de landings
          </Text>
          <Text as="h1" fontFamily="heading" fontSize={{ base: '48px', md: '72px', lg: '84px' }} lineHeight={0.9} letterSpacing="0.01em">
            {players.length} jugadores.
          </Text>
          {updated && (
            <Text fontSize="14px" color="brand.amber">Datos de API-Football actualizados {relativeTime(updated)}</Text>
          )}
          <PlayerSearch rows={rows} value={q} onChange={setQ} onPick={setPicked} />
        </MotionBox>
      </Box>

      <Box px={{ base: 4, md: 8, lg: 12 }} pt={7} pb={14}>
        <Flex maxW="1300px" mx="auto" direction="column" gap={8}>
          {loading ? (
            <Flex justify="center" py={16}><Spinner color="brand.amber" size="lg" /></Flex>
          ) : (
            <>
              <Flex wrap="wrap" gap={6} align="flex-start">
                <WeekAgenda week={week} />
                <SeasonRanking rows={rows} selected={picked} onSelect={setPicked} />
              </Flex>

              <AnimatePresence mode="wait">
                {pickedRow && (
                  <QuickProfile key={picked} ref={profileRef} row={pickedRow} onClose={() => setPicked(null)} />
                )}
              </AnimatePresence>

              <Box as="section" aria-label="Jugadores">
                <Flex wrap="wrap" align="center" justify="space-between" gap={3} mb={3.5}>
                  <Text as="h2" fontFamily="heading" fontSize="32px" letterSpacing="0.02em" lineHeight={1}>
                    Jugadores <Text as="span" color="brand.gray" fontSize="22px">{cards.length}</Text>
                  </Text>
                  <HStack spacing={1.5} wrap="wrap">
                    {FILTERS.map((f) => {
                      const on = f.id === filter
                      return (
                        <Box key={f.id} as="button" type="button" onClick={() => setFilter(f.id)} aria-pressed={on}
                          px={3.5} minH="36px" borderRadius="full" border="1px solid"
                          borderColor={on ? 'brand.amber' : 'brand.brownDark'} bg={on ? 'brand.amber' : 'transparent'}
                          color={on ? 'brand.brown' : 'brand.gray'} _hover={{ color: on ? 'brand.brown' : 'white', borderColor: on ? 'brand.amber' : 'brand.gray' }}
                          fontFamily="mono" fontSize="13px" letterSpacing="0.1em" textTransform="uppercase">
                          {f.label}
                        </Box>
                      )
                    })}
                    <HStack as="label" spacing={2} ml={2} fontFamily="mono" fontSize="13px" letterSpacing="0.1em" textTransform="uppercase" color="brand.gray">
                      <span>Ordenar</span>
                      <Select size="sm" h="36px" w="170px" value={sort} onChange={(e) => setSort(e.target.value)}
                        bg="#151312" borderColor="brand.brownDark" borderRadius="8px" color="white" fontFamily="mono" fontSize="14px">
                        <option value="next" style={{ background: '#1E1B19' }}>Próximo partido</option>
                        <option value="rating" style={{ background: '#1E1B19' }}>Rating</option>
                        <option value="goles" style={{ background: '#1E1B19' }}>Goles</option>
                        <option value="name" style={{ background: '#1E1B19' }}>Nombre</option>
                      </Select>
                    </HStack>
                  </HStack>
                </Flex>

                {cards.length === 0 ? (
                  <Box p={6} borderRadius="14px" border="1px dashed" borderColor="brand.brownDark" color="brand.gray" textAlign="center">
                    Nadie coincide con esa búsqueda.
                  </Box>
                ) : (
                  <SimpleGrid templateColumns={{ base: "repeat(2, minmax(0, 1fr))", md: "repeat(auto-fill, minmax(210px, 1fr))" }} spacing={{ base: 2.5, md: 3.5 }}>
                    {cards.map((r, i) => (
                      <ShowcaseCard key={r.player.slug} row={r} index={i} selected={picked === r.player.slug}
                        onSelect={(slug) => setPicked(slug === picked ? null : slug)} />
                    ))}
                  </SimpleGrid>
                )}
              </Box>
            </>
          )}
        </Flex>
      </Box>
    </Box>
  )
}
