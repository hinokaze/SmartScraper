import { copy } from '../../data/copy'
import { copyRowsToClipboard, downloadPlainText } from '../../utils/export'
import { formatTimestamp } from '../../utils/format'
import type { ToolState } from '../../types'

type EmailExtractorViewProps = {
  state: ToolState['emails']
  onScan: () => Promise<void>
}

export default function EmailExtractorView({ state, onScan }: EmailExtractorViewProps) {
  return (
    <div className="ss-panel">
      <header className="ss-panel__header">
        <div className="ss-panel__header-left">
          <div className="ss-overline">{copy.common.toolPage}</div>
          <h1>邮箱提取器</h1>
          <p>扫描当前页面中的邮箱地址，支持全部复制、下载和重新扫描。</p>
        </div>
        <div className="ss-panel__header-right ss-panel__header-right--auto">
          <button type="button" className="ss-btn ss-btn--primary" onClick={() => void onScan()}>
            {state.status === 'loading' ? '扫描中...' : '重新扫描'}
          </button>
        </div>
      </header>

      <div className="ss-panel__body ss-stack">
        <div className="ss-card ss-subsection">
          <div className="ss-truncate-block">
            <h3>扫描结果</h3>
            <p>共识别 {state.items.length} 个邮箱地址。</p>
          </div>
          <div className="ss-inline-actions">
            <button type="button" className="ss-btn ss-btn--ghost" onClick={() => copyRowsToClipboard(state.items)}>
              全部复制
            </button>
            <button
              type="button"
              className="ss-btn ss-btn--ghost"
              onClick={() => downloadPlainText(state.items.map((item) => item.value), 'emails.txt')}
            >
              下载
            </button>
          </div>
        </div>

        {state.status === 'empty' ? <div className="ss-empty">当前页面没有识别到邮箱地址。</div> : null}
        {state.status === 'error' ? <div className="ss-notice ss-notice--danger">{state.error}</div> : null}

        <div className="ss-card ss-stack">
          {state.items.length ? (
            state.items.map((item) => (
              <div key={item.value} className="ss-list-row">
                <strong className="ss-break-text">{item.value}</strong>
              </div>
            ))
          ) : (
            <div className="ss-empty">等待扫描结果。</div>
          )}
          <div className="ss-muted">最近扫描：{formatTimestamp(state.scannedAt)}</div>
        </div>
      </div>
    </div>
  )
}
