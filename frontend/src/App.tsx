import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ThemeSync } from '@/components/providers/theme-sync'
import { AppLayout } from '@/layouts/app-layout'
import { CourseRouteLayout } from '@/layouts/course-route-layout'
import { HomePage } from '@/pages/home-page'
import { CreateCoursePage } from '@/pages/create-course-page'
import { CourseDetailPage } from '@/pages/course-detail-page'
import { LessonPage } from '@/pages/lesson-page'
import { QuizPage } from '@/pages/quiz-page'
import { FinalTestPage } from '@/pages/final-test-page'
import { SettingsPage } from '@/pages/settings-page'
import { NotFoundPage } from '@/pages/not-found-page'

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
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/courses/new" element={<CreateCoursePage />} />
              <Route path="/courses/:courseId" element={<CourseRouteLayout />}>
                <Route index element={<CourseDetailPage />} />
                <Route
                  path="subtopics/:subtopicId/lesson"
                  element={<LessonPage />}
                />
                <Route path="subtopics/:subtopicId/quiz" element={<QuizPage />} />
                <Route
                  path="modules/:moduleId/final-test"
                  element={<FinalTestPage />}
                />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </>
  )
}
