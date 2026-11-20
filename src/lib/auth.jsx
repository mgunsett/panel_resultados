import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'

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

const NO_ACCESS = 'Esta cuenta no tiene acceso al panel. Pedile al equipo de LED Sports que la habilite.'

class AccessError extends Error {}

async function askServerRole(u) {
  let res
  try {
    res = await fetch('/.netlify/functions/session-role', {
      method: 'POST',
      headers: { Authorization: `Bearer ${await u.getIdToken()}` },
    })
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
    return { role: ROLE_PLAYER, slug: claims.slug }
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

const AuthContext = createContext({ user: null, role: null, playerSlug: null, isAdmin: false, isPlayer: false, loading: true })

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ user: null, role: null, playerSlug: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setSession({ user: null, role: null, playerSlug: null })
        setLoading(false)
        return
      }
      setLoading(true)
      checkAccess(currentUser)
        .then(({ role, slug }) => setSession({ user: currentUser, role, playerSlug: slug }))
        .catch(async (err) => {
          if (!(err instanceof AccessError)) console.error('No se pudo leer el rol de la cuenta:', err)
          setSession({ user: null, role: null, playerSlug: null })
          await signOut(auth)
        })
        .finally(() => setLoading(false))
    })
    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    try {
      await checkAccess(cred.user)
    } catch (err) {
      throw err instanceof AccessError ? err : new Error(NO_ACCESS)
    }
    return cred
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
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
