import { useState } from 'react'
import { Box, Flex, Image, SimpleGrid, Text } from '@chakra-ui/react'
import { FiCalendar, FiClock, FiInfo } from 'react-icons/fi'
import { clubInitials } from '../../data/clubs'
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

// Estado vacío de un panel: dice qué falta y por qué, en vez de dejar
// un hueco. `action` es opcional (un botón para completarlo).
export function EmptyState({ icon: Icon = FiInfo, title, children, action }) {
  return (
    <Flex direction="column" align="flex-start" justify="center" gap={2.5} flex={1} minH="120px" px={5} py={5}
      borderRadius="12px" border="1px dashed" borderColor="#3a322d" bg="#151312">
      <Flex align="center" gap={2.5} color="brand.orange">
        <Icon size={18} aria-hidden="true" />
        <Text fontSize="16px" fontWeight="600" color="white">{title}</Text>
      </Flex>
      {children && <Text fontSize="14px" color="brand.gray" maxW="60ch">{children}</Text>}
      {action}
    </Flex>
  )
}

const teamLogoUrl = (id) => (id ? `https://media.api-sports.io/football/teams/${id}.png` : null)

// Escudo con respaldo: si la imagen no carga (o no hay), muestra las
// iniciales sobre un círculo, así nunca queda un ícono roto.
export function Crest({ src, name, size = 64 }) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) {
    return (
      <Flex boxSize={`${size}px`} flexShrink={0} align="center" justify="center" p={`${Math.round(size * 0.12)}px`}
        borderRadius="full" bg="radial-gradient(circle at 50% 35%, #2f2925 0%, #1a1715 75%)" border="1px solid" borderColor="#3a322d">
        <Image src={src} alt={`Escudo de ${name}`} w="100%" h="100%" objectFit="contain" loading="lazy"
          onError={() => setFailed(true)} filter="drop-shadow(0 4px 10px rgba(0,0,0,.45))" />
      </Flex>
    )
  }
  return (
    <Flex boxSize={`${size}px`} flexShrink={0} align="center" justify="center" borderRadius="full"
      bg="brand.brownDark" border="1px solid" borderColor="brand.brownLight" aria-label={`Escudo de ${name}`}>
      <Text fontFamily="heading" fontSize={`${Math.round(size * 0.34)}px`} color="brand.orange" lineHeight={1}>{clubInitials(name)}</Text>
    </Flex>
  )
}

// Un equipo del marcador: escudo grande y el nombre completo, que
// puede ocupar dos líneas pero nunca se corta.
function TeamSide({ name, logo, ours, side }) {
  return (
    <Flex direction="column" align="center" gap={2} flex="1 1 0" minW={0} textAlign="center">
      <Crest src={logo} name={name} size={68} />
      <Text fontSize="15px" fontWeight="600" lineHeight={1.2} color={ours ? 'white' : 'brand.amber'}
        sx={{ overflowWrap: 'break-word', textWrap: 'balance' }}>
        {name || 'Rival'}
      </Text>
      <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="#8c7f70">{side}</Text>
    </Flex>
  )
}

const longDate = (iso) => {
  const d = shortDate(iso)
  const y = String(iso || '').slice(0, 4)
  return d ? `${d} ${y}` : ''
}

// Último partido del jugador (stats/last): marcador con los dos
// escudos, competición y fecha, rating y sus números del partido.
export function LastMatchPanel({ match, club, lastPlayed }) {
  if (!match) {
    return (
      <Card title="Último partido" flex={1}>
        <EmptyState icon={FiCalendar} title="Sin partidos sincronizados">
          Cuando su club juegue y API-Football publique la planilla, acá aparece el marcador y sus números. Se actualiza solo.
        </EmptyState>
      </Card>
    )
  }
  const res = resultOf(match)
  const tone = RESULT[res] || RESULT.E
  const home = match.condicion !== 'V'
  const ourName = club?.name || 'Su club'
  const ourLogo = club?.crest || null
  const rivalLogo = match.rivalLogo || teamLogoUrl(match.rivalId)
  const left = home ? { name: ourName, logo: ourLogo, ours: true } : { name: match.rival, logo: rivalLogo }
  const right = home ? { name: match.rival, logo: rivalLogo } : { name: ourName, logo: ourLogo, ours: true }
  const leftGoals = home ? match.gf : match.gc
  const rightGoals = home ? match.gc : match.gf
  const rating = num(match.rating)
  const pct = cellValue(match, MATCH_COLUMNS.find((c) => c.key === 'precisionPases'))
  const duels = num(match.duelos) ? `${dash(match.duelosG)}/${match.duelos}` : '—'
  const tiles = [
    ['Goles', dash(match.goles)], ['Asistencias', dash(match.asistencias)], ['Tiros', num(match.tiros) !== null ? `${match.tiros}${num(match.tirosArco) !== null ? ` (${match.tirosArco})` : ''}` : '—'],
    ['Pases clave', dash(match.pasesClave)], ['% pases', pct === null ? '—' : `${pct}%`], ['Duelos', duels],
    ['Quites', dash(match.quites)], ['Regates', dash(match.regates)], ['Faltas rec.', dash(match.faltasR)],
  ]
  const showOther = lastPlayed && lastPlayed.fixtureId !== match.fixtureId

  return (
    <Card title="Último partido" flex={1} position="relative" overflow="hidden"
      right={res && (
        <Text px={2.5} py={1} borderRadius="full" bg={tone.bg} color={tone.color} fontFamily="mono" fontSize="12px"
          letterSpacing="0.14em" textTransform="uppercase" fontWeight="600">{tone.word}</Text>
      )}>
      <Text fontSize="13px" color="brand.gray" mt={-1.5}>
        {[match.competicion, longDate(match.fecha), home ? 'Local' : 'Visitante'].filter(Boolean).join(' · ')}
      </Text>

      {/* Marcador */}
      <Flex align="flex-start" gap={2} px={{ base: 1, md: 2 }} py={4} borderRadius="14px"
        bg="linear-gradient(180deg, #221e1b 0%, #171412 100%)" border="1px solid" borderColor="#2e2825">
        <TeamSide {...left} side="Local" />
        <Flex direction="column" align="center" flexShrink={0} pt="14px" minW="84px">
          <Text fontFamily="heading" fontSize="48px" lineHeight={1} whiteSpace="nowrap" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {num(leftGoals) !== null ? leftGoals : '–'}<Text as="span" color="#5a4f47" mx={1.5}>:</Text>{num(rightGoals) !== null ? rightGoals : '–'}
          </Text>
          <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="#8c7f70" mt={1}>Final</Text>
        </Flex>
        <TeamSide {...right} side="Visitante" />
      </Flex>

      {match.sinDatos ? (
        <EmptyState title="Sin planilla de la API">
          API-Football no publicó estadísticas por jugador para este partido (pasa en algunas copas y ligas chicas).
        </EmptyState>
      ) : match.jugo === false ? (
        <EmptyState icon={FiClock} title="No sumó minutos en este partido">
          {showOther
            ? `Su último partido jugado fue ${rivalLabel(lastPlayed)} (${shortDate(lastPlayed.fecha)})${num(lastPlayed.rating) !== null ? `, con rating ${Number(lastPlayed.rating).toFixed(1)}` : ''}.`
            : 'Estuvo fuera de la planilla o en el banco sin ingresar.'}
        </EmptyState>
      ) : (
        <>
          {/* Rating y minutos */}
          <Flex align="center" gap={4} px={4} py={3} borderRadius="12px" bg="#151312">
            <Flex direction="column">
              <Label>Rating</Label>
              <Text fontFamily="heading" fontSize="44px" lineHeight={1} color={rating === null ? 'brand.gray' : 'brand.orange'}>
                {rating === null ? '—' : rating.toFixed(1)}
              </Text>
            </Flex>
            <Box flex={1} h="6px" borderRadius="full" bg="#2e2825" overflow="hidden" aria-hidden="true">
              <Box h="100%" w={`${rating === null ? 0 : Math.min(100, Math.max(0, ((rating - 5) / 5) * 100))}%`} bg="brand.orange" borderRadius="full" />
            </Box>
            <Flex direction="column" align="flex-end">
              <Label>Minutos</Label>
              <Text fontFamily="heading" fontSize="30px" lineHeight={1}>{dash(match.minutos)}{num(match.minutos) !== null && "'"}</Text>
              <Text fontSize="12px" color="brand.gray">{match.titular === '1' ? 'Titular' : match.titular === '0' ? 'Suplente' : ''}{match.posicion ? ` · ${match.posicion}` : ''}</Text>
            </Flex>
          </Flex>
          {rating === null && (
            <Text fontSize="13px" color="#8c7f70" mt={-1.5}>La API no le asignó rating en este partido (suele pasar con pocos minutos).</Text>
          )}
          <SimpleGrid columns={3} spacing={2}>
            {tiles.map(([k, v]) => (
              <Box key={k} px={3} py={2.5} borderRadius="10px" bg="#151312" minW={0}>
                <Label noOfLines={1}>{k}</Label>
                <Text fontFamily="heading" fontSize="26px" lineHeight={1.1} color={v === '—' ? '#5a4f47' : 'white'}>{v}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </>
      )}
    </Card>
  )
}

// Totales de la temporada agrupados por área de juego. Lo que los
// totales de la API no traen se completa con los partidos guardados y
// se marca con * (con la cantidad de partidos que suma).
export function StatAreas({ season, derived = {}, expected }) {
  if (!season) {
    return (
      <Card>
        <EmptyState title="Todavía no hay totales de la temporada">
          Se piden a API-Football en la próxima sincronización (una vez por día, o con «Sincronizar ahora»).
        </EmptyState>
      </Card>
    )
  }
  const s = season
  const pct = (v) => (num(v) === null ? '—' : `${Math.round(v)}%`)
  const duelPct = num(s.duelos) ? Math.round((s.duelosG / s.duelos) * 100) : null
  const areas = [
    { title: 'Ataque', rows: [['Goles', 'goles'], ['Tiros', 'tiros'], ['Tiros al arco', 'tirosArco'], ['Regates', 'regates']] },
    { title: 'Creación', rows: [['Asistencias', 'asistencias'], ['Pases clave', 'pasesClave'], ['Pases', 'pases'], ['Precisión', null, pct(s.precisionPases), 'precisionPases']] },
    { title: 'Defensa', rows: [['Quites', 'quites'], ['Intercepciones', 'intercepciones'], ['Duelos ganados', 'duelosG'], ['% duelos', null, pct(duelPct)]] },
    { title: 'Disciplina', rows: [['Faltas recibidas', 'faltasR'], ['Faltas cometidas', 'faltasC'], ['Amarillas', 'amarillas'], ['Rojas', 'rojas']] },
  ]
  return (
    <SimpleGrid minChildWidth="250px" spacing={5}>
      {areas.map((a) => {
        const notes = a.rows.map(([, key, , dkey]) => derived[key || dkey]).filter(Boolean)
        const missing = a.rows.filter(([, key]) => key && num(s[key]) === null).length
        return (
          <Card key={a.title} gap={1.5}>
            <Text as="h3" fontFamily="heading" fontSize="24px" lineHeight={1} mb={1.5}>{a.title}</Text>
            <Flex gap={2.5} pb={1}>
              <Box flex={1} />
              <Label w="58px" textAlign="right">Total</Label>
              <Label w="58px" textAlign="right">C/90'</Label>
            </Flex>
            {a.rows.map(([label, key, fixed, dkey]) => {
              const d = derived[key || dkey]
              const v = key ? num(s[key]) : null
              const p = key ? per90(s[key], d?.minutos ?? s.minutos) : null
              return (
                <Flex key={label} align="baseline" gap={2.5} py={2} borderBottom="1px solid" borderColor="#2e2825" _last={{ borderBottom: 0 }}>
                  <Text flex={1} fontSize="15px" color="brand.amber">{label}{d && <Text as="sup" color="brand.orange" ml={0.5}>*</Text>}</Text>
                  <Text w="58px" textAlign="right" fontFamily="heading" fontSize="24px" sx={{ fontVariantNumeric: 'tabular-nums' }}
                    color={(key ? v === null : fixed === '—') ? '#5a4f47' : 'white'}>
                    {key ? dash(v, fmtInt) : fixed}
                  </Text>
                  <Text w="58px" textAlign="right" fontSize="14px" color="brand.gray">{p === null ? '—' : p.toFixed(2)}</Text>
                </Flex>
              )
            })}
            {notes.length > 0 && (
              <Text fontSize="12px" color="#8c7f70" mt={1}>
                * Suma de {notes[0].n} partido{notes[0].n === 1 ? '' : 's'} guardado{notes[0].n === 1 ? '' : 's'}
                {expected && notes[0].n < expected ? ` de ${expected}` : ''}: la API todavía no lo trae en los totales del año.
              </Text>
            )}
            {missing > 0 && !notes.length && (
              <Text fontSize="12px" color="#8c7f70" mt={1}>— La API no publica este dato para sus competiciones.</Text>
            )}
          </Card>
        )
      })}
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

