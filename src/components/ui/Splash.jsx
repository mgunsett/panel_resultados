import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Box, Text } from '@chakra-ui/react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '../../lib/auth'
import splashWide from '../../assets/fondo_led.webp'
import splashTall from '../../assets/fondo_led2.webp'

const MotionBox = motion(Box)

// ─── PANTALLA DE CARGA ───────────────────────────────────────────
// La imagen de LED Sports entra con un fundido y un leve zoom, se
// llena la barra y se desvanece hacia el panel. Se muestra:
//   - al abrir el panel (una vez por pestaña, no en cada recarga),
//   - después de iniciar sesión (`useSplash().play()`).
// Dura lo que tarde Firebase en resolver la sesión, con un mínimo de
// MIN_MS para que la animación se vea completa.

const MIN_MS = 2300
const SEEN_KEY = 'led_splash_seen'

const SplashContext = createContext({ play: () => {} })

function seenThisSession() {
  try { return sessionStorage.getItem(SEEN_KEY) === '1' } catch { return false }
}
function markSeen() {
  try { sessionStorage.setItem(SEEN_KEY, '1') } catch { /* sin storage: se vuelve a ver, no pasa nada */ }
}

function SplashScreen() {
  const reduceMotion = useReducedMotion()
  return (
    <MotionBox
      position="fixed" inset={0} zIndex={2000} bg="#0d0c0b" overflow="hidden"
      initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeInOut' }}
      aria-busy="true" aria-label="Cargando panel" role="status"
    >
      <MotionBox
        position="absolute" inset={0}
        bgImage={{ base: `url(${splashTall})`, md: `url(${splashWide})` }}
        bgSize="cover" bgPosition="center" bgRepeat="no-repeat"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.3, ease: [0.2, 0.7, 0.2, 1] }}
      />
      <MotionBox
        position="absolute" left={0} right={0} bottom={{ base: '12%', md: '9%' }}
        display="flex" flexDirection="column" alignItems="center" gap="10px"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Text fontFamily="mono" fontSize="13px" letterSpacing="0.28em" textTransform="uppercase" color="brand.gray">
          Cargando panel
        </Text>
        <Box w={{ base: '160px', md: '220px' }} h="3px" borderRadius="2px" bg="whiteAlpha.200" overflow="hidden">
          <MotionBox
            h="100%" bg="brand.orange" borderRadius="2px"
            initial={{ width: '0%' }} animate={{ width: '100%' }}
            transition={{ duration: (MIN_MS - 400) / 1000, delay: 0.4, ease: 'easeInOut' }}
          />
        </Box>
      </MotionBox>
    </MotionBox>
  )
}

export function SplashProvider({ children }) {
  const { loading } = useAuth()
  const [run, setRun] = useState(() => (seenThisSession() ? 0 : 1))
  const [minDone, setMinDone] = useState(false)

  useEffect(() => {
    if (!run) return undefined
    setMinDone(false)
    markSeen()
    const t = setTimeout(() => setMinDone(true), MIN_MS)
    return () => clearTimeout(t)
  }, [run])

  const play = useCallback(() => setRun((r) => r + 1), [])
  const visible = Boolean(run) && (!minDone || loading)

  return (
    <SplashContext.Provider value={{ play }}>
      {children}
      <AnimatePresence>{visible && <SplashScreen key={run} />}</AnimatePresence>
    </SplashContext.Provider>
  )
}

export function useSplash() {
  return useContext(SplashContext)
}
