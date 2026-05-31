import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { copy } from '../data/copy'
import { cloneFields, createEmptyTemplate, templatePresets } from '../data/presets'
import { aiService } from '../services/aiService'
import { browserRuntime } from '../services/browserRuntime'
import type { BrowserRunResult, CrawlerPhase, CrawlerState, PageAnalysis, SidebarStore, TaskRun, ToolPanelState } from '../types'
import { extractUrlsFromFile, formatFileSize } from '../utils/fileImport'

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`
const emptyRun = (): TaskRun => ({ id: 'task-idle', mode: 'browser', status: 'idle', progress: 0, steps: [], hidden: false, resultTableOpen: false })
const createInitialCrawlerState = (): CrawlerState => ({
  phase: 'source',
  source: { kind: 'current_page', currentPage: { title: '当前页面', url: 'https://example.com', hostname: 'example.com', description: '来自浏览器当前激活标签页。' }, pastedUrls: [], uploadedAssets: [] },
  navigation: { mode: 'none', status: 'idle', targets: [], strategySource: 'manual', clickConfig: { pageLimit: 5, untilLastPage: false, delayMs: 1200 }, scrollConfig: { scrollCount: 6, intervalMs: 1200 } },
  template: createEmptyTemplate(),
  detailDiscovery: { discoveredFields: [] },
  optimization: { status: 'idle', warnings: [] },
  runtimeMode: 'browser',
  taskRun: emptyRun(),
  result: { rows: [], page: 1, pageSize: 10, opened: false },
  pageAnalysis: null,
})
const patchToolState = <T,>(current: ToolPanelState<T>, patch: Partial<ToolPanelState<T>>): ToolPanelState<T> => ({ ...current, ...patch })
const backMap: Partial<Record<CrawlerPhase, CrawlerPhase>> = { navigation: 'source', template: 'navigation', detail_field_discovery: 'template', detail_field_ready: 'template', detail_field_confirmed: 'detail_field_ready', optimizing: 'template', runtime_mode_select: 'optimizing', result: 'template' }
const sampleUrlFromAnalysis = (analysis?: PageAnalysis | null) => analysis?.itemSamples.flatMap((item) => item.links).find((link) => Boolean(link.href))?.href
const mapRunPayload = (payload: BrowserRunResult) => ({ taskRun: { ...payload.run, mode: 'browser' as const }, resultRows: payload.rows || payload.run.results || [] })

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      activeView: 'crawler',
      crawler: createInitialCrawlerState(),
      tools: { scheduleTasks: [], emails: { status: 'idle', items: [] }, phones: { status: 'idle', items: [] }, images: { status: 'idle', items: [] } },
      switchView: (view) => set({ activeView: view }),
      hydrateCurrentPage: async () => {
        try {
          const page = await browserRuntime.getCurrentPage()
          set((state) => ({ crawler: { ...state.crawler, source: { ...state.crawler.source, currentPage: page } } }))
        } catch (error) {
          set((state) => ({ crawler: { ...state.crawler, lastError: error instanceof Error ? error.message : '无法读取当前页面。' } }))
        }
      },
      setSourceKind: (kind) => set((state) => ({ crawler: { ...state.crawler, source: { ...state.crawler.source, kind }, lastError: undefined } })),
      addPastedUrls: (urls) => set((state) => {
        const existing = new Set(state.crawler.source.pastedUrls.map((item) => item.url))
        const nextUrls = urls.filter((url) => !existing.has(url)).map((url) => ({ id: createId('url'), url }))
        return { crawler: { ...state.crawler, source: { ...state.crawler.source, pastedUrls: [...state.crawler.source.pastedUrls, ...nextUrls] } } }
      }),
      removePastedUrl: (id) => set((state) => ({ crawler: { ...state.crawler, source: { ...state.crawler.source, pastedUrls: state.crawler.source.pastedUrls.filter((item) => item.id !== id) } } })),
      importFilesAsAssets: async (files) => {
        const fileList = Array.from(files)
        const urlsFromFiles = await Promise.all(fileList.map(async (file) => {
          const lowerName = file.name.toLowerCase()
          return lowerName.endsWith('.csv') || lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx') ? extractUrlsFromFile(file) : []
        }))
        const assets = fileList.map((file) => ({ id: createId('asset'), name: file.name, kind: file.type.startsWith('image/') ? ('image' as const) : ('file' as const), previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined, sizeLabel: formatFileSize(file.size) }))
        set((state) => ({
          crawler: {
            ...state.crawler,
            source: {
              ...state.crawler.source,
              uploadedAssets: [...state.crawler.source.uploadedAssets, ...assets],
              pastedUrls: [...state.crawler.source.pastedUrls, ...urlsFromFiles.flat().filter((url, index, list) => list.indexOf(url) === index).map((url) => ({ id: createId('url'), url }))],
            },
          },
        }))
      },
      addDemoScreenshot: () => set((state) => ({ crawler: { ...state.crawler, source: { ...state.crawler.source, uploadedAssets: [...state.crawler.source.uploadedAssets, { id: createId('asset'), name: '当前页面截图.png', kind: 'screenshot', sizeLabel: '等待接入真实截图能力' }] } } })),
      goBack: () => set((state) => ({ crawler: { ...state.crawler, phase: backMap[state.crawler.phase] ?? state.crawler.phase, lastError: undefined } })),
      goNextFromSource: () => set((state) => {
        const { kind, pastedUrls, uploadedAssets } = state.crawler.source
        const valid = kind === 'current_page' || (kind === 'pasted_links' && pastedUrls.length > 0) || (kind === 'file_image' && uploadedAssets.length > 0)
        return { crawler: { ...state.crawler, phase: valid ? 'navigation' : 'source', lastError: valid ? undefined : '请先完成当前数据来源所需的输入。' } }
      }),
      detectNavigation: async () => {
        set((state) => ({ crawler: { ...state.crawler, navigation: { ...state.crawler.navigation, status: 'detecting', error: undefined }, lastError: undefined, aiManualFallback: false } }))
        try {
          const pageSnapshot = await browserRuntime.analyzePage()
          const heuristicNavigation = await browserRuntime.detectNavigation()
          try {
            const aiAnalysis = await aiService.analyzePage(pageSnapshot)
            const aiTargets = (aiAnalysis.navigation?.candidates || heuristicNavigation.targets || []).map((target) => ({ id: target.selector, label: target.label, selector: target.selector, anchorText: target.label, confidence: target.confidence }))
            set((state) => ({
              crawler: {
                ...state.crawler,
                pageAnalysis: { ...pageSnapshot, pageType: aiAnalysis.pageType || pageSnapshot.pageType, summary: aiAnalysis.summary || pageSnapshot.summary, strategySource: 'ai', suggestedContainerSelector: aiAnalysis.suggestedContainerSelector || pageSnapshot.suggestedContainerSelector, suggestedItemSelector: aiAnalysis.suggestedItemSelector || pageSnapshot.suggestedItemSelector, suggestedDetailLinkSelector: aiAnalysis.suggestedDetailLinkSelector || pageSnapshot.suggestedDetailLinkSelector, detailUrlFieldKey: aiAnalysis.detailUrlFieldKey || pageSnapshot.detailUrlFieldKey, paginationCandidates: aiTargets.length ? aiTargets : pageSnapshot.paginationCandidates },
                navigation: { ...state.crawler.navigation, mode: 'auto', status: 'ready', recommendedMode: aiAnalysis.navigation?.recommendedMode || heuristicNavigation.recommendedMode, detectionSummary: aiAnalysis.navigation?.summary || heuristicNavigation.summary, targets: aiTargets.length ? aiTargets : heuristicNavigation.targets, selectedTargetId: aiTargets[0]?.id, recommendedSelector: aiAnalysis.navigation?.candidates?.[0]?.selector || heuristicNavigation.recommendedSelector, strategySource: 'ai' },
              },
            }))
          } catch (error) {
            set((state) => ({
              crawler: {
                ...state.crawler,
                pageAnalysis: { ...pageSnapshot, strategySource: 'manual' },
                navigation: { ...state.crawler.navigation, mode: 'auto', status: 'ready', recommendedMode: heuristicNavigation.recommendedMode, detectionSummary: heuristicNavigation.summary, targets: heuristicNavigation.targets, selectedTargetId: heuristicNavigation.targets[0]?.id, recommendedSelector: heuristicNavigation.recommendedSelector, strategySource: 'manual' },
                aiManualFallback: true,
                lastError: `${error instanceof Error ? error.message : 'AI 分析失败。'} 已切换为手动模式。`,
              },
            }))
          }
        } catch (error) {
          set((state) => ({ crawler: { ...state.crawler, navigation: { ...state.crawler.navigation, status: 'idle', error: error instanceof Error ? error.message : '无法分析当前页面。' } } }))
        }
      },
      applyNavigationRecommendation: () => set((state) => ({ crawler: { ...state.crawler, navigation: { ...state.crawler.navigation, mode: state.crawler.navigation.recommendedMode ?? 'none', status: 'configured' } } })),
      setNavigationMode: (mode) => set((state) => ({ crawler: { ...state.crawler, navigation: { ...state.crawler.navigation, mode, recommendedMode: mode, status: mode === 'click' ? 'ready' : 'configured', strategySource: 'manual' } } })),
      startSelectingPaginationTarget: async () => {
        set((state) => ({ crawler: { ...state.crawler, navigation: { ...state.crawler.navigation, status: 'selecting_pagination_target' } } }))
        try {
          const picked = await browserRuntime.pickPaginationTarget()
          const targetId = createId('target')
          set((state) => picked ? ({ crawler: { ...state.crawler, navigation: { ...state.crawler.navigation, targets: [...state.crawler.navigation.targets, { id: targetId, label: picked.label, selector: picked.selector, anchorText: picked.anchorText, confidence: 0.99 }], selectedTargetId: targetId, recommendedSelector: picked.selector, status: 'configured', strategySource: 'manual' } } }) : ({ crawler: { ...state.crawler, navigation: { ...state.crawler.navigation, status: 'ready' } } }))
        } catch (error) {
          set((state) => ({ crawler: { ...state.crawler, navigation: { ...state.crawler.navigation, status: 'ready', error: error instanceof Error ? error.message : '未能获取翻页目标。' } } }))
        }
      },
      selectPaginationTarget: (targetId) => set((state) => ({ crawler: { ...state.crawler, navigation: { ...state.crawler.navigation, selectedTargetId: targetId, status: 'configured' } } })),
      updateClickConfig: (patch) => set((state) => ({ crawler: { ...state.crawler, navigation: { ...state.crawler.navigation, clickConfig: { ...state.crawler.navigation.clickConfig, ...patch }, status: 'configured', strategySource: 'manual' } } })),
      updateScrollConfig: (patch) => set((state) => ({ crawler: { ...state.crawler, navigation: { ...state.crawler.navigation, scrollConfig: { ...state.crawler.navigation.scrollConfig, ...patch }, status: 'configured', strategySource: 'manual' } } })),
      goNextFromNavigation: () => set((state) => {
        const needsTarget = state.crawler.navigation.mode === 'click' && !state.crawler.navigation.selectedTargetId && !state.crawler.navigation.recommendedSelector
        return { crawler: { ...state.crawler, phase: needsTarget ? 'navigation' : 'template', lastError: needsTarget ? '点击翻页模式需要先选择一个“下一页”目标。' : undefined } }
      }),
      setTemplateEntryMode: (mode) => set((state) => ({ crawler: { ...state.crawler, template: { ...state.crawler.template, entryMode: mode } } })),
      setTemplateName: (name) => set((state) => ({ crawler: { ...state.crawler, template: { ...state.crawler.template, name, lastUpdatedAt: new Date().toISOString() } } })),
      selectPresetTemplate: (presetId) => set((state) => {
        const preset = templatePresets.find((item) => item.id === presetId)
        return preset ? { crawler: { ...state.crawler, template: { ...state.crawler.template, entryMode: 'preset', selectedPresetId: preset.id, name: preset.name, description: preset.description, fields: cloneFields(preset.fields), recommendedFields: [], aiRecommendationStatus: 'ready', lastUpdatedAt: new Date().toISOString() } } } : state
      }),
      recommendFields: async () => {
        set((state) => ({ crawler: { ...state.crawler, template: { ...state.crawler.template, aiRecommendationStatus: 'loading' }, lastError: undefined } }))
        try {
          const pageSnapshot = get().crawler.pageAnalysis || (await browserRuntime.analyzePage())
          const result = await aiService.recommendFields(pageSnapshot, get().crawler.pageAnalysis)
          const fields = (result.fields || []).map((field, index) => ({ ...field, id: field.id || createId(`field-${index}`), selectorSource: field.selector ? 'ai' : field.selectorSource || 'manual' }))
          set((state) => ({ crawler: { ...state.crawler, pageAnalysis: pageSnapshot, template: { ...state.crawler.template, entryMode: 'new', name: result.templateName || 'AI 推荐模板', description: result.description || '根据当前页面结构推荐的字段配置。', fields, recommendedFields: cloneFields(fields), aiRecommendationStatus: 'ready' } } }))
        } catch (error) {
          set((state) => ({ crawler: { ...state.crawler, template: { ...state.crawler.template, aiRecommendationStatus: 'error' }, aiManualFallback: true, lastError: `${error instanceof Error ? error.message : 'AI 推荐失败。'} 已切换为手动配置。` } }))
        }
      },
      addField: (scope = 'list') => set((state) => ({ crawler: { ...state.crawler, template: { ...state.crawler.template, fields: [...state.crawler.template.fields, { id: createId('field'), key: `field_${state.crawler.template.fields.length + 1}`, label: scope === 'detail' ? '详情字段' : '列表字段', type: scope === 'detail' ? 'long_text' : 'text', scope, required: true, selectorSource: 'manual' }] } } })),
      updateField: (fieldId, patch) => set((state) => ({ crawler: { ...state.crawler, template: { ...state.crawler.template, fields: state.crawler.template.fields.map((field) => field.id === fieldId ? { ...field, ...patch } : field) } } })),
      moveField: (fieldId, direction) => set((state) => {
        const index = state.crawler.template.fields.findIndex((field) => field.id === fieldId)
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (index < 0 || targetIndex < 0 || targetIndex >= state.crawler.template.fields.length) return state
        const nextFields = [...state.crawler.template.fields]
        const [field] = nextFields.splice(index, 1)
        nextFields.splice(targetIndex, 0, field)
        return { crawler: { ...state.crawler, template: { ...state.crawler.template, fields: nextFields } } }
      }),
      removeField: (fieldId) => set((state) => ({ crawler: { ...state.crawler, template: { ...state.crawler.template, fields: state.crawler.template.fields.filter((field) => field.id !== fieldId) } } })),
      goNextFromTemplate: async () => {
        const current = get().crawler
        if (!current.template.fields.length) return set((state) => ({ crawler: { ...state.crawler, lastError: '模板至少需要保留一个字段。' } }))
        const detailFields = current.template.fields.filter((field) => field.scope === 'detail')
        if (!detailFields.length) return void (await get().startOptimization())
        const detailUrlField = current.template.fields.find((field) => field.scope === 'list' && field.type === 'url')
        if (!detailUrlField) return set((state) => ({ crawler: { ...state.crawler, lastError: '模板包含详情页字段时，必须先配置一个列表页 URL 字段。' } }))
        const sampleUrl = sampleUrlFromAnalysis(current.pageAnalysis)
        if (!sampleUrl) return set((state) => ({ crawler: { ...state.crawler, lastError: '未能从当前页面样本中识别详情页链接，请先手动补充 URL 字段或重新检测页面。' } }))
        set((state) => ({ crawler: { ...state.crawler, phase: 'detail_field_discovery', detailDiscovery: { ...state.crawler.detailDiscovery, message: '正在打开第一个 URL，帮助您识别子页面中的更多字段。', sampleUrl, linkedUrlFieldId: detailUrlField.id } } }))
        try {
          const detailSample = await browserRuntime.extractDetailSample(sampleUrl, detailFields)
          const discoveredFields = current.template.fields.map((field) => field.scope === 'detail' ? { ...field, sampleValue: detailSample[field.key] || field.sampleValue } : field)
          set((state) => ({ crawler: { ...state.crawler, phase: 'detail_field_ready', detailDiscovery: { sampleUrl, linkedUrlFieldId: detailUrlField.id, message: '已从样本详情页回填字段示例值，请确认后继续。', discoveredFields }, template: { ...state.crawler.template, fields: discoveredFields } } }))
        } catch (error) {
          set((state) => ({ crawler: { ...state.crawler, phase: 'template', lastError: error instanceof Error ? error.message : '详情页样本读取失败。' } }))
        }
      },
      confirmDetailDiscovery: () => set((state) => ({ crawler: { ...state.crawler, phase: 'detail_field_confirmed', detailDiscovery: { ...state.crawler.detailDiscovery, message: '详情页字段已确认，系统将在正式运行时按需补抓。' } } })),
      startOptimization: async () => {
        set((state) => ({ crawler: { ...state.crawler, phase: 'optimizing', optimization: { ...state.crawler.optimization, status: 'running', warnings: [] } } }))
        try {
          const optimized = await aiService.optimizeExtraction(get().crawler.pageAnalysis, get().crawler.navigation, get().crawler.template.fields)
          set((state) => ({ crawler: { ...state.crawler, optimization: { status: 'ready', strategy: optimized.strategy, summary: optimized.summary, warnings: optimized.warnings || [] } } }))
        } catch (error) {
          set((state) => ({ crawler: { ...state.crawler, optimization: { status: 'error', warnings: [error instanceof Error ? error.message : '提取策略优化失败。'] }, lastError: error instanceof Error ? error.message : '提取策略优化失败。' } }))
        }
      },
      completeOptimization: () => set((state) => ({ crawler: { ...state.crawler, phase: 'runtime_mode_select' } })),
      setRuntimeMode: (mode) => set((state) => ({ crawler: { ...state.crawler, runtimeMode: mode } })),
      startRun: async () => {
        const current = get().crawler
        if (current.runtimeMode !== 'browser') return set((state) => ({ crawler: { ...state.crawler, lastError: `${copy.runtime.cloud}尚未开放，请使用${copy.runtime.browser}。` } }))
        if (current.source.kind !== 'current_page') return set((state) => ({ crawler: { ...state.crawler, lastError: '当前仅支持“当前页面 + 浏览器模式”的真实运行。' } }))
        get().applyRunUpdate(await browserRuntime.startBrowserRun({ source: current.source, navigation: current.navigation, template: current.template, pageAnalysis: current.pageAnalysis }))
      },
      resumeRunIfNeeded: async () => {
        try {
          const payload = await browserRuntime.getActiveRun()
          if (!payload) return
          get().applyRunUpdate(payload)
          set((state) => ({ crawler: { ...state.crawler, recoveryNotice: '已恢复最近一次运行任务的状态展示。' } }))
        } catch {}
      },
      stopRun: async () => {
        await browserRuntime.stopBrowserRun()
      },
      applyRunUpdate: (payload) => set((state) => {
        const mapped = mapRunPayload(payload)
        return {
          crawler: {
            ...state.crawler,
            phase: mapped.taskRun.status === 'success' ? 'result' : 'task_running',
            taskRun: mapped.taskRun,
            result: { ...state.crawler.result, rows: mapped.resultRows, opened: mapped.taskRun.status === 'success' },
            lastError: mapped.taskRun.status === 'error' ? mapped.taskRun.errorMessage || '运行失败。' : state.crawler.lastError,
          },
        }
      }),
      toggleRunnerHidden: () => set((state) => ({ crawler: { ...state.crawler, taskRun: { ...state.crawler.taskRun, hidden: !state.crawler.taskRun.hidden } } })),
      openResultTable: () => set((state) => ({ crawler: { ...state.crawler, phase: 'result', result: { ...state.crawler.result, opened: true }, taskRun: { ...state.crawler.taskRun, resultTableOpen: true } } })),
      setResultPage: (page) => set((state) => ({ crawler: { ...state.crawler, result: { ...state.crawler.result, page } } })),
      setResultFeedback: (feedback) => set((state) => ({ crawler: { ...state.crawler, result: { ...state.crawler.result, feedback } } })),
      rerunTask: async () => {
        await get().startRun()
      },
      resetToTemplate: () => set((state) => ({ crawler: { ...state.crawler, phase: 'template', taskRun: emptyRun() } })),
      addScheduleTask: () => set((state) => ({ tools: { ...state.tools, scheduleTasks: [...state.tools.scheduleTasks, { id: createId('schedule'), name: `定时任务 ${state.tools.scheduleTasks.length + 1}`, sourceLabel: state.crawler.template.name, scheduleLabel: '每天 10:00', status: 'paused', nextRunAt: '待配置' }] } })),
      toggleScheduleTask: (taskId) => set((state) => ({ tools: { ...state.tools, scheduleTasks: state.tools.scheduleTasks.map((task) => task.id === taskId ? { ...task, status: task.status === 'active' ? 'paused' : 'active' } : task) } })),
      scanEmails: async () => {
        set((state) => ({ tools: { ...state.tools, emails: patchToolState(state.tools.emails, { status: 'loading', error: undefined }) } }))
        try {
          const items = await browserRuntime.scanEmails()
          set((state) => ({ tools: { ...state.tools, emails: { status: items.length ? 'ready' : 'empty', items, scannedAt: new Date().toISOString() } } }))
        } catch (error) {
          set((state) => ({ tools: { ...state.tools, emails: { status: 'error', items: [], error: error instanceof Error ? error.message : '邮箱扫描失败。' } } }))
        }
      },
      scanPhones: async () => {
        set((state) => ({ tools: { ...state.tools, phones: patchToolState(state.tools.phones, { status: 'loading', error: undefined }) } }))
        try {
          const items = await browserRuntime.scanPhones()
          set((state) => ({ tools: { ...state.tools, phones: { status: items.length ? 'ready' : 'empty', items, scannedAt: new Date().toISOString() } } }))
        } catch (error) {
          set((state) => ({ tools: { ...state.tools, phones: { status: 'error', items: [], error: error instanceof Error ? error.message : '电话号码扫描失败。' } } }))
        }
      },
      scanImages: async () => {
        set((state) => ({ tools: { ...state.tools, images: patchToolState(state.tools.images, { status: 'loading', error: undefined }) } }))
        try {
          const items = await browserRuntime.scanImages()
          set((state) => ({ tools: { ...state.tools, images: { status: items.length ? 'ready' : 'empty', items, scannedAt: new Date().toISOString() } } }))
        } catch (error) {
          set((state) => ({ tools: { ...state.tools, images: { status: 'error', items: [], error: error instanceof Error ? error.message : '图片扫描失败。' } } }))
        }
      },
    }),
    {
      name: 'smart-scraper-sidebar',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeView: state.activeView, crawler: state.crawler, tools: state.tools }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true
      },
    },
  ),
)
