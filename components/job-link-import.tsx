'use client'

import type { FormEvent, KeyboardEvent } from 'react'
import { AlertTriangle, Link2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface JobLinkImportProps {
  url: string
  onUrlChange: (url: string) => void
  onImport: () => void
  isImporting: boolean
  error: string | null
  disabled?: boolean
}

export function JobLinkImport({ url, onUrlChange, onImport, isImporting, error, disabled }: JobLinkImportProps) {
  const errorId = 'job-url-error'
  const helpId = 'job-url-help'

  function submit(event: FormEvent | KeyboardEvent) {
    event.preventDefault()
    if (!isImporting && !disabled) onImport()
  }

  return (
    <div className="flex min-h-72 flex-col justify-center gap-4 rounded-lg border border-dashed bg-muted/30 p-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">Import from a job posting link</p>
        <p id={helpId} className="text-sm leading-relaxed text-muted-foreground">
          Paste the URL of a public posting (company career pages, Greenhouse, Lever, LinkedIn and similar). We read
          the text and fill the description so you can review it.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="job-url" className="sr-only">
            Job posting URL
          </label>
          <Link2
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="job-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={url}
            disabled={disabled || isImporting}
            placeholder="https://www.linkedin.com/jobs/view/..."
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${helpId} ${errorId}` : helpId}
            onChange={(event) => onUrlChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) submit(event)
            }}
            className="h-11 w-full rounded-lg border bg-card pr-3 pl-9 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:opacity-60"
          />
        </div>
        <Button
          type="button"
          size="lg"
          onClick={() => onImport()}
          disabled={disabled || isImporting || url.trim().length === 0}
          className="h-11 gap-2 px-5"
        >
          {isImporting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Importing...
            </>
          ) : (
            'Import'
          )}
        </Button>
      </div>

      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
