import { Box, Flex, VStack, SimpleGrid, Text, Image } from '@chakra-ui/react'
import { FiUsers, FiShield } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { players, getClubsWithPlayers } from '../data/players'
import BrandLogo from '../components/ui/BrandLogo'
import HomeShortcut from '../components/home/HomeShortcut'
import PageContainer from '../components/layout/PageContainer'
import heroBg from '../assets/fondo_led.png'

// ─── HOME ────────────────────────────────────────────────────────
// La foto de portada vive en src/assets: importada así, Vite la
// resuelve, le pone hash y la copia al build. (Desde public/ no se
// puede importar; ahí sólo se referencian por URL absoluta.)
//
// Se muestra a altura fija por breakpoint en vez de a pantalla
// completa: con `cover` sobre un viewport de celular (mucho más
// angosto que la foto) el recorte lateral se comería la frase. A
// estas alturas el recorte es mínimo y se lee entera en cualquier
// pantalla. Debajo queda el degradado de respaldo, en la misma
// propiedad `backgroundImage`.

const HERO_SRC = heroBg

// Oscurece arriba y abajo y deja el centro limpio, que es donde vive
// la frase de la foto.
const SCRIM =
  'linear-gradient(180deg, rgba(0, 0, 0, 0.92) 0%, rgba(26, 24, 23, 0.3) 26%, ' +
  'rgba(12, 12, 11, 0.3) 58%, rgba(12, 12, 12, 0.85) 88%, #151312 100%)'

const MotionBox = motion(Box)

export default function HomePage() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const clubCount = getClubsWithPlayers().length

  return (
    <Box>
      <Box
        position="relative"
        h={{ base: '58vh', md: '62vh', lg: '68vh' }}
        minH={{ base: '360px', lg: '440px' }} 
        bgColor="brand.dark"
      >

        <Image
          src={HERO_SRC}
          alt="Hero"
          objectFit="cover"
          w="60%"
          h="100%"
          position="absolute"
          top={0}
          left={80}
          backgrounColor="brand.dark"
        />
        <Box position="absolute" inset={0} backgroundImage={SCRIM} />

        <Flex
          position="relative"
          direction="column"
          h="100%"
          px={{ base: 5, md: 8, lg: 12 }}
          pt={{ base: 6, md: 9 }}
          pb={{ base: 5, md: 8 }}
        >
          <MotionBox
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <VStack align="flex-start" spacing={3}>
              <BrandLogo height={{ base: '38px', md: '52px' }} fontSize="3xl" />
              <Flex align="center" gap={2}>
                <Box w="22px" h="2px" bg="brand.orange" />
                <Text
                  fontFamily="mono" fontSize={{ base: '10px', md: 'xs' }} color="brand.gray"
                  textTransform="uppercase" letterSpacing="widest"
                >
                  Panel Central de Resultados
                </Text>
              </Flex>
            </VStack>
          </MotionBox>
        </Flex>
      </Box>

      <PageContainer maxW="900px">
        <Text
          fontFamily="mono" fontSize="10px" color="brand.gray"
          textTransform="uppercase" letterSpacing="widest" mb={4}
        >
          ¿Por dónde querés empezar?
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 3, md: 5 }}>
          <HomeShortcut
            icon={FiUsers}
            label="Jugadores"
            description="Cargar partido a uno"
            count={players.length}
            onClick={() => navigate('/jugadores')}
            delay={0.08}
          />
          <HomeShortcut
            icon={FiShield}
            label="Clubes"
            description="Cargar partido a todo el club"
            count={clubCount}
            onClick={() => navigate('/clubes')}
            delay={0.16}
          />
        </SimpleGrid>
      </PageContainer>
    </Box>
  )
}
