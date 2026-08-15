import { Box, Flex, VStack, Text } from '@chakra-ui/react'
import { FiArrowRight } from 'react-icons/fi'
import { motion, useReducedMotion } from 'framer-motion'

const MotionFlex = motion(Flex)

// Acceso directo del Home a una sección. Fondo translúcido con blur
// para que se apoye sobre la foto sin taparla del todo.
export default function HomeShortcut({ icon: Icon, label, description, count, onClick, delay = 0 }) {
  const reduceMotion = useReducedMotion()

  return (
    <MotionFlex
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reduceMotion ? 0 : delay, ease: 'easeOut' }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      as="button"
      type="button"
      onClick={onClick}
      align="center"
      gap={4}
      w="100%"
      px={{ base: 4, md: 5 }}
      py={{ base: 4, md: 5 }}
      textAlign="left"
      bg="rgba(30,27,25,0.72)"
      backdropFilter="blur(12px)"
      border="1px solid"
      borderColor="brand.brownDark"
      borderRadius="xl"
      cursor="pointer"
      transitionProperty="border-color, background"
      transitionDuration="0.2s"
      _hover={{ borderColor: 'brand.orange', bg: 'rgba(30,27,25,0.88)' }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '3px' }}
    >
      <Flex
        boxSize={{ base: '40px', md: '46px' }}
        align="center" justify="center" flexShrink={0}
        bg="brand.orangeSoft"
        border="1px solid" borderColor="brand.orange"
        borderRadius="lg"
        color="brand.orange"
      >
        <Icon size={20} />
      </Flex>

      <VStack align="stretch" spacing={0.5} flex={1} minW={0}>
        <Text fontFamily="heading" fontSize={{ base: 'xl', md: '2xl' }} color="white" lineHeight={1.1}>
          {label}
        </Text>
        <Text
          fontFamily="mono" fontSize="10px" color="brand.gray"
          textTransform="uppercase" letterSpacing="widest" noOfLines={1}
        >
          {count} · {description}
        </Text>
      </VStack>

      <Box color="brand.orange" flexShrink={0}>
        <FiArrowRight size={18} />
      </Box>
    </MotionFlex>
  )
}
