import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'

// ─── AUTH ────────────────────────────────────────────────────────
// Gate único para toda la app: un solo admin con acceso a todos los
// jugadores. Mismo patrón que el AdminPage de las landings, pero
// elevado a contexto para que lo consuman las rutas protegidas.
//
// Las cuentas de jugador (las crea /jugadores/nuevo) llevan el claim
// role: 'player' y no pueden usar el panel: si alguna inicia sesión acá
// se la desloguea en el momento.

const isPlayerAccount = async (u) => (await u.getIdTokenResult()).claims.role === 'player'
const PLAYER_ERROR = 'Esta es una cuenta de jugador: sirve para su landing, no para el panel.'

const AuthContext = createContext({ user: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && (await isPlayerAccount(currentUser).catch(() => false))) {
        await signOut(auth)
        return
      }
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    if (await isPlayerAccount(cred.user)) {
      await signOut(auth)
      throw new Error(PLAYER_ERROR)
    }
    return cred
  }
  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
