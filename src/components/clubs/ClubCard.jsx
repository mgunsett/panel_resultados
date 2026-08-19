import { Box, Flex, VStack, Text, Badge } from '@chakra-ui/react'
import { motion, useReducedMotion } from 'framer-motion'
import ClubCrest from './ClubCrest'

const MotionBox = motion(Box)

export default function ClubCard({ club, onClick, index = 0 }) {
  const reduceMotion = useReducedMotion()
  const count = club.players.length

  return (
    <MotionBox
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.3) }}
      // Mismo criterio que PlayerCard: el lift va por framer-motion,
      // que escribe transform inline y le ganaría a un _hover de Chakra.
      whileHover={reduceMotion ? undefined : { y: -3 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      as="button"
      type="button"
      onClick={onClick}
      textAlign="left"
      bg="brand.dark2"
      border="1px solid"
      borderColor="brand.brownDark"
      borderRadius="lg"
      overflow="hidden"
      cursor="pointer"
      transitionProperty="border-color"
      transitionDuration="0.2s"
      _hover={{ borderColor: 'brand.orange' }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '2px' }}
    >
      <Flex
        position="relative"
        align="center" justify="center"
        h={{ base: '120px', md: '150px' }}
        bgGradient="linear(to-b, brand.brownDark, brand.dark2)"
      >
        <ClubCrest club={club} size={{ base: '68px', md: '86px' }} fontSize="2xl" />

        <Badge
          position="absolute" top={2} right={2}
          fontFamily="mono" fontSize="10px" letterSpacing="widest"
          bg="transparent" color="brand.orange"
          border="1px solid" borderColor="brand.orange"
          px={2} py={0.5}
        >
          {count} {count === 1 ? 'jugador' : 'jugadores'}
        </Badge>
      </Flex>

      <VStack
        align="stretch" spacing={1}
        px={4} py={3}
        borderTop="1px solid" borderColor="brand.brownDark"
      >
        <Text
          fontFamily="heading" fontSize={{ base: 'lg', md: '2xl' }} color="white"
          lineHeight={1.1} noOfLines={1}
        >
          {club.name}
        </Text>
        <Text
          fontFamily="mono" fontSize="11px" color="brand.gray"
          letterSpacing="widest" textTransform="uppercase" noOfLines={1}
        >
          {club.country} · {club.competition}
        </Text>
      </VStack>
    </MotionBox>
  )
}
