import type { QuizQuestion } from '@/types/api'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface QuizFormProps {
  questions: QuizQuestion[]
  answers: (number | null)[]
  onAnswer: (questionIndex: number, optionIndex: number) => void
  submitted: boolean
  scrollable?: boolean
}

export function QuizForm({ questions, answers, onAnswer, submitted, scrollable }: QuizFormProps) {
  const inner = (
    <div className="flex flex-col gap-4">
      {questions.map((q, qi) => {
        const selected = answers[qi]
        return (
          <Card key={qi}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium leading-relaxed">
                <span className="text-muted-foreground">Q{qi + 1}. </span>
                {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selected !== null ? String(selected) : undefined}
                onValueChange={(val) => {
                  if (!submitted) onAnswer(qi, Number(val))
                }}
              >
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = selected === oi
                    const isCorrect = submitted && oi === q.correct_index
                    const isWrong = submitted && isSelected && oi !== q.correct_index

                    return (
                      <div
                        key={oi}
                        className={cn(
                          'flex items-start gap-3 rounded-md border px-3 py-2 transition-colors',
                          !submitted && 'cursor-pointer hover:bg-muted',
                          isCorrect && 'border-primary bg-primary/5',
                          isWrong && 'border-destructive bg-destructive/5',
                          !isCorrect && !isWrong && isSelected && 'border-border bg-muted',
                        )}
                      >
                        <RadioGroupItem
                          value={String(oi)}
                          id={`q${qi}-o${oi}`}
                          disabled={submitted}
                          className="mt-0.5 shrink-0"
                        />
                        <Label
                          htmlFor={`q${qi}-o${oi}`}
                          className={cn(
                            'cursor-pointer text-sm leading-relaxed',
                            submitted && 'cursor-default',
                            isCorrect && 'text-primary font-medium',
                            isWrong && 'text-destructive',
                          )}
                        >
                          {opt}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </RadioGroup>

              {submitted && q.explanation && (
                <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-2">
                  {q.explanation}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  if (scrollable) {
    return <div className="min-h-0">{inner}</div>
  }

  return inner
}
