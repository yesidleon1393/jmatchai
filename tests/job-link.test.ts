import { describe, expect, it } from 'vitest'
import { extractJobText, htmlToText, JobLinkError, parseJobUrl } from '@/lib/job-link'
import { isPrivateIp } from '@/lib/safe-fetch'

describe('parseJobUrl', () => {
  it('adds https when the scheme is missing and strips the hash', () => {
    expect(parseJobUrl('boards.greenhouse.io/acme/jobs/1#apply').href).toBe('https://boards.greenhouse.io/acme/jobs/1')
  })

  it('upgrades http to https', () => {
    expect(parseJobUrl('http://example.com/job').protocol).toBe('https:')
  })

  it.each(['', 'ftp://example.com/x', 'javascript:alert(1)', 'https://user:pass@example.com', 'https://example.com:8443/x'])(
    'rejects %s',
    (value) => {
      expect(() => parseJobUrl(value)).toThrow(JobLinkError)
    },
  )

  it.each([
    'https://localhost/x',
    'https://127.0.0.1/x',
    'https://169.254.169.254/latest/meta-data',
    'https://[::1]/x',
    'https://intranet/x',
    'https://printer.local/x',
    'https://service.internal/x',
  ])('rejects private target %s', (value) => {
    expect(() => parseJobUrl(value)).toThrow(JobLinkError)
  })
})

describe('isPrivateIp', () => {
  it.each(['10.0.0.1', '127.0.0.1', '172.16.5.4', '192.168.1.1', '169.254.169.254', '100.64.0.1', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1'])(
    'flags %s',
    (address) => {
      expect(isPrivateIp(address)).toBe(true)
    },
  )

  it.each(['8.8.8.8', '151.101.1.69', '2606:4700:4700::1111'])('allows %s', (address) => {
    expect(isPrivateIp(address)).toBe(false)
  })
})

describe('htmlToText', () => {
  it('drops scripts and decodes entities', () => {
    const text = htmlToText('<p>Fish &amp; chips</p><script>alert(1)</script><ul><li>One</li><li>Two</li></ul>')
    expect(text).toContain('Fish & chips')
    expect(text).not.toContain('alert')
    expect(text).toContain('- One')
  })
})

describe('extractJobText', () => {
  const description = 'Build and ship product features with React and TypeScript. '.repeat(6)

  it('prefers schema.org JobPosting data', () => {
    const json = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: 'Senior Engineer',
      hiringOrganization: { name: 'Acme' },
      description: `<p>${description}</p>`,
    })
    const result = extractJobText(`<html><body><script type="application/ld+json">${json}</script></body></html>`)
    expect(result.source).toBe('structured-data')
    expect(result.title).toBe('Senior Engineer')
    expect(result.text).toContain('Acme')
    expect(result.text).toContain('React and TypeScript')
  })

  it('falls back to visible page text', () => {
    const result = extractJobText(`<html><head><title>Role</title></head><body><main><p>${description}</p></main></body></html>`)
    expect(result.source).toBe('page-text')
    expect(result.text).toContain('React and TypeScript')
  })

  it('fails when the page has too little content', () => {
    expect(() => extractJobText('<html><body>Sign in to continue</body></html>')).toThrow(JobLinkError)
  })
})
