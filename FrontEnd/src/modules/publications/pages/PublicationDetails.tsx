/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import { publicationsApi } from '../services/api'
import { MapPin, Clock, Archive, ArrowLeft, Layers, Wrench } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import './PublicationDetails.css'

interface PublicationDetailsProps {
  publicationId: string
  onBack: () => void
  onEdit: () => void
}

export default function PublicationDetails({
  publicationId,
  onBack,
  onEdit,
}: PublicationDetailsProps) {
  const { user, token } = useAuthStore()
  const [pub, setPub] = useState<any>(null)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposalPrice, setProposalPrice] = useState('')
  const [proposalNotes, setProposalNotes] = useState('')
  const [proposing, setProposing] = useState(false)

  // Historial de vida
  const [history, setHistory] = useState<any>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showRepairModal, setShowRepairModal] = useState(false)
  const [repairDesc, setRepairDesc] = useState('')
  const [repairPieces, setRepairPieces] = useState('')
  const [repairState, setRepairState] = useState('Excelente')
  const [savingRepair, setSavingRepair] = useState(false)

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault()
    const activeToken = token || localStorage.getItem('rc_token') || localStorage.getItem('recircula_token')
    if (!activeToken) {
      alert('Debes iniciar sesión para realizar esta acción.')
      return
    }

    if ((pub.modalidad === 'VENTA' || pub.modalidad === 'VENTA_PIEZAS') && !proposalPrice) {
      alert('Por favor especifica un precio.')
      return
    }

    try {
      setProposing(true)
      await publicationsApi.proposeTransaction(
        {
          publicacionId: publicationId,
          modalidad: pub.modalidad,
          precioAcordado: proposalPrice ? parseFloat(proposalPrice) : undefined,
          notas: proposalNotes || undefined,
        },
        activeToken
      )
      alert('¡Propuesta de trato enviada con éxito!')
      setShowProposalModal(false)
      setProposalNotes('')
      setProposalPrice('')
      fetchDetail() // Refresh page details
    } catch (err: any) {
      alert(err.message || 'Error al proponer el trato.')
    } finally {
      setProposing(false)
    }
  }

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true)
      const data = await publicationsApi.getHistoryByPublicationId(publicationId)
      setHistory(data)
    } catch (err: any) {
      console.error('Error al cargar el historial:', err)
    } finally {
      setLoadingHistory(false)
    }
  }, [publicationId])

  const handleAddRepair = async (e: React.FormEvent) => {
    e.preventDefault()
    const activeToken = token || localStorage.getItem('rc_token') || localStorage.getItem('recircula_token')
    if (!activeToken) {
      alert('Debes iniciar sesión para realizar esta acción.')
      return
    }

    if (!repairDesc.trim()) {
      alert('Por favor agrega una descripción.')
      return
    }

    try {
      setSavingRepair(true)
      const pieces = repairPieces
        ? repairPieces.split(',').map((p) => p.trim()).filter(Boolean)
        : []

      await publicationsApi.addRepairEntry(
        publicationId,
        {
          descripcion: repairDesc,
          piezasReemplazadas: pieces,
          estadoResultante: repairState,
        },
        activeToken
      )

      alert('¡Reparación registrada con éxito!')
      setShowRepairModal(false)
      setRepairDesc('')
      setRepairPieces('')
      setRepairState('Excelente')
      fetchHistory()
    } catch (err: any) {
      alert(err.message || 'Error al registrar la reparación.')
    } finally {
      setSavingRepair(false)
    }
  }

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true)
      const data = await publicationsApi.getPublicationDetail(publicationId)
      setPub(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los detalles')
    } finally {
      setLoading(false)
    }
  }, [publicationId])

  useEffect(() => {
    fetchDetail()
    fetchHistory()
  }, [fetchDetail, fetchHistory])

  const handleArchive = async () => {
    const activeToken = token || localStorage.getItem('rc_token') || localStorage.getItem('recircula_token')
    if (!activeToken) {
      alert('Debes iniciar sesión para realizar esta acción.')
      return
    }

    if (
      !window.confirm(
        '¿Estás seguro de que deseas archivar esta publicación? Ya no será visible para intercambios.'
      )
    ) {
      return
    }

    try {
      setArchiving(true)
      await publicationsApi.archivePublication(publicationId, activeToken)
      alert('Publicación archivada exitosamente.')
      fetchDetail() // Recargar detalles para reflejar estado
    } catch (err: any) {
      alert(err.message || 'Error al archivar la publicación')
    } finally {
      setArchiving(false)
    }
  }

  if (loading) {
    return (
      <div className="details-container text-center" style={{ padding: '60px' }}>
        <p>Cargando detalles del artículo...</p>
      </div>
    )
  }

  if (error || !pub) {
    return (
      <div className="details-container text-center" style={{ padding: '60px' }}>
        <p style={{ color: '#ef4444' }}>{error || 'No se encontró el artículo.'}</p>
        <button className="btn-secondary" onClick={onBack} style={{ margin: '20px auto 0' }}>
          Volver al catálogo
        </button>
      </div>
    )
  }

  const formatModalidad = (mod: string) => {
    switch (mod) {
      case 'DONACION':
        return 'Donación Gratuita'
      case 'VENTA':
        return 'Venta Directa'
      case 'TRUEQUE':
        return 'Trueque (Intercambio)'
      case 'VENTA_PIEZAS':
        return 'Venta por Piezas'
      default:
        return mod
    }
  }

  // Resolver URL base de imágenes locales
  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url
    return `http://localhost:3000${url}`
  }

  const currentImage =
    pub.imagenes && pub.imagenes.length > 0
      ? getImageUrl(pub.imagenes[activeImageIdx]?.url)
      : 'https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=600&auto=format&fit=crop' // fallback image

  return (
    <div className="details-container">
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#9ca3af',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        <ArrowLeft size={18} /> Volver al catálogo
      </button>

      <span className="category-tag">{pub.categoria}</span>

      <h1 className="item-title" style={{ marginTop: '12px' }}>
        {pub.titulo}
      </h1>

      <div className="item-meta" style={{ marginTop: '8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={16} /> Publicado el:{' '}
          {new Date(pub.fechaCreacion).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
        <span>•</span>
        <span>Publicado por: {pub.publicador?.nombre || 'Usuario ReCircula'}</span>
        {pub.estado === 'ARCHIVADO' && (
          <>
            <span>•</span>
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>[ARCHIVADO]</span>
          </>
        )}
      </div>

      <div className="details-grid">
        {/* Columna Izquierda: Galería */}
        <div className="gallery-section">
          <div className="main-image-container">
            <img src={currentImage} className="main-image" alt="Artículo principal" />
          </div>

          {pub.imagenes && pub.imagenes.length > 0 && (
            <div className="thumbs-row">
              {pub.imagenes.map((img: any, idx: number) => (
                <div
                  key={img.id || idx}
                  className={`thumb-item ${activeImageIdx === idx ? 'active' : ''}`}
                  onClick={() => setActiveImageIdx(idx)}
                >
                  <img
                    src={getImageUrl(img.url)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt="Miniatura"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Información */}
        <div className="info-section">
          <div className="price-box">
            <span className="price-label">Modalidad: {formatModalidad(pub.modalidad)}</span>
            {pub.precio !== null && pub.precio !== undefined && (
              <span className="price-value">
                ${parseFloat(pub.precio).toLocaleString('es-MX')} {pub.moneda}
              </span>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px' }}>
              Descripción general
            </h3>
            <p className="item-desc">{pub.descripcion}</p>
          </div>

          {/* Desglose de Componentes */}
          {pub.componentes && pub.componentes.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Layers size={18} color="#2D6A4F" /> Desglose de Componentes (Hardware Mining)
              </h3>
              <div className="components-list">
                {pub.componentes.map((comp: any) => (
                  <div key={comp.id} className="component-item">
                    <div className="component-info">
                      <span className="comp-name">{comp.nombre}</span>
                      {comp.descripcion && <span className="comp-desc">{comp.descripcion}</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {comp.precioPieza && (
                        <span style={{ fontWeight: '700', color: '#2D6A4F' }}>
                          ${parseFloat(comp.precioPieza).toFixed(2)} MXN
                        </span>
                      )}
                      <span className={`status-badge ${comp.funcional ? 'functional' : 'damaged'}`}>
                        {comp.funcional ? 'Funcional' : 'Dañado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ubicación y Referencia */}
          <div className="map-card">
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <MapPin size={18} color="#2D6A4F" /> Ubicación del artículo
            </h3>
            {pub.direccionReferencia && (
              <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>
                <strong>Referencia:</strong> {pub.direccionReferencia}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Historial de Vida del Producto */}
      <div className="history-section-card" style={{ marginTop: '24px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)' }}>
            <Clock size={20} color="#2D6A4F" /> Historial de Vida del Producto
          </h3>
          {user?.rol === 'REPARADOR_VERIFICADO' && pub?.publicadorId === user?.id && (
            <button
              className="btn-primary"
              onClick={() => setShowRepairModal(true)}
              style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Wrench size={14} /> Registrar Reparación
            </button>
          )}
        </div>

        {loadingHistory ? (
          <p style={{ color: 'var(--text-secondary)' }}>Cargando historial...</p>
        ) : !history || !history.entradas || history.entradas.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Este producto aún no cuenta con historial de transacciones o reparaciones registradas.</p>
        ) : (
          <div className="timeline-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid var(--border-color)', paddingLeft: '16px', marginLeft: '8px' }}>
            {history.entradas.map((entry: any) => (
              <div key={entry.id} className="timeline-entry" style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '-26px',
                  top: '2px',
                  background: entry.tipo === 'REPARACION' ? '#2D6A4F' : '#3B82F6',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: 'bold'
                }}>
                  {entry.tipo === 'REPARACION' ? 'R' : 'I'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {entry.tipo === 'REPARACION' ? 'Reparación Documentada' : 'Intercambio Completado'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(entry.fechaCreacion).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <p style={{ margin: '0 0 6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{entry.descripcion}</p>
                
                {entry.tipo === 'REPARACION' && entry.reparador && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <strong>Reparador:</strong> {entry.reparador.nombre}
                  </div>
                )}

                {entry.estadoResultante && (
                  <div style={{ marginBottom: '6px' }}>
                    <span className="status-badge functional" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                      Estado Resultante: {entry.estadoResultante}
                    </span>
                  </div>
                )}

                {entry.piezasReemplazadas && entry.piezasReemplazadas.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Piezas reemplazadas:</span>
                    {entry.piezasReemplazadas.map((piece: string, idx: number) => (
                      <span key={idx} style={{
                        fontSize: '0.75rem',
                        background: 'rgba(45, 106, 79, 0.1)',
                        color: '#2D6A4F',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        border: '1px solid rgba(45, 106, 79, 0.2)'
                      }}>
                        {piece}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones de acción según rol */}
      {pub.estado !== 'ARCHIVADO' && (
        <div className="action-row" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          {pub.publicadorId === user?.id ? (
            <>
              <button
                className="btn-primary"
                onClick={onEdit}
                style={{
                  flex: '1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Editar publicación
              </button>
              <button
                className="btn-secondary"
                onClick={handleArchive}
                disabled={archiving}
                style={{ flex: '1' }}
              >
                <Archive size={18} /> {archiving ? 'Archivando...' : 'Archivar publicación'}
              </button>
            </>
          ) : (
            pub.estado === 'PUBLICADO' && (
              <button
                className="btn-primary"
                onClick={() => {
                  setShowProposalModal(true)
                  setProposalPrice(pub.precio?.toString() || '')
                }}
                style={{
                  flex: '1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px',
                  fontSize: '1.05rem',
                }}
              >
                Proponer Trato / Intercambio
              </button>
            )
          )}
        </div>
      )}

      {/* Modal de Propuesta de Trato */}
      {showProposalModal && (
        <div className="proposal-modal-overlay">
          <div className="proposal-modal">
            <h3 style={{ margin: '0 0 12px', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              Proponer Trato
            </h3>
            <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)' }}>
              Artículo: <strong style={{ color: 'var(--primary)' }}>{pub.titulo}</strong>
            </p>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)' }}>
              Modalidad:{' '}
              <strong>
                {pub.modalidad === 'DONACION'
                  ? 'Donación'
                  : pub.modalidad === 'VENTA'
                    ? 'Venta'
                    : pub.modalidad === 'TRUEQUE'
                      ? 'Trueque'
                      : 'Venta de piezas'}
              </strong>
            </p>

            <form onSubmit={handlePropose}>
              {(pub.modalidad === 'VENTA' || pub.modalidad === 'VENTA_PIEZAS') && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Precio acordado (MXN)
                  </label>
                  <input
                    type="number"
                    value={proposalPrice}
                    onChange={(e) => setProposalPrice(e.target.value)}
                    required
                    min="0"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              )}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Notas / Detalles del trato
                </label>
                <textarea
                  placeholder="Detalla tu propuesta aquí (ej. qué ofreces a cambio en caso de trueque, o qué piezas necesitas)."
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div
                className="modal-actions"
                style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowProposalModal(false)}
                  style={{ padding: '8px 16px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={proposing}
                  style={{ padding: '8px 16px' }}
                >
                  {proposing ? 'Enviando...' : 'Enviar propuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Registrar Reparación */}
      {showRepairModal && (
        <div className="proposal-modal-overlay">
          <div className="proposal-modal">
            <h3 style={{ margin: '0 0 12px', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              Registrar Reparación / Intervención
            </h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)' }}>
              Describe las reparaciones realizadas y piezas reemplazadas en este artículo.
            </p>

            <form onSubmit={handleAddRepair}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Descripción de la reparación *
                </label>
                <textarea
                  placeholder="Detalla qué fallas se solucionaron y el trabajo realizado."
                  value={repairDesc}
                  onChange={(e) => setRepairDesc(e.target.value)}
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Piezas reemplazadas (separadas por comas)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pantalla, Batería, Conector de carga"
                  value={repairPieces}
                  onChange={(e) => setRepairPieces(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Estado resultante del producto
                </label>
                <select
                  value={repairState}
                  onChange={(e) => setRepairState(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="Excelente">Excelente (Como nuevo)</option>
                  <option value="Muy Bueno">Muy Bueno (Detalles mínimos)</option>
                  <option value="Funcional">Funcional (Trabaja bien)</option>
                  <option value="Regular">Regular (Requiere atención leve)</option>
                </select>
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowRepairModal(false)}
                  style={{ padding: '8px 16px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingRepair}
                  style={{ padding: '8px 16px' }}
                >
                  {savingRepair ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
