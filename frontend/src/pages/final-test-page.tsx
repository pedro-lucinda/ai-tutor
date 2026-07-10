import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Loader2, Medal, Star, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFinalTest, useCourse } from '@/hooks/use-courses'
import { useAgentProgress } from '@/hooks/use-agent-progress'
import { submitFinalTest } from '@/api/progress'
import { ApiError } from '@/api/client'
import type { FinalTestSubmitResult } from '@/types/api'
import { QuizForm } from '@/components/modules/quiz-form'
import { CourseSidebar } from '@/components/modules/course-sidebar'
import { CourseWorkspaceLayout } from '@/layouts/course-workspace-layout'
import { GeneratingLoader } from '@/components/modules/generating-loader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const MASTERY_ICONS = {
  review: AlertCircle,
  pass: Medal,
  mastered: Trophy,
}

export function FinalTestPage() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>()
  const { t } = useTranslation()
  const cid = Number(courseId)
  const mid = Number(moduleId)

  const queryClient = useQueryClient()
  const { data: course } = useCourse(cid)
  const { steps, currentAgent, onEvent } = useAgentProgress()
  const { data: test, isLoading, isError, error } = useFinalTest(cid, mid, onEvent)

  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<FinalTestSubmitResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const apiErr = error instanceof ApiError ? error : null

  function handleAnswer(qi: number, oi: number) {
    setAnswers((prev) => {
      const next = [...prev]
      next[qi] = oi
      return next
    })
  }

  const allAnswered = test && answers.filter((a) => a !== null).length === test.questions.length

  async function handleSubmit() {
    if (!test || !allAnswered) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await submitFinalTest(cid, mid, answers as number[])
      setResult(res)
      queryClient.invalidateQueries({ queryKey: ['progress', cid] })
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.detail : t('finalTest.submissionError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <CourseWorkspaceLayout sidebar={course ? <CourseSidebar course={course} /> : undefined}>
        <GeneratingLoader steps={steps} currentAgent={currentAgent} />
      </CourseWorkspaceLayout>
    )
  }

  if (isError) {
    return (
      <CourseWorkspaceLayout sidebar={course ? <CourseSidebar course={course} /> : undefined}>
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>{t('finalTest.error.generic')}</AlertTitle>
          <AlertDescription>{apiErr?.detail ?? ''}</AlertDescription>
        </Alert>
      </CourseWorkspaceLayout>
    )
  }

  if (!test) return null

  const moduleName = course?.modules.find((m) => m.id === mid)?.name

  return (
    <CourseWorkspaceLayout sidebar={course ? <CourseSidebar course={course} /> : undefined}>
      <div className="flex flex-col gap-4 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Star className="size-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('finalTest.title')}{moduleName ? `: ${moduleName}` : ''}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('finalTest.questions', { count: test.questions.length })}
          </p>
          <Separator className="mt-3" />
        </div>

        {result ? (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {(() => {
                    const Icon = MASTERY_ICONS[result.mastery]
                    return (
                      <span className="flex items-center gap-2">
                        <Icon className="size-5 text-primary" />
                        {t(`finalTest.mastery.${result.mastery}` as const)}
                      </span>
                    )
                  })()}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl font-bold text-foreground">{result.score_percent}%</span>
                  <Badge variant={result.mastery === 'review' ? 'secondary' : 'default'}>
                    {t(`finalTest.mastery.${result.mastery}` as const)}
                  </Badge>
                </div>

                {result.weak_topics.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">{t('finalTest.areasToImprove')}</p>
                    <ul className="flex flex-wrap gap-1">
                      {result.weak_topics.map((topic) => (
                        <li key={topic}><Badge variant="secondary">{topic}</Badge></li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => { setResult(null); setAnswers([]); }}
              >
                {t('finalTest.retake')}
              </Button>
              <Button render={<Link to={`/courses/${courseId}`} />} variant="ghost">
                {t('common.backToCourse')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <QuizForm
              questions={test.questions}
              answers={answers.length === 0 ? Array(test.questions.length).fill(null) : answers}
              onAnswer={handleAnswer}
              submitted={false}
              scrollable
            />

            {submitError && (
              <Alert>
                <AlertCircle className="size-4" />
                <AlertTitle>{t('finalTest.submissionError')}</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleSubmit} disabled={!allAnswered || submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
                {t('finalTest.submit')}
              </Button>
            </div>
          </>
        )}
      </div>
    </CourseWorkspaceLayout>
  )
}
