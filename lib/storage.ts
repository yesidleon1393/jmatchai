import { z } from 'zod'
import { MAX_INPUT_LENGTH, evaluationResultSchema } from '@/lib/evaluation'

export const DRAFT_STORAGE_KEY = 'jmatch:draft:v1'
export const HISTORY_STORAGE_KEY = 'jmatch:history:v1'
export const MAX_HISTORY_ENTRIES = 10

const atsReportSchema = z.object({
  score: z.number(),
  level: z.enum(['optimized', 'needs-work', 'not-optimized']),
  summary: z.string(),
  checks: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      status: z.enum(['pass', 'warn', 'fail']),
      detail: z.string(),
    }),
  ),
})

export const resumeFileInfoSchema = z.object({
  name: z.string().max(200),
  size: z.number(),
  pageCount: z.number().nullable(),
  truncated: z.boolean(),
  ats: atsReportSchema,
})

export const jobSourceSchema = z.object({
  host: z.string().max(255),
  title: z.string().max(300),
})

const draftSchema = z.object({
  jobDescription: z.string().max(MAX_INPUT_LENGTH),
  jobUrl: z.string().max(2048),
  jobSource: jobSourceSchema.nullable(),
  resume: z.string().max(MAX_INPUT_LENGTH),
  resumeFile: resumeFileInfoSchema.nullable(),
})

const historyEntrySchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  jobTitle: z.string(),
  candidateName: z.string(),
  jobDescription: z.string().max(MAX_INPUT_LENGTH),
  resume: z.string().max(MAX_INPUT_LENGTH),
  result: evaluationResultSchema,
})

export type ResumeFileInfo = z.infer<typeof resumeFileInfoSchema>
export type JobSource = z.infer<typeof jobSourceSchema>
export type Draft = z.infer<typeof draftSchema>
export type HistoryEntry = z.infer<typeof historyEntrySchema>

export const EMPTY_DRAFT: Draft = {
  jobDescription: '',
  jobUrl: '',
  jobSource: null,
  resume: '',
  resumeFile: null,
}

export function isDraftEmpty(draft: Draft): boolean {
  return !draft.jobDescription && !draft.resume && !draft.jobUrl && !draft.resumeFile
}

function getStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    // Access can throw when storage is disabled (e.g. strict privacy modes).
    return null
  }
}

function readJson<T>(key: string, schema: z.ZodType<T>): T | null {
  const storage = getStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const parsed = schema.safeParse(JSON.parse(raw))
    if (parsed.success) return parsed.data
    storage.removeItem(key)
  } catch {
    storage?.removeItem(key)
  }
  return null
}

function writeJson(key: string, value: unknown): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    // Quota exceeded or storage unavailable: persistence is best-effort.
    return false
  }
}

function remove(key: string): void {
  try {
    getStorage()?.removeItem(key)
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

export function readDraft(): Draft | null {
  return readJson(DRAFT_STORAGE_KEY, draftSchema)
}

export function writeDraft(draft: Draft): void {
  if (isDraftEmpty(draft)) remove(DRAFT_STORAGE_KEY)
  else writeJson(DRAFT_STORAGE_KEY, draft)
}

export function readHistory(): HistoryEntry[] {
  return readJson(HISTORY_STORAGE_KEY, z.array(historyEntrySchema))?.slice(0, MAX_HISTORY_ENTRIES) ?? []
}

export function writeHistory(entries: HistoryEntry[]): void {
  if (entries.length === 0) {
    remove(HISTORY_STORAGE_KEY)
    return
  }
  const capped = entries.slice(0, MAX_HISTORY_ENTRIES)
  // If the quota is exceeded, keep dropping the oldest entries until it fits.
  for (let keep = capped.length; keep > 0; keep -= 1) {
    if (writeJson(HISTORY_STORAGE_KEY, capped.slice(0, keep))) return
  }
}

export function firstLine(text: string, fallback: string, maxLength = 80): string {
  const line = text
    .split('\n')
    .map((value) => value.trim())
    .find(Boolean)
  if (!line) return fallback
  return line.length > maxLength ? `${line.slice(0, maxLength - 1)}…` : line
}

export function createHistoryEntry(
  input: Pick<HistoryEntry, 'jobDescription' | 'resume' | 'result'>,
  now: number = Date.now(),
): HistoryEntry {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${now}-${Math.random().toString(36).slice(2)}`,
    createdAt: now,
    jobTitle: firstLine(input.jobDescription, 'Untitled job'),
    candidateName: firstLine(input.resume, 'Unnamed candidate', 60),
    jobDescription: input.jobDescription,
    resume: input.resume,
    result: input.result,
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
