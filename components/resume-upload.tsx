'use client'

import { useRef, useState, type DragEvent } from 'react'
import { AlertTriangle, FileUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResumeUploadProps {
  onFile: (file: File) => void
  isUploading: boolean
  error: string | null
  disabled?: boolean
}

export function ResumeUpload({ onFile, isUploading, error, disabled }: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const isBlocked = disabled || isUploading

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (isBlocked) return
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div className="flex min-h-72 flex-col gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!isBlocked) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-6 text-center transition-colors',
          isDragging && 'border-primary bg-primary/5',
        )}
      >
        {isUploading ? (
          <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
        ) : (
          <FileUp className="size-7 text-primary" aria-hidden="true" />
        )}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            {isUploading ? 'Reading and checking your file...' : 'Upload the resume file'}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Drag a PDF here, or choose a file. We extract the text and check how well ATS software can read it.
          </p>
        </div>

        <input
          ref={inputRef}
          id="resume-file"
          type="file"
          accept=".pdf,application/pdf,.txt,text/plain"
          className="sr-only"
          disabled={isBlocked}
          aria-label="Resume file (PDF or TXT, up to 4 MB)"
          aria-describedby={error ? 'resume-file-error' : undefined}
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) onFile(file)
          }}
        />
        <button
          type="button"
          disabled={isBlocked}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-10 items-center rounded-lg border bg-card px-4 text-sm font-medium shadow-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        >
          Choose file
        </button>
        <p className="text-xs text-muted-foreground">PDF or TXT · up to 4 MB</p>
      </div>

      {error && (
        <p id="resume-file-error" role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
