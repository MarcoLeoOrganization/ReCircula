import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, type RolUsuario } from '../../../store/authStore'

interface ProtectedRouteProps {
  /** Si se omite, solo verifica que el usuario esté autenticado */
  allowedRoles?: RolUsuario[]
}

/**
 * Protege rutas por autenticación y opcionalmente por rol.
 *
 * Uso:
 *   <Route element={<ProtectedRoute />}>               ← cualquier usuario autenticado
 *   <Route element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']} />}>
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    // Autenticado pero sin el rol requerido → página de inicio según su rol
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
