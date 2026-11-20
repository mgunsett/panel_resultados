import { useState } from 'react'
import { Box, Flex, Text, Image, SimpleGrid } from '@chakra-ui/react'
import { motion, useReducedMotion } from 'framer-motion'
import { playerInitials } from '../../data/players'
import ClubCrest from '../clubs/ClubCrest'

const MotionBox = motion(Box)

export const STATUS_COLORS = { ok: '#8fe3ae', rev: '#F9A03F', dt: '#DBCCAF' }

const dash = (v, fmt) => (v === null || v === undefined ? '—' : fmt ? fmt(v) : String(v))

// Tarjeta del jugador en la grilla del home: foto, estado de la
// landing, próximo partido y mini estadísticas de la temporada.
export default function ShowcaseCard({ row, selected, onSelect, index = 0 }) {
  const { player, club, stats, status, nextLabel } = row
  const [imgFailed, setImgFailed] = useState(false)
  const reduceMotion = useReducedMotion()
  const s = stats.season || {}

  return (
    <MotionBox
      as="button" type="button" onClick={() => onSelect(player.slug)}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.3) }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      display="flex" flexDirection="column" textAlign="left" p={0} borderRadius="14px" overflow="hidden"
      border="1px solid" borderColor={selected ? 'brand.orange' : '#2e2825'}
      boxShadow={selected ? '0 0 0 1px #F9A03F' : 'none'}
      bg="brand.dark2" color="white" transitionProperty="border-color" transitionDuration="0.18s"
      _hover={{ borderColor: selected ? 'brand.orange' : 'brand.amberDark' }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '2px' }}
      aria-pressed={selected}
    >
      <Box position="relative" h={{ base: "170px", md: "200px" }} w="100%" bg="#2a2420">
        {player.photo && !imgFailed ? (
          <Image src={player.photo} alt="" w="100%" h="100%" objectFit="cover" objectPosition="top" onError={() => setImgFailed(true)} />
        ) : (
          <Flex w="100%" h="100%" align="center" justify="center" fontFamily="heading" fontSize="5xl" color="brand.amber">{playerInitials(player.name)}</Flex>
        )}
        <Box position="absolute" left={0} right={0} bottom={0} h="70px" bgGradient="linear(to-t, #1E1B19, rgba(30,27,25,0))" />
        <Flex position="absolute" top="10px" left="10px" align="center" gap="6px" px={2.5} py={1} borderRadius="full" bg="rgba(13,12,11,.82)"
          fontFamily="mono" fontSize="12px" letterSpacing="0.1em" textTransform="uppercase" color={STATUS_COLORS[status.id]}>
          <Box boxSize="7px" borderRadius="full" bg={STATUS_COLORS[status.id]} />
          {status.label}
        </Flex>
        {club && (
          <Box position="absolute" right="10px" bottom="8px">
            <ClubCrest club={club} size="36px" fontSize="9px" />
          </Box>
        )}
      </Box>
      <Flex direction="column" gap={2} px={3.5} pt={2.5} pb={3.5} w="100%">
        <Box>
          <Text fontFamily="heading" fontSize="24px" lineHeight={1.05} noOfLines={1}>{player.name}</Text>
          <Text fontFamily="mono" fontSize="13px" letterSpacing="0.1em" textTransform="uppercase" color="brand.gray" noOfLines={1}>{club?.name || 'Sin club'}</Text>
        </Box>
        <Text fontSize="13px" color="brand.amber" noOfLines={1}>{nextLabel ? `Próx: ${nextLabel}` : 'Sin próximo partido cargado'}</Text>
        <SimpleGrid columns={4} spacing={1} borderTop="1px solid" borderColor="#2e2825" pt={2}>
          {[['PJ', dash(s.partidos)], ['G', dash(s.goles)], ['A', dash(s.asistencias)], ['RAT', dash(s.rating, (x) => Number(x).toFixed(1))]].map(([k, v]) => (
            <Flex key={k} direction="column" align="center">
              <Text fontFamily="heading" fontSize="20px" lineHeight={1}>{v}</Text>
              <Text fontFamily="mono" fontSize="10px" letterSpacing="0.14em" color="brand.gray">{k}</Text>
            </Flex>
          ))}
        </SimpleGrid>
      </Flex>
    </MotionBox>
  )
}
