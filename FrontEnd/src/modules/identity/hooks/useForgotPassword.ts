import { useState } from 'react'
import { forgotPassword as forgotService } from '../services/identity.service'
import { extractErrorMessage } from '../../../shared/utils/extractErrorMessage'

export function useForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const forgotPassword = async (email: string) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await forgotService({ email })
      // El backend siempre responde igual (no revela si el email existe)
      setSuccess(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return { forgotPassword, loading, error, success }
}
