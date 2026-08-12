import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Box, Spinner } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './lib/auth'
import { isFirebaseConfigured } from './lib/firebase'
import NotConfigured from './components/ui/NotConfigured'
import PageTransition from './components/ui/PageTransition'
import LoginPage from './pages/LoginPage'
import PlayersPage from './pages/PlayersPage'
import PlayerDetailPage from './pages/PlayerDetailPage'

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

export default function App() {
  const location = useLocation()

  return (
    // `location` + `key` explícitos: sin esto AnimatePresence no ve el
    // cambio de ruta y nunca dispara el exit de la vista saliente.
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <PageTransition>
              <LoginPage />
            </PageTransition>
          }
        />
        <Route
          path="/"
          element={
            <Protected>
              <PageTransition>
                <PlayersPage />
              </PageTransition>
            </Protected>
          }
        />
        <Route
          path="/jugador/:slug"
          element={
            <Protected>
              <PageTransition>
                <PlayerDetailPage />
              </PageTransition>
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
