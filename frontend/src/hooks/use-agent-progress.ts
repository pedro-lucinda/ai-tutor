import { useCallback, useState } from 'react'
import type { AgentStreamEvent, LessonContent } from '@/types/api'

export interface AgentStep {
  agent: string
  status: 'running' | 'done'
}

interface UseAgentProgressOptions {
  trackLessonDeltas?: boolean
}

function applyAgentStart(prev: AgentStep[], agent: string): AgentStep[] {
  const completed = prev
    .filter((step) => step.agent !== agent)
    .map((step) =>
      step.status === 'running' ? { ...step, status: 'done' as const } : step,
    )
  return [...completed, { agent, status: 'running' }]
}

function applyAgentEnd(prev: AgentStep[]): AgentStep[] {
  return prev.map((step) =>
    step.status === 'running' ? { ...step, status: 'done' } : step,
  )
}

export function useAgentProgress(options: UseAgentProgressOptions = {}) {
  const { trackLessonDeltas = false } = options
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [currentAgent, setCurrentAgent] = useState<string | null>(null)
  const [partialLesson, setPartialLesson] = useState<Partial<LessonContent>>({})

  const onEvent = useCallback(
    (event: AgentStreamEvent) => {
      if (event.type === 'agent_start') {
        setCurrentAgent(event.agent)
        setSteps((prev) => applyAgentStart(prev, event.agent))
      } else if (event.type === 'agent_end') {
        setCurrentAgent(null)
        setSteps(applyAgentEnd)
      } else if (trackLessonDeltas && event.type === 'lesson_delta') {
        setPartialLesson((prev) => ({ ...prev, ...event.data }))
      }
    },
    [trackLessonDeltas],
  )

  const reset = useCallback(() => {
    setSteps([])
    setCurrentAgent(null)
    setPartialLesson({})
  }, [])

  const hasPartialContent = Object.values(partialLesson).some(
    (value) => typeof value === 'string' && value.length > 0,
  )

  return {
    steps,
    currentAgent,
    partialLesson,
    hasPartialContent,
    onEvent,
    reset,
  }
}

export function useStreamingLesson() {
  return useAgentProgress({ trackLessonDeltas: true })
}
