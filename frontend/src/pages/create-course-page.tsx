import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createCourse } from '@/api/courses'
import { ApiError } from '@/api/client'
import { useAgentProgress } from '@/hooks/use-agent-progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GeneratingLoader } from '@/components/modules/generating-loader'
import { PageScrollLayout } from '@/layouts/page-scroll-layout'
import { cn } from '@/lib/utils'

const SUPPORTED_LANGUAGES = [
  { code: 'en', labelKey: 'en' },
  { code: 'pt-BR', labelKey: 'pt-BR' },
] as const

type SupportedLang = (typeof SUPPORTED_LANGUAGES)[number]['code']

function resolveDefaultLang(resolved: string | undefined): SupportedLang {
  if (!resolved) return 'en'
  // Exact match first
  if (SUPPORTED_LANGUAGES.some((l) => l.code === resolved)) return resolved as SupportedLang
  // Prefix match: 'pt' → 'pt-BR', etc.
  const prefix = resolved.split('-')[0].toLowerCase()
  const match = SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase().startsWith(prefix))
  return match ? match.code : 'en'
}

export function CreateCoursePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [goal, setGoal] = useState('')
  const [language, setLanguage] = useState<SupportedLang>(
    () => resolveDefaultLang(i18n.resolvedLanguage),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { steps, currentAgent, onEvent, reset } = useAgentProgress()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!goal.trim()) return
    reset()
    setLoading(true)
    setError(null)
    try {
      const course = await createCourse(goal.trim(), language, onEvent)
      navigate(`/courses/${course.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : t('createCourse.error'))
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <GeneratingLoader
          steps={steps}
          currentAgent={currentAgent}
        />
      </div>
    )
  }

  return (
    <PageScrollLayout>
    <div className="mx-auto max-w-xl pb-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('createCourse.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('createCourse.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('createCourse.cardTitle')}</CardTitle>
          <CardDescription>{t('createCourse.cardDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal">{t('createCourse.label')}</Label>
              <Textarea
                id="goal"
                placeholder={t('createCourse.placeholder')}
                rows={4}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t('createCourse.languageLabel')}</Label>
              <p className="text-xs text-muted-foreground">{t('createCourse.languageDescription')}</p>
              <div className="flex items-center rounded-md border border-border overflow-hidden self-start">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={cn(
                      'px-4 py-1.5 text-sm font-medium transition-colors',
                      language === lang.code
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {t(`createCourse.languages.${lang.labelKey}` as Parameters<typeof t>[0])}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <Alert>
                <AlertTitle>{t('common.error')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={!goal.trim() || loading} className="self-end">
              {t('createCourse.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </PageScrollLayout>
  )
}
