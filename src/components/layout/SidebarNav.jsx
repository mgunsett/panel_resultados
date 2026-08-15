import { Box, VStack, HStack, Flex, Text, Button, Divider } from '@chakra-ui/react'
import { FiHome, FiUsers, FiShield, FiLogOut } from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { players, getClubsWithPlayers } from '../../data/players'
import BrandLogo from '../ui/BrandLogo'

// Un item queda activo también en sus rutas hijas: estando en
// /jugador/luis_ramos el resaltado tiene que seguir en "Jugadores".
const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: FiHome, exact: true },
  { to: '/jugadores', label: 'Jugadores', icon: FiUsers, extraPaths: ['/jugador'] },
  { to: '/clubes', label: 'Clubes', icon: FiShield, extraPaths: ['/club'] },
]

function isItemActive(item, pathname) {
  if (item.exact) return pathname === item.to
  if (pathname === item.to || pathname.startsWith(`${item.to}/`)) return true
  return (item.extraPaths || []).some((p) => pathname.startsWith(`${p}/`))
}

function NavItem({ item, active, count, onClick }) {
  const Icon = item.icon

  return (
    <Flex
      as="button"
      type="button"
      onClick={onClick}
      align="center"
      gap={3}
      w="100%"
      px={3}
      py={2.5}
      borderRadius="md"
      borderLeft="2px solid"
      borderColor={active ? 'brand.orange' : 'transparent'}
      bg={active ? 'brand.orangeSoft' : 'transparent'}
      color={active ? 'white' : 'brand.gray'}
      transition="background 0.18s, color 0.18s"
      _hover={{ bg: active ? 'brand.orangeSoft' : 'brand.brownLight', color: 'white' }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '2px' }}
    >
      <Box color={active ? 'brand.orange' : 'inherit'} display="flex">
        <Icon size={17} />
      </Box>
      <Text
        fontFamily="mono" fontSize="sm" letterSpacing="widest"
        textTransform="uppercase" flex={1} textAlign="left"
      >
        {item.label}
      </Text>
      {count != null && (
        <Text fontFamily="mono" fontSize="11px" color={active ? 'brand.orange' : 'brand.brownLight'}>
          {count}
        </Text>
      )}
    </Flex>
  )
}

export default function SidebarNav({ onNavigate }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const counts = { '/jugadores': players.length, '/clubes': getClubsWithPlayers().length }

  const go = (to) => () => {
    navigate(to)
    onNavigate?.()
  }

  return (
    <Flex direction="column" h="100%" px={4} py={5}>
      <Box
        as="button" type="button" onClick={go('/')}
        alignSelf="flex-start" mb={7} px={1}
        _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '4px' }}
      >
        <BrandLogo height="30px" fontSize="lg" />
      </Box>

      <VStack as="nav" spacing={1} align="stretch" flex={1}>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.to}
            item={item}
            active={isItemActive(item, pathname)}
            count={counts[item.to]}
            onClick={go(item.to)}
          />
        ))}
      </VStack>

      <Divider borderColor="brand.brownDark" my={4} />

      <VStack align="stretch" spacing={2}>
        <HStack spacing={2} px={1} minW={0}>
          <Box boxSize="6px" borderRadius="full" bg="brand.orange" flexShrink={0} />
          <Text fontFamily="mono" fontSize="10px" color="brand.gray" noOfLines={1}>
            {user?.email}
          </Text>
        </HStack>
        <Button
          variant="ghost"
          justifyContent="flex-start"
          color="brand.gray"
          fontFamily="mono" fontSize="xs"
          letterSpacing="widest" textTransform="uppercase"
          leftIcon={<FiLogOut />}
          _hover={{ color: 'white', bg: 'brand.brownLight' }}
          onClick={logout}
        >
          Salir
        </Button>
      </VStack>
    </Flex>
  )
}
