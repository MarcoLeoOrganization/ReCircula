import axiosClient from '../../../shared/api/axiosClient';
import type { AuthUser } from '../../../store/authStore';

// ── Tipos de request ──────────────────────────────────────────────────────────

export interface RegisterPayload {
  nombre: string;
  email: string;
  password: string;
  rol: 'USUARIO_GENERAL' | 'REPARADOR_VERIFICADO';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  nuevaPassword: string;
}

// ── Tipos de response ─────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  usuario: AuthUser;
}

export interface MessageResponse {
  mensaje: string;
}

// ── Llamadas al backend ───────────────────────────────────────────────────────

/** RF-01.1 — Registro: crea cuenta inactiva y envía correo de verificación */
export const register = (payload: RegisterPayload) =>
  axiosClient
    .post<MessageResponse>('/identity/register', payload)
    .then((r) => r.data);

/** RF-01.1 — Reenviar enlace de verificación de email */
export const resendVerification = (email: string) =>
  axiosClient
    .post<MessageResponse>('/identity/resend-verification', { email })
    .then((r) => r.data);

/** RF-01.1 — Verificar email desde el token del enlace */
export const verifyEmail = (token: string) =>
  axiosClient
    .get<MessageResponse>('/identity/verify-email', { params: { token } })
    .then((r) => r.data);

/** RF-01.2 — Login: devuelve usuario y JWT */
export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const data = await axiosClient
    .post<{ usuario: AuthUser; token: string }>('/identity/login', payload)
    .then((r) => r.data);
  // El backend devuelve { usuario, token } — lo normalizamos a { usuario, accessToken }
  return { usuario: data.usuario, accessToken: data.token };
};

/** RF-01.3 — Solicitar enlace de recuperación de contraseña */
export const forgotPassword = (payload: ForgotPasswordPayload) =>
  axiosClient
    .post<MessageResponse>('/identity/forgot-password', payload)
    .then((r) => r.data);

/** RF-01.3 — Restablecer contraseña con token del correo */
export const resetPassword = (payload: ResetPasswordPayload) =>
  axiosClient
    .post<MessageResponse>('/identity/reset-password', payload)
    .then((r) => r.data);

/** RF-01.5 — Logout: invalida el JWT activo en BD */
export const logout = () =>
  axiosClient
    .post<MessageResponse>('/identity/logout')
    .then((r) => r.data);

/** RF-01.4 — Datos del usuario autenticado */
export const getMe = () =>
  axiosClient.get<AuthUser>('/identity/me').then((r) => r.data);