import axios from 'axios'

/**
 * Cliente HTTP base para ReCircula.
 * - Prefija automáticamente /api/v1
 * - Adjunta el JWT desde localStorage en cada request
 * - Si el servidor devuelve 401, limpia la sesión local y redirige a /login
 */
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://recircula.onrender.com/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ── Request: Limpia cabeceras de autorización nulas si existen ────────────────
axiosClient.interceptors.request.use(
  (config) => {
    if (config.headers) {
      const auth = config.headers.Authorization
      if (
        typeof auth === 'string' &&
        (auth.includes('null') ||
          auth.includes('undefined') ||
          auth.includes('cookie') ||
          auth.trim() === 'Bearer')
      ) {
        delete config.headers.Authorization
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response: maneja 401 globalmente ─────────────────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rc_user')
      // Redirige sin depender de React Router (funciona fuera de componentes)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosClient
