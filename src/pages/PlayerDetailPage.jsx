import { Box, Flex, HStack, VStack, Text, Badge, Button, Divider, Code } from '@chakra-ui/react'
import { FiShield } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import { getPlayer } from '../data/players'
import { getClub } from '../data/clubs'
import { usePlayerMatches } from '../hooks/usePlayerMatches'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/ui/BackButton'
import NotFoundNotice from '../components/ui/NotFoundNotice'
import ClubCrest from '../components/clubs/ClubCrest'
import MatchEditor from '../components/match/MatchEditor'

// ─── DETALLE POR JUGADOR ─────────────────────────────────────────
// Resuelve el slug de la URL, muestra el contexto del jugador y monta
// el editor de partidos apuntado a players/{slug}/matches. Acá el
// guardado afecta a una sola landing, así que va sin confirmación.

export default function PlayerDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const player = getPlayer(slug)
  const club = getClub(player?.clubId)
  // El hook se llama siempre (no puede ir después de un return); con un
  // slug inexistente la lectura falla sin efecto sobre la vista.
  const controller = usePlayerMatches(slug)

  if (!player) {
    return (
      <NotFoundNotice
        title="Jugador no encontrado"
        description={
          <>
            No hay ningún jugador con el slug <Code fontSize="12px">{slug}</Code> en{' '}
            <Code fontSize="12px">src/data/players.js</Code>. Revisá la URL o sumá la
            entrada al archivo.
          </>
        }
        backTo="/jugadores"
        backLabel="Jugadores"
      />
    )
  }

  const deleteDescription = (slotLabel) =>
    `Se va a borrar "${slotLabel}" de este jugador. La landing va a dejar de mostrarlo. Esta acción no se puede deshacer.`

  return (
    <PageContainer maxW="900px">
      <Box mb={4}>
        <BackButton to="/jugadores" label="Jugadores" />
      </Box>

      <Flex align="center" gap={4} mb={{ base: 5, md: 7 }}>
        {club && <ClubCrest club={club} size={{ base: '48px', md: '60px' }} fontSize="lg" />}

        <VStack align="stretch" spacing={2} minW={0}>
          <Text
            fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }}
            color="white" lineHeight={1}
          >
            {player.name}
          </Text>
          <HStack spacing={2} wrap="wrap">
            <Text
              fontFamily="mono" fontSize="10px" color="brand.gray"
              letterSpacing="widest" textTransform="uppercase"
            >
              {club?.name || 'Sin club'}
            </Text>
            <Badge
              fontFamily="mono" fontSize="8px" bg="brand.amberLight"
              color="brand.amber" border="1px solid" borderColor="brand.amber"
              px={2} py={0.5} letterSpacing="widest"
            >
              {player.slug}
            </Badge>
          </HStack>
        </VStack>
      </Flex>

      {/* Atajo al club: si el partido es el mismo para varios jugadores,
          conviene cargarlo una sola vez desde ahí. */}
      {club && (
        <Button
          variant="ghost" size="sm"
          color="brand.orange"
          fontFamily="mono" fontSize="xs"
          letterSpacing="wider" textTransform="uppercase"
          leftIcon={<FiShield size={14} />}
          _hover={{ bg: 'brand.orangeSoft' }}
          pl={2} mb={4}
          onClick={() => navigate(`/club/${club.id}`)}
        >
          Cargar para todo {club.name}
        </Button>
      )}

      <Divider borderColor="brand.brownDark" mb={{ base: 5, md: 8 }} />

      {/* key={slug}: al saltar de un jugador a otro remonta el editor
          entero, así no quedan tabs ni formularios con estado viejo. */}
      <MatchEditor key={slug} controller={controller} deleteDescription={deleteDescription} />
    </PageContainer>
  )
}
