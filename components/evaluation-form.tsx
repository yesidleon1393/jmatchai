'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Briefcase, Loader2, RotateCcw, UserRound, Wand2, AlertTriangle } from 'lucide-react'
import { ResultPanel } from '@/components/result-panel'
import { TextFieldWithCounter } from '@/components/text-field-with-counter'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  MAX_INPUT_LENGTH,
  MIN_INPUT_LENGTH,
  type EvaluationResult,
  type EvaluationState,
} from '@/lib/evaluation'

const GENERIC_ERROR = 'Something went wrong while analyzing the candidate. Please try again.'

async function requestEvaluation(
  jobDescription: string,
  resume: string,
): Promise<EvaluationResult> {
  const response = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription, resume }),
  })

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : GENERIC_ERROR
    throw new Error(message)
  }

  return payload as EvaluationResult
}

export function EvaluationForm() {
  const [jobDescription, setJobDescription] = useState('')
  const [resume, setResume] = useState('')
  const [showValidation, setShowValidation] = useState(false)
  const [state, setState] = useState<EvaluationState>({ status: 'idle' })

  const jobRef = useRef<HTMLTextAreaElement>(null)
  const resumeRef = useRef<HTMLTextAreaElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const isLoading = state.status === 'loading'

  useEffect(() => {
    if (state.status === 'success' || state.status === 'error') {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [state.status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return

    const job = jobDescription.trim()
    const candidate = resume.trim()

    if (job.length < MIN_INPUT_LENGTH || candidate.length < MIN_INPUT_LENGTH) {
      setShowValidation(true)
      ;(job.length < MIN_INPUT_LENGTH ? jobRef : resumeRef).current?.focus()
      return
    }

    setState({ status: 'loading' })
    try {
      const result = await requestEvaluation(job, candidate)
      setState({ status: 'success', result })
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

  function handleReset() {
    setJobDescription('')
    setResume('')
    setShowValidation(false)
    setState({ status: 'idle' })
    jobRef.current?.focus()
  }

  const hasContent = jobDescription.length > 0 || resume.length > 0

  return (
    <div className="flex flex-col gap-10">
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isLoading}
        className="rounded-2xl border bg-card p-4 shadow-xs sm:p-8"
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <TextFieldWithCounter
            id="job-description"
            label="Job Description"
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={setJobDescription}
            minLength={MIN_INPUT_LENGTH}
            maxLength={MAX_INPUT_LENGTH}
            showError={showValidation}
            disabled={isLoading}
            textareaRef={jobRef}
            icon={<Briefcase className="size-4 text-primary" aria-hidden="true" />}
          />
          <TextFieldWithCounter
            id="candidate-resume"
            label="Candidate Resume"
            placeholder="Paste the candidate's resume here..."
            value={resume}
            onChange={setResume}
            minLength={MIN_INPUT_LENGTH}
            maxLength={MAX_INPUT_LENGTH}
            showError={showValidation}
            disabled={isLoading}
            textareaRef={resumeRef}
            icon={<UserRound className="size-4 text-primary" aria-hidden="true" />}
          />
        </div>

        <div className="mt-8 flex flex-col-reverse items-stretch gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Your text is sent securely to the evaluation service and is not stored.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {hasContent && (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={handleReset}
                disabled={isLoading}
                className="h-11 gap-2 px-4"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Clear
              </Button>
            )}
            <Button type="submit" size="lg" disabled={isLoading} className="h-11 gap-2 px-6 text-sm font-semibold">
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
    </div>
  )
}
