import { Box, Flex, HStack, Text } from '@chakra-ui/react'

// Bloque con título, mismo estilo que las tarjetas de Sincronización.
export default function SectionCard({ title, icon: Icon, right, children, ...rest }) {
  return (
    <Box bg="brand.dark2" border="1px solid" borderColor="brand.brownDark" borderRadius="lg" p={{ base: 4, md: 5 }} mb={5} {...rest}>
      {(title || right) && (
        <Flex align="center" justify="space-between" gap={3} mb={4} wrap="wrap">
          <HStack spacing={2}>
            {Icon && <Box color="brand.orange"><Icon size={16} /></Box>}
            <Text fontFamily="mono" fontSize="sm" color="white" textTransform="uppercase" letterSpacing="widest">
              {title}
            </Text>
          </HStack>
          {right}
        </Flex>
      )}
      {children}
    </Box>
  )
}
