import { Flex, VStack, Text, Divider, Box } from '@chakra-ui/react'

// Encabezado común de las vistas internas: una línea chica de contexto
// (`eyebrow`), el título grande y un espacio a la derecha para acciones.
export default function PageHeader({ eyebrow, title, children }) {
  return (
    <Box mb={{ base: 5, md: 7 }}>
      <Flex
        align={{ base: 'flex-start', sm: 'center' }}
        justify="space-between"
        direction={{ base: 'column', sm: 'row' }}
        gap={3}
        mb={{ base: 4, md: 5 }}
      >
        <VStack align="stretch" spacing={1.5} minW={0}>
          {eyebrow && (
            <Text
              fontFamily="mono" fontSize="10px" color="brand.orange"
              textTransform="uppercase" letterSpacing="widest"
            >
              {eyebrow}
            </Text>
          )}
          <Text
            fontFamily="heading" fontSize={{ base: '2xl', md: '3xl' }}
            color="white" lineHeight={1}
          >
            {title}
          </Text>
        </VStack>

        {children}
      </Flex>

      <Divider borderColor="brand.brownDark" />
    </Box>
  )
}
