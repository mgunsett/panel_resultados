import { Box, Flex, Image, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { playerInitials } from '../../data/players'
import { playerStatus } from '../../lib/homeData'
import { dash, fmtInt } from '../../lib/profileData'
import { STATUS_COLORS } from '../home/ShowcaseCard'

const COLS = '36px minmax(150px, 2fr) repeat(5, minmax(52px, .6fr)) minmax(110px, 1fr)'
const lbl = { fontFamily: 'mono', fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'brand.gray' }
const numCell = { textAlign: 'right', sx: { fontVariantNumeric: 'tabular-nums' } }

// ─── JUGADORES DEL CLUB ──────────────────────────────────────────
// Temporada de cada uno y el estado de su landing. Cada fila abre la
// ficha del jugador.
export default function ClubPlayersTable({ club, players, rows, season }) {
  return (
    <Box as="section" borderRadius="16px" bg="#050404" boxShadow="inset 0 3px 0 #F9A03F" overflow="hidden">
      <Text as="h2" fontFamily="heading" fontSize="28px" lineHeight={1} px={5} pt="18px" pb={3}>
        Jugadores del club · temporada {season.year}
      </Text>
      <Box overflowX="auto">
        <Box minW="720px">
          <Box display="grid" gridTemplateColumns={COLS} columnGap={3} alignItems="center" px={5} minH="40px" bg="#0f0c0a" borderTop="1px solid" borderColor="#211a15">
            <span />
            <Text {...lbl}>Jugador</Text>
            {['PJ', 'Min', 'G', 'A', 'Rating'].map((h) => <Text key={h} {...lbl} textAlign="right">{h}</Text>)}
            <Text {...lbl}>Estado</Text>
          </Box>
          {players.map((p) => {
            const s = season.bySlug[p.slug]
            const st = playerStatus(p, club, rows.find((r) => r.player.slug === p.slug)?.matches)
            return (
              <Box
                key={p.slug} as={RouterLink} to={`/jugador/${p.slug}`} display="grid" gridTemplateColumns={COLS} columnGap={3} alignItems="center"
                px={5} py={2.5} minH="56px" borderTop="1px solid" borderColor="#211a15" _hover={{ bg: '#17120e' }}
                _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '-2px' }}
              >
                {p.photo ? (
                  <Image src={p.photo} alt="" boxSize="36px" borderRadius="9px" objectFit="cover" objectPosition="top" bg="#2a2420" />
                ) : (
                  <Flex boxSize="36px" borderRadius="9px" bg="brand.brownLight" align="center" justify="center" fontSize="12px" color="brand.amber">{playerInitials(p.name)}</Flex>
                )}
                <Text fontWeight="600" noOfLines={1}>{p.name}</Text>
                <Text {...numCell}>{dash(s?.partidos)}</Text>
                <Text {...numCell}>{dash(s?.minutos, fmtInt)}</Text>
                <Text {...numCell}>{dash(s?.goles)}</Text>
                <Text {...numCell}>{dash(s?.asistencias)}</Text>
                <Text {...numCell} color="brand.orange">{dash(s?.rating, (v) => Number(v).toFixed(2))}</Text>
                <Flex align="center" gap={2} fontSize="13px" color="brand.amber" title={st.reason} minW={0}>
                  <Box boxSize="8px" borderRadius="full" bg={STATUS_COLORS[st.id]} flexShrink={0} />
                  <Text noOfLines={1}>{st.label}</Text>
                </Flex>
              </Box>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}
