type ProgressBarProps = {
  value: number
  label?: string
}

export default function ProgressBar({ value, label }: ProgressBarProps) {
  return (
    <div className="ss-progress">
      {label ? <div className="ss-progress__label">{label}</div> : null}
      <div className="ss-progress__track">
        <div className="ss-progress__fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  )
}
