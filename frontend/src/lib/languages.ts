export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'EN', labelKey: 'en' },
  { code: 'pt-BR', label: 'PT', labelKey: 'pt-BR' },
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code']

export function resolveDefaultLanguage(resolved: string | undefined): SupportedLanguage {
  if (!resolved) return 'en'
  if (SUPPORTED_LANGUAGES.some((lang) => lang.code === resolved)) {
    return resolved as SupportedLanguage
  }
  const prefix = resolved.split('-')[0].toLowerCase()
  const match = SUPPORTED_LANGUAGES.find((lang) =>
    lang.code.toLowerCase().startsWith(prefix),
  )
  return match?.code ?? 'en'
}
