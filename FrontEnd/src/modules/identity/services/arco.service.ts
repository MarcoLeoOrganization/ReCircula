const API_URL = 'http://localhost:3000/api/v1/arco'

export const arcoService = {
  async solicitarAcceso(token: string) {
    const res = await fetch(`${API_URL}/acceso`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) throw new Error('Error al solicitar datos ARCO')
    return res.json()
  },

  async oponerMatchmaking(token: string, permitirMatchmaking: boolean) {
    const res = await fetch(`${API_URL}/oposicion`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ permitirMatchmaking }),
    })
    if (!res.ok) throw new Error('Error al actualizar preferencias')
    return res.json()
  },

  async cancelarCuenta(token: string) {
    const res = await fetch(`${API_URL}/cancelar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) throw new Error('Error al cancelar la cuenta')
    return res.json()
  },
}
