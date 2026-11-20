import { forwardRef } from 'react'
import { Box, Flex, Text, Image, Button, IconButton, SimpleGrid } from '@chakra-ui/react'
import { FiX, FiArrowRight, FiEdit3 } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { playerInitials } from '../../data/players'
import { scoreline } from '../../lib/homeData'
import { STATUS_COLORS } from './ShowcaseCard'

const MotionBox = motion(Box)

const dash = (v, fmt) => (v === null || v === undefined ? '—' : fmt ? fmt(v) : String(v))

function lastLine(row) {
  const st = row.stats.last
  if (st?.rival) {
    const score = st.gf !== null && st.gf !== undefined ? ` ${st.gf}-${st.gc}` : ''
    const perf = st.jugo === false ? ' · no jugó' : st.rating ? ` · rating ${Number(st.rating).toFixed(1)}` : ''
    return `${st.condicion === 'V' ? 'en' : 'vs'} ${st.rival}${score}${perf}`
  }
  return scoreline(row.matches.last) || 'Sin datos'
}

// Ficha rápida del jugador elegido en el home, con accesos directos.
const QuickProfile = forwardRef(function QuickProfile({ row, onClose }, ref) {
  const navigate = useNavigate()
  const { player, club, stats, status, nextLabel } = row
  const s = stats.season || {}
  const tiles = [
    ['Partidos', dash(s.partidos)], ['Goles', dash(s.goles)], ['Asistencias', dash(s.asistencias)],
    ['Rating', dash(s.rating, (x) => Number(x).toFixed(2))], ['Minutos', dash(s.minutos, (x) => Number(x).toLocaleString('es-AR'))],
  ]

  return (
    <MotionBox
      ref={ref} as="section" aria-label={`Ficha rápida de ${player.name}`}
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
      display="flex" flexWrap="wrap" gap={6} p={6} borderRadius="16px" bg="brand.dark2" border="1px solid" borderColor="#6b4a22"
      scrollMarginTop="90px"
    >
      {player.photo ? (
        <Image src={player.photo} alt="" w="150px" h="180px" borderRadius="12px" objectFit="cover" objectPosition="top" bg="#2a2420" flexShrink={0} />
      ) : (
        <Flex w="150px" h="180px" borderRadius="12px" bg="brand.brownLight" align="center" justify="center" fontFamily="heading" fontSize="5xl" color="brand.amber">{playerInitials(player.name)}</Flex>
      )}
      <Flex direction="column" gap={3.5} flex="1 1 320px" minW={0}>
        <Flex wrap="wrap" align="flex-start" justify="space-between" gap={3}>
          <Box>
            <Text fontFamily="mono" fontSize="13px" letterSpacing="0.18em" textTransform="uppercase" color="brand.orange">
              {club?.name || 'Sin club'}{club?.country ? ` · ${club.country}` : ''}
            </Text>
            <Text fontFamily="heading" fontSize="44px" lineHeight={1}>{player.name}</Text>
          </Box>
          <IconButton icon={<FiX />} aria-label="Cerrar ficha rápida" variant="outline" borderColor="brand.brownDark" color="brand.amber"
            _hover={{ bg: 'brand.brownLight', color: 'white' }} onClick={onClose} />
        </Flex>
        {player.apiPlayerId ? (
          <SimpleGrid minChildWidth="110px" spacing={2.5}>
            {tiles.map(([k, v]) => (
              <Box key={k} px={3} py={2.5} borderRadius="10px" bg="#151312" border="1px solid" borderColor="#2e2825">
                <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray">{k}</Text>
                <Text fontFamily="heading" fontSize="30px" lineHeight={1.05}>{v}</Text>
              </Box>
            ))}
          </SimpleGrid>
        ) : null}
        <Flex wrap="wrap" gap={4} fontSize="14px" color="brand.amber">
          <Text><Text as="span" color="brand.gray">Último:</Text> {lastLine(row)}</Text>
          <Text><Text as="span" color="brand.gray">Próximo:</Text> {nextLabel || 'sin cargar'}</Text>
        </Flex>
        <Flex align="center" gap={2} fontSize="13px" color={STATUS_COLORS[status.id]}>
          <Box boxSize="7px" borderRadius="full" bg={STATUS_COLORS[status.id]} />
          {status.reason}
        </Flex>
        <Flex wrap="wrap" gap={2.5}>
          <Button rightIcon={<FiArrowRight />} h="44px" bg="brand.orange" color="brand.brown" _hover={{ bg: '#ffb35e' }}
            fontFamily="mono" fontSize="14px" letterSpacing="0.12em" textTransform="uppercase"
            onClick={() => navigate(`/jugador/${player.slug}`)}>
            Ver ficha completa
          </Button>
          <Button leftIcon={<FiEdit3 />} h="44px" variant="outline" borderColor="brand.brownDark" color="brand.amber"
            _hover={{ bg: 'brand.brownLight', color: 'white' }}
            fontFamily="mono" fontSize="14px" letterSpacing="0.12em" textTransform="uppercase"
            onClick={() => navigate(`/jugador/${player.slug}?tab=carga`)}>
            Cargar resultado
          </Button>
        </Flex>
      </Flex>
    </MotionBox>
  )
})

export default QuickProfile
