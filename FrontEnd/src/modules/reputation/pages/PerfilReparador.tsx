/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { reputationApi } from '../../publications/services/api'
import { useAuthStore } from '../../../store/authStore'
import { Star, Wrench, CheckCircle, ArrowLeft, Upload, ChevronRight } from 'lucide-react'
import './PerfilReparador.css'

interface Props {
  reparadorId: string
  onBack: () => void
  onSolicitarVerificacion: () => void
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="prf-stars-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={18}
          fill={n <= Math.round(value) ? '#d97706' : 'none'}
          color={n <= Math.round(value) ? '#d97706' : '#d1d5db'}
          strokeWidth={1.5}
        />
      ))}
      <span className="prf-rating-num">{Number(value).toFixed(1)}</span>
    </div>
  )
}

export default function PerfilReparador({ reparadorId, onBack, onSolicitarVerificacion }: Props) {
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuthStore()
  const userRol = user?.rol || ''

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        setLoading(true)
        const data = await reputationApi.getPerfilReparador(reparadorId)
        setPerfil(data)
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar el perfil')
      } finally {
        setLoading(false)
      }
    }
    fetchPerfil()
  }, [reparadorId])

  if (loading) {
    return (
      <div className="prf-container">
        <div className="prf-loading">Cargando perfil del reparador...</div>
      </div>
    )
  }

  if (error || !perfil) {
    return (
      <div className="prf-container">
        <button className="prf-back" onClick={onBack}>
          <ArrowLeft size={18} /> Volver
        </button>
        <div className="prf-error">{error || 'Perfil no disponible'}</div>
      </div>
    )
  }

  return (
    <div className="prf-container">
      <button className="prf-back" onClick={onBack}>
        <ArrowLeft size={18} /> Volver a Reparadores
      </button>

      {/* Hero del perfil */}
      <div className="prf-hero">
        <div className="prf-avatar">
          {perfil.nombre?.charAt(0).toUpperCase()}
        </div>
        <div className="prf-hero-info">
          <div className="prf-verified-badge">
            <CheckCircle size={14} /> Reparador Verificado
          </div>
          <h1 className="prf-name">{perfil.nombreTaller || perfil.nombre}</h1>
          <p className="prf-tech-name">Técnico: {perfil.nombre}</p>
          <StarRating value={perfil.puntuacion || 0} />
        </div>
      </div>

      {/* Stats */}
      <div className="prf-stats-grid">
        <div className="prf-stat-card">
          <span className="prf-stat-num">{Number(perfil.puntuacion || 0).toFixed(1)}</span>
          <span className="prf-stat-label">Puntuación</span>
        </div>
        <div className="prf-stat-card">
          <span className="prf-stat-num">{perfil.reparacionesDocumentadas || 0}</span>
          <span className="prf-stat-label">Reparaciones</span>
        </div>
        <div className="prf-stat-card">
          <span className="prf-stat-num">{perfil.calificaciones?.length || 0}</span>
          <span className="prf-stat-label">Reseñas</span>
        </div>
      </div>

      {/* Especialidades */}
      {perfil.especialidades?.length > 0 && (
        <div className="prf-section">
          <h3 className="prf-section-title">
            <Wrench size={16} /> Especialidades
          </h3>
          <div className="prf-tags">
            {perfil.especialidades.map((esp: string, i: number) => (
              <span key={i} className="prf-tag">{esp}</span>
            ))}
          </div>
        </div>
      )}

      {/* Calificaciones recientes */}
      <div className="prf-section">
        <h3 className="prf-section-title">
          <Star size={16} fill="#d97706" color="#d97706" /> Reseñas de usuarios
        </h3>
        {perfil.calificaciones?.length === 0 ? (
          <p className="prf-no-reviews">Aún no hay reseñas para este reparador.</p>
        ) : (
          <div className="prf-reviews-list">
            {perfil.calificaciones?.map((cal: any) => (
              <div key={cal.id} className="prf-review-card">
                <div className="prf-review-header">
                  <div className="prf-review-user">
                    <div className="prf-review-avatar">
                      {cal.calificador?.nombre?.charAt(0) || '?'}
                    </div>
                    <span className="prf-review-name">{cal.calificador?.nombre || 'Usuario'}</span>
                  </div>
                  <div className="prf-review-stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        fill={n <= cal.puntuacion ? '#d97706' : 'none'}
                        color={n <= cal.puntuacion ? '#d97706' : '#d1d5db'}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                </div>
                {cal.comentario && (
                  <p className="prf-review-comment">"{cal.comentario}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA para VENDEDOR_REPARADOR */}
      {userRol === 'REPARADOR_VERIFICADO' && (
        <div className="prf-cta-banner">
          <div className="prf-cta-text">
            <Upload size={18} />
            <div>
              <strong>¿Eres un reparador?</strong>
              <p>Solicita tu verificación adjuntando evidencias de reparaciones previas y gana mayor visibilidad.</p>
            </div>
          </div>
          <button className="btn-primary-sm" onClick={onSolicitarVerificacion}>
            Solicitar Verificación <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
