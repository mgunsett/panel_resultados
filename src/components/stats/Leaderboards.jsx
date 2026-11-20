import { useState } from 'react'
import { Box, Flex, Image, SimpleGrid, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { playerInitials } from '../../data/players'
import { fmtInt } from '../../lib/profileData'
import { leaderMetrics, leaderboard } from '../../lib/statsBoard'

const BLACK_CARD = {
  bg: '#050404', border: '1px solid', borderColor: 'rgba(249,160,63,.3)', borderRadius: '16px',
  boxShadow: 'inset 0 3px 0 #F9A03F', _hover: { borderColor: 'rgba(249,160,63,.55)' },
}

const fmt = (v, kind) => (kind === 'rating' ? v.toFixed(2) : fmtInt(Math.round(v)))

function Photo({ row, size, radius }) {
  return row.photo ? (
    <Image src={row.photo} alt="" boxSize={size} borderRadius={radius} objectFit="cover" objectPosition="top" bg="#2a2420" flexShrink={0} />
  ) : (
    <Flex boxSize={size} borderRadius={radius} bg="brand.brownLight" align="center" justify="center" fontFamily="heading" color="brand.amber" flexShrink={0}>
      {playerInitials(row.jugador)}
    </Flex>
  )
}

function Board({ metric, p90, rows }) {
  const [open, setOpen] = useState(false)
  const list = leaderboard(rows, metric, p90)
  const top = list[0]
  // El rating arranca en 6 para que las barras muestren diferencias.
  const floor = metric.key === 'rating' ? 6 : 0
  const max = top ? top.value : 1
  const rest = list.slice(1, open ? list.length : 5)

  return (
    <Flex as="article" direction="column" gap={2.5} p={5} minW={0} {...BLACK_CARD}>
      <Flex align="baseline" justify="space-between" gap={2}>
        <Text as="h3" fontFamily="heading" fontSize="28px" lineHeight={1}>{metric.title}</Text>
        <Text fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase" color="brand.orange">{metric.unit}</Text>
      </Flex>

      {!top ? (
        <Text fontSize="14px" color="brand.gray" py={4}>Sin datos para este filtro.</Text>
      ) : (
        <>
          <Flex
            as={RouterLink} to={`/jugador/${top.row.slug}`} align="center" gap={3.5} p={3} borderRadius="12px"
            bg="linear-gradient(90deg, rgba(249,160,63,.18), rgba(249,160,63,.02))" border="1px solid" borderColor="rgba(249,160,63,.35)"
            _hover={{ borderColor: 'brand.orange' }} _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange' }}
          >
            <Photo row={top.row} size="64px" radius="12px" />
            <Box flex={1} minW={0}>
              <Text fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase" color="brand.orange" noOfLines={1}>1° · {top.row.club}</Text>
              <Text fontSize="18px" fontWeight="600" noOfLines={1}>{top.row.jugador}</Text>
            </Box>
            <Text fontFamily="heading" fontSize="52px" lineHeight={1} color="brand.orange" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(top.value, metric.kind)}</Text>
          </Flex>

          <Box as="ol" listStyleType="none">
            {rest.map((x, i) => (
              <Box as="li" key={x.row.slug}>
                <Flex
                  as={RouterLink} to={`/jugador/${x.row.slug}`} align="center" gap={2.5} px={1} py={1.5} minH="44px" borderRadius="8px"
                  _hover={{ bg: '#17120e' }} _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange' }}
                >
                  <Text w="18px" textAlign="center" fontFamily="mono" fontSize="15px" color="#8c7f70" flexShrink={0}>{i + 2}</Text>
                  <Photo row={x.row} size="30px" radius="7px" />
                  <Flex flex={1} minW={0} direction="column" gap={1}>
                    <Flex align="baseline" gap={1.5} minW={0}>
                      <Text fontSize="14px" noOfLines={1}>{x.row.jugador}</Text>
                      <Text fontSize="12px" color="#8c7f70" whiteSpace="nowrap" display={{ base: 'none', sm: 'block' }}>{x.row.club}</Text>
                    </Flex>
                    <Box h="5px" borderRadius="3px" bg="#1c1712" overflow="hidden">
                      <Box h="100%" borderRadius="3px" bg="brand.orange" opacity={0.75}
                        w={`${Math.max(3, Math.round(((x.value - floor) / Math.max(0.01, max - floor)) * 100))}%`} />
                    </Box>
                  </Flex>
                  <Text w="52px" textAlign="right" fontSize="16px" fontWeight="600" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(x.value, metric.kind)}</Text>
                </Flex>
              </Box>
            ))}
          </Box>

          {list.length > 5 ? (
            <Box
              as="button" type="button" alignSelf="flex-start" minH="36px" px={1} color="brand.orange" fontFamily="mono" fontSize="14px"
              letterSpacing="0.1em" textTransform="uppercase" _hover={{ textDecoration: 'underline', color: '#ffbd6e' }}
              aria-expanded={open} onClick={() => setOpen(!open)}
            >
              {open ? 'Ver solo el top 5' : `Ver los ${list.length}`}
            </Box>
          ) : (
            <Text fontSize="13px" color="#8c7f70">{list.length} {list.length === 1 ? 'jugador' : 'jugadores'} en el filtro</Text>
          )}
        </>
      )}
    </Flex>
  )
}

// ─── LÍDERES POR RUBRO ───────────────────────────────────────────
// Seis rankings con el primero destacado. Cada fila abre la ficha.
export default function Leaderboards({ rows, p90 }) {
  return (
    <SimpleGrid minChildWidth={{ base: '260px', md: '360px' }} spacing={4}>
      {leaderMetrics(p90).map((m) => <Board key={`${m.key}-${p90}`} metric={m} p90={p90} rows={rows} />)}
    </SimpleGrid>
  )
}

export { BLACK_CARD }
