import { api } from './client'

export type OpenAIKeyStatus = {
  configured: boolean
  key_last4: string | null
}

export function getOpenAIKeyStatus() {
  return api.get<OpenAIKeyStatus>('/settings/openai')
}

export function saveOpenAIKey(apiKey: string) {
  return api.put<OpenAIKeyStatus>('/settings/openai', { api_key: apiKey })
}

export function deleteOpenAIKey() {
  return api.delete('/settings/openai')
}

export function validateOpenAIKey(apiKey: string) {
  return api.post<{ valid: boolean }>('/settings/openai/validate', { api_key: apiKey })
}
