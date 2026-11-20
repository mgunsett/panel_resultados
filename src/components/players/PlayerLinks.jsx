import { Box, Button, Tooltip } from '@chakra-ui/react'
import { FiExternalLink, FiImage } from 'react-icons/fi'
import { playerLinks } from '../../data/players'

// ─── BOTONES "LANDING" Y "FOTOS" DEL JUGADOR ─────────────────────
// Se usan en el banner del panel de /jugadores y en el de la ficha.
// Las URLs salen de players.js (landingUrl y driveUrl). Si falta una,
// el botón queda deshabilitado con un aviso para que se note qué falta
// cargar, en vez de desaparecer y descuadrar la fila.

const outline = {
  variant: 'outline', borderColor: 'brand.brownDark', color: 'brand.amber',
  _hover: { bg: 'brand.brownLight', color: 'white' },
}

function LinkButton({ href, icon, label, missing, btn }) {
  if (href) {
    return (
      <Button {...btn} {...outline} as="a" href={href} target="_blank" rel="noopener noreferrer" leftIcon={icon}>
        {label}
      </Button>
    )
  }
  return (
    <Tooltip label={missing} hasArrow placement="top" bg="brand.dark2" color="brand.amber" fontSize="13px">
      {/* El span recibe el foco y el hover: un botón deshabilitado no los dispara. */}
      <Box as="span" tabIndex={0} display="inline-flex" borderRadius="8px" aria-label={`${label}: ${missing}`}>
        <Button {...btn} {...outline} leftIcon={icon} isDisabled pointerEvents="none" tabIndex={-1}>
          {label}
        </Button>
      </Box>
    </Tooltip>
  )
}

export default function PlayerLinks({ player, btn }) {
  const { landing, drive } = playerLinks(player)
  return (
    <>
      <LinkButton btn={btn} href={landing} icon={<FiExternalLink />} label="Landing"
        missing="Falta la URL de la landing (landingUrl en players.js)" />
      <LinkButton btn={btn} href={drive} icon={<FiImage />} label="Fotos"
        missing="Falta la carpeta de Drive (driveUrl en players.js)" />
    </>
  )
}
