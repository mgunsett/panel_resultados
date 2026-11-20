import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react'
import { RESULT, num, recentForm, resultOf, rivalLabel, shortDate } from '../../lib/profileData'

const Pill = ({ children }) => (
  <Flex align="center" gap={1.5} px={3} py={1.5} borderRadius="full" bg="#151312" border="1px solid" borderColor="#2e2825"
    fontSize="14px" color="brand.amber" whiteSpace="nowrap">
    {children}
  </Flex>
)

// ─── FORMA RECIENTE ──────────────────────────────────────────────
// Los últimos 5 partidos del club, del más viejo al más reciente, con
// todo a la vista (sin tooltips): fecha, resultado, rival y rating.
export default function RecentForm({ stats, clubName }) {
  const list = recentForm(stats, 5)
  if (!list.length) return null

  const rated = list.filter((m) => num(m.rating) !== null)
  const avg = rated.length ? rated.reduce((a, m) => a + Number(m.rating), 0) / rated.length : null
  const count = (r) => list.filter((m) => resultOf(m) === r).length

  return (
    <Flex direction="column" gap={4} p={5} borderRadius="16px" bg="brand.dark2" border="1px solid" borderColor="#2e2825">
      <Flex wrap="wrap" align="flex-end" justify="space-between" gap={3}>
        <Box>
          <Text as="h2" fontFamily="heading" fontSize="28px" lineHeight={1}>Forma reciente</Text>
          <Text mt={1} fontSize="14px" color="brand.gray">
            Últimos {list.length} partidos de {clubName}, del más viejo al más reciente
          </Text>
        </Box>
        <Flex wrap="wrap" gap={2}>
          <Pill>
            <Text as="b" color={RESULT.G.color}>{count('G')} G</Text>·
            <Text as="b" color={RESULT.E.color}>{count('E')} E</Text>·
            <Text as="b" color={RESULT.P.color}>{count('P')} P</Text>
          </Pill>
          {avg !== null && <Pill>Rating medio <Text as="b" color="brand.orange">{avg.toFixed(1)}</Text></Pill>}
        </Flex>
      </Flex>

      <SimpleGrid minChildWidth="128px" spacing={2.5}>
        {list.map((m, i) => {
          const res = RESULT[resultOf(m)]
          const isLast = i === list.length - 1
          const rating = num(m.rating)
          return (
            <Flex
              key={m.fixtureId || `${m.fecha}-${i}`} direction="column" gap={2.5} p={3.5} borderRadius="12px" minW={0}
              bg={isLast ? 'linear-gradient(180deg, rgba(249,160,63,.08), #151312 60%)' : '#151312'}
              border="1px solid" borderColor={isLast ? 'rgba(249,160,63,.6)' : '#2e2825'}
            >
              <Flex align="center" justify="space-between" gap={1.5}>
                <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray">{shortDate(m.fecha)}</Text>
                {isLast && <Text fontFamily="mono" fontSize="11px" letterSpacing="0.12em" textTransform="uppercase" color="brand.orange">Último</Text>}
              </Flex>
              <Flex align="center" gap={2}>
                <Flex boxSize="34px" borderRadius="9px" align="center" justify="center" bg={res.bg} color={res.color}
                  fontFamily="mono" fontWeight="700" fontSize="18px" flexShrink={0}>
                  {resultOf(m)}
                </Flex>
                <Box>
                  <Text fontFamily="heading" fontSize="30px" lineHeight={0.9}>{m.gf}-{m.gc}</Text>
                  <Text fontSize="12px" color={res.color}>{res.word}</Text>
                </Box>
              </Flex>
              <Text fontSize="14px" lineHeight={1.25} minH="36px" noOfLines={2}>{rivalLabel(m)}</Text>
              <Flex direction="column" gap={1.5} pt={2} borderTop="1px solid" borderColor="#2e2825">
                <Flex justify="space-between" align="baseline">
                  <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray">Rating</Text>
                  <Text fontFamily="heading" fontSize="24px" lineHeight={1} color={rating === null ? '#8c7f70' : rating >= 7.5 ? 'brand.orange' : 'white'}>
                    {rating !== null ? rating.toFixed(1) : m.jugo === false ? 'No jugó' : 'S/D'}
                  </Text>
                </Flex>
                <Box h="6px" borderRadius="3px" bg="#2e2825" overflow="hidden">
                  <Box h="100%" borderRadius="3px" bg="brand.orange" w={rating !== null ? `${Math.max(0, Math.min(100, ((rating - 5.5) / 3.5) * 100))}%` : 0} />
                </Box>
              </Flex>
            </Flex>
          )
        })}
      </SimpleGrid>
    </Flex>
  )
}
