/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react'
import { publicationsApi } from '../services/api'
import { Upload, Plus, Trash2, MapPin, CheckCircle, ArrowLeft } from 'lucide-react'
import './CreatePublication.css'

interface ComponenteInput {
  nombre: string
  funcional: boolean
  descripcion: string
  precioPieza?: number
}

const CATEGORIAS = [
  'Computadoras y Laptops',
  'Smartphones y Tablets',
  'Componentes PC',
  'Electrodomésticos',
  'Audio y Video',
  'Cámaras y Fotografía',
  'Consolas y Videojuegos',
  'Redes y Conectividad',
  'Herramientas Electrónicas',
  'Impresoras y Escáneres',
  'Antigüedades Tecnológicas',
  'Otros',
]

export default function CreatePublication({
  onBack,
  editId,
}: {
  onBack?: () => void
  editId?: string
}) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [modalidad, setModalidad] = useState('DONACION')
  const [precio, setPrecio] = useState('')
  const [condicion, setCondicion] = useState('Buen estado')
  const [latitud, setLatitud] = useState('21.1561') // Defecto Dolores Hidalgo
  const [longitud, setLongitud] = useState('-101.3562')
  const [direccionReferencia, setDireccionReferencia] = useState('')

  // Componentes (Hardware Mining)
  const [componentes, setComponentes] = useState<ComponenteInput[]>([])

  // Imágenes
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)


  // Cargar datos en modo edición
  useEffect(() => {
    if (editId) {
      const loadPubData = async () => {
        try {
          setLoading(true)
          const data = await publicationsApi.getPublicationDetail(editId)
          setTitulo(data.titulo)
          setCategoria(data.categoria)
          setModalidad(data.modalidad)
          setPrecio(data.precio ? data.precio.toString() : '')
          setLatitud(data.ubicacion.latitud.toString())
          setLongitud(data.ubicacion.longitud.toString())
          setDireccionReferencia(data.direccionReferencia || '')

          // Parsear la condición si viene en el formato "[Condición: X] descripcion"
          const match = data.descripcion.match(/^\[Condición:\s*([^\]]+)\]\s*(.*)/)
          if (match) {
            setCondicion(match[1])
            setDescripcion(match[2])
          } else {
            setDescripcion(data.descripcion)
          }
        } catch (e: any) {
          setError('Error al cargar la publicación: ' + e.message)
        } finally {
          setLoading(false)
        }
      }
      loadPubData()
    }
  }, [editId])

  // Agregar componente
  const addComponent = () => {
    setComponentes([
      ...componentes,
      { nombre: '', funcional: true, descripcion: '', precioPieza: undefined },
    ])
  }

  // Modificar componente
  const handleComponentChange = (index: number, field: keyof ComponenteInput, val: any) => {
    const updated = [...componentes]
    updated[index] = { ...updated[index], [field]: val }
    setComponentes(updated)
  }

  // Remover componente
  const removeComponent = (index: number) => {
    setComponentes(componentes.filter((_, i) => i !== index))
  }

  // Obtener geolocalización
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitud(position.coords.latitude.toFixed(6))
          setLongitud(position.coords.longitude.toFixed(6))
          setError(null)
        },
        () => {
          setError(
            'No se pudo obtener la ubicación automáticamente. Usando coordenadas Dolores Hidalgo por defecto.'
          )
        }
      )
    } else {
      setError('Geolocalización no soportada por el navegador.')
    }
  }

  // Seleccionar imágenes
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const totalImages = images.length + selectedFiles.length

      if (totalImages > 10) {
        setError('Solo se permite subir un máximo de 10 imágenes.')
        return
      }

      const validFiles: File[] = []
      const validPreviews: string[] = []

      selectedFiles.forEach((file) => {
        // Validar tamaño <= 5MB
        if (file.size > 5 * 1024 * 1024) {
          setError(`La imagen ${file.name} excede el límite de 5MB.`)
          return
        }

        validFiles.push(file)
        validPreviews.push(URL.createObjectURL(file))
      })

      setImages([...images, ...validFiles])
      setImagePreviews([...imagePreviews, ...validPreviews])
      setError(null)
    }
  }

  // Eliminar imagen
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // El token va en las cookies, no necesitamos checarlo en localStorage
    // Validar modalidad de venta
    if ((modalidad === 'VENTA' || modalidad === 'VENTA_PIEZAS') && !precio) {
      setError('Debes especificar un precio para la modalidad seleccionada.')
      setLoading(false)
      return
    }

    // Validar venta por piezas componentes obligatorios
    if (modalidad === 'VENTA_PIEZAS' && componentes.length === 0) {
      setError('Debes desglosar al menos un componente para vender por piezas.')
      setLoading(false)
      return
    }
    try {
      if (editId) {
        const updateData = {
          titulo,
          descripcion,
          condition: condicion,
          categoria,
          modalidad,
          precio: modalidad === 'VENTA' || modalidad === 'VENTA_PIEZAS' ? parseFloat(precio) : null,
          direccionReferencia,
          ubicacion: {
            latitud: parseFloat(latitud),
            longitud: parseFloat(longitud),
          },
        }
        await publicationsApi.updatePublication(editId, updateData, token)
      } else {
        const formData = new FormData()
        formData.append('titulo', titulo)
        formData.append('descripcion', descripcion)
        formData.append('condition', condicion)
        formData.append('categoria', categoria)
        formData.append('modalidad', modalidad)
        if (precio) formData.append('precio', precio)

        // Ubicación estructurada
        formData.append(
          'ubicacion',
          JSON.stringify({
            latitud: parseFloat(latitud),
            longitud: parseFloat(longitud),
          })
        )

        if (direccionReferencia) {
          formData.append('direccionReferencia', direccionReferencia)
        }

        // Componentes estructurados
        if (componentes.length > 0) {
          formData.append('componentes', JSON.stringify(componentes))
        }

        // Agregar imágenes al form data
        images.forEach((file) => {
          formData.append('imagenes', file)
        })

        await publicationsApi.createPublication(formData)
      }
      setSuccess(true)
      setError(null)
      // Limpiar formulario
      setTitulo('')
      setDescripcion('')
      setPrecio('')
      setCondicion('Buen estado')
      setComponentes([])
      setImages([])
      setImagePreviews([])
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al enviar la publicación.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="publication-container text-center">
        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 20px' }} />
        <h2 className="publication-title">
          {editId ? '¡Publicación Guardada!' : '¡Publicación Creada!'}
        </h2>
        <p className="publication-subtitle">
          {editId
            ? 'Los cambios se han guardado con éxito y ya están actualizados en el catálogo.'
            : 'El artículo ha sido registrado en la plataforma exitosamente y ya es visible en el catálogo.'}
        </p>
        <button
          className="submit-btn"
          onClick={() => {
            setSuccess(false)
            if (onBack) onBack()
          }}
        >
          Volver al catálogo
        </button>
      </div>
    )
  }

  return (
    <div className="publication-container">
      {onBack && (
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
      )}

      <h1 className="publication-title">{editId ? 'Editar Artículo' : 'Publicar Artículo'}</h1>
      <p className="publication-subtitle">
        {editId
          ? 'Actualiza los datos de tu artículo publicado.'
          : 'Comparte tu equipo tecnológico en desuso para darle una segunda vida.'}
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Sección 1: Información Básica */}
        <div className="form-section">
          <h2 className="section-title">Información Básica</h2>

          <div className="form-group">
            <label htmlFor="titulo">Título de la Publicación</label>
            <input
              type="text"
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Laptop Dell Inspiron con teclado dañado"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción del Estado</label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe detalladamente el estado físico, fallas conocidas y qué funciona."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="condicion">Condición General del Artículo</label>
            <select
              id="condicion"
              value={condicion}
              onChange={(e) => setCondicion(e.target.value)}
              required
            >
              <option value="Nuevo">Nuevo</option>
              <option value="Como nuevo">Como nuevo</option>
              <option value="Buen estado">Buen estado</option>
              <option value="Aceptable">Aceptable</option>
              <option value="Para piezas / Dañado">Para piezas / Dañado</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="categoria">Categoría</label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="modalidad">Modalidad de Intercambio</label>
              <select
                id="modalidad"
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value)}
              >
                <option value="DONACION">Donación gratuita</option>
                <option value="VENTA">Venta</option>
                <option value="TRUEQUE">Trueque (Intercambio piezas)</option>
                <option value="VENTA_PIEZAS">Venta por piezas</option>
              </select>
            </div>
          </div>

          {(modalidad === 'VENTA' || modalidad === 'VENTA_PIEZAS') && (
            <div className="form-group">
              <label htmlFor="precio">Precio sugerido (MXN)</label>
              <input
                type="number"
                id="precio"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej: 1500"
                min="0"
                required
              />
            </div>
          )}
        </div>

        {!editId && (
          <>
            {/* Sección 2: Desglose de Componentes (Hardware Mining) */}
            <div className="form-section">
              <h2 className="section-title">Desglose de Componentes (Hardware Mining)</h2>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '16px' }}>
                Especifica cuáles piezas internas aún sirven. Esto ayuda a los reparadores a
                encontrar materia prima útil.
              </p>

              {componentes.map((comp, idx) => (
                <div key={idx} className="component-card">
                  <div className="component-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input
                        type="text"
                        placeholder="Nombre del componente (Ej: Memoria RAM 8GB)"
                        value={comp.nombre}
                        onChange={(e) => handleComponentChange(idx, 'nombre', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <select
                        value={comp.funcional ? 'true' : 'false'}
                        onChange={(e) =>
                          handleComponentChange(idx, 'funcional', e.target.value === 'true')
                        }
                      >
                        <option value="true">Funcional</option>
                        <option value="false">Dañado / No verificado</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {modalidad === 'VENTA_PIEZAS' && (
                        <input
                          type="number"
                          placeholder="$ Pieza"
                          value={comp.precioPieza || ''}
                          onChange={(e) =>
                            handleComponentChange(
                              idx,
                              'precioPieza',
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          style={{ width: '80px' }}
                          required
                        />
                      )}

                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeComponent(idx)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Descripción del estado del componente (Opcional)"
                    value={comp.descripcion}
                    onChange={(e) => handleComponentChange(idx, 'descripcion', e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                  />
                </div>
              ))}

              <button type="button" className="add-btn" onClick={addComponent}>
                <Plus size={18} /> Agregar componente al desglose
              </button>
            </div>

            {/* Sección 3: Imágenes */}
            <div className="form-section">
              <h2 className="section-title">Imágenes del Artículo</h2>

              <div className="image-upload-zone" onClick={() => fileInputRef.current?.click()}>
                <Upload size={32} color="#10b981" style={{ margin: '0 auto 10px' }} />
                <p>Haz clic para subir hasta 10 imágenes</p>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Solo se permiten archivos JPG, PNG o WebP menores a 5MB.
                </span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                multiple
                accept="image/*"
                style={{ display: 'none' }}
              />

              {imagePreviews.length > 0 && (
                <div className="image-grid">
                  {imagePreviews.map((prev, idx) => (
                    <div key={idx} className={`image-thumb-container ${idx === 0 ? 'main' : ''}`}>
                      <img src={prev} className="image-thumb" alt={`Subida ${idx}`} />
                      {idx === 0 && <span className="image-badge">Portada</span>}
                      <button
                        type="button"
                        className="image-delete-badge"
                        onClick={() => removeImage(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Sección 4: Ubicación */}
        <div className="form-section">
          <h2 className="section-title">Geolocalización</h2>

          {/* Inputs ocultos de control */}
          <input type="hidden" value={latitud} />
          <input type="hidden" value={longitud} />

          {/* Tarjeta de estado de ubicación amigable */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid var(--border-color, #E0D9CF)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(45, 106, 79, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid var(--primary, #2D6A4F)',
                flexShrink: 0,
              }}
            >
              <MapPin size={18} color="var(--primary, #2D6A4F)" />
            </div>
            <div>
              <p
                style={{
                  margin: '0 0 2px 0',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  color: 'var(--primary, #2D6A4F)',
                }}
              >
                Ubicación geográfica asignada
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary, #6B6B6B)' }}>
                {latitud && longitud
                  ? `Establecida mediante coordenadas: ${parseFloat(latitud).toFixed(5)}, ${parseFloat(longitud).toFixed(5)}`
                  : 'No se ha detectado ubicación aún.'}
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ref">Dirección de Referencia (Opcional)</label>
            <input
              type="text"
              id="ref"
              value={direccionReferencia}
              onChange={(e) => setDireccionReferencia(e.target.value)}
              placeholder="Ej: Cruce de Av. Principal y Calle 2, Colonia Centro"
            />
          </div>

          <button type="button" className="geo-btn" onClick={handleGetLocation}>
            <MapPin size={18} /> Obtener mi ubicación actual
          </button>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading
            ? editId
              ? 'Guardando...'
              : 'Publicando...'
            : editId
              ? 'Guardar Cambios'
              : 'Publicar Artículo'}
        </button>
      </form>
    </div>
  )
}
