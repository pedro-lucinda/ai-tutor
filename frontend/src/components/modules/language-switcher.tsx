import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@/lib/languages'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  className?: string
  variant?: 'compact' | 'labeled'
  value?: string
  onChange?: (code: string) => void
}

export function LanguageSwitcher({
  className,
  variant = 'compact',
  value,
  onChange,
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()

  return (
    <div
      className={cn(
        'flex items-center overflow-hidden rounded-md border border-border',
        className,
      )}
    >
      {SUPPORTED_LANGUAGES.map((lang) => {
        const selected = value ?? i18n.resolvedLanguage
        const isActive = selected === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => (onChange ? onChange(lang.code) : i18n.changeLanguage(lang.code))}
            className={cn(
              'px-2.5 py-1 text-xs font-medium transition-colors',
              variant === 'labeled' && 'px-4 py-1.5 text-sm',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {variant === 'labeled'
              ? t(`createCourse.languages.${lang.labelKey}` as Parameters<typeof t>[0])
              : lang.label}
          </button>
        )
      })}
    </div>
  )
}
