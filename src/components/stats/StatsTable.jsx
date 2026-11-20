import { useMemo, useState } from 'react'
import {
  Box, Button, Collapse, Flex, IconButton, Image, Input, InputGroup, InputLeftElement, InputRightElement, Text,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FiDownload, FiSearch, FiX } from 'react-icons/fi'
import { playerInitials } from '../../data/players'
import { cellValue, compareBy, formatCell } from '../../lib/statsSchema'
import { TABLE_GROUPS, matchesText, tableColumns } from '../../lib/statsBoard'
import { fmtInt } from '../../lib/profileData'
import ExportPanel from './ExportPanel'
import { BLACK_CARD } from './Leaderboards'

const chip = (on) => ({
  size: 'sm', h: '36px', px: 3.5, borderRadius: 'full', variant: 'unstyled', display: 'inline-flex',
  fontFamily: 'mono', fontSize: '13px', fontWeight: 'normal', letterSpacing: '0.1em', textTransform: 'uppercase',
  border: '1px solid', borderColor: on ? 'brand.amber' : '#3a2f27',
  bg: on ? 'brand.amber' : 'transparent', color: on ? 'brand.brown' : 'brand.gray',
  _hover: { color: on ? 'brand.brown' : 'white', borderColor: on ? 'brand.amber' : 'brand.gray' },
})

// Miles con punto, como en el resto del panel (1.324 minutos).
const show = (v, c) => (c.kind === 'num' && v !== null && Math.abs(v) >= 1000 ? fmtInt(v) : formatCell(v, c))

// En el celular la columna del jugador queda fija y más angosta.
const STICKY = { position: 'sticky', zIndex: 1, bg: '#050404' }

const LONG = { partidos: 'partidos', titular: 'titularidades', minutos: 'minutos', jugador: 'nombre' }

// ─── TABLA COMPLETA ──────────────────────────────────────────────
// Todos los jugadores del filtro, con grupos de columnas, buscador y
// orden por cualquier encabezado. Adentro está el panel para
// exportar lo que se ve (o todo) a Excel o CSV.
export default function StatsTable({ rows, baseRows, lastRows, matchRows, p90, season, clubLabel, clubSlug, exportOpen, onToggleExport }) {
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('general')
  const [sort, setSort] = useState({ key: 'minutos', dir: 'desc' })
  const columns = tableColumns(group, p90)
  const groupLabel = TABLE_GROUPS.find((g) => g.id === group).label

  // El orden se guarda con la clave base (goles), así se mantiene al
  // pasar de totales a cada 90' (goles_90).
  const sortCol = columns.find((c) => (c.baseKey || c.key) === sort.key)
  const filtered = useMemo(() => rows.filter((r) => matchesText(`${r.jugador} ${r.club}`, q)), [rows, q])
  const base = useMemo(() => baseRows.filter((r) => matchesText(`${r.jugador} ${r.club}`, q)), [baseRows, q])
  const last = useMemo(() => lastRows.filter((r) => matchesText(`${r.jugador} ${r.club}`, q)), [lastRows, q])
  const matches = useMemo(() => matchRows.filter((r) => matchesText(`${r.jugador} ${r.club}`, q)), [matchRows, q])

  const sorted = useMemo(() => {
    const c = sort.key === 'jugador' ? { key: 'jugador', kind: 'text' } : sortCol
    return c ? [...filtered].sort(compareBy(c, sort.dir)) : filtered
  }, [filtered, sortCol, sort])

  // Mejor valor y máximo de cada columna (para el naranja y la barrita).
  const stats = useMemo(() => {
    const out = {}
    columns.forEach((c) => {
      const vs = filtered.map((r) => cellValue(r, c)).filter((v) => v !== null).map(Number)
      const max = vs.length ? Math.max(...vs) : null
      const min = vs.length ? Math.min(...vs) : null
      out[c.key] = { max, best: vs.length > 1 && max !== min ? (c.lowerIsBetter ? min : max) : null }
    })
    return out
  }, [columns, filtered])

  const activeKey = sort.key === 'jugador' ? 'jugador' : sortCol?.key
  const toggleSort = (key, textual) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: textual ? 'asc' : 'desc' }))
  const pickGroup = (id) => {
    setGroup(id)
    setSort({ key: TABLE_GROUPS.find((g) => g.id === id).sortKey, dir: 'desc' })
  }

  const rest = columns.map(() => 'minmax(88px, 1fr)').join(' ')
  const grid = { base: `36px 156px ${rest}`, md: `52px minmax(220px, 1.8fr) ${rest}` }
  const arrow = (k) => (activeKey === k ? (sort.dir === 'desc' ? '↓' : '↑') : '')
  const sortName = activeKey === 'jugador' ? 'nombre' : LONG[sortCol?.baseKey || sortCol?.key] || sortCol?.label.toLowerCase()

  return (
    <Flex as="section" id="tabla" direction="column" overflow="hidden" minW={0} {...BLACK_CARD} _hover={undefined}>
      <Flex wrap="wrap" align="flex-end" justify="space-between" gap={3.5} px={5} pt={5} pb={4}>
        <Box>
          <Text as="h2" fontFamily="heading" fontSize="36px" lineHeight={1}>Tabla completa</Text>
          <Text fontSize="14px" color="brand.gray" mt={1}>
            {filtered.length} jugadores · {p90 ? "cada 90'" : 'totales'} de {season} · {clubLabel}
          </Text>
        </Box>
        <Button
          leftIcon={<FiDownload />} onClick={onToggleExport} aria-expanded={exportOpen} aria-controls="exportar" minH="44px" px={4}
          fontFamily="mono" fontSize="14px" letterSpacing="0.12em" textTransform="uppercase"
          {...(exportOpen
            ? { variant: 'outline', borderColor: '#423a35', color: 'brand.amber', _hover: { bg: '#2a2420', color: 'white' } }
            : { bg: 'brand.orange', color: 'brand.brown', _hover: { bg: '#ffb35e' }, _active: { bg: '#ffb35e' } })}
        >
          {exportOpen ? 'Cerrar exportación' : 'Exportar esta tabla'}
        </Button>
      </Flex>

      <Collapse in={exportOpen} animateOpacity>
        <ExportPanel
          tableRows={sorted} tableColumns={columns} baseRows={base} lastRows={last} matchRows={matches}
          p90={p90} season={season} clubLabel={clubLabel} clubSlug={clubSlug} query={q.trim()} groupLabel={groupLabel}
        />
      </Collapse>

      <Flex wrap="wrap" align="center" gap={2.5} px={5} py={3.5} bg="#0f0c0a" borderY="1px solid" borderColor="#2a211b">
        <InputGroup flex="1 1 240px" maxW={{ md: '320px' }}>
          <InputLeftElement h="44px" pointerEvents="none" color="brand.gray"><FiSearch size={18} /></InputLeftElement>
          <Input
            type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar jugador o club…" aria-label="Buscar en la tabla"
            h="44px" borderRadius="10px" bg="#050404" border="1px solid" borderColor="#3a2f27" color="white" fontSize="15px"
            _placeholder={{ color: '#8c7f70' }} _hover={{ borderColor: 'brand.gray' }}
            _focus={{ borderColor: 'brand.orange', boxShadow: '0 0 0 3px rgba(249,160,63,.2)' }}
            sx={{ '&::-webkit-search-cancel-button': { display: 'none' } }}
          />
          {q && (
            <InputRightElement h="44px">
              <IconButton size="sm" variant="ghost" icon={<FiX />} aria-label="Borrar búsqueda" color="brand.gray"
                _hover={{ color: 'white', bg: 'brand.brownLight' }} onClick={() => setQ('')} />
            </InputRightElement>
          )}
        </InputGroup>
        <Flex role="group" aria-label="Columnas" wrap="wrap" align="center" gap={1.5}>
          <Text fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray" mr={0.5}>Columnas</Text>
          {TABLE_GROUPS.map((g) => (
            <Button key={g.id} {...chip(group === g.id)} aria-pressed={group === g.id} onClick={() => pickGroup(g.id)}>{g.label}</Button>
          ))}
        </Flex>
        <Box flex={1} />
        <Text fontSize="14px" color="brand.gray">{filtered.length} de {rows.length} jugadores</Text>
      </Flex>

      <Box overflowX="auto">
        <Box minW={{ base: `${192 + columns.length * 88}px`, md: `${300 + columns.length * 96}px` }}>
          <Box display="grid" gridTemplateColumns={grid} minH="46px" bg="#0f0c0a" borderBottom="1px solid" borderColor="#211a15">
            <Flex align="center" justify="center" fontFamily="mono" fontSize="12px" letterSpacing="0.16em" color="brand.gray" {...STICKY} left={0} bg="#0f0c0a">#</Flex>
            {[{ key: 'jugador', short: 'Jugador', label: 'nombre', text: true }, ...columns].map((c) => (
              <Box
                key={c.key} as="button" type="button" title={`Ordenar por ${c.label}`} onClick={() => toggleSort(c.baseKey || c.key, c.text)}
                {...(c.key === 'jugador' ? { ...STICKY, left: { base: '36px', md: '52px' }, bg: '#0f0c0a' } : {})}
                display="flex" alignItems="center" justifyContent={c.text ? 'flex-start' : 'flex-end'} gap={1} px={3} minH="46px"
                fontFamily="mono" fontSize="13px" letterSpacing="0.12em" textTransform="uppercase" whiteSpace="nowrap"
                color={activeKey === c.key ? 'brand.orange' : 'brand.gray'} _hover={{ color: activeKey === c.key ? 'brand.orange' : 'white' }}
                _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '-2px' }}
                aria-sort={activeKey === c.key ? (sort.dir === 'desc' ? 'descending' : 'ascending') : undefined}
              >
                {c.short}<Text as="span" color="brand.orange" minW="8px">{arrow(c.key)}</Text>
              </Box>
            ))}
          </Box>

          {sorted.map((r, i) => (
            <Box key={r.slug} display="grid" gridTemplateColumns={grid} minH="58px" borderBottom="1px solid" borderColor="#211a15"
              _hover={{ bg: '#17120e', '& > .stk': { bg: '#17120e' } }}>
              <Flex className="stk" align="center" justify="center" fontFamily="mono" fontSize="15px" color="#8c7f70" {...STICKY} left={0}>{i + 1}</Flex>
              <Flex className="stk" align="center" gap={{ base: 2, md: 3 }} py={2} pl={1} pr={3} minW={0} {...STICKY} left={{ base: '36px', md: '52px' }}
                borderRight={{ base: '1px solid #211a15', md: 0 }}>
                {r.photo ? (
                  <Image src={r.photo} alt="" boxSize={{ base: '30px', md: '38px' }} borderRadius="9px" objectFit="cover" objectPosition="top" bg="#2a2420" flexShrink={0} />
                ) : (
                  <Flex boxSize={{ base: '30px', md: '38px' }} borderRadius="9px" bg="brand.brownLight" align="center" justify="center" fontFamily="heading" color="brand.amber" flexShrink={0}>
                    {playerInitials(r.jugador)}
                  </Flex>
                )}
                <Box minW={0}>
                  <Text as={RouterLink} to={`/jugador/${r.slug}`} display="block" fontSize={{ base: '14px', md: '15px' }} fontWeight="600" noOfLines={1}
                    _hover={{ color: 'brand.orange', textDecoration: 'underline' }}>{r.jugador}</Text>
                  <Flex align="center" gap={1.5} fontSize="12px" color="brand.gray" minW={0}>
                    {r.clubCrest && <Image src={r.clubCrest} alt="" boxSize="13px" objectFit="contain" />}
                    <Text noOfLines={1}>{r.club}</Text>
                  </Flex>
                </Box>
              </Flex>
              {columns.map((c) => {
                const v = cellValue(r, c)
                const on = c.key === activeKey
                const { max, best } = stats[c.key]
                const isBest = best !== null && v !== null && Number(v) === best
                return (
                  <Flex key={c.key} direction="column" align="flex-end" justify="center" gap={1.5} px={3}
                    bg={on ? 'rgba(249,160,63,.06)' : 'transparent'} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    <Text fontSize="15px" color={isBest ? 'brand.orange' : v === null ? '#8c7f70' : 'white'} fontWeight={isBest ? 700 : 400}>
                      {show(v, c)}
                    </Text>
                    {on && (
                      <Box w="100%" maxW="64px" h="3px" borderRadius="2px" bg="#1c1712" overflow="hidden">
                        <Box h="100%" bg="brand.orange" w={v !== null && max ? `${Math.max(3, Math.round((Number(v) / max) * 100))}%` : '0%'} />
                      </Box>
                    )}
                  </Flex>
                )
              })}
            </Box>
          ))}
          {!sorted.length && (
            <Text px={5} py={6} fontSize="15px" color="brand.gray">
              {rows.length ? 'Nadie coincide con la búsqueda.' : `No hay estadísticas de ${season} para este filtro.`}
            </Text>
          )}
        </Box>
      </Box>

      <Flex wrap="wrap" justify="space-between" gap={2} px={5} py={3} fontSize="13px" color="#8c7f70">
        <Text>Tocá un encabezado para ordenar y el nombre para abrir la ficha. En naranja, el mejor de cada columna.</Text>
        {sortName && <Text>Ordenado por {sortName} {sort.dir === 'desc' ? 'de mayor a menor' : 'de menor a mayor'}</Text>}
      </Flex>
    </Flex>
  )
}
