export type AtsStatus = 'pass' | 'warn' | 'fail'
export type AtsLevel = 'optimized' | 'needs-work' | 'not-optimized'

export interface AtsCheck {
  id: string
  label: string
  status: AtsStatus
  detail: string
}

export interface AtsReport {
  score: number
  level: AtsLevel
  summary: string
  checks: AtsCheck[]
}

export interface AtsInput {
  text: string
  /** Null when the source has no pages (plain text files). */
  pageCount: number | null
  producer?: string
  creator?: string
  /** Share of text lines split by a wide horizontal gap (columns/tables). Null when unknown. */
  wideGapLineRatio: number | null
}

interface WeightedCheck extends AtsCheck {
  weight: number
}

const STATUS_FACTOR: Record<AtsStatus, number> = { pass: 1, warn: 0.5, fail: 0 }

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/
const YEAR_PATTERN = /\b(?:19|20)\d{2}\b/g
const SYMBOL_PATTERN = /[\uE000-\uF8FF\uFFFD\u2700-\u27BF\u2B00-\u2BFF]/g
const DESIGN_TOOL_PATTERN = /canva|photoshop|illustrator|indesign|figma|powerpoint|keynote|sketch/i

const SECTION_PATTERNS: Record<string, RegExp> = {
  experience:
    /^\s*(?:work\s+|professional\s+|employment\s+)?(?:experience|history)|^\s*(?:experiencia|trayectoria|employment)/im,
  education: /^\s*(?:education|academic|studies|educaci[oó]n|formaci[oó]n|estudios)/im,
  skills:
    /^\s*(?:technical\s+|key\s+|core\s+)?(?:skills|competenc|technologies|tech\s+stack|habilidades|competencias|tecnolog[ií]as)/im,
}

function check(
  weight: number,
  id: string,
  label: string,
  status: AtsStatus,
  detail: string,
): WeightedCheck {
  return { weight, id, label, status, detail }
}

function checkSelectableText(text: string, pageCount: number | null): WeightedCheck {
  const chars = text.replace(/\s/g, '').length
  const perPage = pageCount ? chars / pageCount : chars
  if (chars < 200 || perPage < 120) {
    return check(
      30,
      'text',
      'Selectable text',
      'fail',
      'Almost no readable text was found. The file is probably a scan or exported as an image, so an ATS cannot read it. Export it again as a text-based PDF.',
    )
  }
  if (pageCount !== null && perPage < 400) {
    return check(
      30,
      'text',
      'Selectable text',
      'warn',
      'Very little text per page was detected. Part of the content may be embedded as images or graphics.',
    )
  }
  return check(30, 'text', 'Selectable text', 'pass', 'The text can be extracted correctly.')
}

function checkContact(text: string): WeightedCheck {
  const hasEmail = EMAIL_PATTERN.test(text)
  const hasPhone = PHONE_PATTERN.test(text)
  if (hasEmail && hasPhone) {
    return check(15, 'contact', 'Contact details', 'pass', 'Email and phone number were found as plain text.')
  }
  if (hasEmail || hasPhone) {
    return check(
      15,
      'contact',
      'Contact details',
      'warn',
      `${hasEmail ? 'Phone number' : 'Email address'} not detected. Keep contact details as plain text, outside headers, footers and images.`,
    )
  }
  return check(
    15,
    'contact',
    'Contact details',
    'fail',
    'No email or phone number was detected. They may sit in a header, footer or image that ATS parsers skip.',
  )
}

function checkSections(text: string): WeightedCheck {
  const found = Object.entries(SECTION_PATTERNS)
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name)
  const missing = Object.keys(SECTION_PATTERNS).filter((name) => !found.includes(name))

  if (missing.length === 0) {
    return check(20, 'sections', 'Standard sections', 'pass', 'Experience, education and skills headings were recognised.')
  }
  const detail = `Missing or unusual headings: ${missing.join(', ')}. Use standard titles such as "Experience", "Education" and "Skills".`
  return check(20, 'sections', 'Standard sections', found.length >= 2 ? 'warn' : 'fail', detail)
}

function checkLayout(wideGapLineRatio: number | null): WeightedCheck | null {
  if (wideGapLineRatio === null) return null
  if (wideGapLineRatio >= 0.12) {
    return check(
      15,
      'layout',
      'Single-column layout',
      'warn',
      'Possible multi-column or table layout. Many ATS read columns line by line, mixing unrelated content. Prefer a single column.',
    )
  }
  return check(15, 'layout', 'Single-column layout', 'pass', 'The content flows in a single, linear reading order.')
}

function checkDates(text: string): WeightedCheck {
  const years = text.match(YEAR_PATTERN)?.length ?? 0
  if (years >= 2) {
    return check(5, 'dates', 'Dates', 'pass', 'Employment dates were detected.')
  }
  return check(
    5,
    'dates',
    'Dates',
    'warn',
    'Few dates were detected. ATS use dates to calculate years of experience; add a start and end for each role.',
  )
}

function checkLength(pageCount: number | null): WeightedCheck | null {
  if (pageCount === null) return null
  if (pageCount <= 2) {
    return check(5, 'length', 'Length', 'pass', `${pageCount} page${pageCount === 1 ? '' : 's'}, a good length.`)
  }
  return check(
    5,
    'length',
    'Length',
    'warn',
    `${pageCount} pages. Most recruiters and ATS profiles work best with one or two pages.`,
  )
}

function checkSymbols(text: string): WeightedCheck {
  const symbols = text.match(SYMBOL_PATTERN)?.length ?? 0
  if (symbols > 15 || (text.length > 0 && symbols / text.length > 0.01)) {
    return check(
      5,
      'symbols',
      'Icons and symbols',
      'warn',
      'Icons or decorative symbols were found. They often turn into unreadable characters in an ATS. Use plain text labels.',
    )
  }
  return check(5, 'symbols', 'Icons and symbols', 'pass', 'No problematic icons or special characters detected.')
}

function checkProducer(producer?: string, creator?: string): WeightedCheck | null {
  const tool = [producer, creator].find((value) => value && DESIGN_TOOL_PATTERN.test(value))
  if (!tool) return null
  return check(
    5,
    'producer',
    'Export tool',
    'warn',
    `Created with a design tool (${tool.trim()}). Visual templates often use columns and graphics; verify the text order after exporting.`,
  )
}

function levelFor(score: number, checks: AtsCheck[]): AtsLevel {
  const textCheck = checks.find((item) => item.id === 'text')
  if (textCheck?.status === 'fail') return 'not-optimized'
  if (score >= 80 && !checks.some((item) => item.status === 'fail')) return 'optimized'
  if (score >= 50) return 'needs-work'
  return 'not-optimized'
}

const SUMMARIES: Record<AtsLevel, string> = {
  optimized: 'This file is well optimized for ATS parsing.',
  'needs-work': 'This file can be read, but some issues may reduce how well an ATS parses it.',
  'not-optimized': 'This file is not optimized for ATS and may be parsed incorrectly or ignored.',
}

export function analyzeAts(input: AtsInput): AtsReport {
  const checks = [
    checkSelectableText(input.text, input.pageCount),
    checkContact(input.text),
    checkSections(input.text),
    checkLayout(input.wideGapLineRatio),
    checkDates(input.text),
    checkLength(input.pageCount),
    checkSymbols(input.text),
    checkProducer(input.producer, input.creator),
  ].filter((item): item is WeightedCheck => item !== null)

  const totalWeight = checks.reduce((sum, item) => sum + item.weight, 0)
  const earned = checks.reduce((sum, item) => sum + item.weight * STATUS_FACTOR[item.status], 0)
  const score = Math.round((earned / totalWeight) * 100)
  const level = levelFor(score, checks)

  return {
    score,
    level,
    summary: SUMMARIES[level],
    checks: checks.map(({ id, label, status, detail }) => ({ id, label, status, detail })),
  }
}
