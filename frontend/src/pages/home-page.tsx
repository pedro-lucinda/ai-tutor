import { Link } from 'react-router-dom'
import { BookOpen, GraduationCap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCourses } from '@/hooks/use-courses'
import { DeleteCourseButton } from '@/components/modules/delete-course-button'
import { PageScrollLayout } from '@/layouts/page-scroll-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  ready: 'default',
  building: 'secondary',
  pending: 'outline',
}

export function HomePage() {
  const { t } = useTranslation()
  const { data: courses, isLoading, isError } = useCourses()

  return (
    <PageScrollLayout>
    <div className="flex flex-col gap-8 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('home.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('home.subtitle')}</p>
        </div>
        <Button render={<Link to="/courses/new" />}>{t('home.newCourse')}</Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-1/2" /></CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">{t('home.error')}</p>
      )}

      {courses && courses.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
          <GraduationCap className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t('home.empty.message')}</p>
          <Button render={<Link to="/courses/new" />}>{t('home.empty.cta')}</Button>
        </div>
      )}

      {courses && courses.length > 0 && (
        <div className="grid gap-4 overflow-visible sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col overflow-visible hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base leading-snug pr-2">{course.topic}</CardTitle>
                <Badge variant={STATUS_VARIANT[course.status] ?? 'outline'} className="w-fit capitalize">
                  {t(`home.status.${course.status}` as const, { defaultValue: course.status })}
                </Badge>
                <CardAction>
                  <DeleteCourseButton courseId={course.id} />
                </CardAction>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <BookOpen className="size-3.5" />
                  {course.level}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  render={<Link to={`/courses/${course.id}`} />}
                >
                  {t('home.openCourse')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
    </PageScrollLayout>
  )
}
