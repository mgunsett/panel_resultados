import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Box, Spinner } from '@chakra-ui/react'
import { useAuth } from './lib/auth'
import { isFirebaseConfigured } from './lib/firebase'
import NotConfigured from './components/ui/NotConfigured'
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
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <PlayersPage />
          </Protected>
        }
      />
      <Route
        path="/jugador/:slug"
        element={
          <Protected>
            <PlayerDetailPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
