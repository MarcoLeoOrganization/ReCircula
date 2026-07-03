/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Shield, Download, FileEdit, UserX, AlertTriangle, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { arcoService } from '../services/arco.service'

export default function ArcoDashboard() {
  const { token, user, clearSession } = useAuthStore()
  const [loadingAcceso, setLoadingAcceso] = useState(false)
  const [loadingOposicion, setLoadingOposicion] = useState(false)
  const [loadingCancelacion, setLoadingCancelacion] = useState(false)
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null)

  // Asumimos true por defecto, o false si no existe la propiedad.
  // En un entorno real el user object tendría user.permitirMatchmaking desde el backend.
  const [permitirMatchmaking, setPermitirMatchmaking] = useState(true)

  if (!user || !token) return null

  const handleAcceso = async () => {
    setLoadingAcceso(true)
    setMensaje(null)
    try {
      const res = await arcoService.solicitarAcceso(token)
      setMensaje({ texto: res.message, tipo: 'success' })
    } catch (err: any) {
      setMensaje({ texto: err.message, tipo: 'error' })
    } finally {
      setLoadingAcceso(false)
    }
  }

  const handleOposicion = async () => {
    setLoadingOposicion(true)
    setMensaje(null)
    try {
      const newVal = !permitirMatchmaking
      const res = await arcoService.oponerMatchmaking(token, newVal)
      setPermitirMatchmaking(newVal)
      setMensaje({ texto: res.message, tipo: 'success' })
    } catch (err: any) {
      setMensaje({ texto: err.message, tipo: 'error' })
    } finally {
      setLoadingOposicion(false)
    }
  }

  const handleCancelacion = async () => {
    const confirm = window.confirm(
      '🚨 ATENCIÓN: Esta acción es IRREVERSIBLE. Se eliminará tu cuenta y tus datos personales serán anonimizados de forma permanente. ¿Estás absolutamente seguro de continuar?'
    )
    if (!confirm) return

    setLoadingCancelacion(true)
    setMensaje(null)
    try {
      const res = await arcoService.cancelarCuenta(token)
      alert(res.message)
      clearSession() // Fuerza el cierre de sesión porque la cuenta ya no es válida
      window.location.href = '/'
    } catch (err: any) {
      setMensaje({ texto: err.message, tipo: 'error' })
      setLoadingCancelacion(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <Shield size={28} color="#2D6A4F" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
          Privacidad y Derechos ARCO
        </h2>
      </div>

      <p style={{ color: '#4b5563', marginBottom: '2rem' }}>
        En ReCircula nos tomamos muy en serio tu privacidad. A continuación, puedes ejercer tus
        derechos de Acceso, Rectificación, Cancelación y Oposición respecto a tus datos personales.
      </p>

      {mensaje && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            backgroundColor: mensaje.tipo === 'success' ? '#d1fae5' : '#fee2e2',
            color: mensaje.tipo === 'success' ? '#065f46' : '#991b1b',
            borderLeft: `4px solid ${mensaje.tipo === 'success' ? '#10b981' : '#ef4444'}`,
          }}
        >
          {mensaje.texto}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Derecho de Acceso */}
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            backgroundColor: '#fff',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}
          >
            <Download size={20} color="#2D6A4F" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Derecho de Acceso</h3>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Solicita una copia de todos los datos personales que tenemos sobre ti. Recibirás un
            resumen en tu correo registrado.
          </p>
          <button
            onClick={handleAcceso}
            disabled={loadingAcceso}
            className="btn-primary"
            style={{ width: 'fit-content' }}
          >
            {loadingAcceso ? <Loader2 size={16} className="animate-spin" /> : 'Descargar mis datos'}
          </button>
        </div>

        {/* Derecho de Rectificación */}
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            backgroundColor: '#fff',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}
          >
            <FileEdit size={20} color="#d97706" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Derecho de Rectificación</h3>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Si tus datos son inexactos o están incompletos, puedes modificarlos directamente desde
            la configuración de tu perfil.
          </p>
          <button
            onClick={() =>
              alert('Para rectificar tus datos, edita tu información en la sección de "Mi Perfil".')
            }
            className="btn-secondary"
            style={{ width: 'fit-content' }}
          >
            Modificar mi perfil
          </button>
        </div>

        {/* Derecho de Oposición */}
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            backgroundColor: '#fff',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}
          >
            <EyeOff size={20} color="#4f46e5" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Derecho de Oposición</h3>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Oponte al uso de tus datos para fines secundarios. Si desactivas esta opción, no
            aparecerás en los resultados del sistema de Matchmaking automatizado.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleOposicion}
              disabled={loadingOposicion}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: permitirMatchmaking ? '#10b981' : '#e5e7eb',
                color: permitirMatchmaking ? 'white' : '#4b5563',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {loadingOposicion && <Loader2 size={16} className="animate-spin" />}
              {permitirMatchmaking ? '✅ Matchmaking Permitido' : '❌ Matchmaking Desactivado'}
            </button>
          </div>
        </div>

        {/* Derecho de Cancelación */}
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            backgroundColor: '#fef2f2',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '0.5rem',
              color: '#991b1b',
            }}
          >
            <AlertTriangle size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Derecho de Cancelación</h3>
          </div>
          <p style={{ color: '#991b1b', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Al solicitar la cancelación, tu cuenta será desactivada y todos tus datos personales
            identificables (nombre, correo) serán anonimizados de nuestros registros
            permanentemente.
          </p>
          <button
            onClick={handleCancelacion}
            disabled={loadingCancelacion}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#ef4444',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {loadingCancelacion ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <UserX size={18} /> Eliminar mi cuenta permanentemente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
