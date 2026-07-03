/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE_URL = '/api/v1'

export interface FiltrosBusqueda {
  latitud?: number
  longitud?: number
  radioKm?: number
  categoria?: string
  modalidad?: string
}

export const publicationsApi = {
  async getPublications(filtros: FiltrosBusqueda = {}) {
    const params = new URLSearchParams()
    if (filtros.latitud !== undefined && filtros.longitud !== undefined) {
      params.append('latitud', filtros.latitud.toString())
      params.append('longitud', filtros.longitud.toString())
      if (filtros.radioKm) params.append('radioKm', filtros.radioKm.toString())
    }
    if (filtros.categoria) params.append('categoria', filtros.categoria)
    if (filtros.modalidad) params.append('modalidad', filtros.modalidad)

    const res = await fetch(`${API_BASE_URL}/publications?${params.toString()}`)
    if (!res.ok) {
      throw new Error('Error al obtener las publicaciones')
    }
    return res.json()
  },

  async getPublicationDetail(id: string) {
    const res = await fetch(`${API_BASE_URL}/publications/${id}`)
    if (!res.ok) {
      throw new Error('Error al obtener el detalle de la publicación')
    }
    return res.json()
  },

  async createPublication(formData: FormData, token: string) {
    const res = await fetch(`${API_BASE_URL}/publications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Nota: NO definir 'Content-Type' aquí, el navegador lo definirá
        // automáticamente junto con el boundary del multipart/form-data
      },
      body: formData,
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || 'Error al crear la publicación')
    }
    return res.json()
  },

  async updatePublication(id: string, data: any, token: string) {
    const res = await fetch(`${API_BASE_URL}/publications/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || 'Error al actualizar la publicación')
    }
    return res.json()
  },

  async archivePublication(id: string, token: string) {
    const res = await fetch(`${API_BASE_URL}/publications/${id}/archive`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || 'Error al archivar la publicación')
    }
    return res.json()
  },

  async proposeTransaction(
    data: { publicacionId: string; modalidad: string; precioAcordado?: number; notas?: string },
    token: string
  ) {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || 'Error al proponer el trato')
    }
    return res.json()
  },

  async getTransactions(token: string) {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || 'Error al obtener transacciones')
    }
    return res.json()
  },

  async acceptTransaction(id: string, token: string) {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}/accept`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || 'Error al aceptar el trato')
    }
    return res.json()
  },

  async cancelTransaction(id: string, notas: string, token: string) {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ notas }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || 'Error al cancelar el trato')
    }
    return res.json()
  },

  async confirmTransaction(id: string, token: string) {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}/confirm`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || 'Error al confirmar el trato')
    }
    return res.json()
  },

  async getHistoryByPublicationId(publicationId: string) {
    const res = await fetch(`${API_BASE_URL}/history/publication/${publicationId}`)
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || 'Error al obtener el historial')
    }
    return res.json()
  },

  async addRepairEntry(
    publicationId: string,
    data: { descripcion: string; piezasReemplazadas?: string[]; estadoResultante?: string },
    token: string
  ) {
    const res = await fetch(`${API_BASE_URL}/history/publication/${publicationId}/repair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || 'Error al registrar la reparación')
    }
    return res.json()
  },
}

export const matchmakingApi = {
  async getPublicaciones(filtros: FiltrosBusqueda = {}) {
    const params = new URLSearchParams()
    if (filtros.latitud !== undefined && filtros.longitud !== undefined) {
      params.append('latitud', filtros.latitud.toString())
      params.append('longitud', filtros.longitud.toString())
      if (filtros.radioKm) params.append('radioKm', filtros.radioKm.toString())
    }
    if (filtros.categoria) params.append('categoria', filtros.categoria)
    if (filtros.modalidad) params.append('modalidad', filtros.modalidad)

    const res = await fetch(`${API_BASE_URL}/matchmaking/publicaciones?${params.toString()}`)
    if (!res.ok) {
      throw new Error('Error al obtener publicaciones cercanas')
    }
    return res.json()
  },

  async getReparadores(filtros: { latitud: number; longitud: number; categoria: string; radioKm?: number }) {
    const params = new URLSearchParams()
    params.append('latitud', filtros.latitud.toString())
    params.append('longitud', filtros.longitud.toString())
    params.append('categoria', filtros.categoria)
    if (filtros.radioKm) params.append('radioKm', filtros.radioKm.toString())

    const res = await fetch(`${API_BASE_URL}/matchmaking/reparadores?${params.toString()}`)
    if (!res.ok) {
      throw new Error('Error al buscar reparadores cercanos')
    }
    return res.json()
  },
}

export const reputationApi = {
  async crearCalificacion(
    data: { transaccionId: string; puntuacion: number; comentario?: string },
    token: string,
  ) {
    const res = await fetch(`${API_BASE_URL}/reputation/calificaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Error al enviar calificación')
    }
    return res.json()
  },

  async getCalificaciones(usuarioId: string, token: string) {
    const res = await fetch(`${API_BASE_URL}/reputation/calificaciones/${usuarioId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Error al obtener calificaciones')
    return res.json()
  },

  async getPerfilReparador(reparadorId: string) {
    const res = await fetch(`${API_BASE_URL}/reputation/reparadores/${reparadorId}/perfil`)
    if (!res.ok) throw new Error('Perfil de reparador no encontrado')
    return res.json()
  },

  async solicitarVerificacion(formData: FormData, token: string) {
    const res = await fetch(`${API_BASE_URL}/reputation/verificacion/solicitar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Error al enviar solicitud de verificación')
    }
    return res.json()
  },

  async getSolicitudesPendientes(token: string) {
    const res = await fetch(`${API_BASE_URL}/reputation/verificacion/pendientes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Error al obtener solicitudes pendientes')
    return res.json()
  },

  async revisarSolicitud(
    id: string,
    decision: 'APROBADA' | 'RECHAZADA',
    notasAdmin: string | undefined,
    token: string,
  ) {
    const res = await fetch(`${API_BASE_URL}/reputation/verificacion/${id}/revisar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ decision, notasAdmin }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Error al revisar solicitud')
    }
    return res.json()
  },
}
