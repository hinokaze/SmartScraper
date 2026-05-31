import StatusPill from '../shared/StatusPill'
import type { NavigationState } from '../../types'

type NavigationModeStepProps = {
  navigation: NavigationState
  onDetect: () => Promise<void>
  onApplyRecommendation: () => void
  onSetMode: (mode: 'none' | 'click' | 'scroll') => void
  onPickTarget: () => Promise<void>
  onSelectTarget: (id: string) => void
  onUpdateClickConfig: (patch: Partial<NavigationState['clickConfig']>) => void
  onUpdateScrollConfig: (patch: Partial<NavigationState['scrollConfig']>) => void
}

const modeLabels = {
  idle: '待配置',
  detecting: '检测中',
  ready: '可选择',
  selecting_pagination_target: '选择目标中',
  configured: '已配置',
}

export default function NavigationModeStep({
  navigation,
  onDetect,
  onApplyRecommendation,
  onSetMode,
  onPickTarget,
  onSelectTarget,
  onUpdateClickConfig,
  onUpdateScrollConfig,
}: NavigationModeStepProps) {
  return (
    <div className="ss-stack">
      <div className="ss-card ss-stack">
        <div className="ss-subsection">
          <div>
            <h3>页面导航方式</h3>
            <p>先分析当前页面的翻页结构，再决定是否使用点击翻页、滚动加载或仅抓当前页。</p>
          </div>
          <div className="ss-inline-actions">
            <StatusPill tone={navigation.status === 'detecting' ? 'warning' : 'info'}>
              {modeLabels[navigation.status]}
            </StatusPill>
            <button
              type="button"
              className="ss-btn ss-btn--primary"
              onClick={onDetect}
              disabled={navigation.status === 'detecting'}
            >
              {navigation.status === 'detecting' ? '正在检测翻页方式...' : 'AI 自动检测'}
            </button>
          </div>
        </div>

        <div className="ss-grid ss-grid--four">
          <button type="button" className={`ss-choice-card ${navigation.mode === 'auto' ? 'is-selected' : ''}`} onClick={onDetect}>
            <strong>AI 自动检测</strong>
            <span>自动识别分页、下一页按钮和滚动加载信号，并生成推荐配置。</span>
          </button>
          <button type="button" className={`ss-choice-card ${navigation.mode === 'none' ? 'is-selected' : ''}`} onClick={() => onSetMode('none')}>
            <strong>不翻页</strong>
            <span>仅提取当前页面内容，适合单页列表或详情页。</span>
          </button>
          <button type="button" className={`ss-choice-card ${navigation.mode === 'click' ? 'is-selected' : ''}`} onClick={() => onSetMode('click')}>
            <strong>点击翻页</strong>
            <span>指定“下一页”按钮，配置页数上限、终止条件和延迟。</span>
          </button>
          <button type="button" className={`ss-choice-card ${navigation.mode === 'scroll' ? 'is-selected' : ''}`} onClick={() => onSetMode('scroll')}>
            <strong>滚动加载</strong>
            <span>适合无限滚动页面，控制滚动次数和间隔。</span>
          </button>
        </div>
      </div>

      {navigation.detectionSummary ? (
        <div className="ss-card ss-stack">
          <div className="ss-subsection">
            <div>
              <h3>检测结果</h3>
              <p>{navigation.detectionSummary}</p>
            </div>
            <div className="ss-inline-actions">
              {navigation.recommendedMode ? (
                <StatusPill tone="success">推荐：{navigation.recommendedMode}</StatusPill>
              ) : null}
              <button type="button" className="ss-btn ss-btn--ghost" onClick={onApplyRecommendation}>
                应用推荐配置
              </button>
            </div>
          </div>

          {navigation.targets.length ? (
            <div className="ss-target-list">
              {navigation.targets.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  className={`ss-target-item ${navigation.selectedTargetId === target.id ? 'is-selected' : ''}`}
                  onClick={() => onSelectTarget(target.id)}
                >
                  <strong>{target.label}</strong>
                  <span>{target.selector}</span>
                  <small>置信度 {(target.confidence * 100).toFixed(0)}%</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="ss-empty">未发现明确翻页按钮，您仍可切换到手动配置。</div>
          )}
        </div>
      ) : null}

      {navigation.mode === 'click' ? (
        <div className="ss-card ss-stack">
          <div className="ss-subsection">
            <div>
              <h3>点击翻页配置</h3>
              <p>可直接从当前页面拾取“下一页”目标，或使用检测结果中推荐的候选节点。</p>
            </div>
            <button type="button" className="ss-btn ss-btn--ghost" onClick={onPickTarget}>
              从网页选择“下一页”
            </button>
          </div>

          <div className="ss-grid ss-grid--three">
            <label className="ss-field">
              <span>抓取页数</span>
              <input
                type="number"
                min={1}
                max={200}
                value={navigation.clickConfig.pageLimit}
                onChange={(event) => onUpdateClickConfig({ pageLimit: Math.max(1, Math.min(200, parseInt(event.target.value, 10) || 5)) })}
              />
            </label>
            <label className="ss-field">
              <span>延迟时间（ms）</span>
              <input
                type="number"
                min={200}
                step={100}
                value={navigation.clickConfig.delayMs}
                onChange={(event) => onUpdateClickConfig({ delayMs: Math.max(200, parseInt(event.target.value, 10) || 1200) })}
              />
            </label>
            <label className="ss-checkbox">
              <input
                type="checkbox"
                checked={navigation.clickConfig.untilLastPage}
                onChange={(event) => onUpdateClickConfig({ untilLastPage: event.target.checked })}
              />
              <span>一直抓到最后一页</span>
            </label>
          </div>
        </div>
      ) : null}

      {navigation.mode === 'scroll' ? (
        <div className="ss-card">
          <div className="ss-card__header">
            <div>
              <h3>滚动加载配置</h3>
              <p>控制滚动次数和间隔，用于无限滚动列表。</p>
            </div>
          </div>
          <div className="ss-grid ss-grid--two">
            <label className="ss-field">
              <span>滚动次数</span>
              <input
                type="number"
                min={1}
                max={50}
                value={navigation.scrollConfig.scrollCount}
                onChange={(event) => onUpdateScrollConfig({ scrollCount: Math.max(1, Math.min(50, parseInt(event.target.value, 10) || 6)) })}
              />
            </label>
            <label className="ss-field">
              <span>滚动间隔（ms）</span>
              <input
                type="number"
                min={300}
                step={100}
                value={navigation.scrollConfig.intervalMs}
                onChange={(event) => onUpdateScrollConfig({ intervalMs: Math.max(300, parseInt(event.target.value, 10) || 1200) })}
              />
            </label>
          </div>
        </div>
      ) : null}

      {navigation.error ? <div className="ss-notice ss-notice--danger">{navigation.error}</div> : null}
    </div>
  )
}
