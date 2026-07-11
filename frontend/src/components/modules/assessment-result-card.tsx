import { CheckCircle2, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { QuizForm } from '@/components/modules/quiz-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { QuizQuestion, QuizSubmitResult } from '@/types/api'

export function QuizResultCard({
  result,
  questions,
  answers,
}: {
  result: QuizSubmitResult
  questions: QuizQuestion[]
  answers: (number | null)[]
}) {
  const { t } = useTranslation()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {result.passed ? (
              <CheckCircle2 className="size-5 text-primary" />
            ) : (
              <XCircle className="size-5 text-destructive" />
            )}
            {result.passed ? t('quiz.passed') : t('quiz.notPassed')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold text-foreground">{result.score_percent}%</span>
            <Badge variant={result.passed ? 'default' : 'secondary'}>
              {result.passed ? t('quiz.passedBadge') : t('quiz.tryAgain')}
            </Badge>
            {result.unlocked_next_subtopic ? (
              <Badge variant="outline">{t('quiz.nextUnlocked')}</Badge>
            ) : null}
          </div>

          {result.weak_topics.length > 0 ? (
            <div className="text-sm text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">{t('quiz.weakTopics')}</p>
              <ul className="flex flex-wrap gap-1">
                {result.weak_topics.map((topic) => (
                  <li key={topic}>
                    <Badge variant="secondary">{topic}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Separator />
      <p className="text-sm font-medium text-muted-foreground">{t('quiz.reviewAnswers')}</p>
      <QuizForm questions={questions} answers={answers} onAnswer={() => {}} submitted />
    </>
  )
}
