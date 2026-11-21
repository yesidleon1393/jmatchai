import { MAX_INPUT_LENGTH } from '@/lib/evaluation'

export type JobLinkErrorCode =
  | 'invalid-url'
  | 'private-address'
  | 'blocked'
  | 'not-found'
  | 'timeout'
  | 'unreachable'
  | 'unsupported'
  | 'too-large'
  | 'no-content'

export class JobLinkError extends Error {
  constructor(
    readonly code: JobLinkErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'JobLinkError'
  }
}

const MAX_URL_LENGTH = 2048
const BLOCKED_HOST_SUFFIXES = ['.local', '.internal', '.localhost', '.lan', '.home', '.corp']
const MIN_JOB_TEXT_LENGTH = 200

/** Validates a user-supplied URL. Only public https URLs on the default port are allowed. */
export function parseJobUrl(input: string, base?: URL): URL {
  const trimmed = input.trim()
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) {
    throw new JobLinkError('invalid-url', 'Enter a valid job posting link.')
  }

  const withScheme = base || /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`

  let url: URL
  try {
    url = base ? new URL(withScheme, base) : new URL(withScheme)
  } catch {
    throw new JobLinkError('invalid-url', 'Enter a valid job posting link.')
  }

  if (url.protocol === 'http:') url.protocol = 'https:'
  if (url.protocol !== 'https:') {
    throw new JobLinkError('invalid-url', 'Only http(s) links are supported.')
  }
  if (url.username || url.password) {
    throw new JobLinkError('invalid-url', 'Links with credentials are not supported.')
  }
  if (url.port && url.port !== '443') {
    throw new JobLinkError('invalid-url', 'Links with a custom port are not supported.')
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
  const isIpLiteral = /^[\d.]+$/.test(hostname) || hostname.includes(':') || hostname.startsWith('[')
  if (
    isIpLiteral ||
    !hostname.includes('.') ||
    hostname === 'localhost' ||
    BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  ) {
    throw new JobLinkError('private-address', 'This address is not allowed. Use a public job posting link.')
  }

  url.hash = ''
  return url
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  bull: '•',
  middot: '·',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
}

export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match
  })
}

export function htmlToText(html: string): string {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|ul|ol|h[1-6]|tr|table|header|footer)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')

  return decodeEntities(text)
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(', ')
  if (value && typeof value === 'object' && 'name' in value) return asText((value as { name: unknown }).name)
  return ''
}

function findJobPostings(node: unknown, found: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(node)) {
    node.forEach((child) => findJobPostings(child, found))
  } else if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>
    const type = record['@type']
    const isJob = Array.isArray(type) ? type.includes('JobPosting') : type === 'JobPosting'
    if (isJob) found.push(record)
    if ('@graph' in record) findJobPostings(record['@graph'], found)
  }
  return found
}

function formatLocation(posting: Record<string, unknown>): string {
  const location = Array.isArray(posting.jobLocation) ? posting.jobLocation[0] : posting.jobLocation
  const address = (location as { address?: Record<string, unknown> } | undefined)?.address
  if (!address) return posting.jobLocationType === 'TELECOMMUTE' ? 'Remote' : ''
  return [address.addressLocality, address.addressRegion, asText(address.addressCountry)]
    .map(asText)
    .filter(Boolean)
    .join(', ')
}

function extractFromJsonLd(html: string): { title: string; text: string } | null {
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)

  for (const block of blocks) {
    let data: unknown
    try {
      data = JSON.parse(decodeEntities(block[1]).trim())
    } catch {
      continue
    }

    const posting = findJobPostings(data)[0]
    if (!posting) continue

    const title = asText(posting.title)
    const description = htmlToText(decodeEntities(asText(posting.description)))
    if (!description) continue

    const header = [title, [asText(posting.hiringOrganization), formatLocation(posting)].filter(Boolean).join(' · ')]
      .filter(Boolean)
      .join('\n')
    const extras = [
      ['Employment type', asText(posting.employmentType)],
      ['Skills', htmlToText(asText(posting.skills))],
      ['Qualifications', htmlToText(asText(posting.qualifications))],
      ['Experience', htmlToText(asText(posting.experienceRequirements))],
    ]
      .filter(([, value]) => value)
      .map(([label, value]) => `${label}: ${value}`)

    return { title, text: [header, description, ...extras].filter(Boolean).join('\n\n') }
  }
  return null
}

function extractFromHtml(html: string): { title: string; text: string } {
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim()
  const region =
    html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ??
    html.match(/<article\b[\s\S]*?<\/article>/i)?.[0] ??
    html.match(/<body\b[\s\S]*<\/body>/i)?.[0] ??
    html
  const body = htmlToText(region.replace(/<(nav|aside|form|button|select)\b[\s\S]*?<\/\1>/gi, ' '))
  return { title, text: title && !body.startsWith(title) ? `${title}\n\n${body}` : body }
}

export interface ExtractedJob {
  title: string
  text: string
  truncated: boolean
  source: 'structured-data' | 'page-text'
}

/** Prefers schema.org JobPosting data, which most job boards embed, and falls back to the visible page text. */
export function extractJobText(html: string): ExtractedJob {
  const structured = extractFromJsonLd(html)
  const extracted = structured ?? extractFromHtml(html)
  const text = extracted.text.trim()

  if (text.length < MIN_JOB_TEXT_LENGTH) {
    throw new JobLinkError(
      'no-content',
      'No job description could be read from that page. It may require signing in; paste the text instead.',
    )
  }

  return {
    title: extracted.title,
    text: text.slice(0, MAX_INPUT_LENGTH),
    truncated: text.length > MAX_INPUT_LENGTH,
    source: structured ? 'structured-data' : 'page-text',
  }
}
