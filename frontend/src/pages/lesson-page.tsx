import { useParams, Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLesson, useCourse } from '@/hooks/use-courses'
import { useStreamingLesson } from '@/hooks/use-agent-progress'
import { ApiError } from '@/api/client'
import { CourseSidebar } from '@/components/modules/course-sidebar'
import { CourseWorkspaceLayout } from '@/layouts/course-workspace-layout'
import { GeneratingLoader } from '@/components/modules/generating-loader'
import { LessonMarkdown } from '@/components/modules/lesson-markdown'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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

function AgentStepList({
  steps,
  currentAgent,
}: {
  steps: { agent: string; status: 'running' | 'done' }[]
  currentAgent: string | null
}) {
  const { t } = useTranslation()

  if (steps.length === 0) return null

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
      {steps.map((step) => (
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
            {t(`agents.${step.agent}`, { defaultValue: step.agent })}
          </span>
        </div>
      ))}
      {currentAgent && !steps.some((s) => s.agent === currentAgent && s.status === 'running') && (
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
          <span className="font-medium text-foreground">
            {t(`agents.${currentAgent}`, { defaultValue: currentAgent })}
          </span>
        </div>
      )}
    </div>
  )
}

function LessonContentView({
  lesson,
  streaming = false,
  steps,
  currentAgent,
  quizPath,
}: {
  lesson: Partial<LessonContent>
  streaming?: boolean
  steps?: { agent: string; status: 'running' | 'done' }[]
  currentAgent?: string | null
  quizPath?: string
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div>
        {streaming && (
          <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            {t('lesson.streaming')}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {lesson.subtopic ?? '…'}
        </h1>
        <Separator className="mt-3" />
      </div>

      {steps && <AgentStepList steps={steps} currentAgent={currentAgent ?? null} />}

      {lesson.introduction && (
        <LessonSection title={t('lesson.sections.introduction')}>
          <LessonMarkdown source={lesson.introduction} />
        </LessonSection>
      )}

      {lesson.explanation && (
        <LessonSection title={t('lesson.sections.explanation')}>
          <LessonMarkdown source={lesson.explanation} />
        </LessonSection>
      )}

      {quizPath && !streaming && (
        <div className="flex justify-end pt-2">
          <Button render={<Link to={quizPath} />}>
            {t('lesson.takeQuiz')}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      )}
    </div>
  )
}

export function LessonPage() {
  const { courseId, subtopicId } = useParams<{ courseId: string; subtopicId: string }>()
  const { t } = useTranslation()
  const cid = Number(courseId)
  const sid = Number(subtopicId)

  const { data: course } = useCourse(cid)
  const { steps, currentAgent, partialLesson, hasPartialContent, onEvent } = useStreamingLesson()
  const { data: lesson, isLoading, isError, error } = useLesson(cid, sid, onEvent)

  const apiErr = error instanceof ApiError ? error : null
  const isLocked = apiErr?.status === 403

  const quizPath = `/courses/${courseId}/subtopics/${subtopicId}/quiz`

  if (isLoading) {
    return (
      <CourseWorkspaceLayout sidebar={course ? <CourseSidebar course={course} /> : undefined}>
        {hasPartialContent ? (
          <LessonContentView
            lesson={partialLesson}
            streaming
            steps={steps}
            currentAgent={currentAgent}
          />
        ) : (
          <GeneratingLoader steps={steps} currentAgent={currentAgent} />
        )}
      </CourseWorkspaceLayout>
    )
  }

  if (isError) {
    return (
      <CourseWorkspaceLayout sidebar={course ? <CourseSidebar course={course} /> : undefined}>
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>{isLocked ? t('lesson.error.locked') : t('lesson.error.generic')}</AlertTitle>
          <AlertDescription>
            {isLocked ? t('lesson.error.lockedDesc') : (apiErr?.detail ?? '')}
          </AlertDescription>
        </Alert>
      </CourseWorkspaceLayout>
    )
  }

  if (!lesson) return null

  return (
    <CourseWorkspaceLayout sidebar={course ? <CourseSidebar course={course} /> : undefined}>
      <LessonContentView lesson={lesson} quizPath={quizPath} />
    </CourseWorkspaceLayout>
  )
}
