import { useEffect, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AgentStepList } from '@/components/modules/agent-step-list'
import { filterVisibleAgentSteps } from '@/lib/agent-label'
import type { AgentStep } from '@/hooks/use-agent-progress'

interface GeneratingLoaderProps {
  label?: string
  steps?: AgentStep[]
  currentAgent?: string | null
}

const PHASE_DELAYS = [0, 4000, 12000, 30000] as const

export function GeneratingLoader({ label, steps, currentAgent }: GeneratingLoaderProps) {
  const { t } = useTranslation()
  const [phaseIndex, setPhaseIndex] = useState(0)
  const hasLiveSteps = steps ? filterVisibleAgentSteps(steps).length > 0 : false

  useEffect(() => {
    const timers = PHASE_DELAYS.slice(1).map((delay, index) =>
      setTimeout(() => setPhaseIndex(index + 1), delay),
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  const phaseKey = `agents.phases.${phaseIndex}` as const
  const isGenerating = phaseIndex >= 1

  return (
    <div className="flex w-full flex-col items-center justify-center gap-6 py-16">
      <div className="relative flex items-center justify-center">
        <Loader2 className="size-12 animate-spin text-muted-foreground" />
        {(isGenerating || hasLiveSteps) && (
          <Sparkles className="absolute size-5 animate-pulse text-primary" />
        )}
      </div>

      <div className="max-w-sm text-center">
        <p className="font-medium text-foreground">
          {label ?? (hasLiveSteps ? t('agents.working') : t(phaseKey))}
        </p>
        {(isGenerating || hasLiveSteps) && !label ? (
          <p className="mt-1 text-sm text-muted-foreground">{t('agents.cachingNote')}</p>
        ) : null}
      </div>

      {hasLiveSteps && steps ? (
        <AgentStepList
          steps={steps}
          currentAgent={currentAgent ?? null}
          className="mx-auto w-full max-w-sm"
        />
      ) : null}
    </div>
  )
}
