import React, { useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationPanel } from './NotificationPanel'
import './NotificationBell.css'

interface Props {
  token: string | null
}

export const NotificationBell: React.FC<Props> = ({ token }) => {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(token)

  if (!token) return null

  return (
    <div className="notif-bell-wrapper">
      <button
        id="notification-bell-btn"
        className="notif-bell-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
        title="Notificaciones"
      >
        <svg
          className="notif-bell-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="notif-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <NotificationPanel
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
