import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DeleteCourseButton } from '@/components/modules/delete-course-button'
import { Badge } from '@/components/ui/badge'
import { getCourseLevelLabel } from '@/lib/course-level'
import type { CourseDetail } from '@/types/api'

interface CourseHeaderProps {
  course: CourseDetail
  onDeleted: () => void
}

export function CourseHeader({ course, onDeleted }: CourseHeaderProps) {
  const { t } = useTranslation()
  const levelLabel = getCourseLevelLabel(course.level, t)

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {course.topic}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{course.goal}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {levelLabel ? <Badge>{levelLabel}</Badge> : null}
          {course.language ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Globe className="size-3" />
              {t(`createCourse.languages.${course.language}` as Parameters<typeof t>[0])}
            </Badge>
          ) : null}
          <DeleteCourseButton courseId={course.id} mode="text" onDeleted={onDeleted} />
        </div>
      </div>
    </div>
  )
}
