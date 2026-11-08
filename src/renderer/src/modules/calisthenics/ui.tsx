import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { formatClock } from './utils'

export function Label({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <p className={`text-[11px] font-medium tracking-wider text-subtle uppercase ${className}`}>
      {children}
    </p>
  )
}

export function Card({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return <div className={`rounded-xl bg-panel shadow-panel ${className}`}>{children}</div>
}

const tierTone = (tier: number): string => {
  if (tier >= 10) return 'border-amber-400/40 text-amber-300 shadow-[0_0_10px_-2px_#fbbf2466]'
  if (tier >= 7) return 'border-violet-400/40 text-violet-300 shadow-[0_0_10px_-2px_#a78bfa55]'
  if (tier >= 4) return 'border-sky-400/40 text-sky-300'
  return 'border-line-strong text-muted'
}

export function TierBadge({ tier }: { tier: number }): React.JSX.Element {
  return (
    <span
      className={`inline-flex h-5 min-w-7 shrink-0 items-center justify-center rounded border px-1 font-mono text-[10px] font-semibold tabular-nums ${tierTone(tier)}`}
    >
      T{tier}
    </span>
  )
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  className = '',
  title
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  disabled?: boolean
  className?: string
  title?: string
}): React.JSX.Element {
  const styles = {
    primary: 'bg-accent text-accent-fg shadow-panel hover:opacity-90',
    ghost: 'text-muted hover:bg-raised hover:text-fg',
    outline: 'border border-line-strong text-muted hover:border-muted hover:text-fg',
    danger: 'text-danger hover:bg-danger/10'
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:pointer-events-none disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  className = 'w-[32rem]'
}: {
  title: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[85vh] max-w-full flex-col rounded-2xl bg-panel shadow-pop ${className}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="glow text-sm font-semibold text-fg">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-subtle hover:bg-raised hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function Bar({
  value,
  max,
  color = 'var(--accent)',
  className = 'h-1.5'
}: {
  value: number
  max: number
  color?: string
  className?: string
}): React.JSX.Element {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={`overflow-hidden rounded-full bg-line ${className}`}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}` }}
      />
    </div>
  )
}

export function Elapsed({ since }: { since: string }): React.JSX.Element {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  return <>{formatClock(Math.max(0, Math.floor((now - Date.parse(since)) / 1000)))}</>
}
