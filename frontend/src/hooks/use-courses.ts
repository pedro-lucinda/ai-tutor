import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteCourse, getCourse, getFinalTest, getLesson, getQuiz, listCourses } from '@/api/courses'
import { getProgress } from '@/api/progress'
import { useAuthUser } from '@/components/auth/app-auth-provider'
import type { AgentStreamEvent } from '@/types/api'

const STALE_CONTENT = 1000 * 60 * 60 // 1 h — avoid re-triggering agent generation

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
  const { data: course } = useCourse(courseId)
  const lang = course?.language ?? 'en'
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  return useQuery({
    queryKey: ['lesson', courseId, subtopicId, lang],
    queryFn: () => getLesson(courseId, subtopicId, lang, onEventRef.current),
    enabled: !!courseId && !!subtopicId && !!course,
    staleTime: STALE_CONTENT,
    retry: false,
  })
}

export function useQuiz(
  courseId: number,
  subtopicId: number,
  onEvent?: (event: AgentStreamEvent) => void,
) {
  const { data: course } = useCourse(courseId)
  const lang = course?.language ?? 'en'
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  return useQuery({
    queryKey: ['quiz', courseId, subtopicId, lang],
    queryFn: () => getQuiz(courseId, subtopicId, lang, onEventRef.current),
    enabled: !!courseId && !!subtopicId && !!course,
    staleTime: STALE_CONTENT,
    retry: false,
  })
}

export function useFinalTest(
  courseId: number,
  moduleId: number,
  onEvent?: (event: AgentStreamEvent) => void,
) {
  const { data: course } = useCourse(courseId)
  const lang = course?.language ?? 'en'
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  return useQuery({
    queryKey: ['final-test', courseId, moduleId, lang],
    queryFn: () => getFinalTest(courseId, moduleId, lang, onEventRef.current),
    enabled: !!courseId && !!moduleId && !!course,
    staleTime: STALE_CONTENT,
    retry: false,
  })
}

export function useProgress(courseId: number) {
  return useQuery({
    queryKey: ['progress', courseId],
    queryFn: () => getProgress(courseId),
    enabled: !!courseId,
  })
}
