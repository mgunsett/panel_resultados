import { Box, Flex, Image, SimpleGrid, Text } from '@chakra-ui/react'
import { MATCH_COLUMNS, cellValue } from '../../lib/statsSchema'
import { RESULT, dash, fmtInt, num, per90, resultOf, rivalLabel, shortDate } from '../../lib/profileData'

export function Card({ title, right, children, ...rest }) {
  return (
    <Flex direction="column" gap={3.5} p={5} borderRadius="16px" bg="brand.dark2" border="1px solid" borderColor="#2e2825" minW={0} {...rest}>
      {(title || right) && (
        <Flex wrap="wrap" align="baseline" justify="space-between" gap={2}>
          {title && <Text as="h2" fontFamily="heading" fontSize="28px" lineHeight={1}>{title}</Text>}
          {right}
        </Flex>
      )}
      {children}
    </Flex>
  )
}

const Label = (props) => (
  <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray" {...props} />
)

// Último partido del jugador (stats/last).
export function LastMatchPanel({ match }) {
  if (!match) {
    return <Card title="Último partido" flex={1}><Text fontSize="15px" color="brand.gray">Todavía no hay estadísticas de partido.</Text></Card>
  }
  const res = resultOf(match)
  const tone = RESULT[res] || RESULT.E
  const pct = cellValue(match, MATCH_COLUMNS.find((c) => c.key === 'precisionPases'))
  const tiles = [
    ['Minutos', dash(match.minutos)], ['Goles', dash(match.goles)], ['Asistencias', dash(match.asistencias)],
    ['Tiros', dash(match.tiros)], ['Pases clave', dash(match.pasesClave)], ['% pases', pct === null ? '—' : `${pct}%`],
  ]
  return (
    <Card title="Último partido" flex={1} right={<Text fontSize="13px" color="brand.gray">{shortDate(match.fecha)} · {match.competicion}</Text>}>
      <Flex align="center" gap={3.5}>
        {res && (
          <Flex boxSize="40px" borderRadius="10px" align="center" justify="center" bg={tone.bg} color={tone.color}
            fontFamily="mono" fontWeight="700" fontSize="20px" flexShrink={0}>{res}</Flex>
        )}
        {match.rivalLogo && <Image src={match.rivalLogo} alt="" boxSize="34px" objectFit="contain" />}
        <Text flex={1} minW={0} fontFamily="heading" fontSize={{ base: '26px', md: '28px' }} lineHeight={1}>
          {rivalLabel(match)}{' '}
          {num(match.gf) !== null && <Text as="span" whiteSpace="nowrap" color="brand.amber">{match.gf}-{match.gc}</Text>}
        </Text>
        <Flex direction="column" align="flex-end">
          <Label>Rating</Label>
          <Text fontFamily="heading" fontSize="44px" lineHeight={1} color="brand.orange">
            {num(match.rating) !== null ? Number(match.rating).toFixed(1) : '—'}
          </Text>
        </Flex>
      </Flex>
      {match.sinDatos ? (
        <Text fontSize="14px" color="brand.gray">API-Football no publicó estadísticas por jugador para este partido.</Text>
      ) : match.jugo === false ? (
        <Text fontSize="14px" color="brand.gray">No sumó minutos en este partido.</Text>
      ) : (
        <SimpleGrid columns={3} spacing={2}>
          {tiles.map(([k, v]) => (
            <Box key={k} px={3} py={2.5} borderRadius="10px" bg="#151312">
              <Label>{k}</Label>
              <Text fontFamily="heading" fontSize="26px" lineHeight={1.1}>{v}</Text>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Card>
  )
}

// Totales de la temporada agrupados por área de juego.
export function StatAreas({ season }) {
  if (!season) return null
  const s = season
  const pct = (v) => (num(v) === null ? '—' : `${Math.round(v)}%`)
  const duelPct = num(s.duelos) ? Math.round((s.duelosG / s.duelos) * 100) : null
  const areas = [
    { title: 'Ataque', rows: [['Goles', 'goles'], ['Tiros', 'tiros'], ['Tiros al arco', 'tirosArco'], ['Regates', 'regates']] },
    { title: 'Creación', rows: [['Asistencias', 'asistencias'], ['Pases clave', 'pasesClave'], ['Pases', 'pases'], ['Precisión', null, pct(s.precisionPases)]] },
    { title: 'Defensa', rows: [['Quites', 'quites'], ['Intercepciones', 'intercepciones'], ['Duelos ganados', 'duelosG'], ['% duelos', null, pct(duelPct)]] },
    { title: 'Disciplina', rows: [['Faltas recibidas', 'faltasR'], ['Faltas cometidas', 'faltasC'], ['Amarillas', 'amarillas'], ['Rojas', 'rojas']] },
  ]
  return (
    <SimpleGrid minChildWidth="250px" spacing={5}>
      {areas.map((a) => (
        <Card key={a.title} gap={1.5}>
          <Text as="h3" fontFamily="heading" fontSize="24px" lineHeight={1} mb={1.5}>{a.title}</Text>
          <Flex gap={2.5} pb={1}>
            <Box flex={1} />
            <Label w="58px" textAlign="right">Total</Label>
            <Label w="58px" textAlign="right">C/90'</Label>
          </Flex>
          {a.rows.map(([label, key, fixed]) => {
            const v = key ? num(s[key]) : null
            const p = key ? per90(s[key], s.minutos) : null
            return (
              <Flex key={label} align="baseline" gap={2.5} py={2} borderBottom="1px solid" borderColor="#2e2825" _last={{ borderBottom: 0 }}>
                <Text flex={1} fontSize="15px" color="brand.amber">{label}</Text>
                <Text w="58px" textAlign="right" fontFamily="heading" fontSize="24px" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {key ? dash(v, fmtInt) : fixed}
                </Text>
                <Text w="58px" textAlign="right" fontSize="14px" color="brand.gray">{p === null ? '—' : p.toFixed(2)}</Text>
              </Flex>
            )
          })}
        </Card>
      ))}
    </SimpleGrid>
  )
}

// Desglose de la temporada por competición (stats/season.competiciones).
export function CompetitionList({ season }) {
  const comps = season?.competiciones || []
  if (!comps.length) return null
  return (
    <Card title="Por competición">
      {comps.map((c) => (
        <Flex key={`${c.nombre}-${c.club}`} wrap="wrap" align="center" gap={3} px={3.5} py={3} borderRadius="10px" bg="#151312">
          {c.logo && <Image src={c.logo} alt="" boxSize="26px" objectFit="contain" />}
          <Box flex="1 1 200px" minW={0}>
            <Text fontSize="16px" fontWeight="600" noOfLines={1}>{c.nombre}</Text>
            {c.club && <Text fontSize="13px" color="brand.gray" noOfLines={1}>{c.club}</Text>}
          </Box>
          <Text fontSize="14px" color="brand.amber" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {c.partidos ?? 0} PJ · {fmtInt(c.minutos ?? 0)}' · {c.goles ?? 0} G · {c.asistencias ?? 0} A
          </Text>
        </Flex>
      ))}
    </Card>
  )
}

// Barras por temporada (una métrica por gráfico, la actual en naranja).
export function SeasonBars({ seasons, current }) {
  const years = Object.keys(seasons || {}).map(Number).sort((a, b) => a - b).slice(-5)
  if (!years.length) return null
  const charts = [
    ['Partidos', 'partidos', (v) => String(v), 0],
    ['Goles', 'goles', (v) => String(v), 0],
    ['Asistencias', 'asistencias', (v) => String(v), 0],
    ['Rating promedio', 'rating', (v) => Number(v).toFixed(2), 6],
  ]
  return (
    <SimpleGrid minChildWidth="240px" spacing={5}>
      {charts.map(([title, key, fmt, floor]) => {
        const vals = years.map((y) => num(seasons[y]?.[key]))
        const max = Math.max(...vals.filter((v) => v !== null), floor + 0.01)
        return (
          <Card key={key} title={title}>
            <Flex gap={3.5} h="150px" align="flex-end">
              {years.map((y, i) => {
                const v = vals[i]
                const h = v === null ? 0 : Math.max(4, Math.round(((Math.max(v, floor) - floor) / (max - floor)) * 110))
                return (
                  <Flex key={y} flex={1} minW={0} h="100%" direction="column" align="center" justify="flex-end" gap={1.5} title={`${y}: ${v === null ? 'sin dato' : fmt(v)}`}>
                    <Text fontSize="14px" color="brand.amber" sx={{ fontVariantNumeric: 'tabular-nums' }}>{v === null ? '—' : fmt(v)}</Text>
                    <Box w="100%" maxW="42px" h={`${h}px`} borderRadius="4px 4px 0 0" bg={y === current ? 'brand.orange' : '#5a4f47'} />
                  </Flex>
                )
              })}
            </Flex>
            <Flex gap={3.5} borderTop="1px solid" borderColor="#423a35" pt={1.5}>
              {years.map((y) => <Text key={y} flex={1} textAlign="center" fontSize="13px" color="brand.gray">{y}</Text>)}
            </Flex>
          </Card>
        )
      })}
    </SimpleGrid>
  )
}

