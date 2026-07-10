import type { CourseDetail, ProgressReport } from '@/types/api'

export function getCourseCompletion(course: CourseDetail, progress?: ProgressReport | null) {
  const totalSubtopics = course.modules.reduce((total, module) => total + module.subtopics.length, 0)
  const completedCount = progress?.completed_subtopics.length ?? 0
  const completionPct = totalSubtopics > 0 ? (completedCount / totalSubtopics) * 100 : 0

  return { totalSubtopics, completedCount, completionPct }
}

export function isSubtopicCompleted(subtopicName: string, progress?: ProgressReport | null) {
  return progress?.completed_subtopics.includes(subtopicName) ?? false
}
