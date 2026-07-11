import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CourseCompletionCard } from '@/components/modules/course-completion-card'
import { CourseHeader } from '@/components/modules/course-header'
import { CourseModulesList } from '@/components/modules/course-modules-list'
import { CourseProgressPanel } from '@/components/modules/course-progress-panel'
import { useCourseWorkspace } from '@/hooks/use-course-workspace'
import { useProgress } from '@/hooks/use-courses'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCourseCompletion } from '@/lib/course-progress'

export function CourseDetailPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { course, courseId } = useCourseWorkspace()
  const { data: progress } = useProgress(courseId)

  const totalSubtopics = course.modules.reduce(
    (count, module) => count + module.subtopics.length,
    0,
  )
  const { completedCount, completionPct } = getCourseCompletion(course, progress)

  return (
    <>
      <CourseHeader course={course} onDeleted={() => navigate('/')} />

      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">
            {t('course.overview')}
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex-1 sm:flex-none">
            {t('course.progress')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
          <CourseCompletionCard
            completedCount={completedCount}
            totalSubtopics={totalSubtopics}
            completionPct={completionPct}
          />
          <CourseModulesList
            course={course}
            progress={progress}
            totalSubtopics={totalSubtopics}
          />
        </TabsContent>

        <TabsContent value="progress" className="mt-4 flex flex-col gap-4">
          <CourseCompletionCard
            completedCount={completedCount}
            totalSubtopics={totalSubtopics}
            completionPct={completionPct}
          />
          <CourseProgressPanel progress={progress} />
        </TabsContent>
      </Tabs>
    </>
  )
}
