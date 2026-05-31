import ProgressBar from '../shared/ProgressBar'
import StatusPill from '../shared/StatusPill'
import { formatTimestamp } from '../../utils/format'
import type { TaskRun } from '../../types'

type TaskRunnerPanelProps = {
  run: TaskRun
  onStop: () => void
  onHide: () => void
  onOpenResult: () => void
}

const statusToneMap = {
  idle: 'neutral',
  running: 'info',
  paused: 'warning',
  success: 'success',
  error: 'danger',
  stopped: 'warning',
} as const

const stepToneMap = {
  pending: 'neutral',
  running: 'info',
  done: 'success',
  error: 'danger',
} as const

export default function TaskRunnerPanel({ run, onStop, onHide, onOpenResult }: TaskRunnerPanelProps) {
  if (run.hidden) {
    return (
      <div className="ss-card ss-inline-card">
        <div className="ss-truncate-block">
          <strong>任务仍在运行</strong>
          <span className="ss-muted">{run.progress}%</span>
        </div>
        <button type="button" className="ss-btn ss-btn--ghost" onClick={onHide}>
          展开
        </button>
      </div>
    )
  }

  return (
    <div className="ss-stack">
      <div className="ss-card ss-stack">
        <div className="ss-subsection">
          <div className="ss-truncate-block">
            <StatusPill tone={statusToneMap[run.status]}>{run.status}</StatusPill>
            <h3>任务执行面板</h3>
          </div>
          <div className="ss-inline-actions">
            <button type="button" className="ss-btn ss-btn--ghost" onClick={onHide}>
              隐藏
            </button>
            <button type="button" className="ss-btn ss-btn--danger" onClick={onStop} disabled={run.status !== 'running'}>
              停止
            </button>
          </div>
        </div>

        <ProgressBar value={run.progress} label={`总进度 ${run.progress}%`} />

        <div className="ss-list-meta ss-list-meta--dense">
          <div className="ss-meta-card">
            <span>当前子任务</span>
            <strong className="ss-break-text">{run.currentLabel ?? '--'}</strong>
          </div>
          <div className="ss-meta-card">
            <span>当前 URL</span>
            <strong className="ss-break-text">{run.currentUrl ?? '--'}</strong>
          </div>
          <div className="ss-meta-card">
            <span>多页抓取进度</span>
            <strong className="ss-break-text">{run.pageProgressLabel ?? '--'}</strong>
          </div>
          <div className="ss-meta-card">
            <span>详情页补抓</span>
            <strong className="ss-break-text">{run.detailProgress ?? '--'}</strong>
          </div>
          <div className="ss-meta-card">
            <span>开始时间</span>
            <strong>{formatTimestamp(run.startedAt)}</strong>
          </div>
          <div className="ss-meta-card">
            <span>已处理条目</span>
            <strong>
              {run.processedCount ?? 0}
              {run.totalCount ? ` / ${run.totalCount}` : ''}
            </strong>
          </div>
        </div>

        {run.errorMessage ? <div className="ss-notice ss-notice--danger">{run.errorMessage}</div> : null}
      </div>

      <div className="ss-card ss-stack">
        <div className="ss-subsection">
          <div className="ss-truncate-block">
            <h3>执行步骤</h3>
            <p>实时展示取页、提取、补抓详情和结果合并的状态。</p>
          </div>
          {(run.status === 'success' || run.resultTableOpen) && (
            <button type="button" className="ss-btn ss-btn--primary" onClick={onOpenResult}>
              打开结果表
            </button>
          )}
        </div>

        {run.steps.length ? (
          run.steps.map((step) => (
            <div key={step.id} className="ss-step-item">
              <div className="ss-step-item__content">
                <strong className="ss-break-text">{step.label}</strong>
                {step.url ? <span className="ss-step-item__url">{step.url}</span> : null}
              </div>
              <StatusPill tone={stepToneMap[step.status]}>{step.status}</StatusPill>
            </div>
          ))
        ) : (
          <div className="ss-empty">任务尚未开始。</div>
        )}
      </div>
    </div>
  )
}
