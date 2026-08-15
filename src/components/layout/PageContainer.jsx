import { Box } from '@chakra-ui/react'

// Padding y ancho máximo comunes a todas las vistas internas del
// panel, para que jugadores y clubes respiren igual.
export default function PageContainer({ children, maxW = '1200px' }) {
  return (
    <Box px={{ base: 4, md: 6, lg: 10 }} py={{ base: 5, md: 9 }}>
      <Box maxW={maxW} mx="auto">
        {children}
      </Box>
    </Box>
  )
}
