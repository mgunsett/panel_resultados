import {
  Box, Flex, HStack, VStack, Text, Badge, Button, Code, Image,
  Tabs, TabList, Tab, TabPanels, TabPanel, Spinner,
} from '@chakra-ui/react'
import { FiShield, FiExternalLink } from 'react-icons/fi'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getPlayer } from '../data/players'
import { getClub } from '../data/clubs'
import { usePlayerMatches } from '../hooks/usePlayerMatches'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/ui/BackButton'
import NotFoundNotice from '../components/ui/NotFoundNotice'
import ClubCrest from '../components/clubs/ClubCrest'
import MatchEditor from '../components/match/MatchEditor'
import { usePlayerStats } from '../hooks/usePlayerStats'
import PlayerSummary from '../components/stats/PlayerSummary'
import PlayerMatches from '../components/stats/PlayerMatches'
import PlayerSeasons from '../components/stats/PlayerSeasons'

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'partidos', label: 'Partidos' },
  { id: 'temporadas', label: 'Temporadas' },
  { id: 'carga', label: 'Carga manual' },
]

const tabStyle = {
  fontFamily: 'mono', fontSize: 'xs', letterSpacing: 'widest', textTransform: 'uppercase',
  color: 'brand.gray', borderBottom: '2px solid', borderColor: 'transparent', px: { base: 2.5, md: 4 }, pb: 2.5,
  whiteSpace: 'nowrap',
  _selected: { color: 'white', borderColor: 'brand.orange' },
  _hover: { color: 'white' },
}

// ─── FICHA DEL JUGADOR ───────────────────────────────────────────
// Resuelve el slug de la URL y arma la ficha en pestañas:
//   Resumen      temporada en curso + último partido (stats/season, last)
//   Partidos     historial de la temporada (stats/history_{año})
//   Temporadas   totales año por año (stats/seasons)
//   Carga manual el editor de players/{slug}/matches de siempre. Acá el
//                guardado afecta a una sola landing, así que va sin
//                confirmación.
// La pestaña activa va en la URL (?tab=carga) para poder compartirla.

export default function PlayerDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const player = getPlayer(slug)
  const club = getClub(player?.clubId)
  // El hook se llama siempre (no puede ir después de un return); con un
  // slug inexistente la lectura falla sin efecto sobre la vista.
  const controller = usePlayerMatches(slug)
  const { stats, loading: statsLoading } = usePlayerStats(slug)
  const [params, setParams] = useSearchParams()
  const tabIndex = Math.max(0, TABS.findIndex((t) => t.id === params.get('tab')))

  if (!player) {
    return (
      <NotFoundNotice
        title="Jugador no encontrado"
        description={
          <>
            No hay ningún jugador con el slug <Code fontSize="12px">{slug}</Code> en{' '}
            <Code fontSize="12px">src/data/players.js</Code>. Revisá la URL o sumá la
            entrada al archivo.
          </>
        }
        backTo="/jugadores"
        backLabel="Jugadores"
      />
    )
  }

  const deleteDescription = (slotLabel) =>
    `Se va a borrar "${slotLabel}" de este jugador. La landing va a dejar de mostrarlo. Esta acción no se puede deshacer.`

  return (
    <PageContainer maxW="1200px">
      <Box mb={4}>
        <BackButton to="/jugadores" label="Jugadores" />
      </Box>

      <Flex align="center" gap={4} mb={{ base: 5, md: 7 }}>
        {player.photo && (
          <Image src={player.photo} alt="" boxSize={{ base: '56px', md: '72px' }} objectFit="cover" objectPosition="top"
            borderRadius="lg" border="1px solid" borderColor="brand.brownDark" flexShrink={0} />
        )}
        {club && !player.photo && <ClubCrest club={club} size={{ base: '48px', md: '60px' }} fontSize="lg" />}

        <VStack align="stretch" spacing={2} minW={0}>
          <Text
            fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }}
            color="white" lineHeight={1}
          >
            {player.name}
          </Text>
          <HStack spacing={2} wrap="wrap">
            <Text
              fontFamily="mono" fontSize="10px" color="brand.gray"
              letterSpacing="widest" textTransform="uppercase"
            >
              {club?.name || 'Sin club'}
            </Text>
            <Badge
              fontFamily="mono" fontSize="8px" bg="brand.amberLight"
              color="brand.amber" border="1px solid" borderColor="brand.amber"
              px={2} py={0.5} letterSpacing="widest"
            >
              {player.slug}
            </Badge>
          </HStack>
        </VStack>
      </Flex>

      <HStack spacing={1} wrap="wrap" mb={4}>
      {/* Atajo al club: si el partido es el mismo para varios jugadores,
          conviene cargarlo una sola vez desde ahí. */}
      {club && (
        <Button
          variant="ghost" size="sm"
          color="brand.orange"
          fontFamily="mono" fontSize="xs"
          letterSpacing="wider" textTransform="uppercase"
          leftIcon={<FiShield size={14} />}
          _hover={{ bg: 'brand.orangeSoft' }}
          pl={2}
          onClick={() => navigate(`/club/${club.id}`)}
        >
          Cargar para todo {club.name}
        </Button>
      )}
      <Button
        variant="ghost" size="sm" color="brand.gray"
        fontFamily="mono" fontSize="xs" letterSpacing="wider" textTransform="uppercase"
        leftIcon={<FiExternalLink size={14} />} _hover={{ bg: 'brand.brownLight', color: 'white' }}
        onClick={() => navigate(`/estadisticas?club=${player.clubId || ''}`)}
      >
        Comparar con otros
      </Button>
      </HStack>

      <Tabs
        index={tabIndex}
        onChange={(i) => setParams(i ? { tab: TABS[i].id } : {}, { replace: true })}
        variant="unstyled" isLazy
      >
        <Box overflowX="auto" mb={{ base: 5, md: 6 }} borderBottom="1px solid" borderColor="brand.brownDark">
          <TabList>
            {TABS.map((t) => <Tab key={t.id} {...tabStyle}>{t.label}</Tab>)}
          </TabList>
        </Box>
        <TabPanels>
          {['resumen', 'partidos', 'temporadas'].map((id) => (
            <TabPanel key={id} p={0}>
              {statsLoading ? (
                <Flex justify="center" py={10}><Spinner color="brand.amber" /></Flex>
              ) : id === 'resumen' ? (
                <PlayerSummary player={player} stats={stats} />
              ) : id === 'partidos' ? (
                <PlayerMatches key={slug} player={player} stats={stats} />
              ) : (
                <PlayerSeasons player={player} stats={stats} />
              )}
            </TabPanel>
          ))}
          <TabPanel p={0}>
            <Box maxW="900px">
              {/* key={slug}: al saltar de un jugador a otro remonta el editor
                  entero, así no quedan tabs ni formularios con estado viejo. */}
              <MatchEditor key={slug} controller={controller} deleteDescription={deleteDescription} />
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </PageContainer>
  )
}
