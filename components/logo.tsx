import { cn } from '@/lib/utils'

interface LogoMarkProps {
  className?: string
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('size-9', className)}
    >
      <rect width="32" height="32" rx="9" className="fill-foreground" />
      <path
        d="M11 9v9.5a3.5 3.5 0 0 0 7 0V9"
        className="stroke-background"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="21.5" r="3" className="fill-primary" />
    </svg>
  )
}

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />
      <div className="flex flex-col leading-tight">
        <span className="text-base font-semibold tracking-tight text-foreground">
          JennyMatch <span className="text-primary">AI</span>
        </span>
        <span className="text-xs text-muted-foreground">AI Candidate Evaluation</span>
      </div>
    </div>
  )
}
