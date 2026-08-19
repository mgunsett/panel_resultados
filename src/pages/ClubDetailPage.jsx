import { Box, Text, Code } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import { getClub } from '../data/clubs'
import { getClubPlayers } from '../data/players'
import { useClubMatches } from '../hooks/useClubMatches'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/ui/BackButton'
import NotFoundNotice from '../components/ui/NotFoundNotice'
import ClubBanner from '../components/clubs/ClubBanner'
import ClubPlayersStrip from '../components/clubs/ClubPlayersStrip'
import MatchEditor from '../components/match/MatchEditor'

export default function ClubDetailPage() {
  const { clubId } = useParams()
  const club = getClub(clubId)
  const clubPlayers = getClubPlayers(clubId)
  // El hook se llama siempre (no puede ir después de un return): con un
  // clubId inexistente no tiene jugadores y no consulta nada.
  const controller = useClubMatches(clubId)

  if (!club) {
    return (
      <NotFoundNotice
        title="Club no encontrado"
        description={
          <>
            No hay ningún club con el id <Code fontSize="12px">{clubId}</Code> en{' '}
            <Code fontSize="12px">src/data/clubs.js</Code>. Revisá la URL o sumá la entrada
            al archivo.
          </>
        }
        backTo="/clubes"
        backLabel="Clubes"
      />
    )
  }

  const names = clubPlayers.map((p) => p.name).join(', ')

  const saveConfirm = {
    title: `¿Aplicar a ${clubPlayers.length} ${clubPlayers.length === 1 ? 'jugador' : 'jugadores'}?`,
    confirmLabel: 'Aplicar a todos',
    description: (slotLabel) => (
      <>
        <Text mb={2}>
          Se va a guardar <Text as="span" color="white">“{slotLabel}”</Text> con estos
          mismos datos en todos los jugadores de {club.name}:
        </Text>
        <Text color="white" mb={2}>{names}</Text>
        <Text>
          Las {clubPlayers.length === 1 ? 'landing' : 'landings'} de{' '}
          {clubPlayers.length === 1 ? 'ese jugador' : 'esos jugadores'} van a pasar a mostrar
          este partido. Se pisa lo que tengan cargado hoy.
        </Text>
      </>
    ),
  }

  const deleteDescription = (slotLabel) => (
    <>
      Se va a borrar “{slotLabel}” en los {clubPlayers.length} jugadores de {club.name}.
      Sus landings van a dejar de mostrarlo. Esta acción no se puede deshacer.
    </>
  )

  return (
    <PageContainer maxW="900px">
      <Box mb={4}>
        <BackButton to="/clubes" label="Clubes" />
      </Box>

      <ClubBanner club={{ ...club, players: clubPlayers }} />
      <ClubPlayersStrip players={clubPlayers} />

      {/* key={clubId}: al saltar de un club a otro remonta el editor
          entero, así no quedan tabs ni formularios con estado viejo. */}
      <MatchEditor
        key={clubId}
        controller={controller}
        saveConfirm={saveConfirm}
        deleteDescription={deleteDescription}
      />
    </PageContainer>
  )
}
