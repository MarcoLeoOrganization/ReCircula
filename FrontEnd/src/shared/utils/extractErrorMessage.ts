import axios from 'axios'

/**
 * Extrae un mensaje de error legible desde respuestas de Axios/NestJS.
 *
 * NestJS puede devolver:
 *   { message: string }
 *   { message: string[] }   ← errores de class-validator
 *   { error: string }
 */
export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[]; error?: string } | undefined

    if (!data) return 'Error de conexión. Verifica tu red e intenta de nuevo.'

    if (Array.isArray(data.message)) return data.message[0]
    if (typeof data.message === 'string') return data.message
    if (typeof data.error === 'string') return data.error
  }

  if (err instanceof Error) return err.message

  return 'Ocurrió un error inesperado.'
}
