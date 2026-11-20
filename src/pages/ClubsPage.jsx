import { useMemo, useState } from 'react'
import { Box, Flex, Input, InputGroup, InputLeftElement, Text } from '@chakra-ui/react'
import { useSearchParams } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { getClubsWithPlayers } from '../data/players'
import { useHomeData } from '../hooks/usePlayerStats'
import { clubsOverview, matchesText } from '../lib/clubsData'
import { inputStyle } from '../components/ui/formStyles'
import ClubCard from '../components/clubs/ClubCard'
import CrestStrip from '../components/clubs/CrestStrip'
import heroTexture from '../assets/fondo_led3.webp'

const chip = (on) => ({
  as: 'button', type: 'button', 'aria-pressed': on, px: 4, minH: '36px', borderRadius: 'full', border: '1px solid',
  borderColor: on ? 'brand.orange' : '#423a35', bg: on ? 'brand.orange' : '#151312', color: on ? 'brand.brown' : 'brand.gray',
  fontFamily: 'mono', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase',
  _hover: { color: on ? 'brand.brown' : 'white' },
  _focusVisible: { outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '2px' },
})

// ─── CLUBES ──────────────────────────────────────────────────────
// Grilla de clubes con su último y próximo partido tal como están
// cargados hoy, y una franja con todos los escudos para saltar a uno.
// Filtros en la URL: ?pais=…&aviso=1
export default function ClubsPage() {
  const clubs = useMemo(() => getClubsWithPlayers(), [])
  const { rows, loading } = useHomeData()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const country = params.get('pais') || ''
  const warnOnly = params.get('aviso') === '1'

  const setParam = (k, v) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v); else next.delete(k)
    setParams(next, { replace: true })
  }

  const overview = useMemo(() => clubsOverview(clubs, rows), [clubs, rows])
  const countries = useMemo(() => [...new Set(clubs.map((c) => c.country))].sort((a, b) => a.localeCompare(b, 'es')), [clubs])
  const shown = overview.filter(({ club, status }) => (!country || club.country === country)
    && (!warnOnly || (!loading && status.id !== 'ok'))
    && (!q.trim() || matchesText(`${club.name} ${club.players.map((p) => p.name).join(' ')}`, q.trim())))
  const shownIds = new Set(shown.map((x) => x.club.id))
  const dimmed = new Set(clubs.filter((c) => !shownIds.has(c.id)).map((c) => c.id))
  const warnCount = loading ? 0 : overview.filter((x) => x.status.id !== 'ok').length
  const nPlayers = clubs.reduce((a, c) => a + c.players.length, 0)

  return (
    <Box>
      <Box
        px={{ base: 4, md: 6, lg: 10 }} pt={{ base: 6, md: 7 }} pb={5} borderBottom="1px solid" borderColor="#2e2825"
        bgImage={`linear-gradient(90deg, rgba(13,12,11,.97) 0%, rgba(13,12,11,.88) 50%, rgba(13,12,11,.55) 100%), url(${heroTexture})`}
        bgSize="cover" bgPosition="center right"
      >
        <Flex maxW="1360px" mx="auto" direction="column" gap="18px">
          <Flex direction="column" gap={1.5}>
            <Text fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase" color="brand.orange">
              {clubs.length} clubes · {nPlayers} jugadores
            </Text>
            <Text as="h1" fontFamily="heading" fontSize={{ base: '56px', md: '72px' }} lineHeight={0.88}>Clubes</Text>
            <Text fontSize="15px" color="brand.amber">Cargá un partido una vez y se aplica a todos los jugadores del club.</Text>
          </Flex>

          <Flex wrap="wrap" align="center" gap={2.5}>
            <InputGroup w={{ base: '100%', sm: '300px' }}>
              <InputLeftElement h="44px" pointerEvents="none" color="brand.gray"><FiSearch /></InputLeftElement>
              <Input {...inputStyle} h="44px" type="search" placeholder="Buscar club o jugador…" aria-label="Buscar club o jugador"
                value={q} onChange={(e) => setQ(e.target.value)} bg="rgba(13,12,11,.85)" />
            </InputGroup>
            <Flex role="group" aria-label="País" wrap="wrap" gap={1.5}>
              {['', ...countries].map((c) => (
                <Box key={c || 'todos'} {...chip(country === c)} onClick={() => setParam('pais', c)}>{c || 'Todos'}</Box>
              ))}
            </Flex>
            <Box {...chip(warnOnly)} display="flex" alignItems="center" gap={1.5} onClick={() => setParam('aviso', warnOnly ? '' : '1')}>
              <Box boxSize="8px" borderRadius="full" bg={warnOnly ? 'brand.brown' : 'brand.orange'} />
              Con aviso{loading ? '' : ` (${warnCount})`}
            </Box>
          </Flex>
        </Flex>
      </Box>

      <CrestStrip items={loading ? clubs.map((club) => ({ club })) : overview} dimmed={dimmed} />

      <Box px={{ base: 4, md: 6, lg: 10 }} pt={6} pb={14}>
        <Box maxW="1360px" mx="auto">
          {shown.length ? (
            <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(min(100%, 380px), 1fr))" gap="18px">
              {shown.map((entry) => <ClubCard key={entry.club.id} entry={entry} loading={loading} />)}
            </Box>
          ) : (
            <Text fontSize="15px" color="brand.gray">Ningún club coincide con el filtro.</Text>
          )}
        </Box>
      </Box>
    </Box>
  )
}
