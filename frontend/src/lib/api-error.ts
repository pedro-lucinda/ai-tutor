import { ApiError } from '@/api/client'
import { StreamError } from '@/api/stream'

export function getApiError(error: unknown): { status?: number; detail: string } {
  if (error instanceof ApiError || error instanceof StreamError) {
    return { status: error.status, detail: error.message }
  }
  if (error instanceof Error) {
    return { detail: error.message }
  }
  return { detail: 'Unknown error' }
}

export function isLockedError(error: unknown): boolean {
  return getApiError(error).status === 403
}
