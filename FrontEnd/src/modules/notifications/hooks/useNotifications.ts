import { useState, useEffect, useCallback } from 'react'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, API_BASE } from '../api'
import type { Notificacion } from '../api'

export function useNotifications(token: string | null) {
  const [notifications, setNotifications] = useState<Notificacion[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [list, count] = await Promise.all([getNotifications(token), getUnreadCount(token)])
      setNotifications(list)
      setUnreadCount(count)
    } catch {
      // Silencioso — no queremos alertas de red en la campanita
    } finally {
      setLoading(false)
    }
  }, [token])

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      if (!token) return
      await markAsRead(id, token)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    },
    [token]
  )

  const handleMarkAllAsRead = useCallback(async () => {
    if (!token) return
    await markAllAsRead(token)
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })))
    setUnreadCount(0)
  }, [token])

  // Carga inicial y suscripción SSE (Latencia <= 2s)
  useEffect(() => {
    if (!token) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll()

    const url = `${API_BASE}/notifications/stream`
    const eventSource = new EventSource(url, { withCredentials: true })

    eventSource.onmessage = (event) => {
      try {
        const nuevaNotificacion = JSON.parse(event.data)
        if (nuevaNotificacion.type === 'ping') return
        setNotifications((prev) => [nuevaNotificacion, ...prev])
        setUnreadCount((prev) => prev + 1)
      } catch (err) {
        console.error('Error parseando notificación SSE', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('Error en SSE:', err)
      // El navegador intentará reconectar automáticamente al fallar
    }

    return () => {
      eventSource.close()
    }
  }, [token, fetchAll])

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchAll,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
  }
}
