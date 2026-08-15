import { Box, VStack, Text } from '@chakra-ui/react'
import BackButton from './BackButton'

// Un slug/id que no existe en los archivos de datos se avisa en vez de
// redirigir en silencio, así un typo en la URL se nota.
export default function NotFoundNotice({ title, description, backTo, backLabel }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minH="60vh" px={6}>
      <VStack spacing={4} textAlign="center" maxW="460px">
        <Text fontFamily="heading" fontSize="2xl" color="white">
          {title}
        </Text>
        <Box fontFamily="body" fontSize="sm" color="brand.gray" lineHeight={1.7}>
          {description}
        </Box>
        <BackButton to={backTo} label={backLabel} />
      </VStack>
    </Box>
  )
}
