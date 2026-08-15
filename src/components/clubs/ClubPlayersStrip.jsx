import { Box, Flex, HStack, Text, Avatar } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { playerInitials } from '../../data/players'

// ─── A QUIÉNES AFECTA ────────────────────────────────────────────
// La tira de jugadores del club, siempre visible arriba del editor.
// Es el aviso permanente de que lo que se guarde acá se replica en
// todas estas landings. Cada chip lleva a la edición individual.

export default function ClubPlayersStrip({ players }) {
  const navigate = useNavigate()

  return (
    <Box mb={{ base: 5, md: 6 }}>
      <Text
        fontFamily="mono" fontSize="10px" color="brand.gray"
        textTransform="uppercase" letterSpacing="widest" mb={3}
      >
        Lo que guardes acá se aplica a
      </Text>

      <Flex gap={2} wrap="wrap">
        {players.map((player) => (
          <HStack
            key={player.slug}
            as="button"
            type="button"
            onClick={() => navigate(`/jugador/${player.slug}`)}
            spacing={2}
            pl={1} pr={3} py={1}
            bg="brand.dark2"
            border="1px solid"
            borderColor="brand.brownDark"
            borderRadius="full"
            transition="border-color 0.2s"
            _hover={{ borderColor: 'brand.orange' }}
            _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '2px' }}
          >
            <Avatar
              size="xs"
              src={player.photo}
              name={playerInitials(player.name)}
              bg="brand.brownLight"
              color="brand.orange"
            />
            <Text fontFamily="mono" fontSize="xs" color="brand.gray" letterSpacing="wider" noOfLines={1}>
              {player.name}
            </Text>
          </HStack>
        ))}
      </Flex>
    </Box>
  )
}
