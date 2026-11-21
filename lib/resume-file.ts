import { extractText, getDocumentProxy, getMeta } from 'unpdf'
import { analyzeAts, type AtsReport } from '@/lib/ats'
import { MAX_INPUT_LENGTH } from '@/lib/evaluation'

export const MAX_RESUME_FILE_BYTES = 4 * 1024 * 1024
const LAYOUT_PAGES_TO_SCAN = 3
const WIDE_GAP_RATIO_OF_PAGE_WIDTH = 0.12

export interface ParsedResume {
  text: string
  truncated: boolean
  pageCount: number | null
  ats: AtsReport
}

export class ResumeFileError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
  ) {
    super(message)
    this.name = 'ResumeFileError'
  }
}

export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function hasPdfSignature(bytes: Uint8Array): boolean {
  // %PDF- may appear within the first 1024 bytes according to the PDF spec.
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 1024))
  return head.includes('%PDF-')
}

interface PositionedItem {
  str: string
  transform: number[]
  width: number
}

async function measureWideGapRatio(pdf: Awaited<ReturnType<typeof getDocumentProxy>>): Promise<number | null> {
  let lines = 0
  let wideGapLines = 0
  const pages = Math.min(pdf.numPages, LAYOUT_PAGES_TO_SCAN)

  for (let pageNumber = 1; pageNumber <= pages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const pageWidth = page.getViewport({ scale: 1 }).width
    const content = await page.getTextContent()

    const rows = new Map<number, PositionedItem[]>()
    for (const item of content.items as unknown[]) {
      const candidate = item as Partial<PositionedItem>
      if (!candidate.str?.trim() || !candidate.transform) continue
      const rowKey = Math.round(candidate.transform[5] / 3)
      const row = rows.get(rowKey) ?? []
      row.push(candidate as PositionedItem)
      rows.set(rowKey, row)
    }

    for (const row of rows.values()) {
      lines += 1
      const sorted = [...row].sort((a, b) => a.transform[4] - b.transform[4])
      const hasWideGap = sorted.some((item, index) => {
        const previous = sorted[index - 1]
        if (!previous) return false
        const gap = item.transform[4] - (previous.transform[4] + previous.width)
        return gap > pageWidth * WIDE_GAP_RATIO_OF_PAGE_WIDTH
      })
      if (hasWideGap) wideGapLines += 1
    }
  }

  return lines === 0 ? null : wideGapLines / lines
}

async function parsePdf(bytes: Uint8Array): Promise<ParsedResume> {
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>
  try {
    pdf = await getDocumentProxy(bytes)
  } catch (error) {
    const name = error instanceof Error ? error.name : ''
    if (name === 'PasswordException') {
      throw new ResumeFileError('This PDF is password protected. Remove the password and upload it again.')
    }
    throw new ResumeFileError('This PDF could not be read. It may be corrupted; try exporting it again.')
  }

  const { text: rawText, totalPages } = await extractText(pdf, { mergePages: true })
  const meta = await getMeta(pdf).catch(() => null)
  const wideGapLineRatio = await measureWideGapRatio(pdf).catch(() => null)
  const text = normalizeText(rawText)

  const ats = analyzeAts({
    text,
    pageCount: totalPages,
    producer: meta?.info?.Producer,
    creator: meta?.info?.Creator,
    wideGapLineRatio,
  })

  return {
    text: text.slice(0, MAX_INPUT_LENGTH),
    truncated: text.length > MAX_INPUT_LENGTH,
    pageCount: totalPages,
    ats,
  }
}

function parsePlainText(bytes: Uint8Array): ParsedResume {
  const text = normalizeText(new TextDecoder('utf-8').decode(bytes))
  const ats = analyzeAts({ text, pageCount: null, wideGapLineRatio: null })
  return {
    text: text.slice(0, MAX_INPUT_LENGTH),
    truncated: text.length > MAX_INPUT_LENGTH,
    pageCount: null,
    ats,
  }
}

export async function parseResumeFile(file: { name: string; size: number }, bytes: Uint8Array): Promise<ParsedResume> {
  if (file.size === 0 || bytes.length === 0) {
    throw new ResumeFileError('The file is empty.')
  }
  if (bytes.length > MAX_RESUME_FILE_BYTES) {
    throw new ResumeFileError('The file is too large. The maximum size is 4 MB.', 413)
  }

  const lowerName = file.name.toLowerCase()
  if (lowerName.endsWith('.pdf')) {
    if (!hasPdfSignature(bytes)) {
      throw new ResumeFileError('This file is not a valid PDF.', 415)
    }
    return parsePdf(bytes)
  }
  if (lowerName.endsWith('.txt')) {
    return parsePlainText(bytes)
  }
  throw new ResumeFileError('Unsupported file type. Upload a PDF or a plain text (.txt) resume.', 415)
}
