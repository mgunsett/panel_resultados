import { useState, useEffect } from 'react'
import {
  Box, Flex, Text, Input, Button, FormControl, FormLabel, Grid, useToast,
} from '@chakra-ui/react'
import { FiSave } from 'react-icons/fi'
import { labelStyle, inputStyle } from '../ui/formStyles'
import ShieldUpload from './ShieldUpload'

const emptySlot = {
  home_team: '', away_team: '',
  home_score: '', away_score: '',
  match_date: '', stadium: '', competition: '',
  home_shield: '', away_shield: '',
}

// Firestore guarda los goles y escudos como number|null; los inputs
// controlados necesitan string, así que normalizamos null → ''.
function toFormState(data) {
  const merged = { ...emptySlot, ...(data || {}) }
  return Object.fromEntries(
    Object.entries(merged).map(([k, v]) => [k, v == null ? '' : v])
  )
}

// Bloque de un equipo (local o visitante).
function TeamFields({ side, title, form, onChange, onShieldChange }) {
  return (
    <Box
      px={3} py={3}
      bg="brand.dark"
      borderRadius="md"
      border="1px solid"
      borderColor="brand.brownDark"
    >
      <Text fontFamily="mono" fontSize="9px" color="brand.amber"
            textTransform="uppercase" letterSpacing="widest" mb={3}>
        {title}
      </Text>
      <FormControl mb={3}>
        <FormLabel {...labelStyle}>Equipo</FormLabel>
        <Input
          {...inputStyle}
          value={form[`${side}_team`]}
          onChange={onChange(`${side}_team`)}
          placeholder={side === 'home' ? 'Ej: Talleres' : 'Ej: River Plate'}
        />
      </FormControl>
      <FormControl mb={3}>
        <FormLabel {...labelStyle}>Goles</FormLabel>
        <Input
          {...inputStyle}
          value={form[`${side}_score`]}
          onChange={onChange(`${side}_score`)}
          placeholder="—"
          type="number"
          textAlign="center"
        />
      </FormControl>
      <ShieldUpload
        label="Escudo"
        currentUrl={form[`${side}_shield`]}
        onFileChange={onShieldChange}
      />
    </Box>
  )
}

export default function MatchForm({ slot, label, data, onSave, saving }) {
  const [form, setForm] = useState(() => toFormState(data))
  const [shieldFiles, setShieldFiles] = useState({ home: null, away: null })
  const toast = useToast()

  // Se dispara al cargar los datos, al guardar y al cambiar de jugador.
  // Limpiar shieldFiles acá evita re-subir el archivo anterior en el
  // próximo guardado.
  useEffect(() => {
    setForm(toFormState(data))
    setShieldFiles({ home: null, away: null })
  }, [data])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setShield = (side) => (file) => setShieldFiles((s) => ({ ...s, [side]: file }))

  // Sin equipos el partido no se muestra en la landing (MatchPreviewCard
  // usa home_team para saber si hay datos), así que no dejamos guardarlo.
  const handleSave = () => {
    if (!form.home_team.trim() || !form.away_team.trim()) {
      toast({
        title: 'Faltan los equipos',
        description: 'Cargá el equipo local y el visitante antes de guardar.',
        status: 'warning',
        duration: 4000,
      })
      return
    }
    onSave(slot, form, shieldFiles)
  }

  return (
    <Box>
      <Text fontFamily="mono" fontSize="10px" color="brand.gray"
            textTransform="uppercase" letterSpacing="widest" mb={4}>
        {label}
      </Text>

      <Grid
        templateColumns={{ base: '1fr', md: '1fr auto 1fr' }}
        gap={{ base: 4, md: 3 }}
        alignItems="start"
      >
        <TeamFields side="home" title="Local" form={form} onChange={set} onShieldChange={setShield('home')} />

        <Flex align="center" justify="center" h="100%" display={{ base: 'none', md: 'flex' }} pt={10}>
          <Text fontFamily="heading" fontSize="2xl" color="brand.brownLight">VS</Text>
        </Flex>

        <TeamFields side="away" title="Visitante" form={form} onChange={set} onShieldChange={setShield('away')} />
      </Grid>

      <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap={3} mt={4}>
        <FormControl>
          <FormLabel {...labelStyle}>Fecha</FormLabel>
          <Input {...inputStyle} value={form.match_date} onChange={set('match_date')} placeholder="22 Jun 2025" />
        </FormControl>
        <FormControl>
          <FormLabel {...labelStyle}>Estadio</FormLabel>
          <Input {...inputStyle} value={form.stadium} onChange={set('stadium')} placeholder="Mario Kempes" />
        </FormControl>
        <FormControl>
          <FormLabel {...labelStyle}>Competencia</FormLabel>
          <Input {...inputStyle} value={form.competition} onChange={set('competition')} placeholder="Liga Profesional" />
        </FormControl>
      </Grid>

      <Button
        mt={5} w="full"
        bg="brand.amber" color="brand.brown"
        fontFamily="mono" fontSize="sm" letterSpacing="widest" textTransform="uppercase"
        borderRadius="md" h="44px"
        leftIcon={<FiSave />}
        _hover={{ bg: 'brand.amberDark', color: 'white' }}
        _active={{ bg: 'brand.amberDark' }}
        isLoading={saving}
        onClick={handleSave}
      >
        Guardar {slot === 'last' ? 'Resultado' : 'Partido'}
      </Button>
    </Box>
  )
}
