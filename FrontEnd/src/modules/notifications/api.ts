export const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export interface Notificacion {
  id: string;
  tipo:
    | 'INTERES_EN_PUBLICACION'
    | 'CAMBIO_ESTADO_TRANSACCION'
    | 'NUEVA_PUBLICACION_FAVORITA'
    | 'CALIFICACION_RECIBIDA'
    | 'SOLICITUD_VERIFICACION'
    | 'VERIFICACION_APROBADA';
  titulo: string;
  mensaje: string;
  leida: boolean;
  referenciaId: string | null;
  referenciaTipo: 'publicacion' | 'transaccion' | 'calificacion' | null;
  fechaCreacion: string;
  fechaLectura: string | null;
}

export interface ConteoNoLeidas {
  total: number;
}

export async function getNotifications(token: string): Promise<Notificacion[]> {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getUnreadCount(token: string): Promise<number> {
  const res = await fetch(`${API_BASE}/notifications/count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return 0;
  const data: ConteoNoLeidas = await res.json();
  return data.total;
}

export async function markAsRead(id: string, token: string): Promise<void> {
  await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function markAllAsRead(token: string): Promise<void> {
  await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}
