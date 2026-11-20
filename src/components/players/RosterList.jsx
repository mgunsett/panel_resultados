import { useMemo, useState } from 'react'
import {
  Box, Flex, Text, Image, Input, InputGroup, InputLeftElement, InputRightElement, IconButton, Button,
} from '@chakra-ui/react'
import { FiSearch, FiX } from 'react-icons/fi'
import { playerInitials } from '../../data/players'
import { matchesQuery } from '../home/PlayerSearch'
import { STATUS_COLORS } from '../home/ShowcaseCard'

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'ok', label: 'Al día' },
  { id: 'rev', label: 'Para revisar' },
]

const chipStyle = (on) => ({
  size: 'sm', h: '36px', px: 3.5, borderRadius: 'full', variant: 'unstyled', display: 'inline-flex',
  fontFamily: 'mono', fontSize: '13px', fontWeight: 'normal', letterSpacing: '0.1em', textTransform: 'uppercase',
  border: '1px solid', borderColor: on ? 'brand.amber' : 'brand.brownDark',
  bg: on ? 'brand.amber' : 'transparent', color: on ? 'brand.brown' : 'brand.gray',
  _hover: { color: on ? 'brand.brown' : 'white', borderColor: on ? 'brand.amber' : 'brand.gray' },
})

// Barra de scroll fina, del color del panel y sin flechas.
const thinScroll = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#3a332e transparent',
  '&::-webkit-scrollbar': { width: '6px' },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-button': { display: 'none', height: 0 },
  '&::-webkit-scrollbar-thumb': { background: '#3a332e', borderRadius: '3px' },
  '&::-webkit-scrollbar-thumb:hover': { background: '#8F7B54' },
}

// ─── LISTA DE JUGADORES (columna izquierda) ──────────────────────
// Agrupada por club, con buscador y filtro por estado. En desktop
// queda fija al costado mientras se recorre la ficha de la derecha.
export default function RosterList({ rows, selected, onSelect }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('todos')

  const { groups, shown } = useMemo(() => {
    let list = rows.filter((r) => matchesQuery(r, q))
    if (filter !== 'todos') list = list.filter((r) => r.status.id === filter)
    const by = new Map()
    list.forEach((r) => {
      const key = r.club?.id || '_'
      if (!by.has(key)) by.set(key, { club: r.club, rows: [] })
      by.get(key).rows.push(r)
    })
    const out = [...by.values()]
      .sort((a, b) => (a.club?.name || 'zz').localeCompare(b.club?.name || 'zz', 'es'))
      .map((g) => ({ ...g, rows: g.rows.sort((a, b) => a.player.name.localeCompare(b.player.name, 'es')) }))
    return { groups: out, shown: list.length }
  }, [rows, q, filter])

  return (
    <Flex
      as="aside" aria-label="Lista de jugadores" direction="column" gap={3} p={4}
      borderRadius="16px" bg="brand.dark2" border="1px solid" borderColor="#2e2825"
      position={{ lg: 'sticky' }} top={{ lg: '88px' }}
    >
      <Flex align="baseline" justify="space-between" gap={2}>
        <Text as="h1" fontFamily="heading" fontSize="40px" lineHeight={1}>Jugadores</Text>
        <Text fontSize="14px" color="brand.gray">{shown} de {rows.length}</Text>
      </Flex>

      <InputGroup>
        <InputLeftElement h="44px" pointerEvents="none" color="brand.gray"><FiSearch size={18} /></InputLeftElement>
        <Input
          type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar jugador o club…" aria-label="Buscar jugador o club"
          h="44px" borderRadius="10px" bg="#151312" border="1px solid" borderColor="brand.brownDark" color="white" fontSize="15px"
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

      <Flex role="group" aria-label="Filtrar por estado" wrap="wrap" gap={1.5}>
        {FILTERS.map((f) => (
          <Button key={f.id} {...chipStyle(filter === f.id)} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Button>
        ))}
      </Flex>

      <Box maxH={{ lg: 'calc(100vh - 330px)' }} minH={{ lg: '360px' }} overflowY={{ lg: 'auto' }} mx="-6px" px="6px" sx={thinScroll}>
        {groups.map((g) => (
          <Box key={g.club?.id || 'sin-club'}>
            <Flex align="center" gap={2} pt={3} pb={1} px={1}>
              {g.club?.crest && <Image src={g.club.crest} alt="" boxSize="18px" objectFit="contain" />}
              <Text flex={1} fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray" noOfLines={1}>
                {g.club?.name || 'Sin club'}
              </Text>
              <Text fontSize="12px" color="#8c7f70">{g.rows.length}</Text>
            </Flex>
            {g.rows.map((r) => {
              const on = r.player.slug === selected
              return (
                <Flex
                  key={r.player.slug} as="button" type="button" onClick={() => onSelect(r.player.slug)} aria-pressed={on}
                  w="100%" align="center" gap={3} px={2.5} py={2} minH="56px" textAlign="left" borderRadius="10px"
                  border="1px solid" borderColor={on ? 'rgba(249,160,63,.55)' : 'transparent'}
                  bg={on ? 'rgba(249,160,63,.1)' : 'transparent'} _hover={{ bg: on ? 'rgba(249,160,63,.14)' : '#221e1b' }}
                  _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '1px' }}
                >
                  {r.player.photo ? (
                    <Image src={r.player.photo} alt="" boxSize="40px" borderRadius="10px" objectFit="cover" objectPosition="top" bg="#2a2420" flexShrink={0} />
                  ) : (
                    <Flex boxSize="40px" borderRadius="10px" bg="brand.brownLight" align="center" justify="center" fontFamily="heading" color="brand.amber" flexShrink={0}>
                      {playerInitials(r.player.name)}
                    </Flex>
                  )}
                  <Box flex={1} minW={0}>
                    <Text fontSize="15px" fontWeight="600" color="white" noOfLines={1}>{r.player.name}</Text>
                    <Text fontSize="13px" color="brand.gray" noOfLines={1}>{r.nextLabel ? `Próx: ${r.nextLabel}` : 'Sin próximo partido'}</Text>
                  </Box>
                  <Box boxSize="9px" borderRadius="full" bg={STATUS_COLORS[r.status.id]} flexShrink={0} title={r.status.label} />
                </Flex>
              )
            })}
          </Box>
        ))}
        {!groups.length && (
          <Text px={1} py={4} fontSize="14px" color="brand.gray">Nadie coincide con la búsqueda.</Text>
        )}
      </Box>
    </Flex>
  )
}
