import { api } from './client'
import { consumeSSE } from './stream'
import type { AgentStreamEvent, CourseDetail, CourseSummary, LessonContent, QuizOutput } from '@/types/api'

export function listCourses() {
  return api.get<CourseSummary[]>('/courses')
}

export function getCourse(courseId: number) {
  return api.get<CourseDetail>(`/courses/${courseId}`)
}

export function deleteCourse(courseId: number) {
  return api.delete(`/courses/${courseId}`)
}

export function createCourse(
  goal: string,
  lang: string,
  onEvent?: (event: AgentStreamEvent) => void,
) {
  return consumeSSE<CourseDetail>(
    '/courses',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, lang }),
    },
    onEvent,
  )
}

export function getLesson(
  courseId: number,
  subtopicId: number,
  lang: string,
  onEvent?: (event: AgentStreamEvent) => void,
) {
  return consumeSSE<LessonContent>(
    `/courses/${courseId}/subtopics/${subtopicId}/lesson?lang=${encodeURIComponent(lang)}`,
    { method: 'GET' },
    onEvent,
  )
}

export function getQuiz(
  courseId: number,
  subtopicId: number,
  lang: string,
  onEvent?: (event: AgentStreamEvent) => void,
) {
  return consumeSSE<QuizOutput>(
    `/courses/${courseId}/subtopics/${subtopicId}/quiz?lang=${encodeURIComponent(lang)}`,
    { method: 'GET' },
    onEvent,
  )
}

export function getFinalTest(
  courseId: number,
  moduleId: number,
  lang: string,
  onEvent?: (event: AgentStreamEvent) => void,
) {
  return consumeSSE<QuizOutput>(
    `/courses/${courseId}/modules/${moduleId}/final-test?lang=${encodeURIComponent(lang)}`,
    { method: 'GET' },
    onEvent,
  )
}
