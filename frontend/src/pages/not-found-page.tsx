import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { PageScrollLayout } from '@/layouts/page-scroll-layout'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <PageScrollLayout>
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <FileQuestion className="size-12 text-muted-foreground" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('notFound.title')}</h1>
          <p className="max-w-md text-sm text-muted-foreground">{t('notFound.description')}</p>
        </div>
        <Button render={<Link to="/" />}>{t('notFound.cta')}</Button>
      </div>
    </PageScrollLayout>
  )
}
