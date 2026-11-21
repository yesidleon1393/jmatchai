import { NextResponse } from 'next/server'
import { checkRateLimit, getClientKey } from '@/lib/rate-limit'
import { MAX_RESUME_FILE_BYTES, parseResumeFile, ResumeFileError } from '@/lib/resume-file'

export const maxDuration = 30

const RATE_LIMIT = { limit: 15, windowMs: 60_000 }
const NO_STORE = { 'Cache-Control': 'no-store' }
// Multipart framing adds a little overhead on top of the file itself.
const MAX_REQUEST_BYTES = MAX_RESUME_FILE_BYTES + 64 * 1024

function errorResponse(message: string, status: number, headers: Record<string, string> = {}) {
  return NextResponse.json({ error: message }, { status, headers: { ...NO_STORE, ...headers } })
}

export async function POST(request: Request) {
  const rate = checkRateLimit(`parse-resume:${getClientKey(request.headers)}`, RATE_LIMIT)
  if (!rate.allowed) {
    return errorResponse('Too many uploads. Please wait a moment and try again.', 429, {
      'Retry-After': String(rate.retryAfterSeconds),
    })
  }

  if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
    return errorResponse('Content-Type must be multipart/form-data.', 415)
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > MAX_REQUEST_BYTES) {
    return errorResponse('The file is too large. The maximum size is 4 MB.', 413)
  }

  let file: FormDataEntryValue | null
  try {
    file = (await request.formData()).get('file')
  } catch {
    return errorResponse('The upload could not be read.', 400)
  }

  if (!(file instanceof File)) {
    return errorResponse('No file was uploaded.', 400)
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const parsed = await parseResumeFile({ name: file.name, size: file.size }, bytes)
    return NextResponse.json(
      {
        fileName: file.name.slice(0, 200),
        fileSize: file.size,
        text: parsed.text,
        truncated: parsed.truncated,
        pageCount: parsed.pageCount,
        ats: parsed.ats,
      },
      { headers: NO_STORE },
    )
  } catch (error) {
    if (error instanceof ResumeFileError) {
      return errorResponse(error.message, error.status)
    }
    console.error('[parse-resume] Unexpected failure:', error)
    return errorResponse('We could not read this file. Please try another one or paste the text.', 500)
  }
}
