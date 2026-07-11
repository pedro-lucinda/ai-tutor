import { createContext, useContext } from 'react'
import type { CourseDetail } from '@/types/api'

export interface CourseWorkspaceContextValue {
  course: CourseDetail
  courseId: number
}

export const CourseWorkspaceContext = createContext<CourseWorkspaceContextValue | null>(null)

export function useCourseWorkspace(): CourseWorkspaceContextValue {
  const context = useContext(CourseWorkspaceContext)
  if (!context) {
    throw new Error('useCourseWorkspace must be used within CourseRouteLayout')
  }
  return context
}
