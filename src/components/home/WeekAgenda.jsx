import { useEffect, useState } from 'react'
import { Box, Flex, HStack, Text, SimpleGrid, Avatar, AvatarGroup } from '@chakra-ui/react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { DAY_SHORT, MATCH_BADGES, formatDay, formatTime, scoreline } from '../../lib/homeData'
import ClubCrest from '../clubs/ClubCrest'

const MotionBox = motion(Box)

// ─── ESTA SEMANA ─────────────────────────────────────────────────
// Tira de lunes a domingo; al tocar un día se ven sus partidos. Arranca
// en hoy si hay partido, si no en el próximo día con partidos.
export default function WeekAgenda({ week }) {
  const reduceMotion = useReducedMotion()
  const today = new Date()
  const todayIdx = week.findIndex((w) => w.day.toDateString() === today.toDateString())
  const firstWithMatches = week.findIndex((w, i) => i >= todayIdx && w.matches.length)
  const [selected, setSelected] = useState(firstWithMatches >= 0 ? firstWithMatches : Math.max(todayIdx, 0))

  // Cuando llegan los datos (o cambian tras sincronizar) recalcula el día inicial.
  useEffect(() => {
    if (firstWithMatches >= 0) setSelected(firstWithMatches)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week.length && week.map((w) => w.matches.length).join(',')])

  const total = week.reduce((a, w) => a + w.matches.length, 0)
  const played = week.reduce((a, w) => a + w.matches.filter((m) => m.status === 'jugado' || m.status === 'bloq').length, 0)
  const toLoad = week.reduce((a, w) => a + w.matches.filter((m) => m.status === 'manual').length, 0)
  const current = week[selected]?.matches || []

  return (
    <Box as="section" aria-label="Esta semana" flex="999 1 600px" minW={0}>
      <Flex wrap="wrap" align="baseline" justify="space-between" gap={2} mb={3.5}>
        <Text as="h2" fontFamily="heading" fontSize="32px" letterSpacing="0.02em" lineHeight={1}>Esta semana</Text>
        <Text fontSize="14px" color="brand.gray">
          {total} {total === 1 ? 'partido' : 'partidos'} · {played} jugados{toLoad ? ` · ${toLoad} para cargar a mano` : ''}
        </Text>
      </Flex>

      <HStack spacing={2} overflowX="auto" pb={1} mb={3.5}>
        {week.map((w, i) => {
          const on = i === selected
          const isToday = i === todayIdx
          return (
            <Flex
              key={w.day.toISOString()} as="button" type="button" onClick={() => setSelected(i)}
              direction="column" align="center" gap="2px" minW="74px" px={2} py={2.5} borderRadius="12px"
              border="1px solid" borderColor={on ? 'brand.amber' : isToday ? 'brand.orange' : '#2e2825'}
              bg={on ? 'brand.amber' : '#151312'} color={on ? 'brand.brown' : 'brand.gray'}
              transition="all .18s" _hover={{ borderColor: on ? 'brand.amber' : 'brand.gray', color: on ? 'brand.brown' : 'white' }}
              aria-pressed={on}
            >
              <Text fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase">
                {isToday ? 'Hoy' : DAY_SHORT[w.day.getDay()]}
              </Text>
              <Text fontFamily="heading" fontSize="30px" lineHeight={1}>{w.day.getDate()}</Text>
              <Text fontSize="11px">{w.matches.length ? `${w.matches.length} ${w.matches.length === 1 ? 'partido' : 'partidos'}` : 'libre'}</Text>
            </Flex>
          )
        })}
      </HStack>

      <AnimatePresence mode="wait" initial={false}>
        <MotionBox
          key={selected}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {current.length === 0 ? (
            <Box p={5} borderRadius="14px" border="1px dashed" borderColor="brand.brownDark" color="brand.gray" fontSize="14px">
              Ningún jugador juega este día.
            </Box>
          ) : (
            <SimpleGrid minChildWidth="280px" spacing={3}>
              {current.map((m) => {
                const badge = MATCH_BADGES[m.status]
                return (
                  <Flex key={m.key} direction="column" gap={3} p={4} borderRadius="14px" bg="brand.dark2" border="1px solid" borderColor="#2e2825">
                    <Flex align="center" justify="space-between" gap={2}>
                      <Text fontFamily="mono" fontSize="13px" letterSpacing="0.12em" textTransform="uppercase" color="brand.gray" noOfLines={1}>
                        {m.match.competition || m.club?.competition || '—'}
                      </Text>
                      <Box px={2.5} py={1} borderRadius="full" bg={badge.bg} color={badge.color}
                        fontFamily="mono" fontSize="12px" letterSpacing="0.1em" textTransform="uppercase" whiteSpace="nowrap">
                        {badge.label}
                      </Box>
                    </Flex>
                    <Flex align="center" gap={3}>
                      {m.club && <ClubCrest club={m.club} size="44px" fontSize="xs" />}
                      <Box flex={1} minW={0}>
                        <Text fontFamily="heading" fontSize="26px" lineHeight={1} noOfLines={2}>{scoreline(m.match)}</Text>
                        <Text fontSize="13px" color="brand.gray">
                          {formatDay(m.date)}{m.match.match_time || m.match.match_datetime ? ` · ${m.match.match_time || formatTime(m.date)}` : ''}
                          {m.match.stadium ? ` · ${m.match.stadium}` : ''}
                        </Text>
                      </Box>
                    </Flex>
                    <Flex align="center" gap={2} borderTop="1px solid" borderColor="#2e2825" pt={2.5}>
                      <AvatarGroup size="sm" max={4} spacing="-8px">
                        {m.players.map((p) => (
                          <Avatar key={p.slug} name={p.name} src={p.photo} bg="brand.brownLight" color="brand.amber"
                            border="2px solid" borderColor="brand.dark2" sx={{ img: { objectPosition: 'top' } }} />
                        ))}
                      </AvatarGroup>
                      <Text fontSize="13px" color="brand.amber" noOfLines={1}>
                        {m.players.map((p) => p.name.split(' ').slice(-1)[0]).join(', ')}
                      </Text>
                    </Flex>
                  </Flex>
                )
              })}
            </SimpleGrid>
          )}
        </MotionBox>
      </AnimatePresence>
    </Box>
  )
}
