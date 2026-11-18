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
        d="M20 9v10a4.5 4.5 0 0 1-9 0"
        className="stroke-background"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11.5" cy="10" r="2.5" className="fill-primary" />
    </svg>
  )
}

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />
      <div className="flex flex-col leading-tight">
        <span className="text-base font-semibold tracking-tight text-foreground">
          Jmatch <span className="text-primary">AI</span>
        </span>
        <span className="text-xs text-muted-foreground">AI Candidate Evaluation</span>
      </div>
    </div>
  )
}
