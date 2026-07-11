import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useOpenAIKeyStatus } from '@/hooks/use-settings'

export function OpenAIKeyBanner() {
  const { t } = useTranslation()
  const { data: status } = useOpenAIKeyStatus()

  if (!status || status.configured) {
    return null
  }

  return (
    <Alert>
      <AlertTitle>{t('settings.banner.title')}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{t('settings.banner.description')}</span>
        <Button size="sm" render={<Link to="/settings" />}>
          {t('settings.banner.cta')}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
