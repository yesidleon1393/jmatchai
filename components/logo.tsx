import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoMarkProps {
  className?: string
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <Image
      src="/brand/mascot.webp"
      alt=""
      width={80}
      height={80}
      priority
      className={cn('size-10 rounded-xl', className)}
    />
  )
}

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />
      <div className="flex flex-col leading-tight">
        <span className="text-base font-semibold tracking-tight text-foreground">
          Jmatch <span className="text-primary">AI</span>
        </span>
        <span className="text-xs text-muted-foreground">AI Candidate Evaluation</span>
      </div>
    </div>
  )
}
