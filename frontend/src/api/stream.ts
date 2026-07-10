/**
 * SSE consumer that works for both GET and POST requests.
 */

import type { AgentStreamEvent } from '@/types/api'
import { getAuthHeaders, triggerUnauthorized } from './auth'
import { BASE } from './client'

export class StreamError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'StreamError'
    this.status = status
  }
}

export async function consumeSSE<T>(
  path: string,
  options: RequestInit,
  onEvent?: (event: AgentStreamEvent) => void,
): Promise<T> {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  })

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const json = await res.json()
      detail = json.detail ?? detail
    } catch {
      // ignore parse errors
    }
    if (res.status === 401) {
      triggerUnauthorized()
    }
    throw new StreamError(res.status, detail)
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>
  }

  if (!res.body) throw new Error('Response body is null')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      const dataLine = part
        .split('\n')
        .find((l) => l.startsWith('data: '))
      if (!dataLine) continue

      let event: AgentStreamEvent
      try {
        event = JSON.parse(dataLine.slice(6)) as AgentStreamEvent
      } catch {
        continue
      }

      onEvent?.(event)

      if (event.type === 'complete') {
        reader.cancel()
        return event.data as T
      }

      if (event.type === 'error') {
        reader.cancel()
        throw new Error((event as { type: 'error'; message: string }).message)
      }
    }
  }

  throw new Error('SSE stream ended without a complete event')
}
