import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  Box, Flex, Text, Input, InputGroup, InputRightElement, IconButton, Button, FormControl, FormLabel, Link, useToast,
} from '@chakra-ui/react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { motion, useReducedMotion } from 'framer-motion'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useAuth } from '../lib/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { useSplash } from '../components/ui/Splash'
import NotConfigured from '../components/ui/NotConfigured'
import BrandLogo from '../components/ui/BrandLogo'
import loginArt from '../assets/fondo_led.webp'

const MotionBox = motion(Box)

const fieldStyle = {
  h: '48px', borderRadius: '10px', bg: '#151312', border: '1px solid', borderColor: 'brand.brownDark',
  color: 'white', fontSize: '16px', _placeholder: { color: '#8c7f70' }, _hover: { borderColor: 'brand.gray' },
  _focus: { borderColor: 'brand.orange', boxShadow: '0 0 0 3px rgba(249,160,63,.2)' },
}
const labelStyle = { fontFamily: 'mono', fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'brand.gray', mb: 2 }

// ─── LOGIN ───────────────────────────────────────────────────────
// La imagen de LED Sports a la izquierda (arriba en el celular) y el
// formulario sobre fondo oscuro a la derecha, para que la frase no
// quede tapada. Al entrar se reproduce la pantalla de carga.
export default function LoginPage() {
  const { user, loading, login } = useAuth()
  const { play } = useSplash()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const location = useLocation()
  const toast = useToast()
  const reduceMotion = useReducedMotion()

  if (!isFirebaseConfigured) return <NotConfigured />

  // Ya logueado: volver a donde quería ir, o al inicio.
  if (user) return <Navigate to={location.state?.from || '/'} replace />

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ title: 'Completá email y contraseña', status: 'warning', duration: 3000 })
      return
    }
    setAuthLoading(true)
    try {
      await login(email, password)
      play()
    } catch (err) {
      toast({ title: 'No se pudo ingresar', description: err.message, status: 'error', duration: 4000 })
    }
    setAuthLoading(false)
  }

  const resetPassword = async () => {
    if (!email) {
      toast({ title: 'Escribí tu email arriba y volvé a tocar el enlace', status: 'info', duration: 4000 })
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      toast({ title: 'Te enviamos un email para cambiar la contraseña', status: 'success', duration: 5000 })
    } catch (err) {
      toast({ title: 'No se pudo enviar el email', description: err.message, status: 'error', duration: 5000 })
    }
  }

  return (
    <Flex minH="100vh" wrap="wrap" bg="#0d0c0b" color="white">
      <MotionBox
        role="img" aria-label="Los cagones no hacen historia · LED Sports"
        flex="3 1 560px" minH={{ base: '260px', md: '320px' }}
        bgImage={`url(${loginArt})`} bgSize="cover" bgPosition="center" bgRepeat="no-repeat"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />

      <Flex
        flex="2 1 380px" minW={0} align="center" justify="center"
        px={{ base: 5, md: 12, xl: 16 }} py={12}
        bg="#151312" borderLeft={{ md: '1px solid' }} borderColor="#2e2825"
      >
        <MotionBox
          as="form" onSubmit={handleLogin} w="100%" maxW="380px" display="flex" flexDirection="column" gap={5.5}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
        >
          <Box>
            <BrandLogo height="40px" fontSize="4xl" />
            <Text as="h1" mt={3} fontFamily="heading" fontSize="46px" lineHeight={0.95} letterSpacing="0.01em">
              Panel de administración
            </Text>
            <Text mt={2.5} fontSize="15px" color="brand.gray">
              Ingresá con tu cuenta del equipo para administrar las landings.
            </Text>
          </Box>

          <FormControl>
            <FormLabel {...labelStyle}>Email</FormLabel>
            <Input {...fieldStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ledsports.com" autoComplete="username" />
          </FormControl>

          <FormControl>
            <FormLabel {...labelStyle}>Contraseña</FormLabel>
            <InputGroup>
              <Input {...fieldStyle} pr="52px" type={showPw ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              <InputRightElement h="48px" w="48px">
                <IconButton
                  size="sm" variant="ghost" color="brand.gray" _hover={{ color: 'white', bg: 'brand.brownLight' }}
                  icon={showPw ? <FiEyeOff /> : <FiEye />}
                  aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPw((v) => !v)}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <Button
            type="submit" w="100%" h="50px" borderRadius="10px" isLoading={authLoading || loading}
            bg="brand.orange" color="brand.brown" _hover={{ bg: '#ffb35e' }} _active={{ bg: 'brand.orangeDark' }}
            fontFamily="mono" fontSize="16px" fontWeight="600" letterSpacing="0.14em" textTransform="uppercase"
          >
            Ingresar
          </Button>

          <Link as="button" type="button" onClick={resetPassword} alignSelf="center" color="brand.orange" fontSize="14px">
            ¿Olvidaste tu contraseña?
          </Link>
        </MotionBox>
      </Flex>
    </Flex>
  )
}
