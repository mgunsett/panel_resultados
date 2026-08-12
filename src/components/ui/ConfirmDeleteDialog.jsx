import { useRef } from 'react'
import {
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader,
  AlertDialogBody, AlertDialogFooter, Button, Text,
} from '@chakra-ui/react'

// Borrar un partido es destructivo y pega directo en producción, así
// que va con confirmación explícita.
export default function ConfirmDeleteDialog({ isOpen, onClose, onConfirm, title, description }) {
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
            <Text fontFamily="body" fontSize="sm" color="brand.gray" lineHeight={1.7}>
              {description}
            </Text>
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
              bg="brand.rec" color="white"
              fontFamily="mono" fontSize="xs"
              letterSpacing="widest" textTransform="uppercase"
              _hover={{ bg: '#C13237' }}
              onClick={() => { onConfirm(); onClose() }}
            >
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}
