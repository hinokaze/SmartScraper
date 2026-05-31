import { useState } from 'react'
import { extractUrlsFromText } from '../../utils/fileImport'
import type { SourceState } from '../../types'

type SourceSelectorProps = {
  source: SourceState
  onSelectKind: (kind: SourceState['kind']) => void
  onAddUrls: (urls: string[]) => void
  onRemoveUrl: (id: string) => void
  onImportFiles: (files: FileList | File[]) => Promise<void>
  onAddDemoScreenshot: () => void
}

export default function SourceSelector({
  source,
  onSelectKind,
  onAddUrls,
  onRemoveUrl,
  onImportFiles,
  onAddDemoScreenshot,
}: SourceSelectorProps) {
  const [rawUrls, setRawUrls] = useState('')

  const handleApplyUrls = () => {
    const urls = extractUrlsFromText(rawUrls)
    if (!urls.length) {
      return
    }

    onAddUrls(urls)
    setRawUrls('')
  }

  return (
    <div className="ss-stack">
      <div className="ss-grid ss-grid--three">
        <button
          type="button"
          className={`ss-choice-card ${source.kind === 'current_page' ? 'is-selected' : ''}`}
          onClick={() => onSelectKind('current_page')}
        >
          <strong>当前页面</strong>
          <span>直接从当前激活标签页抓取内容，适合浏览器模式真实运行。</span>
        </button>

        <button
          type="button"
          className={`ss-choice-card ${source.kind === 'pasted_links' ? 'is-selected' : ''}`}
          onClick={() => onSelectKind('pasted_links')}
        >
          <strong>粘贴链接</strong>
          <span>支持多行 URL 和 CSV / Excel 导入，本轮先保留输入能力。</span>
        </button>

        <button
          type="button"
          className={`ss-choice-card ${source.kind === 'file_image' ? 'is-selected' : ''}`}
          onClick={() => onSelectKind('file_image')}
        >
          <strong>文件图片</strong>
          <span>支持上传文件、图片与截图，本轮先保留输入能力。</span>
        </button>
      </div>

      {source.kind === 'current_page' ? (
        <div className="ss-card">
          <div className="ss-card__header">
            <div>
              <h3>当前页面上下文</h3>
              <p>浏览器模式会直接基于这个标签页进行分析、翻页和提取。</p>
            </div>
          </div>
          <div className="ss-list-meta">
            <div>
              <span>标题</span>
              <strong>{source.currentPage.title}</strong>
            </div>
            <div>
              <span>URL</span>
              <strong>{source.currentPage.url}</strong>
            </div>
            <div>
              <span>说明</span>
              <strong>{source.currentPage.description}</strong>
            </div>
          </div>
        </div>
      ) : null}

      {source.kind === 'pasted_links' ? (
        <div className="ss-card ss-stack">
          <div className="ss-subsection">
            <div>
              <h3>批量链接输入</h3>
              <p>可先整理链接源；正式运行前会提示当前版本仅支持当前页面来源。</p>
            </div>
            <div className="ss-inline-actions">
              <label className="ss-btn ss-btn--ghost">
                导入 CSV / Excel
                <input
                  hidden
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={(event) => event.target.files && onImportFiles(event.target.files)}
                />
              </label>
              <button type="button" className="ss-btn ss-btn--primary" onClick={handleApplyUrls}>
                导入链接
              </button>
            </div>
          </div>

          <textarea
            className="ss-textarea"
            rows={6}
            value={rawUrls}
            placeholder={'https://example.com/post/1\nhttps://example.com/post/2'}
            onChange={(event) => setRawUrls(event.target.value)}
          />

          {source.pastedUrls.length ? (
            <div className="ss-chip-list">
              {source.pastedUrls.map((item) => (
                <button key={item.id} type="button" className="ss-chip" onClick={() => onRemoveUrl(item.id)}>
                  {item.url}
                </button>
              ))}
            </div>
          ) : (
            <div className="ss-empty">还没有导入链接。</div>
          )}
        </div>
      ) : null}

      {source.kind === 'file_image' ? (
        <div className="ss-card ss-stack">
          <div className="ss-subsection">
            <div>
              <h3>文件 / 图片输入</h3>
              <p>适合后续接 OCR 与文档解析。本轮保留上传与管理界面，不参与真实运行。</p>
            </div>
            <div className="ss-inline-actions">
              <label className="ss-btn ss-btn--ghost">
                上传文件
                <input
                  hidden
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.csv,.xls,.xlsx"
                  onChange={(event) => event.target.files && onImportFiles(event.target.files)}
                />
              </label>
              <button type="button" className="ss-btn ss-btn--primary" onClick={onAddDemoScreenshot}>
                添加截图
              </button>
            </div>
          </div>

          <div className="ss-upload-list">
            {source.uploadedAssets.length ? (
              source.uploadedAssets.map((asset) => (
                <div key={asset.id} className="ss-upload-item">
                  {asset.previewUrl ? (
                    <img src={asset.previewUrl} alt={asset.name} />
                  ) : (
                    <div className="ss-upload-placeholder">FILE</div>
                  )}
                  <div>
                    <strong>{asset.name}</strong>
                    <span>{asset.sizeLabel}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="ss-empty">还没有导入文件或图片。</div>
            )}
          </div>
        </div>
      ) : null}

      {source.kind !== 'current_page' ? (
        <div className="ss-notice">当前版本仅支持“当前页面 + 浏览器模式”真实运行，其它来源先保留配置入口。</div>
      ) : null}
    </div>
  )
}
