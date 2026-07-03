import React, { useRef, useEffect } from 'react'
import type { Notificacion } from '../api'
import { useNavigate } from 'react-router-dom'
import './NotificationPanel.css'

interface Props {
  notifications: Notificacion[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onClose: () => void
}

function tipoIcono(tipo: Notificacion['tipo']): string {
  switch (tipo) {
    case 'INTERES_EN_PUBLICACION':
      return '🤝'
    case 'CAMBIO_ESTADO_TRANSACCION':
      return '🔄'
    case 'NUEVA_PUBLICACION_FAVORITA':
      return '⭐'
    case 'CALIFICACION_RECIBIDA':
      return '⭐'
    case 'SOLICITUD_VERIFICACION':
      return '🔍'
    case 'VERIFICACION_APROBADA':
      return '✅'
    default:
      return '🔔'
  }
}

function tiempoRelativo(fechaStr: string): string {
  const ahora = Date.now()
  const fecha = new Date(fechaStr).getTime()
  const diffMs = ahora - fecha
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Hace un momento'
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH} h`
  const diffD = Math.floor(diffH / 24)
  return `Hace ${diffD} día${diffD > 1 ? 's' : ''}`
}

export const NotificationPanel: React.FC<Props> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}) => {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera del panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleClick = (notif: Notificacion) => {
    if (!notif.leida) onMarkAsRead(notif.id)
    if (notif.referenciaTipo === 'publicacion' && notif.referenciaId) {
      navigate(`/publications/${notif.referenciaId}`)
      onClose()
    } else if (notif.referenciaTipo === 'transaccion' && notif.referenciaId) {
      navigate(`/transactions`)
      onClose()
    }
  }

  const hayNoLeidas = notifications.some((n) => !n.leida)

  return (
    <div className="notif-panel" ref={panelRef}>
      <div className="notif-panel__header">
        <h3 className="notif-panel__title">🔔 Notificaciones</h3>
        {hayNoLeidas && (
          <button className="notif-panel__mark-all" onClick={onMarkAllAsRead}>
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="notif-panel__list">
        {notifications.length === 0 ? (
          <div className="notif-panel__empty">
            <span>No tienes notificaciones</span>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notif-item ${!notif.leida ? 'notif-item--unread' : ''}`}
              onClick={() => handleClick(notif)}
            >
              <span className="notif-item__icon">{tipoIcono(notif.tipo)}</span>
              <div className="notif-item__content">
                <p className="notif-item__title">{notif.titulo}</p>
                <p className="notif-item__msg">{notif.mensaje}</p>
                <span className="notif-item__time">{tiempoRelativo(notif.fechaCreacion)}</span>
              </div>
              {!notif.leida && <span className="notif-item__dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
