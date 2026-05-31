import { copy } from '../../data/copy'
import { formatTimestamp } from '../../utils/format'
import type { ToolState } from '../../types'

type PhoneExtractorViewProps = {
  state: ToolState['phones']
  onScan: () => Promise<void>
}

export default function PhoneExtractorView({ state, onScan }: PhoneExtractorViewProps) {
  return (
    <div className="ss-panel">
      <header className="ss-panel__header">
        <div className="ss-panel__header-left">
          <div className="ss-overline">{copy.common.toolPage}</div>
          <h1>电话号码提取器</h1>
          <p>扫描当前页面中的电话号码，并在空状态下给出明确提示。</p>
        </div>
        <div className="ss-panel__header-right ss-panel__header-right--auto">
          <button type="button" className="ss-btn ss-btn--primary" onClick={() => void onScan()}>
            {state.status === 'loading' ? '扫描中...' : '重新扫描'}
          </button>
        </div>
      </header>

      <div className="ss-panel__body ss-stack">
        {state.status === 'empty' ? <div className="ss-empty">当前页面没有检测到电话号码。</div> : null}
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
