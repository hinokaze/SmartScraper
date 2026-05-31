<p align="center">
  <img src="extension/assets/icon.svg" alt="SmartScraper" width="80" />
</p>

<h1 align="center">SmartScraper</h1>

<p align="center">
  <b>AI-Powered Web Scraping, Right Inside Your Browser.</b><br/>
  <b>AI 驱动的智能数据采集，直接在浏览器侧边栏完成。</b>
</p>

<p align="center">
  <a href="#english">English</a> ·
  <a href="#中文">中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension%20Manifest%20V3-blue?logo=googlechrome" alt="Chrome MV3" />
  <img src="https://img.shields.io/badge/React-18-%2361DAFB?logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/LLM-OpenAI%20Compatible-10a37f?logo=openai" alt="OpenAI Compatible" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License: MIT" />
</p>

---

## English

### Why SmartScraper

Traditional web scraping requires writing selectors, maintaining brittle scripts, and handling pagination manually. **SmartScraper flips that workflow** — point it at any page, and let AI do the heavy lifting.

- **Intelligent Page Analysis** — Heuristic DOM scoring combined with LLM-based page classification (list / detail / mixed)
- **Auto Field Recommendation** — AI generates structured extraction templates with CSS selectors, labels, and types
- **Smart Pagination** — Automatically detects click-to-next, infinite scroll, or static pages
- **Detail Page Crawling** — Opens detail links in background tabs, extracts and merges results seamlessly
- **Extraction Strategy Optimization** — AI recommends DOM / Hybrid / Vision mode based on page complexity
- **Real-time Task Orchestration** — Background service worker with progress broadcast, state persistence, and abort control

### Core Workflow

| Step | Action | What Happens |
|------|--------|-------------|
| 1 | **Select Source** | Choose current page, paste URLs, or upload files |
| 2 | **Configure Navigation** | AI auto-detects pagination (click / scroll / none) |
| 3 | **Set Up Template** | AI recommends fields with CSS selectors & types |
| 4 | **Discover Detail Fields** | Opens sample detail URLs to confirm extraction targets |
| 5 | **Optimize Extraction** | AI selects DOM / Hybrid / Vision strategy |
| 6 | **Choose Runtime** | Browser mode (fully implemented) or Cloud (roadmap) |
| 7 | **Run Task** | Real-time progress with pause / abort support |
| 8 | **Export Results** | Paginated table view → CSV export or clipboard copy |

### Built-in Tools

Beyond the main scraping wizard, SmartScraper ships standalone extractors:

| Tool | Description |
|------|-------------|
| **Email Extractor** | Scans `mailto:` links + regex pattern matching across the page |
| **Phone Extractor** | Scans `tel:` links + pattern matching (7+ digit numbers) |
| **Image Extractor** | Collects all `<img>` elements, groups by size (thumbnail / medium / large) |
| **Scheduled Tasks** | Task scheduling interface *(UI ready, backend integration in progress)* |

### Template Presets

Five ready-to-use extraction templates:

- **Blog List** — title, URL, date, cover image, category + detail: content, author
- **Article List** — title, URL, summary, date + detail: author, full content
- **Product List** — name, URL, price, image + detail: description
- **Minimal** — title, URL + detail: content
- **Generic List** — name, URL, metadata

### Getting Started

**Prerequisites:** Node.js 18+, Chrome 102+, any OpenAI-compatible LLM API

**1. Start the AI Backend**

```bash
cd backend
cp .env.example .env
# Configure .env:
#   OPENAI_API_KEY=          (leave blank for local servers)
#   OPENAI_MODEL=qwen/qwen3.5-9b
#   OPENAI_BASE_URL=http://127.0.0.1:1234/v1
npm install && npm start    # Runs on http://127.0.0.1:3000
```

**2. Build the Extension**

```bash
cd extension
npm install && npm run build
```

**3. Load in Chrome**

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `extension/dist/`
4. Open the SmartScraper side panel from the toolbar

---

## 中文

### 为什么选择 SmartScraper

传统网页抓取需要手写选择器、维护脆弱的脚本、手动处理翻页。**SmartScraper 颠覆了这一流程** —— 指向任意页面，让 AI 承担繁重的工作。

- **智能页面分析** —— 启发式 DOM 评分 + LLM 页面分类（列表页 / 详情页 / 混合页）
- **AI 字段推荐** —— 自动生成包含 CSS 选择器、标签和类型的结构化提取模板
- **智能翻页检测** —— 自动识别点击翻页、无限滚动和静态页面
- **详情页爬取** —— 在后台标签页打开详情链接，自动提取并合并结果
- **提取策略优化** —— AI 根据页面复杂度推荐 DOM / 混合 / 视觉模式
- **实时任务编排** —— 后台 Service Worker 支持进度广播、状态持久化和中断控制

### 核心工作流

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | **选择数据源** | 当前页面、粘贴链接或上传文件 |
| 2 | **配置导航方式** | AI 自动检测翻页模式（点击/滚动/无翻页） |
| 3 | **配置模板与字段** | AI 推荐字段，含 CSS 选择器和类型 |
| 4 | **发现详情页字段** | 打开样例详情页，确认提取目标 |
| 5 | **优化提取模式** | AI 选择 DOM / 混合 / 视觉策略 |
| 6 | **选择运行环境** | 浏览器模式（已实现）或云端（规划中） |
| 7 | **运行任务** | 实时进度，支持暂停/中止 |
| 8 | **导出结果** | 分页表格 → CSV 导出或复制到剪贴板 |

### 内置工具

除主爬虫向导外，SmartScraper 还提供独立提取工具：

| 工具 | 说明 |
|------|------|
| **邮箱提取** | 扫描 `mailto:` 链接 + 正则匹配页面中的邮箱地址 |
| **电话提取** | 扫描 `tel:` 链接 + 正则匹配（7位以上数字） |
| **图片提取** | 收集所有 `<img>` 元素，按尺寸分组（缩略图/中等/大图） |
| **定时任务** | 任务调度界面 *（UI 就绪，后端集成中）* |

### 模板预设

五种开箱即用的提取模板：

- **博客列表** —— 标题、链接、日期、封面图、分类 + 详情：正文、作者
- **文章列表** —— 标题、链接、摘要、日期 + 详情：作者、全文内容
- **商品列表** —— 名称、链接、价格、图片 + 详情：描述
- **极简模板** —— 标题、链接 + 详情：正文
- **通用列表** —— 名称、链接、元信息

### 快速开始

**环境要求：** Node.js 18+、Chrome 102+、任意 OpenAI 兼容的 LLM API

**1. 启动 AI 后端**

```bash
cd backend
cp .env.example .env
# 配置 .env:
#   OPENAI_API_KEY=          （本地服务器留空）
#   OPENAI_MODEL=qwen/qwen3.5-9b
#   OPENAI_BASE_URL=http://127.0.0.1:1234/v1
npm install && npm start    # 运行在 http://127.0.0.1:3000
```

**2. 构建扩展**

```bash
cd extension
npm install && npm run build
```

**3. 加载到 Chrome**

1. 打开 `chrome://extensions/`
2. 开启 **开发者模式**
3. 点击 **加载已解压的扩展程序** → 选择 `extension/dist/` 目录
4. 从工具栏打开 SmartScraper 侧边栏

---

## Architecture / 架构

```
┌─────────────────────────────────────────────────────┐
│                   Chrome Browser                     │
│                                                      │
│  ┌──────────────────────────────────┐               │
│  │       Side Panel (React UI)      │               │
│  │  ┌───────────┐  ┌─────────────┐ │               │
│  │  │  Wizard    │  │ Tool Pages  │ │               │
│  │  │  Flow      │  │ Email/Phone │ │               │
│  │  │  (8 steps) │  │ /Image      │ │               │
│  │  └─────┬─────┘  └──────┬──────┘ │               │
│  │        │               │        │               │
│  │  ┌─────┴───────────────┴──────┐ │               │
│  │  │   Zustand Store (persist)  │ │               │
│  │  └────────────┬───────────────┘ │               │
│  └───────────────┼─────────────────┘               │
│                  │                                   │
│  ┌───────────────▼───────────────┐                  │
│  │   Background (Service Worker) │                  │
│  │   Task lifecycle · State I/O  │                  │
│  └───────────────┬───────────────┘                  │
│                  │                                   │
│  ┌───────────────▼───────────────┐                  │
│  │   Content Script (per page)   │                  │
│  │   DOM analysis · Extraction   │                  │
│  │   Pagination · Scanning       │                  │
│  └───────────────┬───────────────┘                  │
└──────────────────┼──────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────┐
│     Backend (Express · Node.js)  │
│                                  │
│  POST /api/ai/analyze-page       │
│  POST /api/ai/recommend-fields   │
│  POST /api/ai/optimize-extraction│
│  GET  /health                    │
│          ▼                       │
│   OpenAI-compatible LLM API      │
│   (local or remote)              │
└──────────────────────────────────┘
```

## Tech Stack / 技术栈

| Layer / 层级 | Stack / 技术 |
|-------|-------|
| **Extension UI** | React 18 · TypeScript · Vite 5 · Zustand 5 |
| **Extension Platform** | Chrome Manifest V3 · Side Panel API · Service Workers |
| **Backend** | Node.js · Express 4 · OpenAI SDK |
| **Export** | SheetJS (xlsx) · CSV · Clipboard API |
| **i18n** | Chrome `_locales` (中文 / English) |

## Roadmap / 路线图

- [x] Current page analysis & field extraction / 当前页面分析与字段提取
- [x] AI-powered pagination detection / AI 智能翻页检测
- [x] List + detail page crawling / 列表页 + 详情页爬取
- [x] Real-time task progress & state recovery / 实时任务进度与状态恢复
- [x] CSV export & clipboard copy / CSV 导出与剪贴板复制
- [ ] Paste-URL batch source mode / 粘贴链接批量数据源
- [ ] Cloud runtime execution / 云端运行环境
- [ ] Scheduled task persistence / 定时任务持久化
- [ ] Vision-based extraction strategy / 视觉提取策略
- [ ] Plugin / custom extractor API / 插件 / 自定义提取器 API

## License / 开源协议

[MIT](LICENSE)

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/hinokaze">hinokaze</a>
</p>
