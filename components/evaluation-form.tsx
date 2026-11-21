'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  Briefcase,
  Dices,
  FileUp,
  Loader2,
  RotateCcw,
  Type,
  UserRound,
  Wand2,
} from 'lucide-react'
import { AtsReport } from '@/components/ats-report'
import { HistoryPanel } from '@/components/history-panel'
import { ModeToggle } from '@/components/mode-toggle'
import { ResultPanel } from '@/components/result-panel'
import { ResumeUpload } from '@/components/resume-upload'
import { TextFieldWithCounter } from '@/components/text-field-with-counter'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { pickRandomDemoCase } from '@/lib/demo-data'
import {
  MAX_INPUT_LENGTH,
  MIN_INPUT_LENGTH,
  type EvaluationResult,
  type EvaluationState,
} from '@/lib/evaluation'
import {
  EMPTY_DRAFT,
  createHistoryEntry,
  readDraft,
  readHistory,
  writeDraft,
  writeHistory,
  type Draft,
  type HistoryEntry,
} from '@/lib/storage'

const GENERIC_ERROR = 'Something went wrong while analyzing the candidate. Please try again.'
const DRAFT_SAVE_DELAY_MS = 400

type ResumeMode = 'text' | 'upload'

async function readError(response: Response, fallback: string): Promise<string> {
  const payload: unknown = await response.json().catch(() => null)
  return payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
    ? payload.error
    : fallback
}

async function requestEvaluation(jobDescription: string, resume: string): Promise<EvaluationResult> {
  const response = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription, resume }),
  })
  if (!response.ok) throw new Error(await readError(response, GENERIC_ERROR))
  return (await response.json()) as EvaluationResult
}

interface UploadedResume {
  fileName: string
  fileSize: number
  text: string
  truncated: boolean
  pageCount: number | null
  ats: NonNullable<Draft['resumeFile']>['ats']
}

async function requestResumeUpload(file: File): Promise<UploadedResume> {
  const body = new FormData()
  body.append('file', file)
  const response = await fetch('/api/parse-resume', { method: 'POST', body })
  if (!response.ok) throw new Error(await readError(response, 'We could not read this file. Paste the text instead.'))
  return (await response.json()) as UploadedResume
}

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

export function EvaluationForm() {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  const [resumeMode, setResumeMode] = useState<ResumeMode>('text')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [showValidation, setShowValidation] = useState(false)
  const [state, setState] = useState<EvaluationState>({ status: 'idle' })

  const jobRef = useRef<HTMLTextAreaElement>(null)
  const resumeRef = useRef<HTMLTextAreaElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const demoIdRef = useRef<string | undefined>(undefined)

  const isLoading = state.status === 'loading'
  const isBusy = isLoading || isUploading

  const updateDraft = useCallback((patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }, [])

  useEffect(() => {
    const savedDraft = readDraft()
    if (savedDraft) setDraft(savedDraft)
    setHistory(readHistory())
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    const timeout = window.setTimeout(() => writeDraft(draft), DRAFT_SAVE_DELAY_MS)
    return () => window.clearTimeout(timeout)
  }, [draft, isHydrated])

  useEffect(() => {
    if (state.status === 'success' || state.status === 'error') {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [state.status])

  function persistHistory(next: HistoryEntry[]) {
    setHistory(next)
    writeHistory(next)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isBusy) return

    const job = draft.jobDescription.trim()
    const candidate = draft.resume.trim()

    if (job.length < MIN_INPUT_LENGTH || candidate.length < MIN_INPUT_LENGTH) {
      setShowValidation(true)
      if (job.length < MIN_INPUT_LENGTH) {
        window.setTimeout(() => jobRef.current?.focus(), 0)
      } else {
        setResumeMode('text')
        window.setTimeout(() => resumeRef.current?.focus(), 0)
      }
      return
    }

    setState({ status: 'loading' })
    try {
      const result = await requestEvaluation(job, candidate)
      setState({ status: 'success', result })
      persistHistory([
        createHistoryEntry({ jobDescription: job, resume: candidate, result }),
        ...history,
      ])
    } catch (error) {
      setState({
        status: 'error',
        message:
          error instanceof TypeError
            ? 'Network error. Check your connection and try again.'
            : error instanceof Error
              ? error.message
              : GENERIC_ERROR,
      })
    }
  }

  async function handleResumeFile(file: File) {
    setUploadError(null)
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError('The file is too large. The maximum size is 4 MB.')
      return
    }

    setIsUploading(true)
    try {
      const parsed = await requestResumeUpload(file)
      updateDraft({
        resume: parsed.text,
        resumeFile: {
          name: parsed.fileName,
          size: parsed.fileSize,
          pageCount: parsed.pageCount,
          truncated: parsed.truncated,
          ats: parsed.ats,
        },
      })
      setResumeMode('text')
      setShowValidation(false)
    } catch (error) {
      setUploadError(
        error instanceof TypeError
          ? 'Network error. Check your connection and try again.'
          : error instanceof Error
            ? error.message
            : 'We could not read this file.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  function resetInputModes() {
    setResumeMode('text')
    setUploadError(null)
  }

  function handleFillDemo() {
    const demoCase = pickRandomDemoCase(demoIdRef.current)
    demoIdRef.current = demoCase.id
    setDraft({
      ...EMPTY_DRAFT,
      jobDescription: demoCase.jobDescription,
      resume: demoCase.resume,
    })
    resetInputModes()
    setShowValidation(false)
    setState({ status: 'idle' })
  }

  function handleReset() {
    demoIdRef.current = undefined
    setDraft(EMPTY_DRAFT)
    resetInputModes()
    setShowValidation(false)
    setState({ status: 'idle' })
    jobRef.current?.focus()
  }

  function handleRestore(entry: HistoryEntry) {
    setDraft({ ...EMPTY_DRAFT, jobDescription: entry.jobDescription, resume: entry.resume })
    resetInputModes()
    setShowValidation(false)
    setState({ status: 'success', result: entry.result })
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const hasContent = Boolean(draft.jobDescription || draft.resume || draft.resumeFile)

  return (
    <div className="flex flex-col gap-10">
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isBusy}
        className="rounded-2xl border bg-card p-4 shadow-xs sm:p-8"
      >
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <TextFieldWithCounter
              id="job-description"
              label="Job Description"
              placeholder="Paste the job description here..."
              value={draft.jobDescription}
              onChange={(jobDescription) => updateDraft({ jobDescription })}
              minLength={MIN_INPUT_LENGTH}
              maxLength={MAX_INPUT_LENGTH}
              showError={showValidation}
              disabled={isBusy}
              textareaRef={jobRef}
              icon={<Briefcase className="size-4 text-primary" aria-hidden="true" />}
            />
          </div>

          <div className="flex flex-col gap-4">
            {resumeMode === 'upload' ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <UserRound className="size-4 text-primary" aria-hidden="true" />
                    Candidate Resume
                    <span className="text-xs font-normal text-muted-foreground">Required</span>
                  </span>
                  <ModeToggle
                    ariaLabel="Resume input method"
                    value={resumeMode}
                    onChange={setResumeMode}
                    disabled={isBusy}
                    options={[
                      { value: 'text', label: 'Paste text', icon: <Type className="size-3.5" aria-hidden="true" /> },
                      { value: 'upload', label: 'Upload file', icon: <FileUp className="size-3.5" aria-hidden="true" /> },
                    ]}
                  />
                </div>
                <ResumeUpload
                  onFile={handleResumeFile}
                  isUploading={isUploading}
                  error={uploadError}
                  disabled={isLoading}
                />
              </div>
            ) : (
              <TextFieldWithCounter
                id="candidate-resume"
                label="Candidate Resume"
                placeholder="Paste the candidate's resume here..."
                value={draft.resume}
                onChange={(resume) => updateDraft({ resume })}
                minLength={MIN_INPUT_LENGTH}
                maxLength={MAX_INPUT_LENGTH}
                showError={showValidation}
                disabled={isBusy}
                textareaRef={resumeRef}
                icon={<UserRound className="size-4 text-primary" aria-hidden="true" />}
                headerAction={
                  <ModeToggle
                    ariaLabel="Resume input method"
                    value={resumeMode}
                    onChange={setResumeMode}
                    disabled={isBusy}
                    options={[
                      { value: 'text', label: 'Paste text', icon: <Type className="size-3.5" aria-hidden="true" /> },
                      { value: 'upload', label: 'Upload file', icon: <FileUp className="size-3.5" aria-hidden="true" /> },
                    ]}
                  />
                }
              />
            )}

            {draft.resumeFile && (
              <AtsReport
                file={draft.resumeFile}
                disabled={isBusy}
                onRemove={() => updateDraft({ resumeFile: null })}
              />
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse items-stretch gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Text and files are sent securely to the evaluation service and are not stored on our servers. Your
            draft and recent evaluations are saved only in this browser.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleFillDemo}
              disabled={isBusy}
              className="h-11 gap-2 px-4"
            >
              <Dices className="size-4" aria-hidden="true" />
              Fill with demo data
            </Button>
            {hasContent && (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={handleReset}
                disabled={isBusy}
                className="h-11 gap-2 px-4"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Clear
              </Button>
            )}
            <Button type="submit" size="lg" disabled={isBusy} className="h-11 gap-2 px-6 text-sm font-semibold">
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Analyzing candidate...
                </>
              ) : (
                <>
                  <Wand2 className="size-4" aria-hidden="true" />
                  Analyze Candidate
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      <div ref={resultsRef} aria-live="polite" className="scroll-mt-24">
        {state.status === 'loading' && (
          <div
            role="status"
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-14 text-center"
          >
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground">Evaluating compatibility</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Comparing the candidate&apos;s experience against the job requirements. This usually takes a few seconds.
            </p>
          </div>
        )}

        {state.status === 'error' && (
          <Alert variant="destructive" role="alert" className="bg-card">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>We couldn&apos;t complete the evaluation</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        {state.status === 'success' && <ResultPanel result={state.result} />}
      </div>

      <HistoryPanel
        entries={history}
        disabled={isBusy}
        onRestore={handleRestore}
        onDelete={(id) => persistHistory(history.filter((entry) => entry.id !== id))}
        onClear={() => persistHistory([])}
      />
    </div>
  )
}
