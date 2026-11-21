import { NextResponse } from 'next/server'
import { z } from 'zod'
import { extractJobText, JobLinkError, parseJobUrl } from '@/lib/job-link'
import { checkRateLimit, getClientKey } from '@/lib/rate-limit'
import { fetchPublicPage } from '@/lib/safe-fetch'

export const maxDuration = 30

const RATE_LIMIT = { limit: 10, windowMs: 60_000 }
const NO_STORE = { 'Cache-Control': 'no-store' }
const MAX_BODY_BYTES = 4_000

const bodySchema = z.object({ url: z.string().min(1, 'Enter a job posting link.').max(2048) })

function errorResponse(message: string, status: number, headers: Record<string, string> = {}) {
  return NextResponse.json({ error: message }, { status, headers: { ...NO_STORE, ...headers } })
}

const STATUS_BY_CODE: Record<JobLinkError['code'], number> = {
  'invalid-url': 400,
  'private-address': 400,
  blocked: 422,
  'not-found': 404,
  timeout: 504,
  unreachable: 502,
  unsupported: 415,
  'too-large': 413,
  'no-content': 422,
}

export async function POST(request: Request) {
  const rate = checkRateLimit(`job-link:${getClientKey(request.headers)}`, RATE_LIMIT)
  if (!rate.allowed) {
    return errorResponse('Too many requests. Please wait a moment and try again.', 429, {
      'Retry-After': String(rate.retryAfterSeconds),
    })
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return errorResponse('Content-Type must be application/json.', 415)
  }

  let body: unknown
  try {
    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) return errorResponse('The request body is too large.', 413)
    body = JSON.parse(raw)
  } catch {
    return errorResponse('The request body must be valid JSON.', 400)
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid request.', 400)
  }

  try {
    const url = parseJobUrl(parsed.data.url)
    const { finalUrl, html } = await fetchPublicPage(url)
    const job = extractJobText(html)

    return NextResponse.json(
      {
        text: job.text,
        title: job.title,
        truncated: job.truncated,
        source: job.source,
        host: finalUrl.hostname.replace(/^www\./, ''),
      },
      { headers: NO_STORE },
    )
  } catch (error) {
    if (error instanceof JobLinkError) {
      return errorResponse(error.message, STATUS_BY_CODE[error.code])
    }
    console.error('[job-link] Unexpected failure:', error)
    return errorResponse('We could not import that link. Paste the job description text instead.', 500)
  }
}
