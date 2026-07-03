import { useState } from 'react'
import { register as registerService, type RegisterPayload } from '../services/identity.service'
import { extractErrorMessage } from '../../../shared/utils/extractErrorMessage'

export function useRegister() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const register = async (payload: RegisterPayload) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await registerService(payload)
      setSuccess(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return { register, loading, error, success }
}
