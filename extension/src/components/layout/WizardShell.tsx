import type { ReactNode } from 'react'
import ProgressBar from '../shared/ProgressBar'

type WizardShellProps = {
  title: string
  description: string
  step: number
  total: number
  banner?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export default function WizardShell({
  title,
  description,
  step,
  total,
  banner,
  actions,
  children,
}: WizardShellProps) {
  return (
    <section className="ss-panel">
      <header className="ss-panel__header">
        <div className="ss-panel__header-left">
          <div className="ss-overline">Step {step} / {total}</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="ss-panel__header-right">
          <div className="ss-header-metric">
            <span>主流程进度</span>
            <strong>{Math.round((step / total) * 100)}%</strong>
          </div>
          <ProgressBar value={(step / total) * 100} />
        </div>
      </header>

      {banner ? <div className="ss-banner-wrap">{banner}</div> : null}
      <div className="ss-panel__body">{children}</div>
      {actions ? <footer className="ss-panel__footer">{actions}</footer> : null}
    </section>
  )
}
