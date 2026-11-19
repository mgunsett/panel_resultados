import { Box, Flex, HStack, Text, Image, Badge } from '@chakra-ui/react'
import { MATCH_COLUMNS, cellValue, formatCell } from '../../lib/statsSchema'
import { StatTile, StatGrid } from './StatTile'

const pick = (keys) => keys.map((k) => MATCH_COLUMNS.find((c) => c.key === k))
const MAIN = pick(['minutos', 'rating', 'goles', 'asistencias'])
const DETAIL = pick([
  'tiros', 'tirosArco', 'pases', 'precisionPases', 'pasesClave', 'quites', 'intercepciones',
  'duelosG', 'duelosPct', 'regates', 'faltasR', 'faltasC', 'atajadas', 'golesRec', 'amarillas', 'rojas',
])

const RESULT_COLORS = { G: 'green', E: 'gray', P: 'red' }

// Ficha de un partido del jugador (stats/last o una fila del historial).
export default function LastMatchCard({ match, title = 'Último partido' }) {
  if (!match) {
    return <Text fontSize="sm" color="brand.gray">Todavía no hay estadísticas de partido para este jugador.</Text>
  }
  const res = cellValue(match, MATCH_COLUMNS.find((c) => c.key === 'resultado'))
  const detail = DETAIL.filter((c) => cellValue(match, c) !== null)

  return (
    <Box>
      <Flex align="center" gap={3} mb={4} wrap="wrap">
        {match.rivalLogo && <Image src={match.rivalLogo} boxSize="34px" objectFit="contain" alt="" />}
        <Box flex={1} minW="160px">
          <Text fontFamily="mono" fontSize="10px" color="brand.gray" textTransform="uppercase" letterSpacing="widest">
            {title} · {formatCell(match.fecha, { kind: 'date' })} · {match.competicion}
          </Text>
          <Text fontFamily="heading" fontSize="2xl" color="white" lineHeight={1.1}>
            {match.condicion === 'L' ? 'vs' : 'en'} {match.rival}{' '}
            {match.gf !== null && match.gf !== undefined && <Text as="span" color="brand.amber">{match.gf}-{match.gc}</Text>}
          </Text>
        </Box>
        <HStack>
          {res && <Badge colorScheme={RESULT_COLORS[res]} fontFamily="mono">{{ G: 'Ganó', E: 'Empató', P: 'Perdió' }[res]}</Badge>}
          {match.jugo && <Badge variant="outline" color="brand.amber" fontFamily="mono">{match.titular === '1' ? 'Titular' : 'Suplente'}{match.posicion ? ` · ${match.posicion}` : ''}</Badge>}
          {match.capitan && <Badge colorScheme="orange" fontFamily="mono">Capitán</Badge>}
        </HStack>
      </Flex>

      {match.sinDatos ? (
        <Text fontSize="sm" color="brand.gray">API-Football no publicó estadísticas por jugador para este partido.</Text>
      ) : !match.jugo ? (
        <Text fontSize="sm" color="brand.gray">No sumó minutos en este partido.</Text>
      ) : (
        <>
          <StatGrid columns={{ base: 2, md: 4 }}>
            {MAIN.map((c, i) => <StatTile key={c.key} label={c.label} value={formatCell(cellValue(match, c), c)} accent index={i} />)}
          </StatGrid>
          {detail.length > 0 && (
            <Box mt={2.5}>
              <StatGrid>
                {detail.map((c, i) => <StatTile key={c.key} label={c.label} value={formatCell(cellValue(match, c), c)} index={i + 4} />)}
              </StatGrid>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
