import axios from 'axios'

export function apiErrorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.') {
  if (axios.isAxiosError(error)) {
    const value = error.response?.data
    if (typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string') return value.message
    if (error.code === 'ERR_NETWORK') return 'A conexão falhou. Tente novamente.'
  }
  return fallback
}
