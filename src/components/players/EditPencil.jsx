import { IconButton, Tooltip } from '@chakra-ui/react'
import { FiEdit2 } from 'react-icons/fi'

// ─── LÁPIZ DE "EDITAR JUGADOR" ───────────────────────────────────
// Discreto a propósito: sin borde ni fondo, en el gris del texto
// secundario y medio transparente. Se enciende en naranja al pasar el
// mouse o con el foco del teclado. En pantallas táctiles (sin hover)
// queda visible siempre, un poco más tenue que el texto.
// `variant="badge"`: chiquito, flotando en la esquina de un botón
// (Landing / Fotos). Aparece al pasar por ese botón (role="group").

const hoverless = '@media (hover: none)'

export default function EditPencil({ label = 'Editar jugador', onClick, variant = 'inline', ...rest }) {
  if (variant === 'badge') {
    return (
      <Tooltip label={label} hasArrow placement="top" bg="brand.dark2" color="brand.amber" fontSize="13px" openDelay={250}>
        <IconButton
          icon={<FiEdit2 />} aria-label={label} onClick={onClick}
          position="absolute" top="-9px" right="-9px" zIndex={1}
          minW="24px" h="24px" w="24px" p={0} fontSize="11px" borderRadius="full"
          bg="#151312" color="brand.amber" border="1px solid" borderColor="brand.brownDark"
          opacity={0} transform="scale(.85)" transition="opacity .15s, transform .15s, background .15s"
          _groupHover={{ opacity: 1, transform: 'scale(1)' }}
          _focusVisible={{ opacity: 1, transform: 'scale(1)', outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '2px' }}
          _hover={{ bg: 'brand.orange', color: 'brand.brown', borderColor: 'brand.orange' }}
          sx={{ [hoverless]: { opacity: 0.85, transform: 'scale(1)' } }}
          // Área táctil de 44 px sin agrandar el círculo.
          _before={{ content: '""', position: 'absolute', inset: '-10px' }}
          {...rest}
        />
      </Tooltip>
    )
  }
  return (
    <Tooltip label={label} hasArrow placement="top" bg="brand.dark2" color="brand.amber" fontSize="13px" openDelay={250}>
      <IconButton
        icon={<FiEdit2 />} aria-label={label} onClick={onClick} variant="ghost"
        minW="36px" h="36px" fontSize="17px" borderRadius="full" color="brand.gray"
        opacity={0.45} transition="opacity .15s, color .15s, background .15s"
        _hover={{ opacity: 1, color: 'brand.orange', bg: 'rgba(249,160,63,.1)' }}
        _focusVisible={{ opacity: 1, color: 'brand.orange', outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '2px' }}
        sx={{ [hoverless]: { opacity: 0.7 } }}
        {...rest}
      />
    </Tooltip>
  )
}
