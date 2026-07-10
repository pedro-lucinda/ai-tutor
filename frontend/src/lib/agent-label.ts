import type { TFunction } from 'i18next'

const KNOWN_AGENTS = new Set([
  'learning-planner',
  'curriculum-researcher',
  'course-builder',
  'validator',
  'content-generator',
  'quiz-generator',
])

/** Internal LangGraph/DeepAgents names that should not appear in the UI. */
const HIDDEN_AGENTS = new Set(['general-purpose'])

export function getAgentLabel(agent: string, t: TFunction): string | null {
  const name = agent.trim()
  if (!name || HIDDEN_AGENTS.has(name)) {
    return null
  }

  if (!KNOWN_AGENTS.has(name)) {
    return null
  }

  return t(`agents.${name}`)
}

export function filterVisibleAgentSteps<T extends { agent: string }>(steps: T[]): T[] {
  return steps.filter((step) => !HIDDEN_AGENTS.has(step.agent))
}
