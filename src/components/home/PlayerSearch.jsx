import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box, Flex, Text, Image, Input, InputGroup, InputLeftElement, InputRightElement, IconButton,
  Modal, ModalOverlay, ModalContent, useBreakpointValue,
} from '@chakra-ui/react'
import { FiSearch, FiX, FiArrowLeft, FiCornerDownLeft } from 'react-icons/fi'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { playerInitials } from '../../data/players'
import { STATUS_COLORS } from './ShowcaseCard'

const MotionBox = motion(Box)
const MAX_RESULTS = 6

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function matchesQuery(row, q) {
  const term = norm(q.trim())
  return !term || norm(row.player.name).includes(term) || norm(row.club?.name).includes(term)
}

const inputStyle = {
  h: '54px', pl: '48px', borderRadius: '12px', bg: 'rgba(21,19,18,.9)', border: '1px solid', borderColor: 'brand.brownDark',
  fontSize: '17px', color: 'white', _placeholder: { color: '#8c7f70' }, _hover: { borderColor: 'brand.gray' },
  _focus: { borderColor: 'brand.orange', boxShadow: '0 0 0 3px rgba(249,160,63,.2)' },
  // El navegador agrega su propia X en type="search": usamos la nuestra.
  sx: { '&::-webkit-search-cancel-button': { display: 'none' } },
}

function ResultRow({ row, active, onPick, onHover, id }) {
  const { player, club, status, nextLabel } = row
  return (
    <Flex
      as="li" id={id} role="option" aria-selected={active}
      align="center" gap={3} px={3} py={2.5} borderRadius="10px" cursor="pointer"
      bg={active ? 'rgba(249,160,63,0.12)' : 'transparent'}
      onMouseEnter={onHover} onMouseDown={(e) => e.preventDefault()} onClick={onPick}
    >
      {player.photo ? (
        <Image src={player.photo} alt="" boxSize="44px" borderRadius="10px" objectFit="cover" objectPosition="top" bg="#2a2420" flexShrink={0} />
      ) : (
        <Flex boxSize="44px" borderRadius="10px" bg="brand.brownLight" align="center" justify="center" fontFamily="heading" color="brand.amber" flexShrink={0}>
          {playerInitials(player.name)}
        </Flex>
      )}
      <Box flex={1} minW={0}>
        <Text fontSize="15px" fontWeight="600" color="white" noOfLines={1}>{player.name}</Text>
        <Text fontSize="13px" color="brand.gray" noOfLines={1}>
          {club?.name || 'Sin club'}{nextLabel ? ` · Próx: ${nextLabel}` : ''}
        </Text>
      </Box>
      <Flex align="center" gap="6px" flexShrink={0} fontFamily="mono" fontSize="12px" letterSpacing="0.1em" textTransform="uppercase" color={STATUS_COLORS[status.id]}>
        <Box boxSize="7px" borderRadius="full" bg={STATUS_COLORS[status.id]} />
        <Box as="span" display={{ base: 'none', sm: 'inline' }}>{status.label}</Box>
      </Flex>
      {active && <Box display={{ base: 'none', md: 'block' }} color="brand.gray"><FiCornerDownLeft /></Box>}
    </Flex>
  )
}

function ResultList({ results, total, active, setActive, onPick, q, listId }) {
  if (!results.length) {
    return (
      <Text px={3} py={4} fontSize="14px" color="brand.gray">
        {q.trim() ? `Nadie coincide con “${q.trim()}”.` : 'Escribí un nombre o un club.'}
      </Text>
    )
  }
  return (
    <>
      <Box as="ul" id={listId} role="listbox" aria-label="Jugadores encontrados" listStyleType="none" m={0} p={0}>
        {results.map((r, i) => (
          <ResultRow key={r.player.slug} id={`${listId}-${i}`} row={r} active={i === active}
            onHover={() => setActive(i)} onPick={() => onPick(r.player.slug)} />
        ))}
      </Box>
      {total > results.length && (
        <Text px={3} pt={2} pb={1} fontSize="13px" color="brand.gray">
          Y {total - results.length} más en la grilla de abajo.
        </Text>
      )}
    </>
  )
}

// ─── BUSCADOR DEL HOME ───────────────────────────────────────────
// Desktop: los resultados se despliegan debajo del campo mientras se
// escribe (flechas + Enter, o clic). Celular: al tocar el campo se abre
// la búsqueda a pantalla completa, así el teclado no tapa los
// resultados. Elegir a alguien abre su ficha rápida. El texto sigue
// filtrando la grilla de abajo (`onChange`).
export default function PlayerSearch({ rows, value, onChange, onPick }) {
  const isMobile = useBreakpointValue({ base: true, md: false }, { ssr: false })
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef(null)
  const mobileInputRef = useRef(null)
  const listId = 'player-search-results'

  const all = useMemo(() => rows.filter((r) => matchesQuery(r, value)), [rows, value])
  const results = all.slice(0, MAX_RESULTS)

  useEffect(() => { setActive(0) }, [value])

  // Clic afuera cierra el desplegable (desktop).
  useEffect(() => {
    if (!open || isMobile) return undefined
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, isMobile])

  const pick = (slug) => {
    setOpen(false)
    onPick(slug)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); pick(results[active].player.slug) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  const clear = (
    <InputRightElement h="54px" w="54px">
      {value && (
        <IconButton size="sm" variant="ghost" icon={<FiX />} aria-label="Borrar búsqueda" color="brand.gray"
          _hover={{ color: 'white', bg: 'brand.brownLight' }} onClick={() => onChange('')} />
      )}
    </InputRightElement>
  )

  if (isMobile) {
    return (
      <>
        <InputGroup mt={1.5}>
          <InputLeftElement h="54px" pl={2} pointerEvents="none" color="brand.gray"><FiSearch size={20} /></InputLeftElement>
          <Input {...inputStyle} readOnly value={value} placeholder="Buscar jugador o club…" aria-label="Buscar jugador o club"
            onClick={() => setOpen(true)} cursor="pointer"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); setOpen(true) } }} />
        </InputGroup>
        <Modal isOpen={open} onClose={() => setOpen(false)} size="full" initialFocusRef={mobileInputRef} motionPreset="slideInBottom">
          <ModalOverlay bg="#0d0c0b" />
          <ModalContent bg="#0d0c0b" color="white" m={0} borderRadius={0}>
            <Flex align="center" gap={2} px={3} py={3} borderBottom="1px solid" borderColor="#2e2825" position="sticky" top={0} bg="#0d0c0b" zIndex={1}>
              <IconButton icon={<FiArrowLeft size={20} />} aria-label="Volver" variant="ghost" color="brand.gray"
                _hover={{ color: 'white', bg: 'brand.brownLight' }} onClick={() => setOpen(false)} />
              <InputGroup flex={1}>
                <InputLeftElement h="54px" pl={2} pointerEvents="none" color="brand.gray"><FiSearch size={20} /></InputLeftElement>
                <Input {...inputStyle} ref={mobileInputRef} type="search" value={value} onChange={(e) => onChange(e.target.value)}
                  onKeyDown={onKeyDown} placeholder="Buscar jugador o club…" aria-label="Buscar jugador o club"
                  aria-controls={listId} enterKeyHint="search" />
                {clear}
              </InputGroup>
            </Flex>
            <Box px={2} py={2} overflowY="auto">
              {/* Sin texto muestra a todos: sirve también para recorrer la lista. */}
              <ResultList results={all} total={all.length} active={active} setActive={setActive}
                onPick={pick} q={value} listId={listId} />
            </Box>
          </ModalContent>
        </Modal>
      </>
    )
  }

  return (
    <Box ref={wrapRef} position="relative" mt={1.5}>
      <InputGroup>
        <InputLeftElement h="54px" pl={2} pointerEvents="none" color="brand.gray"><FiSearch size={20} /></InputLeftElement>
        <Input
          {...inputStyle} type="search" value={value} placeholder="Buscar jugador o club…" aria-label="Buscar jugador o club"
          role="combobox" aria-expanded={open && Boolean(value.trim())} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
          onChange={(e) => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
        />
        {clear}
      </InputGroup>
      <AnimatePresence>
        {open && value.trim() && (
          <MotionBox
            position="absolute" top="62px" left={0} right={0} zIndex={15}
            p={2} borderRadius="14px" bg="rgba(30,27,25,0.98)" border="1px solid" borderColor="brand.brownDark"
            boxShadow="0 18px 40px rgba(0,0,0,0.55)" backdropFilter="blur(10px)"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
          >
            <ResultList results={results} total={all.length} active={active} setActive={setActive} onPick={pick} q={value} listId={listId} />
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  )
}
