import axios from 'axios'

/**
 * Cliente HTTP base para ReCircula.
 * - Prefija automáticamente /api/v1
 * - Adjunta el JWT desde localStorage en cada request
 * - Si el servidor devuelve 401, limpia la sesión local y redirige a /login
 */
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request: inyecta el Bearer token si existe ────────────────────────────────
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rc_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response: maneja 401 globalmente ─────────────────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rc_token')
      localStorage.removeItem('rc_user')
      // Redirige sin depender de React Router (funciona fuera de componentes)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosClient
