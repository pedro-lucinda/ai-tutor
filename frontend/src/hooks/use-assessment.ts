import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiError } from '@/lib/api-error'

interface UseAssessmentOptions<T> {
  courseId: number
  questionCount: number
  submitFn: (answers: number[]) => Promise<T>
  onSuccess?: (result: T) => void
  invalidateCourse?: boolean
  invalidateProgress?: boolean
  submissionErrorMessage: string
}

export function useAssessment<T>({
  courseId,
  questionCount,
  submitFn,
  onSuccess,
  invalidateCourse = true,
  invalidateProgress = true,
  submissionErrorMessage,
}: UseAssessmentOptions<T>) {
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [result, setResult] = useState<T | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: submitFn,
    onSuccess: (data) => {
      setResult(data)
      setSubmitError(null)
      if (invalidateCourse) {
        void queryClient.invalidateQueries({ queryKey: ['course', courseId] })
      }
      if (invalidateProgress) {
        void queryClient.invalidateQueries({ queryKey: ['progress', courseId] })
      }
      onSuccess?.(data)
    },
    onError: (error) => {
      setSubmitError(getApiError(error).detail || submissionErrorMessage)
    },
  })

  function handleAnswer(questionIndex: number, optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev]
      next[questionIndex] = optionIndex
      return next
    })
  }

  function handleRetake() {
    setResult(null)
    setAnswers([])
    setSubmitError(null)
  }

  const allAnswered =
    questionCount > 0 && answers.filter((answer) => answer !== null).length === questionCount

  function handleSubmit() {
    if (!allAnswered) return
    mutation.mutate(answers as number[])
  }

  return {
    answers,
    result,
    submitError,
    submitting: mutation.isPending,
    allAnswered,
    handleAnswer,
    handleSubmit,
    handleRetake,
  }
}
