'use client'

import { History, RotateCcw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { classifyScore } from '@/lib/evaluation'
import type { HistoryEntry } from '@/lib/storage'

interface HistoryPanelProps {
  entries: HistoryEntry[]
  onRestore: (entry: HistoryEntry) => void
  onDelete: (id: string) => void
  onClear: () => void
  disabled?: boolean
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

export function HistoryPanel({ entries, onRestore, onDelete, onClear, disabled }: HistoryPanelProps) {
  if (entries.length === 0) return null

  return (
    <section aria-labelledby="history-heading" className="rounded-2xl border bg-card p-4 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="history-heading" className="flex items-center gap-2 text-base font-semibold text-foreground">
            <History className="size-4 text-primary" aria-hidden="true" />
            Recent evaluations
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Saved only in this browser (localStorage). The last {entries.length === 1 ? 'evaluation' : 'evaluations'} stay
            available after you reload.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={disabled} className="gap-2">
          <Trash2 className="size-4" aria-hidden="true" />
          Clear history
        </Button>
      </div>

      <ul className="mt-4 flex flex-col divide-y rounded-lg border">
        {entries.map((entry) => {
          const match = classifyScore(entry.result.score)
          return (
            <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 sm:flex-nowrap">
              <div className="flex w-24 shrink-0 flex-col items-start gap-1">
                <span className="text-lg font-semibold tabular-nums text-foreground">{entry.result.score}</span>
                <Badge variant="secondary">{match.label}</Badge>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground" title={entry.jobTitle}>
                  {entry.jobTitle}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {entry.candidateName} · {dateFormatter.format(entry.createdAt)}
                </p>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRestore(entry)}
                  disabled={disabled}
                  className="gap-2"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Open
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(entry.id)}
                  disabled={disabled}
                  aria-label={`Delete evaluation: ${entry.jobTitle}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
