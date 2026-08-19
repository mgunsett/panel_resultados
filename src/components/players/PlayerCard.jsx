import { useState } from 'react'
import { Box, Flex, HStack, VStack, Text, Image, Badge } from '@chakra-ui/react'
import { motion, useReducedMotion } from 'framer-motion'
import { playerInitials } from '../../data/players'
import { getClub } from '../../data/clubs'
import ClubCrest from '../clubs/ClubCrest'

const MotionBox = motion(Box)

export default function PlayerCard({ player, onClick, index = 0 }) {
  const [imgFailed, setImgFailed] = useState(false)
  const reduceMotion = useReducedMotion()
  const showImage = player.photo && !imgFailed
  const club = getClub(player.clubId)

  return (
    <MotionBox
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.3) }}
      // El lift del hover va por framer-motion y no por _hover de Chakra:
      // framer-motion escribe transform inline y le ganaría a la clase CSS.
      whileHover={reduceMotion ? undefined : { y: -3 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      as="button"
      type="button"
      onClick={onClick}
      textAlign="left"
      bg="brand.dark"
      border="1px solid"
      borderColor="brand.brownDark"
      borderRadius="lg"
      overflow="hidden"
      cursor="pointer"
      transitionProperty="border-color"
      transitionDuration="0.2s"
      role="group"
      _grouphover={{ borderColor: 'brand.orange' }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'brand.amber', outlineOffset: '2px' }}
    >
      {/* Foto */}
      <Box position="relative" w="100%" h={{ base: '150px', md: '300px' }} bg="brand.brown">
        {showImage ? (
          <Image
            src={player.photo}
            alt={player.name}
            w="100%"
            h="100%"
            objectFit="cover"
            objectPosition="top center"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Flex w="100%" h="100%" align="center" justify="center" bg="brand.brownLight">
            <Text fontFamily="heading" fontSize="4xl" color="brand.amber">
              {playerInitials(player.name)}
            </Text>
          </Flex>
        )}

        {player.role && (
          <Badge
            position="absolute" top={2} right={2}
            fontFamily="mono" fontSize="8px" letterSpacing="widest"
            bg="brand.amberLight" color="brand.amber"
            border="1px solid" borderColor="brand.amber"
            px={2} py={0.5}
          >
            {player.role}
          </Badge>
        )}
      </Box>

      {/* Datos */}
      <VStack align="stretch" spacing={1} px={4} py={3}>
        <Text
          fontFamily="heading" fontSize={{ base: 'lg', md: '2xl' }} color="white" transition="color 0.2s"
          lineHeight={1.1} noOfLines={1} _groupHover={{ color: 'brand.orange' }}
        >
          {player.name}
        </Text>
        <HStack spacing={2} minW={0}>
          {club && <ClubCrest club={club} size="30px" fontSize="9px" />}
          <Text
            fontFamily="mono" fontSize="12px" color="brand.gray" _groupHover={{ color: 'brand.bone' }}
            letterSpacing="widest" textTransform="uppercase" noOfLines={1}
          >
            {club?.name || 'Sin club'}
          </Text>
        </HStack>
      </VStack>
    </MotionBox>
  )
}
