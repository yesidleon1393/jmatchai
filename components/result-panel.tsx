import { AlertCircle, CheckCircle2, Search } from 'lucide-react'
import { ScoreRing } from '@/components/score-ring'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { classifyScore, type EvaluationResult, type MatchTier } from '@/lib/evaluation'
import { cn } from '@/lib/utils'

const TIER_BADGE: Record<MatchTier, string> = {
  excellent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  good: 'border-primary/20 bg-accent text-accent-foreground',
  partial: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-rose-200 bg-rose-50 text-rose-700',
}

interface BulletListProps {
  title: string
  items: string[]
  icon: React.ReactNode
  markerClassName: string
}

function BulletList({ title, items, icon, markerClassName }: BulletListProps) {
  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </h3>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
            <span
              aria-hidden="true"
              className={cn('mt-2 size-1.5 shrink-0 rounded-full', markerClassName)}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

interface ResultPanelProps {
  result: EvaluationResult
}

export function ResultPanel({ result }: ResultPanelProps) {
  const { tier, label } = classifyScore(result.score)

  return (
    <div className="flex flex-col gap-5">
      <Card className="border bg-card shadow-xs">
        <CardContent className="flex flex-col items-center gap-8 p-6 sm:p-8 md:flex-row md:items-center">
          <ScoreRing score={result.score} tier={tier} />
          <div className="flex min-w-0 flex-1 flex-col gap-4 text-center md:text-left">
            <div className="flex flex-col items-center gap-3 md:items-start">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Candidate Match Score
              </p>
              <Badge
                variant="outline"
                className={cn('h-8 px-3 text-sm font-semibold', TIER_BADGE[tier])}
              >
                {label}
              </Badge>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">AI Assessment</h2>
              <p className="mt-2 text-pretty text-base leading-relaxed text-foreground/90">
                {result.assessment}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <BulletList
          title="Key strengths"
          items={result.strengths}
          markerClassName="bg-emerald-500"
          icon={<CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />}
        />
        <BulletList
          title="Areas to investigate"
          items={result.areasToInvestigate}
          markerClassName="bg-amber-500"
          icon={<Search className="size-4 text-amber-600" aria-hidden="true" />}
        />
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        AI-generated guidance to support, not replace, recruiter judgement. Always review the
        candidate&apos;s full profile before making a decision.
      </p>
    </div>
  )
}
