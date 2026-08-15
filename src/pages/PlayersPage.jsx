import { Text } from '@chakra-ui/react'
import { players } from '../data/players'
import PageContainer from '../components/layout/PageContainer'
import PageHeader from '../components/layout/PageHeader'
import PlayersGrid from '../components/players/PlayersGrid'

export default function PlayersPage() {
  return (
    <PageContainer>
      <PageHeader eyebrow={`${players.length} jugadores`} title="Jugadores" />

      <Text
        fontFamily="mono" fontSize="10px" color="brand.gray"
        textTransform="uppercase" letterSpacing="widest" mb={4}
      >
        Elegí un jugador para cargarle partidos
      </Text>

      <PlayersGrid players={players} />
    </PageContainer>
  )
}
