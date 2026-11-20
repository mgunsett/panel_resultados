import { Box, Button, Flex, Image, Text } from '@chakra-ui/react'
import { FiEdit3, FiTrash2 } from 'react-icons/fi'
import { SOURCE_COLORS, slotSource } from '../../lib/profileData'
import { clubView } from '../../lib/clubsData'
import MatchForm from '../match/MatchForm'
import ClubCrest from './ClubCrest'

const TITLES = { last: 'Último resultado', next: 'Próximo partido' }
const lbl = { fontFamily: 'mono', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'brand.gray' }

// Escudo de un equipo como en la landing. Sin URL cargada, el del club
// sale de public/clubs y el rival cae a sus iniciales.
function Team({ name, shield, club, isClub }) {
  return (
    <Flex direction="column" align="center" gap={2} minW={0} textAlign="center">
      {shield ? (
        <Image src={shield} alt="" boxSize={{ base: '48px', md: '64px' }} objectFit="contain" />
      ) : isClub ? (
        <ClubCrest club={club} size={{ base: '48px', md: '64px' }} fontSize="lg" />
      ) : (
        <Flex boxSize={{ base: '48px', md: '64px' }} align="center" justify="center" borderRadius="12px" bg="#2a2420" border="1px solid #5a4f47"
          fontFamily="heading" fontSize="lg" color="brand.gray">{String(name || '?').slice(0, 3).toUpperCase()}</Flex>
      )}
      <Text fontFamily="heading" fontSize={{ base: '18px', md: '24px' }} lineHeight={1} noOfLines={2}>{name}</Text>
    </Flex>
  )
}

// ─── PARTIDO DEL CLUB ────────────────────────────────────────────
// Cómo se ve hoy en las landings, de dónde sale (automático, bloqueado,
// manual) y, al tocar Editar, el formulario de siempre dentro de la card.
export default function ClubSlotCard({ slot, club, match, outOfSync, n, editing, saving, onEdit, onCancel, onSave, onDelete }) {
  const has = Boolean(match?.home_team)
  const src = slotSource(match, club)
  const tone = SOURCE_COLORS[src.id]
  const v = clubView(match, club)
  const last = slot === 'last'
  const center = has ? (last && v.played ? `${match.home_score} - ${match.away_score}` : v.time || 'VS') : '—'
  const sub = has ? (last && v.played ? 'Final' : v.day) : ''
  const meta = has ? [match.competition, v.day, match.stadium].filter(Boolean).join(' · ') : ''
  const warn = outOfSync
    ? `Los ${n} jugadores no tienen el mismo partido cargado. Ves el más reciente; al guardar quedan todos iguales.`
    : match?.locked ? 'Está bloqueado: la sincronización no lo actualiza. Revisá que esté bien.' : ''

  return (
    <Flex as="article" direction="column" gap={3.5} p={5} minW={0} borderRadius="16px" bg="#050404">
      <Flex align="center" justify="space-between" gap={2.5}>
        <Text as="h3" fontFamily="heading" fontSize="28px" lineHeight={1}>{TITLES[slot]}</Text>
        <Flex align="center" gap={1.5} px={3} py={1} borderRadius="full" bg={tone.bg} color={tone.color}
          fontFamily="mono" fontSize="13px" letterSpacing="0.1em" textTransform="uppercase" whiteSpace="nowrap">
          <Box boxSize="7px" borderRadius="full" bg={tone.color} />{src.label}
        </Flex>
      </Flex>

      {has ? (
        <>
          <Box display="grid" gridTemplateColumns="1fr auto 1fr" alignItems="center" gap={3} px={3.5} py={5} borderRadius="14px"
            bg="radial-gradient(ellipse at center, rgba(249,160,63,.12), transparent 70%), #0f0c0a" border="1px solid" borderColor="#2a211b">
            <Team name={match.home_team} shield={match.home_shield} club={club} isClub={v.side === 'home'} />
            <Flex direction="column" align="center" gap={1}>
              <Text fontFamily="heading" fontSize={{ base: '40px', md: '52px' }} lineHeight={1} color="brand.orange" whiteSpace="nowrap">{center}</Text>
              {sub && <Text {...lbl}>{sub}</Text>}
            </Flex>
            <Team name={match.away_team} shield={match.away_shield} club={club} isClub={v.side === 'away'} />
          </Box>
          {meta && <Text fontSize="13px" color="brand.gray" textAlign="center">{meta}</Text>}
        </>
      ) : (
        <Flex direction="column" align="center" justify="center" gap={1} py={8} borderRadius="14px" border="1px dashed" borderColor="#3a2f27">
          <Text fontSize="15px" color="brand.gray">Sin partido cargado</Text>
          <Text fontSize="13px" color="#8c7f70">{src.help}</Text>
        </Flex>
      )}

      {warn && (
        <Text px={3} py={2.5} borderRadius="10px" bg="rgba(249,160,63,.08)" border="1px solid" borderColor="rgba(249,160,63,.35)" fontSize="14px" color="brand.amber">
          ⚠ {warn}
        </Text>
      )}

      {editing ? (
        <Box pt={1}>
          <MatchForm
            slot={slot} data={match} saving={saving} onSave={onSave} onCancel={onCancel}
            saveLabel={`Guardar en ${n} ${n === 1 ? 'jugador' : 'jugadores'}`}
          />
        </Box>
      ) : (
        <Flex align="center" justify="flex-end" gap={2.5} wrap="wrap">
          {has && !match.locked && src.id === 'auto' && (
            <Text flex="1 1 200px" fontSize="13px" color="brand.gray">{src.help}</Text>
          )}
          {has && (
            <Button size="sm" h="36px" variant="outline" borderColor="#423a35" color="brand.amber" leftIcon={<FiTrash2 />}
              fontFamily="mono" fontSize="13px" letterSpacing="0.1em" textTransform="uppercase" _hover={{ bg: '#2a2420', color: 'white' }}
              onClick={onDelete}>
              Borrar
            </Button>
          )}
          <Button size="sm" h="36px" bg="brand.orange" color="brand.brown" leftIcon={<FiEdit3 />} _hover={{ bg: '#ffb35e' }} _active={{ bg: '#ffb35e' }}
            fontFamily="mono" fontSize="13px" letterSpacing="0.1em" textTransform="uppercase" onClick={onEdit}>
            {has ? 'Editar para todo el club' : 'Cargar para todo el club'}
          </Button>
        </Flex>
      )}
    </Flex>
  )
}
