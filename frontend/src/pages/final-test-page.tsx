import { useParams } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AssessmentPage } from '@/components/modules/assessment-page'
import { CourseContentShell } from '@/components/modules/course-content-shell'
import { FinalTestResultCard } from '@/components/modules/final-test-result-card'
import { useAssessment } from '@/hooks/use-assessment'
import { useAgentProgress } from '@/hooks/use-agent-progress'
import { useCourseWorkspace } from '@/hooks/use-course-workspace'
import { useFinalTest } from '@/hooks/use-courses'
import { submitFinalTest } from '@/api/progress'

export function FinalTestPage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const { t } = useTranslation()
  const { course, courseId } = useCourseWorkspace()
  const mid = Number(moduleId)

  const { steps, currentAgent, onEvent } = useAgentProgress()
  const { data: test, isLoading, isError, error } = useFinalTest(courseId, mid, onEvent)

  const assessment = useAssessment({
    courseId,
    questionCount: test?.questions.length ?? 0,
    submitFn: (answers) => submitFinalTest(courseId, mid, answers),
    invalidateCourse: false,
    submissionErrorMessage: t('finalTest.submissionError'),
  })

  const moduleName = course.modules.find((module) => module.id === mid)?.name

  return (
    <CourseContentShell
      isLoading={isLoading}
      error={isError ? error : undefined}
      lockedTitle={t('finalTest.error.generic')}
      lockedDescription=""
      errorTitle={t('finalTest.error.generic')}
      steps={steps}
      currentAgent={currentAgent}
    >
      {test ? (
        <AssessmentPage
          title={
            <span className="flex items-center gap-2">
              <Star className="size-5 text-primary" />
              {t('finalTest.title')}
              {moduleName ? `: ${moduleName}` : ''}
            </span>
          }
          subtitle={t('finalTest.questions', { count: test.questions.length })}
          questions={test.questions}
          answers={assessment.answers}
          onAnswer={assessment.handleAnswer}
          submitting={assessment.submitting}
          submitError={assessment.submitError}
          submitErrorTitle={t('finalTest.submissionError')}
          submitLabel={t('finalTest.submit')}
          allAnswered={!!assessment.allAnswered}
          onSubmit={assessment.handleSubmit}
          result={assessment.result ? <FinalTestResultCard result={assessment.result} /> : null}
          onRetake={assessment.handleRetake}
          retakeLabel={t('finalTest.retake')}
          courseId={courseId}
          scrollable
        />
      ) : null}
    </CourseContentShell>
  )
}
