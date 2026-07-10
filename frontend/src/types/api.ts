// ─── Course ──────────────────────────────────────────────────────────────────

export interface CourseSummary {
  id: number
  topic: string
  level: string
  status: 'pending' | 'building' | 'ready'
}

export interface Subtopic {
  id: number
  name: string
  order: number
  unlocked: boolean
  lesson_status?: string
  quiz_status?: string
}

export interface Module {
  id: number
  name: string
  order: number
  subtopics: Subtopic[]
}

export interface CourseDetail {
  id: number
  topic: string
  level: string
  goal: string
  estimated_hours: number
  status: 'pending' | 'building' | 'ready'
  language: string
  modules: Module[]
}

// ─── Lesson ──────────────────────────────────────────────────────────────────

export interface LessonContent {
  subtopic: string
  introduction: string
  explanation: string
}

// ─── Quiz ────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string
  options: [string, string, string, string]
  correct_index: number
  explanation: string
}

export interface QuizOutput {
  subtopic?: string
  module?: string
  questions: QuizQuestion[]
}

// ─── Submissions ─────────────────────────────────────────────────────────────

export interface SubmitAnswersRequest {
  answers: number[]
}

export interface QuizSubmitResult {
  score: number
  score_percent: number
  passed: boolean
  unlocked_next_subtopic: boolean
  weak_topics: string[]
}

export interface FinalTestSubmitResult {
  score: number
  score_percent: number
  mastery: 'review' | 'pass' | 'mastered'
  weak_topics: string[]
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface WeakTopic {
  subtopic: string
  average_score: number
  attempts: number
}

export interface ProgressReport {
  course_id: number
  completion_percent: number
  completed_subtopics: string[]
  weak_topics: WeakTopic[]
  recommendation: string
}

// ─── API error ───────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string
}

// ─── SSE streaming events ─────────────────────────────────────────────────────

export type AgentStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'agent_start'; agent: string }
  | { type: 'agent_end'; agent: string }
  | { type: 'lesson_delta'; data: Partial<LessonContent> }
  | { type: 'complete'; data: unknown }
  | { type: 'error'; message: string }
