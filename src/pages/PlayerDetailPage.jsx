import { Box, Flex, HStack, VStack, Text, Badge, Button, Divider } from '@chakra-ui/react'
import { FiArrowLeft } from 'react-icons/fi'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { getPlayer } from '../data/players'

// ─── DETALLE POR JUGADOR ─────────────────────────────────────────
// El editor de partidos (tabs + MatchForm + MatchPreviewCard) llega
// en la Fase 5. Por ahora esta página resuelve el slug de la URL y
// muestra el contexto del jugador.

export default function PlayerDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const player = getPlayer(slug)

  // Slug que no existe en players.js → de vuelta a la grilla.
  if (!player) return <Navigate to="/" replace />

  return (
    <Box minH="100vh" bg="brand.dark" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6, lg: 10 }}>
      <Box maxW="900px" mx="auto">
        <Button
          variant="ghost"
          color="brand.gray"
          fontFamily="mono" fontSize="xs"
          letterSpacing="widest" textTransform="uppercase"
          leftIcon={<FiArrowLeft />}
          _hover={{ color: 'white', bg: 'brand.brownLight' }}
          mb={4}
          pl={2}
          onClick={() => navigate('/')}
        >
          Jugadores
        </Button>

        <Flex align="center" justify="space-between" gap={3} mb={{ base: 5, md: 7 }}>
          <VStack align="stretch" spacing={2}>
            <Text fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }} color="white" lineHeight={1}>
              {player.name}
            </Text>
            <HStack spacing={2}>
              <Text fontFamily="mono" fontSize="10px" color="brand.gray"
                    letterSpacing="widest" textTransform="uppercase">
                {player.club}
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

        <Divider borderColor="brand.brownDark" mb={{ base: 5, md: 8 }} />

        <Box
          bg="brand.dark2"
          border="1px dashed"
          borderColor="brand.brownDark"
          borderRadius="lg"
          p={{ base: 6, md: 10 }}
          textAlign="center"
        >
          <Text fontFamily="mono" fontSize="10px" color="brand.gray"
                letterSpacing="widest" textTransform="uppercase" mb={2}>
            Fase 5
          </Text>
          <Text fontFamily="body" fontSize="sm" color="brand.gray">
            Acá va el editor de partidos: tabs de Último Resultado / Próximo Partido,
            formulario con escudos y tarjetas de preview.
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
