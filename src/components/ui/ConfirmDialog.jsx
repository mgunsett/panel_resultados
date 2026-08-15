import { useRef } from 'react'
import {
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader,
  AlertDialogBody, AlertDialogFooter, Button, Box,
} from '@chakra-ui/react'

// Confirmación para acciones que pegan directo en producción: borrar un
// partido, o guardar uno que se replica en varias landings a la vez.
// `tone` sólo cambia el color del botón de confirmar — rojo para lo
// destructivo, naranja de marca para lo que simplemente conviene mirar
// dos veces antes de apretar.
const TONES = {
  danger: { bg: 'brand.rec', color: 'white', _hover: { bg: '#C13237' } },
  brand: { bg: 'brand.orange', color: 'brand.brown', _hover: { bg: 'brand.orangeDark', color: 'white' } },
}

export default function ConfirmDialog({
  isOpen, onClose, onConfirm, title, description,
  confirmLabel = 'Confirmar', tone = 'danger', isLoading = false,
}) {
  const cancelRef = useRef(null)

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
      <AlertDialogOverlay bg="rgba(0,0,0,0.6)">
        <AlertDialogContent
          bg="brand.dark2"
          border="1px solid"
          borderColor="brand.brownDark"
          borderRadius="lg"
          mx={4}
        >
          <AlertDialogHeader fontFamily="heading" fontSize="xl" color="white" pb={2}>
            {title}
          </AlertDialogHeader>

          <AlertDialogBody pb={4}>
            <Box fontFamily="body" fontSize="sm" color="brand.gray" lineHeight={1.7}>
              {description}
            </Box>
          </AlertDialogBody>

          <AlertDialogFooter gap={2}>
            <Button
              ref={cancelRef}
              variant="ghost"
              color="brand.gray"
              fontFamily="mono" fontSize="xs"
              letterSpacing="widest" textTransform="uppercase"
              _hover={{ color: 'white', bg: 'brand.brownLight' }}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              {...TONES[tone]}
              fontFamily="mono" fontSize="xs"
              letterSpacing="widest" textTransform="uppercase"
              isLoading={isLoading}
              onClick={() => { onConfirm(); onClose() }}
            >
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}
