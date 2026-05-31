import type { TemplateField } from '../../types'

type FieldEditorProps = {
  fields: TemplateField[]
  onAddField: (scope?: 'list' | 'detail') => void
  onChange: (fieldId: string, patch: Partial<TemplateField>) => void
  onMove: (fieldId: string, direction: 'up' | 'down') => void
  onRemove: (fieldId: string) => void
}

const fieldTypeOptions: Array<{ value: TemplateField['type']; label: string }> = [
  { value: 'text', label: '文本' },
  { value: 'url', label: '链接' },
  { value: 'date', label: '日期' },
  { value: 'image', label: '图片' },
  { value: 'long_text', label: '长文本' },
]

export default function FieldEditor({
  fields,
  onAddField,
  onChange,
  onMove,
  onRemove,
}: FieldEditorProps) {
  return (
    <div className="ss-card ss-stack">
      <div className="ss-subsection">
        <div>
          <h3>字段编辑器</h3>
          <p>支持添加、删除、排序和标记字段来源，也可以手动补充 selector 与属性。</p>
        </div>
        <div className="ss-inline-actions">
          <button type="button" className="ss-btn ss-btn--ghost" onClick={() => onAddField('list')}>
            添加列表字段
          </button>
          <button type="button" className="ss-btn ss-btn--ghost" onClick={() => onAddField('detail')}>
            添加详情字段
          </button>
        </div>
      </div>

      {fields.length ? (
        <div className="ss-stack">
          {fields.map((field, index) => (
            <div key={field.id} className="ss-field-row">
              <div className="ss-grid ss-grid--three">
                <label className="ss-field">
                  <span>字段名称</span>
                  <input value={field.label} onChange={(event) => onChange(field.id, { label: event.target.value })} />
                </label>
                <label className="ss-field">
                  <span>字段 Key</span>
                  <input value={field.key} onChange={(event) => onChange(field.id, { key: event.target.value })} />
                </label>
                <label className="ss-field">
                  <span>字段类型</span>
                  <select value={field.type} onChange={(event) => onChange(field.id, { type: event.target.value as TemplateField['type'] })}>
                    {fieldTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="ss-grid ss-grid--three">
                <label className="ss-field">
                  <span>字段来源</span>
                  <select value={field.scope} onChange={(event) => onChange(field.id, { scope: event.target.value as TemplateField['scope'] })}>
                    <option value="list">列表页</option>
                    <option value="detail">详情页</option>
                  </select>
                </label>
                <label className="ss-field">
                  <span>Selector</span>
                  <input
                    value={field.selector ?? ''}
                    placeholder="可选，支持手动指定"
                    onChange={(event) =>
                      onChange(field.id, {
                        selector: event.target.value,
                        selectorSource: event.target.value ? 'manual' : field.selectorSource,
                      })
                    }
                  />
                </label>
                <label className="ss-field">
                  <span>属性</span>
                  <input
                    value={field.attribute ?? ''}
                    placeholder="如 href / src / datetime"
                    onChange={(event) => onChange(field.id, { attribute: event.target.value })}
                  />
                </label>
              </div>

              <div className="ss-grid ss-grid--two">
                <label className="ss-field">
                  <span>说明</span>
                  <input
                    value={field.description ?? ''}
                    placeholder="可选，记录字段含义"
                    onChange={(event) => onChange(field.id, { description: event.target.value })}
                  />
                </label>
                <label className="ss-field">
                  <span>样例值</span>
                  <input
                    value={field.sampleValue ?? ''}
                    placeholder="来自 AI 推荐或详情页样本"
                    onChange={(event) => onChange(field.id, { sampleValue: event.target.value })}
                  />
                </label>
              </div>

              <div className="ss-inline-actions">
                <span className="ss-muted">
                  来源：{field.selectorSource === 'ai' ? 'AI 推荐' : '手动'} / {field.scope === 'list' ? '列表页' : '详情页'}
                </span>
                <div className="ss-inline-actions">
                  <button type="button" className="ss-btn ss-btn--ghost" disabled={index === 0} onClick={() => onMove(field.id, 'up')}>
                    上移
                  </button>
                  <button
                    type="button"
                    className="ss-btn ss-btn--ghost"
                    disabled={index === fields.length - 1}
                    onClick={() => onMove(field.id, 'down')}
                  >
                    下移
                  </button>
                  <button type="button" className="ss-btn ss-btn--danger" onClick={() => onRemove(field.id)}>
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ss-empty">当前模板还没有字段，请先添加字段或使用 AI 推荐。</div>
      )}
    </div>
  )
}
