import { forwardRef } from 'react'
import { Box, Button, Flex, Image, SimpleGrid, Text } from '@chakra-ui/react'
import { FiArrowRight, FiEdit3 } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { playerInitials } from '../../data/players'
import { STATUS_COLORS } from '../home/ShowcaseCard'
import { dash, fmtInt, num, per90 } from '../../lib/profileData'
import RecentForm from './RecentForm'
import LandingSlots from './LandingSlots'
import PlayerLinks from './PlayerLinks'
import ClubCrest from '../clubs/ClubCrest'
import heroTexture from '../../assets/fondo_led3.webp'

const MotionBox = motion(Box)

const btn = {
  h: '44px', fontFamily: 'mono', fontSize: '14px', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '8px',
}

function SeasonTiles({ season }) {
  const s = season || {}
  const p90 = (k) => {
    const v = per90(s[k], s.minutos)
    return v === null ? '—' : v.toFixed(2)
  }
  const tiles = [
    { k: 'Partidos', v: dash(s.partidos), sub: s.titular !== undefined && s.titular !== null ? `${s.titular} de titular` : '' },
    { k: 'Minutos', v: dash(s.minutos, fmtInt), sub: num(s.minutos) && num(s.partidos) ? `${Math.round(s.minutos / s.partidos)}' por partido` : '' },
    { k: 'Goles', v: dash(s.goles), sub: `${p90('goles')} cada 90'`, accent: true },
    { k: 'Asistencias', v: dash(s.asistencias), sub: `${p90('asistencias')} cada 90'`, accent: true },
    { k: 'Rating', v: dash(s.rating, (x) => Number(x).toFixed(2)), sub: 'Promedio', accent: true },
    { k: 'Precisión', v: dash(s.precisionPases, (x) => `${Math.round(x)}%`), sub: 'De pases' },
  ]
  return (
    <SimpleGrid minChildWidth="130px" spacing={2.5}>
      {tiles.map((t) => (
        <Box key={t.k} px={3.5} py={3} borderRadius="12px" bg="#151312" border="1px solid" borderColor="#2e2825">
          <Text fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray">{t.k}</Text>
          <Text fontFamily="heading" fontSize="38px" lineHeight={1} color={t.accent ? 'brand.orange' : 'white'}>{t.v}</Text>
          {t.sub && <Text fontSize="12px" color="#8c7f70">{t.sub}</Text>}
        </Box>
      ))}
    </SimpleGrid>
  )
}

// ─── PANEL DEL JUGADOR ELEGIDO (columna derecha) ─────────────────
const PlayerPanel = forwardRef(function PlayerPanel({ row, mates, onSelect }, ref) {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const { player, club, stats, matches, status } = row
  const season = stats.season
  const year = season?.temporada || new Date().getFullYear()

  return (
    <MotionBox
      ref={ref} key={player.slug} as="section" aria-label={`Jugador elegido: ${player.name}`}
      display="flex" flexDirection="column" gap={5} minW={0} scrollMarginTop="84px"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
    >
      <Flex
        wrap="wrap" gap={6} p={6} borderRadius="16px" border="1px solid" borderColor="#2e2825"
        bgImage={`linear-gradient(90deg, rgba(21,19,18,.97) 0%, rgba(21,19,18,.85) 50%, rgba(21,19,18,.55) 100%), url(${heroTexture})`}
        bgSize="cover" bgPosition="center right"
      >
        {player.photo ? (
          <Image src={player.photo} alt={player.name} w={{ base: '120px', md: '190px' }} h={{ base: '150px', md: '230px' }}
            borderRadius="14px" objectFit="cover" objectPosition="top" bg="#2a2420" flexShrink={0} />
        ) : (
          <Flex w={{ base: '120px', md: '190px' }} h={{ base: '150px', md: '230px' }} borderRadius="14px" bg="brand.brownLight"
            align="center" justify="center" fontFamily="heading" fontSize="6xl" color="brand.amber" flexShrink={0}>
            {playerInitials(player.name)}
          </Flex>
        )}
        <Flex direction="column" gap={3} flex="1 1 300px" minW={0}>
          <Flex align="center" gap={2.5}>
            {club && <ClubCrest club={club} size="30px" fontSize="9px" />}
            <Text fontFamily="mono" fontSize="13px" letterSpacing="0.18em" textTransform="uppercase" color="brand.orange" noOfLines={1}>
              {[club?.name || 'Sin club', club?.competition, club?.country].filter(Boolean).join(' · ')}
            </Text>
          </Flex>
          <Text as="h2" fontFamily="heading" fontSize={{ base: '44px', md: '64px' }} lineHeight={0.9}>{player.name}</Text>
          <Flex align="center" gap={2} alignSelf="flex-start" px={3} py={1.5} borderRadius="full" bg="rgba(13,12,11,.7)"
            border="1px solid" borderColor="#2e2825" fontSize="14px" color="brand.amber">
            <Box boxSize="8px" borderRadius="full" bg={STATUS_COLORS[status.id]} flexShrink={0} />
            <Text as="span" fontFamily="mono" letterSpacing="0.1em" textTransform="uppercase" color={STATUS_COLORS[status.id]}>{status.label}</Text>
            <Text as="span">· {status.reason}</Text>
          </Flex>
          <Box flex={1} />
          <Flex wrap="wrap" gap={2.5}>
            <Button {...btn} rightIcon={<FiArrowRight />} bg="brand.orange" color="brand.brown" _hover={{ bg: '#ffb35e' }}
              onClick={() => navigate(`/jugador/${player.slug}`)}>
              Ver estadísticas completas
            </Button>
            <Button {...btn} leftIcon={<FiEdit3 />} variant="outline" borderColor="brand.brownDark" color="brand.amber"
              _hover={{ bg: 'brand.brownLight', color: 'white' }} onClick={() => navigate(`/jugador/${player.slug}?tab=carga`)}>
              Cargar resultado
            </Button>
            <PlayerLinks player={player} btn={btn} />
          </Flex>
        </Flex>
      </Flex>

      <Flex direction="column" gap={2.5}>
        <Flex wrap="wrap" align="baseline" justify="space-between" gap={2.5}>
          <Text as="h2" fontFamily="heading" fontSize="28px" lineHeight={1}>Temporada {year}</Text>
          {season?.updated_at && <Text fontSize="13px" color="#8c7f70">API-Football · actualizado {new Date(season.updated_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</Text>}
        </Flex>
        {player.apiPlayerId && season ? (
          <SeasonTiles season={season} />
        ) : (
          <Text p={4} borderRadius="12px" bg="#151312" border="1px solid" borderColor="#2e2825" fontSize="15px" color="brand.gray">
            {player.role === 'DT'
              ? 'Los directores técnicos no tienen estadísticas de jugador. Sus partidos se cargan a mano.'
              : !player.apiPlayerId
                ? 'No tiene ID de API-Football, así que no se le sincronizan estadísticas. Buscalo en Sincronización → IDs de API-Football.'
                : 'Todavía no hay totales de la temporada. Se cargan solos en la próxima sincronización.'}
          </Text>
        )}
      </Flex>

      <RecentForm stats={stats} clubName={club?.name || 'su club'} />
      <LandingSlots player={player} club={club} matches={matches} />

      {mates.length > 0 && (
        <Flex wrap="wrap" align="center" gap={3} px={5} py={3.5} borderRadius="14px" bg="brand.dark2" border="1px solid" borderColor="#2e2825">
          <Text fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray">También en {club?.name}</Text>
          {mates.map((m) => (
            <Button key={m.slug} onClick={() => onSelect(m.slug)} variant="outline" h="40px" pl={1} pr={3} borderRadius="full"
              borderColor="brand.brownDark" color="white" fontWeight="normal" fontSize="14px" _hover={{ borderColor: 'brand.gray', bg: 'transparent' }}
              leftIcon={m.photo ? <Image src={m.photo} alt="" boxSize="30px" borderRadius="full" objectFit="cover" objectPosition="top" /> : undefined}>
              {m.name}
            </Button>
          ))}
        </Flex>
      )}
    </MotionBox>
  )
})

export default PlayerPanel
