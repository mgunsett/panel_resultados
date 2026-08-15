import { useState } from 'react'
import { Image, Text } from '@chakra-ui/react'

// ─── LOGO LED SPORTS ─────────────────────────────────────────────
// El archivo va en public/brand/led-sports-logo.png. Si todavía no
// está (o falla la descarga), cae a un wordmark tipográfico con la
// misma lectura: "LED" en naranja + "SPORTS" en blanco. Así el panel
// nunca queda con un hueco roto donde debería estar la marca.

export const LOGO_SRC = '/brand/led-sports-logo.png'

export default function BrandLogo({ height = '40px', fontSize = 'xl' }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <Text
        fontFamily="heading"
        fontSize={fontSize}
        lineHeight={1}
        letterSpacing="wide"
        color="white"
        fontStyle="italic"
        whiteSpace="nowrap"
      >
        <Text as="span" color="brand.orange">LED</Text> SPORTS
      </Text>
    )
  }

  return (
    <Image
      src={LOGO_SRC}
      alt="LED Sports"
      h={height}
      w="auto"
      objectFit="contain"
      onError={() => setFailed(true)}
    />
  )
}
