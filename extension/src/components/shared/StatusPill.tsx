import type { ReactNode } from 'react'

type StatusPillProps = {
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
  children: ReactNode
}

export default function StatusPill({ tone = 'neutral', children }: StatusPillProps) {
  return <span className={`ss-pill ss-pill--${tone}`}>{children}</span>
}
