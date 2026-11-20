import { useEffect, useMemo, useRef } from 'react'
import { Box, Flex, Spinner, useBreakpointValue } from '@chakra-ui/react'
import { useSearchParams } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { usePanelRows } from '../hooks/usePlayerStats'
import { useSyncAll } from '../lib/syncContext'
import RosterList from '../components/players/RosterList'
import PlayerPanel from '../components/players/PlayerPanel'

// ─── JUGADORES: LISTA CON PANEL ──────────────────────────────────
// A la izquierda todos los jugadores agrupados por club; a la derecha
// el elegido: temporada, forma reciente, lo que muestra su landing y
// sus compañeros. El elegido va en la URL (?j=slug) para compartirlo.
// En el celular la lista va arriba y, al elegir, baja hasta el panel.
export default function PlayersPage() {
  const { lastRunAt } = useSyncAll()
  const { rows, loading } = usePanelRows(lastRunAt?.getTime())
  const [params, setParams] = useSearchParams()
  const panelRef = useRef(null)
  const stacked = useBreakpointValue({ base: true, lg: false }, { ssr: false })
  const reduceMotion = useReducedMotion()
  const userPicked = useRef(false)

  const sorted = useMemo(
    () => [...rows].sort((a, b) => (a.club?.name || 'zz').localeCompare(b.club?.name || 'zz', 'es') || a.player.name.localeCompare(b.player.name, 'es')),
    [rows],
  )
  const selected = params.get('j') || sorted[0]?.player.slug
  const row = rows.find((r) => r.player.slug === selected) || sorted[0]
  const mates = row ? rows.filter((r) => r.club?.id && r.club.id === row.club?.id && r.player.slug !== row.player.slug).map((r) => r.player) : []

  const select = (slug) => {
    userPicked.current = true
    setParams({ j: slug }, { replace: true })
  }

  useEffect(() => {
    if (stacked && userPicked.current && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    }
  }, [selected, stacked, reduceMotion])

  return (
    <Box px={{ base: 4, md: 6, lg: 10 }} pt={{ base: 4, md: 6 }} pb={14}>
      {loading ? (
        <Flex justify="center" py={20}><Spinner color="brand.amber" size="lg" /></Flex>
      ) : (
        <Flex maxW="1360px" mx="auto" wrap="wrap" gap={6} align="flex-start">
          <Box flex="1 1 320px" maxW={{ lg: '380px' }} minW={0} w={{ base: '100%', lg: 'auto' }} alignSelf={{ lg: 'stretch' }}>
            <RosterList rows={rows} selected={row?.player.slug} onSelect={select} />
          </Box>
          <Box flex="999 1 600px" minW={0}>
            {row && <PlayerPanel ref={panelRef} row={row} mates={mates} onSelect={select} />}
          </Box>
        </Flex>
      )}
    </Box>
  )
}
