import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, FileText } from 'lucide-react'
import '../../publications/pages/TransactionsDashboard.css' // Reutilizamos los estilos del Dashboard principal

export function AdminDashboard() {
  const [pendientes, setPendientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchPendientes = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/reputation/verificacion/pendientes')
      if (!res.ok) throw new Error('Error al obtener solicitudes')
      const data = await res.json()
      setPendientes(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendientes()
  }, [])

  const handleReview = async (id: string, decision: 'APROBADA' | 'RECHAZADA') => {
    const notasAdmin = prompt(`¿Motivo de la decisión? (Opcional)`)
    if (notasAdmin === null) return // Cancelado

    try {
      setActionLoading(true)
      const res = await fetch(`/api/v1/reputation/verificacion/${id}/revisar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notasAdmin })
      })

      if (!res.ok) throw new Error('Error al procesar la solicitud')
      
      setPendientes(pendientes.filter(p => p.id !== id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="tx-dashboard">
      <div className="tx-header">
        <h2>Panel de Administración</h2>
        <p className="tx-sub">Revisa y modera las solicitudes para ser Reparador Verificado de la comunidad.</p>
      </div>

      {loading ? (
        <div className="tx-loading">
          <p>Cargando solicitudes...</p>
        </div>
      ) : error ? (
        <div className="tx-error">{error}</div>
      ) : pendientes.length === 0 ? (
        <div className="tx-empty">
          <Info size={36} color="#10b981" />
          <h4>No hay solicitudes pendientes</h4>
          <p>
            ¡Todo al día! No hay usuarios esperando revisión de documentos en este momento.
          </p>
        </div>
      ) : (
        <div className="tx-list">
          {pendientes.map(req => (
            <div key={req.id} className="tx-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="tx-card-main" style={{ borderBottom: 'none' }}>
                <div className="tx-details">
                  <div className="tx-meta-row">
                    <span className="tx-status status-pendiente">
                      <Clock size={14} style={{ marginRight: 4 }} /> Pendiente
                    </span>
                    <span className="tx-mode" style={{ fontFamily: 'var(--mono)' }}>#{req.id.substring(0,8)}</span>
                  </div>

                  <h3 className="tx-title" style={{ marginTop: '12px' }}>
                    Solicitud de Verificación
                  </h3>

                  <p className="tx-user">
                    <strong>Motivo:</strong> {req.descripcion || 'Sin descripción'}
                  </p>

                  <div style={{ marginTop: '16px' }}>
                    <p className="tx-user" style={{ marginBottom: '8px' }}>
                      <strong>Documentos Adjuntos:</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {req.evidencias && req.evidencias.length > 0 ? (
                        req.evidencias.map((ev: string, idx: number) => (
                          <a key={idx} href={ev} target="_blank" rel="noreferrer" 
                             style={{ 
                               background: 'var(--code-bg)', 
                               padding: '6px 12px', 
                               borderRadius: '20px', 
                               fontSize: '0.85rem',
                               color: 'var(--primary)',
                               textDecoration: 'none',
                               display: 'flex',
                               alignItems: 'center',
                               gap: '6px',
                               fontWeight: '500'
                             }}
                          >
                            <FileText size={14} /> Documento {idx + 1}
                          </a>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No se subieron documentos</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="tx-card-actions" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', padding: '16px 24px', display: 'flex', gap: '12px' }}>
                <button 
                  className="tx-btn-confirm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={actionLoading}
                  onClick={() => handleReview(req.id, 'APROBADA')}
                >
                  <CheckCircle size={16} /> Aprobar
                </button>
                <button 
                  className="tx-btn-reject"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={actionLoading}
                  onClick={() => handleReview(req.id, 'RECHAZADA')}
                >
                  <XCircle size={16} /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const Clock = ({ size, style }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
)
