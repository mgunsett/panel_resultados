import { SimpleGrid, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import ClubCard from './ClubCard'

export default function ClubsGrid({ clubs }) {
  const navigate = useNavigate()

  if (!clubs.length) {
    return (
      <Text fontFamily="body" fontSize="sm" color="brand.gray">
        Ningún jugador de <code>src/data/players.js</code> tiene un <code>clubId</code> que
        exista en <code>src/data/clubs.js</code>.
      </Text>
    )
  }

  return (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={{ base: 3, md: 5 }}>
      {clubs.map((club, i) => (
        <ClubCard
          key={club.id}
          club={club}
          index={i}
          onClick={() => navigate(`/club/${club.id}`)}
        />
      ))}
    </SimpleGrid>
  )
}
