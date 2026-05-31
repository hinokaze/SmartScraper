import { copy } from '../../data/copy'
import { formatTimestamp } from '../../utils/format'
import type { ToolState } from '../../types'

type ImageExtractorViewProps = {
  state: ToolState['images']
  onScan: () => Promise<void>
}

export default function ImageExtractorView({ state, onScan }: ImageExtractorViewProps) {
  const downloadImage = (src: string, filename: string) => {
    const anchor = document.createElement('a')
    anchor.href = src
    anchor.download = filename
    anchor.target = '_blank'
    anchor.click()
  }

  const groups = state.items.reduce<Record<string, typeof state.items>>((accumulator, item) => {
    accumulator[item.group] = accumulator[item.group] ?? []
    accumulator[item.group].push(item)
    return accumulator
  }, {})

  return (
    <div className="ss-panel">
      <header className="ss-panel__header">
        <div className="ss-panel__header-left">
          <div className="ss-overline">{copy.common.toolPage}</div>
          <h1>图片提取器</h1>
          <p>按尺寸分组展示页面图片，支持单张下载、下载全部和重新扫描。</p>
        </div>
        <div className="ss-panel__header-right ss-panel__header-right--auto">
          <button type="button" className="ss-btn ss-btn--primary" onClick={() => void onScan()}>
            {state.status === 'loading' ? '扫描中...' : '重新扫描'}
          </button>
        </div>
      </header>

      <div className="ss-panel__body ss-stack">
        {Object.entries(groups).length ? (
          Object.entries(groups).map(([group, items]) => (
            <div key={group} className="ss-card ss-stack">
              <div className="ss-subsection">
                <div className="ss-truncate-block">
                  <h3>{group}</h3>
                  <p>{items.length} 张图片</p>
                </div>
                <button
                  type="button"
                  className="ss-btn ss-btn--ghost"
                  onClick={() => items.forEach((item) => downloadImage(item.src, `${item.id}.jpg`))}
                >
                  下载全部
                </button>
              </div>

              <div className="ss-image-grid">
                {items.map((item) => (
                  <div key={item.id} className="ss-image-card">
                    <img src={item.src} alt={item.group} />
                    <div className="ss-subsection">
                      <strong>
                        {item.width} × {item.height}
                      </strong>
                      <button type="button" className="ss-btn ss-btn--ghost" onClick={() => downloadImage(item.src, `${item.id}.jpg`)}>
                        下载
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="ss-empty">当前没有扫描到图片结果。</div>
        )}

        <div className="ss-muted">最近扫描：{formatTimestamp(state.scannedAt)}</div>
      </div>
    </div>
  )
}
