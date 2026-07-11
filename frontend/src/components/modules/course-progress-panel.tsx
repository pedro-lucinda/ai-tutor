import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProgressReport } from '@/types/api'

interface CourseProgressPanelProps {
  progress?: ProgressReport
}

export function CourseProgressPanel({ progress }: CourseProgressPanelProps) {
  const { t } = useTranslation()

  if (!progress) {
    return <p className="text-sm text-muted-foreground">{t('course.noProgress')}</p>
  }

  return (
    <>
      {progress.weak_topics.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('course.topicsToReview')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {progress.weak_topics.map((weakTopic) => (
              <div
                key={weakTopic.subtopic}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate text-foreground">{weakTopic.subtopic}</span>
                <Badge variant="secondary" className="shrink-0">
                  {Math.round(weakTopic.average_score * 100)}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {progress.recommendation ? (
        <Alert>
          <AlertTitle>{t('course.recommendation')}</AlertTitle>
          <AlertDescription className="text-sm leading-relaxed whitespace-pre-line">
            {progress.recommendation}
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  )
}
