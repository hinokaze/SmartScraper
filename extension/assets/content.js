(function () {
  const ACTIONS = {
    ANALYZE_PAGE: 'SS_ANALYZE_PAGE',
    DETECT_NAVIGATION: 'SS_DETECT_NAVIGATION',
    EXTRACT_LIST_PAGE: 'SS_EXTRACT_LIST_PAGE',
    EXTRACT_DETAIL_PAGE: 'SS_EXTRACT_DETAIL_PAGE',
    PICK_PAGINATION_TARGET: 'SS_PICK_PAGINATION_TARGET',
    CLICK_PAGINATION: 'SS_CLICK_PAGINATION',
    SCROLL_PAGE: 'SS_SCROLL_PAGE',
    WAIT_FOR_PAGE_STABLE: 'SS_WAIT_FOR_PAGE_STABLE',
    SCAN_EMAILS: 'SS_SCAN_EMAILS',
    SCAN_PHONES: 'SS_SCAN_PHONES',
    SCAN_IMAGES: 'SS_SCAN_IMAGES',
  }

  const summarize = (value, maxLength = 220) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength)

  const safeQuerySelector = (root, selector) => {
    if (!selector) return null
    try {
      return root.querySelector(selector)
    } catch {
      return null
    }
  }

  const safeQuerySelectorAll = (root, selector) => {
    if (!selector) return []
    try {
      return Array.from(root.querySelectorAll(selector))
    } catch {
      return []
    }
  }

  const getUniqueSelector = (element) => {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return ''
    if (element.id) return `#${element.id}`

    const parts = []
    let current = element

    while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
      let segment = current.tagName.toLowerCase()
      if (current.classList && current.classList.length) {
        segment += `.${current.classList[0]}`
      } else if (current.parentElement) {
        const siblings = Array.from(current.parentElement.children).filter((child) => child.tagName === current.tagName)
        if (siblings.length > 1) {
          segment += `:nth-of-type(${siblings.indexOf(current) + 1})`
        }
      }
      parts.unshift(segment)
      current = current.parentElement
    }

    return parts.join(' > ')
  }

  const getText = (element) => summarize(element?.innerText || element?.textContent || '')

  const scoreContainer = (element) => {
    const children = Array.from(element.children || [])
    const childCount = children.length
    if (childCount < 3) return null

    const firstTag = children[0]?.tagName || ''
    const repeatedTagCount = children.filter((child) => child.tagName === firstTag).length
    const anchorCount = element.querySelectorAll('a[href]').length
    const score =
      childCount * 2 +
      repeatedTagCount * 4 +
      anchorCount * 3 +
      (/list|feed|grid|cards|posts|items|results|article|product/i.test(`${element.className} ${element.id}`) ? 25 : 0)

    const selector = getUniqueSelector(element)
    if (!selector) return null

    return {
      selector,
      itemSelector: repeatedTagCount >= 2 ? `${selector} > ${children[0].tagName.toLowerCase()}` : undefined,
      itemCount: childCount,
      confidence: Math.min(1, score / 100),
      score,
    }
  }

  const getContainerCandidates = () => {
    const selectors = [
      'main',
      'section',
      'article',
      'ul',
      'ol',
      '[class*="list"]',
      '[class*="feed"]',
      '[class*="grid"]',
      '[class*="result"]',
      '[class*="item"]',
    ]

    const deduped = new Map()
    selectors.forEach((selector) => {
      safeQuerySelectorAll(document, selector).forEach((node) => {
        const candidate = scoreContainer(node)
        if (candidate && !deduped.has(candidate.selector)) {
          deduped.set(candidate.selector, candidate)
        }
      })
    })

    return Array.from(deduped.values())
      .sort((left, right) => right.score - left.score)
      .slice(0, 12)
      .map(({ score, ...rest }) => rest)
  }

  const getPaginationCandidates = () => {
    const nodes = Array.from(document.querySelectorAll('a[href], button'))
    const candidates = nodes
      .map((node) => {
        const text = getText(node).toLowerCase()
        const selector = getUniqueSelector(node)
        if (!selector) return null

        let confidence = 0
        if (/next|下一页|下页|next page/.test(text)) confidence += 0.7
        if (/更多|加载更多|more|load more/.test(text)) confidence += 0.55
        if (/pagination|pager|next|load-more/.test(`${selector} ${node.className || ''}`)) confidence += 0.3
        if (node.getAttribute('rel') === 'next') confidence += 0.25
        if (confidence < 0.35) return null

        return {
          id: selector,
          label: getText(node) || '分页按钮',
          selector,
          anchorText: getText(node),
          confidence: Math.min(0.99, confidence),
        }
      })
      .filter(Boolean)

    return candidates.slice(0, 10)
  }

  const getItemNodes = (container, itemSelector) => {
    if (!container) return []
    if (itemSelector) {
      const selected = safeQuerySelectorAll(container, itemSelector)
      if (selected.length) return selected
    }

    const directChildren = Array.from(container.children || []).filter((child) => getText(child).length > 12)
    if (directChildren.length >= 2) return directChildren

    const descendants = safeQuerySelectorAll(container, 'article, li, div, section')
    const buckets = descendants.reduce((accumulator, element) => {
      const tag = element.tagName
      accumulator[tag] = accumulator[tag] || []
      accumulator[tag].push(element)
      return accumulator
    }, {})

    const dominant = Object.values(buckets).sort((left, right) => right.length - left.length)[0] || []
    return dominant.filter((element) => getText(element).length > 12).slice(0, 40)
  }

  const collectItemSamples = (containerCandidates) => {
    const top = containerCandidates[0]
    const container = top?.selector ? safeQuerySelector(document, top.selector) : null
    const items = getItemNodes(container, top?.itemSelector).slice(0, 5)

    return items.map((item) => ({
      selector: getUniqueSelector(item),
      textPreview: summarize(getText(item), 180),
      links: safeQuerySelectorAll(item, 'a[href]')
        .slice(0, 4)
        .map((link) => ({
          text: getText(link),
          href: link.href,
          selector: getUniqueSelector(link),
        })),
    }))
  }

  const analyzePage = () => {
    const containerCandidates = getContainerCandidates()
    const paginationCandidates = getPaginationCandidates()
    const itemSamples = collectItemSamples(containerCandidates)
    const topContainer = containerCandidates[0]
    const firstSampleLink = itemSamples.flatMap((sample) => sample.links)[0]

    return {
      pageType: itemSamples.length >= 2 ? 'list' : 'detail',
      title: document.title,
      url: window.location.href,
      summary: summarize(document.body?.innerText || '', 1200),
      strategySource: 'manual',
      suggestedContainerSelector: topContainer?.selector,
      suggestedItemSelector: topContainer?.itemSelector,
      suggestedDetailLinkSelector: firstSampleLink?.selector,
      detailUrlFieldKey: 'detailUrl',
      containerCandidates,
      paginationCandidates,
      itemSamples,
    }
  }

  const detectNavigation = () => {
    const paginationCandidates = getPaginationCandidates()
    const canScrollMore = document.body.scrollHeight > window.innerHeight * 2

    if (paginationCandidates.length) {
      return {
        recommendedMode: 'click',
        summary: '检测到稳定的分页按钮，建议使用点击翻页。',
        targets: paginationCandidates,
        recommendedSelector: paginationCandidates[0].selector,
      }
    }

    if (canScrollMore) {
      return {
        recommendedMode: 'scroll',
        summary: '页面内容较长且可能支持滚动加载，建议使用滚动加载。',
        targets: [],
      }
    }

    return {
      recommendedMode: 'none',
      summary: '未检测到稳定分页结构，建议只抓取当前页。',
      targets: [],
    }
  }

  const keywordMatches = (field) => {
    const value = `${field.key} ${field.label} ${field.description || ''}`.toLowerCase()
    return {
      title: /title|标题/.test(value),
      url: /url|链接|网址/.test(value),
      date: /date|时间|日期|发布/.test(value),
      image: /image|封面|图片|logo|缩略图/.test(value),
      content: /content|正文|内容|描述|介绍|摘要/.test(value),
      author: /author|作者/.test(value),
      category: /category|分类|标签/.test(value),
      price: /price|价格/.test(value),
    }
  }

  const findFallbackTarget = (root, field) => {
    const matches = keywordMatches(field)
    if (field.type === 'url' || matches.url) return root.querySelector('a[href]')
    if (field.type === 'image' || matches.image) return root.querySelector('img')
    if (field.type === 'date' || matches.date) {
      return root.querySelector('time, [datetime], [class*="date"], [class*="time"], [data-date]')
    }
    if (matches.title) return root.querySelector('h1, h2, h3, [class*="title"], [class*="headline"]')
    if (matches.author) return root.querySelector('[class*="author"], [rel="author"]')
    if (matches.category) return root.querySelector('[class*="category"], [class*="tag"]')
    if (matches.price) return root.querySelector('[class*="price"]')
    if (field.type === 'long_text' || matches.content) {
      return root.querySelector('article, main, [class*="content"], [class*="article"], [class*="body"], p')
    }
    return root.querySelector('h2, h3, p, span, a, img')
  }

  const extractFieldValue = (root, field) => {
    const target = field.selector ? safeQuerySelector(root, field.selector) : findFallbackTarget(root, field)
    if (!target) return null

    if (field.attribute) return target.getAttribute(field.attribute)
    if (field.type === 'url') return target.href || target.getAttribute('href') || null
    if (field.type === 'image') return target.currentSrc || target.src || target.getAttribute('src') || null
    if (field.type === 'date') return target.getAttribute('datetime') || target.getAttribute('content') || getText(target)
    if (field.type === 'long_text') return summarize(target.innerText || target.textContent || '', 4000)
    return summarize(target.innerText || target.textContent || '', 320)
  }

  const extractListPage = (payload) => {
    const listFields = (payload?.fields || []).filter((field) => field.scope === 'list')
    const analysis = analyzePage()
    const containerSelector = payload?.containerSelector || analysis.suggestedContainerSelector
    const itemSelector = payload?.itemSelector || analysis.suggestedItemSelector
    const container = containerSelector ? safeQuerySelector(document, containerSelector) : null
    if (!container) throw new Error('未找到可用的列表容器。')

    const items = getItemNodes(container, itemSelector)
    const maxItems = Number(payload?.maxItems || 30)
    const rows = items.slice(0, maxItems).map((item, index) => {
      const row = { _index: index, _selector: getUniqueSelector(item) }
      listFields.forEach((field) => {
        row[field.key] = extractFieldValue(item, field)
      })
      return row
    })

    return { rows, analysis }
  }

  const extractDetailPage = (payload) => {
    const fields = (payload?.fields || []).filter((field) => field.scope === 'detail')
    const row = {}
    fields.forEach((field) => {
      row[field.key] = extractFieldValue(document, field)
    })
    return row
  }

  const waitForPageStable = (timeout = 15000) =>
    new Promise((resolve, reject) => {
      const startedAt = Date.now()
      let stableTicks = 0
      let lastHtmlLength = document.body?.innerHTML.length || 0

      const timer = window.setInterval(() => {
        const currentHtmlLength = document.body?.innerHTML.length || 0
        if (currentHtmlLength === lastHtmlLength) {
          stableTicks += 1
        } else {
          stableTicks = 0
          lastHtmlLength = currentHtmlLength
        }

        if (stableTicks >= 4) {
          window.clearInterval(timer)
          resolve(true)
          return
        }

        if (Date.now() - startedAt > timeout) {
          window.clearInterval(timer)
          reject(new Error('等待页面稳定超时。'))
        }
      }, 300)
    })

  const clickPagination = async (payload) => {
    const target = payload?.selector ? safeQuerySelector(document, payload.selector) : null
    if (!target) throw new Error('未找到分页目标元素。')
    target.scrollIntoView({ block: 'center', behavior: 'instant' })
    target.click()
    await waitForPageStable(Number(payload?.delayMs || 15000))
    return { clicked: true }
  }

  const scrollPage = async (payload) => {
    const iterations = Math.max(1, Number(payload?.iterations || 1))
    const intervalMs = Math.max(300, Number(payload?.intervalMs || 1000))
    for (let index = 0; index < iterations; index += 1) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      await new Promise((resolve) => window.setTimeout(resolve, intervalMs))
    }
    await waitForPageStable(Math.max(2000, intervalMs * 2))
    return { scrolled: true }
  }

  const scanEmails = () => {
    const matches = new Set()
    const regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
    const text = document.body?.innerText || ''
    Array.from(text.matchAll(regex)).forEach((match) => matches.add(match[0]))
    document.querySelectorAll('a[href^="mailto:"]').forEach((node) => matches.add((node.getAttribute('href') || '').replace(/^mailto:/i, '')))
    return Array.from(matches).filter(Boolean).map((value) => ({ value }))
  }

  const scanPhones = () => {
    const matches = new Set()
    const regex = /(?:\+?\d[\d\s\-()]{6,}\d)/g
    const text = document.body?.innerText || ''
    Array.from(text.matchAll(regex)).forEach((match) => matches.add(match[0].replace(/\s+/g, ' ').trim()))
    document.querySelectorAll('a[href^="tel:"]').forEach((node) => matches.add((node.getAttribute('href') || '').replace(/^tel:/i, '')))
    return Array.from(matches)
      .filter((value) => String(value).replace(/\D/g, '').length >= 7)
      .map((value) => ({ value }))
  }

  const scanImages = () =>
    Array.from(document.querySelectorAll('img'))
      .map((image) => {
        const width = image.naturalWidth || image.width || 0
        const height = image.naturalHeight || image.height || 0
        let group = '缩略图'
        if (width >= 280 || height >= 180) group = '大图'
        else if (width >= 140 || height >= 120) group = '中图'

        return {
          id: `${width}-${height}-${Math.random().toString(36).slice(2, 7)}`,
          src: image.currentSrc || image.src,
          width,
          height,
          group,
        }
      })
      .filter((item) => item.src)

  const pickPaginationTarget = () =>
    new Promise((resolve) => {
      const overlay = document.createElement('div')
      const badge = document.createElement('div')
      overlay.style.position = 'fixed'
      overlay.style.zIndex = '2147483646'
      overlay.style.pointerEvents = 'none'
      overlay.style.border = '2px solid #ffb84d'
      overlay.style.borderRadius = '8px'
      overlay.style.display = 'none'
      badge.style.position = 'fixed'
      badge.style.top = '16px'
      badge.style.right = '16px'
      badge.style.zIndex = '2147483647'
      badge.style.padding = '10px 12px'
      badge.style.borderRadius = '999px'
      badge.style.background = 'rgba(10, 13, 19, 0.92)'
      badge.style.color = '#fff'
      badge.style.font = '600 12px/1.4 Segoe UI, sans-serif'
      badge.textContent = '点击网页中的“下一页”元素，按 Esc 取消'

      const cleanup = () => {
        overlay.remove()
        badge.remove()
        document.removeEventListener('mousemove', onMove, true)
        document.removeEventListener('click', onClick, true)
        document.removeEventListener('keydown', onKeyDown, true)
      }

      const onMove = (event) => {
        const target = event.target
        if (!(target instanceof Element)) return
        const rect = target.getBoundingClientRect()
        overlay.style.display = 'block'
        overlay.style.left = `${rect.left + window.scrollX}px`
        overlay.style.top = `${rect.top + window.scrollY}px`
        overlay.style.width = `${rect.width}px`
        overlay.style.height = `${rect.height}px`
      }

      const onClick = (event) => {
        const target = event.target
        if (!(target instanceof Element)) return
        event.preventDefault()
        event.stopPropagation()
        cleanup()
        resolve({
          selector: getUniqueSelector(target),
          label: getText(target) || '下一页按钮',
          anchorText: getText(target),
        })
      }

      const onKeyDown = (event) => {
        if (event.key !== 'Escape') return
        cleanup()
        resolve(null)
      }

      document.body.appendChild(overlay)
      document.body.appendChild(badge)
      document.addEventListener('mousemove', onMove, true)
      document.addEventListener('click', onClick, true)
      document.addEventListener('keydown', onKeyDown, true)
    })

  const handleMessage = async (message) => {
    switch (message?.action) {
      case ACTIONS.ANALYZE_PAGE:
        return analyzePage()
      case ACTIONS.DETECT_NAVIGATION:
        return detectNavigation()
      case ACTIONS.EXTRACT_LIST_PAGE:
        return extractListPage(message.payload)
      case ACTIONS.EXTRACT_DETAIL_PAGE:
        return extractDetailPage(message.payload)
      case ACTIONS.PICK_PAGINATION_TARGET:
        return pickPaginationTarget()
      case ACTIONS.CLICK_PAGINATION:
        return clickPagination(message.payload)
      case ACTIONS.SCROLL_PAGE:
        return scrollPage(message.payload)
      case ACTIONS.WAIT_FOR_PAGE_STABLE:
        await waitForPageStable(message.payload?.timeout)
        return { ok: true }
      case ACTIONS.SCAN_EMAILS:
        return scanEmails()
      case ACTIONS.SCAN_PHONES:
        return scanPhones()
      case ACTIONS.SCAN_IMAGES:
        return scanImages()
      default:
        throw new Error(`未知消息类型：${message?.action}`)
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    Promise.resolve(handleMessage(message))
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error?.message || '内容脚本执行失败。' }))
    return true
  })
})()
