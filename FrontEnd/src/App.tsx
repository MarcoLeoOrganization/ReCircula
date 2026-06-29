/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react'
import { publicationsApi, matchmakingApi } from './modules/publications/services/api'
import type { FiltrosBusqueda } from './modules/publications/services/api'
import CreatePublication from './modules/publications/pages/CreatePublication'
import PublicationDetails from './modules/publications/pages/PublicationDetails'
import TransactionsDashboard from './modules/publications/pages/TransactionsDashboard'
import MatchmakingReparadores from './modules/publications/pages/MatchmakingReparadores'
import PerfilReparador from './modules/reputation/pages/PerfilReparador'
import SolicitarVerificacion from './modules/reputation/pages/SolicitarVerificacion'
import { useAuthStore } from './store/authStore'
import { Plus, RefreshCw, LogOut, ShieldCheck, Wrench, Search, MapPin, SlidersHorizontal, Info } from 'lucide-react'
import './App.css'

const CATEGORIAS = [
  'Todas',
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

function App() {
  const { user, clearSession } = useAuthStore()
  const rol = user?.rol || 'USUARIO_GENERAL'

  const [view, setView] = useState<'list' | 'create' | 'details' | 'edit' | 'tratos' | 'reparadores' | 'perfil-reparador' | 'solicitar-verificacion'>('list')
  const [activePublicationId, setActivePublicationId] = useState<string>('')
  const [selectedReparadorId, setSelectedReparadorId] = useState<string>('')

  // Estados del listado
  const [publications, setPublications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados de los filtros
  const [categoria, setCategoria] = useState('Todas')
  const [modalidad, setModalidad] = useState('Todas')
  const [usarGeo, setUsarGeo] = useState(false)
  const [latitud, setLatitud] = useState('21.1561')
  const [longitud, setLongitud] = useState('-101.3562')
  const [radioKm, setRadioKm] = useState('15')

  const handleLogout = () => {
    clearSession()
    window.location.href = '/login'
  }

  // Obtener geolocalización cuando se activa el filtro por cercanía
  useEffect(() => {
    if (usarGeo) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitud(position.coords.latitude.toString())
            setLongitud(position.coords.longitude.toString())
          },
          (error) => {
            console.log('Using default coordinates due to geolocation block/error:', error)
          }
        )
      }
    }
  }, [usarGeo])

  const fetchPublications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filtros: FiltrosBusqueda = {}
      if (categoria !== 'Todas') filtros.categoria = categoria
      if (modalidad !== 'Todas') filtros.modalidad = modalidad

      let data;
      if (usarGeo) {
        filtros.latitud = parseFloat(latitud)
        filtros.longitud = parseFloat(longitud)
        filtros.radioKm = parseFloat(radioKm)
        // Usar API de matchmaking cuando hay búsqueda geoespacial
        const res = await matchmakingApi.getPublicaciones(filtros)
        data = res.resultados || [] // La respuesta del backend trae { total, radioKm, resultados: [] }
      } else {
        data = await publicationsApi.getPublications(filtros)
      }
      
      setPublications(data)
    } catch (err: any) {
      setError(err.message || 'Error al obtener publicaciones')
    } finally {
      setLoading(false)
    }
  }, [categoria, modalidad, usarGeo, latitud, longitud, radioKm])

  useEffect(() => {
    if (view === 'list') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchPublications()
    }
  }, [view, fetchPublications])

  const handleProximitySearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPublications()
  }

  const getBadgeClass = (mod: string) => {
    switch (mod) {
      case 'VENTA':
        return 'venta'
      case 'TRUEQUE':
        return 'trueque'
      case 'DONACION':
        return 'donacion'
      case 'VENTA_PIEZAS':
        return 'piezas'
      default:
        return ''
    }
  }

  const getFormatModalidad = (mod: string) => {
    switch (mod) {
      case 'DONACION':
        return 'Donación'
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
    if (url.startsWith('http')) return url
    return `http://localhost:3000${url}`
  }

  return (
    <div>
      {/* Navbar Global */}
      <header className="app-header">
        <div className="logo-container">
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(45, 106, 79, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #2D6A4F',
            }}
          >
            <RefreshCw size={20} color="#2D6A4F" />
          </div>
          <span className="logo-text" onClick={() => setView('list')} style={{ cursor: 'pointer' }}>
            ReCircula
          </span>
        </div>

        {/* Navegación adaptada al rol */}
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

          {/* Catálogo: todos los roles */}
          <span className="nav-link" onClick={() => setView('list')}
            style={{ cursor:'pointer', color: view==='list' ? '#2D6A4F':'#9ca3af', fontWeight:'600', fontSize:'0.95rem' }}>
            Catálogo
          </span>

          {/* Mis Tratos: USUARIO_GENERAL y REPARADOR_VERIFICADO */}
          {(rol === 'USUARIO_GENERAL' || rol === 'REPARADOR_VERIFICADO') && (
            <span className="nav-link" onClick={() => setView('tratos')}
              style={{ cursor:'pointer', color: view==='tratos' ? '#2D6A4F':'#9ca3af', fontWeight:'600', fontSize:'0.95rem' }}>
              Mis Tratos
            </span>
          )}

          {/* Reparadores: todos los roles */}
          <span className="nav-link" onClick={() => setView('reparadores')}
            style={{ cursor:'pointer', color: view==='reparadores' ? '#2D6A4F':'#9ca3af', fontWeight:'600', fontSize:'0.95rem' }}>
            Reparadores
          </span>

          {/* Mi Perfil: Solo para Reparadores */}
          {rol === 'REPARADOR_VERIFICADO' ? (
            <span className="nav-link" onClick={() => { setView('perfil-reparador'); setSelectedReparadorId(user?.id || ''); }}
              style={{ cursor:'pointer', color: view==='perfil-reparador' ? '#2D6A4F':'#9ca3af', fontWeight:'600', fontSize:'0.95rem' }}>
              Mi Perfil
            </span>
          ) : null}

          {/* Indicador de rol */}
          <span style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '0.82rem', fontWeight: '600', padding: '4px 10px',
            borderRadius: '20px',
            background: rol === 'ADMINISTRADOR' ? 'rgba(239,68,68,0.1)'
                       : rol === 'REPARADOR_VERIFICADO' ? 'rgba(16,185,129,0.1)'
                       : 'rgba(45,106,79,0.1)',
            color: rol === 'ADMINISTRADOR' ? '#dc2626'
                 : rol === 'REPARADOR_VERIFICADO' ? '#059669'
                 : '#2D6A4F',
          }}>
            {rol === 'ADMINISTRADOR' && <ShieldCheck size={14} />}
            {rol === 'REPARADOR_VERIFICADO' && <Wrench size={14} />}
            {user?.nombre?.split(' ')[0] || 'Usuario'}
          </span>

          {/* Botón publicar: solo USUARIO_GENERAL y REPARADOR_VERIFICADO en lista */}
          {view === 'list' && rol !== 'ADMINISTRADOR' && (
            <button className="btn-primary" onClick={() => setView('create')}>
              <Plus size={18} /> Publicar
            </button>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display:'flex', alignItems:'center', gap:'6px',
              padding:'7px 14px', borderRadius:'8px', cursor:'pointer',
              background:'transparent', border:'1.5px solid #e5e7eb',
              color:'#6b7280', fontSize:'0.85rem', fontWeight:'600',
              transition:'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#ef4444'; (e.currentTarget as HTMLButtonElement).style.color='#ef4444' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.color='#6b7280' }}
          >
            <LogOut size={15} /> Salir
          </button>
        </div>
      </header>

      {/* Ruteador de Vistas */}
      {view === 'create' && <CreatePublication onBack={() => setView('list')} />}

      {view === 'edit' && (
        <CreatePublication editId={activePublicationId} onBack={() => setView('details')} />
      )}

      {view === 'details' && (
        <PublicationDetails
          publicationId={activePublicationId}
          onBack={() => setView('list')}
          onEdit={() => setView('edit')}
        />
      )}

      {view === 'tratos' && <TransactionsDashboard />}

      {view === 'reparadores' && (
        <MatchmakingReparadores
          onVerPerfil={(id) => {
            setSelectedReparadorId(id)
            setView('perfil-reparador')
          }}
        />
      )}

      {view === 'perfil-reparador' && (
        <PerfilReparador
          reparadorId={selectedReparadorId}
          onBack={() => setView('reparadores')}
          onSolicitarVerificacion={() => setView('solicitar-verificacion')}
        />
      )}

      {view === 'solicitar-verificacion' && (
        <SolicitarVerificacion onBack={() => setView('perfil-reparador')} />
      )}

      {view === 'list' && (
        <div className="dashboard-container">
          {/* Panel de Filtros */}
          <div className="filters-panel">
            <h3
              style={{
                margin: '0 0 20px',
                fontSize: '1.05rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
              }}
            >
              <SlidersHorizontal size={18} color="var(--primary)" /> Filtros de Búsqueda
            </h3>

            <form onSubmit={handleProximitySearch} className="filters-grid">
              <div className="filter-group">
                <label>Categoría</label>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Modalidad</label>
                <select value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
                  <option value="Todas">Todas</option>
                  <option value="DONACION">Donación gratuita</option>
                  <option value="VENTA">Venta</option>
                  <option value="TRUEQUE">Trueque (Intercambio)</option>
                  <option value="VENTA_PIEZAS">Venta por piezas</option>
                </select>
              </div>

              <div className="filter-group-checkbox">
                <input
                  type="checkbox"
                  id="geo-chk"
                  checked={usarGeo}
                  onChange={(e) => setUsarGeo(e.target.checked)}
                  className="custom-checkbox"
                />
                <label htmlFor="geo-chk" className="checkbox-label">
                  Buscar por cercanía
                </label>
              </div>

              {usarGeo && (
                <div className="filter-group" style={{ minWidth: '240px' }}>
                  <label>Radio de búsqueda: {radioKm} km</label>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    value={radioKm}
                    onChange={(e) => setRadioKm(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span
                    style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}
                  >
                    Coordenadas detectadas: {parseFloat(latitud).toFixed(4)},{' '}
                    {parseFloat(longitud).toFixed(4)}
                  </span>
                </div>
              )}

              {usarGeo && (
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
                    <Search size={18} /> Filtrar
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Listado Catálogo */}
          {loading ? (
            <div className="text-center" style={{ padding: '40px' }}>
              <p>Cargando catálogo de artículos...</p>
            </div>
          ) : error ? (
            <div className="error-banner text-center">{error}</div>
          ) : publications.length === 0 ? (
            <div
              className="text-center"
              style={{
                padding: '80px 40px',
                background: 'var(--card-bg, #ffffff)',
                border: '1px solid var(--border-color, #E0D9CF)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(45, 106, 79, 0.03)',
              }}
            >
              <Info size={40} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ margin: '0 0 8px', color: 'var(--primary)', fontWeight: '700' }}>
                No se encontraron artículos
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Intenta cambiando los filtros de búsqueda o sé el primero en publicar un nuevo
                equipo.
              </p>
            </div>
          ) : (
            <div className="catalog-grid">
              {publications.map((item) => {
                const coverImage =
                  item.imagenes && item.imagenes.length > 0
                    ? getImageUrl(item.imagenes[0].url)
                    : 'https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=600&auto=format&fit=crop'

                return (
                  <div
                    key={item.id}
                    className="publication-card"
                    onClick={() => {
                      setActivePublicationId(item.id)
                      setView('details')
                    }}
                  >
                    <div className="card-img-container">
                      <img src={coverImage} className="card-img" alt={item.titulo} />
                      <span className={`card-badge ${getBadgeClass(item.modalidad)}`}>
                        {getFormatModalidad(item.modalidad)}
                      </span>
                    </div>

                    <div className="card-content">
                      <span className="card-category">{item.categoria}</span>
                      <h4 className="card-title">{item.titulo}</h4>

                      <div className="card-footer">
                        <span className="card-price">
                          {item.precio !== null && item.precio !== undefined
                            ? `$${parseFloat(item.precio).toLocaleString('es-MX')} MXN`
                            : 'Gratis / Trueque'}
                        </span>

                        {item.distanciaKm !== undefined && (
                          <span className="card-dist">
                            <MapPin size={12} color="#2D6A4F" />
                            {item.distanciaKm} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
