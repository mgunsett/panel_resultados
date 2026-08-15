import { Button } from '@chakra-ui/react'
import { FiArrowLeft } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

// Vuelta a la grilla desde un detalle. Navega a una ruta concreta y no
// con history.back(): entrando por link directo no habría a dónde
// volver.
export default function BackButton({ to, label }) {
  const navigate = useNavigate()

  return (
    <Button
      variant="ghost"
      color="brand.gray"
      fontFamily="mono" fontSize="xs"
      letterSpacing="widest" textTransform="uppercase"
      leftIcon={<FiArrowLeft />}
      _hover={{ color: 'white', bg: 'brand.brownLight' }}
      pl={2}
      onClick={() => navigate(to)}
    >
      {label}
    </Button>
  )
}
