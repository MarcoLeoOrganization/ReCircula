import { useState, useEffect, useCallback, useRef } from 'react'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../api'
import type { Notificacion } from '../api'

const POLLING_INTERVAL_MS = 30_000 // 30 segundos

export function useNotifications(token: string | null) {
  const [notifications, setNotifications] = useState<Notificacion[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Carga inicial y polling cada 30 segundos
  useEffect(() => {
    if (!token) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll()

    intervalRef.current = setInterval(fetchAll, POLLING_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
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
