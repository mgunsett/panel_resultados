import { useState } from 'react'
import {
  Box, VStack, Text, Spinner, Flex, Tabs, TabList, TabPanels, TabPanel, Tab,
  useDisclosure,
} from '@chakra-ui/react'
import { usePlayerMatches } from '../../hooks/usePlayerMatches'
import ConfirmDeleteDialog from '../ui/ConfirmDeleteDialog'
import MatchForm from './MatchForm'
import MatchPreviewCard from './MatchPreviewCard'

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

export default function MatchEditor({ slug }) {
  const { matches, loading, saving, saveMatch, deleteMatch } = usePlayerMatches(slug)
  const [tabIndex, setTabIndex] = useState(0)
  const [slotToDelete, setSlotToDelete] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleEdit = (slot) => {
    setTabIndex(slot === 'last' ? 0 : 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteClick = (slot) => {
    setSlotToDelete(slot)
    onOpen()
  }

  if (loading) {
    return (
      <Flex justify="center" py={16}>
        <Spinner color="brand.amber" size="lg" />
      </Flex>
    )
  }

  return (
    <>
      {/* Formularios */}
      <Box
        bg="brand.dark2"
        border="1px solid"
        borderColor="brand.brownDark"
        borderRadius="xl"
        p={{ base: 4, md: 6 }}
        mb={{ base: 6, md: 8 }}
      >
        <Tabs index={tabIndex} onChange={setTabIndex} variant="unstyled">
          <TabList mb={5} gap={2}>
            <Tab {...tabStyle}>{SLOT_LABELS.last}</Tab>
            <Tab {...tabStyle}>{SLOT_LABELS.next}</Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              <MatchForm
                slot="last"
                label="Cargar último resultado"
                data={matches.last}
                onSave={saveMatch}
                saving={saving}
              />
            </TabPanel>
            <TabPanel p={0}>
              <MatchForm
                slot="next"
                label="Cargar próximo partido"
                data={matches.next}
                onSave={saveMatch}
                saving={saving}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Preview */}
      <Box mb={6}>
        <Text fontFamily="mono" fontSize="10px" color="brand.gray"
              textTransform="uppercase" letterSpacing="widest" mb={4}>
          Datos cargados
        </Text>

        <VStack spacing={4} align="stretch">
          <MatchPreviewCard
            slot="last"
            data={matches.last}
            label={SLOT_LABELS.last}
            onEdit={() => handleEdit('last')}
            onDelete={() => handleDeleteClick('last')}
          />
          <MatchPreviewCard
            slot="next"
            data={matches.next}
            label={SLOT_LABELS.next}
            onEdit={() => handleEdit('next')}
            onDelete={() => handleDeleteClick('next')}
          />
        </VStack>
      </Box>

      <ConfirmDeleteDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => slotToDelete && deleteMatch(slotToDelete)}
        title="¿Eliminar partido?"
        description={`Se va a borrar "${SLOT_LABELS[slotToDelete] || ''}" de este jugador. La landing va a dejar de mostrarlo. Esta acción no se puede deshacer.`}
      />
    </>
  )
}
