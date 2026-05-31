import type { CrawlerPhase } from '../types'

export const copy = {
  appName: 'SmartScraper',
  phaseMeta: {
    source: {
      step: 1,
      title: '选择数据来源',
      description: '从当前页面、粘贴链接或文件图片中选择抓取入口。',
    },
    navigation: {
      step: 2,
      title: '设置页面导航方式',
      description: '决定页面如何被遍历，包括不翻页、点击翻页和滚动加载。',
    },
    template: {
      step: 3,
      title: '配置模板与字段',
      description: '定义输出字段、字段来源，以及是否需要详情页补抓。',
    },
    detail_field_discovery: {
      step: 3,
      title: '识别详情页字段',
      description: '打开样本详情页，帮助您补齐详情字段的提取方案。',
    },
    detail_field_ready: {
      step: 3,
      title: '确认详情页字段',
      description: '样本字段已回填，请确认列表页与详情页联动模板。',
    },
    detail_field_confirmed: {
      step: 3,
      title: '详情页补抓已确认',
      description: '系统会在正式运行时按需打开详情页补齐字段。',
    },
    optimizing: {
      step: 3,
      title: '优化提取模式',
      description: '再次检查当前网站，选择更可靠的提取策略。',
    },
    runtime_mode_select: {
      step: 3,
      title: '选择执行环境',
      description: '本轮仅开放浏览器模式真实运行，云端模式即将支持。',
    },
    task_running: {
      step: 3,
      title: '任务运行中',
      description: '正在抓取页面、补抓详情字段并合并结构化结果。',
    },
    result: {
      step: 3,
      title: '查看抓取结果',
      description: '以表格查看结果，支持复制、下载和继续调整模板。',
    },
  } satisfies Record<CrawlerPhase, { step: number; title: string; description: string }>,
  runtime: {
    browser: '浏览器模式',
    cloud: '云端模式',
    cloudComingSoon: '即将支持',
  },
  common: {
    next: '下一步',
    back: '上一步',
    backToTemplate: '返回模板',
    editTemplate: '继续编辑模板',
    toolPage: '独立工具页',
  },
} as const
