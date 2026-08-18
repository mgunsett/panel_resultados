import { Box, Flex, VStack, SimpleGrid, Text, Image, useBreakpoint } from '@chakra-ui/react'
import { FiUsers, FiShield } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { players, getClubsWithPlayers } from '../data/players'

import HomeShortcut from '../components/home/HomeShortcut'
import PageContainer from '../components/layout/PageContainer'
import heroBg from '../assets/fondo_led.webp'
import heroBgMobile from '../assets/fondo_led2.webp'


const HERO_SRC = heroBg
const HERO_SRC_MOBILE = heroBgMobile


const MotionBox = motion(Box)

export default function HomePage() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const clubCount = getClubsWithPlayers().length
  
  const breakpoint = useBreakpoint()
  const heroBackground = breakpoint === 'base' ? HERO_SRC_MOBILE : HERO_SRC

  return (
    <Box>
      <Box
        position="relative"
        h={{ base: '58vh', md: '62vh', lg: '78vh' }}
        minH={{ base: '360px', lg: '440px' }} 
        bgColor="brand.dark"
      >
        <Image
          src={heroBackground}
          fallbackSrc={HERO_SRC_MOBILE}
          alt="Hero"
          objectFit="cover"
          w="100%"
          h={{ base: '100%', md: '100%', lg: '102%' }}
          position="absolute"
          top={0}
          left={0}
          backgroundColor="brand.dark"
        />
       
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
              <Text
                fontFamily="heading"
                fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }}
                lineHeight={1}
                letterSpacing="wide"
                color="white"
                fontStyle="medium"
                whiteSpace="nowrap"
              >
                <Text as="span" color="brand.orange">PANEL</Text> _ADMIN
              </Text>
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

      <PageContainer maxW="800px">
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
