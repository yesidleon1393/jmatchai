import type { ChangeEvent, Ref } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface TextFieldWithCounterProps {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  minLength: number
  maxLength: number
  showError: boolean
  disabled?: boolean
  icon?: React.ReactNode
  textareaRef?: Ref<HTMLTextAreaElement>
}

export function TextFieldWithCounter({
  id,
  label,
  placeholder,
  value,
  onChange,
  minLength,
  maxLength,
  showError,
  disabled,
  icon,
  textareaRef,
}: TextFieldWithCounterProps) {
  const length = value.trim().length
  const isTooShort = length < minLength
  const hasError = showError && isTooShort
  const helpId = `${id}-help`
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-2.5">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-sm font-semibold text-foreground"
      >
        {icon}
        {label}
        <span className="text-xs font-normal text-muted-foreground">Required</span>
      </label>

      <Textarea
        id={id}
        ref={textareaRef}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${helpId} ${errorId}` : helpId}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        className="min-h-72 resize-y bg-card px-4 py-3 text-sm leading-relaxed shadow-xs"
      />

      <div className="flex min-h-5 items-start justify-between gap-4 text-xs">
        <p
          id={errorId}
          role={hasError ? 'alert' : undefined}
          className={cn('text-destructive', !hasError && 'sr-only')}
        >
          {hasError ? `Please enter at least ${minLength} characters (${minLength - length} more needed).` : ''}
        </p>
        <p
          id={helpId}
          className={cn(
            'ml-auto shrink-0 tabular-nums',
            isTooShort ? 'text-muted-foreground' : 'text-primary',
          )}
        >
          {length.toLocaleString('en-US')} / {maxLength.toLocaleString('en-US')} characters
          {isTooShort && ` · min. ${minLength}`}
        </p>
      </div>
    </div>
  )
}
