import { SimpleGrid, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import PlayerCard from './PlayerCard'

export default function PlayersGrid({ players }) {
  const navigate = useNavigate()

  if (!players.length) {
    return (
      <Text fontFamily="body" fontSize="sm" color="brand.gray">
        No hay jugadores cargados en <code>src/data/players.js</code>.
      </Text>
    )
  }

  return (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={{ base: 3, md: 5 }}>
      {players.map((player, i) => (
        <PlayerCard
          key={player.slug}
          player={player}
          index={i}
          onClick={() => navigate(`/jugador/${player.slug}`)}
        />
      ))}
    </SimpleGrid>
  )
}
