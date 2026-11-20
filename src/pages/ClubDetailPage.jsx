import { useMemo, useState } from 'react'
import { Box, Button, Code, Flex, Image, Text, useDisclosure } from '@chakra-ui/react'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { getClub } from '../data/clubs'
import { getClubPlayers, getClubsWithPlayers, playerInitials } from '../data/players'
import { useClubMatches } from '../hooks/useClubMatches'
import { useHomeData } from '../hooks/usePlayerStats'
import { clubSeason, clubStatus, clubsOverview } from '../lib/clubsData'
import { fmtInt } from '../lib/profileData'
import NotFoundNotice from '../components/ui/NotFoundNotice'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ClubCrest from '../components/clubs/ClubCrest'
import CrestStrip from '../components/clubs/CrestStrip'
import ClubSlotCard from '../components/clubs/ClubSlotCard'
import ClubPlayersTable from '../components/clubs/ClubPlayersTable'
import heroTexture from '../assets/fondo_led3.webp'

const SLOT_LABELS = { last: 'Último resultado', next: 'Próximo partido' }
const lbl = { fontFamily: 'mono', fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'brand.gray' }

// Lo que se ve de un club. Va con key={clubId}: al saltar a otro club
// desde la franja de escudos se arma de cero, sin formularios abiertos
// del club anterior.
function ClubView({ club, players, rows, rowsLoading, allClubs, initialEdit }) {
  const controller = useClubMatches(club.id)
  const { matches, outOfSync, loading, saving, saveMatch, deleteMatch } = controller
  const [editing, setEditing] = useState(initialEdit)
  const [pending, setPending] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const saveDialog = useDisclosure()
  const deleteDialog = useDisclosure()

  const own = useMemo(() => rows.filter((r) => r.player.clubId === club.id), [rows, club.id])
  const season = useMemo(() => clubSeason(own), [own])
  // La franja usa lo leído para todos los clubes; el club abierto toma
  // lo de su propio editor, que se actualiza al guardar.
  const strip = useMemo(() => {
    if (rowsLoading) return allClubs.map((c) => ({ club: c }))
    return clubsOverview(allClubs, rows).map((x) => (x.club.id === club.id && !loading ? { ...x, status: clubStatus(club, matches, outOfSync) } : x))
  }, [allClubs, rows, rowsLoading, club, loading, matches, outOfSync])

  const n = players.length
  const names = players.map((p) => p.name).join(', ')
  const kpis = [
    ['Jugadores', n],
    ['Partidos jugados', rowsLoading ? '…' : fmtInt(season.partidos)],
    ['Goles', rowsLoading ? '…' : season.goles],
    ['Asistencias', rowsLoading ? '…' : season.asistencias],
    ['Rating promedio', rowsLoading ? '…' : season.rating ? season.rating.toFixed(2) : '—'],
  ]

  const askSave = (slot, form, files) => { setPending({ slot, form, files }); saveDialog.onOpen() }
  const doSave = async () => {
    if (!pending) return
    const ok = await saveMatch(pending.slot, pending.form, pending.files)
    if (ok) setEditing(null)
  }

  return (
    <Box>
      <Box
        px={{ base: 4, md: 6, lg: 10 }} pt={4} pb={6} borderBottom="1px solid" borderColor="#2e2825"
        bgImage={`linear-gradient(90deg, rgba(13,12,11,.97) 0%, rgba(13,12,11,.88) 50%, rgba(13,12,11,.55) 100%), url(${heroTexture})`}
        bgSize="cover" bgPosition="center right"
      >
        <Flex maxW="1360px" mx="auto" direction="column" gap={4}>
          <Button as={RouterLink} to="/clubes" variant="link" alignSelf="flex-start" leftIcon={<FiArrowLeft />} color="brand.orange"
            fontFamily="mono" fontSize="14px" letterSpacing="0.14em" textTransform="uppercase" minH="44px" fontWeight="normal">
            Clubes
          </Button>
          <Flex wrap="wrap" align="center" gap={{ base: 5, md: 7 }}>
            <Box filter="drop-shadow(0 10px 24px rgba(0,0,0,.6))">
              <ClubCrest club={club} size={{ base: '88px', md: '140px' }} fontSize="3xl" />
            </Box>
            <Flex flex="1 1 380px" minW={0} direction="column" gap={2.5}>
              <Text {...lbl} fontSize="13px" color="brand.orange">{club.competition} · {club.country}</Text>
              <Text as="h1" fontFamily="heading" fontSize={{ base: '56px', md: '96px' }} lineHeight={0.86}>{club.name}</Text>
              <Flex wrap="wrap" align="center" gap={2.5}>
                <Flex align="center" gap={1.5} px={3} py={1} borderRadius="full" fontFamily="mono" fontSize="13px" letterSpacing="0.1em" textTransform="uppercase"
                  bg={club.apiTeamId ? '#24392b' : '#3a2a17'} color={club.apiTeamId ? '#8fe3ae' : 'brand.orange'}>
                  <Box boxSize="7px" borderRadius="full" bg="currentColor" />
                  {club.apiTeamId ? 'Se sincroniza solo con API-Football' : 'Sin ID de API-Football: carga manual'}
                </Flex>
                {club.stadium && <Text fontSize="14px" color="brand.gray">{club.stadium}</Text>}
              </Flex>
            </Flex>
            <Flex flex="0 1 360px" minW={0} direction="column" gap={2.5} p={4} borderRadius="16px" bg="#050404" boxShadow="inset 0 3px 0 #F9A03F">
              <Text {...lbl} color="brand.orange">Lo que cargues acá se aplica a</Text>
              <Flex wrap="wrap" gap={2}>
                {players.map((p) => (
                  <Flex key={p.slug} as={RouterLink} to={`/jugador/${p.slug}`} align="center" gap={2} pl={1} pr={3} py={1} minH="36px" borderRadius="full"
                    bg="#0f0c0a" border="1px solid" borderColor="#3a2f27" fontSize="14px" _hover={{ borderColor: 'brand.orange' }}
                    _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '2px' }}>
                    {p.photo ? (
                      <Image src={p.photo} alt="" boxSize="28px" borderRadius="full" objectFit="cover" objectPosition="top" bg="#2a2420" />
                    ) : (
                      <Flex boxSize="28px" borderRadius="full" bg="brand.brownLight" align="center" justify="center" fontSize="11px" color="brand.amber">{playerInitials(p.name)}</Flex>
                    )}
                    {p.name}
                  </Flex>
                ))}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Box>

      <Box bg="#151312" borderBottom="1px solid" borderColor="#2e2825" px={{ base: 4, md: 6, lg: 10 }} py={4}>
        <Flex maxW="1360px" mx="auto" wrap="wrap" rowGap={3}>
          {kpis.map(([k, v]) => (
            <Flex key={k} direction="column" gap={0.5} py={1.5} pr={5} minW="120px" flex="1 1 140px">
              <Text {...lbl}>{k}</Text>
              <Text fontFamily="heading" fontSize="44px" lineHeight={1}>{v}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      <CrestStrip items={strip} current={club.id} />

      <Box px={{ base: 4, md: 6, lg: 10 }} pt={6} pb={14}>
        <Flex maxW="1360px" mx="auto" direction="column" gap="22px">
          <Flex wrap="wrap" align="baseline" justify="space-between" gap={2}>
            <Text as="h2" fontFamily="heading" fontSize="36px" lineHeight={1}>Partidos del club</Text>
            <Text fontSize="14px" color="brand.gray">Así se ven hoy en {n === 1 ? 'la landing de' : `las landings de los ${n}`} {n === 1 ? players[0].name : 'jugadores'}</Text>
          </Flex>

          {loading ? (
            <Text fontSize="15px" color="brand.gray" py={8}>Cargando partidos…</Text>
          ) : (
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(min(100%, 440px), 1fr))" gap="18px" alignItems="start">
              {['last', 'next'].map((slot) => (
                <ClubSlotCard
                  key={slot} slot={slot} club={club} match={matches[slot]} outOfSync={outOfSync[slot]} n={n}
                  editing={editing === slot} saving={saving}
                  onEdit={() => setEditing(slot)} onCancel={() => setEditing(null)} onSave={askSave}
                  onDelete={() => { setToDelete(slot); deleteDialog.onOpen() }}
                />
              ))}
            </Box>
          )}

          <ClubPlayersTable club={club} players={players} rows={own} season={season} />
        </Flex>
      </Box>

      <ConfirmDialog
        isOpen={saveDialog.isOpen} onClose={saveDialog.onClose} onConfirm={doSave} tone="brand" confirmLabel="Aplicar a todos"
        title={`¿Aplicar a ${n} ${n === 1 ? 'jugador' : 'jugadores'}?`}
        description={(
          <>
            <Text mb={2}>
              Se va a guardar <Text as="span" color="white">“{SLOT_LABELS[pending?.slot] || ''}”</Text> con estos mismos datos en todos los jugadores de {club.name}:
            </Text>
            <Text color="white" mb={2}>{names}</Text>
            <Text>
              {n === 1 ? 'Su landing va' : 'Sus landings van'} a pasar a mostrar este partido. Se pisa lo que tengan cargado hoy.
            </Text>
          </>
        )}
      />
      <ConfirmDialog
        isOpen={deleteDialog.isOpen} onClose={deleteDialog.onClose} onConfirm={() => toDelete && deleteMatch(toDelete)}
        title="¿Eliminar partido?" confirmLabel="Eliminar" tone="danger"
        description={`Se va a borrar “${SLOT_LABELS[toDelete] || ''}” en los ${n} jugadores de ${club.name}. Sus landings van a dejar de mostrarlo. Esta acción no se puede deshacer.`}
      />
    </Box>
  )
}

// ─── PÁGINA DEL CLUB ─────────────────────────────────────────────
// Portada con escudo y a quiénes afecta, los números de la temporada,
// la franja para saltar de club, los dos partidos tal como salen en las
// landings (se editan ahí mismo, para todo el club) y sus jugadores.
// ?editar=last|next abre ese partido ya en edición.
export default function ClubDetailPage() {
  const { clubId } = useParams()
  const [params] = useSearchParams()
  const club = getClub(clubId)
  const players = useMemo(() => getClubPlayers(clubId), [clubId])
  const allClubs = useMemo(() => getClubsWithPlayers(), [])
  // Estado y temporada de todos los jugadores: alimenta la franja de
  // escudos, los números del club y la tabla.
  const { rows, loading } = useHomeData()
  const edit = params.get('editar')

  if (!club) {
    return (
      <NotFoundNotice
        title="Club no encontrado"
        description={
          <>
            No hay ningún club con el id <Code fontSize="12px">{clubId}</Code> en{' '}
            <Code fontSize="12px">src/data/clubs.js</Code>. Revisá la URL o sumá la entrada al archivo.
          </>
        }
        backTo="/clubes"
        backLabel="Clubes"
      />
    )
  }

  return (
    <ClubView
      key={club.id} club={club} players={players} rows={rows} rowsLoading={loading} allClubs={allClubs}
      initialEdit={edit === 'last' || edit === 'next' ? edit : null}
    />
  )
}
