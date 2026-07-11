import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteOpenAIKey,
  getOpenAIKeyStatus,
  saveOpenAIKey,
  validateOpenAIKey,
} from '@/api/settings'
import { getApiError } from '@/lib/api-error'

const OPENAI_KEY_QUERY_KEY = ['settings', 'openai'] as const

export function useOpenAIKeyStatus() {
  return useQuery({
    queryKey: OPENAI_KEY_QUERY_KEY,
    queryFn: getOpenAIKeyStatus,
  })
}

export function useSaveOpenAIKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveOpenAIKey,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OPENAI_KEY_QUERY_KEY })
    },
  })
}

export function useValidateOpenAIKey() {
  return useMutation({
    mutationFn: validateOpenAIKey,
  })
}

export function useDeleteOpenAIKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteOpenAIKey,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OPENAI_KEY_QUERY_KEY })
    },
  })
}

export function getSettingsErrorMessage(error: unknown, fallback: string): string {
  return getApiError(error).detail || fallback
}
