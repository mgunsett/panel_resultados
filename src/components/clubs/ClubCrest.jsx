import { useState } from 'react'
import { Flex, Image, Text } from '@chakra-ui/react'
import { clubInitials } from '../../data/clubs'

// ─── ESCUDO DEL CLUB ─────────────────────────────────────────────
// Los archivos van en public/clubs/ (ver la ruta `crest` de cada club
// en src/data/clubs.js). Mientras falte alguno, cae a las iniciales
// del club sobre un recuadro: la grilla se ve pareja igual, sin
// imágenes rotas.

export default function ClubCrest({ club, size = '64px', fontSize = 'md' }) {
  const [failed, setFailed] = useState(false)

  if (club?.crest && !failed) {
    return (
      <Image
        src={club.crest}
        alt={`Escudo de ${club.name}`}
        boxSize={size}
        objectFit="contain"
        flexShrink={0}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <Flex
      boxSize={size}
      align="center" justify="center"
      flexShrink={0}
      bg="brand.brownDark"
      border="1px solid"
      borderColor="brand.brownLight"
      borderRadius="md"
      overflow="hidden"
    >
      <Text fontFamily="heading" fontSize={fontSize} color="brand.orange" lineHeight={1}>
        {clubInitials(club?.name)}
      </Text>
    </Flex>
  )
}
