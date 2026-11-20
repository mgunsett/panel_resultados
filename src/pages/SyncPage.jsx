import { useState } from 'react'
import {
  Box, Flex, HStack, VStack, Text, Button, Input, Badge, Image, Code,
  SimpleGrid, Spinner, Select, useClipboard, useToast,
} from '@chakra-ui/react'
import { FiActivity, FiRefreshCw, FiEye, FiSearch, FiCopy, FiCheck, FiUsers, FiDatabase } from 'react-icons/fi'
import { getClubsWithPlayers, players } from '../data/players'
import { callApiFootball, guessSquadMatch } from '../lib/apiFootball'
import PageContainer from '../components/layout/PageContainer'
import PageHeader from '../components/layout/PageHeader'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ClubCrest from '../components/clubs/ClubCrest'
import { inputStyle } from '../components/ui/formStyles'

// ─── SINCRONIZACIÓN CON API-FOOTBALL ─────────────────────────────
// 1. Estado de la cuenta (plan y consumo del día).
// 2. Sincronizar a mano: "Probar" muestra qué escribiría sin guardar
//    nada; "Sincronizar ahora" escribe en Firestore.
// 3. Mapeo de IDs: busca el ID de cada club y jugador en la API para
//    pegarlo en src/data/clubs.js y src/data/players.js.

function Card({ title, icon: Icon, children, right }) {
  return (
    <Box bg="brand.dark2" border="1px solid" borderColor="brand.brownDark" borderRadius="lg" p={{ base: 4, md: 5 }} mb={5}>
      <Flex align="center" justify="space-between" gap={3} mb={4} wrap="wrap">
        <HStack spacing={2}>
          {Icon && <Box color="brand.orange"><Icon size={16} /></Box>}
          <Text fontFamily="mono" fontSize="sm" color="white" textTransform="uppercase" letterSpacing="widest">
            {title}
          </Text>
        </HStack>
        {right}
      </Flex>
      {children}
    </Box>
  )
}

const btn = {
  fontFamily: 'mono', fontSize: 'xs', letterSpacing: 'widest', textTransform: 'uppercase', size: 'sm',
}

function CopyId({ value, label }) {
  const { hasCopied, onCopy } = useClipboard(String(value))
  return (
    <Button {...btn} variant="outline" color="brand.amber" borderColor="brand.brownDark"
      leftIcon={hasCopied ? <FiCheck /> : <FiCopy />} onClick={onCopy}
      _hover={{ bg: 'brand.brownLight' }}>
      {hasCopied ? 'Copiado' : label}
    </Button>
  )
}

function useApiAction() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const toast = useToast()
  const run = async (...args) => {
    setLoading(true)
    try {
      const res = await callApiFootball(...args)
      setData(res)
      return res
    } catch (err) {
      toast({ title: 'API-Football', description: err.message, status: 'error', duration: 6000, isClosable: true })
      return null
    } finally {
      setLoading(false)
    }
  }
  return { loading, data, run }
}

// ── Estado ──
function StatusCard() {
  const { loading, data, run } = useApiAction()
  return (
    <Card
      title="Estado de la cuenta" icon={FiActivity}
      right={<Button {...btn} bg="brand.amber" color="brand.brown" isLoading={loading} onClick={() => run('status')}>Verificar conexión</Button>}
    >
      {!data ? (
        <Text fontSize="sm" color="brand.gray">Consulta el plan y cuántos requests quedan hoy. No gasta cuota.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
          <Stat label="Plan" value={data.plan || '—'} hint={data.active === false ? 'Suscripción inactiva' : data.endsAt ? `Vence ${data.endsAt.slice(0, 10)}` : null} />
          <Stat label="Requests hoy" value={data.requests ? `${data.requests.current} / ${data.requests.limit_day}` : '—'} />
          <Stat label="Cuenta" value={data.account?.firstname || data.account?.email || '—'} />
        </SimpleGrid>
      )}
    </Card>
  )
}

function Stat({ label, value, hint }) {
  return (
    <Box bg="brand.dark" borderRadius="md" p={3} border="1px solid" borderColor="brand.brownDark">
      <Text fontFamily="mono" fontSize="9px" color="brand.gray" textTransform="uppercase" letterSpacing="widest">{label}</Text>
      <Text fontFamily="heading" fontSize="2xl" color="white" lineHeight={1.1}>{value}</Text>
      {hint && <Text fontSize="xs" color="brand.amber">{hint}</Text>}
    </Box>
  )
}

// ── Sincronizar ──
// Sincroniza club por club (una llamada a la función por club) en vez
// de todo junto: cada llamada termina en un par de segundos, lejos del
// timeout de Netlify, y los requests a la API quedan espaciados.
function SyncCard() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [data, setData] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const toast = useToast()

  const sync = async (dryRun) => {
    setConfirm(false)
    setLoading(true)
    setData(null)
    const all = getClubsWithPlayers()
    const targets = all.filter((c) => c.apiTeamId)
    const report = {
      dryRun,
      clubs: [],
      clubsWithoutApiId: all.filter((c) => !c.apiTeamId).map((c) => c.name),
      usage: { requestsUsed: 0, remainingToday: null },
    }
    try {
      for (const [i, club] of targets.entries()) {
        setProgress(`${club.name} (${i + 1}/${targets.length})`)
        try {
          const res = await callApiFootball('sync', { club: club.id, ...(dryRun ? { dryRun: 1 } : {}) }, { method: 'POST' })
          report.clubs.push(...res.clubs)
          report.usage.requestsUsed += res.usage?.requestsUsed || 0
          if (res.usage?.remainingToday != null) report.usage.remainingToday = res.usage.remainingToday
        } catch (err) {
          report.clubs.push({ clubId: club.id, club: club.name, error: err.message })
        }
        setData({ ...report, clubs: [...report.clubs] })
      }
      const failed = report.clubs.filter((c) => c.error).length
      toast({
        title: failed ? `Terminó con ${failed} club(es) con error` : dryRun ? 'Prueba terminada' : 'Sincronización terminada',
        status: failed ? 'warning' : 'success',
        duration: 4000,
      })
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  return (
    <Card
      title="Sincronizar" icon={FiRefreshCw}
      right={
        <HStack>
          <Button {...btn} variant="outline" color="brand.amber" borderColor="brand.brownDark" leftIcon={<FiEye />}
            isLoading={loading} onClick={() => sync(true)} _hover={{ bg: 'brand.brownLight' }}>
            Probar sin guardar
          </Button>
          <Button {...btn} bg="brand.orange" color="brand.brown" leftIcon={<FiRefreshCw />}
            isDisabled={loading} onClick={() => setConfirm(true)} _hover={{ bg: 'brand.orangeDark', color: 'white' }}>
            Sincronizar ahora
          </Button>
        </HStack>
      }
    >
      <Text fontSize="sm" color="brand.gray" mb={data ? 4 : 0}>
        Corre sola de lunes a viernes a las 06:00 y los sábados y domingos a las 06:00 y 18:00 (hora de Argentina). Desde acá la podés forzar, o probar primero para ver qué cambiaría sin tocar las landings.
        Los partidos marcados con <b>Bloquear</b> nunca se pisan.
      </Text>

      {loading && (
        <HStack mb={3}>
          <Spinner color="brand.amber" size="sm" />
          <Text fontSize="sm" color="brand.gray">{progress}</Text>
        </HStack>
      )}
      {data && <SyncReport report={data} />}

      <ConfirmDialog
        isOpen={confirm} onClose={() => setConfirm(false)} onConfirm={() => sync(false)}
        tone="brand" confirmLabel="Sincronizar"
        title="¿Sincronizar todos los clubes?"
        description="Se actualizan el último resultado, el próximo partido y las estadísticas de los clubes que tengan ID de API-Football. Lo que esté bloqueado no se toca."
      />
    </Card>
  )
}

function SyncReport({ report }) {
  return (
    <VStack align="stretch" spacing={2}>
      <Text fontFamily="mono" fontSize="10px" color="brand.amber" textTransform="uppercase" letterSpacing="widest">
        {report.dryRun ? 'Prueba: no se guardó nada' : 'Guardado'} · {report.usage?.requestsUsed ?? 0} requests usados
        {report.usage?.remainingToday != null && ` · quedan ${report.usage.remainingToday} hoy`}
      </Text>
      {report.clubs.map((c) => (
        <Box key={c.clubId} bg="brand.dark" borderRadius="md" p={3} border="1px solid" borderColor={c.error ? 'brand.rec' : 'brand.brownDark'}>
          <Text fontFamily="mono" fontSize="sm" color="white" textTransform="uppercase" letterSpacing="wider">{c.club}</Text>
          {c.error ? (
            <Text fontSize="sm" color="brand.rec">{c.error}</Text>
          ) : (
            <Box fontSize="sm" color="brand.gray">
              <Text>Último: {c.last || 'sin partido terminado'}</Text>
              <Text>Próximo: {c.next || 'sin partido programado'}</Text>
              <Text>Estadísticas: {c.stats}</Text>
              {c.season && <Text>Temporada: {c.season}</Text>}
              <Text>{c.writes.length ? `${c.writes.length} documento(s) ${report.dryRun ? 'para escribir' : 'escritos'}` : 'Sin cambios'}</Text>
              {c.skippedLocked.length > 0 && <Text color="brand.amber">Bloqueados: {c.skippedLocked.join(', ')}</Text>}
            </Box>
          )}
        </Box>
      ))}
      {report.clubsWithoutApiId?.length > 0 && (
        <Text fontSize="xs" color="brand.gray">Sin ID de API-Football (no se sincronizan): {report.clubsWithoutApiId.join(', ')}</Text>
      )}
    </VStack>
  )
}

// ── Completar historial ──
// La sincronización sólo suma el partido nuevo a stats/history_{año}.
// Esto trae lo anterior: club por club, en tandas de pocos partidos
// (cada tanda es una llamada corta a la función), hasta que no quede
// ninguno. Lo ya guardado no se vuelve a pedir, así que se puede cortar
// y retomar sin gastar de más.
const THIS_YEAR = new Date().getFullYear()
const MAX_ROUNDS_PER_CLUB = 25

function HistoryCard() {
  const toast = useToast()
  const [season, setSeason] = useState(THIS_YEAR)
  const [from, setFrom] = useState(THIS_YEAR - 3)
  const [running, setRunning] = useState(null) // 'history' | 'seasons'
  const [progress, setProgress] = useState('')
  const [log, setLog] = useState([])
  const [confirm, setConfirm] = useState(null)

  const clubs = getClubsWithPlayers().filter((c) => c.apiTeamId && c.players.some((p) => p.apiPlayerId))
  const statPlayers = players.filter((p) => p.apiPlayerId)

  const runHistory = async () => {
    setConfirm(null)
    setRunning('history')
    setLog([])
    let requests = 0
    try {
      for (const [i, club] of clubs.entries()) {
        let line = { club: club.name }
        for (let round = 0; round < MAX_ROUNDS_PER_CLUB; round++) {
          setProgress(`${club.name} (${i + 1}/${clubs.length})${round ? ` · tanda ${round + 1}` : ''}`)
          try {
            const res = await callApiFootball('history', { club: club.id, season }, { method: 'POST' })
            requests += res.usage?.requestsUsed || 0
            line = { club: club.name, total: res.total, remaining: res.remaining, withoutData: (line.withoutData || 0) + (res.withoutData || 0) }
            if (!res.remaining) break
          } catch (err) {
            line = { ...line, error: err.message }
            break
          }
        }
        setLog((prev) => [...prev, line])
      }
      toast({ title: `Historial ${season} listo`, description: `${requests} requests usados`, status: 'success', duration: 5000 })
    } finally {
      setRunning(null)
      setProgress('')
    }
  }

  const runSeasons = async () => {
    setConfirm(null)
    setRunning('seasons')
    setLog([])
    const years = Array.from({ length: THIS_YEAR - from }, (_, k) => THIS_YEAR - 1 - k)
    try {
      for (const [i, p] of statPlayers.entries()) {
        const found = []
        let error = null
        for (const y of years) {
          setProgress(`${p.name} (${i + 1}/${statPlayers.length}) · ${y}`)
          try {
            const res = await callApiFootball('season', { player: p.slug, season: y }, { method: 'POST' })
            if (res.found) found.push(y)
          } catch (err) {
            error = err.message
            break
          }
        }
        setLog((prev) => [...prev, { club: p.name, years: found, error }])
      }
      toast({ title: 'Temporadas anteriores listas', status: 'success', duration: 4000 })
    } finally {
      setRunning(null)
      setProgress('')
    }
  }

  const yearOptions = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2]

  return (
    <Card title="Completar historial" icon={FiDatabase}>
      <Text fontSize="sm" color="brand.gray" mb={4}>
        Los partidos nuevos y los totales del año se guardan solos. Esto completa lo anterior para la ficha de cada
        jugador y la sección Estadísticas. No toca nada de lo que leen las landings.
      </Text>

      <VStack align="stretch" spacing={3}>
        <Flex gap={3} align="center" wrap="wrap" bg="brand.dark" borderRadius="md" p={3} border="1px solid" borderColor="brand.brownDark">
          <Box flex={1} minW="220px">
            <Text fontFamily="mono" fontSize="sm" color="white" textTransform="uppercase" letterSpacing="wider">Partidos de la temporada</Text>
            <Text fontSize="xs" color="brand.gray">
              {clubs.length} clubes · ~1 request por partido del club (unos 40 a 50 por club). Se usa el club actual del
              jugador: si cambió de club en el año, los partidos con el anterior no se traen.
            </Text>
          </Box>
          <Select {...inputStyle} h="32px" size="sm" w="110px" value={season} onChange={(e) => setSeason(Number(e.target.value))}>
            {yearOptions.map((y) => <option key={y} value={y} style={{ background: '#1E1B19' }}>{y}</option>)}
          </Select>
          <Button {...btn} bg="brand.orange" color="brand.brown" isLoading={running === 'history'} isDisabled={Boolean(running)}
            onClick={() => setConfirm('history')} _hover={{ bg: 'brand.orangeDark', color: 'white' }}>
            Completar partidos
          </Button>
        </Flex>

        <Flex gap={3} align="center" wrap="wrap" bg="brand.dark" borderRadius="md" p={3} border="1px solid" borderColor="brand.brownDark">
          <Box flex={1} minW="220px">
            <Text fontFamily="mono" fontSize="sm" color="white" textTransform="uppercase" letterSpacing="wider">Temporadas anteriores</Text>
            <Text fontSize="xs" color="brand.gray">
              Totales por año de {statPlayers.length} jugadores, con todos los clubes por los que pasaron · 1 request por jugador por año.
            </Text>
          </Box>
          <Select {...inputStyle} h="32px" size="sm" w="130px" value={from} onChange={(e) => setFrom(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((k) => (
              <option key={k} value={THIS_YEAR - k} style={{ background: '#1E1B19' }}>Desde {THIS_YEAR - k}</option>
            ))}
          </Select>
          <Button {...btn} bg="brand.amber" color="brand.brown" isLoading={running === 'seasons'} isDisabled={Boolean(running)}
            onClick={() => setConfirm('seasons')}>
            Traer temporadas
          </Button>
        </Flex>
      </VStack>

      {running && (
        <HStack mt={4}>
          <Spinner color="brand.amber" size="sm" />
          <Text fontSize="sm" color="brand.gray">{progress}</Text>
        </HStack>
      )}
      {log.length > 0 && (
        <VStack align="stretch" spacing={1} mt={4} fontSize="sm">
          {log.map((l) => (
            <Flex key={l.club} gap={2}>
              <Text color="white" minW="160px">{l.club}</Text>
              {l.error ? <Text color="brand.rec">{l.error}</Text>
                : l.years ? <Text color="brand.gray">{l.years.length ? l.years.join(', ') : 'sin datos en esos años'}</Text>
                  : (
                    <Text color="brand.gray">
                      {l.total ?? 0} partidos{l.remaining ? ` · faltan ${l.remaining} (volvé a correrlo)` : ' · completo'}
                      {l.withoutData ? ` · ${l.withoutData} sin datos en la API` : ''}
                    </Text>
                  )}
            </Flex>
          ))}
        </VStack>
      )}

      <ConfirmDialog
        isOpen={confirm === 'history'} onClose={() => setConfirm(null)} onConfirm={runHistory}
        tone="brand" confirmLabel="Completar"
        title={`¿Completar los partidos de ${season}?`}
        description={`Se piden a API-Football los partidos que falten de ${clubs.length} clubes, en tandas cortas. La primera vez son unos ${clubs.length * 45} requests; después, sólo los que falten. Puede tardar varios minutos: dejá esta pestaña abierta.`}
      />
      <ConfirmDialog
        isOpen={confirm === 'seasons'} onClose={() => setConfirm(null)} onConfirm={runSeasons}
        tone="brand" confirmLabel="Traer"
        title={`¿Traer temporadas ${from} a ${THIS_YEAR - 1}?`}
        description={`Son ${statPlayers.length * (THIS_YEAR - from)} requests (${statPlayers.length} jugadores × ${THIS_YEAR - from} años).`}
      />
    </Card>
  )
}

// Para cuando el apellido no coincide con el de la API (ej: el jugador
// figura con otro apellido) o no aparece en el plantel (ej: reservas):
// elegir a mano del plantel completo, o buscar por apellido en toda la
// base de API-Football.
function ManualPlayerPick({ player, squad }) {
  const words = player.name.split(/\s+/)
  const [q, setQ] = useState(words[words.length - 1])
  const search = useApiAction()
  const [picked, setPicked] = useState('')
  const pickedPlayer = squad.find((p) => String(p.id) === picked)

  return (
    <Box w="100%" pl={{ base: 0, md: '168px' }} pb={2}>
      {squad.length > 0 && (
        <HStack mb={2}>
          <Select {...inputStyle} h="34px" size="sm" placeholder="Elegir del plantel…"
            value={picked} onChange={(e) => setPicked(e.target.value)}>
            {squad.map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#1E1B19' }}>
                {p.name}{p.number ? ` #${p.number}` : ''}{p.position ? ` · ${p.position}` : ''}
              </option>
            ))}
          </Select>
          {pickedPlayer && <CopyId value={`apiPlayerId: ${pickedPlayer.id},`} label={`ID ${pickedPlayer.id}`} />}
        </HStack>
      )}
      <HStack mb={2}>
        <Input {...inputStyle} h="34px" size="sm" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por apellido en toda la API" />
        <Button {...btn} leftIcon={<FiSearch />} isLoading={search.loading}
          onClick={() => search.run('players', { q })}>Buscar</Button>
      </HStack>
      {search.data?.results?.length === 0 && <Text fontSize="xs" color="brand.gray">Sin resultados con ese apellido.</Text>}
      <VStack align="stretch" spacing={1}>
        {search.data?.results?.slice(0, 15).map((r) => (
          <Flex key={r.id} align="center" gap={2} fontSize="sm">
            {r.photo && <Image src={r.photo} boxSize="22px" borderRadius="full" alt="" />}
            <Text color="white" flex={1}>
              {r.name} <Text as="span" color="brand.gray">· {r.nationality || '—'}{r.birth ? ` · ${r.birth}` : ''}</Text>
            </Text>
            <CopyId value={`apiPlayerId: ${r.id},`} label={`ID ${r.id}`} />
          </Flex>
        ))}
      </VStack>
    </Box>
  )
}

function PlayerRow({ player: p, squad }) {
  const match = guessSquadMatch(p.name, squad)
  const [manual, setManual] = useState(false)

  let status
  if (p.apiPlayerId) {
    status = <Badge colorScheme="green" fontFamily="mono">apiPlayerId {p.apiPlayerId}</Badge>
  } else if (p.role === 'DT') {
    status = <Text color="brand.gray" fontSize="xs">DT: no lleva estadísticas</Text>
  } else if (match) {
    status = (
      <>
        <Text color="brand.gray" flex={1}>→ sugerido: {match.name} #{match.number ?? '—'}</Text>
        <CopyId value={`apiPlayerId: ${match.id},`} label={`ID ${match.id}`} />
      </>
    )
  } else {
    status = <Text color="brand.amber" fontSize="xs" flex={1}>No coincide con nadie del plantel</Text>
  }

  // La búsqueda manual está siempre a mano (salvo DT): la sugerencia
  // automática puede equivocarse, y un ID ya cargado puede estar mal.
  const canPick = p.role !== 'DT'
  const open = manual || (!p.apiPlayerId && !match && canPick)

  return (
    <Flex align="center" gap={2} fontSize="sm" wrap="wrap">
      <Text color="white" minW="160px">{p.name}</Text>
      {status}
      {canPick && !open && (
        <Button {...btn} variant="ghost" color="brand.orange" onClick={() => setManual(true)}
          _hover={{ bg: 'brand.orangeSoft' }}>
          {p.apiPlayerId ? 'Cambiar' : 'No es él: buscar a mano'}
        </Button>
      )}
      {open && <ManualPlayerPick player={p} squad={squad} />}
    </Flex>
  )
}

// ── Mapeo de IDs ──
function ClubMapping({ club }) {
  const [q, setQ] = useState(club.name)
  const teams = useApiAction()
  const squad = useApiAction()

  return (
    <Box bg="brand.dark" borderRadius="md" p={3} border="1px solid" borderColor="brand.brownDark">
      <Flex align="center" gap={3} mb={3} wrap="wrap">
        <ClubCrest club={club} size="36px" fontSize="xs" />
        <Box flex={1} minW="140px">
          <Text fontFamily="mono" fontSize="sm" color="white" textTransform="uppercase" letterSpacing="wider">{club.name}</Text>
          <Text fontSize="xs" color="brand.gray">{club.country} · {club.players.length} jugador(es)</Text>
        </Box>
        {club.apiTeamId
          ? <Badge colorScheme="green" fontFamily="mono">apiTeamId {club.apiTeamId}</Badge>
          : <Badge colorScheme="orange" fontFamily="mono">Falta apiTeamId</Badge>}
      </Flex>

      {!club.apiTeamId && (
        <>
          <HStack mb={2}>
            <Input {...inputStyle} h="34px" size="sm" value={q} onChange={(e) => setQ(e.target.value)} />
            <Button {...btn} leftIcon={<FiSearch />} isLoading={teams.loading} onClick={() => teams.run('teams', { q })}>Buscar</Button>
          </HStack>
          {teams.data?.results?.length === 0 && <Text fontSize="xs" color="brand.gray">Sin resultados. Probá con otro nombre.</Text>}
          <VStack align="stretch" spacing={1}>
            {teams.data?.results?.map((t) => (
              <Flex key={t.id} align="center" gap={2} fontSize="sm">
                <Image src={t.logo} boxSize="20px" alt="" />
                <Text color="white" flex={1}>{t.name} <Text as="span" color="brand.gray">· {t.country}{t.venue ? ` · ${t.venue}` : ''}</Text></Text>
                <CopyId value={`apiTeamId: ${t.id},`} label={`ID ${t.id}`} />
              </Flex>
            ))}
          </VStack>
        </>
      )}

      {club.apiTeamId && (
        <>
          <Button {...btn} variant="ghost" color="brand.orange" leftIcon={<FiUsers />} isLoading={squad.loading}
            onClick={() => squad.run('squad', { team: club.apiTeamId })} _hover={{ bg: 'brand.orangeSoft' }}>
            Buscar IDs de los jugadores en el plantel
          </Button>
          {squad.data && (
            <VStack align="stretch" spacing={1} mt={2}>
              {club.players.map((p) => (
                <PlayerRow key={p.slug} player={p} squad={squad.data.results} />
              ))}
            </VStack>
          )}
        </>
      )}
    </Box>
  )
}

export default function SyncPage() {
  const clubs = getClubsWithPlayers()
  const mappedClubs = clubs.filter((c) => c.apiTeamId).length

  return (
    <PageContainer maxW="900px">
      <PageHeader eyebrow="API-Football" title="Sincronización" />

      <StatusCard />
      <SyncCard />
      <HistoryCard />

      <Card title={`IDs de API-Football · ${mappedClubs}/${clubs.length} clubes`} icon={FiSearch}>
        <Text fontSize="sm" color="brand.gray" mb={4}>
          Buscá cada club, copiá su ID y pegalo como <Code fontSize="xs">apiTeamId</Code> en{' '}
          <Code fontSize="xs">src/data/clubs.js</Code>. Con el club cargado, el plantel te sugiere el{' '}
          <Code fontSize="xs">apiPlayerId</Code> de cada jugador para <Code fontSize="xs">src/data/players.js</Code>.
          Después de editar los archivos hay que hacer deploy.
        </Text>
        <VStack align="stretch" spacing={3}>
          {clubs.map((club) => <ClubMapping key={club.id} club={club} />)}
        </VStack>
      </Card>
    </PageContainer>
  )
}
