import { Sparkles } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Badge } from '@/components/ui/badge'

const NAV_ITEMS = [
  { label: 'Evaluate', href: '#evaluate' },
  { label: 'How it works', href: '#how-it-works' },
] as const

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="#top"
          aria-label="JennyMatch AI home"
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Logo />
        </a>

        <div className="flex items-center gap-2 sm:gap-6">
          <nav aria-label="Main navigation" className="hidden items-center gap-6 sm:flex">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <Badge
            variant="outline"
            className="h-7 gap-1.5 border-primary/20 bg-accent px-2.5 text-xs font-medium text-accent-foreground"
          >
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            Powered by OpenAI
          </Badge>
        </div>
      </div>
    </header>
  )
}
