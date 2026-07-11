import { CheckCircle2, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getAgentLabel, filterVisibleAgentSteps } from '@/lib/agent-label'
import type { AgentStep } from '@/hooks/use-agent-progress'
import { cn } from '@/lib/utils'

interface AgentStepListProps {
  steps: AgentStep[]
  currentAgent: string | null
  className?: string
}

export function AgentStepList({ steps, currentAgent, className }: AgentStepListProps) {
  const { t } = useTranslation()

  const visibleSteps = filterVisibleAgentSteps(steps)
  const visibleCurrentAgent =
    currentAgent && getAgentLabel(currentAgent, t) ? currentAgent : null

  if (visibleSteps.length === 0 && !visibleCurrentAgent) return null

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3',
        className,
      )}
    >
      {visibleSteps.map((step) => {
        const label = getAgentLabel(step.agent, t)
        if (!label) return null
        return (
          <div key={step.agent} className="flex items-center gap-2 text-sm">
            {step.status === 'done' ? (
              <CheckCircle2 className="size-4 shrink-0 text-green-500" />
            ) : (
              <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
            )}
            <span
              className={
                step.status === 'done'
                  ? 'text-muted-foreground line-through'
                  : 'font-medium text-foreground'
              }
            >
              {label}
            </span>
          </div>
        )
      })}
      {visibleCurrentAgent &&
        !visibleSteps.some(
          (step) => step.agent === visibleCurrentAgent && step.status === 'running',
        ) && (
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
            <span className="font-medium text-foreground">
              {getAgentLabel(visibleCurrentAgent, t)}
            </span>
          </div>
        )}
    </div>
  )
}
