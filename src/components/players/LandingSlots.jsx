import { Box, Button, Flex, Image, SimpleGrid, Text } from '@chakra-ui/react'
import { FiEdit3 } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { SOURCE_COLORS, slotSource, slotView } from '../../lib/profileData'
import ClubCrest from '../clubs/ClubCrest'

const SLOTS = [
  { id: 'last', title: 'Último partido' },
  { id: 'next', title: 'Próximo partido' },
]

function Shield({ src, club }) {
  if (src) return <Image src={src} alt="" boxSize="44px" objectFit="contain" flexShrink={0} />
  return club ? <ClubCrest club={club} size="44px" fontSize="xs" /> : null
}

// ─── ASÍ SE VE EN SU LANDING ─────────────────────────────────────
// Los dos partidos que muestra la landing (matches/last y next), con
// de dónde salen y qué significa cada estado, y un atajo para editar.
export default function LandingSlots({ player, club, matches }) {
  const navigate = useNavigate()

  return (
    <Flex direction="column" gap={4} p={5} borderRadius="16px" bg="brand.dark2" border="1px solid" borderColor="#2e2825">
      <Box>
        <Text as="h2" fontFamily="heading" fontSize="28px" lineHeight={1}>Así se ve en su landing</Text>
        <Text mt={1} fontSize="14px" color="brand.gray">Los dos partidos que muestra su landing en este momento</Text>
      </Box>
      <SimpleGrid minChildWidth="280px" spacing={3}>
        {SLOTS.map((slot) => {
          const m = matches?.[slot.id]
          const src = slotSource(m, club)
          const view = slotView(m)
          const tone = SOURCE_COLORS[src.id]
          return (
            <Flex key={slot.id} direction="column" gap={3.5} p={5} borderRadius="14px" bg="#151312" border="1px solid" borderColor="#2e2825" minW={0}>
              <Flex align="center" justify="space-between" gap={2.5}>
                <Text fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray">{slot.title}</Text>
                <Flex align="center" gap={1.5} px={2.5} py={1} borderRadius="full" bg={tone.bg} color={tone.color}
                  fontFamily="mono" fontSize="12px" letterSpacing="0.1em" textTransform="uppercase">
                  <Box boxSize="6px" borderRadius="full" bg={tone.color} />{src.label}
                </Flex>
              </Flex>
              {view ? (
                <Flex align="center" gap={3}>
                  <Shield src={view.homeShield} />
                  <Box flex={1} minW={0}>
                    <Text fontFamily="heading" fontSize="28px" lineHeight={0.95}>{view.title}</Text>
                    {view.meta && <Text mt={1} fontSize="14px" color="brand.gray" noOfLines={1}>{view.meta}</Text>}
                  </Box>
                  <Shield src={view.awayShield} />
                </Flex>
              ) : (
                <Text fontSize="15px" color="brand.gray">Sin partido cargado.</Text>
              )}
              <Flex align="center" gap={3} pt={3} borderTop="1px solid" borderColor="#2e2825">
                <Text flex={1} fontSize="13px" color="brand.gray" lineHeight={1.35}>{src.help}</Text>
                <Button size="sm" h="36px" variant="outline" borderColor="brand.brownDark" color="brand.amber" leftIcon={<FiEdit3 />}
                  fontFamily="mono" fontSize="13px" letterSpacing="0.1em" textTransform="uppercase" _hover={{ bg: 'brand.brownLight', color: 'white' }}
                  aria-label={`Editar ${slot.title.toLowerCase()}`}
                  onClick={() => navigate(`/jugador/${player.slug}?tab=carga`)}>
                  Editar
                </Button>
              </Flex>
            </Flex>
          )
        })}
      </SimpleGrid>
    </Flex>
  )
}
