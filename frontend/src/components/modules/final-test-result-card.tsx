import { AlertCircle, Medal, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FinalTestSubmitResult } from '@/types/api'

const MASTERY_ICONS = {
  review: AlertCircle,
  pass: Medal,
  mastered: Trophy,
} as const

export function FinalTestResultCard({ result }: { result: FinalTestSubmitResult }) {
  const { t } = useTranslation()
  const Icon = MASTERY_ICONS[result.mastery]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          <span className="flex items-center gap-2">
            <Icon className="size-5 text-primary" />
            {t(`finalTest.mastery.${result.mastery}`)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl font-bold text-foreground">{result.score_percent}%</span>
          <Badge variant={result.mastery === 'review' ? 'secondary' : 'default'}>
            {t(`finalTest.mastery.${result.mastery}`)}
          </Badge>
        </div>

        {result.weak_topics.length > 0 ? (
          <div className="text-sm text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">{t('finalTest.areasToImprove')}</p>
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
  )
}
