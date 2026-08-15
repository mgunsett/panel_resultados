import { useState } from 'react'
import {
  Box, VStack, HStack, Text, Spinner, Flex, Tabs, TabList, TabPanels, TabPanel, Tab,
  useDisclosure,
} from '@chakra-ui/react'
import { FiAlertTriangle } from 'react-icons/fi'
import ConfirmDialog from '../ui/ConfirmDialog'
import MatchForm from './MatchForm'
import MatchPreviewCard from './MatchPreviewCard'

// ─── EDITOR DE PARTIDOS ──────────────────────────────────────────
// No sabe si está editando un jugador o un club: recibe el
// `controller` ya resuelto (usePlayerMatches o useClubMatches, que
// exponen la misma forma) y se limita a la UI. Eso es lo que mantiene
// las dos vistas escribiendo exactamente el mismo payload.

const SLOT_LABELS = { last: 'Último Resultado', next: 'Próximo Partido' }

const tabStyle = {
  fontFamily: 'mono',
  fontSize: '11px',
  letterSpacing: 'widest',
  textTransform: 'uppercase',
  color: 'brand.gray',
  borderRadius: 'md',
  px: 4,
  py: 2,
  _selected: { color: 'brand.brown', bg: 'brand.amber' },
  _hover: { color: 'white' },
}

// Aparece cuando los jugadores del club no tienen todos el mismo
// partido: mostramos el más reciente y guardar los vuelve a alinear.
function OutOfSyncNotice() {
  return (
    <HStack
      align="flex-start" spacing={2}
      mb={4} px={3} py={2}
      bg="brand.orangeSoft"
      border="1px solid" borderColor="brand.orange"
      borderRadius="md"
    >
      <Box color="brand.orange" mt="2px" flexShrink={0}>
        <FiAlertTriangle size={14} />
      </Box>
      <Text fontFamily="body" fontSize="xs" color="brand.gray" lineHeight={1.6}>
        Los jugadores de este club no tienen el mismo partido cargado. Abajo ves el más
        reciente; al guardar se emparejan todos.
      </Text>
    </HStack>
  )
}

export default function MatchEditor({ controller, saveConfirm, deleteDescription }) {
  const { matches, outOfSync = {}, loading, saving, saveMatch, deleteMatch } = controller
  const [tabIndex, setTabIndex] = useState(0)
  const [slotToDelete, setSlotToDelete] = useState(null)
  const [pendingSave, setPendingSave] = useState(null)
  const deleteDialog = useDisclosure()
  const saveDialog = useDisclosure()

  const handleEdit = (slot) => {
    setTabIndex(slot === 'last' ? 0 : 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteClick = (slot) => {
    setSlotToDelete(slot)
    deleteDialog.onOpen()
  }

  // Con `saveConfirm` el guardado pasa por el diálogo (caso club, donde
  // pisa varias landings). Sin él va derecho, como en la vista de un
  // jugador suelto.
  const handleSave = (slot, form, shieldFiles) => {
    if (!saveConfirm) {
      saveMatch(slot, form, shieldFiles)
      return
    }
    setPendingSave({ slot, form, shieldFiles })
    saveDialog.onOpen()
  }

  if (loading) {
    return (
      <Flex justify="center" py={16}>
        <Spinner color="brand.amber" size="lg" />
      </Flex>
    )
  }

  const slotProps = (slot) => ({
    slot,
    label: slot === 'last' ? 'Cargar último resultado' : 'Cargar próximo partido',
    data: matches[slot],
    onSave: handleSave,
    saving,
  })

  return (
    <>
      <Box
        bg="brand.dark2"
        border="1px solid"
        borderColor="brand.brownDark"
        borderRadius="xl"
        p={{ base: 4, md: 6 }}
        mb={{ base: 6, md: 8 }}
      >
        <Tabs index={tabIndex} onChange={setTabIndex} variant="unstyled" isLazy={false}>
          <TabList mb={5} gap={2}>
            <Tab {...tabStyle}>{SLOT_LABELS.last}</Tab>
            <Tab {...tabStyle}>{SLOT_LABELS.next}</Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              {outOfSync.last && <OutOfSyncNotice />}
              <MatchForm {...slotProps('last')} />
            </TabPanel>
            <TabPanel p={0}>
              {outOfSync.next && <OutOfSyncNotice />}
              <MatchForm {...slotProps('next')} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      <Box mb={6}>
        <Text fontFamily="mono" fontSize="10px" color="brand.gray"
              textTransform="uppercase" letterSpacing="widest" mb={4}>
          Datos cargados
        </Text>

        <VStack spacing={4} align="stretch">
          {['last', 'next'].map((slot) => (
            <MatchPreviewCard
              key={slot}
              slot={slot}
              data={matches[slot]}
              label={SLOT_LABELS[slot]}
              onEdit={() => handleEdit(slot)}
              onDelete={() => handleDeleteClick(slot)}
            />
          ))}
        </VStack>
      </Box>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={() => slotToDelete && deleteMatch(slotToDelete)}
        title="¿Eliminar partido?"
        description={deleteDescription(SLOT_LABELS[slotToDelete] || '')}
        confirmLabel="Eliminar"
        tone="danger"
      />

      {saveConfirm && (
        <ConfirmDialog
          isOpen={saveDialog.isOpen}
          onClose={saveDialog.onClose}
          onConfirm={() => pendingSave && saveMatch(pendingSave.slot, pendingSave.form, pendingSave.shieldFiles)}
          title={saveConfirm.title}
          description={saveConfirm.description(SLOT_LABELS[pendingSave?.slot] || '')}
          confirmLabel={saveConfirm.confirmLabel}
          tone="brand"
        />
      )}
    </>
  )
}
