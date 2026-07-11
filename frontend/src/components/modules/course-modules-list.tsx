import { CheckCircle2, Clock, Target, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { isSubtopicCompleted } from '@/lib/course-progress'
import type { CourseDetail, ProgressReport } from '@/types/api'

interface CourseModulesListProps {
  course: CourseDetail
  progress?: ProgressReport
  totalSubtopics: number
}

export function CourseModulesList({ course, progress, totalSubtopics }: CourseModulesListProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-4" /> {t('course.estimatedTime')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{course.estimated_hours}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Target className="size-4" /> {t('course.modules')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{course.modules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <TrendingUp className="size-4" /> {t('course.subtopics')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalSubtopics}</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        {course.modules.map((module, index) => (
          <Card key={module.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                <span className="text-muted-foreground">
                  {t('course.module')} {index + 1}:{' '}
                </span>
                {module.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-1">
                {module.subtopics.map((subtopic) => (
                  <li
                    key={subtopic.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    {isSubtopicCompleted(subtopic.name, progress) ? (
                      <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                    ) : (
                      <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                    )}
                    {subtopic.name}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
