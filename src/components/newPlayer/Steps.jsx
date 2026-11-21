import {
  Box, Flex, Text, Input, Button, Checkbox, Spinner, Image, IconButton, chakra,
} from '@chakra-ui/react'
import { FiSearch, FiX, FiEye, FiEyeOff, FiRefreshCw, FiUser } from 'react-icons/fi'
import ClubCrest from '../clubs/ClubCrest'
import {
  StepCard, Pill, Notice, EmptyBox, SkeletonRows, Dropzone, Code, Initials,
  priBtn, ghostBtn, smBtn, fieldStyle, monoField, lbl,
} from './ui'
import { MAX_IMAGE_MB } from '../../lib/newPlayer'

// ─── PASOS DEL ALTA ──────────────────────────────────────────────
// Componentes de presentación: el estado y las acciones viven en
// NewPlayerPage y llegan por props (`w` = wizard).

// ── 1 · Jugador y API ──
export function StepPlayer({ w }) {
  const { name, idq, search, pick, skipped } = w.state
  const loading = search.status === 'loading'
  return (
    <StepCard title="¿A quién sumamos?" intro="Con el nombre lo buscamos en API-Football. Si lo encontrás, sus datos se cargan solos.">
      <Flex as="form" wrap="wrap" gap={3} align="flex-end" onSubmit={(e) => { e.preventDefault(); w.search() }}>
        <Flex as="label" direction="column" gap={2} flex="1 1 280px">
          <Text as="span" {...lbl}>Nombre y apellido</Text>
          <Input {...fieldStyle} value={name} onChange={(e) => w.set({ name: e.target.value })} placeholder="Ej: Nicolás Fernández" autoComplete="off" />
        </Flex>
        <Button type="submit" {...priBtn} isDisabled={name.trim().length < 3 || loading}
          leftIcon={loading ? <Spinner size="sm" /> : <FiSearch />}>
          Buscar en API-Football
        </Button>
      </Flex>
      <Flex as="form" wrap="wrap" align="center" gap={2.5} fontSize="14px" color="brand.gray"
        onSubmit={(e) => { e.preventDefault(); w.searchById() }}>
        <Text as="label" htmlFor="np-id">¿Ya tenés el ID?</Text>
        <Input id="np-id" {...fieldStyle} {...monoField} h="40px" w="140px" value={idq} inputMode="numeric" placeholder="Ej: 6059"
          onChange={(e) => w.set({ idq: e.target.value.replace(/\D/g, '') })} />
        <Button type="submit" {...ghostBtn} {...smBtn} isDisabled={!idq || loading}>Buscar por ID</Button>
      </Flex>

      {search.status === 'idle' && !skipped && (
        <EmptyBox>
          <Box as={FiUser} boxSize="32px" color="brand.orange" aria-hidden />
          <Text color="white" fontWeight={600}>Todavía no buscaste</Text>
          <Text fontSize="14px">Escribí el nombre como figura en la liga. El apellido solo también funciona.</Text>
          <Button {...ghostBtn} {...smBtn} onClick={w.skipApi}>Cargar sin API</Button>
        </EmptyBox>
      )}

      {loading && (
        <Flex direction="column" gap={2.5} aria-live="polite">
          <Flex {...lbl} align="center" gap={2}><Spinner size="xs" color="brand.orange" />Buscando en API-Football…</Flex>
          <SkeletonRows count={3} />
        </Flex>
      )}

      {search.status === 'error' && (
        <Notice kind="err">
          <Flex direction="column" gap={2.5}>
            <Text><b>API-Football no respondió.</b> {search.error} Podés seguir cargando a mano: el ID se vincula después desde Sincronización.</Text>
            <Flex gap={2} wrap="wrap">
              <Button {...ghostBtn} {...smBtn} onClick={w.retrySearch}>Reintentar</Button>
              <Button {...ghostBtn} {...smBtn} onClick={w.skipApi}>Seguir sin API</Button>
            </Flex>
          </Flex>
        </Notice>
      )}

      {search.status === 'empty' && (
        <EmptyBox>
          <Text color="white" fontWeight={600}>Sin coincidencias para “{search.q}”</Text>
          <Text fontSize="14px">Probá con el apellido solo o buscá por ID. Si juega en una liga que la API no cubre, cargalo a mano.</Text>
          <Button {...ghostBtn} {...smBtn} onClick={w.skipApi}>Cargar sin ID de API</Button>
        </EmptyBox>
      )}

      {search.status === 'results' && (
        <Flex direction="column" gap={2.5}>
          <Text {...lbl}>{search.results.length} {search.results.length === 1 ? 'resultado' : 'resultados'} · elegí el correcto</Text>
          <Flex role="radiogroup" aria-label="Resultados de API-Football" direction="column" gap={2}>
            {search.results.map((r) => {
              const on = r.id === pick
              return (
                <chakra.button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => w.pickResult(r.id)}
                  display="grid" gridTemplateColumns="48px minmax(0,1fr) auto" alignItems="center" gap={3.5} w="100%" px={3.5} py={3}
                  borderRadius="12px" border="1px solid" borderColor={on ? 'brand.orange' : '#2a211b'} bg={on ? 'rgba(249,160,63,.07)' : '#0f0c0a'}
                  textAlign="left" _hover={{ borderColor: on ? 'brand.orange' : 'brand.brownDark' }}
                  _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '2px' }}>
                  <Initials text={w.initials} src={r.photo} />
                  <Flex direction="column" gap={1} minW={0}>
                    <Flex wrap="wrap" align="center" gap={2}><Text fontWeight={600} fontSize="16px">{r.name}</Text><Code>ID {r.id}</Code></Flex>
                    <Text fontSize="14px" color="brand.gray">{r.line}</Text>
                  </Flex>
                  <Box boxSize="20px" borderRadius="full" border={on ? '6px solid' : '2px solid'} borderColor={on ? 'brand.orange' : 'brand.brownDark'} />
                </chakra.button>
              )
            })}
          </Flex>
          <Button {...ghostBtn} {...smBtn} alignSelf="flex-start" onClick={w.skipApi}>No es ninguno · cargar a mano</Button>
        </Flex>
      )}

      {skipped && (
        <Notice>Vas a cargar todo a mano. El ID se puede vincular más tarde desde <b>Sincronización → Jugadores</b>; mientras tanto la landing recibe los partidos de su club pero no sus estadísticas.</Notice>
      )}
    </StepCard>
  )
}

// ── 2 · Datos personales ──
export function StepData({ w }) {
  const { profile } = w.state
  if (profile.status === 'loading') {
    return (
      <StepCard title="Datos personales" intro="Trayendo sus datos de API-Football…">
        <Flex direction="column" gap={2}><SkeletonRows count={5} h="48px" /></Flex>
      </StepCard>
    )
  }
  const counts = w.fields.reduce((a, f) => ({ ...a, [f.kind]: (a[f.kind] || 0) + 1 }), {})
  return (
    <StepCard
      title="Datos personales"
      intro={w.hasApi ? 'Tildado = se importa de API-Football. Destildá para escribirlo a mano.' : 'Sin ID de API: completá lo que sepas. Nada es obligatorio.'}
      right={(
        <Flex wrap="wrap" gap={1.5}>
          <Pill kind="api">API {counts.api || 0}</Pill>
          <Pill kind="man">Manual {counts.man || 0}</Pill>
          {counts.miss ? <Pill kind="miss">Faltan {counts.miss}</Pill> : null}
        </Flex>
      )}>
      {profile.status === 'error' && (
        <Notice kind="err">
          <Flex direction="column" gap={2}>
            <Text><b>No se pudieron traer los datos.</b> {profile.error}</Text>
            <Button {...ghostBtn} {...smBtn} alignSelf="flex-start" onClick={w.retryProfile}>Reintentar</Button>
          </Flex>
        </Notice>
      )}
      <Box>
        {w.fields.map((f) => (
          <Box key={f.k} display="grid" gridTemplateColumns={{ base: '24px 1fr 76px', md: '28px minmax(140px,200px) minmax(0,1fr) 84px' }}
            alignItems="center" columnGap={3} rowGap={2} py={2.5} borderTop="1px solid #211a15" minH="56px">
            <Box>{f.hasApi && <Checkbox colorScheme="orange" isChecked={f.on} onChange={() => w.toggleImport(f.k)} aria-label={`Importar ${f.l} desde la API`} />}</Box>
            <Text as="label" htmlFor={`np-f-${f.k}`} {...lbl} fontSize="13px">{f.l}</Text>
            <Box gridColumn={{ base: '2 / 4', md: 'auto' }} gridRow={{ base: 2, md: 'auto' }} minW={0}>
              {f.on ? (
                <Text fontSize="15px">{f.display}</Text>
              ) : (
                <>
                  <Input id={`np-f-${f.k}`} {...fieldStyle} h="40px" type={f.type || 'text'} value={f.man} placeholder={f.ph}
                    list={f.k === 'club' ? 'np-clubs' : undefined} onChange={(e) => w.editField(f.k, e.target.value)} />
                  {f.k === 'club' && (
                    <datalist id="np-clubs">{w.allClubs.map((c) => <option key={c.id} value={c.name} />)}</datalist>
                  )}
                </>
              )}
            </Box>
            <Box justifySelf="end"><Pill kind={f.kind}>{{ api: 'API', man: 'Manual', miss: 'Falta' }[f.kind]}</Pill></Box>
          </Box>
        ))}
      </Box>
      {w.clubInfo && (
        <Text fontSize="13px" color="brand.gray">
          {w.clubInfo.existing ? `${w.clubInfo.name} ya está en el panel: el jugador se suma a ese club.` : `${w.clubInfo.name} es un club nuevo: se crea al guardar.`}
        </Text>
      )}

      <Flex direction="column" gap={2.5} pt={4} borderTop="1px solid #211a15">
        <Flex wrap="wrap" align="center" justify="space-between" gap={2.5}>
          <Text as="h3" fontFamily="heading" fontSize="26px" lineHeight={1}>Trayectoria</Text>
          {w.careerFromApi && <Pill kind="api">Desde API-Football</Pill>}
        </Flex>
        {w.career.length === 0 && <EmptyBox py={4}><Text fontSize="14px">Sin clubes cargados. Agregá cada etapa con sus años.</Text></EmptyBox>}
        {w.career.map((c, i) => (
          <Box key={i} display="grid" gridTemplateColumns="104px minmax(0,1fr) 44px" gap={2.5} alignItems="center">
            <Input {...fieldStyle} h="40px" value={c.years} placeholder="2022–23" aria-label="Años" onChange={(e) => w.editCareer(i, 'years', e.target.value)} />
            <Input {...fieldStyle} h="40px" value={c.club} placeholder="Club" aria-label="Club" onChange={(e) => w.editCareer(i, 'club', e.target.value)} />
            <IconButton variant="ghost" color="brand.amber" icon={<FiX />} aria-label={`Quitar ${c.club || 'etapa'}`} h="44px" minW="44px"
              _hover={{ bg: '#2a2420', color: 'white' }} onClick={() => w.removeCareer(i)} />
          </Box>
        ))}
        <Button {...ghostBtn} {...smBtn} alignSelf="flex-start" onClick={w.addCareer}>+ Agregar etapa</Button>
      </Flex>
    </StepCard>
  )
}

// ── 3 · Foto y escudo ──
function Preview({ src, alt, w = '110px', h = '140px', fit = 'cover', children }) {
  return (
    <Flex gap={3.5} align="center" p={3} borderRadius="14px" bg="#0f0c0a" border="1px solid #2a211b">
      <Image src={src} alt={alt} w={w} h={h} objectFit={fit} objectPosition="top" borderRadius="10px" bg="#2a2420" flexShrink={0} />
      <Flex direction="column" gap={2} minW={0}>{children}</Flex>
    </Flex>
  )
}

export function StepImages({ w }) {
  const { photo, crest } = w.state
  const club = w.clubInfo
  return (
    <StepCard title="Foto y escudo" intro="La foto se achica y se guarda como WebP. El escudo solo se pide si la API no lo trae.">
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(min(100%, 300px), 1fr))" gap={5}>
        <Flex direction="column" gap={2.5}>
          <Text {...lbl}>Foto del jugador</Text>
          {photo.status === 'empty' && (
            <>
              <Dropzone onFile={w.setPhotoFile} title="Arrastrá la foto o tocá para elegir" hint={`JPG, PNG o WebP · hasta ${MAX_IMAGE_MB} MB · vertical, fondo limpio`} />
              {w.apiPhoto && <Button {...ghostBtn} {...smBtn} onClick={w.useApiPhoto}>Usar la de API-Football (150 px, baja calidad)</Button>}
            </>
          )}
          {photo.status === 'processing' && (
            <Flex direction="column" align="center" justify="center" gap={2.5} minH="220px" borderRadius="14px" border="1.5px dashed" borderColor="brand.brownDark" bg="#0f0c0a" aria-live="polite">
              <Spinner color="brand.orange" /><Text>Optimizando…</Text>
            </Flex>
          )}
          {photo.status === 'err' && (
            <>
              <Notice kind="err">{photo.error}</Notice>
              <Dropzone onFile={w.setPhotoFile} title="Elegir otro archivo" minH="120px" />
            </>
          )}
          {photo.status === 'ok' && (
            <Preview src={photo.preview} alt="Foto elegida">
              <Pill kind="ok" alignSelf="flex-start">Lista</Pill>
              <Text fontSize="14px" color="brand.gray">{photo.label}</Text>
              <Button {...ghostBtn} {...smBtn} alignSelf="flex-start" onClick={w.clearPhoto}>Cambiar</Button>
            </Preview>
          )}
        </Flex>

        <Flex direction="column" gap={2.5}>
          <Text {...lbl}>Escudo {club ? `de ${club.name}` : 'del club'}</Text>
          {!club && <EmptyBox><Text fontSize="14px">Primero cargá el club actual en el paso Datos.</Text></EmptyBox>}
          {club?.existing && (
            <Flex gap={3.5} align="center" p={4} borderRadius="14px" bg="#0f0c0a" border="1px solid #2a211b" minH="140px">
              <ClubCrest club={club.existing} size="72px" />
              <Flex direction="column" gap={1.5}><Pill kind="ok" alignSelf="flex-start">Ya está en el panel</Pill><Text fontSize="14px" color="brand.gray">Se usa el escudo que ya tiene el club.</Text></Flex>
            </Flex>
          )}
          {club && !club.existing && club.crest && (
            <Flex gap={3.5} align="center" p={4} borderRadius="14px" bg="#0f0c0a" border="1px solid #2a211b" minH="140px">
              <Image src={club.crest} alt="" boxSize="72px" objectFit="contain" />
              <Flex direction="column" gap={1.5}><Pill kind="api" alignSelf="flex-start">Desde API-Football</Pill><Text fontSize="14px" color="brand.gray">No hace falta subir nada.</Text></Flex>
            </Flex>
          )}
          {club && !club.existing && !club.crest && (
            <>
              {crest.status !== 'ok' && <Notice kind="warn">La API no tiene escudo para este club. Subilo una vez y queda para todos sus jugadores.</Notice>}
              {crest.status === 'err' && <Notice kind="err">{crest.error}</Notice>}
              {crest.status === 'processing' && <Flex justify="center" py={8}><Spinner color="brand.orange" /></Flex>}
              {(crest.status === 'empty' || crest.status === 'err') && (
                <Dropzone onFile={w.setCrestFile} title="Subir escudo" hint="PNG, WebP o SVG con fondo transparente · cuadrado" minH="150px"
                  accept="image/png,image/webp,image/svg+xml" />
              )}
              {crest.status === 'ok' && (
                <Preview src={crest.preview} alt="Escudo elegido" w="72px" h="72px" fit="contain">
                  <Pill kind="man" alignSelf="flex-start">Subido a mano</Pill>
                  <Button {...ghostBtn} {...smBtn} alignSelf="flex-start" onClick={w.clearCrest}>Cambiar</Button>
                </Preview>
              )}
            </>
          )}
        </Flex>
      </Box>
    </StepCard>
  )
}

// ── 4 · Links y slug ──
function UrlField({ label, value, onChange, placeholder, check }) {
  return (
    <Flex as="label" direction="column" gap={2}>
      <Text as="span" {...lbl}>{label} <Text as="span" textTransform="none" letterSpacing={0}>(opcional)</Text></Text>
      <Input {...fieldStyle} value={value} onChange={(e) => onChange(e.target.value.trim())} placeholder={placeholder} inputMode="url" isInvalid={check.bad} />
      <Text fontSize="13px" color={check.bad ? '#ff9a8a' : value ? '#7fe0a5' : '#8c7f70'}>{check.msg}</Text>
    </Flex>
  )
}

export function StepLinks({ w }) {
  const { landing, drive } = w.state
  const s = w.slugCheck
  return (
    <StepCard title="Links y clave" intro="Los links alimentan los botones Landing y Fotos del banner. Los dos son opcionales.">
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(min(100%, 300px), 1fr))" gap={5}>
        <UrlField label="Landing page" value={landing} onChange={(v) => w.set({ landing: v })} placeholder="https://nombre.netlify.app" check={w.landingCheck} />
        <UrlField label="Carpeta de fotos en Drive" value={drive} onChange={(v) => w.set({ drive: v })} placeholder="https://drive.google.com/drive/folders/…" check={w.driveCheck} />
      </Box>
      <Flex direction="column" gap={2.5} p={{ base: 4, md: 5 }} borderRadius="14px" bg="#0f0c0a" border="1px solid #2a211b">
        <Flex wrap="wrap" align="center" justify="space-between" gap={2}>
          <Text as="label" htmlFor="np-slug" {...lbl}>Slug · clave del jugador</Text>
          {w.slugEdited && <Button {...ghostBtn} {...smBtn} onClick={() => w.set({ slug: null })}>Volver al sugerido</Button>}
        </Flex>
        <Input id="np-slug" {...fieldStyle} {...monoField} value={w.slug} isInvalid={s.state === 'bad'} autoComplete="off" spellCheck={false}
          onChange={(e) => w.set({ slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })} />
        <Notice kind={s.state === 'bad' ? 'err' : s.state === 'warn' ? 'warn' : 'info'} py={2.5}>{s.message}</Notice>
        <Flex wrap="wrap" gap={2} fontSize="13px" color="brand.gray" align="center">
          <Text>Se usa en</Text><Code>players/{w.slug || '…'}</Code><Code>VITE_PLAYER_SLUG={w.slug || '…'}</Code>
        </Flex>
        <Text fontSize="13px" color="#8c7f70">Una vez creado no se cambia: es la ruta de sus partidos en Firestore y la variable de su landing.</Text>
      </Flex>
    </StepCard>
  )
}

// ── 5 · Acceso ──
export function StepAccess({ w }) {
  const { withAccount, pass, eye, copied, mustChange } = w.state
  return (
    <StepCard title="Usuario y contraseña" intro="Se crea una cuenta en Firebase Authentication. En Firestore solo queda el uid: la contraseña no se guarda en ningún lado.">
      <Checkbox colorScheme="orange" isChecked={withAccount} onChange={() => w.set({ withAccount: !withAccount })}>
        Crear la cuenta del jugador ahora
      </Checkbox>
      {withAccount ? (
        <>
          <Flex as="label" direction="column" gap={2}>
            <Text as="span" {...lbl}>Usuario</Text>
            <Input {...fieldStyle} {...monoField} value={w.username} isInvalid={w.usernameBad} autoComplete="off" spellCheck={false}
              onChange={(e) => w.set({ username: e.target.value.toLowerCase().replace(/\s+/g, '') })} />
            <Text fontSize="13px" color={w.usernameBad ? '#ff9a8a' : '#8c7f70'}>
              {w.usernameBad ? 'Entre 3 y 40 caracteres: letras, números, punto, guion o guion bajo. O un email completo.' : <>Entra con el usuario <b>{w.username}</b> (su cuenta es {w.email}).</>}
            </Text>
          </Flex>
          <Flex direction="column" gap={2}>
            <Text {...lbl}>Contraseña generada</Text>
            <Flex align="center" gap={1.5} pl={4} pr={1.5} h="56px" borderRadius="12px" border="1px solid" borderColor="brand.brownDark" bg="#151312">
              <Text flex={1} minW={0} fontFamily="ui-monospace, Menlo, monospace" fontSize={{ base: '15px', md: '19px' }} letterSpacing={{ base: 0, md: '0.06em' }} noOfLines={1}
                aria-label={eye ? undefined : 'Contraseña oculta'}>
                {eye ? pass : '••••••••••••••'}
              </Text>
              <IconButton variant="ghost" color="brand.amber" icon={eye ? <FiEyeOff /> : <FiEye />} aria-label={eye ? 'Ocultar' : 'Mostrar'} h="44px" minW="44px" onClick={() => w.set({ eye: !eye })} />
              <IconButton variant="ghost" color="brand.amber" icon={<FiRefreshCw />} aria-label="Generar otra" h="44px" minW="44px" onClick={w.regenerate} />
              <Button {...priBtn} {...smBtn} onClick={() => w.copy(pass, 'copied')}>{copied ? 'Copiada' : 'Copiar'}</Button>
            </Flex>
          </Flex>
          <Checkbox colorScheme="orange" isChecked={mustChange} onChange={() => w.set({ mustChange: !mustChange })}>Pedirle que la cambie en su primer ingreso</Checkbox>
          <Notice kind="warn">Copiala ahora o al final. Después de crear el jugador no se puede volver a ver: solo se puede generar una nueva.</Notice>
        </>
      ) : (
        <Notice>El jugador se crea sin cuenta de acceso: su ficha y su landing funcionan igual.</Notice>
      )}
    </StepCard>
  )
}
