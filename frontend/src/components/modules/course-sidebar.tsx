import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, CheckCircle2, ClipboardList, Flag, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CourseDetail } from '@/types/api'
import { useProgress } from '@/hooks/use-courses'
import { isSubtopicCompleted } from '@/lib/course-progress'
import { cn } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CourseSidebarProps {
  course: CourseDetail
}

function lessonComplete(status?: string) {
  return status === 'generated' || status === 'validated'
}

function CompletionIcon({ complete }: { complete: boolean }) {
  if (!complete) {
    return <span className="size-3 shrink-0 rounded-full border border-border" />
  }
  return <CheckCircle2 className="size-3 shrink-0 text-green-600 dark:text-green-500" />
}

export function CourseSidebar({ course }: CourseSidebarProps) {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const { data: progress } = useProgress(course.id)

  const activeSubtopicId = useMemo(() => {
    const match = pathname.match(/\/subtopics\/(\d+)/)
    return match ? Number(match[1]) : null
  }, [pathname])

  const activeModuleId = useMemo(() => {
    const finalTestMatch = pathname.match(/\/modules\/(\d+)\/final-test/)
    if (finalTestMatch) return Number(finalTestMatch[1])

    if (!activeSubtopicId) return null
    return course.modules.find((module) =>
      module.subtopics.some((sub) => sub.id === activeSubtopicId),
    )?.id ?? null
  }, [pathname, course.modules, activeSubtopicId])

  const [openModules, setOpenModules] = useState<string[]>(
    activeModuleId ? [String(activeModuleId)] : [],
  )

  useEffect(() => {
    if (!activeModuleId) return
    const id = String(activeModuleId)
    setOpenModules((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [activeModuleId])

  const coursePath = `/courses/${course.id}`
  const isCoursePage = pathname === coursePath

  return (
    <aside className="flex h-full min-h-0 w-64 shrink-0 flex-col gap-2">
      <div className="shrink-0 px-2 py-1">
        {isCoursePage ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
            {t('sidebar.curriculum')}
          </p>
        ) : (
          <Link
            to={coursePath}
            title={t('common.backToCourse')}
            className="text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:text-primary"
          >
            {t('sidebar.curriculum')}
          </Link>
        )}
      </div>
      <ScrollArea className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-card">
        <Accordion
          multiple
          value={openModules}
          onValueChange={setOpenModules}
          className="p-2"
        >
          {course.modules.map((module, mi) => {
            const finalTestPath = `/courses/${course.id}/modules/${module.id}/final-test`
            const isFinalTestActive = pathname === finalTestPath

            return (
              <AccordionItem key={module.id} value={String(module.id)} className="border-border">
                <AccordionTrigger className="px-2 py-2 text-foreground hover:no-underline">
                  <span className="flex min-w-0 items-start gap-2">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-foreground">
                      {mi + 1}
                    </span>
                    <span className="text-xs font-semibold leading-tight">{module.name}</span>
                  </span>
                </AccordionTrigger>

                <AccordionContent className="px-1 pb-2">
                  <div className="flex flex-col gap-1">
                    {module.subtopics.map((sub) => {
                      const lessonPath = `/courses/${course.id}/subtopics/${sub.id}/lesson`
                      const quizPath = `/courses/${course.id}/subtopics/${sub.id}/quiz`
                      const locked = !sub.unlocked
                      const isActiveSubtopic = activeSubtopicId === sub.id
                      const lessonDone = lessonComplete(sub.lesson_status)
                      const quizDone = isSubtopicCompleted(sub.name, progress)

                      return (
                        <div
                          key={sub.id}
                          className={cn(
                            'rounded-md border border-transparent px-2 py-1',
                            isActiveSubtopic && 'border-primary/30 bg-primary/10',
                            locked && 'opacity-50',
                          )}
                        >
                          <div className="flex items-start gap-1.5">
                            {locked ? (
                              <Lock className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                            ) : (
                              <span className="mt-0.5 size-3 shrink-0" />
                            )}
                            <span
                              className={cn(
                                'flex-1 text-xs leading-snug',
                                locked ? 'text-muted-foreground' : 'text-foreground font-medium',
                                isActiveSubtopic && !locked && 'text-foreground',
                              )}
                            >
                              {sub.name}
                            </span>
                          </div>

                          {!locked && (
                            <div className="ml-4 mt-0.5 flex flex-col gap-0.5">
                              <Link
                                to={lessonPath}
                                className={cn(
                                  'flex items-center gap-1.5 rounded px-2 py-0.5 text-xs transition-colors',
                                  'text-foreground hover:bg-muted',
                                  pathname === lessonPath && 'bg-muted font-medium',
                                )}
                              >
                                <BookOpen className="size-3 shrink-0" />
                                {t('sidebar.lesson')}
                                <CompletionIcon complete={lessonDone} />
                              </Link>
                              <Link
                                to={quizPath}
                                className={cn(
                                  'flex items-center gap-1.5 rounded px-2 py-0.5 text-xs transition-colors',
                                  'text-foreground hover:bg-muted',
                                  pathname === quizPath && 'bg-muted font-medium',
                                )}
                              >
                                <ClipboardList className="size-3 shrink-0" />
                                {t('sidebar.quiz')}
                                <CompletionIcon complete={quizDone} />
                              </Link>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    <Link
                      to={finalTestPath}
                      className={cn(
                        'mt-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
                        'text-foreground hover:bg-muted',
                        isFinalTestActive && 'bg-primary/10 font-medium text-foreground ring-1 ring-primary/30',
                      )}
                    >
                      <Flag className="size-3 shrink-0 text-foreground" />
                      {t('sidebar.finalTest')}
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </ScrollArea>
    </aside>
  )
}
