import { create } from 'zustand'

interface CourseStore {
  selectedCourseId: number | null
  selectedSubtopicId: number | null
  setSelectedCourseId: (id: number | null) => void
  setSelectedSubtopicId: (id: number | null) => void
}

export const useCourseStore = create<CourseStore>((set) => ({
  selectedCourseId: null,
  selectedSubtopicId: null,
  setSelectedCourseId: (id) => set({ selectedCourseId: id }),
  setSelectedSubtopicId: (id) => set({ selectedSubtopicId: id }),
}))
