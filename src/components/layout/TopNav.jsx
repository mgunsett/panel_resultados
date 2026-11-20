import {
  Box, Flex, HStack, Text, Button, IconButton, Menu, MenuButton, MenuList, MenuItem,
} from '@chakra-ui/react'
import { FiMenu, FiRefreshCw, FiLogOut, FiUser } from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../lib/auth'
import { useSyncAll } from '../../lib/syncContext'
import { nextScheduledSync, formatTime, formatWhen } from '../../lib/homeData'
import { NAV_ITEMS, isItemActive } from './SidebarNav'
import BrandLogo from '../ui/BrandLogo'

const MotionBox = motion(Box)

// ─── BARRA SUPERIOR ──────────────────────────────────────────────
// Marca, secciones y "Sincronizar ahora" (como el Modelo B). En
// pantallas chicas las secciones pasan al menú lateral (Drawer).

function SyncStatus() {
  const { running, progress, lastRunAt } = useSyncAll()
  const label = running
    ? `Sincronizando ${progress}`
    : lastRunAt
      ? `Sincronizado ${formatTime(lastRunAt)} · próxima ${formatWhen(nextScheduledSync())}`
      : `Automática · próxima ${formatWhen(nextScheduledSync())}`
  return (
    <HStack
      spacing={2} px={3.5} h="40px" borderRadius="full" bg="rgba(21,19,18,0.85)"
      border="1px solid" borderColor="#2e2825" display={{ base: 'none', md: 'flex' }} maxW="320px"
    >
      <MotionBox
        boxSize="8px" borderRadius="full" flexShrink={0}
        bg={running ? 'brand.orange' : '#5fd38d'}
        animate={running ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
        transition={running ? { repeat: Infinity, duration: 1.1 } : { duration: 0.2 }}
      />
      <Text fontSize="13px" color="brand.amber" noOfLines={1}>{label}</Text>
    </HStack>
  )
}

export default function TopNav({ onOpenMenu }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { running, runSync } = useSyncAll()

  return (
    <Flex
      as="header" position="sticky" top={0} zIndex={20}
      align="center" gap={{ base: 2, md: 3 }} wrap="nowrap"
      px={{ base: 3, md: 6, lg: 10 }} h={{ base: '60px', md: '68px' }}
      bg="rgba(13,12,11,0.88)" backdropFilter="blur(12px)"
      borderBottom="1px solid" borderColor="#2e2825"
    >
      <IconButton
        display={{ base: 'inline-flex', lg: 'none' }}
        icon={<FiMenu size={20} />} aria-label="Abrir menú" variant="ghost"
        color="brand.gray" _hover={{ color: 'white', bg: 'brand.brownLight' }} onClick={onOpenMenu}
      />
      <Box as="button" type="button" onClick={() => navigate('/')} mr={{ base: 0, lg: 4 }} flexShrink={0}
        _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '4px' }}>
        <BrandLogo height="28px" fontSize="2xl" />
      </Box>

      <HStack as="nav" aria-label="Secciones" spacing={1} display={{ base: 'none', lg: 'flex' }}>
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item, pathname)
          return (
            <Button
              key={item.to} onClick={() => navigate(item.to)} size="sm" h="38px" px={3.5}
              borderRadius="full" variant="unstyled" display="inline-flex"
              fontFamily="mono" fontSize="14px" fontWeight="normal" letterSpacing="0.14em" textTransform="uppercase"
              bg={active ? 'brand.orange' : 'transparent'} color={active ? 'brand.brown' : 'brand.gray'}
              _hover={{ color: active ? 'brand.brown' : 'white', bg: active ? 'brand.orange' : 'whiteAlpha.100' }}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </Button>
          )
        })}
      </HStack>

      <Box flex={1} />

      <SyncStatus />
      <Button
          aria-label="Sincronizar ahora"
          onClick={runSync} isLoading={running} loadingText="Sincronizando"
          leftIcon={<FiRefreshCw size={16} />} h="44px" px={{ base: 3, md: 4 }} flexShrink={0}
          bg="brand.orange" color="brand.brown" borderRadius="md"
          fontFamily="mono" fontSize="14px" fontWeight="600" letterSpacing="0.12em" textTransform="uppercase"
          _hover={{ bg: '#ffb35e' }} _active={{ bg: 'brand.orangeDark' }}
          sx={{ '@media (max-width: 47.99em)': { '.chakra-button__icon': { marginInlineEnd: 0 } } }}
        >
          <Box as="span" display={{ base: 'none', md: 'inline' }}>Sincronizar ahora</Box>
        </Button>

      <Menu placement="bottom-end">
        <MenuButton as={IconButton} icon={<FiUser size={18} />} aria-label="Cuenta" variant="ghost"
          color="brand.gray" _hover={{ color: 'white', bg: 'brand.brownLight' }} flexShrink={0} />
        <MenuList bg="brand.dark2" borderColor="brand.brownDark" fontSize="sm" zIndex={30}>
          <Text px={3} py={2} fontFamily="mono" fontSize="12px" color="brand.gray">{user?.email}</Text>
          <MenuItem icon={<FiLogOut />} bg="transparent" _hover={{ bg: 'brand.brownLight' }} onClick={logout}>
            Salir
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  )
}
