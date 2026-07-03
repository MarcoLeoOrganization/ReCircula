import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  resetPassword as resetService,
  type ResetPasswordPayload,
} from '../services/identity.service'
import { extractErrorMessage } from '../../../shared/utils/extractErrorMessage'

export function useResetPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const resetPassword = async (payload: ResetPasswordPayload) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await resetService(payload)
      setSuccess(true)
      // Redirige a login luego de 2 s para que el usuario lea la confirmación
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return { resetPassword, loading, error, success }
}
