import { Box, Button, Tooltip } from '@chakra-ui/react'
import { FiExternalLink, FiImage } from 'react-icons/fi'
import { playerLinks } from '../../data/players'
import EditPencil from './EditPencil'

// ─── BOTONES "LANDING" Y "FOTOS" DEL JUGADOR ─────────────────────
// Se usan en el banner del panel de /jugadores y en el de la ficha.
// Las URLs salen de la ficha (landingUrl y driveUrl). Si falta una,
// el botón queda deshabilitado con un aviso para que se note qué falta
// cargar, en vez de desaparecer y descuadrar la fila.
// Con `onEdit`, cada botón lleva un lápiz chiquito en la esquina que
// aparece al pasar el mouse y abre "Editar jugador" en ese link.

const outline = {
  variant: 'outline', borderColor: 'brand.brownDark', color: 'brand.amber',
  _hover: { bg: 'brand.brownLight', color: 'white' },
}

function LinkButton({ onEdit, editLabel, ...props }) {
  if (!onEdit) return <LinkButtonInner {...props} />
  return (
    <Box position="relative" role="group" display="inline-flex">
      <LinkButtonInner {...props} />
      <EditPencil variant="badge" label={editLabel} onClick={onEdit} />
    </Box>
  )
}

function LinkButtonInner({ href, icon, label, missing, btn }) {
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

export default function PlayerLinks({ player, btn, onEdit }) {
  const { landing, drive } = playerLinks(player)
  const edit = (field) => (onEdit ? () => onEdit(field) : undefined)
  const hint = onEdit ? ': tocá el lápiz para cargarla' : ''
  return (
    <>
      <LinkButton btn={btn} href={landing} icon={<FiExternalLink />} label="Landing"
        missing={`Falta la URL de la landing${hint}`} onEdit={edit('landingUrl')} editLabel="Editar link de la landing" />
      <LinkButton btn={btn} href={drive} icon={<FiImage />} label="Fotos"
        missing={`Falta la carpeta de Drive${hint}`} onEdit={edit('driveUrl')} editLabel="Editar link de fotos" />
    </>
  )
}
