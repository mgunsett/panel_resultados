import { useRef } from 'react'
import { Box, Flex, Text, Input, Button, chakra } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { FiAlertTriangle, FiInfo } from 'react-icons/fi'

// ─── PIEZAS DEL ASISTENTE DE ALTA ────────────────────────────────
// Mismo lenguaje visual que el resto del panel: tarjetas negras con
// filete naranja arriba, etiquetas en Barlow Condensed y botones con
// mínimo 44 px de alto para el celular.

export const priBtn = {
  h: '44px', px: 4, borderRadius: '8px', bg: 'brand.orange', color: 'brand.brown',
  fontFamily: 'mono', fontSize: '14px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
  _hover: { bg: '#ffb35e' }, _active: { bg: 'brand.orangeDark' },
  _disabled: { opacity: 0.4, cursor: 'not-allowed', _hover: { bg: 'brand.orange' } },
}
export const ghostBtn = {
  h: '44px', px: 4, borderRadius: '8px', variant: 'outline', borderColor: 'brand.brownDark', color: 'brand.amber',
  fontFamily: 'mono', fontSize: '14px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
  _hover: { bg: '#2a2420', color: 'white' }, _active: { bg: '#2a2420' },
}
export const smBtn = { h: '36px', px: 3, fontSize: '13px' }

export const fieldStyle = {
  h: '44px', borderRadius: '10px', bg: '#151312', border: '1px solid', borderColor: 'brand.brownDark',
  color: 'white', fontSize: '15px', _placeholder: { color: '#8c7f70' }, _hover: { borderColor: 'brand.gray' },
  _focus: { borderColor: 'brand.orange', boxShadow: '0 0 0 3px rgba(249,160,63,.2)' },
  _invalid: { borderColor: '#ff7a66', boxShadow: 'none' },
}
export const monoField = { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '14px' }

export const lbl = { fontFamily: 'mono', fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'brand.gray' }

export function StepCard({ title, intro, children, right }) {
  return (
    <Flex as="section" direction="column" gap={5} p={{ base: 5, md: 7 }} borderRadius="16px" bg="#050404"
      boxShadow="inset 0 3px 0 #F9A03F" minW={0}>
      <Flex wrap="wrap" align="flex-end" justify="space-between" gap={3}>
        <Flex direction="column" gap={1.5}>
          <Text as="h2" fontFamily="heading" fontSize="36px" lineHeight={1}>{title}</Text>
          {intro && <Text color="brand.gray" fontSize="15px">{intro}</Text>}
        </Flex>
        {right}
      </Flex>
      {children}
    </Flex>
  )
}

const PILL = {
  api: { bg: 'rgba(249,160,63,.14)', color: 'brand.orange' },
  man: { bg: '#2a2420', color: 'brand.amber' },
  miss: { bg: 'rgba(255,122,102,.12)', color: '#ff9a8a' },
  ok: { bg: 'rgba(95,211,141,.12)', color: '#7fe0a5' },
}
export function Pill({ kind = 'man', children, ...rest }) {
  return (
    <Text as="span" display="inline-flex" alignItems="center" gap={1.5} px={2.5} py={1} borderRadius="full" whiteSpace="nowrap"
      fontFamily="mono" fontSize="12px" letterSpacing="0.1em" textTransform="uppercase" {...PILL[kind]} {...rest}>
      {children}
    </Text>
  )
}

export function Notice({ kind = 'info', children, ...rest }) {
  const look = {
    info: { bg: '#0f0c0a', borderColor: '#2a211b', color: 'brand.amber', icon: FiInfo },
    warn: { bg: 'rgba(249,160,63,.08)', borderColor: 'rgba(249,160,63,.35)', color: '#ffd9ad', icon: FiAlertTriangle },
    err: { bg: 'rgba(255,122,102,.08)', borderColor: 'rgba(255,122,102,.35)', color: '#ffc2b8', icon: FiAlertTriangle },
  }[kind]
  const Icon = look.icon
  return (
    <Flex gap={3} align="flex-start" px={4} py={3} borderRadius="12px" border="1px solid" borderColor={look.borderColor}
      bg={look.bg} color={look.color} fontSize="14px" lineHeight={1.45} role={kind === 'err' ? 'alert' : undefined} {...rest}>
      <Box as={Icon} flexShrink={0} mt="2px" boxSize="16px" aria-hidden />
      <Box flex={1} minW={0}>{children}</Box>
    </Flex>
  )
}

export function EmptyBox({ children, ...rest }) {
  return (
    <Flex direction="column" align="center" gap={2.5} py={7} px={4} borderRadius="12px" border="1px dashed"
      borderColor="#3a2f27" textAlign="center" color="brand.gray" {...rest}>
      {children}
    </Flex>
  )
}

const shimmer = keyframes`to { background-position: -200% 0 }`
export function SkeletonRows({ count = 3, h = '72px' }) {
  return Array.from({ length: count }, (_, i) => (
    <Box key={i} h={h} borderRadius="12px" bgImage="linear-gradient(90deg,#120f0d 0%,#1d1814 50%,#120f0d 100%)"
      bgSize="200% 100%" animation={`${shimmer} 1.2s linear infinite`} />
  ))
}

// Pasos arriba del asistente. Sólo se puede saltar a los ya vistos.
export function Stepper({ steps, current, reached, onGo }) {
  return (
    <Flex as="nav" aria-label="Pasos" gap={1.5} overflowX="auto" pb="2px" sx={{ scrollbarWidth: 'none' }}>
      {steps.map((t, i) => {
        const n = i + 1
        const on = n === current
        const done = !on && n <= reached
        return (
          <chakra.button key={t} type="button" onClick={() => done && onGo(n)} aria-current={on ? 'step' : undefined}
            disabled={!done && !on}
            display="flex" alignItems="center" gap={2.5} flex="1 0 auto" minH="52px" px={3.5} py={2} borderRadius="12px"
            border="1px solid" borderColor={on ? 'rgba(249,160,63,.6)' : '#2a211b'} bg={on ? 'rgba(249,160,63,.08)' : '#0f0c0a'}
            color={on ? 'white' : done ? 'brand.amber' : '#8c7f70'} cursor={done ? 'pointer' : 'default'} textAlign="left"
            _hover={done ? { borderColor: 'brand.brownDark' } : undefined}
            _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '2px' }}>
            <Flex as="span" align="center" justify="center" boxSize="26px" borderRadius="full" flexShrink={0}
              fontFamily="mono" fontWeight={700} fontSize="14px" border="1px solid"
              borderColor={on ? 'brand.orange' : done ? '#2a2420' : 'brand.brownDark'}
              bg={on ? 'brand.orange' : done ? '#2a2420' : 'transparent'} color={on ? 'brand.brown' : done ? 'brand.orange' : 'inherit'}>
              {n}
            </Flex>
            <Text as="span" fontFamily="mono" fontSize="14px" letterSpacing="0.1em" textTransform="uppercase" whiteSpace="nowrap"
              display={{ base: on ? 'inline' : 'none', md: 'inline' }}>
              {t}
            </Text>
          </chakra.button>
        )
      })}
    </Flex>
  )
}

// Zona para elegir/arrastrar un archivo.
export function Dropzone({ onFile, title, hint, minH = '220px', accept = 'image/jpeg,image/png,image/webp' }) {
  const input = useRef(null)
  const pick = (files) => files?.[0] && onFile(files[0])
  return (
    <>
      <Input ref={input} type="file" accept={accept} display="none" onChange={(e) => { pick(e.target.files); e.target.value = '' }} />
      <chakra.button type="button" onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files) }}
        display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2.5} w="100%" minH={minH}
        p={5} borderRadius="14px" border="1.5px dashed" borderColor="brand.brownDark" bg="#0f0c0a" color="brand.gray" textAlign="center"
        _hover={{ borderColor: 'brand.orange', color: 'white' }}
        _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '2px' }}>
        <Text color="white" fontWeight={600}>{title}</Text>
        {hint && <Text fontSize="13px">{hint}</Text>}
      </chakra.button>
    </>
  )
}

export function Code({ children, ...rest }) {
  return (
    <Text as="span" fontFamily="ui-monospace, Menlo, monospace" fontSize="13px" color="brand.amber" bg="#0f0c0a"
      border="1px solid #2a211b" borderRadius="8px" px={2} py="2px" overflowWrap="anywhere" {...rest}>
      {children}
    </Text>
  )
}

export function Initials({ text, size = '48px', fontSize = '20px', src }) {
  return (
    <Flex as="span" align="center" justify="center" boxSize={size} borderRadius="full" bg="#2a2420" color="brand.amber"
      fontFamily="heading" fontSize={fontSize} overflow="hidden" flexShrink={0}>
      {src ? <chakra.img src={src} alt="" w="100%" h="100%" objectFit="cover" objectPosition="top" /> : text}
    </Flex>
  )
}

export { Button }
