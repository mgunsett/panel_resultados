import { useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { num, rivalLabel, shortDate } from '../../lib/profileData'

const Y0 = 5.5
const Y1 = 9.5
const clamp = (v) => Math.max(Y0, Math.min(Y1, v))
const yPct = (r) => ((Y1 - clamp(r)) / (Y1 - Y0)) * 100

// ─── RATING PARTIDO A PARTIDO ────────────────────────────────────
// Línea con los últimos `max` partidos jugados y el promedio de la
// temporada punteado. Cada punto se puede enfocar o pasar el mouse
// para ver el partido.
export default function RatingChart({ matches, max = 12 }) {
  const rated = matches.filter((m) => m.jugo && num(m.rating) !== null)
  const list = rated.slice(-max)
  const [hover, setHover] = useState(null)

  if (list.length < 2) {
    return <Text fontSize="15px" color="brand.gray">Hacen falta al menos 2 partidos con rating para armar el gráfico.</Text>
  }

  const avg = rated.reduce((a, m) => a + Number(m.rating), 0) / rated.length
  const xPct = (i) => 3 + (i * 94) / (list.length - 1)
  const points = list.map((m, i) => `${xPct(i)},${yPct(Number(m.rating))}`).join(' ')
  const hm = hover !== null ? list[hover] : null

  return (
    <Box>
      <Text fontSize="13px" color="brand.gray" mb={2}>
        Últimos {list.length} partidos jugados · la línea punteada es el promedio de la temporada ({avg.toFixed(2)})
      </Text>
      <Box position="relative" h="240px" ml="34px" mt={3} mb="30px" onMouseLeave={() => setHover(null)}>
        {[6, 7, 8, 9].map((v) => (
          <Box key={v} position="absolute" left={0} right={0} top={`${yPct(v)}%`} borderTop="1px solid" borderColor="#2e2825">
            <Text position="absolute" left="-34px" top="-9px" fontSize="12px" color="#8c7f70">{v.toFixed(1)}</Text>
          </Box>
        ))}
        <Box position="absolute" left={0} right={0} top={`${yPct(avg)}%`} borderTop="1px dashed" borderColor="#8F7B54" pointerEvents="none" />
        <Box as="svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" position="absolute" inset={0} w="100%" h="100%" overflow="visible">
          <polyline points={points} fill="none" stroke="#F9A03F" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </Box>
        {list.map((m, i) => (
          <Box key={m.fixtureId || i}>
            <Box
              as="button" type="button" position="absolute" left={`${xPct(i)}%`} top={`${yPct(Number(m.rating))}%`}
              w="26px" h="26px" ml="-13px" mt="-13px" display="flex" alignItems="center" justifyContent="center" bg="transparent"
              aria-label={`${shortDate(m.fecha)}, ${rivalLabel(m)}, rating ${Number(m.rating).toFixed(1)}`}
              onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
              _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', borderRadius: 'full' }}
            >
              <Box
                boxSize={hover === i ? '14px' : '10px'} borderRadius="full" bg={hover === i ? 'white' : 'brand.orange'}
                boxShadow={hover === i ? '0 0 0 3px #F9A03F' : '0 0 0 2px #1E1B19'} transition="all .12s"
              />
            </Box>
            <Text position="absolute" left={`${xPct(i)}%`} bottom="-26px" transform="translateX(-50%)" fontSize="11px" color="#8c7f70" whiteSpace="nowrap"
              display={{ base: i === list.length - 1 || (i % 3 === 0 && i < list.length - 2) ? 'block' : 'none', md: 'block' }}>
              {shortDate(m.fecha)}
            </Text>
          </Box>
        ))}
        {hm && (
          <Box
            position="absolute" left={`${Math.min(85, Math.max(15, xPct(hover)))}%`} top={`${yPct(Number(hm.rating))}%`}
            transform="translate(-50%, calc(-100% - 16px))" px={3} py={2.5} borderRadius="10px" bg="#0d0c0b"
            border="1px solid" borderColor="#423a35" boxShadow="0 10px 24px rgba(0,0,0,.5)" pointerEvents="none" whiteSpace="nowrap" zIndex={2}
          >
            <Text fontSize="12px" color="brand.gray">{shortDate(hm.fecha)} · {hm.competicion}</Text>
            <Text fontSize="15px" fontWeight="600">{rivalLabel(hm)} {hm.gf}-{hm.gc}</Text>
            <Flex gap={1} fontSize="13px" color="brand.amber">
              Rating <Text as="b" color="brand.orange">{Number(hm.rating).toFixed(1)}</Text> · {hm.minutos ?? '—'}' · {hm.goles ?? 0} G · {hm.asistencias ?? 0} A
            </Flex>
          </Box>
        )}
      </Box>
    </Box>
  )
}
