import type { PageContext, TemplateField, TemplatePreset } from '../types'

const createField = (
  id: string,
  label: string,
  type: TemplateField['type'],
  scope: TemplateField['scope'],
  description?: string,
): TemplateField => ({
  id,
  key: id,
  label,
  type,
  scope,
  description,
  required: true,
  selectorSource: 'manual',
})

export const templatePresets: TemplatePreset[] = [
  {
    id: 'blog-list',
    name: '博客文章列表页',
    description: '适用于资讯、博客、媒体列表页，包含列表字段与详情页正文。',
    fields: [
      createField('title', '文章标题', 'text', 'list'),
      createField('detailUrl', '文章链接', 'url', 'list'),
      createField('publishDate', '发布日期', 'date', 'list'),
      createField('coverImage', '文章图片', 'image', 'list'),
      createField('category', '文章分类', 'text', 'list'),
      createField('content', '文章内容', 'long_text', 'detail'),
      createField('author', '作者', 'text', 'detail'),
    ],
  },
  {
    id: 'article-list',
    name: '文章列表页',
    description: '适合摘要式文章列表，默认包含作者和正文补抓字段。',
    fields: [
      createField('title', '标题', 'text', 'list'),
      createField('detailUrl', '详情链接', 'url', 'list'),
      createField('summary', '摘要', 'long_text', 'list'),
      createField('publishDate', '发布日期', 'date', 'list'),
      createField('author', '作者', 'text', 'detail'),
      createField('content', '正文', 'long_text', 'detail'),
    ],
  },
  {
    id: 'product-list',
    name: '产品列表页',
    description: '适用于商品卡片列表，包含价格、图片和详情描述。',
    fields: [
      createField('productName', '产品名称', 'text', 'list'),
      createField('detailUrl', '产品链接', 'url', 'list'),
      createField('price', '价格', 'text', 'list'),
      createField('coverImage', '产品图片', 'image', 'list'),
      createField('description', '详情描述', 'long_text', 'detail'),
    ],
  },
  {
    id: 'custom-1',
    name: '自定义 Scraper 1',
    description: '从空白基础字段开始，适合快速调整为业务模板。',
    fields: [
      createField('title', '标题', 'text', 'list'),
      createField('detailUrl', '详情链接', 'url', 'list'),
      createField('content', '正文', 'long_text', 'detail'),
    ],
  },
  {
    id: 'custom-2',
    name: '自定义 Scraper 2',
    description: '偏向列表页信息采集的通用模板。',
    fields: [
      createField('name', '名称', 'text', 'list'),
      createField('detailUrl', '链接', 'url', 'list'),
      createField('meta', '附加信息', 'text', 'list'),
    ],
  },
]

export const createEmptyTemplate = () => ({
  id: 'template-draft',
  entryMode: 'new' as const,
  name: '新建抓取模板',
  description: '通过 AI 推荐字段，或手动维护字段列表。',
  fields: [
    createField('title', '标题', 'text', 'list'),
    createField('detailUrl', '详情链接', 'url', 'list'),
    createField('publishDate', '发布日期', 'date', 'list'),
  ],
  recommendedFields: [] as TemplateField[],
  aiRecommendationStatus: 'idle' as const,
})

export const createRecommendedFields = (page: PageContext): TemplateField[] => {
  if (/product|shop|store/i.test(`${page.title} ${page.url}`)) {
    return [
      createField('productName', '产品名称', 'text', 'list'),
      createField('detailUrl', '产品链接', 'url', 'list'),
      createField('price', '价格', 'text', 'list'),
      createField('coverImage', '产品图片', 'image', 'list'),
      createField('description', '详情描述', 'long_text', 'detail'),
    ]
  }

  return [
    createField('title', '文章标题', 'text', 'list'),
    createField('detailUrl', '文章链接', 'url', 'list'),
    createField('publishDate', '发布日期', 'date', 'list'),
    createField('coverImage', '文章图片', 'image', 'list'),
    createField('content', '文章内容', 'long_text', 'detail'),
    createField('author', '作者', 'text', 'detail'),
  ]
}

export const cloneFields = (fields: TemplateField[]): TemplateField[] => fields.map((field) => ({ ...field }))
