import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AssessmentPage } from '@/components/modules/assessment-page'
import { QuizResultCard } from '@/components/modules/assessment-result-card'
import { CourseContentShell } from '@/components/modules/course-content-shell'
import { useAssessment } from '@/hooks/use-assessment'
import { useAgentProgress } from '@/hooks/use-agent-progress'
import { useCourseWorkspace } from '@/hooks/use-course-workspace'
import { useQuiz } from '@/hooks/use-courses'
import { submitQuiz } from '@/api/progress'

export function QuizPage() {
  const { subtopicId } = useParams<{ subtopicId: string }>()
  const { t } = useTranslation()
  const { courseId } = useCourseWorkspace()
  const sid = Number(subtopicId)

  const { steps, currentAgent, onEvent } = useAgentProgress()
  const { data: quiz, isLoading, isError, error } = useQuiz(courseId, sid, onEvent)

  const assessment = useAssessment({
    courseId,
    questionCount: quiz?.questions.length ?? 0,
    submitFn: (answers) => submitQuiz(courseId, sid, answers),
    submissionErrorMessage: t('quiz.submissionError'),
  })

  return (
    <CourseContentShell
      isLoading={isLoading}
      error={isError ? error : undefined}
      lockedTitle={t('quiz.error.locked')}
      lockedDescription={t('quiz.error.lockedDesc')}
      errorTitle={t('quiz.error.generic')}
      steps={steps}
      currentAgent={currentAgent}
    >
      {quiz ? (
        <AssessmentPage
          title={quiz.subtopic ?? t('sidebar.quiz')}
          subtitle={t('quiz.questions', { count: quiz.questions.length })}
          questions={quiz.questions}
          answers={assessment.answers}
          onAnswer={assessment.handleAnswer}
          submitting={assessment.submitting}
          submitError={assessment.submitError}
          submitErrorTitle={t('quiz.submissionError')}
          submitLabel={t('quiz.submit')}
          allAnswered={!!assessment.allAnswered}
          onSubmit={assessment.handleSubmit}
          result={
            assessment.result ? (
              <QuizResultCard
                result={assessment.result}
                questions={quiz.questions}
                answers={assessment.answers}
              />
            ) : null
          }
          onRetake={assessment.handleRetake}
          retakeLabel={t('quiz.retake')}
          courseId={courseId}
        />
      ) : null}
    </CourseContentShell>
  )
}
