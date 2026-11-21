import { useState } from 'react'
import {
  Box, Button, Flex, FormControl, FormLabel, Input, Text,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, useToast,
} from '@chakra-ui/react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuth, MIN_PASSWORD } from '../../lib/auth'
import BrandLogo from '../ui/BrandLogo'

// ─── CAMBIAR CONTRASEÑA ──────────────────────────────────────────
// El mismo formulario en dos lugares:
//   · ForcedPasswordChange: pantalla completa que ve un jugador en su
//     primer ingreso (o después de que un admin le restablece la
//     contraseña). Hasta cambiarla no ve su ficha.
//   · useChangePassword(): modal para cambiarla cuando quiera, desde el
//     menú de la cuenta o desde su ficha.
// La lógica (reauth + updatePassword) está en lib/auth.jsx.

const fieldStyle = {
  h: '48px', borderRadius: '10px', bg: '#151312', border: '1px solid', borderColor: 'brand.brownDark',
  color: 'white', fontSize: '16px', _placeholder: { color: '#8c7f70' }, _hover: { borderColor: 'brand.gray' },
  _focus: { borderColor: 'brand.orange', boxShadow: '0 0 0 3px rgba(249,160,63,.2)' },
}
const labelStyle = { fontFamily: 'mono', fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'brand.gray', mb: 2 }

function PasswordField({ label, value, onChange, show, autoComplete, autoFocus, hint, invalid }) {
  return (
    <FormControl isInvalid={invalid}>
      <FormLabel {...labelStyle}>{label}</FormLabel>
      <Input {...fieldStyle} type={show ? 'text' : 'password'} value={value} autoComplete={autoComplete} autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)} />
      {hint && <Text mt={1.5} fontSize="13px" color={invalid ? '#ff9a8a' : '#8c7f70'}>{hint}</Text>}
    </FormControl>
  )
}

export function ChangePasswordForm({ onDone, onCancel, submitLabel = 'Cambiar contraseña', cancelLabel = 'Cancelar' }) {
  const { user, changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const short = next.length > 0 && next.length < MIN_PASSWORD
  const mismatch = repeat.length > 0 && repeat !== next
  const ready = current && next.length >= MIN_PASSWORD && repeat === next

  const submit = async (e) => {
    e.preventDefault()
    if (!ready) return
    setBusy(true); setError(null)
    try {
      await changePassword(current, next)
      onDone?.()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Flex as="form" onSubmit={submit} direction="column" gap={4}>
      {/* Para que el gestor de contraseñas guarde la nueva con su usuario. */}
      <Input type="text" name="username" autoComplete="username" value={user?.email || ''} readOnly hidden />
      <PasswordField label="Contraseña actual" value={current} onChange={setCurrent} show={show} autoComplete="current-password" autoFocus />
      <PasswordField label="Contraseña nueva" value={next} onChange={setNext} show={show} autoComplete="new-password"
        invalid={short} hint={`Al menos ${MIN_PASSWORD} caracteres.`} />
      <PasswordField label="Repetí la nueva" value={repeat} onChange={setRepeat} show={show} autoComplete="new-password"
        invalid={mismatch} hint={mismatch ? 'No coincide con la nueva.' : null} />
      <Button type="button" variant="link" alignSelf="flex-start" color="brand.amber" fontSize="14px"
        leftIcon={show ? <FiEyeOff /> : <FiEye />} onClick={() => setShow((v) => !v)}>
        {show ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
      </Button>
      {error && (
        <Box role="alert" px={3.5} py={2.5} borderRadius="10px" bg="rgba(255,120,100,.1)" border="1px solid rgba(255,120,100,.4)" color="#ffb4a8" fontSize="14px">
          {error}
        </Box>
      )}
      <Flex gap={2.5} wrap="wrap">
        <Button type="submit" h="48px" flex="1 1 200px" borderRadius="10px" isLoading={busy} isDisabled={!ready}
          bg="brand.orange" color="brand.brown" _hover={{ bg: '#ffb35e' }} _active={{ bg: 'brand.orangeDark' }}
          fontFamily="mono" fontSize="15px" fontWeight="600" letterSpacing="0.12em" textTransform="uppercase">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" h="48px" variant="ghost" color="brand.gray" _hover={{ color: 'white', bg: 'brand.brownLight' }}
            onClick={onCancel} isDisabled={busy}>
            {cancelLabel}
          </Button>
        )}
      </Flex>
    </Flex>
  )
}

// Pantalla del primer ingreso. Puede salir (cerrar sesión), pero no
// entrar a la ficha sin cambiarla.
export function ForcedPasswordChange() {
  const { user, logout } = useAuth()
  const toast = useToast()
  return (
    <Flex minH="100vh" align="center" justify="center" bg="#0d0c0b" color="white" px={4} py={10}>
      <Box w="100%" maxW="420px" p={{ base: 5, md: 8 }} borderRadius="16px" bg="#151312" border="1px solid" borderColor="#2e2825">
        <BrandLogo height="36px" fontSize="3xl" />
        <Text as="h1" mt={4} fontFamily="heading" fontSize="38px" lineHeight={0.95}>Elegí tu contraseña</Text>
        <Text mt={2.5} mb={6} fontSize="15px" color="brand.gray">
          Es tu primer ingreso{user?.email ? <> como <b>{user.email.split('@')[0]}</b></> : ''}. Cambiá la contraseña que te pasó el equipo de LED Sports por una que sólo sepas vos.
        </Text>
        <ChangePasswordForm
          submitLabel="Guardar y entrar"
          onCancel={logout}
          cancelLabel="Salir"
          onDone={() => toast({ title: 'Listo, ya tenés tu contraseña nueva', status: 'success', duration: 4000 })}
        />
      </Box>
    </Flex>
  )
}

// Modal para cambiarla cuando quiera: { open, modal }.
export function useChangePassword() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const modal = (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: 'full', sm: 'md' }}>
      <ModalOverlay bg="rgba(0,0,0,.7)" />
      <ModalContent bg="#151312" color="white" border="1px solid" borderColor="#2e2825" borderRadius={{ base: 0, sm: '16px' }}>
        <ModalHeader fontFamily="heading" fontSize="30px" fontWeight="normal">Cambiar contraseña</ModalHeader>
        <ModalCloseButton color="brand.gray" />
        <ModalBody pb={6}>
          {isOpen && (
            <ChangePasswordForm
              onCancel={onClose}
              onDone={() => {
                onClose()
                toast({ title: 'Contraseña cambiada', status: 'success', duration: 4000 })
              }}
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
  return { open: onOpen, modal }
}

export function ChangePasswordButton(props) {
  const { open, modal } = useChangePassword()
  return (
    <>
      <Button onClick={open} {...props} />
      {modal}
    </>
  )
}
