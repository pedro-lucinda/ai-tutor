import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GeneratingLoader } from '@/components/modules/generating-loader'
import { LanguageSwitcher } from '@/components/modules/language-switcher'
import { OpenAIKeyBanner } from '@/components/modules/openai-key-banner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAgentProgress } from '@/hooks/use-agent-progress'
import { useCreateCourse } from '@/hooks/use-courses'
import { PageScrollLayout } from '@/layouts/page-scroll-layout'
import { getApiError } from '@/lib/api-error'
import { resolveDefaultLanguage, type SupportedLanguage } from '@/lib/languages'

export function CreateCoursePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [goal, setGoal] = useState('')
  const [language, setLanguage] = useState<SupportedLanguage>(() =>
    resolveDefaultLanguage(i18n.resolvedLanguage),
  )
  const { steps, currentAgent, onEvent, reset } = useAgentProgress()
  const createCourseMutation = useCreateCourse()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!goal.trim()) return
    reset()
    try {
      const course = await createCourseMutation.mutateAsync({
        goal: goal.trim(),
        lang: language,
        onEvent,
      })
      navigate(`/courses/${course.id}`)
    } catch {
      // Error surfaced via mutation state below.
    }
  }

  if (createCourseMutation.isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <GeneratingLoader steps={steps} currentAgent={currentAgent} />
      </div>
    )
  }

  const error = createCourseMutation.error
    ? getApiError(createCourseMutation.error).detail || t('createCourse.error')
    : null

  return (
    <PageScrollLayout>
      <div className="mx-auto max-w-xl pb-4">
        <div className="mb-6 flex flex-col gap-4">
          <OpenAIKeyBanner />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t('createCourse.title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('createCourse.subtitle')}</p>
          </div>
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
                  onChange={(event) => setGoal(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>{t('createCourse.languageLabel')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('createCourse.languageDescription')}
                </p>
                <LanguageSwitcher
                  variant="labeled"
                  value={language}
                  onChange={(code) => setLanguage(code as SupportedLanguage)}
                  className="self-start"
                />
              </div>

              {error ? (
                <Alert>
                  <AlertTitle>{t('common.error')}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" disabled={!goal.trim()} className="self-end">
                {t('createCourse.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageScrollLayout>
  )
}
