import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCourse,
  deleteCourse,
  getCourse,
  getFinalTest,
  getLesson,
  getQuiz,
  listCourses,
} from '@/api/courses'
import { getProgress } from '@/api/progress'
import { useAuthUser } from '@/components/auth/app-auth-provider'
import type { AgentStreamEvent } from '@/types/api'

const STALE_CONTENT = 1000 * 60 * 60

function useAgentContent<T>({
  queryKeyPrefix,
  courseId,
  resourceId,
  fetchFn,
  onEvent,
}: {
  queryKeyPrefix: string
  courseId: number
  resourceId: number
  fetchFn: (lang: string, onEvent?: (event: AgentStreamEvent) => void) => Promise<T>
  onEvent?: (event: AgentStreamEvent) => void
}) {
  const { data: course } = useCourse(courseId)
  const lang = course?.language ?? 'en'
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  return useQuery({
    queryKey: [queryKeyPrefix, courseId, resourceId, lang],
    queryFn: () => fetchFn(lang, onEventRef.current),
    enabled: !!courseId && !!resourceId && !!course,
    staleTime: STALE_CONTENT,
    retry: false,
  })
}

export function useCourses() {
  const { sub } = useAuthUser()
  return useQuery({
    queryKey: ['courses', sub],
    queryFn: listCourses,
    enabled: !!sub,
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()
  const { sub } = useAuthUser()

  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: (_data, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['courses', sub] })
      queryClient.removeQueries({ queryKey: ['course', courseId] })
      queryClient.removeQueries({ queryKey: ['progress', courseId] })
    },
  })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()
  const { sub } = useAuthUser()

  return useMutation({
    mutationFn: ({
      goal,
      lang,
      onEvent,
    }: {
      goal: string
      lang: string
      onEvent?: (event: AgentStreamEvent) => void
    }) => createCourse(goal, lang, onEvent),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['courses', sub] })
    },
  })
}

export function useCourse(courseId: number) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(courseId),
    enabled: !!courseId,
  })
}

export function useLesson(
  courseId: number,
  subtopicId: number,
  onEvent?: (event: AgentStreamEvent) => void,
) {
  return useAgentContent({
    queryKeyPrefix: 'lesson',
    courseId,
    resourceId: subtopicId,
    fetchFn: (lang, eventHandler) => getLesson(courseId, subtopicId, lang, eventHandler),
    onEvent,
  })
}

export function useQuiz(
  courseId: number,
  subtopicId: number,
  onEvent?: (event: AgentStreamEvent) => void,
) {
  return useAgentContent({
    queryKeyPrefix: 'quiz',
    courseId,
    resourceId: subtopicId,
    fetchFn: (lang, eventHandler) => getQuiz(courseId, subtopicId, lang, eventHandler),
    onEvent,
  })
}

export function useFinalTest(
  courseId: number,
  moduleId: number,
  onEvent?: (event: AgentStreamEvent) => void,
) {
  return useAgentContent({
    queryKeyPrefix: 'final-test',
    courseId,
    resourceId: moduleId,
    fetchFn: (lang, eventHandler) => getFinalTest(courseId, moduleId, lang, eventHandler),
    onEvent,
  })
}

export function useProgress(courseId: number) {
  return useQuery({
    queryKey: ['progress', courseId],
    queryFn: () => getProgress(courseId),
    enabled: !!courseId,
  })
}
