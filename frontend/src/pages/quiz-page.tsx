import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuiz, useCourse } from '@/hooks/use-courses'
import { useAgentProgress } from '@/hooks/use-agent-progress'
import { submitQuiz } from '@/api/progress'
import { ApiError } from '@/api/client'
import type { QuizSubmitResult } from '@/types/api'
import { QuizForm } from '@/components/modules/quiz-form'
import { CourseSidebar } from '@/components/modules/course-sidebar'
import { CourseWorkspaceLayout } from '@/layouts/course-workspace-layout'
import { GeneratingLoader } from '@/components/modules/generating-loader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function QuizPage() {
  const { courseId, subtopicId } = useParams<{ courseId: string; subtopicId: string }>()
  const { t } = useTranslation()
  const cid = Number(courseId)
  const sid = Number(subtopicId)

  const queryClient = useQueryClient()
  const { data: course } = useCourse(cid)
  const { steps, currentAgent, onEvent } = useAgentProgress()
  const { data: quiz, isLoading, isError, error } = useQuiz(cid, sid, onEvent)

  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizSubmitResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const apiErr = error instanceof ApiError ? error : null
  const isLocked = apiErr?.status === 403

  function handleAnswer(qi: number, oi: number) {
    setAnswers((prev) => {
      const next = [...prev]
      next[qi] = oi
      return next
    })
  }

  const allAnswered = quiz && answers.filter((a) => a !== null).length === quiz.questions.length

  async function handleSubmit() {
    if (!quiz || !allAnswered) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await submitQuiz(cid, sid, answers as number[])
      setResult(res)
      queryClient.invalidateQueries({ queryKey: ['course', cid] })
      queryClient.invalidateQueries({ queryKey: ['progress', cid] })
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.detail : t('quiz.submissionError'))
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
          <AlertTitle>{isLocked ? t('quiz.error.locked') : t('quiz.error.generic')}</AlertTitle>
          <AlertDescription>
            {isLocked ? t('quiz.error.lockedDesc') : (apiErr?.detail ?? '')}
          </AlertDescription>
        </Alert>
      </CourseWorkspaceLayout>
    )
  }

  if (!quiz) return null

  return (
    <CourseWorkspaceLayout sidebar={course ? <CourseSidebar course={course} /> : undefined}>
      <div className="flex flex-col gap-4 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {quiz.subtopic ?? t('sidebar.quiz')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('quiz.questions', { count: quiz.questions.length })}
          </p>
          <Separator className="mt-3" />
        </div>

        {result ? (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {result.passed
                    ? <CheckCircle2 className="size-5 text-primary" />
                    : <XCircle className="size-5 text-destructive" />
                  }
                  {result.passed ? t('quiz.passed') : t('quiz.notPassed')}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl font-bold text-foreground">{result.score_percent}%</span>
                  <Badge variant={result.passed ? 'default' : 'secondary'}>
                    {result.passed ? t('quiz.passedBadge') : t('quiz.tryAgain')}
                  </Badge>
                  {result.unlocked_next_subtopic && (
                    <Badge variant="outline">{t('quiz.nextUnlocked')}</Badge>
                  )}
                </div>

                {result.weak_topics.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">{t('quiz.weakTopics')}</p>
                    <ul className="flex flex-wrap gap-1">
                      {result.weak_topics.map((topic) => (
                        <li key={topic}><Badge variant="secondary">{topic}</Badge></li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />
            <p className="text-sm font-medium text-muted-foreground">{t('quiz.reviewAnswers')}</p>
            <QuizForm
              questions={quiz.questions}
              answers={answers}
              onAnswer={() => {}}
              submitted
            />

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => { setResult(null); setAnswers([]); }}
              >
                {t('quiz.retake')}
              </Button>
              <Button render={<Link to={`/courses/${courseId}`} />} variant="ghost">
                {t('common.backToCourse')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <QuizForm
              questions={quiz.questions}
              answers={answers.length === 0 ? Array(quiz.questions.length).fill(null) : answers}
              onAnswer={handleAnswer}
              submitted={false}
            />

            {submitError && (
              <Alert>
                <AlertCircle className="size-4" />
                <AlertTitle>{t('quiz.submissionError')}</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleSubmit} disabled={!allAnswered || submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
                {t('quiz.submit')}
              </Button>
            </div>
          </>
        )}
      </div>
    </CourseWorkspaceLayout>
  )
}
