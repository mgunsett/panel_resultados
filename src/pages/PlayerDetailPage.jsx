import { Box, Flex, HStack, VStack, Text, Badge, Button, Divider, Code } from '@chakra-ui/react'
import { FiArrowLeft } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import { getPlayer } from '../data/players'
import MatchEditor from '../components/match/MatchEditor'

// ─── DETALLE POR JUGADOR ─────────────────────────────────────────
// Resuelve el slug de la URL, muestra el contexto del jugador y monta
// el editor de partidos apuntado a players/{slug}/matches.

// Botón "Volver" compartido por la vista normal y la de slug inválido.
function BackButton({ onClick }) {
  return (
    <Button
      variant="ghost"
      color="brand.gray"
      fontFamily="mono" fontSize="xs"
      letterSpacing="widest" textTransform="uppercase"
      leftIcon={<FiArrowLeft />}
      _hover={{ color: 'white', bg: 'brand.brownLight' }}
      pl={2}
      onClick={onClick}
    >
      Jugadores
    </Button>
  )
}

export default function PlayerDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const player = getPlayer(slug)

  // Slug que no existe en players.js: lo avisamos en vez de redirigir
  // en silencio, así un typo en la URL se nota.
  if (!player) {
    return (
      <Box
        minH="100vh" bg="brand.dark"
        display="flex" alignItems="center" justifyContent="center"
        px={6}
      >
        <VStack spacing={4} textAlign="center" maxW="460px">
          <Text fontFamily="heading" fontSize="2xl" color="white">
            Jugador no encontrado
          </Text>
          <Text fontFamily="body" fontSize="sm" color="brand.gray" lineHeight={1.7}>
            No hay ningún jugador con el slug <Code fontSize="12px">{slug}</Code> en{' '}
            <Code fontSize="12px">src/data/players.js</Code>. Revisá la URL o sumá la
            entrada al archivo.
          </Text>
          <BackButton onClick={() => navigate('/')} />
        </VStack>
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg="brand.dark" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6, lg: 10 }}>
      <Box maxW="900px" mx="auto">
        <Box mb={4}>
          <BackButton onClick={() => navigate('/')} />
        </Box>

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

        {/* key={slug}: al saltar de un jugador a otro remonta el editor
            entero, así no quedan tabs ni formularios con estado viejo. */}
        <MatchEditor key={slug} slug={slug} />
      </Box>
    </Box>
  )
}
