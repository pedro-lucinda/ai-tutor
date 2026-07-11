import { Link } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AgentStepList } from '@/components/modules/agent-step-list'
import { LessonMarkdown } from '@/components/modules/lesson-markdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { AgentStep } from '@/hooks/use-agent-progress'
import type { LessonContent } from '@/types/api'

function LessonSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface LessonContentViewProps {
  lesson: Partial<LessonContent>
  streaming?: boolean
  steps?: AgentStep[]
  currentAgent?: string | null
  quizPath?: string
}

export function LessonContentView({
  lesson,
  streaming = false,
  steps,
  currentAgent,
  quizPath,
}: LessonContentViewProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div>
        {streaming ? (
          <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            {t('lesson.streaming')}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {lesson.subtopic ?? '…'}
        </h1>
        <Separator className="mt-3" />
      </div>

      {steps && steps.length > 0 ? (
        <AgentStepList steps={steps} currentAgent={currentAgent ?? null} />
      ) : null}

      {lesson.introduction ? (
        <LessonSection title={t('lesson.sections.introduction')}>
          <LessonMarkdown source={lesson.introduction} />
        </LessonSection>
      ) : null}

      {lesson.explanation ? (
        <LessonSection title={t('lesson.sections.explanation')}>
          <LessonMarkdown source={lesson.explanation} />
        </LessonSection>
      ) : null}

      {quizPath && !streaming ? (
        <div className="flex justify-end pt-2">
          <Button render={<Link to={quizPath} />}>
            {t('lesson.takeQuiz')}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
