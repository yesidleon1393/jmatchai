import type { MatchTier } from '@/lib/evaluation'
import { cn } from '@/lib/utils'

const TIER_STROKE: Record<MatchTier, string> = {
  excellent: 'stroke-emerald-500',
  good: 'stroke-primary',
  partial: 'stroke-amber-500',
  low: 'stroke-rose-500',
}

const SIZE = 176
const STROKE_WIDTH = 12
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface ScoreRingProps {
  score: number
  tier: MatchTier
}

export function ScoreRing({ score, tier }: ScoreRingProps) {
  const offset = CIRCUMFERENCE * (1 - score / 100)

  return (
    <div
      role="img"
      aria-label={`Candidate match score: ${score} out of 100`}
      className="relative size-44 shrink-0"
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" aria-hidden="true">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          className="stroke-muted"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn(
            TIER_STROKE[tier],
            'transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none',
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="text-5xl font-semibold tabular-nums tracking-tight text-foreground">
          {score}
        </span>
        <span className="text-xs font-medium text-muted-foreground">out of 100</span>
      </div>
    </div>
  )
}
