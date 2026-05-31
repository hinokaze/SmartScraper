import StatusPill from '../shared/StatusPill'
import type { DetailDiscoveryState, TemplateField } from '../../types'

type DetailFieldDiscoveryFlowProps = {
  phase: 'detail_field_discovery' | 'detail_field_ready' | 'detail_field_confirmed'
  discovery: DetailDiscoveryState
  fields: TemplateField[]
  onConfirm: () => void
  onContinue: () => Promise<void>
}

export default function DetailFieldDiscoveryFlow({
  phase,
  discovery,
  fields,
  onConfirm,
  onContinue,
}: DetailFieldDiscoveryFlowProps) {
  if (phase === 'detail_field_discovery') {
    return (
      <div className="ss-card ss-stack">
        <StatusPill tone="warning">详情页字段识别中</StatusPill>
        <h3>正在打开样本详情页</h3>
        <p>{discovery.message ?? '系统正在读取第一个样本 URL，并尝试回填详情字段示例值。'}</p>
        <div className="ss-loading-line" />
      </div>
    )
  }

  if (phase === 'detail_field_confirmed') {
    return (
      <div className="ss-card ss-stack">
        <StatusPill tone="success">详情页补抓已就绪</StatusPill>
        <h3>列表页 + 详情页模板已确认</h3>
        <p>{discovery.message}</p>
        <button type="button" className="ss-btn ss-btn--primary" onClick={() => void onContinue()}>
          开始优化提取模式
        </button>
      </div>
    )
  }

  return (
    <div className="ss-stack">
      <div className="ss-card ss-stack">
        <div className="ss-subsection">
          <div>
            <StatusPill tone="info">详情字段已回填</StatusPill>
            <h3>请确认详情页补抓方案</h3>
          </div>
        </div>
        <div className="ss-list-meta">
          <div>
            <span>样本 URL</span>
            <strong>{discovery.sampleUrl ?? '--'}</strong>
          </div>
          <div>
            <span>详情链接字段</span>
            <strong>{discovery.linkedUrlFieldId ?? '--'}</strong>
          </div>
        </div>
      </div>

      <div className="ss-card ss-stack">
        <h3>已发现的详情字段</h3>
        {fields.filter((field) => field.scope === 'detail').length ? (
          <div className="ss-chip-list">
            {fields
              .filter((field) => field.scope === 'detail')
              .map((field) => (
                <span key={field.id} className="ss-chip ss-chip--static">
                  {field.label} / {field.sampleValue ?? '暂无样例'}
                </span>
              ))}
          </div>
        ) : (
          <div className="ss-empty">尚未发现详情字段样例，您仍可返回模板手动调整。</div>
        )}
        <button type="button" className="ss-btn ss-btn--primary" onClick={onConfirm}>
          确认详情字段
        </button>
      </div>
    </div>
  )
}
