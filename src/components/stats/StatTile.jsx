import { Box, SimpleGrid, Text } from '@chakra-ui/react'
import { motion, useReducedMotion } from 'framer-motion'

const MotionBox = motion(Box)

// Número grande con su etiqueta. `accent` para los principales.
export function StatTile({ label, value, hint, accent = false, index = 0 }) {
  const reduceMotion = useReducedMotion()
  return (
    <MotionBox
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.3) }}
      bg="brand.dark" border="1px solid" borderColor={accent ? 'brand.orange' : 'brand.brownDark'}
      borderRadius="md" px={3} py={2.5}
    >
      <Text fontFamily="mono" fontSize="9px" color="brand.gray" textTransform="uppercase" letterSpacing="widest" noOfLines={1}>
        {label}
      </Text>
      <Text fontFamily="heading" fontSize={accent ? '3xl' : '2xl'} color={accent ? 'brand.orange' : 'white'} lineHeight={1.05}>
        {value ?? '—'}
      </Text>
      {hint && <Text fontSize="xs" color="brand.gray" noOfLines={1}>{hint}</Text>}
    </MotionBox>
  )
}

export function StatGrid({ children, columns = { base: 2, sm: 3, md: 4, lg: 6 } }) {
  return <SimpleGrid columns={columns} spacing={2.5}>{children}</SimpleGrid>
}
