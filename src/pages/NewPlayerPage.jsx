import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Flex, Text, Button, Spinner } from '@chakra-ui/react'
import { FiCheck, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/ui/BackButton'
import { StepPlayer, StepData, StepImages, StepLinks, StepAccess } from '../components/newPlayer/Steps'
import { Stepper, StepCard, Notice, Code, Initials, priBtn, ghostBtn, smBtn, lbl } from '../components/newPlayer/ui'
import { players, playerInitials } from '../data/players'
import { clubs } from '../data/clubs'
import { useRoster } from '../lib/rosterStore'
import { callApiFootball, normalizeName } from '../lib/apiFootball'
import { checkSlug, loginEmail, loginUsername, slugify, DEFAULT_LOGIN_DOMAIN, USERNAME_RE } from '../lib/roster'
import {
  searchApiPlayers, fetchApiProfile, positionEs, generatePassword, toWebp, uploadPlayerPhoto, uploadClubCrest,
  createPlayerRequest, formatDate,
} from '../lib/newPlayer'

// ─── ALTA DE JUGADOR · ASISTENTE POR PASOS ───────────────────────
// 1 Jugador (búsqueda en API-Football) · 2 Datos (importados o a mano)
// · 3 Foto y escudo · 4 Links y slug · 5 Usuario y contraseña. Al final
// sube las imágenes a Storage y la función create-player crea la
// cuenta y guarda la ficha en players/{slug}.

const STEPS = ['Jugador', 'Datos', 'Foto y escudo', 'Links y clave', 'Acceso']
const LOGIN_DOMAIN = import.meta.env.VITE_PLAYER_LOGIN_DOMAIN || DEFAULT_LOGIN_DOMAIN
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FIELDS = [
  ['birthDate', 'Fecha de nacimiento', 'dd/mm/aaaa', 'date'],
  ['birthPlace', 'Lugar de nacimiento', 'Ciudad, país'],
  ['nationality', 'Nacionalidad', 'País'],
  ['height', 'Altura', '180 cm'],
  ['weight', 'Peso', '75 kg'],
  ['club', 'Club actual', 'Club'],
  ['position', 'Posición', 'Ej: Defensor'],
  ['number', 'Dorsal', 'Número'],
  ['foot', 'Pie hábil', 'Derecho / Izquierdo'],
]

const newRequestId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

const fresh = () => ({
  step: 1, reached: 1, name: '', idq: '',
  search: { status: 'idle', results: [], q: '', error: '', byId: false },
  pick: null, skipped: false, profile: { status: 'idle', data: null, error: '' },
  imp: {}, man: {}, career: null,
  photo: { status: 'empty' }, crest: { status: 'empty' },
  landing: '', drive: '', slug: null, username: null,
  withAccount: true, pass: generatePassword(), eye: true, copied: false, mustChange: true,
  phase: 'form', prog: 0, failed: '', uploaded: {}, result: null, syncWarn: '', copiedBoth: false,
  requestId: newRequestId(),
})

const checkUrl = (v, re, okMsg) => {
  if (!v) return { bad: false, msg: 'Si no tiene, dejalo vacío.' }
  let ok = false
  try { ok = new URL(v).protocol === 'https:' && re.test(v) } catch { ok = false }
  return ok ? { bad: false, msg: okMsg } : { bad: true, msg: 'El link no parece válido.' }
}

export default function NewPlayerPage() {
  const navigate = useNavigate()
  const roster = useRoster()
  const [s, setS] = useState(fresh)
  const set = (patch) => setS((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
  const profiles = useRef(new Map()) // id → perfil, para no gastar cuota dos veces
  const searchSeq = useRef(0)

  // Libera las vistas previas locales al salir.
  const previews = useRef([])
  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), [])
  const localUrl = (blob) => { const u = URL.createObjectURL(blob); previews.current.push(u); return u }

  // ── API-Football ──
  const loadProfile = async (id) => {
    if (profiles.current.has(id)) return set({ profile: { status: 'ok', data: profiles.current.get(id), error: '' } })
    set({ profile: { status: 'loading', data: null, error: '' } })
    try {
      const data = await fetchApiProfile(id)
      profiles.current.set(id, data)
      setS((prev) => (prev.pick === id ? { ...prev, profile: { status: 'ok', data, error: '' } } : prev))
    } catch (err) {
      setS((prev) => (prev.pick === id ? { ...prev, profile: { status: 'error', data: null, error: err.message } } : prev))
    }
  }

  const search = async () => {
    const words = normalizeName(s.name).split(' ').filter(Boolean)
    // La API busca por apellido (una palabra, 3 letras o más).
    const q = [...words].reverse().find((x) => x.length >= 3)
    if (!q) return
    const seq = ++searchSeq.current
    set({ skipped: false, pick: null, search: { status: 'loading', results: [], q: s.name.trim(), error: '', byId: false } })
    try {
      const { results } = await searchApiPlayers(q)
      if (seq !== searchSeq.current) return
      const first = words[0]
      const score = (r) => {
        const n = normalizeName(r.name)
        return (words.every((x) => n.includes(x)) ? 2 : 0) + (n.startsWith(first) ? 1 : 0)
      }
      const list = results
        .map((r) => ({ ...r, score: score(r) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((r) => ({
          ...r,
          line: [r.birth?.slice(0, 4), r.nationality, positionEs(r.position), r.age ? `${r.age} años` : null].filter(Boolean).join(' · '),
        }))
      set({ search: { status: list.length ? 'results' : 'empty', results: list, q: s.name.trim(), error: '', byId: false } })
    } catch (err) {
      if (seq === searchSeq.current) set({ search: { status: 'error', results: [], q: s.name.trim(), error: err.message, byId: false } })
    }
  }

  const searchById = async () => {
    const id = Number(s.idq)
    if (!id) return
    const seq = ++searchSeq.current
    set({ skipped: false, pick: null, search: { status: 'loading', results: [], q: `ID ${id}`, error: '', byId: true } })
    try {
      const data = profiles.current.get(id) || (await fetchApiProfile(id))
      profiles.current.set(id, data)
      if (seq !== searchSeq.current) return
      const r = {
        id: data.id, name: data.name, photo: data.photo,
        line: [data.birthDate?.slice(0, 4), data.nationality, positionEs(data.position), data.team?.name].filter(Boolean).join(' · '),
      }
      set((prev) => ({ name: prev.name.trim() ? prev.name : data.name, search: { status: 'results', results: [r], q: `ID ${id}`, error: '', byId: true } }))
    } catch (err) {
      if (seq !== searchSeq.current) return
      const notFound = /No hay ningún jugador/.test(err.message)
      set({ search: { status: notFound ? 'empty' : 'error', results: [], q: `ID ${id}`, error: err.message, byId: true } })
    }
  }

  const pickResult = (id) => {
    set({ pick: id, imp: {}, career: null, crest: { status: 'empty' }, photo: s.photo.apiUrl ? { status: 'empty' } : s.photo })
    loadProfile(id)
  }

  // ── Datos ──
  const api = s.pick && s.profile.status === 'ok' ? s.profile.data : null
  const apiVals = api ? {
    birthDate: api.birthDate, birthPlace: api.birthPlace, nationality: api.nationality, height: api.height, weight: api.weight,
    club: api.team?.name, position: positionEs(api.position), number: api.number != null ? String(api.number) : '',
  } : {}

  const fields = FIELDS.map(([k, l, ph, type]) => {
    const apiV = apiVals[k] || ''
    const hasApi = Boolean(apiV)
    const on = hasApi && s.imp[k] !== false
    const man = s.man[k] ?? ''
    return {
      k, l, ph, type, hasApi, on, man,
      value: on ? apiV : man.trim(),
      display: k === 'birthDate' ? formatDate(apiV) : apiV,
      kind: on ? 'api' : man.trim() ? 'man' : 'miss',
    }
  })
  const val = Object.fromEntries(fields.map((f) => [f.k, f.value]))

  const clubInfo = useMemo(() => {
    const byName = (n) => clubs.find((c) => normalizeName(c.name) === normalizeName(n))
    if (api?.team && s.imp.club !== false) {
      const existing = clubs.find((c) => c.apiTeamId === api.team.id) || byName(api.team.name)
      return existing
        ? { existing, name: existing.name }
        : { name: api.team.name, crest: api.team.logo, apiTeamId: api.team.id, country: api.league?.country || null, competition: api.league?.name || null }
    }
    const text = (s.man.club || '').trim()
    if (!text) return null
    const existing = byName(text)
    return existing ? { existing, name: existing.name } : { name: text }
  }, [api, s.imp.club, s.man.club, roster.version])

  const career = s.career ?? (api?.career || []).map((c) => ({ years: c.from === c.to ? `${c.from}` : `${c.from}–${String(c.to).slice(-2)}`, club: c.name }))
  const setCareer = (fn) => set({ career: fn(career.map((c) => ({ ...c }))) })

  // ── Slug, links y usuario ──
  const slug = s.slug ?? slugify(s.name)
  const slugCheck = checkSlug(slug, players.map((p) => p.slug))
  const landingCheck = checkUrl(s.landing, /^https:\/\/[^\s/.]+\.[^\s]+/, 'Se conecta con el botón Landing del banner.')
  const driveCheck = checkUrl(s.drive, /^https:\/\/drive\.google\.com\//, 'Se conecta con el botón Fotos del banner.')
  const username = s.username ?? slug
  const usernameBad = s.withAccount && !(username.includes('@') ? EMAIL_RE.test(username) : USERNAME_RE.test(username))
  const email = loginEmail(username, LOGIN_DOMAIN)

  // ── Imágenes ──
  const setImage = (key, max) => async (file) => {
    set({ [key]: { status: 'processing' }, uploaded: { ...s.uploaded, [key]: null } })
    try {
      const blob = await toWebp(file, max)
      set({ [key]: { status: 'ok', blob, preview: localUrl(blob), label: `${file.name} → ${Math.round(blob.size / 1024)} KB` } })
    } catch (err) {
      set({ [key]: { status: 'err', error: err.message } })
    }
  }

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).then(() => set({ [key]: true })).catch(() => set({ [key]: false }))
  }

  // ── Navegación ──
  const canNext = {
    1: Boolean(s.name.trim()) && ((s.pick && s.profile.status !== 'error') || s.skipped),
    2: s.profile.status !== 'loading',
    3: s.photo.status !== 'processing' && s.crest.status !== 'processing',
    4: slugCheck.state !== 'bad' && !landingCheck.bad && !driveCheck.bad,
  }[s.step] ?? true
  const missing = fields.filter((f) => f.kind === 'miss').length
  const hint = {
    1: !s.pick && !s.skipped ? 'Elegí un resultado o seguí sin API' : s.pick ? `ID ${s.pick} vinculado` : 'Sin ID de API',
    2: missing ? `${missing} datos sin completar (podés seguir)` : 'Todo completo',
    3: s.photo.status === 'ok' ? 'Foto lista' : 'La foto se puede subir después',
    4: slugCheck.state === 'bad' ? 'Corregí el slug para seguir' : `Clave: ${slug}`,
    5: usernameBad ? 'Revisá el usuario' : 'Último paso',
  }[s.step]
  const go = (n) => set((prev) => ({ step: n, reached: Math.max(prev.reached, n) }))

  // ── Guardado ──
  const payload = (up) => ({
    requestId: s.requestId, slug, name: s.name.trim(),
    apiPlayerId: s.pick || null,
    photo: up.photo || null,
    landingUrl: s.landing || null, driveUrl: s.drive || null,
    profile: Object.fromEntries(FIELDS.filter(([k]) => k !== 'club').map(([k]) => [k, val[k] || null])),
    sources: Object.fromEntries(fields.filter((f) => f.k !== 'club' && f.kind !== 'miss').map((f) => [f.k, f.kind === 'api' ? 'api' : 'manual'])),
    career: career.filter((c) => c.club.trim()),
    club: !clubInfo ? null : clubInfo.existing ? { id: clubInfo.existing.id } : {
      name: clubInfo.name, apiTeamId: clubInfo.apiTeamId || null, country: clubInfo.country || null,
      competition: clubInfo.competition || null, crest: clubInfo.crest || up.crest || null,
    },
    account: s.withAccount ? { username, password: s.pass, mustChange: s.mustChange } : null,
  })

  // Lo ya subido queda en `uploaded`: un reintento no lo sube de nuevo.
  const runSave = async () => {
    set({ phase: 'saving', failed: '', prog: 0 })
    const up = { ...s.uploaded }
    try {
      if (s.photo.apiUrl) up.photo = s.photo.apiUrl
      else if (s.photo.blob && !up.photo) up.photo = await uploadPlayerPhoto(slug, s.photo.blob)
      if (clubInfo && !clubInfo.existing && !clubInfo.crest && s.crest.blob && !up.crest) {
        up.crest = await uploadClubCrest(slug, clubInfo.name, s.crest.blob)
      }
      set({ uploaded: up, prog: 1 })
      const result = await createPlayerRequest(payload(up))
      set({ prog: 3, result })
      let syncWarn = ''
      const apiTeamId = clubInfo?.existing ? clubInfo.existing.apiTeamId : clubInfo?.apiTeamId
      if (result.clubId && apiTeamId) {
        try { await callApiFootball('sync', { club: result.clubId }, { method: 'POST' }) } catch (err) { syncWarn = err.message }
      } else {
        syncWarn = 'El club no tiene ID de API-Football: sus partidos se cargan a mano.'
      }
      await roster.refresh()
      set({ phase: 'ok', prog: 4, syncWarn })
    } catch (err) {
      setS((prev) => ({ ...prev, uploaded: up, failed: err.message }))
    }
  }

  const w = {
    state: s, set, initials: playerInitials(s.name) || '?',
    search, searchById, retrySearch: () => (s.search.byId ? searchById() : search()),
    skipApi: () => { searchSeq.current++; set({ skipped: true, pick: null, profile: { status: 'idle', data: null, error: '' }, search: { ...s.search, status: 'idle' }, imp: {}, career: null }) },
    pickResult, retryProfile: () => s.pick && loadProfile(s.pick),
    fields, hasApi: Boolean(api), allClubs: clubs, clubInfo,
    toggleImport: (k) => set({ imp: { ...s.imp, [k]: s.imp[k] === false } }),
    editField: (k, v) => set({ man: { ...s.man, [k]: v } }),
    career, careerFromApi: s.career == null && career.length > 0,
    editCareer: (i, k, v) => setCareer((c) => { c[i][k] = v; return c }),
    removeCareer: (i) => setCareer((c) => c.filter((_, j) => j !== i)),
    addCareer: () => setCareer((c) => [{ years: '', club: '' }, ...c]),
    apiPhoto: api?.photo || null,
    setPhotoFile: setImage('photo', 900),
    useApiPhoto: () => set({ photo: { status: 'ok', apiUrl: api.photo, preview: api.photo, label: 'Foto de API-Football · conviene reemplazarla' } }),
    clearPhoto: () => set({ photo: { status: 'empty' }, uploaded: { ...s.uploaded, photo: null } }),
    setCrestFile: setImage('crest', 400),
    clearCrest: () => set({ crest: { status: 'empty' }, uploaded: { ...s.uploaded, crest: null } }),
    slug, slugCheck, slugEdited: s.slug != null && s.slug !== slugify(s.name), landingCheck, driveCheck,
    username, usernameBad, email, loginDomain: LOGIN_DOMAIN,
    regenerate: () => set({ pass: generatePassword(), copied: false }),
    copy,
  }

  const photoSrc = s.photo.status === 'ok' ? s.photo.preview : null
  const inForm = s.phase === 'form'

  return (
    <Box px={{ base: 4, md: 6, lg: 10 }} pt={{ base: 4, md: 6 }} pb={20}>
      <Flex maxW="980px" mx="auto" direction="column" gap={5}>
        <Flex wrap="wrap" align="flex-end" justify="space-between" gap={3.5}>
          <Flex direction="column" gap={1} align="flex-start">
            <BackButton to="/jugadores" label="Jugadores" />
            <Text as="h1" fontFamily="heading" fontSize={{ base: '44px', md: '60px' }} lineHeight={0.95}>Nuevo jugador</Text>
          </Flex>
          {inForm && s.step > 1 && (
            <Flex align="center" gap={3} pl={2} pr={4} py={2} borderRadius="full" bg="#050404" border="1px solid #2a211b">
              <Initials text={w.initials} size="40px" fontSize="17px" src={photoSrc} />
              <Flex direction="column" gap="2px" minW={0}>
                <Text fontWeight={600} noOfLines={1}>{s.name}</Text>
                <Text {...lbl} fontSize="11px">{s.pick ? `ID ${s.pick}${clubInfo ? ` · ${clubInfo.name}` : ''}` : 'Sin ID de API'}</Text>
              </Flex>
            </Flex>
          )}
        </Flex>

        {inForm && (
          <>
            <Stepper steps={STEPS} current={s.step} reached={s.reached} onGo={go} />
            {s.step === 1 && <StepPlayer w={w} />}
            {s.step === 2 && <StepData w={w} />}
            {s.step === 3 && <StepImages w={w} />}
            {s.step === 4 && <StepLinks w={w} />}
            {s.step === 5 && <StepAccess w={w} />}
            {s.failed && <Notice kind="err"><b>No se pudo crear.</b> {s.failed}</Notice>}
            <Flex wrap="wrap" align="center" justify="space-between" gap={3}>
              <Button {...ghostBtn} onClick={() => go(s.step - 1)} isDisabled={s.step === 1}>Atrás</Button>
              <Text fontSize="14px" color="brand.gray" order={{ base: 3, sm: 0 }} w={{ base: '100%', sm: 'auto' }} textAlign={{ base: 'center', sm: 'left' }}>{hint}</Text>
              {s.step < 5
                ? <Button {...priBtn} onClick={() => go(s.step + 1)} isDisabled={!canNext}>Siguiente</Button>
                : <Button {...priBtn} onClick={() => runSave()} isDisabled={usernameBad || slugCheck.state === 'bad'}>Crear jugador</Button>}
            </Flex>
          </>
        )}

        {s.phase === 'saving' && <Saving s={s} slug={slug} onRetry={() => runSave()} onEdit={() => set({ phase: 'form', step: 4 })} />}
        {s.phase === 'ok' && (
          <Success s={s} email={email} copy={copy}
            onOpen={() => navigate(`/jugador/${s.result.slug}`)}
            onAnother={() => { previews.current.forEach((u) => URL.revokeObjectURL(u)); previews.current = []; setS(fresh()) }} />
        )}
      </Flex>
    </Box>
  )
}

function Saving({ s, slug, onRetry, onEdit }) {
  const lines = [
    'Subiendo foto y escudo',
    s.withAccount ? 'Creando cuenta en Firebase Authentication' : 'Sin cuenta de acceso',
    `Guardando ficha en players/${slug}`,
    'Primera sincronización con API-Football',
  ]
  // La función hace cuenta + ficha juntas: las dos líneas avanzan a la par.
  const at = (i) => (i === 2 && s.prog === 1 ? 1 : i)
  return (
    <StepCard title={`Creando a ${s.name.trim()}`}>
      <Flex direction="column" gap={1.5} aria-live="polite">
        {lines.map((t, i) => {
          const ok = i < s.prog
          const run = at(i) === s.prog && !s.failed
          const bad = at(i) === s.prog && Boolean(s.failed)
          return (
            <Flex key={t} align="center" gap={3} minH="40px" fontSize="15px" color={ok || run ? 'white' : bad ? '#ff9a8a' : '#8c7f70'}>
              <Flex align="center" justify="center" boxSize="22px" borderRadius="full" flexShrink={0}
                bg={ok ? '#5fd38d' : bad ? '#ff7a66' : run ? 'transparent' : '#2a2420'}>
                {ok && <FiCheck color="#171514" strokeWidth={3.5} size={13} />}
                {bad && <FiX color="#171514" strokeWidth={3.5} size={12} />}
                {run && <Spinner size="xs" color="brand.orange" />}
              </Flex>
              {t}
            </Flex>
          )
        })}
      </Flex>
      {s.failed && (
        <Notice kind="err">
          <Flex direction="column" gap={2.5}>
            <Text><b>No se pudo terminar.</b> {s.failed} Reintentar no duplica la cuenta ni la ficha.</Text>
            <Flex gap={2} wrap="wrap">
              <Button {...ghostBtn} {...smBtn} onClick={onRetry}>Reintentar</Button>
              <Button {...ghostBtn} {...smBtn} onClick={onEdit}>Volver a editar</Button>
            </Flex>
          </Flex>
        </Notice>
      )}
    </StepCard>
  )
}

function Success({ s, email, copy, onOpen, onAnother }) {
  const r = s.result
  return (
    <StepCard title={`${s.name.trim()} ya está en el panel`}
      intro={<>Se guardó en <Code>players/{r.slug}</Code>. Para su landing: <Code>VITE_PLAYER_SLUG={r.slug}</Code></>}>
      {s.syncWarn && <Notice kind="warn">Primera sincronización: {s.syncWarn}</Notice>}
      {r.email && (
        <Flex direction="column" gap={2.5} p={{ base: 4, md: 5 }} borderRadius="14px" bg="#0f0c0a" border="1px solid rgba(249,160,63,.4)">
          <Text {...lbl} color="brand.orange">Credenciales · se muestran esta única vez</Text>
          <Box display="grid" gridTemplateColumns="110px minmax(0,1fr)" gap="8px 12px" fontSize="15px" alignItems="center">
            <Text color="brand.gray">Usuario</Text><Code justifySelf="start">{loginUsername(r.email || email, LOGIN_DOMAIN)}</Code>
            <Text color="brand.gray">Contraseña</Text><Code justifySelf="start">{s.pass}</Code>
          </Box>
          <Button {...priBtn} {...smBtn} alignSelf="flex-start" onClick={() => copy(`Usuario: ${loginUsername(r.email || email, LOGIN_DOMAIN)}\nContraseña: ${s.pass}`, 'copiedBoth')}>
            {s.copiedBoth ? 'Copiado' : 'Copiar usuario y contraseña'}
          </Button>
        </Flex>
      )}
      <Flex wrap="wrap" gap={2.5}>
        <Button {...priBtn} onClick={onOpen}>Ver su ficha</Button>
        <Button {...ghostBtn} onClick={onAnother}>Cargar otro jugador</Button>
      </Flex>
    </StepCard>
  )
}
