export type SidebarView = 'crawler' | 'schedule' | 'email' | 'phone' | 'image'

export type CrawlerPhase =
  | 'source'
  | 'navigation'
  | 'template'
  | 'detail_field_discovery'
  | 'detail_field_ready'
  | 'detail_field_confirmed'
  | 'optimizing'
  | 'runtime_mode_select'
  | 'task_running'
  | 'result'

export type SourceKind = 'current_page' | 'pasted_links' | 'file_image'
export type NavigationMode = 'auto' | 'none' | 'click' | 'scroll'
export type NavigationStepStatus =
  | 'idle'
  | 'detecting'
  | 'ready'
  | 'selecting_pagination_target'
  | 'configured'
export type RuntimeMode = 'browser' | 'cloud'
export type TemplateEntryMode = 'new' | 'preset'
export type FieldScope = 'list' | 'detail'
export type FieldType = 'text' | 'url' | 'date' | 'image' | 'long_text'
export type ToolStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'
export type StrategySource = 'ai' | 'manual'

export interface PageContext {
  title: string
  url: string
  hostname: string
  description: string
  tabId?: number
  windowId?: number
}

export interface ImportedUrl {
  id: string
  url: string
}

export interface UploadedAsset {
  id: string
  name: string
  kind: 'file' | 'image' | 'screenshot'
  previewUrl?: string
  sizeLabel: string
}

export interface SourceState {
  kind: SourceKind
  currentPage: PageContext
  pastedUrls: ImportedUrl[]
  uploadedAssets: UploadedAsset[]
}

export interface NavigationTarget {
  id: string
  label: string
  selector: string
  anchorText?: string
  confidence: number
}

export interface ClickPaginationConfig {
  pageLimit: number
  untilLastPage: boolean
  delayMs: number
}

export interface ScrollPaginationConfig {
  scrollCount: number
  intervalMs: number
}

export interface NavigationState {
  mode: NavigationMode
  status: NavigationStepStatus
  recommendedMode?: Exclude<NavigationMode, 'auto'>
  detectionSummary?: string
  targets: NavigationTarget[]
  selectedTargetId?: string
  recommendedSelector?: string
  strategySource: StrategySource
  clickConfig: ClickPaginationConfig
  scrollConfig: ScrollPaginationConfig
  error?: string
}

export interface TemplateField {
  id: string
  key: string
  label: string
  type: FieldType
  scope: FieldScope
  description?: string
  required?: boolean
  sampleValue?: string
  selector?: string
  attribute?: string
  selectorSource?: StrategySource
}

export interface TemplatePreset {
  id: string
  name: string
  description: string
  fields: TemplateField[]
}

export interface TemplateState {
  id: string
  entryMode: TemplateEntryMode
  selectedPresetId?: string
  name: string
  description: string
  fields: TemplateField[]
  recommendedFields: TemplateField[]
  aiRecommendationStatus: 'idle' | 'loading' | 'ready' | 'error'
  lastUpdatedAt?: string
}

export interface DetailDiscoveryState {
  sampleUrl?: string
  linkedUrlFieldId?: string
  message?: string
  discoveredFields: TemplateField[]
}

export interface OptimizationState {
  status: 'idle' | 'running' | 'ready' | 'error'
  strategy?: 'dom' | 'hybrid' | 'vision'
  summary?: string
  warnings: string[]
}

export interface PageLinkSample {
  text: string
  href: string
  selector: string
}

export interface ListItemCandidate {
  selector: string
  textPreview: string
  links: PageLinkSample[]
}

export interface ContainerCandidate {
  selector: string
  itemSelector?: string
  itemCount: number
  confidence: number
}

export interface PageAnalysis {
  pageType: 'list' | 'detail' | 'mixed'
  title: string
  url: string
  summary: string
  strategySource: StrategySource
  suggestedContainerSelector?: string
  suggestedItemSelector?: string
  suggestedDetailLinkSelector?: string
  detailUrlFieldKey?: string
  containerCandidates: ContainerCandidate[]
  paginationCandidates: NavigationTarget[]
  itemSamples: ListItemCandidate[]
}

export interface ExtractionPlan {
  containerSelector?: string
  itemSelector?: string
  detailUrlFieldKey?: string
  listFields: TemplateField[]
  detailFields: TemplateField[]
}

export interface TaskStep {
  id: string
  type:
    | 'fetch_page'
    | 'extract_list'
    | 'open_detail'
    | 'extract_detail'
    | 'merge_result'
    | 'open_result_table'
  label: string
  status: 'pending' | 'running' | 'done' | 'error'
  url?: string
}

export interface TaskRun {
  id: string
  mode: 'browser'
  status: 'idle' | 'running' | 'paused' | 'success' | 'error' | 'stopped'
  progress: number
  steps: TaskStep[]
  currentUrl?: string
  startedAt?: string
  endedAt?: string
  currentLabel?: string
  pageProgressLabel?: string
  processedCount?: number
  totalCount?: number
  resultTableOpen?: boolean
  hidden?: boolean
  errorMessage?: string
  currentPageIndex?: number
  detailProgress?: string
  results?: ResultRow[]
}

export interface RunProgressEvent {
  run: TaskRun
}

export interface BrowserRunRequest {
  source: SourceState
  navigation: NavigationState
  template: TemplateState
  pageAnalysis?: PageAnalysis | null
}

export interface BrowserRunResult {
  run: TaskRun
  rows: ResultRow[]
}

export type ResultRow = Record<string, string | number | boolean | null>

export interface ResultState {
  rows: ResultRow[]
  page: number
  pageSize: number
  feedback?: 'helpful' | 'not_helpful'
  opened: boolean
}

export interface ScheduleTask {
  id: string
  name: string
  sourceLabel: string
  scheduleLabel: string
  status: 'active' | 'paused'
  nextRunAt: string
}

export interface EmailItem {
  value: string
}

export interface PhoneItem {
  value: string
}

export interface ImageItem {
  id: string
  src: string
  width: number
  height: number
  group: string
}

export interface ToolPanelState<T> {
  status: ToolStatus
  items: T[]
  error?: string
  scannedAt?: string
}

export interface ToolState {
  scheduleTasks: ScheduleTask[]
  emails: ToolPanelState<EmailItem>
  phones: ToolPanelState<PhoneItem>
  images: ToolPanelState<ImageItem>
}

export interface CrawlerState {
  phase: CrawlerPhase
  source: SourceState
  navigation: NavigationState
  template: TemplateState
  detailDiscovery: DetailDiscoveryState
  optimization: OptimizationState
  runtimeMode: RuntimeMode
  taskRun: TaskRun
  result: ResultState
  pageAnalysis?: PageAnalysis | null
  lastError?: string
  recoveryNotice?: string
  aiManualFallback?: boolean
}

export interface SidebarStore {
  hydrated: boolean
  activeView: SidebarView
  crawler: CrawlerState
  tools: ToolState
  switchView: (view: SidebarView) => void
  hydrateCurrentPage: () => Promise<void>
  setSourceKind: (kind: SourceKind) => void
  addPastedUrls: (urls: string[]) => void
  removePastedUrl: (id: string) => void
  importFilesAsAssets: (files: FileList | File[]) => Promise<void>
  addDemoScreenshot: () => void
  goBack: () => void
  goNextFromSource: () => void
  detectNavigation: () => Promise<void>
  applyNavigationRecommendation: () => void
  setNavigationMode: (mode: Exclude<NavigationMode, 'auto'>) => void
  startSelectingPaginationTarget: () => Promise<void>
  selectPaginationTarget: (targetId: string) => void
  updateClickConfig: (patch: Partial<ClickPaginationConfig>) => void
  updateScrollConfig: (patch: Partial<ScrollPaginationConfig>) => void
  goNextFromNavigation: () => void
  setTemplateEntryMode: (mode: TemplateEntryMode) => void
  setTemplateName: (name: string) => void
  selectPresetTemplate: (presetId: string) => void
  recommendFields: () => Promise<void>
  addField: (scope?: FieldScope) => void
  updateField: (fieldId: string, patch: Partial<TemplateField>) => void
  moveField: (fieldId: string, direction: 'up' | 'down') => void
  removeField: (fieldId: string) => void
  goNextFromTemplate: () => Promise<void>
  confirmDetailDiscovery: () => void
  startOptimization: () => Promise<void>
  completeOptimization: () => void
  setRuntimeMode: (mode: RuntimeMode) => void
  startRun: () => Promise<void>
  resumeRunIfNeeded: () => Promise<void>
  stopRun: () => Promise<void>
  applyRunUpdate: (payload: BrowserRunResult) => void
  toggleRunnerHidden: () => void
  openResultTable: () => void
  setResultPage: (page: number) => void
  setResultFeedback: (feedback: ResultState['feedback']) => void
  rerunTask: () => Promise<void>
  resetToTemplate: () => void
  addScheduleTask: () => void
  toggleScheduleTask: (taskId: string) => void
  scanEmails: () => Promise<void>
  scanPhones: () => Promise<void>
  scanImages: () => Promise<void>
}
