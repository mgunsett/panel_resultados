import { Box, Flex, VStack, HStack, Text, Image, Badge, IconButton } from '@chakra-ui/react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'

// updated_at viene como ISO string; si está corrupto no mostramos nada.
function formatUpdatedAt(iso) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('es-AR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

// Escudo del equipo, con fallback a las 3 primeras letras del nombre.
function TeamBadge({ name, shield }) {
  return (
    <VStack spacing={2} flex={1} minW={0}>
      {shield ? (
        <Image src={shield} boxSize={{ base: '44px', md: '52px' }} objectFit="contain" alt={name} />
      ) : (
        <Flex
          boxSize={{ base: '44px', md: '52px' }}
          align="center" justify="center"
          bg="brand.brownDark" borderRadius="md"
        >
          <Text fontFamily="heading" fontSize="sm" color="brand.gray">
            {name?.slice(0, 3).toUpperCase()}
          </Text>
        </Flex>
      )}
      <Text
        fontFamily="mono" fontSize={{ base: '11px', md: '12px' }} color="brand.gray"
        textTransform="uppercase" letterSpacing="wider" textAlign="center" noOfLines={1}
      >
        {name}
      </Text>
    </VStack>
  )
}

export default function MatchPreviewCard({ slot, data, label, onEdit, onDelete }) {
  const hasData = data && data.home_team

  if (!hasData) {
    return (
      <Box
        border="1px dashed"
        borderColor="brand.brownDark"
        borderRadius="lg"
        p={{ base: 4, md: 6 }}
        textAlign="center"
      >
        <Text fontFamily="mono" fontSize="10px" color="brand.gray"
              textTransform="uppercase" letterSpacing="widest" mb={2}>
          {label}
        </Text>
        <Text fontFamily="mono" fontSize="sm" color="brand.brownLight">
          Sin datos cargados
        </Text>
      </Box>
    )
  }

  const isLast = slot === 'last'
  const homeScore = data.home_score ?? '—'
  const awayScore = data.away_score ?? '—'
  const updatedAt = formatUpdatedAt(data.updated_at)

  return (
    <Box
      bg="brand.dark2"
      border="1px solid"
      borderColor="brand.brownDark"
      borderRadius="lg"
      overflow="hidden"
      transition="border-color 0.2s"
      _hover={{ borderColor: 'brand.amber' }}
    >
      {/* Encabezado */}
      <Flex
        justify="space-between" align="center"
        px={4} py={2}
        bg="brand.brownDark"
        borderBottom="1px solid"
        borderColor="brand.brownDark"
      >
        <Badge
          fontFamily="mono" fontSize="9px"
          bg={isLast ? 'brand.amberLight' : 'transparent'}
          color={isLast ? 'brand.amber' : 'brand.gray'}
          border="1px solid"
          borderColor={isLast ? 'brand.amber' : 'brand.gray'}
          px={2} py={0.5} letterSpacing="widest" textTransform="uppercase"
        >
          {label}
        </Badge>
        <HStack spacing={1}>
          {updatedAt && (
            <Text
              fontFamily="mono" fontSize="9px" color="brand.gray"
              letterSpacing="wider" mr={1}
              display={{ base: 'none', sm: 'block' }}
            >
              Act. {updatedAt}
            </Text>
          )}
          <IconButton
            icon={<FiEdit2 size={14} />}
            size="sm" variant="ghost"
            color="brand.gray"
            _hover={{ color: 'brand.amber', bg: 'brand.amberLight' }}
            aria-label={`Editar ${label}`}
            onClick={onEdit}
          />
          <IconButton
            icon={<FiTrash2 size={14} />}
            size="sm" variant="ghost"
            color="brand.gray"
            _hover={{ color: 'brand.rec', bg: 'rgba(229,72,77,0.1)' }}
            aria-label={`Eliminar ${label}`}
            onClick={onDelete}
          />
        </HStack>
      </Flex>

      {/* Marcador */}
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        align="center" justify="center"
        gap={{ base: 3, sm: 6 }}
        px={4} py={{ base: 4, md: 5 }}
      >
        <TeamBadge name={data.home_team} shield={data.home_shield} />

        <HStack spacing={3} flexShrink={0}>
          <Text fontFamily="heading" fontSize={{ base: '3xl', md: '4xl' }} color="brand.amber" lineHeight={1}>
            {homeScore}
          </Text>
          <Text fontFamily="heading" fontSize={{ base: 'lg', md: 'xl' }} color="brand.gray" lineHeight={1}>
            —
          </Text>
          <Text fontFamily="heading" fontSize={{ base: '3xl', md: '4xl' }} color="brand.amber" lineHeight={1}>
            {awayScore}
          </Text>
        </HStack>

        <TeamBadge name={data.away_team} shield={data.away_shield} />
      </Flex>

      {/* Metadatos */}
      <Flex
        px={4} py={2}
        bg="brand.dark"
        borderTop="1px solid"
        borderColor="brand.brownDark"
        justify="space-between" align="center"
        wrap="wrap" gap={2}
      >
        <HStack spacing={3}>
          {data.match_date && (
            <Text fontFamily="mono" fontSize="10px" color="brand.gray" letterSpacing="wider">
              {data.match_date}
            </Text>
          )}
          {data.competition && (
            <Badge fontFamily="mono" fontSize="8px" bg="brand.brownDark"
                   color="brand.gray" px={2} py={0.5} letterSpacing="wider">
              {data.competition}
            </Badge>
          )}
        </HStack>
        {data.stadium && (
          <Text fontFamily="mono" fontSize="10px" color="brand.gray" letterSpacing="wider"
                noOfLines={1} maxW={{ base: '120px', md: '200px' }}>
            {data.stadium}
          </Text>
        )}
      </Flex>
    </Box>
  )
}
