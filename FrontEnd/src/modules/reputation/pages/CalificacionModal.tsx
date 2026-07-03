/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { reputationApi } from '../../publications/services/api'
import { useAuthStore } from '../../../store/authStore'
import { Star, X } from 'lucide-react'
import './CalificacionModal.css'

interface Props {
  transaccionId: string
  contraparte: string // nombre de quien se califica
  onClose: () => void
  onSuccess: () => void
}

export default function CalificacionModal({
  transaccionId,
  contraparte,
  onClose,
  onSuccess,
}: Props) {
  const [puntuacion, setPuntuacion] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { token: authToken } = useAuthStore()
  const token = authToken || ''

  const handleSubmit = async () => {
    if (puntuacion === 0) {
      setError('Selecciona una puntuación antes de enviar')
      return
    }
    try {
      setLoading(true)
      setError(null)
      await reputationApi.crearCalificacion(
        { transaccionId, puntuacion, comentario: comentario || undefined },
        token
      )
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Error al enviar calificación')
    } finally {
      setLoading(false)
    }
  }

  const displayStars = hovered || puntuacion

  return (
    <div className="cal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="cal-icon-wrap">
          <Star size={28} fill="#d97706" color="#d97706" />
        </div>
        <h2 className="cal-title">¿Cómo fue tu experiencia?</h2>
        <p className="cal-sub">
          Califica a <strong>{contraparte}</strong> por este intercambio
        </p>

        {/* Estrellas interactivas */}
        <div className="cal-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className="cal-star-btn"
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setPuntuacion(n)}
            >
              <Star
                size={36}
                fill={n <= displayStars ? '#d97706' : 'none'}
                color={n <= displayStars ? '#d97706' : '#d1d5db'}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
        <p className="cal-stars-label">
          {displayStars === 1 && 'Muy malo'}
          {displayStars === 2 && 'Malo'}
          {displayStars === 3 && 'Regular'}
          {displayStars === 4 && 'Bueno'}
          {displayStars === 5 && '¡Excelente!'}
          {displayStars === 0 && 'Selecciona una puntuación'}
        </p>

        <div className="cal-field">
          <label className="cal-label">Comentario (opcional)</label>
          <textarea
            className="cal-textarea"
            placeholder="Describe tu experiencia con este usuario..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <span className="cal-char-count">{comentario.length}/500</span>
        </div>

        {error && <div className="cal-error">{error}</div>}

        <div className="cal-actions">
          <button className="btn-secondary-sm" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-primary-sm" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar Calificación'}
          </button>
        </div>
      </div>
    </div>
  )
}
