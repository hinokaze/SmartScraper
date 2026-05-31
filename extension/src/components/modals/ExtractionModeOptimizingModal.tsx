import StatusPill from '../shared/StatusPill'
import type { OptimizationState } from '../../types'

type ExtractionModeOptimizingModalProps = {
  optimization: OptimizationState
  onBack: () => void
  onRetry: () => Promise<void>
  onContinue: () => void
}

export default function ExtractionModeOptimizingModal({
  optimization,
  onBack,
  onRetry,
  onContinue,
}: ExtractionModeOptimizingModalProps) {
  return (
    <div className="ss-modal-backdrop">
      <div className="ss-modal">
        <StatusPill tone={optimization.status === 'error' ? 'danger' : 'warning'}>
          正在优化提取模式
        </StatusPill>
        <h3>我们正在再次检查此网站，以选择最可靠的数据提取方式，马上就好。</h3>

        {optimization.status === 'running' ? <div className="ss-loading-line" /> : null}
        {optimization.summary ? <p>{optimization.summary}</p> : null}
        {optimization.strategy ? <div className="ss-notice">推荐策略：{optimization.strategy}</div> : null}
        {optimization.warnings.length ? (
          <div className="ss-stack">
            {optimization.warnings.map((warning) => (
              <div key={warning} className="ss-notice">
                {warning}
              </div>
            ))}
          </div>
        ) : null}

        <div className="ss-inline-actions">
          <button type="button" className="ss-btn ss-btn--ghost" onClick={onBack}>
            返回模板
          </button>
          {optimization.status === 'error' ? (
            <button type="button" className="ss-btn ss-btn--primary" onClick={() => void onRetry()}>
              重试优化
            </button>
          ) : null}
          {optimization.status === 'ready' ? (
            <button type="button" className="ss-btn ss-btn--primary" onClick={onContinue}>
              选择执行环境
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
