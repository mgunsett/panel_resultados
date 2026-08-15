import { Box, Flex, HStack, VStack, Text, Badge } from '@chakra-ui/react'
import { FiGlobe, FiAward, FiMapPin } from 'react-icons/fi'
import ClubCrest from './ClubCrest'

// Un dato del club con su ícono. Los datos salen de src/data/clubs.js,
// no de Firestore: son fichas de contexto, no algo que la landing lea.
function ClubMeta({ icon: Icon, value }) {
  if (!value) return null

  return (
    <HStack spacing={2} minW={0}>
      <Box color="brand.orange" display="flex" flexShrink={0}>
        <Icon size={13} />
      </Box>
      <Text
        fontFamily="mono" fontSize={{ base: '11px', md: 'xs' }} color="brand.gray"
        letterSpacing="wider" textTransform="uppercase" noOfLines={1}
      >
        {value}
      </Text>
    </HStack>
  )
}

export default function ClubBanner({ club }) {
  const count = club.players.length

  return (
    <Box
      bg="brand.dark2"
      bgGradient="linear(to-r, brand.brownDark, brand.dark2)"
      border="1px solid"
      borderColor="brand.brownDark"
      borderRadius="xl"
      overflow="hidden"
      mb={{ base: 5, md: 7 }}
    >
      <Flex
        align={{ base: 'flex-start', sm: 'center' }}
        gap={{ base: 4, md: 5 }}
        p={{ base: 4, md: 6 }}
      >
        <ClubCrest club={club} size={{ base: '64px', md: '92px' }} fontSize="2xl" />

        <VStack align="stretch" spacing={{ base: 2, md: 3 }} minW={0} flex={1}>
          <Flex align="center" gap={3} wrap="wrap">
            <Text
              fontFamily="heading" fontSize={{ base: '2xl', md: '4xl' }}
              color="white" lineHeight={1}
            >
              {club.name}
            </Text>
            <Badge
              fontFamily="mono" fontSize="9px" letterSpacing="widest"
              bg="brand.orangeSoft" color="brand.orange"
              border="1px solid" borderColor="brand.orange"
              px={2} py={0.5}
            >
              {count} {count === 1 ? 'jugador' : 'jugadores'}
            </Badge>
          </Flex>

          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={{ base: 1.5, md: 5 }}
            wrap="wrap"
          >
            <ClubMeta icon={FiGlobe} value={club.country} />
            <ClubMeta icon={FiAward} value={club.competition} />
            <ClubMeta icon={FiMapPin} value={club.stadium} />
          </Flex>
        </VStack>
      </Flex>
    </Box>
  )
}
