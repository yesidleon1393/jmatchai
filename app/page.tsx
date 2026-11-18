import { EvaluationForm } from '@/components/evaluation-form'
import { Hero } from '@/components/hero'
import { HowItWorks } from '@/components/how-it-works'
import { SiteHeader } from '@/components/site-header'

export default function HomePage() {
  return (
    <div id="top" className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <section
          id="evaluate"
          aria-label="Candidate evaluation"
          className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-20 sm:px-6"
        >
          <EvaluationForm />
        </section>
        <HowItWorks />
      </main>
      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>&copy; {new Date().getFullYear()} Jmatch AI. Technical assessment for JennyHires.</p>
        </div>
      </footer>
    </div>
  )
}
