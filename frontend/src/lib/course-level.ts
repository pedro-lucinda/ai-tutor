const LEVEL_KEYS = ['beginner', 'intermediate', 'advanced'] as const

export type CourseLevelKey = (typeof LEVEL_KEYS)[number]

function resolveLevelKey(level: string): CourseLevelKey | null {
  const normalized = level.trim().toLowerCase()

  if (LEVEL_KEYS.includes(normalized as CourseLevelKey)) {
    return normalized as CourseLevelKey
  }

  if (normalized.includes('beginner')) return 'beginner'
  if (normalized.includes('intermediate')) return 'intermediate'
  if (normalized.includes('advanced')) return 'advanced'

  return null
}

/** Returns a known level key, or null for unrecognized values like "general-purpose". */
export function getCourseLevelKey(level: string): CourseLevelKey | null {
  return resolveLevelKey(level)
}

export function getCourseLevelLabel(
  level: string,
  translate: (key: string) => string,
): string | null {
  const key = resolveLevelKey(level)
  if (!key) return null
  return translate(`course.levels.${key}`)
}
