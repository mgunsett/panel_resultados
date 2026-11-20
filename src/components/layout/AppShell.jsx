import { Box, Drawer, DrawerOverlay, DrawerContent, useDisclosure } from '@chakra-ui/react'
import SidebarNav from './SidebarNav'
import TopNav from './TopNav'
import { SyncProvider } from '../../lib/syncContext'

// ─── ESTRUCTURA DEL PANEL ────────────────────────────────────────
// Barra superior fija con las secciones y "Sincronizar ahora". En
// mobile/tablet las secciones salen en un Drawer con la misma nav de
// siempre (SidebarNav), disparado desde la barra.

export const SIDEBAR_WIDTH = '240px'

export default function AppShell({ children }) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <SyncProvider>
      <Box minH="100vh" bg="#0d0c0b">
        <TopNav onOpenMenu={onOpen} />
        <Box minW={0}>{children}</Box>

        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay bg="rgba(0,0,0,0.65)" />
          <DrawerContent bg="brand.dark2" maxW={SIDEBAR_WIDTH}>
            {/* onNavigate cierra el drawer al tocar un item: en mobile
                quedaría tapando la vista a la que acabás de entrar. */}
            <SidebarNav onNavigate={onClose} />
          </DrawerContent>
        </Drawer>
      </Box>
    </SyncProvider>
  )
}
