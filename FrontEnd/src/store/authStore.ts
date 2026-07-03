import { create } from 'zustand'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type RolUsuario = 'USUARIO_GENERAL' | 'REPARADOR_VERIFICADO' | 'ADMINISTRADOR'

export interface AuthUser {
  id: string
  email: string
  nombre: string
  rol: RolUsuario
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean

  /** Guarda sesión en memoria y en localStorage */
  setSession: (user: AuthUser, token: string) => void

  /** Limpia sesión de memoria y localStorage */
  clearSession: () => void
}

// ── Helpers para persistencia ─────────────────────────────────────────────────

const loadUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem('rc_user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

const loadToken = (): string | null => localStorage.getItem('rc_token')

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  user: loadUser(),
  token: loadToken(),
  isAuthenticated: Boolean(loadToken()),

  setSession: (user, token) => {
    localStorage.setItem('rc_token', token)
    localStorage.setItem('rc_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  clearSession: () => {
    localStorage.removeItem('rc_token')
    localStorage.removeItem('rc_user')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
