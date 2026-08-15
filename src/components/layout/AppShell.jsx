import { Box, Flex, IconButton, Drawer, DrawerOverlay, DrawerContent, useDisclosure } from '@chakra-ui/react'
import { FiMenu } from 'react-icons/fi'
import SidebarNav from './SidebarNav'
import BrandLogo from '../ui/BrandLogo'

// ─── ESTRUCTURA DEL PANEL ────────────────────────────────────────
// Desktop (lg+): sidebar fijo a la izquierda, contenido corrido.
// Mobile/tablet: el mismo sidebar sale en un Drawer, disparado por la
// barra superior sticky. La nav es el mismo componente en los dos
// casos, así no hay dos menús que mantener sincronizados.

export const SIDEBAR_WIDTH = '240px'

export default function AppShell({ children }) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Flex minH="100vh" bg="brand.dark">
      <Box
        as="aside"
        display={{ base: 'none', lg: 'block' }}
        position="fixed"
        top={0} left={0} bottom={0}
        w={SIDEBAR_WIDTH}
        bg="brand.dark2"
        borderRight="1px solid"
        borderColor="brand.brownDark"
        zIndex={20}
      >
        <SidebarNav />
      </Box>

      <Box flex={1} minW={0} ml={{ base: 0, lg: SIDEBAR_WIDTH }}>
        <Flex
          display={{ base: 'flex', lg: 'none' }}
          position="sticky" top={0} zIndex={15}
          align="center" gap={3}
          px={4} py={3}
          bg="rgba(21,19,18,0.92)"
          backdropFilter="blur(10px)"
          borderBottom="1px solid"
          borderColor="brand.brownDark"
        >
          <IconButton
            icon={<FiMenu size={20} />}
            aria-label="Abrir menú"
            variant="ghost"
            color="brand.gray"
            _hover={{ color: 'white', bg: 'brand.brownLight' }}
            onClick={onOpen}
          />
          <BrandLogo height="24px" fontSize="md" />
        </Flex>

        {children}
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay bg="rgba(0,0,0,0.65)" />
        <DrawerContent bg="brand.dark2" maxW={SIDEBAR_WIDTH}>
          {/* onNavigate cierra el drawer al tocar un item: en mobile
              quedaría tapando la vista a la que acabás de entrar. */}
          <SidebarNav onNavigate={onClose} />
        </DrawerContent>
      </Drawer>
    </Flex>
  )
}
