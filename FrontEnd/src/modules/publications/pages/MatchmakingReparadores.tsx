/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react'
import { matchmakingApi } from '../services/api'
import { MapPin, Search, Star, Wrench, Info, CheckCircle, ChevronRight } from 'lucide-react'
import './MatchmakingReparadores.css'

interface Props {
  onVerPerfil?: (reparadorId: string) => void
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

export default function MatchmakingReparadores({ onVerPerfil }: Props) {
  const [reparadores, setReparadores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [categoria, setCategoria] = useState('Smartphones y Tablets')
  const [radioKm, setRadioKm] = useState('20')
  const [latitud, setLatitud] = useState('21.1561')
  const [longitud, setLongitud] = useState('-101.3562')

  // Obtener geolocalización al montar
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitud(position.coords.latitude.toString())
          setLongitud(position.coords.longitude.toString())
        },
        (err) => console.log('Geolocation error/blocked:', err)
      )
    }
  }, [])

  const fetchReparadores = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await matchmakingApi.getReparadores({
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        categoria,
        radioKm: parseFloat(radioKm),
      })
      // Ajustamos según la respuesta esperada del backEnd { resultados: [...] }
      setReparadores(data.resultados || [])
    } catch (err: any) {
      setError(err.message || 'Error al buscar reparadores')
      setReparadores([])
    } finally {
      setLoading(false)
    }
  }, [latitud, longitud, categoria, radioKm])

  // Buscar la primera vez automáticamente
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReparadores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchReparadores()
  }

  return (
    <div className="rep-dashboard">
      <div className="rep-header">
        <h2>Reparadores Locales</h2>
        <p className="rep-sub">
          Encuentra talleres y técnicos verificados cerca de tu ubicación para dar una segunda vida
          a tus artículos.
        </p>
      </div>

      <div className="filters-panel" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleSearch} className="filters-grid">
          <div className="filter-group">
            <label>Especialidad Requerida</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Radio de búsqueda: {radioKm} km</label>
            <input
              type="range"
              min="5"
              max="100"
              value={radioKm}
              onChange={(e) => setRadioKm(e.target.value)}
              style={{ cursor: 'pointer', marginTop: '10px' }}
            />
          </div>

          <div className="filter-group" style={{ marginTop: 'auto' }}>
            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: '12px 18px',
                width: '100%',
                height: '42px',
                justifyContent: 'center',
              }}
            >
              <Search size={18} /> Buscar
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="rep-loading">
          <p>Buscando técnicos cercanos...</p>
        </div>
      ) : error ? (
        <div className="rep-error">{error}</div>
      ) : reparadores.length === 0 ? (
        <div className="rep-empty">
          <Info size={36} color="#10b981" />
          <h4>No hay reparadores cercanos</h4>
          <p>
            No pudimos encontrar técnicos verificados para esta categoría en tu área. Intenta
            ampliar el radio de búsqueda.
          </p>
        </div>
      ) : (
        <div className="rep-list">
          {reparadores.map((rep) => (
            <div key={rep.reparadorId} className="rep-card">
              <div className="rep-card-main">
                <div className="rep-icon-container">
                  <Wrench size={32} color="#2D6A4F" />
                </div>

                <div className="rep-details">
                  <div className="rep-meta-row">
                    <span className="rep-badge">
                      <CheckCircle size={12} /> Verificado
                    </span>
                    <span className="rep-dist">
                      <MapPin size={12} /> {rep.distanciaKm} km
                    </span>
                  </div>

                  <h3 className="rep-title">{rep.nombreTaller || rep.nombre}</h3>
                  <p className="rep-owner">Técnico: {rep.nombre}</p>

                  <div className="rep-specialties">
                    {rep.especialidades?.map((esp: string, i: number) => (
                      <span key={i} className="rep-specialty-tag">
                        {esp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rep-actions">
                <div className="rep-rating">
                  <Star size={18} fill="#d97706" color="#d97706" /> {rep.puntuacion}
                </div>
                <div className="rep-jobs">{rep.reparacionesDocumentadas} reparaciones</div>
                {onVerPerfil && (
                  <button className="btn-primary-sm" onClick={() => onVerPerfil(rep.reparadorId)}>
                    Ver Perfil <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
