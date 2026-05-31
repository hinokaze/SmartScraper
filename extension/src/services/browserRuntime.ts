import type {
  BrowserRunRequest,
  BrowserRunResult,
  PageAnalysis,
  PageContext,
  RunProgressEvent,
  TemplateField,
} from '../types'

type RuntimeMessage<T = unknown> = {
  action: string
  payload?: T
}

const hasChromeRuntime = () =>
  typeof chrome !== 'undefined' &&
  typeof chrome.runtime !== 'undefined' &&
  typeof chrome.runtime.sendMessage === 'function'

const sendMessage = async <T>(message: RuntimeMessage): Promise<T> => {
  if (!hasChromeRuntime()) {
    throw new Error('扩展运行环境不可用。')
  }

  return new Promise<T>((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const lastError = chrome.runtime.lastError
      if (lastError) {
        reject(new Error(lastError.message))
        return
      }

      if (!response?.success) {
        reject(new Error(response?.error || '扩展消息调用失败。'))
        return
      }

      resolve(response.data as T)
    })
  })
}

export const browserRuntime = {
  isAvailable: hasChromeRuntime,

  getCurrentPage() {
    return sendMessage<PageContext>({ action: 'SS_GET_CURRENT_PAGE' })
  },

  analyzePage() {
    return sendMessage<PageAnalysis>({ action: 'SS_ANALYZE_PAGE' })
  },

  detectNavigation() {
    return sendMessage<{
      recommendedMode: 'none' | 'click' | 'scroll'
      summary: string
      targets: PageAnalysis['paginationCandidates']
      recommendedSelector?: string
    }>({ action: 'SS_DETECT_NAVIGATION' })
  },

  pickPaginationTarget() {
    return sendMessage<{ selector: string; label: string; anchorText?: string }>({
      action: 'SS_PICK_PAGINATION_TARGET',
    })
  },

  extractDetailSample(url: string, fields: TemplateField[]) {
    return sendMessage<Record<string, string | null>>({
      action: 'SS_EXTRACT_DETAIL_PAGE',
      payload: { url, fields },
    })
  },

  startBrowserRun(request: BrowserRunRequest) {
    return sendMessage<BrowserRunResult>({
      action: 'SS_START_BROWSER_RUN',
      payload: request,
    })
  },

  stopBrowserRun() {
    return sendMessage<{ stopping: boolean }>({
      action: 'SS_STOP_BROWSER_RUN',
    })
  },

  getActiveRun() {
    return sendMessage<BrowserRunResult | null>({
      action: 'SS_GET_ACTIVE_RUN',
    })
  },

  scanEmails() {
    return sendMessage<{ value: string }[]>({ action: 'SS_SCAN_EMAILS' })
  },

  scanPhones() {
    return sendMessage<{ value: string }[]>({ action: 'SS_SCAN_PHONES' })
  },

  scanImages() {
    return sendMessage<
      {
        id: string
        src: string
        width: number
        height: number
        group: string
      }[]
    >({ action: 'SS_SCAN_IMAGES' })
  },

  subscribeRunProgress(callback: (event: RunProgressEvent) => void) {
    if (!hasChromeRuntime()) {
      return () => {}
    }

    const listener = (message: { action?: string; data?: BrowserRunResult | RunProgressEvent }) => {
      if (message?.action !== 'SS_RUN_PROGRESS' || !message.data) {
        return
      }

      callback({ run: message.data.run })
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  },
}
