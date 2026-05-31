import { copyRowsToClipboard, downloadRowsAsCsv } from '../../utils/export'
import type { ResultState, TemplateField } from '../../types'

type ResultTableProps = {
  fields: TemplateField[]
  result: ResultState
  onPageChange: (page: number) => void
  onFeedback: (feedback: ResultState['feedback']) => void
  onRerun: () => Promise<void>
  onEditTemplate: () => void
}

export default function ResultTable({
  fields,
  result,
  onPageChange,
  onFeedback,
  onRerun,
  onEditTemplate,
}: ResultTableProps) {
  const totalPages = Math.max(1, Math.ceil(result.rows.length / result.pageSize))
  const start = (result.page - 1) * result.pageSize
  const visibleRows = result.rows.slice(start, start + result.pageSize)

  return (
    <div className="ss-stack">
      <div className="ss-card ss-stack">
        <div className="ss-subsection ss-subsection--sticky">
          <div className="ss-truncate-block">
            <h3>结果表</h3>
            <p>支持动态列、图片列、链接列和长文本列，结果保存在当前扩展状态中。</p>
          </div>
          <div className="ss-inline-actions">
            <button type="button" className="ss-btn ss-btn--ghost" onClick={() => copyRowsToClipboard(result.rows)}>
              复制
            </button>
            <button
              type="button"
              className="ss-btn ss-btn--ghost"
              onClick={() => downloadRowsAsCsv(fields, result.rows, 'smart-scraper-results.csv')}
            >
              下载
            </button>
            <button type="button" className="ss-btn ss-btn--ghost" onClick={onEditTemplate}>
              返回模板
            </button>
            <button type="button" className="ss-btn ss-btn--primary" onClick={() => void onRerun()}>
              重新运行
            </button>
          </div>
        </div>

        <div className="ss-table-wrap">
          <table className="ss-table">
            <thead>
              <tr>
                {fields.map((field) => (
                  <th key={field.id}>{field.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length ? (
                visibleRows.map((row, index) => (
                  <tr key={`row-${start + index}`}>
                    {fields.map((field) => (
                      <td key={`${field.id}-${index}`}>{renderCell(field, row[field.key])}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={Math.max(fields.length, 1)}>
                    <div className="ss-empty">当前没有结果数据。</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ss-card ss-subsection">
        <div className="ss-inline-actions">
          <button type="button" className="ss-btn ss-btn--ghost" disabled={result.page <= 1} onClick={() => onPageChange(result.page - 1)}>
            上一页
          </button>
          <span className="ss-page-status">
            第 {result.page} / {totalPages} 页
          </span>
          <button
            type="button"
            className="ss-btn ss-btn--ghost"
            disabled={result.page >= totalPages}
            onClick={() => onPageChange(result.page + 1)}
          >
            下一页
          </button>
        </div>

        <div className="ss-inline-actions">
          <button
            type="button"
            className={`ss-btn ${result.feedback === 'helpful' ? 'ss-btn--primary' : 'ss-btn--ghost'}`}
            onClick={() => onFeedback('helpful')}
          >
            反馈有帮助
          </button>
          <button
            type="button"
            className={`ss-btn ${result.feedback === 'not_helpful' ? 'ss-btn--danger' : 'ss-btn--ghost'}`}
            onClick={() => onFeedback('not_helpful')}
          >
            反馈问题
          </button>
        </div>
      </div>
    </div>
  )
}

function renderCell(field: TemplateField, value: unknown) {
  if (value == null || value === '') {
    return <span className="ss-muted">--</span>
  }

  if (field.type === 'image') {
    return <img className="ss-table-image" src={String(value)} alt={field.label} />
  }

  if (field.type === 'url') {
    return (
      <a className="ss-link ss-break-text" href={String(value)} target="_blank" rel="noreferrer">
        {String(value)}
      </a>
    )
  }

  if (field.type === 'long_text') {
    return (
      <div className="ss-long-text" title={String(value)}>
        {String(value)}
      </div>
    )
  }

  return <span className="ss-break-text">{String(value)}</span>
}
