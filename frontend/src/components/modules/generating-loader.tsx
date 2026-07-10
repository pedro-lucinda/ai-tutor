import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getAgentLabel, filterVisibleAgentSteps } from '@/lib/agent-label'
import type { AgentStep } from '@/hooks/use-agent-progress'

interface GeneratingLoaderProps {
  label?: string
  steps?: AgentStep[]
  currentAgent?: string | null
}

const PHASES = [
  { delay: 0, text: 'Loading…' },
  { delay: 4000, text: 'Generating content with AI…' },
  { delay: 12000, text: 'Almost there — this only happens once…' },
  { delay: 30000, text: 'Still working — complex topics take a bit longer…' },
]

export function GeneratingLoader({
  label,
  steps,
  currentAgent,
}: GeneratingLoaderProps) {
  const { t } = useTranslation()
  const [phaseIndex, setPhaseIndex] = useState(0)
  const hasLiveSteps = steps && filterVisibleAgentSteps(steps).length > 0
  const visibleSteps = steps ? filterVisibleAgentSteps(steps) : []
  const visibleCurrentAgent =
    currentAgent && getAgentLabel(currentAgent, t) ? currentAgent : null

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    PHASES.slice(1).forEach((phase, i) => {
      timers.push(setTimeout(() => setPhaseIndex(i + 1), phase.delay))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  const phase = PHASES[phaseIndex]
  const isGenerating = phaseIndex >= 1

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 w-full">
      <div className="relative flex items-center justify-center">
        <Loader2 className="size-12 animate-spin text-muted-foreground" />
        {(isGenerating || hasLiveSteps) && (
          <Sparkles className="absolute size-5 text-primary animate-pulse" />
        )}
      </div>

      <div className="text-center max-w-sm">
        <p className="font-medium text-foreground">
          {label ?? (hasLiveSteps ? t('agents.working') : phase.text)}
        </p>
        {(isGenerating || hasLiveSteps) && !label && (
          <p className="mt-1 text-sm text-muted-foreground">
            {t('agents.cachingNote')}
          </p>
        )}
      </div>

      {/* Live agent step list (shown when SSE events are coming in) */}
      {hasLiveSteps && (
        <div className="w-full max-w-sm flex flex-col gap-2  mx-auto ">
          {visibleSteps.map((step) => {
            const label = getAgentLabel(step.agent, t)
            if (!label) return null
            return (
            <div key={step.agent} className="flex items-center gap-2 text-sm mx-auto">
              {step.status === 'done' ? (
                <CheckCircle2 className="size-4 text-green-500 shrink-0" />
              ) : (
                <Loader2 className="size-4 animate-spin text-primary shrink-0" />
              )}
              <span
                className={
                  step.status === 'done'
                    ? 'text-muted-foreground line-through'
                    : 'text-foreground font-medium'
                }
              >
                {label}
              </span>
            </div>
            )
          })}
          {visibleCurrentAgent &&
            !visibleSteps.some((s) => s.agent === visibleCurrentAgent && s.status === 'running') && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin text-primary shrink-0" />
              <span className="text-foreground font-medium">
                {getAgentLabel(visibleCurrentAgent, t)}
              </span>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
