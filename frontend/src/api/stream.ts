/**
 * SSE consumer that works for both GET and POST requests.
 *
 * When the server responds with `application/json` (cache hit), returns the
 * parsed JSON directly without SSE parsing.
 *
 * When the server responds with `text/event-stream`, parses `data: {...}\n\n`
 * lines, calls `onEvent` for each event, and resolves when a `complete` event
 * arrives (returning `complete.data`) or rejects on an `error` event.
 */

import type { AgentStreamEvent } from '@/types/api'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

export async function consumeSSE<T>(
  path: string,
  options: RequestInit,
  onEvent?: (event: AgentStreamEvent) => void,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options)

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const json = await res.json()
      detail = json.detail ?? detail
    } catch {
      // ignore parse errors
    }
    throw new Error(detail)
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    // Cache hit — server returned plain JSON, no streaming needed
    return res.json() as Promise<T>
  }

  // SSE stream — read line by line
  if (!res.body) throw new Error('Response body is null')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Split on double newlines (SSE message boundaries)
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
