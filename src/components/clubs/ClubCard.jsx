import { Box, Button, Flex, Image, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { playerInitials } from '../../data/players'
import { RESULT } from '../../lib/profileData'
import { CLUB_STATUS, clubView } from '../../lib/clubsData'
import ClubCrest from './ClubCrest'

const lbl = { fontFamily: 'mono', fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'brand.gray' }

export function StatusPill({ id, label }) {
  const tone = CLUB_STATUS[id]
  return (
    <Flex as="span" align="center" gap={1.5} px={3} py={1} borderRadius="full" bg={tone.bg} color={tone.color} flexShrink={0}
      fontFamily="mono" fontSize="13px" letterSpacing="0.1em" textTransform="uppercase" whiteSpace="nowrap">
      <Box boxSize="7px" borderRadius="full" bg={tone.color} />{label || tone.label}
    </Flex>
  )
}

function Tag({ bg, color, children }) {
  return (
    <Flex as="span" boxSize="24px" align="center" justify="center" borderRadius="6px" bg={bg} color={color} flexShrink={0}
      fontFamily="mono" fontWeight="700" fontSize="14px">
      {children}
    </Flex>
  )
}

// Una línea del partido: «Último  G  2-1 vs Racing   Dom 16».
function MatchRow({ title, match, club, next }) {
  const v = clubView(match, club)
  let tag = null
  let text = 'Sin cargar'
  let when = ''
  if (v && next) {
    tag = <Tag bg="#2a2420" color="brand.amber">{v.cond || '·'}</Tag>
    text = v.rival ? `${v.cond === 'V' ? 'en' : 'vs'} ${v.rival}` : `${match.home_team} vs ${match.away_team}`
    when = [v.day, v.time].filter(Boolean).join(' · ')
  } else if (v) {
    const r = RESULT[v.res]
    tag = <Tag bg={r?.bg || '#2a2420'} color={r?.color || 'brand.amber'}>{v.res || '·'}</Tag>
    text = v.rival
      ? <><Text as="b" color="brand.orange">{v.played ? `${v.gf}-${v.gc}` : ''}</Text> {v.cond === 'V' ? 'en' : 'vs'} {v.rival}</>
      : `${match.home_team} ${v.played ? `${match.home_score}-${match.away_score}` : 'vs'} ${match.away_team}`
    when = v.day
  }
  return (
    <Flex align="center" gap={2.5} px={3.5} py={2.5} minH="44px" _notFirst={{ borderTop: '1px solid', borderColor: '#2a211b' }}>
      <Text {...lbl} w="62px" flexShrink={0}>{title}</Text>
      {tag}
      <Text flex={1} minW={0} fontSize="15px" noOfLines={1} color={v ? 'white' : 'brand.gray'}>{text}</Text>
      {when && <Text fontSize="13px" color="#8c7f70" whiteSpace="nowrap">{when}</Text>}
    </Flex>
  )
}

// ─── CARD DE CLUB EN LA GRILLA ───────────────────────────────────
// Escudo, estado, último y próximo partido tal como están cargados,
// los jugadores y un atajo para cargar el próximo partido.
export default function ClubCard({ entry, loading }) {
  const navigate = useNavigate()
  const { club, matches, status } = entry
  const ps = club.players
  const open = (q = '') => navigate(`/club/${club.id}${q}`)

  return (
    <Flex
      as="article" direction="column" gap={3.5} p="18px" minW={0} borderRadius="16px" bg="#050404"
      border="1px solid" borderColor="transparent" boxShadow="inset 0 3px 0 #2a2420"
      transition="border-color .15s" _hover={{ borderColor: '#3a2f27' }}
    >
      <Flex
        as="button" type="button" onClick={() => open()} aria-label={`Abrir ${club.name}`} align="center" gap={3.5} textAlign="left" minW={0}
        _hover={{ '& .club-name': { color: 'brand.orange' } }}
        _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '4px', borderRadius: '8px' }}
      >
        <ClubCrest club={club} size="64px" fontSize="xl" />
        <Flex flex={1} minW={0} direction="column" gap={1}>
          <Text className="club-name" fontFamily="heading" fontSize="34px" lineHeight={0.95} noOfLines={1} transition="color .15s">{club.name}</Text>
          <Text {...lbl} color="brand.orange" noOfLines={1}>{club.competition} · {club.country}</Text>
        </Flex>
        {!loading && <StatusPill id={status.id} />}
      </Flex>

      <Box borderRadius="12px" bg="#0f0c0a" border="1px solid" borderColor="#2a211b">
        {loading ? (
          <Text px={3.5} py={3} fontSize="14px" color="brand.gray">Cargando partidos…</Text>
        ) : (
          <>
            <MatchRow title="Último" match={matches.last} club={club} />
            <MatchRow title="Próximo" match={matches.next} club={club} next />
          </>
        )}
      </Box>

      <Flex align="center" gap={3}>
        <Flex pl={2} flexShrink={0}>
          {ps.slice(0, 5).map((p) => (
            p.photo ? (
              <Image key={p.slug} src={p.photo} alt={p.name} title={p.name} boxSize="34px" borderRadius="full" objectFit="cover" objectPosition="top"
                bg="#2a2420" border="2px solid #050404" ml="-8px" />
            ) : (
              <Flex key={p.slug} title={p.name} boxSize="34px" borderRadius="full" bg="brand.brownLight" border="2px solid #050404" ml="-8px"
                align="center" justify="center" fontSize="11px" color="brand.amber">{playerInitials(p.name)}</Flex>
            )
          ))}
        </Flex>
        <Text flex={1} minW={0} fontSize="13px" color="brand.gray" noOfLines={1}>{ps.length === 1 ? ps[0].name : `${ps.length} jugadores`}</Text>
        <Button
          size="sm" h="36px" px={3.5} bg="brand.orange" color="brand.brown" _hover={{ bg: '#ffb35e' }} _active={{ bg: '#ffb35e' }}
          fontFamily="mono" fontSize="13px" letterSpacing="0.1em" textTransform="uppercase" onClick={() => open('?editar=next')}
        >
          Cargar partido
        </Button>
      </Flex>

      {!loading && status.warn && (
        <Text px={3} py={2} borderRadius="8px" bg="rgba(249,160,63,.08)" border="1px solid" borderColor="rgba(249,160,63,.3)" fontSize="13px" color="brand.amber">
          {status.warn}
        </Text>
      )}
    </Flex>
  )
}
