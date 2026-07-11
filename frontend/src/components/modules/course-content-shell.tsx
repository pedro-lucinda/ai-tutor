import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { GeneratingLoader } from '@/components/modules/generating-loader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getApiError, isLockedError } from '@/lib/api-error'
import type { AgentStep } from '@/hooks/use-agent-progress'

interface CourseContentShellProps {
  isLoading: boolean
  error?: unknown
  lockedTitle: string
  lockedDescription: string
  errorTitle: string
  steps?: AgentStep[]
  currentAgent?: string | null
  loadingContent?: ReactNode
  children: ReactNode
}

export function CourseContentShell({
  isLoading,
  error,
  lockedTitle,
  lockedDescription,
  errorTitle,
  steps,
  currentAgent,
  loadingContent,
  children,
}: CourseContentShellProps) {
  if (isLoading) {
    return loadingContent ?? (
      <GeneratingLoader steps={steps} currentAgent={currentAgent ?? null} />
    )
  }

  if (error) {
    const locked = isLockedError(error)
    const { detail } = getApiError(error)
    return (
      <Alert>
        <AlertCircle className="size-4" />
        <AlertTitle>{locked ? lockedTitle : errorTitle}</AlertTitle>
        <AlertDescription>{locked ? lockedDescription : detail}</AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}
