export default {
  nav: {
    courses: 'Courses',
    newCourse: '+ New course',
    theme: {
      light: 'Switch to light mode',
      dark: 'Switch to dark mode',
    },
  },

  home: {
    title: 'Your courses',
    subtitle: 'Pick up where you left off or start something new.',
    newCourse: '+ New course',
    openCourse: 'Open course',
    empty: {
      message: 'No courses yet.',
      cta: 'Create your first course',
    },
    error: 'Failed to load courses. Is the backend running?',
    status: {
      ready: 'Ready',
      building: 'Building',
      pending: 'Pending',
    },
  },

  createCourse: {
    title: 'Create a new course',
    subtitle: 'Describe what you want to learn and the AI will build a personalized curriculum for you.',
    cardTitle: 'What do you want to learn?',
    cardDescription: 'Be specific — e.g. "Build REST APIs with FastAPI and PostgreSQL" or "Learn React from scratch".',
    label: 'Learning goal',
    placeholder: 'I want to learn…',
    languageLabel: 'Course language',
    languageDescription: 'Lessons and quizzes will be generated in this language.',
    languages: {
      en: 'English',
      'pt-BR': 'Português (Brasil)',
    },
    submit: 'Create course',
    loading: {
      title: 'Building your course…',
      subtitle: 'Our AI is planning, researching, and structuring your curriculum. This takes 30–120 seconds.',
    },
    error: 'Something went wrong.',
  },

  course: {
    overview: 'Overview',
    progress: 'Progress',
    estimatedTime: 'Estimated time',
    language: 'Language',
    modules: 'Modules',
    subtopics: 'Subtopics',
    module: 'Module',
    completion: 'Completion',
    overallProgress: 'Overall progress',
    completedCount: '{{completed}} of {{total}} subtopics completed',
    topicsToReview: 'Topics to review',
    recommendation: 'Recommendation',
    noProgress: 'Complete your first quiz to see progress data.',
    finalTest: 'Final test',
    notFound: 'This course could not be loaded.',
    delete: 'Delete course',
    deleteShort: 'Delete',
    deleteConfirm: 'Delete this course and all its progress?',
    deleting: 'Deleting…',
    deleteError: 'Could not delete course.',
  },

  sidebar: {
    curriculum: 'Curriculum',
    lesson: 'Lesson',
    quiz: 'Quiz',
    finalTest: 'Final test',
  },

  lesson: {
    loading: {
      title: 'Loading lesson…',
      subtitle: 'If this is the first time, the AI is generating content. This may take a minute.',
    },
    error: {
      locked: 'Subtopic locked',
      lockedDesc: 'Complete the previous subtopic quiz first to unlock this lesson.',
      generic: 'Could not load lesson',
    },
    sections: {
      introduction: 'Introduction',
      explanation: 'Explanation',
      example: 'Example',
      commonMistakes: 'Common mistakes',
      summary: 'Summary',
    },
    takeQuiz: 'Take quiz',
    streaming: 'Writing your lesson…',
  },

  quiz: {
    loading: {
      title: 'Loading quiz…',
      subtitle: 'If this is your first time, the AI is generating questions. This may take a minute.',
    },
    error: {
      locked: 'Subtopic locked',
      lockedDesc: 'Complete the previous subtopic first to unlock this quiz.',
      generic: 'Could not load quiz',
    },
    questions: '{{count}} questions',
    passed: 'Quiz passed!',
    notPassed: 'Quiz not passed',
    passedBadge: 'Passed',
    tryAgain: 'Try again',
    nextUnlocked: 'Next subtopic unlocked!',
    weakTopics: 'Topics to review:',
    reviewAnswers: 'Review your answers:',
    retake: 'Retake quiz',
    backToCourse: 'Back to course',
    submit: 'Submit answers',
    submissionError: 'Submission error',
    question: 'Q{{num}}.',
  },

  finalTest: {
    title: 'Final test',
    loading: {
      title: 'Preparing final test…',
      subtitle: 'The AI is generating questions tailored to your weak topics. This may take a minute.',
    },
    error: {
      generic: 'Could not load final test',
    },
    questions: '{{count}} questions',
    mastery: {
      review: 'Needs review',
      pass: 'Passed',
      mastered: 'Mastered!',
    },
    areasToImprove: 'Areas to improve:',
    retake: 'Retake test',
    backToCourse: 'Back to course',
    submit: 'Submit final test',
    submissionError: 'Submission error',
  },

  agents: {
    working: 'Building with AI…',
    cachingNote: 'The AI is generating this content for the first time. It will be cached for future visits.',
    'learning-planner': 'Planning learning path',
    'curriculum-researcher': 'Researching curriculum',
    'course-builder': 'Building course structure',
    'content-generator': 'Writing your lesson…',
    'quiz-generator': 'Writing quiz questions…',
    validator: 'Reviewing for accuracy…',
  },

  common: {
    error: 'Error',
    loading: 'Loading…',
    cancel: 'Cancel',
    backToCourse: 'Back to course',
  },
} as const
