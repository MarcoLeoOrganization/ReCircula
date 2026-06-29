/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import { publicationsApi } from '../services/api'
import { useAuthStore } from '../../../store/authStore'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  RefreshCw,
  MessageSquare,
  Star,
} from 'lucide-react'
import CalificacionModal from '../../reputation/pages/CalificacionModal'
import './TransactionsDashboard.css'

export default function TransactionsDashboard() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [calModal, setCalModal] = useState<{ txId: string; contraparte: string } | null>(null)

  const { token: authToken, user } = useAuthStore()
  const token = authToken || ''
  const currentUserId = user?.id || ''

  const fetchTransactions = useCallback(async () => {
    if (!token) {
      setError('No has iniciado sesión')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await publicationsApi.getTransactions(token)
      setTransactions(data)
    } catch (err: any) {
      setError(err.message || 'Error al obtener tratos')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions()
  }, [fetchTransactions])

  const handleAccept = async (id: string) => {
    try {
      setProcessingId(id)
      await publicationsApi.acceptTransaction(id, token)
      alert('Trato aceptado con éxito. El artículo ha sido reservado.')
      fetchTransactions()
    } catch (err: any) {
      alert(err.message || 'Error al aceptar el trato')
    } finally {
      setProcessingId(null)
    }
  }

  const handleCancel = async (id: string) => {
    const notas = prompt('Escribe el motivo de la cancelación:')
    if (notas === null) return // cancel clicked on prompt

    try {
      setProcessingId(id)
      await publicationsApi.cancelTransaction(id, notas || 'Trato cancelado', token)
      alert('Trato cancelado.')
      fetchTransactions()
    } catch (err: any) {
      alert(err.message || 'Error al cancelar el trato')
    } finally {
      setProcessingId(null)
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      setProcessingId(id)
      await publicationsApi.confirmTransaction(id, token)
      alert('Confirmación registrada con éxito.')
      fetchTransactions()
    } catch (err: any) {
      alert(err.message || 'Error al confirmar trato')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDIENTE':
        return (
          <span className="status-badge pending">
            <Clock size={12} /> Pendiente
          </span>
        )
      case 'EN_PROCESO':
        return (
          <span className="status-badge in-progress">
            <RefreshCw size={12} className="spin" /> En Proceso
          </span>
        )
      case 'COMPLETADA':
        return (
          <span className="status-badge completed">
            <CheckCircle size={12} /> Completada
          </span>
        )
      case 'CANCELADA':
        return (
          <span className="status-badge canceled">
            <XCircle size={12} /> Cancelada
          </span>
        )
      default:
        return <span className="status-badge">{status}</span>
    }
  }

  const getFormatModalidad = (mod: string) => {
    switch (mod) {
      case 'DONACION':
        return 'Donación gratuita'
      case 'VENTA':
        return 'Venta'
      case 'TRUEQUE':
        return 'Trueque'
      case 'VENTA_PIEZAS':
        return 'Por piezas'
      default:
        return mod
    }
  }

  const getImageUrl = (url: string) => {
    if (!url)
      return 'https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=600&auto=format&fit=crop'
    if (url.startsWith('http')) return url
    return `http://localhost:3000${url}`
  }

  // Filtrado de tratos
  const filtered = transactions.filter((tx) => {
    if (activeTab === 'received') {
      return tx.receptorId === currentUserId
    } else {
      return tx.iniciadorId === currentUserId
    }
  })

  return (
    <div className="tx-dashboard">
      <div className="tx-header">
        <h2>Mis Tratos e Intercambios</h2>
        <p className="tx-sub">Administra y haz seguimiento al ciclo de vida de tus solicitudes.</p>
      </div>

      <div className="tx-tabs">
        <button
          className={`tx-tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          Solicitudes Recibidas
        </button>
        <button
          className={`tx-tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Solicitudes Enviadas
        </button>
      </div>

      {loading ? (
        <div className="tx-loading">
          <p>Cargando transacciones...</p>
        </div>
      ) : error ? (
        <div className="tx-error">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="tx-empty">
          <Info size={36} color="#10b981" />
          <h4>No tienes solicitudes en esta pestaña</h4>
          <p>
            Explora el catálogo para proponer tratos o espera a que otros usuarios se interesen en
            tus artículos.
          </p>
        </div>
      ) : (
        <div className="tx-list">
          {filtered.map((tx) => {
            const isOwner = tx.receptorId === currentUserId
            const coverImage =
              tx.publicacion?.imagenes && tx.publicacion.imagenes.length > 0
                ? getImageUrl(tx.publicacion.imagenes[0].url)
                : ''

            const userConfirmed = isOwner ? tx.confirmacionReceptor : tx.confirmacionIniciador
            const otherConfirmed = isOwner ? tx.confirmacionIniciador : tx.confirmacionReceptor

            return (
              <div key={tx.id} className="tx-card">
                <div className="tx-card-main">
                  <div className="tx-img-container">
                    <img
                      src={
                        coverImage ||
                        'https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=600&auto=format&fit=crop'
                      }
                      alt={tx.publicacion?.titulo}
                    />
                  </div>

                  <div className="tx-details">
                    <div className="tx-meta-row">
                      {getStatusBadge(tx.estado)}
                      <span className="tx-mode">{getFormatModalidad(tx.modalidad)}</span>
                    </div>

                    <h3 className="tx-title">
                      {tx.publicacion?.titulo || 'Artículo no disponible'}
                    </h3>

                    <p className="tx-user">
                      <strong>{isOwner ? 'Interesado:' : 'Propietario:'}</strong>{' '}
                      {isOwner ? tx.iniciador?.nombre : tx.receptor?.nombre || 'Usuario ReCircula'}
                    </p>

                    {tx.precioAcordado !== null && (
                      <p className="tx-price">
                        Precio acordado:{' '}
                        <strong>${parseFloat(tx.precioAcordado).toFixed(2)} MXN</strong>
                      </p>
                    )}

                    {tx.notas && (
                      <div className="tx-notes">
                        <MessageSquare size={14} />
                        <span>"{tx.notas}"</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fila de Confirmación de Entrega */}
                {tx.estado === 'EN_PROCESO' && (
                  <div className="tx-confirm-banner">
                    <AlertCircle size={16} />
                    <span>
                      {userConfirmed
                        ? 'Esperando a que la otra parte confirme la entrega.'
                        : 'Confirma la recepción del artículo para concretar el trato.'}
                    </span>
                    {otherConfirmed && (
                      <span className="tx-badge-confirmed">¡La otra parte ya confirmó!</span>
                    )}
                  </div>
                )}

                {/* Acciones */}
                <div className="tx-actions">
                  {/* Acciones para PENDIENTE */}
                  {tx.estado === 'PENDIENTE' && isOwner && (
                    <>
                      <button
                        className="btn-primary-sm"
                        disabled={processingId === tx.id}
                        onClick={() => handleAccept(tx.id)}
                      >
                        Aceptar Trato
                      </button>
                      <button
                        className="btn-secondary-sm"
                        disabled={processingId === tx.id}
                        onClick={() => handleCancel(tx.id)}
                      >
                        Rechazar
                      </button>
                    </>
                  )}

                  {tx.estado === 'PENDIENTE' && !isOwner && (
                    <button
                      className="btn-secondary-sm"
                      disabled={processingId === tx.id}
                      onClick={() => handleCancel(tx.id)}
                    >
                      Cancelar Solicitud
                    </button>
                  )}

                  {/* Acciones para EN_PROCESO */}
                  {tx.estado === 'EN_PROCESO' && (
                    <>
                      {!userConfirmed && (
                        <button
                          className="btn-primary-sm"
                          disabled={processingId === tx.id}
                          onClick={() => handleConfirm(tx.id)}
                        >
                          Confirmar Recepción
                        </button>
                      )}
                      <button
                        className="btn-secondary-sm"
                        disabled={processingId === tx.id}
                        onClick={() => handleCancel(tx.id)}
                      >
                        Cancelar Trato
                      </button>
                    </>
                  )}
                  {/* Acciones para COMPLETADA — Calificar */}
                  {tx.estado === 'COMPLETADA' && (
                    <>
                      {tx.calificaciones?.some((c: any) => c.calificadorId === user?.id) ? (
                        <button
                          className="btn-primary-sm"
                          disabled
                          style={{ background: '#e5e7eb', color: '#9ca3af', borderColor: 'transparent', cursor: 'not-allowed' }}
                        >
                          <Star size={14} fill="#9ca3af" color="#9ca3af" /> Calificado
                        </button>
                      ) : (
                        <button
                          className="btn-primary-sm"
                          style={{ background: 'rgba(217,119,6,0.9)', borderColor: 'transparent' }}
                          onClick={() =>
                            setCalModal({
                              txId: tx.id,
                              contraparte: isOwner
                                ? tx.iniciador?.nombre || 'el interesado'
                                : tx.receptor?.nombre || 'el propietario',
                            })
                          }
                        >
                          <Star size={14} fill="white" color="white" /> Calificar
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}\n
      {/* Modal de calificación */}
      {calModal && (
        <CalificacionModal
          transaccionId={calModal.txId}
          contraparte={calModal.contraparte}
          onClose={() => setCalModal(null)}
          onSuccess={() => {
            setCalModal(null)
            fetchTransactions()
          }}
        />
      )}
    </div>
  )
}
