export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Fixed-window limiter kept in memory. It is per server instance, so on serverless
// platforms treat it as a best-effort guard; use a shared store (e.g. Upstash Redis)
// when strict, global limits are required.
export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
  now: number = Date.now(),
): RateLimitResult {
  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey)
    }
  }

  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) }
  }

  current.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

export function resetRateLimits(): void {
  buckets.clear()
}

export function getClientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip') || 'unknown'
}
