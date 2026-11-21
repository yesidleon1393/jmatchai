import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModeOption<T extends string> {
  value: T
  label: string
  icon: ReactNode
}

interface ModeToggleProps<T extends string> {
  ariaLabel: string
  options: readonly ModeOption<T>[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}

export function ModeToggle<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  disabled,
}: ModeToggleProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border bg-muted/50 p-0.5"
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors',
              'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
              isActive && 'bg-background text-foreground shadow-xs',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
