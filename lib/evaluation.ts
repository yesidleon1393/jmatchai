import { z } from 'zod'

export const MIN_INPUT_LENGTH = 100
export const MAX_INPUT_LENGTH = 20000

export const evaluateRequestSchema = z.object({
  jobDescription: z
    .string()
    .trim()
    .min(MIN_INPUT_LENGTH, `The job description must be at least ${MIN_INPUT_LENGTH} characters.`)
    .max(MAX_INPUT_LENGTH, `The job description must be at most ${MAX_INPUT_LENGTH} characters.`),
  resume: z
    .string()
    .trim()
    .min(MIN_INPUT_LENGTH, `The resume must be at least ${MIN_INPUT_LENGTH} characters.`)
    .max(MAX_INPUT_LENGTH, `The resume must be at most ${MAX_INPUT_LENGTH} characters.`),
})

export const evaluationResultSchema = z.object({
  score: z
    .number()
    .describe('Overall compatibility score between the candidate and the job, from 0 to 100.'),
  assessment: z
    .string()
    .describe('A concise 2–3 sentence explanation of the score, written for a recruiter.'),
  strengths: z
    .array(z.string())
    .describe('2–5 short bullet points: concrete ways the candidate matches the job requirements.'),
  areasToInvestigate: z
    .array(z.string())
    .describe('2–5 short bullet points: gaps, risks or unclear points to verify in an interview.'),
})

export type EvaluateRequest = z.infer<typeof evaluateRequestSchema>
export type EvaluationResult = z.infer<typeof evaluationResultSchema>

export type MatchTier = 'excellent' | 'good' | 'partial' | 'low'

export interface MatchClassification {
  tier: MatchTier
  label: string
}

export function classifyScore(score: number): MatchClassification {
  if (score >= 85) return { tier: 'excellent', label: 'Excellent Match' }
  if (score >= 70) return { tier: 'good', label: 'Good Match' }
  if (score >= 50) return { tier: 'partial', label: 'Partial Match' }
  return { tier: 'low', label: 'Low Match' }
}

export function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)))
}

export type EvaluationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; result: EvaluationResult }
