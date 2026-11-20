import { Box, Flex, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import ClubCrest from './ClubCrest'
import { CLUB_STATUS } from '../../lib/clubsData'

// ─── FRANJA DE ESCUDOS ───────────────────────────────────────────
// Todos los clubes en chico, a todo el ancho, para saltar a uno sin
// volver a la grilla. Un punto naranja marca los que tienen aviso.
//   items     [{ club, status }]
//   current   id del club abierto (se marca en naranja)
//   dimmed    Set de ids que el filtro de la grilla deja afuera
export default function CrestStrip({ items, current, dimmed }) {
  const navigate = useNavigate()

  return (
    <Box
      as="nav" aria-label="Elegir club" bg="#050404" borderBottom="1px solid" borderColor="#2e2825" overflowX="auto"
      sx={{ scrollbarWidth: 'thin', scrollbarColor: '#3a2f27 transparent' }}
    >
      <Flex justify="center" gap={1} w="max-content" minW="100%" px={{ base: 4, md: 6, lg: 10 }} py={2.5}>
        {items.map(({ club, status }) => {
          const on = club.id === current
          const warn = status && status.id !== 'ok'
          return (
            <Flex
              key={club.id} as="button" type="button" onClick={() => navigate(`/club/${club.id}`)}
              aria-label={`Abrir ${club.name}`} aria-current={on ? 'page' : undefined}
              title={warn ? `${club.name} · ${CLUB_STATUS[status.id].label}` : club.name}
              position="relative" direction="column" align="center" gap={1.5} w="80px" px={1} pt={2} pb={1.5}
              borderRadius="10px" border="1px solid" borderColor={on ? 'rgba(249,160,63,.6)' : 'transparent'}
              bg={on ? 'rgba(249,160,63,.1)' : 'transparent'} color={on ? 'brand.orange' : 'brand.gray'}
              opacity={dimmed?.has(club.id) ? 0.35 : 1} transition="background .15s, opacity .15s"
              _hover={{ bg: on ? 'rgba(249,160,63,.1)' : '#17120e', color: on ? 'brand.orange' : 'white', opacity: 1, '& img': { transform: 'translateY(-2px)' } }}
              _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '-2px' }}
              sx={{ '& img': { transition: 'transform .15s' } }}
            >
              <ClubCrest club={club} size="36px" fontSize="xs" />
              <Text maxW="100%" fontFamily="mono" fontSize="11px" letterSpacing="0.08em" textTransform="uppercase" noOfLines={1}>{club.name}</Text>
              {warn && <Box position="absolute" top="7px" right="18px" boxSize="8px" borderRadius="full" bg="brand.orange" boxShadow="0 0 0 2px #050404" aria-hidden="true" />}
            </Flex>
          )
        })}
      </Flex>
    </Box>
  )
}
