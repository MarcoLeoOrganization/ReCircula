/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from 'react'
import { reputationApi } from '../../publications/services/api'
import { useAuthStore } from '../../../store/authStore'
import { Upload, X, ArrowLeft, CheckCircle, Image as ImageIcon } from 'lucide-react'
import './SolicitarVerificacion.css'

interface Props {
  onBack: () => void
}

export default function SolicitarVerificacion({ onBack }: Props) {
  const [descripcion, setDescripcion] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { token: authToken } = useAuthStore()
  const token = authToken || ''

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (files.length + selected.length > 10) {
      setError('Máximo 10 imágenes')
      return
    }
    const newPreviews = selected.map((f) => URL.createObjectURL(f))
    setFiles((prev) => [...prev, ...selected])
    setPreviews((prev) => [...prev, ...newPreviews])
    setError(null)
  }

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Debes subir al menos una imagen de evidencia')
      return
    }
    try {
      setLoading(true)
      setError(null)
      const formData = new FormData()
      if (descripcion) formData.append('descripcion', descripcion)
      files.forEach((f) => formData.append('evidencias', f))
      await reputationApi.solicitarVerificacion(formData, token)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error al enviar solicitud')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="sol-container">
        <div className="sol-success">
          <div className="sol-success-icon">
            <CheckCircle size={40} color="#059669" />
          </div>
          <h2>¡Solicitud enviada!</h2>
          <p>Tu solicitud de verificación fue recibida. Un administrador revisará tu evidencia y recibirás una respuesta pronto.</p>
          <button className="btn-primary" onClick={onBack} style={{ marginTop: '8px' }}>
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sol-container">
      <button className="prf-back" onClick={onBack}>
        <ArrowLeft size={18} /> Volver
      </button>

      <div className="sol-card">
        <div className="sol-header">
          <div className="sol-header-icon">
            <Upload size={24} color="#2d6a4f" />
          </div>
          <div>
            <h2 className="sol-title">Solicitar Verificación</h2>
            <p className="sol-sub">Sube evidencias fotográficas de reparaciones que hayas realizado (antes y después) para ser verificado como Reparador Certificado.</p>
          </div>
        </div>

        {/* Descripción */}
        <div className="sol-field">
          <label className="sol-label">Descripción de tu experiencia (opcional)</label>
          <textarea
            className="sol-textarea"
            placeholder="Describe brevemente tu experiencia como reparador: años en el campo, tipos de dispositivos que repara, etc."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={1000}
            rows={4}
          />
          <span className="sol-char-count">{descripcion.length}/1000</span>
        </div>

        {/* Upload de imágenes */}
        <div className="sol-field">
          <label className="sol-label">Evidencias fotográficas <span className="sol-required">*</span></label>
          <p className="sol-hint">Sube fotos del antes y después de reparaciones que hayas realizado. Máximo 10 imágenes.</p>

          <div
            className="sol-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={32} color="#2d6a4f" style={{ opacity: 0.6 }} />
            <p>Haz clic para seleccionar imágenes</p>
            <span>JPG, PNG, WEBP — Máx. 10 archivos</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {previews.length > 0 && (
            <div className="sol-previews">
              {previews.map((src, i) => (
                <div key={i} className="sol-preview-item">
                  <img src={src} alt={`Evidencia ${i + 1}`} />
                  <button className="sol-remove-btn" onClick={() => removeFile(i)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="sol-error">{error}</div>}

        <div className="sol-actions">
          <button className="btn-secondary-sm" onClick={onBack} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading || files.length === 0}>
            {loading ? 'Enviando…' : `Enviar solicitud (${files.length} ${files.length === 1 ? 'imagen' : 'imágenes'})`}
          </button>
        </div>
      </div>
    </div>
  )
}
