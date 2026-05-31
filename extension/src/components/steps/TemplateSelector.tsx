import { templatePresets } from '../../data/presets'
import type { PageAnalysis, SourceKind, TemplateState } from '../../types'
import FieldEditor from './FieldEditor'

type TemplateSelectorProps = {
  template: TemplateState
  sourceKind: SourceKind
  pageAnalysis?: PageAnalysis | null
  onSetEntryMode: (mode: TemplateState['entryMode']) => void
  onSetName: (name: string) => void
  onSelectPreset: (presetId: string) => void
  onRecommendFields: () => Promise<void>
  onAddField: (scope?: 'list' | 'detail') => void
  onFieldChange: (fieldId: string, patch: Partial<TemplateState['fields'][number]>) => void
  onFieldMove: (fieldId: string, direction: 'up' | 'down') => void
  onFieldRemove: (fieldId: string) => void
}

export default function TemplateSelector({
  template,
  sourceKind,
  pageAnalysis,
  onSetEntryMode,
  onSetName,
  onSelectPreset,
  onRecommendFields,
  onAddField,
  onFieldChange,
  onFieldMove,
  onFieldRemove,
}: TemplateSelectorProps) {
  return (
    <div className="ss-stack">
      <div className="ss-card ss-stack">
        <div className="ss-subsection">
          <div>
            <h3>模板入口</h3>
            <p>可以从 AI 推荐开始，也可以切换到已有模板后继续微调字段和抓取来源。</p>
          </div>
          <div className="ss-inline-actions">
            <button
              type="button"
              className={`ss-btn ${template.entryMode === 'new' ? 'ss-btn--primary' : 'ss-btn--ghost'}`}
              onClick={() => onSetEntryMode('new')}
            >
              新建模板
            </button>
            <button
              type="button"
              className={`ss-btn ${template.entryMode === 'preset' ? 'ss-btn--primary' : 'ss-btn--ghost'}`}
              onClick={() => onSetEntryMode('preset')}
            >
              选择已有模板
            </button>
          </div>
        </div>

        <div className="ss-grid ss-grid--two">
          <label className="ss-field">
            <span>模板名称</span>
            <input value={template.name} onChange={(event) => onSetName(event.target.value)} />
          </label>
          <div className="ss-inline-card">
            <div>
              <span className="ss-muted">页面分析</span>
              <strong>{pageAnalysis?.pageType ? `${pageAnalysis.pageType} 页面` : '等待分析'}</strong>
            </div>
            <div>
              <span className="ss-muted">来源限制</span>
              <strong>{sourceKind === 'current_page' ? '可真实运行' : '当前仅保留配置'}</strong>
            </div>
          </div>
        </div>
      </div>

      {template.entryMode === 'new' ? (
        <div className="ss-card ss-stack">
          <div className="ss-subsection">
            <div>
              <h3>AI 推荐字段</h3>
              <p>根据当前页面结构推荐字段、字段类型、列表页/详情页来源以及候选 selector。</p>
            </div>
            <button
              type="button"
              className="ss-btn ss-btn--primary"
              disabled={template.aiRecommendationStatus === 'loading'}
              onClick={onRecommendFields}
            >
              {template.aiRecommendationStatus === 'loading' ? '正在推荐字段...' : 'AI 推荐字段'}
            </button>
          </div>

          {template.recommendedFields.length ? (
            <div className="ss-chip-list">
              {template.recommendedFields.map((field) => (
                <span key={field.id} className="ss-chip ss-chip--static">
                  {field.label} / {field.scope === 'list' ? '列表页' : '详情页'}
                </span>
              ))}
            </div>
          ) : (
            <div className="ss-empty">还没有推荐字段，先完成页面分析后再试一次。</div>
          )}
        </div>
      ) : (
        <div className="ss-grid ss-grid--two">
          {templatePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`ss-choice-card ${template.selectedPresetId === preset.id ? 'is-selected' : ''}`}
              onClick={() => onSelectPreset(preset.id)}
            >
              <strong>{preset.name}</strong>
              <span>{preset.description}</span>
            </button>
          ))}
        </div>
      )}

      <FieldEditor
        fields={template.fields}
        onAddField={onAddField}
        onChange={onFieldChange}
        onMove={onFieldMove}
        onRemove={onFieldRemove}
      />
    </div>
  )
}
