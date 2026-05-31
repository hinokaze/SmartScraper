import 'dotenv/config'
import cors from 'cors'
import express from 'express'

const app = express()
const port = parseInt(process.env.PORT, 10) || 3000
const openAiBaseUrl = normalizeBaseUrl(process.env.OPENAI_BASE_URL || 'http://127.0.0.1:1234')
const openAiApiKey = process.env.OPENAI_API_KEY || ''
const openAiModel = process.env.OPENAI_MODEL || 'qwen/qwen3.5-9b'

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    provider: 'openai-compatible',
    configured: isConfigured(),
    model: openAiModel,
    baseUrl: openAiBaseUrl,
  })
})

app.post('/api/ai/analyze-page', async (request, response) => {
  try {
    assertConfigured()
    const { pageSnapshot } = request.body || {}
    if (!pageSnapshot) {
      response.status(400).json({ error: '缺少 pageSnapshot。' })
      return
    }

    const result = await callOpenAiJson({
      systemPrompt: [
        '你是 SmartScraper 的网页分析器。',
        '目标不是泛化描述网页，而是为浏览器插件生成稳定、可执行的抓取建议。',
        '优先判断：页面类型、主列表容器、列表项粒度、详情链接、分页方式。',
        '必须尽量保守，只有在证据明确时才给高置信度。',
        '如果页面更像单篇详情页，不要强行输出列表容器。',
        '返回纯 JSON，不要输出解释性文字。',
      ].join('\n'),
      userPayload: {
        task: 'analyze-page',
        pageSnapshot: selectPageSnapshot(pageSnapshot),
      },
      schemaHint: {
        pageType: 'list | detail | mixed',
        summary: '中文总结，说明为什么这样判断',
        suggestedContainerSelector: '优先返回稳定容器 selector，没有则返回空字符串',
        suggestedItemSelector: '优先返回列表项 selector，没有则返回空字符串',
        suggestedDetailLinkSelector: '详情链接 selector，没有则返回空字符串',
        detailUrlFieldKey: 'detailUrl',
        navigation: {
          recommendedMode: 'none | click | scroll',
          summary: '中文说明翻页判断依据',
          candidates: [
            {
              selector: 'string',
              label: 'string',
              confidence: 0.9,
            },
          ],
        },
      },
    })

    response.json(result)
  } catch (error) {
    handleError(response, error)
  }
})

app.post('/api/ai/recommend-fields', async (request, response) => {
  try {
    assertConfigured()
    const { pageSnapshot, pageAnalysis } = request.body || {}
    if (!pageSnapshot) {
      response.status(400).json({ error: '缺少 pageSnapshot。' })
      return
    }

    const result = await callOpenAiJson({
      systemPrompt: [
        '你是 SmartScraper 的字段模板生成器。',
        '请只返回对结构化抓取真正有价值的字段，不要凑数，不要生成重复字段。',
        '优先输出通用高价值字段：标题、URL、日期、图片、分类、作者、正文、价格、摘要等。',
        '如果页面像列表页，优先生成列表字段；只有在有明确详情链接线索时，才生成详情页字段。',
        '尽量补充 selector 和 attribute；selector 必须偏稳定，不要过度依赖 nth-child。',
        '字段 key 使用简洁英文驼峰或小写组合，label 使用中文。',
        '返回纯 JSON。',
      ].join('\n'),
      userPayload: {
        task: 'recommend-fields',
        pageSnapshot: selectPageSnapshot(pageSnapshot),
        pageAnalysis: selectPageAnalysis(pageAnalysis),
      },
      schemaHint: {
        templateName: '中文模板名',
        description: '中文描述',
        fields: [
          {
            key: 'title',
            label: '标题',
            type: 'text | url | date | image | long_text',
            scope: 'list | detail',
            description: '字段说明',
            selector: 'CSS selector',
            attribute: 'href | src | datetime | 空字符串',
          },
        ],
      },
    })

    response.json(result)
  } catch (error) {
    handleError(response, error)
  }
})

app.post('/api/ai/optimize-extraction', async (request, response) => {
  try {
    assertConfigured()
    const { pageAnalysis, navigation, fields } = request.body || {}
    const result = await callOpenAiJson({
      systemPrompt: [
        '你是 SmartScraper 的提取策略优化器。',
        '你的任务是帮助浏览器模式选择更稳妥的 DOM 抓取策略。',
        '优先推荐 DOM；只有在结构很混乱或字段跨区域不稳定时才考虑 hybrid；不要轻易推荐 vision。',
        'warnings 只保留真正会影响成功率的风险。',
        '返回纯 JSON。',
      ].join('\n'),
      userPayload: {
        task: 'optimize-extraction',
        pageAnalysis: selectPageAnalysis(pageAnalysis),
        navigation: selectNavigation(navigation),
        fields: selectFields(fields),
      },
      schemaHint: {
        strategy: 'dom | hybrid | vision',
        summary: '中文总结',
        warnings: ['中文注意事项'],
      },
    })

    response.json(result)
  } catch (error) {
    handleError(response, error)
  }
})

app.listen(port, () => {
  console.log(`SmartScraper backend running at http://127.0.0.1:${port}`)
})

function isConfigured() {
  return Boolean(openAiBaseUrl) && (Boolean(openAiApiKey) || isLocalOpenAiCompatible(openAiBaseUrl))
}

function assertConfigured() {
  if (!openAiBaseUrl) {
    throw createHttpError(500, '后端未配置 OPENAI_BASE_URL。')
  }

  if (!openAiApiKey && !isLocalOpenAiCompatible(openAiBaseUrl)) {
    throw createHttpError(500, '当前服务不是本地兼容接口，请配置 OPENAI_API_KEY。')
  }
}

async function callOpenAiJson({ systemPrompt, userPayload, schemaHint }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: JSON.stringify(
        {
          outputRules: [
            '只返回一个 JSON 对象',
            '不要输出 markdown',
            '不要补充代码块',
            '字段缺失时返回空字符串或空数组',
          ],
          schemaHint,
          payload: userPayload,
        },
        null,
        2,
      ),
    },
  ]

  const baseRequestBody = {
    model: openAiModel,
    temperature: 0.1,
    messages,
  }

  const primary = await fetchOpenAi({
    body: {
      ...baseRequestBody,
      response_format: { type: 'json_object' },
    },
  })

  const payload =
    primary.ok || !shouldRetryWithoutResponseFormat(primary.payload)
      ? primary.payload
      : (
          await fetchOpenAi({
            body: baseRequestBody,
          })
        ).payload

  const finalOk =
    primary.ok || !shouldRetryWithoutResponseFormat(primary.payload)
      ? primary.ok
      : true

  if (!finalOk) {
    throw createHttpError(primary.status, extractOpenAiMessage(primary.payload))
  }

  const content = extractMessageContent(payload)
  if (!content) {
    throw createHttpError(502, '模型返回为空。')
  }

  const parsed = safeJsonParse(content)
  if (!parsed) {
    throw createHttpError(502, '模型返回的 JSON 无法解析。')
  }

  return parsed
}

async function fetchOpenAi({ body }) {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (openAiApiKey) {
    headers.Authorization = `Bearer ${openAiApiKey}`
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)

  try {
    const result = await fetch(`${openAiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    const payload = await result.json().catch(() => ({}))
    return {
      ok: result.ok,
      status: result.status,
      payload,
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw createHttpError(504, '模型调用超时，请稍后重试。')
    }
    throw createHttpError(502, `模型调用失败: ${error?.message || '网络错误'}`)
  } finally {
    clearTimeout(timeout)
  }
}

function shouldRetryWithoutResponseFormat(payload) {
  const message = extractOpenAiMessage(payload).toLowerCase()
  return (
    message.includes('response_format') ||
    message.includes('json_object') ||
    message.includes('unsupported') ||
    message.includes('not support')
  )
}

function extractMessageContent(payload) {
  const content = payload?.choices?.[0]?.message?.content
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item === 'string' ? item : item?.text || ''))
      .join('')
      .trim()
  }

  return ''
}

function safeJsonParse(input) {
  try {
    return JSON.parse(input)
  } catch {
    const matched = String(input || '').match(/\{[\s\S]*\}/)
    if (!matched) return null
    try {
      return JSON.parse(matched[0])
    } catch {
      return null
    }
  }
}

function extractOpenAiMessage(payload) {
  return payload?.error?.message || payload?.message || '模型调用失败。'
}

function createHttpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function handleError(response, error) {
  const status = error?.status || 500
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '服务器错误。'
  response.status(status).json({ error: message })
}

function normalizeBaseUrl(input) {
  const value = String(input || '').trim().replace(/\/+$/, '')
  if (!value) return ''
  return /\/v1$/i.test(value) ? value : `${value}/v1`
}

function isLocalOpenAiCompatible(baseUrl) {
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/v1$/i.test(baseUrl)
}

function selectPageSnapshot(pageSnapshot) {
  if (!pageSnapshot || typeof pageSnapshot !== 'object') {
    return null
  }

  return {
    title: trimText(pageSnapshot.title, 160),
    url: trimText(pageSnapshot.url, 240),
    pageType: pageSnapshot.pageType || '',
    summary: trimText(pageSnapshot.summary, 400),
    suggestedContainerSelector: trimText(pageSnapshot.suggestedContainerSelector, 180),
    suggestedItemSelector: trimText(pageSnapshot.suggestedItemSelector, 180),
    suggestedDetailLinkSelector: trimText(pageSnapshot.suggestedDetailLinkSelector, 180),
    detailUrlFieldKey: trimText(pageSnapshot.detailUrlFieldKey, 80),
    containerCandidates: limitArray(pageSnapshot.containerCandidates, 5).map((item) => ({
      selector: trimText(item.selector, 180),
      itemSelector: trimText(item.itemSelector, 180),
      itemCount: Number(item.itemCount || 0),
      confidence: normalizeConfidence(item.confidence),
    })),
    paginationCandidates: limitArray(pageSnapshot.paginationCandidates, 5).map((item) => ({
      label: trimText(item.label, 80),
      selector: trimText(item.selector, 180),
      anchorText: trimText(item.anchorText, 80),
      confidence: normalizeConfidence(item.confidence),
    })),
    itemSamples: limitArray(pageSnapshot.itemSamples, 6).map((item) => ({
      selector: trimText(item.selector, 180),
      textPreview: trimText(item.textPreview, 240),
      links: limitArray(item.links, 3).map((link) => ({
        text: trimText(link.text, 80),
        href: trimText(link.href, 240),
        selector: trimText(link.selector, 180),
      })),
    })),
  }
}

function selectPageAnalysis(pageAnalysis) {
  if (!pageAnalysis || typeof pageAnalysis !== 'object') {
    return null
  }

  return {
    pageType: pageAnalysis.pageType || '',
    title: trimText(pageAnalysis.title, 160),
    url: trimText(pageAnalysis.url, 240),
    summary: trimText(pageAnalysis.summary, 400),
    strategySource: pageAnalysis.strategySource || '',
    suggestedContainerSelector: trimText(pageAnalysis.suggestedContainerSelector, 180),
    suggestedItemSelector: trimText(pageAnalysis.suggestedItemSelector, 180),
    suggestedDetailLinkSelector: trimText(pageAnalysis.suggestedDetailLinkSelector, 180),
    detailUrlFieldKey: trimText(pageAnalysis.detailUrlFieldKey, 80),
    containerCandidates: limitArray(pageAnalysis.containerCandidates, 5).map((item) => ({
      selector: trimText(item.selector, 180),
      itemSelector: trimText(item.itemSelector, 180),
      itemCount: Number(item.itemCount || 0),
      confidence: normalizeConfidence(item.confidence),
    })),
    paginationCandidates: limitArray(pageAnalysis.paginationCandidates, 5).map((item) => ({
      label: trimText(item.label, 80),
      selector: trimText(item.selector, 180),
      confidence: normalizeConfidence(item.confidence),
    })),
    itemSamples: limitArray(pageAnalysis.itemSamples, 4).map((item) => ({
      textPreview: trimText(item.textPreview, 200),
      links: limitArray(item.links, 2).map((link) => ({
        text: trimText(link.text, 80),
        href: trimText(link.href, 220),
      })),
    })),
  }
}

function selectNavigation(navigation) {
  if (!navigation || typeof navigation !== 'object') {
    return null
  }

  return {
    mode: navigation.mode || '',
    status: navigation.status || '',
    recommendedMode: navigation.recommendedMode || '',
    detectionSummary: trimText(navigation.detectionSummary, 280),
    recommendedSelector: trimText(navigation.recommendedSelector, 180),
    strategySource: navigation.strategySource || '',
    clickConfig: navigation.clickConfig
      ? {
          pageLimit: Number(navigation.clickConfig.pageLimit || 0),
          untilLastPage: Boolean(navigation.clickConfig.untilLastPage),
          delayMs: Number(navigation.clickConfig.delayMs || 0),
        }
      : null,
    scrollConfig: navigation.scrollConfig
      ? {
          scrollCount: Number(navigation.scrollConfig.scrollCount || 0),
          intervalMs: Number(navigation.scrollConfig.intervalMs || 0),
        }
      : null,
    targets: limitArray(navigation.targets, 5).map((item) => ({
      label: trimText(item.label, 80),
      selector: trimText(item.selector, 180),
      confidence: normalizeConfidence(item.confidence),
    })),
  }
}

function selectFields(fields) {
  return limitArray(fields, 20).map((field) => ({
    key: trimText(field.key, 80),
    label: trimText(field.label, 80),
    type: field.type || '',
    scope: field.scope || '',
    description: trimText(field.description, 160),
    selector: trimText(field.selector, 180),
    attribute: trimText(field.attribute, 40),
    selectorSource: field.selectorSource || '',
    sampleValue: trimText(field.sampleValue, 160),
  }))
}

function trimText(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function limitArray(value, count) {
  return Array.isArray(value) ? value.slice(0, count) : []
}

function normalizeConfidence(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return 0
  return Math.max(0, Math.min(1, number))
}
