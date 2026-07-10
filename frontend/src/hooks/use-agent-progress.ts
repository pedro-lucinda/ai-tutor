import { useCallback, useState } from 'react'
import type { AgentStreamEvent, LessonContent } from '@/types/api'

export interface AgentStep {
  agent: string
  status: 'running' | 'done'
}

// The agent pipeline is conceptually sequential (generate → validate → maybe
// regenerate), but the backend can emit start/end events that interleave. To
// avoid showing two steps as "running" at once (or a later step finishing
// before an earlier one), we serialize the display: starting any agent marks
// all in-flight steps as done, and the freshly started agent is always the
// single active step, moved to the end so the list reads chronologically.
function applyAgentStart(prev: AgentStep[], agent: string): AgentStep[] {
  const completed = prev
    .filter((s) => s.agent !== agent)
    .map((s) => (s.status === 'running' ? { ...s, status: 'done' as const } : s))
  return [...completed, { agent, status: 'running' }]
}

// At most one step is ever running (see applyAgentStart), so ending simply
// completes any in-flight step regardless of which agent the event names.
function applyAgentEnd(prev: AgentStep[]): AgentStep[] {
  return prev.map((s) => (s.status === 'running' ? { ...s, status: 'done' } : s))
}

export function useAgentProgress() {
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [currentAgent, setCurrentAgent] = useState<string | null>(null)

  const onEvent = useCallback((event: AgentStreamEvent) => {
    if (event.type === 'agent_start') {
      setCurrentAgent(event.agent)
      setSteps((prev) => applyAgentStart(prev, event.agent))
    } else if (event.type === 'agent_end') {
      setCurrentAgent(null)
      setSteps(applyAgentEnd)
    }
  }, [])

  const reset = useCallback(() => {
    setSteps([])
    setCurrentAgent(null)
  }, [])

  return { steps, currentAgent, onEvent, reset }
}

export function useStreamingLesson() {
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [currentAgent, setCurrentAgent] = useState<string | null>(null)
  const [partialLesson, setPartialLesson] = useState<Partial<LessonContent>>({})

  const onEvent = useCallback((event: AgentStreamEvent) => {
    if (event.type === 'agent_start') {
      setCurrentAgent(event.agent)
      setSteps((prev) => applyAgentStart(prev, event.agent))
    } else if (event.type === 'agent_end') {
      setCurrentAgent(null)
      setSteps(applyAgentEnd)
    } else if (event.type === 'lesson_delta') {
      setPartialLesson((prev) => ({ ...prev, ...event.data }))
    }
  }, [])

  const reset = useCallback(() => {
    setSteps([])
    setCurrentAgent(null)
    setPartialLesson({})
  }, [])

  const hasPartialContent = Object.values(partialLesson).some(
    (value) => typeof value === 'string' && value.length > 0,
  )

  return { steps, currentAgent, partialLesson, hasPartialContent, onEvent, reset }
}
