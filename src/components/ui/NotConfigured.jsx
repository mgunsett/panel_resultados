import { Box, VStack, Text, Code } from '@chakra-ui/react'

export default function NotConfigured() {
  return (
    <Box minH="100vh" bg="brand.dark" display="flex" alignItems="center" justifyContent="center" px={6}>
      <VStack spacing={3} textAlign="center" maxW="480px">
        <Text fontFamily="heading" fontSize="2xl" color="white">
          Firebase no configurado
        </Text>
        <Text fontFamily="body" fontSize="sm" color="brand.gray" lineHeight={1.7}>
          Creá un archivo <Code fontSize="12px">.env</Code> en la raíz con las variables{' '}
          <Code fontSize="12px">VITE_FIREBASE_*</Code> del proyecto compartido y reiniciá{' '}
          <Code fontSize="12px">npm run dev</Code>. Podés copiarlas de{' '}
          <Code fontSize="12px">.env.example</Code>.
        </Text>
      </VStack>
    </Box>
  )
}
