import { useMemo, useState } from 'react'
import { Box, Button, Flex, Select, Spinner, Text } from '@chakra-ui/react'
import { useSearchParams } from 'react-router-dom'
import { FiDownload } from 'react-icons/fi'
import { useAllPlayersStats } from '../hooks/usePlayerStats'
import { getClubsWithPlayers } from '../data/players'
import { availableSeasons } from '../lib/playerStats'
import { hasMinutes, lastMatchRows, matchRows, seasonRows, MIN_MINUTES_P90 } from '../lib/statsBoard'
import { inputStyle } from '../components/ui/formStyles'
import Leaderboards from '../components/stats/Leaderboards'
import StatsTable from '../components/stats/StatsTable'
import heroTexture from '../assets/fondo_led3.webp'

// ─── ESTADÍSTICAS ────────────────────────────────────────────────
// Arriba los líderes de cada rubro; abajo la tabla completa con el
// panel para exportar. Filtros en la URL: ?club=…&temporada=…&modo=c90

const MODES = [
  { id: 'total', label: 'Totales' },
  { id: 'c90', label: "Cada 90'" },
]

export default function StatsPage() {
  const [params, setParams] = useSearchParams()
  const { rows, loading } = useAllPlayersStats()
  const clubs = getClubsWithPlayers()
  const [exportOpen, setExportOpen] = useState(false)

  const clubId = params.get('club') || ''
  const p90 = params.get('modo') === 'c90'
  const setParam = (k, v) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v); else next.delete(k)
    setParams(next, { replace: true })
  }

  const seasons = useMemo(() => {
    const set = new Set()
    rows.forEach(({ stats }) => availableSeasons(stats).forEach((y) => set.add(y)))
    return [...set].sort((a, b) => b - a)
  }, [rows])
  const asked = Number(params.get('temporada'))
  const season = seasons.includes(asked) ? asked : seasons[0] ?? new Date().getFullYear()

  const scoped = useMemo(() => rows.filter(({ player }) => !clubId || player.clubId === clubId), [rows, clubId])
  const all = useMemo(() => seasonRows(scoped, season), [scoped, season])
  const shown = useMemo(() => (p90 ? all.filter(hasMinutes) : all), [all, p90])
  const last = useMemo(() => lastMatchRows(scoped), [scoped])
  const matches = useMemo(() => matchRows(scoped, season), [scoped, season])

  const club = clubs.find((c) => c.id === clubId)
  const clubLabel = club?.name || 'Todos los clubes'

  const openExport = () => {
    setExportOpen(true)
    requestAnimationFrame(() => document.getElementById('tabla')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <Box>
      <Box
        px={{ base: 4, md: 6, lg: 10 }} pt={{ base: 6, md: 7 }} pb={5} borderBottom="1px solid" borderColor="#2e2825"
        bgImage={`linear-gradient(90deg, rgba(13,12,11,.97) 0%, rgba(13,12,11,.88) 50%, rgba(13,12,11,.55) 100%), url(${heroTexture})`}
        bgSize="cover" bgPosition="center right"
      >
        <Flex maxW="1360px" mx="auto" direction="column" gap={5}>
          <Flex wrap="wrap" align="flex-end" justify="space-between" gap={3.5}>
            <Flex direction="column" gap={1.5}>
              <Text fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase" color="brand.orange">
                {loading ? 'Cargando…' : `${all.length} jugadores · temporada ${season}${club ? ` · ${club.name}` : ''}`}
              </Text>
              <Text as="h1" fontFamily="heading" fontSize={{ base: '56px', md: '72px' }} lineHeight={0.88}>Estadísticas</Text>
              <Text fontSize="15px" color="brand.amber">Quién lidera cada rubro y la tabla con todos los números, lista para exportar.</Text>
            </Flex>
            <Button
              leftIcon={<FiDownload />} onClick={openExport} variant="outline" minH="44px" borderColor="#423a35" color="brand.amber"
              _hover={{ bg: '#2a2420', color: 'white' }} fontFamily="mono" fontSize="14px" letterSpacing="0.12em" textTransform="uppercase"
              isDisabled={loading}
            >
              Exportar
            </Button>
          </Flex>

          <Flex wrap="wrap" align="center" gap={2.5}>
            <Select {...inputStyle} aria-label="Club" h="44px" w={{ base: '100%', sm: '220px' }} value={clubId} onChange={(e) => setParam('club', e.target.value)}>
              <option value="" style={{ background: '#1E1B19' }}>Todos los clubes</option>
              {clubs.map((c) => <option key={c.id} value={c.id} style={{ background: '#1E1B19' }}>{c.name}</option>)}
            </Select>
            {seasons.length > 0 && (
              <Select {...inputStyle} aria-label="Temporada" h="44px" w={{ base: 'calc(50% - 5px)', sm: '170px' }} value={season}
                onChange={(e) => setParam('temporada', Number(e.target.value) === seasons[0] ? '' : e.target.value)}>
                {seasons.map((y) => <option key={y} value={y} style={{ background: '#1E1B19' }}>Temporada {y}</option>)}
              </Select>
            )}
            <Flex role="group" aria-label="Cómo contar" p="3px" borderRadius="full" border="1px solid" borderColor="#423a35" bg="#151312">
              {MODES.map((m) => {
                const on = (m.id === 'c90') === p90
                return (
                  <Box
                    key={m.id} as="button" type="button" aria-pressed={on} onClick={() => setParam('modo', m.id === 'c90' ? 'c90' : '')}
                    px={4} minH="36px" borderRadius="full" fontFamily="mono" fontSize="14px" letterSpacing="0.1em" textTransform="uppercase"
                    bg={on ? 'brand.orange' : 'transparent'} color={on ? 'brand.brown' : 'brand.gray'} _hover={{ color: on ? 'brand.brown' : 'white' }}
                    _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '2px' }}
                  >
                    {m.label}
                  </Box>
                )
              })}
            </Flex>
            <Text fontSize="14px" color="brand.gray">
              {p90 ? `Solo jugadores con ${MIN_MINUTES_P90}' o más, para que nadie lidere con dos partidos.` : 'Números acumulados de la temporada.'}
            </Text>
          </Flex>
        </Flex>
      </Box>

      <Box px={{ base: 4, md: 6, lg: 10 }} pt={6} pb={14}>
        <Flex maxW="1360px" mx="auto" direction="column" gap={7}>
          {loading ? (
            <Flex justify="center" py={16}><Spinner color="brand.amber" /></Flex>
          ) : (
            <>
              <Flex as="section" aria-labelledby="lideres" direction="column" gap={3.5}>
                <Flex wrap="wrap" align="baseline" justify="space-between" gap={2}>
                  <Text as="h2" id="lideres" fontFamily="heading" fontSize="36px" lineHeight={1}>Líderes {season}</Text>
                  <Text fontSize="14px" color="brand.gray">Tocá un jugador para abrir su ficha</Text>
                </Flex>
                {all.length ? (
                  <Leaderboards rows={shown} p90={p90} />
                ) : (
                  <Text fontSize="15px" color="brand.gray">No hay estadísticas de {season} para este filtro.</Text>
                )}
              </Flex>

              <StatsTable
                key={`${clubId}-${season}`}
                rows={shown} baseRows={all} lastRows={last} matchRows={matches}
                p90={p90} season={season} clubLabel={clubLabel} clubSlug={club?.name}
                exportOpen={exportOpen} onToggleExport={() => setExportOpen((o) => !o)}
              />
            </>
          )}
        </Flex>
      </Box>
    </Box>
  )
}
