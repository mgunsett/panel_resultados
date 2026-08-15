import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Box, Spinner } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './lib/auth'
import { isFirebaseConfigured } from './lib/firebase'
import NotConfigured from './components/ui/NotConfigured'
import PageTransition from './components/ui/PageTransition'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import PlayersPage from './pages/PlayersPage'
import PlayerDetailPage from './pages/PlayerDetailPage'
import ClubsPage from './pages/ClubsPage'
import ClubDetailPage from './pages/ClubDetailPage'

// Gate general: sin sesión no se ve nada del panel.
function Protected({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (!isFirebaseConfigured) return <NotConfigured />

  if (loading) {
    return (
      <Box minH="100vh" bg="brand.dark" display="flex" alignItems="center" justifyContent="center">
        <Spinner color="brand.amber" size="lg" />
      </Box>
    )
  }

  if (!user) {
    // Guardamos la ruta completa (con query) para volver acá post-login.
    const from = location.pathname + location.search
    return <Navigate to="/login" state={{ from }} replace />
  }

  return children
}

// Entrar a un detalle desde una grilla scrolleada dejaba la vista nueva
// a mitad de camino: el navegador conserva el scroll entre rutas.
function useScrollToTop(pathname) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
}

// Las rutas del panel viven dentro del AppShell, que queda montado
// entre navegaciones: sólo anima el contenido, el sidebar no parpadea.
// El <Routes> interno usa paths relativos porque cuelga del "/*" de
// abajo.
function PanelRoutes() {
  const location = useLocation()
  useScrollToTop(location.pathname)

  return (
    <AppShell>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route index element={<PageTransition><HomePage /></PageTransition>} />
          <Route path="jugadores" element={<PageTransition><PlayersPage /></PageTransition>} />
          <Route path="jugador/:slug" element={<PageTransition><PlayerDetailPage /></PageTransition>} />
          <Route path="clubes" element={<PageTransition><ClubsPage /></PageTransition>} />
          <Route path="club/:clubId" element={<PageTransition><ClubDetailPage /></PageTransition>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </AppShell>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <Protected>
            <PanelRoutes />
          </Protected>
        }
      />
    </Routes>
  )
}
