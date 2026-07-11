import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface CourseCompletionCardProps {
  completedCount: number
  totalSubtopics: number
  completionPct: number
}

export function CourseCompletionCard({
  completedCount,
  totalSubtopics,
  completionPct,
}: CourseCompletionCardProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('course.completion')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('course.overallProgress')}</span>
          <span className="font-medium">
            {t('course.completedCount', { completed: completedCount, total: totalSubtopics })}
          </span>
        </div>
        <Progress value={completionPct} />
        <p className="text-sm text-muted-foreground">{Math.round(completionPct)}%</p>
      </CardContent>
    </Card>
  )
}
