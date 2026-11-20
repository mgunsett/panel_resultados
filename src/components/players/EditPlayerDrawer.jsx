import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  Flex, Image, Input, Select, Spinner, Text, useToast,
} from '@chakra-ui/react'
import { FiDownloadCloud, FiRotateCcw } from 'react-icons/fi'
import { clubs, getClub } from '../../data/clubs'
import { playerInitials } from '../../data/players'
import { filePlayer, useRoster } from '../../lib/rosterStore'
import {
  PROFILE_FIELDS, formFromPlayer, validate, checkUrl, LANDING_RE, DRIVE_RE, savePlayerEdit, resetPlayerEdit,
} from '../../lib/playerEdit'
import { fetchApiProfile, positionEs, toWebp, uploadPlayerPhoto, uploadClubCrest, MAX_IMAGE_MB } from '../../lib/newPlayer'
import ClubCrest from '../clubs/ClubCrest'
import { Notice, Pill, Dropzone, Code, priBtn, ghostBtn, smBtn, fieldStyle, monoField, lbl } from '../newPlayer/ui'

// ─── EDITAR JUGADOR ──────────────────────────────────────────────
// Panel lateral que abre el lápiz del banner (junto al nombre o en la
// esquina de Landing / Fotos). Edita todo lo de la ficha menos el slug.
// `focus` = 'landingUrl' | 'driveUrl' para entrar directo a ese link.
// Cómo se guarda cada caso: src/lib/playerEdit.js.

function Section({ title, children, right }) {
  return (
    <Flex as="section" direction="column" gap={3.5} py={5} borderTop="1px solid #211a15" _first={{ borderTop: 0, pt: 1 }}>
      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <Text as="h3" fontFamily="heading" fontSize="24px" lineHeight={1}>{title}</Text>
        {right}
      </Flex>
      {children}
    </Flex>
  )
}

function Field({ id, label, hint, error, children }) {
  return (
    <Flex direction="column" gap={1.5} minW={0}>
      <Text as="label" htmlFor={id} {...lbl}>{label}</Text>
      {children}
      {(error || hint) && <Text fontSize="13px" color={error ? '#ff9a8a' : '#8c7f70'}>{error || hint}</Text>}
    </Flex>
  )
}

// Estado del panel para un banner: `open()` abre todo, `open('driveUrl')`
// entra directo a ese link.
export function useEditPlayer(player) {
  const [state, setState] = useState({ isOpen: false, focus: null })
  const open = (focus = null) => setState({ isOpen: true, focus: typeof focus === 'string' ? focus : null })
  const drawer = (
    <EditPlayerDrawer player={player} isOpen={state.isOpen} focus={state.focus}
      onClose={() => setState((s) => ({ ...s, isOpen: false }))} />
  )
  return { open, drawer }
}

const cacheBust = (url) => `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`

export default function EditPlayerDrawer({ player, isOpen, onClose, focus }) {
  const toast = useToast()
  const roster = useRoster()
  const base = player && !player.panel ? filePlayer(player.slug) : null
  const initial = useMemo(() => formFromPlayer(player), [player, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState(initial)
  const [photo, setPhoto] = useState({ status: 'idle' })
  const [crest, setCrest] = useState({ status: 'idle' })
  const [apiState, setApiState] = useState({ status: 'idle' })
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false)
  const landingRef = useRef(null)
  const driveRef = useRef(null)
  const previews = useRef([])

  useEffect(() => {
    if (!isOpen) return
    setForm(initial)
    setPhoto({ status: 'idle' })
    setCrest({ status: 'idle' })
    setApiState({ status: 'idle' })
    setTouched(false)
  }, [isOpen, initial])
  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), [])

  if (!player) return null

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const setProfile = (k, v) => setForm((f) => ({ ...f, profile: { ...f.profile, [k]: v } }))
  const errors = validate(form)
  const hasErrors = Object.keys(errors).length > 0
  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || photo.status === 'ok' || crest.status === 'ok'
  const club = getClub(form.clubId)
  // El escudo sólo se cambia acá si el club vino con este jugador desde
  // el alta (panelClub). Los de clubs.js son compartidos.
  const crestEditable = Boolean(player.panel && player.panelClub?.id && player.panelClub.id === form.clubId)
  const landingCheck = checkUrl(form.landingUrl, LANDING_RE, 'Se conecta con el botón Landing del banner.')
  const driveCheck = checkUrl(form.driveUrl, DRIVE_RE, 'Se conecta con el botón Fotos del banner.')
  const sortedClubs = [...clubs].sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const pickImage = (setter, max) => async (file) => {
    setter({ status: 'processing' })
    try {
      const blob = await toWebp(file, max)
      const preview = URL.createObjectURL(blob)
      previews.current.push(preview)
      setter({ status: 'ok', blob, preview })
    } catch (err) {
      setter({ status: 'err', error: err.message })
    }
  }

  const importApi = async () => {
    const id = Number(form.apiPlayerId)
    if (!id) return
    setApiState({ status: 'loading' })
    try {
      const data = await fetchApiProfile(id)
      const vals = {
        birthDate: data.birthDate, birthPlace: data.birthPlace, nationality: data.nationality, height: data.height,
        weight: data.weight, position: positionEs(data.position), number: data.number != null ? String(data.number) : '',
      }
      const filled = Object.entries(vals).filter(([, v]) => v)
      const sameClub = data.team && clubs.find((c) => c.apiTeamId === data.team.id)
      setForm((f) => ({
        ...f,
        profile: { ...f.profile, ...Object.fromEntries(filled) },
        clubId: sameClub ? sameClub.id : f.clubId,
      }))
      const extra = data.team && !sameClub ? ` Su club en la API es ${data.team.name}, que no está en el panel: el club no se cambió.` : ''
      setApiState({ status: 'ok', msg: `Se completaron ${filled.length} datos desde API-Football. Revisalos y guardá.${extra}` })
    } catch (err) {
      setApiState({ status: 'err', msg: err.message })
    }
  }

  const save = async () => {
    setTouched(true)
    if (hasErrors) return
    setSaving(true)
    try {
      let next = form
      if (photo.status === 'ok') next = { ...next, photo: cacheBust(await uploadPlayerPhoto(player.slug, photo.blob)) }
      let crestUrl = null
      if (crest.status === 'ok' && crestEditable) crestUrl = cacheBust(await uploadClubCrest(player.slug, player.panelClub.name, crest.blob))
      const count = await savePlayerEdit({ player, base, form: next, crest: crestUrl })
      await roster.refresh()
      toast({
        status: 'success', position: 'bottom-right', duration: 4000,
        title: 'Jugador actualizado',
        description: count === 0 ? 'Quedó igual que en players.js.' : undefined,
      })
      onClose()
    } catch (err) {
      toast({ status: 'error', position: 'bottom-right', duration: 7000, title: 'No se pudo guardar', description: err.message })
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    setSaving(true)
    try {
      await resetPlayerEdit(player)
      await roster.refresh()
      toast({ status: 'success', position: 'bottom-right', duration: 4000, title: 'Cambios descartados', description: 'Volvió a lo que dice players.js.' })
      onClose()
    } catch (err) {
      toast({ status: 'error', position: 'bottom-right', duration: 7000, title: 'No se pudo descartar', description: err.message })
    } finally {
      setSaving(false)
    }
  }

  const photoSrc = photo.status === 'ok' ? photo.preview : form.photo
  const initialFocusRef = focus === 'landingUrl' ? landingRef : focus === 'driveUrl' ? driveRef : undefined

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md" initialFocusRef={initialFocusRef}
      closeOnOverlayClick={!dirty} blockScrollOnMount>
      <DrawerOverlay bg="rgba(5,4,4,.7)" />
      <DrawerContent bg="#0d0b0a" color="white" borderLeft="1px solid #2e2825" boxShadow="inset 3px 0 0 #F9A03F" maxW={{ base: '100vw', md: '520px' }}>
        <DrawerCloseButton top={4} right={4} boxSize="44px" color="brand.amber" isDisabled={saving} />
        <DrawerHeader px={{ base: 5, md: 6 }} pt={5} pb={4} borderBottom="1px solid #211a15">
          <Text {...lbl} color="brand.orange">Editar jugador</Text>
          <Text fontFamily="heading" fontSize="38px" lineHeight={1} fontWeight="normal" pr={10} noOfLines={1}>{form.name || player.name}</Text>
          <Flex wrap="wrap" gap={2} mt={2.5} align="center">
            <Code>{player.slug}</Code>
            {player.panel ? <Pill kind="api">Alta en el panel</Pill> : <Pill kind="man">players.js{player.edited ? ' + cambios del panel' : ''}</Pill>}
          </Flex>
        </DrawerHeader>

        <DrawerBody px={{ base: 5, md: 6 }} py={4}>
          <Section title="Foto y nombre">
            <Flex gap={4} align="flex-start" wrap="wrap">
              {photoSrc ? (
                <Image src={photoSrc} alt="" w="96px" h="120px" objectFit="cover" objectPosition="top" borderRadius="12px" bg="#2a2420" flexShrink={0} />
              ) : (
                <Flex w="96px" h="120px" borderRadius="12px" bg="brand.brownLight" align="center" justify="center" fontFamily="heading"
                  fontSize="4xl" color="brand.amber" flexShrink={0}>{playerInitials(form.name)}</Flex>
              )}
              <Flex direction="column" gap={2} flex="1 1 200px" minW={0}>
                {photo.status === 'processing' ? (
                  <Flex align="center" gap={2} color="brand.gray" minH="44px"><Spinner size="sm" color="brand.orange" />Optimizando…</Flex>
                ) : (
                  <Dropzone onFile={pickImage(setPhoto, 900)} minH="76px"
                    title={photo.status === 'ok' ? 'Elegir otra foto' : 'Cambiar foto'} hint={`JPG, PNG o WebP · hasta ${MAX_IMAGE_MB} MB`} />
                )}
                {photo.status === 'err' && <Notice kind="err" py={2}>{photo.error}</Notice>}
                {photo.status === 'ok' && (
                  <Button {...ghostBtn} {...smBtn} alignSelf="flex-start" onClick={() => setPhoto({ status: 'idle' })}>Dejar la de antes</Button>
                )}
              </Flex>
            </Flex>
            <Box display="grid" gridTemplateColumns="minmax(0,1fr) 150px" gap={3}>
              <Field id="ep-name" label="Nombre" error={touched || form.name !== initial.name ? errors.name : null}>
                <Input id="ep-name" {...fieldStyle} value={form.name} isInvalid={Boolean(errors.name)} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field id="ep-role" label="Rol">
                <Select id="ep-role" {...fieldStyle} value={form.role} onChange={(e) => set({ role: e.target.value })}>
                  <option value="" style={{ background: '#1E1B19' }}>Jugador</option>
                  <option value="DT" style={{ background: '#1E1B19' }}>DT</option>
                </Select>
              </Field>
            </Box>
          </Section>

          <Section title="Club">
            <Flex gap={3} align="center">
              {club ? <ClubCrest club={crest.status === 'ok' ? { ...club, crest: crest.preview } : club} size="48px" fontSize="11px" />
                : <Box boxSize="48px" borderRadius="10px" border="1px dashed #3a2f27" flexShrink={0} />}
              <Select aria-label="Club" {...fieldStyle} value={form.clubId} onChange={(e) => { set({ clubId: e.target.value }); setCrest({ status: 'idle' }) }}>
                <option value="" style={{ background: '#1E1B19' }}>Sin club</option>
                {sortedClubs.map((c) => <option key={c.id} value={c.id} style={{ background: '#1E1B19' }}>{c.name}{c.country ? ` · ${c.country}` : ''}</option>)}
              </Select>
            </Flex>
            {crestEditable ? (
              <>
                <Dropzone onFile={pickImage(setCrest, 400)} minH="64px" accept="image/png,image/webp,image/svg+xml"
                  title={crest.status === 'ok' ? 'Elegir otro escudo' : 'Cambiar escudo'} hint="PNG, WebP o SVG con fondo transparente" />
                {crest.status === 'err' && <Notice kind="err" py={2}>{crest.error}</Notice>}
              </>
            ) : club ? (
              <Text fontSize="13px" color="#8c7f70">El escudo es del club y lo comparten sus jugadores: se cambia en clubs.js.</Text>
            ) : null}
            {!club && <Text fontSize="13px" color="#8c7f70">¿El club no está en la lista? Se suma desde el alta de un jugador o en clubs.js.</Text>}
          </Section>

          <Section title="Links">
            <Field id="ep-landing" label="Landing page" error={landingCheck.bad ? landingCheck.msg : null} hint={landingCheck.msg}>
              <Input id="ep-landing" ref={landingRef} {...fieldStyle} value={form.landingUrl} inputMode="url" placeholder="https://nombre.netlify.app"
                isInvalid={landingCheck.bad} onChange={(e) => set({ landingUrl: e.target.value.trim() })} />
            </Field>
            <Field id="ep-drive" label="Carpeta de fotos en Drive" error={driveCheck.bad ? 'Tiene que ser un link de drive.google.com.' : null} hint={driveCheck.msg}>
              <Input id="ep-drive" ref={driveRef} {...fieldStyle} value={form.driveUrl} inputMode="url" placeholder="https://drive.google.com/drive/folders/…"
                isInvalid={driveCheck.bad} onChange={(e) => set({ driveUrl: e.target.value.trim() })} />
            </Field>
          </Section>

          <Section title="Datos personales" right={(
            <Button {...ghostBtn} {...smBtn} leftIcon={apiState.status === 'loading' ? <Spinner size="xs" /> : <FiDownloadCloud />}
              isDisabled={!Number(form.apiPlayerId) || apiState.status === 'loading'} onClick={importApi}
              title={Number(form.apiPlayerId) ? undefined : 'Cargá primero el ID de API-Football'}>
              Traer de API-Football
            </Button>
          )}>
            {apiState.status === 'ok' && <Notice py={2}>{apiState.msg}</Notice>}
            {apiState.status === 'err' && <Notice kind="err" py={2}>{apiState.msg}</Notice>}
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(min(100%, 190px), 1fr))" gap={3}>
              {PROFILE_FIELDS.map(([k, l, ph, type]) => (
                <Field key={k} id={`ep-${k}`} label={l}>
                  <Input id={`ep-${k}`} {...fieldStyle} h="40px" type={type || 'text'} placeholder={ph} value={form.profile[k]}
                    onChange={(e) => setProfile(k, e.target.value)} />
                </Field>
              ))}
            </Box>
          </Section>

          <Section title="API-Football y clave">
            <Field id="ep-api" label="ID de API-Football" error={errors.apiPlayerId}
              hint={form.apiPlayerId !== initial.apiPlayerId ? 'La próxima sincronización trae las estadísticas de este ID.' : 'Sin ID no se le sincronizan estadísticas (sí los partidos de su club).'}>
              <Input id="ep-api" {...fieldStyle} {...monoField} w="180px" inputMode="numeric" placeholder="Ej: 6059" value={form.apiPlayerId}
                isInvalid={Boolean(errors.apiPlayerId)} onChange={(e) => set({ apiPlayerId: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Flex direction="column" gap={1.5}>
              <Text {...lbl}>Slug</Text>
              <Flex wrap="wrap" gap={2} align="center"><Code>players/{player.slug}</Code><Code>VITE_PLAYER_SLUG={player.slug}</Code></Flex>
              <Text fontSize="13px" color="#8c7f70">No se edita: es la ruta de sus partidos en Firestore y la variable de su landing. Cambiarlo dejaría la landing sin datos.</Text>
            </Flex>
          </Section>
        </DrawerBody>

        <DrawerFooter px={{ base: 5, md: 6 }} py={4} borderTop="1px solid #211a15" gap={2.5} flexWrap="wrap" justifyContent="space-between">
          {player.edited && !player.panel ? (
            <Button variant="link" color="brand.gray" fontWeight="normal" fontSize="14px" minH="44px" leftIcon={<FiRotateCcw />}
              _hover={{ color: 'white' }} isDisabled={saving} onClick={reset}>
              Volver a players.js
            </Button>
          ) : <Box />}
          <Flex gap={2.5}>
            <Button {...ghostBtn} onClick={onClose} isDisabled={saving}>Cancelar</Button>
            <Button {...priBtn} onClick={save} isLoading={saving} loadingText="Guardando" isDisabled={!dirty || (touched && hasErrors)}>
              Guardar
            </Button>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
