import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { Box, Spinner } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './lib/auth'
import { useRoster } from './lib/rosterStore'
import { isFirebaseConfigured } from './lib/firebase'
import NotConfigured from './components/ui/NotConfigured'
import PageTransition from './components/ui/PageTransition'
import AppShell from './components/layout/AppShell'
import { ForcedPasswordChange } from './components/account/ChangePassword'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import PlayersPage from './pages/PlayersPage'
import PlayerDetailPage from './pages/PlayerDetailPage'
import ClubsPage from './pages/ClubsPage'
import ClubDetailPage from './pages/ClubDetailPage'
import SyncPage from './pages/SyncPage'
import NewPlayerPage from './pages/NewPlayerPage'
import StatsPage from './pages/StatsPage'

// Gate general: sin sesión no se ve nada del panel. Qué rutas ve cada
// cuenta lo decide RoleRoutes (admin: todo; jugador: su ficha).
function Protected({ children }) {
  const { user, loading } = useAuth()
  const roster = useRoster()
  const location = useLocation()

  if (!isFirebaseConfigured) return <NotConfigured />

  // Con sesión, espera también a los jugadores dados de alta desde el
  // panel (Firestore): sin eso sus fichas darían "no encontrado".
  if (loading || (user && !roster.ready)) {
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

// Cuenta de jugador: sólo su ficha. Cualquier otra ruta (inicio, otro
// jugador, clubes, sincronización…) vuelve a /jugador/<su slug>.
function OwnPlayerOnly({ to, children }) {
  const { slug } = useParams()
  const { playerSlug } = useAuth()
  return slug === playerSlug ? children : <Navigate to={to} replace />
}

function PlayerRoutes() {
  const location = useLocation()
  const { playerSlug } = useAuth()
  useScrollToTop(location.pathname)
  const own = `/jugador/${playerSlug}`

  return (
    <AppShell>
      <Routes location={location}>
        <Route path="jugador/:slug" element={<OwnPlayerOnly to={own}><PageTransition><PlayerDetailPage /></PageTransition></OwnPlayerOnly>} />
        <Route path="*" element={<Navigate to={own} replace />} />
      </Routes>
    </AppShell>
  )
}

function RoleRoutes() {
  const { isPlayer, mustChangePassword } = useAuth()
  // Primer ingreso (o contraseña restablecida por un admin): antes de
  // ver su ficha elige una contraseña propia.
  if (isPlayer && mustChangePassword) return <ForcedPasswordChange />
  return isPlayer ? <PlayerRoutes /> : <PanelRoutes />
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
          <Route path="jugadores/nuevo" element={<PageTransition><NewPlayerPage /></PageTransition>} />
          <Route path="jugador/:slug" element={<PageTransition><PlayerDetailPage /></PageTransition>} />
          <Route path="clubes" element={<PageTransition><ClubsPage /></PageTransition>} />
          <Route path="club/:clubId" element={<PageTransition><ClubDetailPage /></PageTransition>} />
          <Route path="estadisticas" element={<PageTransition><StatsPage /></PageTransition>} />
          <Route path="sincronizacion" element={<PageTransition><SyncPage /></PageTransition>} />
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
            <RoleRoutes />
          </Protected>
        }
      />
    </Routes>
  )
}
