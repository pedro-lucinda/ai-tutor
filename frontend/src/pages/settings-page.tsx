import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  deleteOpenAIKey,
  getOpenAIKeyStatus,
  saveOpenAIKey,
  validateOpenAIKey,
} from '@/api/settings'
import { ApiError } from '@/api/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageScrollLayout } from '@/layouts/page-scroll-layout'

export function SettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [apiKey, setApiKey] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: status, isLoading } = useQuery({
    queryKey: ['settings', 'openai'],
    queryFn: getOpenAIKeyStatus,
  })

  const saveMutation = useMutation({
    mutationFn: saveOpenAIKey,
    onSuccess: () => {
      setApiKey('')
      setError(null)
      setMessage(t('settings.saved'))
      void queryClient.invalidateQueries({ queryKey: ['settings', 'openai'] })
    },
    onError: (err: unknown) => {
      setMessage(null)
      setError(err instanceof ApiError ? err.detail : t('settings.error'))
    },
  })

  const validateMutation = useMutation({
    mutationFn: validateOpenAIKey,
    onSuccess: () => {
      setError(null)
      setMessage(t('settings.valid'))
    },
    onError: (err: unknown) => {
      setMessage(null)
      setError(err instanceof ApiError ? err.detail : t('settings.error'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteOpenAIKey,
    onSuccess: () => {
      setError(null)
      setMessage(t('settings.removed'))
      void queryClient.invalidateQueries({ queryKey: ['settings', 'openai'] })
    },
    onError: (err: unknown) => {
      setMessage(null)
      setError(err instanceof ApiError ? err.detail : t('settings.error'))
    },
  })

  const maskedKey =
    status?.configured && status.key_last4 ? `************${status.key_last4}` : null

  return (
    <PageScrollLayout>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('settings.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.openai.title')}</CardTitle>
            <CardDescription>{t('settings.openai.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : maskedKey ? (
              <p className="font-mono text-sm text-muted-foreground">{maskedKey}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t('settings.openai.notConfigured')}</p>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="openai-key">{t('settings.openai.label')}</Label>
              <Input
                id="openai-key"
                type="password"
                autoComplete="off"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            {message ? (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : null}
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!apiKey.trim() || saveMutation.isPending}
                onClick={() => saveMutation.mutate(apiKey.trim())}
              >
                {status?.configured ? t('settings.openai.update') : t('settings.openai.save')}
              </Button>
              <Button
                variant="outline"
                disabled={!apiKey.trim() || validateMutation.isPending}
                onClick={() => validateMutation.mutate(apiKey.trim())}
              >
                {t('settings.openai.validate')}
              </Button>
              {status?.configured ? (
                <Button
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  {t('settings.openai.remove')}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageScrollLayout>
  )
}
