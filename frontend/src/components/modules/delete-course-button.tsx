import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDeleteCourse } from '@/hooks/use-courses'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DeleteCourseButtonProps = {
  courseId: number
  onDeleted?: () => void
  mode?: 'icon' | 'text'
  className?: string
}

export function DeleteCourseButton({
  courseId,
  onDeleted,
  mode = 'icon',
  className,
}: DeleteCourseButtonProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const deleteCourse = useDeleteCourse()

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const handleDelete = async () => {
    try {
      await deleteCourse.mutateAsync(courseId)
      setOpen(false)
      onDeleted?.()
    } catch {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="ghost"
        size={mode === 'icon' ? 'icon-sm' : 'sm'}
        className={cn(
          mode === 'icon'
            ? 'text-muted-foreground hover:text-destructive'
            : 'text-muted-foreground hover:text-destructive',
        )}
        onClick={() => setOpen((current) => !current)}
        aria-label={t('course.delete')}
        aria-expanded={open}
      >
        <Trash2 />
        {mode === 'text' ? t('course.deleteShort') : null}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label={t('course.deleteConfirm')}
          className="absolute right-0 top-full z-50 mt-1.5 w-60 rounded-lg border border-border bg-card p-3 shadow-lg"
        >
          <p className="text-sm leading-snug text-muted-foreground">{t('course.deleteConfirm')}</p>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deleteCourse.isPending}
              onClick={() => setOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteCourse.isPending}
              onClick={handleDelete}
            >
              {deleteCourse.isPending ? t('course.deleting') : t('course.delete')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
