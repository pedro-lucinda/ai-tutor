import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Clock, Globe, Target, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCourse, useProgress } from '@/hooks/use-courses'
import { DeleteCourseButton } from '@/components/modules/delete-course-button'
import { CourseWorkspaceLayout } from '@/layouts/course-workspace-layout'
import { PageScrollLayout } from '@/layouts/page-scroll-layout'
import { CourseSidebar } from '@/components/modules/course-sidebar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCourseLevelLabel } from '@/lib/course-level'
import { getCourseCompletion, isSubtopicCompleted } from '@/lib/course-progress'

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const id = Number(courseId)

  const { data: course, isLoading, isError } = useCourse(id)
  const { data: progress } = useProgress(id)

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

  const totalSubtopics = course.modules.reduce((a, m) => a + m.subtopics.length, 0)
  const { completedCount, completionPct } = getCourseCompletion(course, progress)
  const levelLabel = getCourseLevelLabel(course.level, t)

  return (
    <CourseWorkspaceLayout sidebar={<CourseSidebar course={course} />}>
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{course.topic}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{course.goal}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {levelLabel ? <Badge>{levelLabel}</Badge> : null}
              {course.language && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Globe className="size-3" />
                  {t(`createCourse.languages.${course.language}` as Parameters<typeof t>[0])}
                </Badge>
              )}
              <DeleteCourseButton
                courseId={course.id}
                mode="text"
                onDeleted={() => navigate('/')}
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="overview" className="flex-1 sm:flex-none">{t('course.overview')}</TabsTrigger>
            <TabsTrigger value="progress" className="flex-1 sm:flex-none">{t('course.progress')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('course.completion')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('course.overallProgress')}</span>
                  <span className="font-medium">
                    {t('course.completedCount', { completed: completedCount, total: totalSubtopics })}
                  </span>
                </div>
                <Progress value={completionPct} />
                <p className="text-sm text-muted-foreground">{Math.round(completionPct)}%</p>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-4" /> {t('course.estimatedTime')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{course.estimated_hours}h</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Target className="size-4" /> {t('course.modules')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{course.modules.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
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
              {course.modules.map((module, i) => (
                <Card key={module.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      <span className="text-muted-foreground">{t('course.module')} {i + 1}: </span>
                      {module.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col gap-1">
                      {module.subtopics.map((sub) => (
                        <li key={sub.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                          {isSubtopicCompleted(sub.name, progress) ? (
                            <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                          ) : (
                            <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                          )}
                          {sub.name}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="mt-4 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('course.completion')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('course.overallProgress')}</span>
                  <span className="font-medium">
                    {t('course.completedCount', { completed: completedCount, total: totalSubtopics })}
                  </span>
                </div>
                <Progress value={completionPct} />
                <p className="text-sm text-muted-foreground">{Math.round(completionPct)}%</p>
              </CardContent>
            </Card>

            {progress && progress.weak_topics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('course.topicsToReview')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {progress.weak_topics.map((wt) => (
                    <div key={wt.subtopic} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-foreground">{wt.subtopic}</span>
                      <Badge variant="secondary" className="shrink-0">{Math.round(wt.average_score * 100)}%</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {progress?.recommendation && (
              <Alert>
                <AlertTitle>{t('course.recommendation')}</AlertTitle>
                <AlertDescription className="text-sm leading-relaxed whitespace-pre-line">
                  {progress.recommendation}
                </AlertDescription>
              </Alert>
            )}

            {!progress && (
              <p className="text-sm text-muted-foreground">{t('course.noProgress')}</p>
            )}
          </TabsContent>
        </Tabs>
    </CourseWorkspaceLayout>
  )
}
