import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeSync } from '@/components/providers/theme-sync'
import { AppLayout } from '@/layouts/app-layout'
import { HomePage } from '@/pages/home-page'
import { CreateCoursePage } from '@/pages/create-course-page'
import { CourseDetailPage } from '@/pages/course-detail-page'
import { LessonPage } from '@/pages/lesson-page'
import { QuizPage } from '@/pages/quiz-page'
import { FinalTestPage } from '@/pages/final-test-page'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <>
      <ThemeSync />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/courses/new" element={<CreateCoursePage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/courses/:courseId/subtopics/:subtopicId/lesson" element={<LessonPage />} />
            <Route path="/courses/:courseId/subtopics/:subtopicId/quiz" element={<QuizPage />} />
            <Route path="/courses/:courseId/modules/:moduleId/final-test" element={<FinalTestPage />} />
          </Route>
        </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </>
  )
}
