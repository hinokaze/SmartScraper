import { backendApi } from './backendApi'
import type { NavigationState, OptimizationState, PageAnalysis, TemplateField } from '../types'

type AnalyzeResponse = {
  pageType?: PageAnalysis['pageType']
  summary?: string
  suggestedContainerSelector?: string
  suggestedItemSelector?: string
  suggestedDetailLinkSelector?: string
  detailUrlFieldKey?: string
  navigation?: {
    recommendedMode?: 'none' | 'click' | 'scroll'
    summary?: string
    candidates?: Array<{
      selector: string
      label: string
      confidence: number
    }>
  }
}

export const aiService = {
  analyzePage(pageSnapshot: unknown) {
    return backendApi.request<AnalyzeResponse>('/api/ai/analyze-page', {
      method: 'POST',
      body: { pageSnapshot },
    })
  },

  recommendFields(pageSnapshot: unknown, pageAnalysis?: PageAnalysis | null) {
    return backendApi.request<{
      templateName?: string
      description?: string
      fields: TemplateField[]
    }>('/api/ai/recommend-fields', {
      method: 'POST',
      body: { pageSnapshot, pageAnalysis },
    })
  },

  optimizeExtraction(pageAnalysis: PageAnalysis | null | undefined, navigation: NavigationState, fields: TemplateField[]) {
    return backendApi.request<OptimizationState>('/api/ai/optimize-extraction', {
      method: 'POST',
      body: { pageAnalysis, navigation, fields },
    })
  },
}
