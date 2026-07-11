import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { QuizForm } from '@/components/modules/quiz-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { QuizQuestion } from '@/types/api'

interface AssessmentPageProps {
  title: ReactNode
  subtitle: string
  questions: QuizQuestion[]
  answers: (number | null)[]
  onAnswer: (questionIndex: number, optionIndex: number) => void
  submitting: boolean
  submitError: string | null
  submitErrorTitle: string
  submitLabel: string
  allAnswered: boolean
  onSubmit: () => void
  result: ReactNode | null
  onRetake: () => void
  retakeLabel: string
  courseId: number
  scrollable?: boolean
}

export function AssessmentPage({
  title,
  subtitle,
  questions,
  answers,
  onAnswer,
  submitting,
  submitError,
  submitErrorTitle,
  submitLabel,
  allAnswered,
  onSubmit,
  result,
  onRetake,
  retakeLabel,
  courseId,
  scrollable = false,
}: AssessmentPageProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <Separator className="mt-3" />
      </div>

      {result ? (
        <div className="flex flex-col gap-4">
          {result}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onRetake}>
              {retakeLabel}
            </Button>
            <Button render={<Link to={`/courses/${courseId}`} />} variant="ghost">
              {t('common.backToCourse')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <QuizForm
            questions={questions}
            answers={answers.length === 0 ? Array(questions.length).fill(null) : answers}
            onAnswer={onAnswer}
            submitted={false}
            scrollable={scrollable}
          />

          {submitError ? (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>{submitErrorTitle}</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex justify-end pt-2">
            <Button onClick={onSubmit} disabled={!allAnswered || submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              ) : null}
              {submitLabel}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
