import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  Box, VStack, Text, Input, Button, FormControl, FormLabel, Spinner, useToast,
} from '@chakra-ui/react'
import { useAuth } from '../lib/auth'
import { isFirebaseConfigured } from '../lib/firebase'
import { labelStyle, inputStyle } from '../components/ui/formStyles'
import NotConfigured from '../components/ui/NotConfigured'
import BrandLogo from '../components/ui/BrandLogo'

export default function LoginPage() {
  const { user, loading, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const location = useLocation()
  const toast = useToast()

  if (!isFirebaseConfigured) return <NotConfigured />

  if (loading) {
    return (
      <Box minH="100vh" bg="brand.dark" display="flex" alignItems="center" justifyContent="center">
        <Spinner color="brand.amber" size="lg" />
      </Box>
    )
  }

  // Ya logueado: volver a donde quería ir, o a la grilla.
  if (user) {
    return <Navigate to={location.state?.from || '/'} replace />
  }

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: 'Completá email y contraseña', status: 'warning', duration: 3000 })
      return
    }
    setAuthLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      toast({ title: err.message, status: 'error', duration: 4000 })
    }
    setAuthLoading(false)
  }

  return (
    <Box minH="100vh" bg="brand.dark" display="flex" alignItems="center" justifyContent="center" px={4}>
      <Box
        w="full" maxW="380px"
        bg="brand.dark"
        border="1px solid"
        borderColor="brand.brownDark"
        borderRadius="xl"
        p={{ base: 6, md: 8 }}
      >
        <VStack spacing={3} mb={6} align="stretch">
          <BrandLogo height="34px" fontSize="2xl" />
          <Text fontFamily="mono" fontSize="10px" color="brand.gray"
                letterSpacing="widest" textTransform="uppercase">
            Panel central · carga de partidos
          </Text>
        </VStack>

        <VStack spacing={4}>
          <FormControl>
            <FormLabel {...labelStyle}>Email</FormLabel>
            <Input
              {...inputStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              autoComplete="username"
            />
          </FormControl>
          <FormControl>
            <FormLabel {...labelStyle}>Contraseña</FormLabel>
            <Input
              {...inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              autoComplete="current-password"
            />
          </FormControl>
          <Button
            w="full" bg="brand.amber" color="brand.brown" h="44px"
            fontFamily="mono" fontSize="sm" letterSpacing="widest" textTransform="uppercase"
            borderRadius="md"
            _hover={{ bg: 'brand.orange', color: 'white' }}
            _active={{ bg: 'brand.orangeDark' }}
            isLoading={authLoading}
            onClick={handleLogin}
          >
            Ingresar
          </Button>
        </VStack>
      </Box>
    </Box>
  )
}
