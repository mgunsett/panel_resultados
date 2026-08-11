import { Box, Flex, HStack, VStack, Text, Badge, Button, Divider } from '@chakra-ui/react'
import { FiLogOut } from 'react-icons/fi'
import { useAuth } from '../lib/auth'
import { players } from '../data/players'
import PlayersGrid from '../components/players/PlayersGrid'

export default function PlayersPage() {
  const { user, logout } = useAuth()

  return (
    <Box minH="100vh" bg="brand.dark" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6, lg: 10 }}>
      <Box maxW="1100px" mx="auto">
        {/* Header */}
        <Flex align="center" justify="space-between" mb={{ base: 6, md: 8 }} gap={3}>
          <VStack align="stretch" spacing={2}>
            <Text fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }} color="white" lineHeight={1}>
              Panel Central
              <Text as="span" color="brand.amber">_</Text>
            </Text>
            <HStack spacing={2}>
              <Badge
                fontFamily="mono" fontSize="9px" bg="brand.amberLight"
                color="brand.amber" border="1px solid" borderColor="brand.amber"
                px={2} py={0.5} letterSpacing="widest"
              >
                {players.length} jugadores
              </Badge>
              <Text fontFamily="mono" fontSize="10px" color="brand.gray"
                    display={{ base: 'none', sm: 'block' }}>
                {user?.email}
              </Text>
            </HStack>
          </VStack>

          <Button
            variant="ghost"
            color="brand.gray"
            fontFamily="mono" fontSize="xs"
            letterSpacing="widest" textTransform="uppercase"
            leftIcon={<FiLogOut />}
            _hover={{ color: 'white', bg: 'brand.brownLight' }}
            onClick={logout}
          >
            <Text display={{ base: 'none', sm: 'block' }}>Salir</Text>
          </Button>
        </Flex>

        <Divider borderColor="brand.brownDark" mb={{ base: 5, md: 8 }} />

        <Text fontFamily="mono" fontSize="10px" color="brand.gray"
              textTransform="uppercase" letterSpacing="widest" mb={4}>
          Elegí un jugador para cargarle partidos
        </Text>

        <PlayersGrid players={players} />
      </Box>
    </Box>
  )
}
