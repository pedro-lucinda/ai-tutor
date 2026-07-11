import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  id: string
  side?: 'left' | 'right'
  children: ReactNode
}

export function MobileNavDrawer({
  open,
  onClose,
  title,
  closeLabel,
  id,
  side = 'right',
  children,
}: MobileNavDrawerProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <>
      <button
        type="button"
        aria-label={closeLabel}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] lg:hidden dark:bg-black/70"
        onClick={onClose}
      />

      <aside
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed inset-y-0 z-[110] flex flex-col bg-background shadow-2xl lg:hidden',
          side === 'right'
            ? 'right-0 w-[min(100vw,18rem)] border-l border-border'
            : 'left-0 w-[min(100vw,20rem)] border-r border-border',
        )}
      >
        <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={closeLabel}>
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </aside>
    </>,
    document.body,
  )
}
