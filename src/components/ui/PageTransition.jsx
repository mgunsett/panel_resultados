import { Box } from '@chakra-ui/react'
import { motion, useReducedMotion } from 'framer-motion'

const MotionBox = motion(Box)

// Transición suave entre la grilla y el detalle de jugador.
// Con prefers-reduced-motion sólo hace fade, sin desplazamiento.
export default function PageTransition({ children }) {
  const reduceMotion = useReducedMotion()

  return (
    <MotionBox
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </MotionBox>
  )
}
