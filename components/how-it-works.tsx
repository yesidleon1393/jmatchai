import { ClipboardPaste, Gauge, ListChecks } from 'lucide-react'

const STEPS = [
  {
    icon: ClipboardPaste,
    title: 'Paste both documents',
    description: 'Add the job description and the candidate’s resume as plain text.',
  },
  {
    icon: Gauge,
    title: 'Get a match score',
    description: 'AI compares requirements and experience to produce a 0–100 compatibility score.',
  },
  {
    icon: ListChecks,
    title: 'Review the reasoning',
    description: 'See key strengths and the areas worth probing in the next interview.',
  },
] as const

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t bg-card">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          How it works
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
