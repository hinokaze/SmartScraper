const ACTIONS = {
  GET_CURRENT_PAGE: 'SS_GET_CURRENT_PAGE',
  ANALYZE_PAGE: 'SS_ANALYZE_PAGE',
  DETECT_NAVIGATION: 'SS_DETECT_NAVIGATION',
  PICK_PAGINATION_TARGET: 'SS_PICK_PAGINATION_TARGET',
  EXTRACT_LIST_PAGE: 'SS_EXTRACT_LIST_PAGE',
  EXTRACT_DETAIL_PAGE: 'SS_EXTRACT_DETAIL_PAGE',
  START_BROWSER_RUN: 'SS_START_BROWSER_RUN',
  STOP_BROWSER_RUN: 'SS_STOP_BROWSER_RUN',
  GET_ACTIVE_RUN: 'SS_GET_ACTIVE_RUN',
  CLICK_PAGINATION: 'SS_CLICK_PAGINATION',
  SCROLL_PAGE: 'SS_SCROLL_PAGE',
  RUN_PROGRESS: 'SS_RUN_PROGRESS',
  SCAN_EMAILS: 'SS_SCAN_EMAILS',
  SCAN_PHONES: 'SS_SCAN_PHONES',
  SCAN_IMAGES: 'SS_SCAN_IMAGES',
}

const ACTIVE_RUN_KEY = 'smartScraper.activeRun'
const activeRuns = new Map()

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {})
})

chrome.runtime.onStartup.addListener(async () => {
  const stored = await chrome.storage.local.get([ACTIVE_RUN_KEY])
  const run = stored[ACTIVE_RUN_KEY]
  if (run?.tabId) {
    activeRuns.set(run.tabId, run)
  }
})

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (!activeRuns.has(tabId)) return
  activeRuns.delete(tabId)
  await chrome.storage.local.remove(ACTIVE_RUN_KEY)
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  Promise.resolve(routeMessage(message))
    .then((data) => sendResponse({ success: true, data }))
    .catch((error) => sendResponse({ success: false, error: error?.message || '后台执行失败。' }))
  return true
})

async function routeMessage(message) {
  switch (message?.action) {
    case ACTIONS.GET_CURRENT_PAGE:
      return getCurrentPage()
    case ACTIONS.ANALYZE_PAGE:
      return relayToActiveTab(ACTIONS.ANALYZE_PAGE)
    case ACTIONS.DETECT_NAVIGATION:
      return relayToActiveTab(ACTIONS.DETECT_NAVIGATION)
    case ACTIONS.PICK_PAGINATION_TARGET:
      return relayToActiveTab(ACTIONS.PICK_PAGINATION_TARGET)
    case ACTIONS.EXTRACT_DETAIL_PAGE:
      return extractDetailSample(message.payload)
    case ACTIONS.START_BROWSER_RUN:
      return startBrowserRun(message.payload)
    case ACTIONS.STOP_BROWSER_RUN:
      return stopBrowserRun()
    case ACTIONS.GET_ACTIVE_RUN:
      return getActiveRun()
    case ACTIONS.SCAN_EMAILS:
      return relayToActiveTab(ACTIONS.SCAN_EMAILS)
    case ACTIONS.SCAN_PHONES:
      return relayToActiveTab(ACTIONS.SCAN_PHONES)
    case ACTIONS.SCAN_IMAGES:
      return relayToActiveTab(ACTIONS.SCAN_IMAGES)
    default:
      throw new Error(`未知消息类型：${message?.action}`)
  }
}

async function getCurrentPage() {
  const tab = await getActiveTab()
  return {
    title: tab?.title || '当前页面',
    url: tab?.url || 'https://example.com',
    hostname: (() => {
      try {
        return new URL(tab?.url || 'https://example.com').hostname
      } catch {
        return 'example.com'
      }
    })(),
    description: '来自浏览器当前激活标签页。',
    tabId: tab?.id,
    windowId: tab?.windowId,
  }
}

async function getActiveRun() {
  const tab = await getActiveTab()
  if (tab?.id && activeRuns.has(tab.id)) {
    const run = activeRuns.get(tab.id)
    return { run, rows: run.results || [] }
  }

  const stored = await chrome.storage.local.get([ACTIVE_RUN_KEY])
  const run = stored[ACTIVE_RUN_KEY] || null
  return run ? { run, rows: run.results || [] } : null
}

async function startBrowserRun(payload) {
  const tab = await getActiveTab()
  if (!tab?.id) throw new Error('未找到当前标签页。')
  if (payload?.source?.kind !== 'current_page') throw new Error('本轮仅支持“当前页面 + 浏览器模式”运行。')

  const run = createInitialRun(tab.id, payload)
  activeRuns.set(tab.id, run)
  await persistRun(tab.id)
  broadcastRun(tab.id)
  void executeBrowserRun(tab.id, payload)
  return { run, rows: [] }
}

async function stopBrowserRun() {
  const tab = await getActiveTab()
  if (!tab?.id) throw new Error('未找到当前标签页。')
  const current = activeRuns.get(tab.id)
  if (!current) return { stopping: false }

  await updateRun(tab.id, {
    status: 'stopped',
    errorMessage: '任务已停止。',
    currentLabel: '任务已停止',
    endedAt: new Date().toISOString(),
    abortRequested: true,
  })
  return { stopping: true }
}

async function extractDetailSample(payload) {
  if (!payload?.url) throw new Error('缺少样本详情页 URL。')
  const detailTab = await chrome.tabs.create({ url: payload.url, active: false })
  try {
    await waitForTabComplete(detailTab.id)
    return await relayToTab(detailTab.id, ACTIONS.EXTRACT_DETAIL_PAGE, { fields: payload.fields })
  } finally {
    await chrome.tabs.remove(detailTab.id).catch(() => {})
  }
}

async function executeBrowserRun(tabId, payload) {
  try {
    const template = payload.template
    const navigation = payload.navigation
    const listFields = template.fields.filter((field) => field.scope === 'list')
    const detailFields = template.fields.filter((field) => field.scope === 'detail')
    const selectedTarget = navigation.targets.find((target) => target.id === navigation.selectedTargetId)
    const selectedSelector = selectedTarget?.selector || navigation.recommendedSelector
    const pageLimit =
      navigation.mode === 'click'
        ? navigation.clickConfig.untilLastPage ? 200 : navigation.clickConfig.pageLimit
        : navigation.mode === 'scroll'
          ? navigation.scrollConfig.scrollCount
          : 1

    const collectedRows = []
    const rowKeys = new Set()

    await updateStep(tabId, 'fetch_page', 'running', '正在分析当前页面')

    for (let pageIndex = 1; pageIndex <= pageLimit; pageIndex += 1) {
      if (isAborted(tabId)) break

      await updateRun(tabId, {
        currentPageIndex: pageIndex,
        currentUrl: payload.source.currentPage.url,
        currentLabel: `正在抓取第 ${pageIndex} 页`,
        pageProgressLabel: `分页进度 ${pageIndex} / ${pageLimit}`,
      })

      await updateStep(tabId, 'extract_list', 'running', `正在提取第 ${pageIndex} 页列表字段`)
      const listResult = await relayToTab(tabId, ACTIONS.EXTRACT_LIST_PAGE, {
        fields: listFields,
        containerSelector: payload.pageAnalysis?.suggestedContainerSelector,
        itemSelector: payload.pageAnalysis?.suggestedItemSelector,
        maxItems: 30,
      })

      listResult.rows.forEach((row) => {
        const rowKey = row.detailUrl || row.url || row.title || JSON.stringify(row)
        if (rowKeys.has(rowKey)) return
        rowKeys.add(rowKey)
        collectedRows.push({ ...row, _page: pageIndex })
      })

      await updateRun(tabId, {
        processedCount: collectedRows.length,
        totalCount: Math.max(collectedRows.length, pageLimit * 10),
      })

      if (pageIndex >= pageLimit) break

      if (navigation.mode === 'click') {
        if (!selectedSelector) break
        const paginationResult = await relayToTab(tabId, ACTIONS.CLICK_PAGINATION, {
          selector: selectedSelector,
          delayMs: navigation.clickConfig.delayMs,
        }).catch(() => null)
        if (!paginationResult?.clicked) break
      } else if (navigation.mode === 'scroll') {
        await relayToTab(tabId, ACTIONS.SCROLL_PAGE, {
          iterations: 1,
          intervalMs: navigation.scrollConfig.intervalMs,
        })
      } else {
        break
      }
    }

    await updateStep(tabId, 'extract_list', 'done')

    if (detailFields.length) {
      const detailUrlField = listFields.find((field) => field.type === 'url')?.key || payload.pageAnalysis?.detailUrlFieldKey
      if (!detailUrlField) throw new Error('模板包含详情页字段，但没有可用的详情链接字段。')

      const detailRows = collectedRows.filter((row) => typeof row[detailUrlField] === 'string' && row[detailUrlField])
      for (let index = 0; index < detailRows.length; index += 1) {
        if (isAborted(tabId)) break
        const row = detailRows[index]
        const detailUrl = row[detailUrlField]

        await updateStep(tabId, 'open_detail', 'running', `正在打开详情页 ${index + 1} / ${detailRows.length}`, detailUrl)
        const detailTab = await chrome.tabs.create({ url: detailUrl, active: false })
        try {
          await waitForTabComplete(detailTab.id)
          await updateStep(tabId, 'extract_detail', 'running', `正在提取详情字段 ${index + 1} / ${detailRows.length}`, detailUrl)
          const detailResult = await relayToTab(detailTab.id, ACTIONS.EXTRACT_DETAIL_PAGE, { fields: detailFields })
          Object.assign(row, detailResult)
          await updateRun(tabId, {
            currentUrl: detailUrl,
            detailProgress: `详情补抓 ${index + 1} / ${detailRows.length}`,
            processedCount: collectedRows.length,
          })
        } finally {
          await chrome.tabs.remove(detailTab.id).catch(() => {})
        }
      }

      await updateStep(tabId, 'extract_detail', 'done')
      await updateStep(tabId, 'merge_result', 'done', '正在合并列表与详情数据')
    }

    await updateStep(tabId, 'open_result_table', 'done', '抓取完成，正在打开结果表')
    await updateRun(tabId, {
      status: isAborted(tabId) ? 'stopped' : 'success',
      progress: 100,
      endedAt: new Date().toISOString(),
      currentLabel: isAborted(tabId) ? '任务已停止' : '任务已完成',
      resultTableOpen: !isAborted(tabId),
      results: collectedRows,
    })
  } catch (error) {
    await updateRun(tabId, {
      status: 'error',
      errorMessage: error?.message || '运行失败。',
      currentLabel: '运行失败',
      endedAt: new Date().toISOString(),
    })
  }
}

function createInitialRun(tabId, payload) {
  const hasDetail = payload.template.fields.some((field) => field.scope === 'detail')
  return {
    id: `run-${Date.now()}`,
    tabId,
    mode: 'browser',
    status: 'running',
    progress: 3,
    steps: [
      createStep('fetch_page', '分析页面'),
      createStep('extract_list', '提取列表字段'),
      ...(hasDetail
        ? [
            createStep('open_detail', '打开详情页'),
            createStep('extract_detail', '提取详情字段'),
            createStep('merge_result', '合并结果'),
          ]
        : []),
      createStep('open_result_table', '打开结果表'),
    ],
    currentUrl: payload.source.currentPage.url,
    startedAt: new Date().toISOString(),
    currentLabel: '准备开始任务',
    pageProgressLabel: '分页进度 0 / 1',
    processedCount: 0,
    totalCount: 0,
    resultTableOpen: false,
    hidden: false,
    detailProgress: undefined,
    results: [],
    abortRequested: false,
  }
}

function createStep(type, label) {
  return { id: `${type}-${Math.random().toString(36).slice(2, 7)}`, type, label, status: 'pending' }
}

async function updateStep(tabId, stepType, status, currentLabel, currentUrl) {
  const run = activeRuns.get(tabId)
  if (!run) return
  const order = run.steps.map((step) => step.type)
  const steps = run.steps.map((step) => {
    if (step.type === stepType) return { ...step, status, url: currentUrl || step.url }
    if (status === 'running' && step.status === 'pending' && order.indexOf(step.type) < order.indexOf(stepType)) {
      return { ...step, status: 'done' }
    }
    return step
  })
  const doneCount = steps.filter((step) => step.status === 'done').length
  await updateRun(tabId, {
    steps,
    progress: Math.min(95, Math.round((doneCount / steps.length) * 100)),
    currentLabel: currentLabel || run.currentLabel,
    currentUrl: currentUrl || run.currentUrl,
  })
}

async function updateRun(tabId, patch) {
  const current = activeRuns.get(tabId)
  if (!current) return null
  const next = { ...current, ...patch }
  activeRuns.set(tabId, next)
  await persistRun(tabId)
  broadcastRun(tabId)
  return next
}

async function persistRun(tabId) {
  const run = activeRuns.get(tabId)
  await chrome.storage.local.set({ [ACTIVE_RUN_KEY]: run ? JSON.parse(JSON.stringify(run)) : null })
}

function broadcastRun(tabId) {
  const run = activeRuns.get(tabId)
  if (!run) return
  chrome.runtime.sendMessage({ action: ACTIONS.RUN_PROGRESS, data: { run, rows: run.results || [] } }).catch(() => {})
}

function isAborted(tabId) {
  return Boolean(activeRuns.get(tabId)?.abortRequested)
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab || null
}

async function relayToActiveTab(action, payload) {
  const tab = await getActiveTab()
  if (!tab?.id) throw new Error('未找到当前标签页。')
  return relayToTab(tab.id, action, payload)
}

async function relayToTab(tabId, action, payload) {
  await ensureContentScript(tabId)
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { action, payload }, (response) => {
      const lastError = chrome.runtime.lastError
      if (lastError) {
        reject(new Error(lastError.message))
        return
      }
      if (!response?.success) {
        reject(new Error(response?.error || '标签页通信失败。'))
        return
      }
      resolve(response.data)
    })
  })
}

async function ensureContentScript(tabId) {
  try {
    await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { action: ACTIONS.ANALYZE_PAGE }, (response) => {
        const lastError = chrome.runtime.lastError
        if (lastError) {
          reject(lastError)
          return
        }
        resolve(response)
      })
    })
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['assets/content.js'],
    })
  }
}

async function waitForTabComplete(tabId, timeout = 30000) {
  const tab = await chrome.tabs.get(tabId).catch(() => null)
  if (tab?.status === 'complete') return

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener)
      reject(new Error('等待标签页加载超时。'))
    }, timeout)

    function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timer)
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
      }
    }

    chrome.tabs.onUpdated.addListener(listener)
  })
}
