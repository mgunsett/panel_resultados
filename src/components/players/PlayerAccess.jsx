import { useEffect, useState } from 'react'
import { Box, Button, Flex, IconButton, Input, Spinner, Text } from '@chakra-ui/react'
import { FiEye, FiEyeOff, FiKey, FiRefreshCw, FiUserPlus } from 'react-icons/fi'
import { loginEmail, DEFAULT_LOGIN_DOMAIN, USERNAME_RE } from '../../lib/roster'
import { accountStatus, createAccount, resetAccountPassword, generatePassword } from '../../lib/newPlayer'
import { Notice, Code, priBtn, ghostBtn, smBtn, fieldStyle, monoField, lbl } from '../newPlayer/ui'

// ─── ACCESO AL PANEL ─────────────────────────────────────────────
// Sección de "Editar jugador" (sólo admin) para darle usuario y
// contraseña a un jugador que ya estaba cargado, o restablecerle la
// contraseña si ya tiene cuenta. No depende del botón Guardar: cada
// acción va directo a la función create-player (ver
// netlify/lib/playerAccounts.js). La contraseña se muestra una sola vez.

const LOGIN_DOMAIN = import.meta.env.VITE_PLAYER_LOGIN_DOMAIN || DEFAULT_LOGIN_DOMAIN
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

function PasswordBox({ pass, eye, onEye, onRegenerate }) {
  return (
    <Flex direction="column" gap={2}>
      <Text {...lbl}>Contraseña generada</Text>
      <Flex align="center" gap={1.5} pl={4} pr={1.5} h="52px" borderRadius="12px" border="1px solid" borderColor="brand.brownDark" bg="#151312">
        <Text flex={1} minW={0} fontFamily="ui-monospace, Menlo, monospace" fontSize="16px" noOfLines={1} aria-label={eye ? undefined : 'Contraseña oculta'}>
          {eye ? pass : '••••••••••••••'}
        </Text>
        <IconButton variant="ghost" color="brand.amber" icon={eye ? <FiEyeOff /> : <FiEye />} aria-label={eye ? 'Ocultar' : 'Mostrar'} h="44px" minW="44px" onClick={onEye} />
        <IconButton variant="ghost" color="brand.amber" icon={<FiRefreshCw />} aria-label="Generar otra" h="44px" minW="44px" onClick={onRegenerate} />
      </Flex>
    </Flex>
  )
}

export default function PlayerAccess({ player, isOpen }) {
  const [st, setSt] = useState({ status: 'loading' })
  const [mode, setMode] = useState(null) // null | 'create' | 'reset'
  const [username, setUsername] = useState('')
  const [pass, setPass] = useState('')
  const [eye, setEye] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [creds, setCreds] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen || !player?.slug) return undefined
    let alive = true
    setSt({ status: 'loading' }); setMode(null); setErr(null); setCreds(null); setCopied(false)
    setUsername(player.slug); setPass(generatePassword()); setEye(true)
    accountStatus(player.slug)
      .then((info) => alive && setSt({ status: info.hasAccount ? 'has' : 'none', info }))
      .catch((e) => alive && setSt({ status: 'err', error: e.message }))
    return () => { alive = false }
  }, [isOpen, player?.slug])

  const usernameBad = !(username.includes('@') ? EMAIL_RE.test(username) : USERNAME_RE.test(username))
  const email = loginEmail(username, LOGIN_DOMAIN)
  const start = (m) => { setMode(m); setErr(null); setPass(generatePassword()); setEye(true) }

  const run = async () => {
    setBusy(true); setErr(null)
    try {
      const info = mode === 'create'
        ? await createAccount(player.slug, { username, password: pass })
        : await resetAccountPassword(player.slug, pass)
      setCreds({ email: info.email, password: pass, kind: mode })
      setSt({ status: 'has', info })
      setMode(null); setCopied(false)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const copy = () => {
    navigator.clipboard?.writeText(`Usuario: ${creds.email}\nContraseña: ${creds.password}`)
      .then(() => setCopied(true)).catch(() => setCopied(false))
  }

  if (st.status === 'loading') {
    return <Flex align="center" gap={2} color="brand.gray" minH="44px"><Spinner size="sm" color="brand.orange" />Revisando si ya tiene cuenta…</Flex>
  }
  if (st.status === 'err') {
    return <Notice kind="err" py={2}>No se pudo ver su cuenta: {st.error}</Notice>
  }

  if (creds) {
    return (
      <Flex direction="column" gap={2.5} p={4} borderRadius="14px" bg="#0f0c0a" border="1px solid rgba(249,160,63,.4)">
        <Text {...lbl} color="brand.orange">
          {creds.kind === 'create' ? 'Cuenta creada' : 'Contraseña nueva'} · se muestra esta única vez
        </Text>
        <Box display="grid" gridTemplateColumns="96px minmax(0,1fr)" gap="8px 12px" fontSize="15px" alignItems="center">
          <Text color="brand.gray">Usuario</Text><Code justifySelf="start" wordBreak="break-all">{creds.email}</Code>
          <Text color="brand.gray">Contraseña</Text><Code justifySelf="start" wordBreak="break-all">{creds.password}</Code>
        </Box>
        <Text fontSize="13px" color="#8c7f70">Copiala antes de cerrar este panel: después no se puede volver a ver, sólo restablecer.</Text>
        <Flex gap={2} wrap="wrap">
          <Button {...priBtn} {...smBtn} onClick={copy}>{copied ? 'Copiado' : 'Copiar usuario y contraseña'}</Button>
          <Button {...ghostBtn} {...smBtn} onClick={() => setCreds(null)}>Listo</Button>
        </Flex>
      </Flex>
    )
  }

  const info = st.info || {}

  if (st.status === 'none' && mode !== 'create') {
    return (
      <Flex direction="column" gap={2.5}>
        <Text fontSize="14px" color="brand.gray">Todavía no tiene usuario para entrar al panel. Con una cuenta ve sólo su ficha, en modo lectura.</Text>
        {info.enabled === false && <Notice kind="warn" py={2}>Las cuentas están apagadas: falta PLAYER_ACCOUNTS_ENABLED=true en Netlify.</Notice>}
        <Button {...ghostBtn} {...smBtn} leftIcon={<FiUserPlus />} alignSelf="flex-start" onClick={() => start('create')}>Crear acceso</Button>
      </Flex>
    )
  }

  if (mode === 'create') {
    return (
      <Flex direction="column" gap={3}>
        <Flex as="label" direction="column" gap={1.5}>
          <Text as="span" {...lbl}>Usuario</Text>
          <Input {...fieldStyle} {...monoField} h="44px" value={username} isInvalid={usernameBad} autoComplete="off" spellCheck={false}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))} />
          <Text fontSize="13px" color={usernameBad ? '#ff9a8a' : '#8c7f70'}>
            {usernameBad ? 'Entre 3 y 40 caracteres: letras, números, punto, guion o guion bajo. O un email completo.' : <>Entra con <b>{email}</b>.</>}
          </Text>
        </Flex>
        <PasswordBox pass={pass} eye={eye} onEye={() => setEye(!eye)} onRegenerate={() => setPass(generatePassword())} />
        {err && <Notice kind="err" py={2}>{err}</Notice>}
        <Flex gap={2} wrap="wrap">
          <Button {...priBtn} {...smBtn} onClick={run} isLoading={busy} loadingText="Creando" isDisabled={usernameBad}>Crear cuenta</Button>
          <Button {...ghostBtn} {...smBtn} onClick={() => setMode(null)} isDisabled={busy}>Cancelar</Button>
        </Flex>
      </Flex>
    )
  }

  // Ya tiene cuenta.
  return (
    <Flex direction="column" gap={3}>
      <Flex direction="column" gap={1.5}>
        <Text {...lbl}>Usuario</Text>
        <Code alignSelf="flex-start" wordBreak="break-all">{info.email}</Code>
        <Text fontSize="13px" color="#8c7f70">
          {info.createdAt ? `Cuenta creada el ${fmtDate(info.createdAt)}.` : 'Tiene cuenta.'}
          {info.passwordResetAt ? ` Contraseña restablecida el ${fmtDate(info.passwordResetAt)}.` : ''}
          {info.disabled ? ' La cuenta está deshabilitada en Firebase: restablecer la contraseña la vuelve a habilitar.' : ''}
        </Text>
      </Flex>
      {mode === 'reset' ? (
        <>
          <PasswordBox pass={pass} eye={eye} onEye={() => setEye(!eye)} onRegenerate={() => setPass(generatePassword())} />
          <Notice kind="warn" py={2}>La contraseña de antes deja de andar y se cierran las sesiones que tenga abiertas.</Notice>
          {err && <Notice kind="err" py={2}>{err}</Notice>}
          <Flex gap={2} wrap="wrap">
            <Button {...priBtn} {...smBtn} onClick={run} isLoading={busy} loadingText="Restableciendo">Poner esta contraseña</Button>
            <Button {...ghostBtn} {...smBtn} onClick={() => setMode(null)} isDisabled={busy}>Cancelar</Button>
          </Flex>
        </>
      ) : (
        <Button {...ghostBtn} {...smBtn} leftIcon={<FiKey />} alignSelf="flex-start" onClick={() => start('reset')}>Restablecer contraseña</Button>
      )}
    </Flex>
  )
}
