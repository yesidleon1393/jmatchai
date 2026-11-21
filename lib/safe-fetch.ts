import dns from 'node:dns'
import https from 'node:https'
import { JobLinkError, parseJobUrl } from '@/lib/job-link'

const MAX_REDIRECTS = 3
const MAX_BODY_BYTES = 1_500_000
const REQUEST_TIMEOUT_MS = 8_000
const USER_AGENT = 'Mozilla/5.0 (compatible; JmatchBot/1.0; +https://jmatch.ai)'

function parseIPv4(address: string): number[] | null {
  const parts = address.split('.')
  if (parts.length !== 4) return null
  const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : NaN))
  return octets.every((octet) => octet >= 0 && octet <= 255) ? octets : null
}

/** True for loopback, private, link-local, CGNAT, multicast and other non-public addresses. */
export function isPrivateIp(address: string): boolean {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, '').split('%')[0]

  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  const v4 = parseIPv4(mapped ? mapped[1] : ip)
  if (v4) {
    const [a, b] = v4
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    )
  }

  if (!ip.includes(':')) return true
  return (
    ip === '::' ||
    ip === '::1' ||
    ip.startsWith('fc') ||
    ip.startsWith('fd') ||
    /^fe[89ab]/.test(ip) ||
    ip.startsWith('ff') ||
    ip.startsWith('2001:db8')
  )
}

// Validates every resolved address at connection time, so a hostname cannot
// pass a pre-check and then rebind to an internal address (DNS rebinding).
const guardedLookup: NonNullable<https.RequestOptions['lookup']> = (hostname, options, callback) => {
  dns.lookup(hostname, { all: true }, (error, addresses) => {
    if (error) return callback(error, '', 4)
    if (addresses.length === 0 || addresses.some((entry) => isPrivateIp(entry.address))) {
      return callback(new JobLinkError('private-address', 'This address is not allowed.') as NodeJS.ErrnoException, '', 4)
    }
    if (options.all) {
      return (callback as unknown as (err: null, all: dns.LookupAddress[]) => void)(null, addresses)
    }
    return callback(null, addresses[0].address, addresses[0].family)
  })
}

interface PageResponse {
  status: number
  location?: string
  contentType: string
  body: string
}

function requestOnce(url: URL): Promise<PageResponse> {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        protocol: 'https:',
        hostname: url.hostname,
        port: 443,
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        lookup: guardedLookup,
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
          'Accept-Language': 'en,es;q=0.8',
          'Accept-Encoding': 'identity',
        },
      },
      (response) => {
        const status = response.statusCode ?? 0
        const contentType = String(response.headers['content-type'] ?? '')
        const location = response.headers.location

        if (status >= 300 && status < 400) {
          response.resume()
          resolve({ status, location, contentType, body: '' })
          return
        }

        const chunks: Buffer[] = []
        let received = 0
        response.on('data', (chunk: Buffer) => {
          received += chunk.length
          if (received > MAX_BODY_BYTES) {
            request.destroy(new JobLinkError('too-large', 'That page is too large to import. Paste the text instead.'))
            return
          }
          chunks.push(chunk)
        })
        response.on('end', () => resolve({ status, contentType, body: Buffer.concat(chunks).toString('utf-8') }))
        response.on('error', reject)
      },
    )

    request.on('timeout', () => request.destroy(new JobLinkError('timeout', 'The page took too long to respond.')))
    request.on('error', (error) => {
      if (error instanceof JobLinkError) return reject(error)
      reject(new JobLinkError('unreachable', 'We could not reach that page. Check the link or paste the text instead.'))
    })
    request.end()
  })
}

const BLOCKED_MESSAGE =
  'This site blocks automated access (LinkedIn and similar boards often do). Open the posting and paste its text instead.'

export async function fetchPublicPage(startUrl: URL): Promise<{ finalUrl: URL; html: string }> {
  let url = startUrl

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await requestOnce(url)

    if (response.status >= 300 && response.status < 400) {
      if (!response.location) throw new JobLinkError('unreachable', 'The link redirects to an invalid address.')
      url = parseJobUrl(response.location, url)
      continue
    }
    if ([401, 403, 429, 999].includes(response.status)) throw new JobLinkError('blocked', BLOCKED_MESSAGE)
    if (response.status === 404 || response.status === 410) {
      throw new JobLinkError('not-found', 'That posting was not found. It may have expired.')
    }
    if (response.status < 200 || response.status >= 300) {
      throw new JobLinkError('unreachable', 'We could not load that page. Paste the job description text instead.')
    }
    if (!/text\/html|application\/xhtml/i.test(response.contentType)) {
      throw new JobLinkError('unsupported', 'That link is not a web page. Use the job posting URL.')
    }
    return { finalUrl: url, html: response.body }
  }

  throw new JobLinkError('unreachable', 'The link redirects too many times.')
}
