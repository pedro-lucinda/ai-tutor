import { api } from './client'
import type { FinalTestSubmitResult, ProgressReport, QuizSubmitResult } from '@/types/api'

export function getProgress(courseId: number) {
  return api.get<ProgressReport>(`/courses/${courseId}/progress`)
}

export function submitQuiz(courseId: number, subtopicId: number, answers: number[]) {
  return api.post<QuizSubmitResult>(
    `/courses/${courseId}/subtopics/${subtopicId}/quiz/submit`,
    { answers },
  )
}

export function submitFinalTest(courseId: number, moduleId: number, answers: number[]) {
  return api.post<FinalTestSubmitResult>(
    `/courses/${courseId}/modules/${moduleId}/final-test/submit`,
    { answers },
  )
}
