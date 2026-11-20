import { useMemo, useState } from 'react'
import { Box, Flex, HStack, Text, Image, Button } from '@chakra-ui/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { playerInitials } from '../../data/players'

const MotionBox = motion(Box)

const METRICS = [
  { id: 'goles', label: 'Goles', fmt: (v) => String(v), floor: 0 },
  { id: 'asistencias', label: 'Asistencias', fmt: (v) => String(v), floor: 0 },
  { id: 'rating', label: 'Rating', fmt: (v) => Number(v).toFixed(2), floor: 6 },
  { id: 'minutos', label: 'Minutos', fmt: (v) => Number(v).toLocaleString('es-AR'), floor: 0 },
  { id: 'partidos', label: 'Partidos', fmt: (v) => String(v), floor: 0 },
]

// ─── RANKING DE LA TEMPORADA ─────────────────────────────────────
// Top 5 por estadística, con los totales de stats/season. Tocar a un
// jugador abre su ficha rápida en el home.
export default function SeasonRanking({ rows, selected, onSelect }) {
  const [metricId, setMetricId] = useState('goles')
  const reduceMotion = useReducedMotion()
  const navigate = useNavigate()
  const metric = METRICS.find((m) => m.id === metricId)

  const season = useMemo(() => {
    const years = rows.map((r) => r.stats.season?.temporada).filter(Boolean)
    return years.length ? Math.max(...years) : new Date().getFullYear()
  }, [rows])

  const leaders = useMemo(() => {
    const list = rows
      .filter((r) => r.stats.season?.temporada === season && r.stats.season[metric.id] !== null && r.stats.season[metric.id] !== undefined)
      .map((r) => ({ ...r, value: Number(r.stats.season[metric.id]) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
    const top = list[0]?.value || 1
    return list.map((r) => ({
      ...r,
      pct: Math.max(6, Math.round(((r.value - metric.floor) / Math.max(top - metric.floor, 0.01)) * 100)),
    }))
  }, [rows, metric, season])

  return (
    <Box as="section" aria-label="Ranking de la temporada" flex="1 1 380px" minW={0} p={5} borderRadius="16px" bg="brand.dark2" border="1px solid" borderColor="#2e2825">
      <Flex wrap="wrap" align="center" justify="space-between" gap="6px 14px" mb={2}>
        <Text as="h2" fontFamily="heading" fontSize="30px" letterSpacing="0.02em" lineHeight={1}>Temporada {season}</Text>
        <HStack role="tablist" aria-label="Estadística del ranking" spacing={4} wrap="wrap">
          {METRICS.map((m) => {
            const on = m.id === metricId
            return (
              <Box key={m.id} as="button" type="button" role="tab" aria-selected={on} onClick={() => setMetricId(m.id)}
                py={2} borderBottom="2px solid" borderColor={on ? 'brand.orange' : 'transparent'}
                color={on ? 'white' : 'brand.gray'} _hover={{ color: 'white' }}
                fontFamily="mono" fontSize="14px" letterSpacing="0.12em" textTransform="uppercase">
                {m.label}
              </Box>
            )
          })}
        </HStack>
      </Flex>

      {leaders.length === 0 ? (
        <Text fontSize="sm" color="brand.gray" py={4}>Todavía no hay totales de la temporada. Se cargan solos con la sincronización.</Text>
      ) : (
        <Flex direction="column" gap="2px">
          {leaders.map((r, i) => (
            <Flex
              key={r.player.slug} as="button" type="button" onClick={() => onSelect(r.player.slug)}
              align="center" gap={3.5} px={2} py={2.5} borderRadius="10px" textAlign="left" w="100%"
              bg={selected === r.player.slug ? 'rgba(249,160,63,0.1)' : 'transparent'} _hover={{ bg: '#262120' }}
            >
              <Text w="20px" fontFamily="heading" fontSize="24px" color={i === 0 ? 'brand.orange' : 'brand.gray'}>{i + 1}</Text>
              {r.player.photo ? (
                <Image src={r.player.photo} alt="" boxSize="44px" borderRadius="10px" objectFit="cover" objectPosition="top" bg="#2a2420" flexShrink={0} />
              ) : (
                <Flex boxSize="44px" borderRadius="10px" bg="brand.brownLight" align="center" justify="center" fontFamily="heading" color="brand.amber">{playerInitials(r.player.name)}</Flex>
              )}
              <Flex direction="column" gap="7px" flex={1} minW={0}>
                <Flex justify="space-between" align="baseline" gap={2}>
                  <Text fontSize="15px" fontWeight="600" noOfLines={1}>
                    {r.player.name} <Text as="span" fontWeight="400" color="brand.gray">· {r.club?.name}</Text>
                  </Text>
                  <Text fontFamily="heading" fontSize="26px" lineHeight={1} color="brand.orange">{metric.fmt(r.value)}</Text>
                </Flex>
                <Box h="6px" borderRadius="3px" bg="#2e2825" overflow="hidden">
                  <MotionBox
                    key={`${metricId}-${r.player.slug}`}
                    h="100%" borderRadius="3px" bg="brand.orange"
                    initial={{ width: reduceMotion ? `${r.pct}%` : 0 }}
                    animate={{ width: `${r.pct}%` }}
                    transition={{ duration: 0.6, delay: reduceMotion ? 0 : i * 0.05, ease: 'easeOut' }}
                  />
                </Box>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}

      <Button variant="link" mt={3} ml={2} color="brand.orange" fontFamily="mono" fontSize="14px" letterSpacing="0.12em" textTransform="uppercase"
        onClick={() => navigate('/estadisticas')}>
        Comparar todos en Estadísticas →
      </Button>
    </Box>
  )
}
