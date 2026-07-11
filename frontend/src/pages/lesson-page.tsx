import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CourseContentShell } from '@/components/modules/course-content-shell'
import { LessonContentView } from '@/components/modules/lesson-content-view'
import { useStreamingLesson } from '@/hooks/use-agent-progress'
import { useCourseWorkspace } from '@/hooks/use-course-workspace'
import { useLesson } from '@/hooks/use-courses'

export function LessonPage() {
  const { subtopicId } = useParams<{ subtopicId: string }>()
  const { t } = useTranslation()
  const { courseId } = useCourseWorkspace()
  const sid = Number(subtopicId)

  const { steps, currentAgent, partialLesson, hasPartialContent, onEvent } =
    useStreamingLesson()
  const { data: lesson, isLoading, isError, error } = useLesson(courseId, sid, onEvent)

  const quizPath = `/courses/${courseId}/subtopics/${subtopicId}/quiz`

  return (
    <CourseContentShell
      isLoading={isLoading}
      error={isError ? error : undefined}
      lockedTitle={t('lesson.error.locked')}
      lockedDescription={t('lesson.error.lockedDesc')}
      errorTitle={t('lesson.error.generic')}
      steps={steps}
      currentAgent={currentAgent}
      loadingContent={
        hasPartialContent ? (
          <LessonContentView
            lesson={partialLesson}
            streaming
            steps={steps}
            currentAgent={currentAgent}
          />
        ) : undefined
      }
    >
      {lesson ? <LessonContentView lesson={lesson} quizPath={quizPath} /> : null}
    </CourseContentShell>
  )
}
