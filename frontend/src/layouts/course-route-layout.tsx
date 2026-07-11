import { Outlet, useParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CourseSidebar } from '@/components/modules/course-sidebar'
import { CourseWorkspaceLayout } from '@/layouts/course-workspace-layout'
import { PageScrollLayout } from '@/layouts/page-scroll-layout'
import {
  CourseWorkspaceContext,
  type CourseWorkspaceContextValue,
} from '@/hooks/use-course-workspace'
import { useCourse } from '@/hooks/use-courses'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

export function CourseRouteLayout() {
  const { courseId } = useParams<{ courseId: string }>()
  const { t } = useTranslation()
  const id = Number(courseId)
  const { data: course, isLoading, isError } = useCourse(id)

  if (isLoading) {
    return (
      <CourseWorkspaceLayout
        sidebar={<Skeleton className="hidden h-full w-full rounded-lg lg:block lg:w-64" />}
      >
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CourseWorkspaceLayout>
    )
  }

  if (isError || !course) {
    return (
      <PageScrollLayout>
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>{t('course.notFound')}</AlertTitle>
          <AlertDescription>{t('course.notFound')}</AlertDescription>
        </Alert>
      </PageScrollLayout>
    )
  }

  const contextValue: CourseWorkspaceContextValue = { course, courseId: id }

  return (
    <CourseWorkspaceContext.Provider value={contextValue}>
      <CourseWorkspaceLayout sidebar={<CourseSidebar course={course} />}>
        <Outlet />
      </CourseWorkspaceLayout>
    </CourseWorkspaceContext.Provider>
  )
}
