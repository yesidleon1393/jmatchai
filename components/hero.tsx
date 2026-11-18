import { ScanSearch } from 'lucide-react'

export function Hero() {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-10 pt-14 text-center sm:px-6 sm:pb-14 sm:pt-20">
      <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
        <ScanSearch className="size-3.5 text-primary" aria-hidden="true" />
        Intelligent Resume Matching
      </p>
      <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        Find the right talent, faster.
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
        Evaluate candidate compatibility against job requirements using AI.
      </p>
    </section>
  )
}
