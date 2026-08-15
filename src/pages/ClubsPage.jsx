import { Text } from '@chakra-ui/react'
import { getClubsWithPlayers } from '../data/players'
import PageContainer from '../components/layout/PageContainer'
import PageHeader from '../components/layout/PageHeader'
import ClubsGrid from '../components/clubs/ClubsGrid'

// Grilla de clubes. Un club aparece una sola vez aunque tenga varios
// jugadores, y sólo si tiene al menos uno.
export default function ClubsPage() {
  const clubs = getClubsWithPlayers()

  return (
    <PageContainer>
      <PageHeader eyebrow={`${clubs.length} clubes`} title="Clubes" />

      <Text
        fontFamily="mono" fontSize="10px" color="brand.gray"
        textTransform="uppercase" letterSpacing="widest" mb={4}
      >
        Cargá un partido una vez y se aplica a todos los jugadores del club
      </Text>

      <ClubsGrid clubs={clubs} />
    </PageContainer>
  )
}
