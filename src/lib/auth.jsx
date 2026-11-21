import { createContext, useContext, useEffect, useState } from 'react'
import {
  EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updatePassword,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'
import { loginEmail, DEFAULT_LOGIN_DOMAIN } from './roster'

// ─── AUTH Y ROLES ────────────────────────────────────────────────
// Dos tipos de cuenta, según el custom claim `role` de Firebase Auth
// (lo ponen las funciones de Netlify, ver netlify/lib/roles.js):
//   admin   equipo de LED Sports: todo el panel
//   player  un jugador (claim `slug`): sólo su ficha, en lectura
// Una cuenta sin rol (los admins de antes) le pregunta a la función
// session-role, que le pone role: 'admin' si su email está en
// la colección panelAdmins de Firestore. Si la cuenta no tiene acceso
// se la desloguea.
//
// Esto es la puerta de la interfaz. Lo que de verdad impide que un
// jugador escriba son las reglas de Firestore y Storage
// (firebase/*.rules) y las funciones, que sólo atienden admins.

export const ROLE_ADMIN = 'admin'
export const ROLE_PLAYER = 'player'

// Los jugadores entran con su usuario solo (nicolas_fernandez): el
// panel le agrega este dominio. Con un @ (los admins) va tal cual.
export const LOGIN_DOMAIN = import.meta.env.VITE_PLAYER_LOGIN_DOMAIN || DEFAULT_LOGIN_DOMAIN
export const toLoginEmail = (text) => loginEmail(text, LOGIN_DOMAIN)
export const MIN_PASSWORD = 10

const NO_ACCESS = 'Esta cuenta no tiene acceso al panel. Pedile al equipo de LED Sports que la habilite.'

class AccessError extends Error {}

const callSessionRole = async (u, body) => fetch('/.netlify/functions/session-role', {
  method: 'POST',
  headers: { Authorization: `Bearer ${await u.getIdToken()}`, 'content-type': 'application/json' },
  body: JSON.stringify(body || {}),
})

async function askServerRole(u) {
  let res
  try {
    res = await callSessionRole(u)
  } catch {
    res = null
  }
  // Sin la función (pnpm dev sin `netlify dev`, o Netlify caído) se
  // sigue como admin, igual que antes de los roles: Firestore y las
  // funciones igual exigen el rol real.
  if (!res || res.status === 404) {
    console.warn('session-role no respondió: se sigue como admin sin rol asignado.')
    return { role: ROLE_ADMIN, legacy: true }
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 || res.status === 403) throw new AccessError(data.error || NO_ACCESS)
  if (!res.ok) return { role: ROLE_ADMIN, legacy: true }
  // El claim nuevo recién viaja en un token nuevo.
  if (data.refreshed) await u.getIdToken(true)
  return data
}

// { role, slug } de una cuenta, o AccessError si no puede entrar.
async function resolveAccess(u) {
  const { claims } = await u.getIdTokenResult()
  if (claims.role === ROLE_PLAYER) {
    if (!claims.slug) throw new AccessError(NO_ACCESS)
    return { role: ROLE_PLAYER, slug: claims.slug, mustChangePassword: claims.mustChangePassword === true }
  }
  if (claims.role === ROLE_ADMIN) return { role: ROLE_ADMIN, slug: null }
  if (claims.role) throw new AccessError(NO_ACCESS)
  const data = await askServerRole(u)
  if (data.role === ROLE_PLAYER && data.slug) return { role: ROLE_PLAYER, slug: data.slug }
  if (data.role === ROLE_ADMIN) return { role: ROLE_ADMIN, slug: null }
  throw new AccessError(NO_ACCESS)
}

// Una sola verificación por cuenta: la piden a la vez login() y
// onAuthStateChanged.
const checks = new Map()
function checkAccess(u) {
  if (!checks.has(u.uid)) {
    const p = resolveAccess(u)
    p.catch(() => checks.delete(u.uid))
    checks.set(u.uid, p)
  }
  return checks.get(u.uid)
}

// Mensajes de Firebase Auth en castellano.
const AUTH_ERRORS = {
  'auth/invalid-credential': 'Usuario o contraseña incorrectos.',
  'auth/wrong-password': 'Usuario o contraseña incorrectos.',
  'auth/user-not-found': 'Usuario o contraseña incorrectos.',
  'auth/invalid-email': 'Ese usuario no es válido.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada. Hablá con el equipo de LED Sports.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos y probá de nuevo.',
  'auth/network-request-failed': 'No hay conexión. Revisá internet y probá de nuevo.',
  'auth/weak-password': `La contraseña nueva tiene que tener al menos ${MIN_PASSWORD} caracteres.`,
  'auth/requires-recent-login': 'Volvé a escribir tu contraseña actual.',
}
const authMessage = (err, fallback) => AUTH_ERRORS[err?.code] || err?.message || fallback

const EMPTY = { user: null, role: null, playerSlug: null, mustChangePassword: false }

const AuthContext = createContext({ ...EMPTY, isAdmin: false, isPlayer: false, loading: true })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setSession(EMPTY)
        setLoading(false)
        return
      }
      setLoading(true)
      checkAccess(currentUser)
        .then(({ role, slug, mustChangePassword }) => setSession({ user: currentUser, role, playerSlug: slug, mustChangePassword: Boolean(mustChangePassword) }))
        .catch(async (err) => {
          if (!(err instanceof AccessError)) console.error('No se pudo leer el rol de la cuenta:', err)
          setSession(EMPTY)
          await signOut(auth)
        })
        .finally(() => setLoading(false))
    })
    return () => unsubscribe()
  }, [])

  // `text` es el usuario del jugador o el email completo de un admin.
  const login = async (text, password) => {
    let cred
    try {
      cred = await signInWithEmailAndPassword(auth, toLoginEmail(text), password)
    } catch (err) {
      throw new Error(authMessage(err, 'No se pudo ingresar.'))
    }
    try {
      await checkAccess(cred.user)
    } catch (err) {
      throw err instanceof AccessError ? err : new Error(NO_ACCESS)
    }
    return cred
  }
  // Cambio de contraseña desde el panel: Firebase pide reautenticar con
  // la actual antes de updatePassword. Si era el cambio obligatorio del
  // primer ingreso, la función session-role le saca el claim.
  const changePassword = async (current, next) => {
    const u = auth.currentUser
    if (!u?.email) throw new Error('No hay sesión iniciada.')
    if (next.length < MIN_PASSWORD) throw new Error(AUTH_ERRORS['auth/weak-password'])
    if (next === current) throw new Error('La contraseña nueva tiene que ser distinta de la actual.')
    try {
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, current))
    } catch (err) {
      const bad = ['auth/invalid-credential', 'auth/wrong-password'].includes(err?.code)
      throw new Error(bad ? 'La contraseña actual no es correcta.' : authMessage(err, 'No se pudo verificar tu contraseña.'))
    }
    try {
      await updatePassword(u, next)
    } catch (err) {
      throw new Error(authMessage(err, 'No se pudo cambiar la contraseña.'))
    }
    if (session.role !== ROLE_PLAYER || !session.mustChangePassword) return
    let res = null
    try {
      res = await callSessionRole(u, { action: 'password-changed' })
    } catch {
      res = null
    }
    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}))
      throw new Error(`Tu contraseña ya cambió, pero no se pudo terminar de guardar (${data?.error || 'sin conexión con el panel'}). Probá de nuevo usando la nueva como actual.`)
    }
    await u.getIdToken(true)
    checks.delete(u.uid)
    setSession((s) => ({ ...s, mustChangePassword: false }))
  }

  const logout = () => {
    checks.clear()
    return signOut(auth)
  }

  const value = {
    ...session,
    isAdmin: session.role === ROLE_ADMIN,
    isPlayer: session.role === ROLE_PLAYER,
    loading,
    login,
    logout,
    changePassword,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
