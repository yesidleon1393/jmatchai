import { CheckCircle2, FileText, TriangleAlert, X, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AtsLevel, AtsStatus } from '@/lib/ats'
import { formatBytes, type ResumeFileInfo } from '@/lib/storage'
import { cn } from '@/lib/utils'

const LEVEL_STYLES: Record<AtsLevel, { label: string; className: string }> = {
  optimized: { label: 'ATS-friendly', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  'needs-work': { label: 'Needs improvements', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  'not-optimized': { label: 'Not ATS-optimized', className: 'bg-destructive/10 text-destructive' },
}

const STATUS_ICON: Record<AtsStatus, { icon: typeof CheckCircle2; label: string; className: string }> = {
  pass: { icon: CheckCircle2, label: 'Passed', className: 'text-emerald-600 dark:text-emerald-400' },
  warn: { icon: TriangleAlert, label: 'Warning', className: 'text-amber-600 dark:text-amber-400' },
  fail: { icon: XCircle, label: 'Failed', className: 'text-destructive' },
}

interface AtsReportProps {
  file: ResumeFileInfo
  onRemove: () => void
  disabled?: boolean
}

export function AtsReport({ file, onRemove, disabled }: AtsReportProps) {
  const { ats } = file
  const level = LEVEL_STYLES[ats.level]
  const issues = ats.checks.filter((check) => check.status !== 'pass')
  const meta = [formatBytes(file.size), file.pageCount ? `${file.pageCount} page${file.pageCount === 1 ? '' : 's'}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <section aria-labelledby="ats-heading" className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">{meta}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${file.name}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h3 id="ats-heading" className="text-sm font-semibold text-foreground">
          ATS readiness
        </h3>
        <Badge className={cn('border-transparent', level.className)}>{level.label}</Badge>
        <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
          {ats.score}
          <span className="text-xs font-normal text-muted-foreground"> / 100</span>
        </span>
      </div>

      <p
        role={ats.level === 'optimized' ? undefined : 'status'}
        className="text-sm leading-relaxed text-muted-foreground"
      >
        {ats.summary}
        {file.truncated && ' The text was truncated to fit the character limit.'}
      </p>

      <ul className="flex flex-col gap-2.5">
        {ats.checks.map((check) => {
          const status = STATUS_ICON[check.status]
          const Icon = status.icon
          return (
            <li key={check.id} className="flex items-start gap-2.5">
              <Icon className={cn('mt-0.5 size-4 shrink-0', status.className)} aria-hidden="true" />
              <div className="min-w-0 text-sm">
                <p className="font-medium text-foreground">
                  {check.label}
                  <span className="sr-only"> — {status.label}</span>
                </p>
                {(check.status !== 'pass' || issues.length === 0) && (
                  <p className="leading-relaxed text-muted-foreground">{check.detail}</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
