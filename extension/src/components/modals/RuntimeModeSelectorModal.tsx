import { copy } from '../../data/copy'
import type { RuntimeMode } from '../../types'

type RuntimeModeSelectorModalProps = {
  selectedMode: RuntimeMode
  onSelect: (mode: RuntimeMode) => void
  onBack: () => void
  onContinue: () => Promise<void>
}

export default function RuntimeModeSelectorModal({
  selectedMode,
  onSelect,
  onBack,
  onContinue,
}: RuntimeModeSelectorModalProps) {
  return (
    <div className="ss-modal-backdrop">
      <div className="ss-modal">
        <div className="ss-overline">执行环境选择</div>
        <h3>选择任务运行环境</h3>
        <p>当前版本只开放浏览器模式的真实运行。云端模式保留展示和说明，后续再接入。</p>

        <div className="ss-grid ss-grid--two">
          <button
            type="button"
            className={`ss-choice-card ${selectedMode === 'browser' ? 'is-selected' : ''}`}
            onClick={() => onSelect('browser')}
          >
            <strong>{copy.runtime.browser}（推荐）</strong>
            <span>在本地浏览器中运行，适合需要登录态、Cookie 和真实交互的网站。</span>
          </button>

          <div className="ss-choice-card is-disabled">
            <strong>{copy.runtime.cloud}</strong>
            <span>在服务器后台运行，适合公开链接和批量任务。</span>
            <small>{copy.runtime.cloudComingSoon}</small>
          </div>
        </div>

        <div className="ss-notice">若要真实运行，请保持当前页面开启，直到任务完成。</div>

        <div className="ss-inline-actions">
          <button type="button" className="ss-btn ss-btn--ghost" onClick={onBack}>
            返回
          </button>
          <button type="button" className="ss-btn ss-btn--primary" onClick={() => void onContinue()}>
            开始运行任务
          </button>
        </div>
      </div>
    </div>
  )
}
