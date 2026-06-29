import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '../modules/identity/components/ProtectedRoute'

import App from '../App'

// Páginas de identidad
import { LoginPage } from '../modules/identity/pages/LoginPage'
import { RegisterPage } from '../modules/identity/pages/RegisterPage'
import { VerifyEmailPage } from '../modules/identity/pages/Verifyemailpage'
import { ForgotPasswordPage } from '../modules/identity/pages/Forgotpasswordpage'
import { ResetPasswordPage } from '../modules/identity/pages/Resetpasswordpage'

/**
 * AppRouter — Árbol de rutas de ReCircula.
 *
 * Rutas públicas:   /login, /register, /verify-email, /forgot-password, /reset-password
 * Rutas privadas:   /  (cualquier rol autenticado)
 * Rutas por rol:    /admin/dashboard, /reparador/perfil
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Rutas públicas ────────────────────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ── Rutas privadas: cualquier usuario autenticado ─────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<App />} />
        </Route>

        {/* ── Rutas privadas: solo ADMINISTRADOR ─────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']} />}>
          <Route path="/admin/dashboard" element={<div>Panel Admin</div>} />
        </Route>

        {/* ── Rutas privadas: REPARADOR_VERIFICADO o ADMINISTRADOR ─────── */}
        <Route
          element={<ProtectedRoute allowedRoles={['REPARADOR_VERIFICADO', 'ADMINISTRADOR']} />}
        >
          <Route path="/reparador/perfil" element={<div>Panel Reparador</div>} />
        </Route>

        {/* ── Fallback ──────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
