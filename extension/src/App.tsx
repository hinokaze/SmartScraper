import { useEffect } from 'react'
import SidebarShell from './components/layout/SidebarShell'
import WizardShell from './components/layout/WizardShell'
import ExtractionModeOptimizingModal from './components/modals/ExtractionModeOptimizingModal'
import RuntimeModeSelectorModal from './components/modals/RuntimeModeSelectorModal'
import TaskRunnerPanel from './components/panels/TaskRunnerPanel'
import ResultTable from './components/results/ResultTable'
import DetailFieldDiscoveryFlow from './components/steps/DetailFieldDiscoveryFlow'
import NavigationModeStep from './components/steps/NavigationModeStep'
import SourceSelector from './components/steps/SourceSelector'
import TemplateSelector from './components/steps/TemplateSelector'
import EmailExtractorView from './components/tools/EmailExtractorView'
import ImageExtractorView from './components/tools/ImageExtractorView'
import PhoneExtractorView from './components/tools/PhoneExtractorView'
import ScheduleTaskView from './components/tools/ScheduleTaskView'
import { copy } from './data/copy'
import { browserRuntime } from './services/browserRuntime'
import { useSidebarStore } from './store/useSidebarStore'

export default function App() {
  const store = useSidebarStore()
  const {
    activeView,
    crawler,
    switchView,
    hydrateCurrentPage,
    goBack,
    goNextFromSource,
    goNextFromNavigation,
    goNextFromTemplate,
    startOptimization,
    completeOptimization,
    startRun,
    resumeRunIfNeeded,
    resetToTemplate,
    applyRunUpdate,
  } = store

  useEffect(() => {
    void hydrateCurrentPage()
    void resumeRunIfNeeded()
  }, [hydrateCurrentPage, resumeRunIfNeeded])

  useEffect(() => browserRuntime.subscribeRunProgress(applyRunUpdate), [applyRunUpdate])

  const currentMeta = copy.phaseMeta[crawler.phase]
  const banner = crawler.lastError ? (
    <div className="ss-notice ss-notice--danger">{crawler.lastError}</div>
  ) : crawler.recoveryNotice ? (
    <div className="ss-notice">{crawler.recoveryNotice}</div>
  ) : crawler.aiManualFallback ? (
    <div className="ss-notice">AI 分析失败，已切换为手动模式，您仍可继续完成配置。</div>
  ) : null

  return (
    <SidebarShell
      activeView={activeView}
      currentPage={crawler.source.currentPage}
      onSelectView={switchView}
    >
      {activeView === 'crawler' ? (
        <>
          <WizardShell
            title={currentMeta.title}
            description={currentMeta.description}
            step={currentMeta.step}
            total={3}
            banner={banner}
            actions={renderActions(crawler.phase, {
              goBack,
              goNextFromSource,
              goNextFromNavigation,
              goNextFromTemplate,
              resetToTemplate,
            })}
          >
            {renderCrawlerBody(store)}
          </WizardShell>

          {crawler.phase === 'optimizing' ? (
            <ExtractionModeOptimizingModal
              optimization={crawler.optimization}
              onBack={goBack}
              onRetry={startOptimization}
              onContinue={completeOptimization}
            />
          ) : null}

          {crawler.phase === 'runtime_mode_select' ? (
            <RuntimeModeSelectorModal
              selectedMode={crawler.runtimeMode}
              onSelect={store.setRuntimeMode}
              onBack={goBack}
              onContinue={startRun}
            />
          ) : null}
        </>
      ) : (
        renderToolBody(store)
      )}
    </SidebarShell>
  )
}

function renderCrawlerBody(store: ReturnType<typeof useSidebarStore.getState>) {
  const { crawler } = store

  switch (crawler.phase) {
    case 'source':
      return (
        <SourceSelector
          source={crawler.source}
          onSelectKind={store.setSourceKind}
          onAddUrls={store.addPastedUrls}
          onRemoveUrl={store.removePastedUrl}
          onImportFiles={store.importFilesAsAssets}
          onAddDemoScreenshot={store.addDemoScreenshot}
        />
      )
    case 'navigation':
      return (
        <NavigationModeStep
          navigation={crawler.navigation}
          onDetect={store.detectNavigation}
          onApplyRecommendation={store.applyNavigationRecommendation}
          onSetMode={store.setNavigationMode}
          onPickTarget={store.startSelectingPaginationTarget}
          onSelectTarget={store.selectPaginationTarget}
          onUpdateClickConfig={store.updateClickConfig}
          onUpdateScrollConfig={store.updateScrollConfig}
        />
      )
    case 'template':
      return (
        <TemplateSelector
          template={crawler.template}
          sourceKind={crawler.source.kind}
          pageAnalysis={crawler.pageAnalysis}
          onSetEntryMode={store.setTemplateEntryMode}
          onSetName={store.setTemplateName}
          onSelectPreset={store.selectPresetTemplate}
          onRecommendFields={store.recommendFields}
          onAddField={store.addField}
          onFieldChange={store.updateField}
          onFieldMove={store.moveField}
          onFieldRemove={store.removeField}
        />
      )
    case 'detail_field_discovery':
    case 'detail_field_ready':
    case 'detail_field_confirmed':
      return (
        <DetailFieldDiscoveryFlow
          phase={crawler.phase}
          discovery={crawler.detailDiscovery}
          fields={crawler.template.fields}
          onConfirm={store.confirmDetailDiscovery}
          onContinue={store.startOptimization}
        />
      )
    case 'task_running':
      return (
        <TaskRunnerPanel
          run={crawler.taskRun}
          onStop={store.stopRun}
          onHide={store.toggleRunnerHidden}
          onOpenResult={store.openResultTable}
        />
      )
    case 'result':
      return (
        <ResultTable
          fields={crawler.template.fields}
          result={crawler.result}
          onPageChange={store.setResultPage}
          onFeedback={store.setResultFeedback}
          onRerun={store.rerunTask}
          onEditTemplate={store.resetToTemplate}
        />
      )
    default:
      return <div className="ss-empty">当前阶段由弹窗承载，请继续操作。</div>
  }
}

function renderToolBody(store: ReturnType<typeof useSidebarStore.getState>) {
  switch (store.activeView) {
    case 'schedule':
      return (
        <ScheduleTaskView
          tasks={store.tools.scheduleTasks}
          onAddTask={store.addScheduleTask}
          onToggleTask={store.toggleScheduleTask}
        />
      )
    case 'email':
      return <EmailExtractorView state={store.tools.emails} onScan={store.scanEmails} />
    case 'phone':
      return <PhoneExtractorView state={store.tools.phones} onScan={store.scanPhones} />
    case 'image':
      return <ImageExtractorView state={store.tools.images} onScan={store.scanImages} />
    default:
      return null
  }
}

function renderActions(
  phase: ReturnType<typeof useSidebarStore.getState>['crawler']['phase'],
  actions: {
    goBack: () => void
    goNextFromSource: () => void
    goNextFromNavigation: () => void
    goNextFromTemplate: () => Promise<void>
    resetToTemplate: () => void
  },
) {
  if (phase === 'source') {
    return (
      <button type="button" className="ss-btn ss-btn--primary" onClick={actions.goNextFromSource}>
        {copy.common.next}
      </button>
    )
  }

  if (phase === 'navigation') {
    return (
      <div className="ss-inline-actions">
        <button type="button" className="ss-btn ss-btn--ghost" onClick={actions.goBack}>
          {copy.common.back}
        </button>
        <button type="button" className="ss-btn ss-btn--primary" onClick={actions.goNextFromNavigation}>
          {copy.common.next}
        </button>
      </div>
    )
  }

  if (phase === 'template') {
    return (
      <div className="ss-inline-actions">
        <button type="button" className="ss-btn ss-btn--ghost" onClick={actions.goBack}>
          {copy.common.back}
        </button>
        <button type="button" className="ss-btn ss-btn--primary" onClick={() => void actions.goNextFromTemplate()}>
          进入运行前检查
        </button>
      </div>
    )
  }

  if (phase === 'detail_field_ready') {
    return (
      <button type="button" className="ss-btn ss-btn--ghost" onClick={actions.goBack}>
        {copy.common.backToTemplate}
      </button>
    )
  }

  if (phase === 'result') {
    return (
      <button type="button" className="ss-btn ss-btn--ghost" onClick={actions.resetToTemplate}>
        {copy.common.editTemplate}
      </button>
    )
  }

  return null
}
