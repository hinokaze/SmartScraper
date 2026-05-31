<p align="center">
  <img src="extension/assets/icon.svg" alt="SmartScraper" width="80" />
</p>

<h1 align="center">SmartScraper</h1>

<p align="center">
  <b>AI-Powered Web Scraping, Right Inside Your Browser.</b>
</p>

<p align="center">
  A Chrome Extension that lives in your side panel — powered by LLMs to analyze pages,
  recommend extraction fields, and orchestrate multi-page crawling automatically.
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

## Why SmartScraper

Traditional web scraping requires writing selectors, maintaining brittle scripts, and handling pagination manually. **SmartScraper flips that workflow** — point it at any page, and let AI do the heavy lifting:

- **Intelligent Page Analysis** — Heuristic DOM scoring combined with LLM-based page classification (list / detail / mixed)
- **Auto Field Recommendation** — AI generates structured extraction templates with CSS selectors, labels, and types
- **Smart Pagination** — Automatically detects click-to-next, infinite scroll, or static pages
- **Detail Page Crawling** — Opens detail links in background tabs, extracts and merges results seamlessly
- **Extraction Strategy Optimization** — AI recommends DOM / Hybrid / Vision mode based on page complexity
- **Real-time Task Orchestration** — Background service worker with progress broadcast, state persistence, and abort control

## Architecture

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
│                                  │
│          ▼                       │
│   OpenAI-compatible LLM API      │
│   (local or remote)              │
└──────────────────────────────────┘
```

## Core Workflow

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

## Built-in Tools

Beyond the main scraping wizard, SmartScraper ships standalone extractors:

| Tool | Description |
|------|-------------|
| **Email Extractor** | Scans `mailto:` links + regex pattern matching across the page |
| **Phone Extractor** | Scans `tel:` links + pattern matching (7+ digit numbers) |
| **Image Extractor** | Collects all `<img>` elements, groups by size (thumbnail / medium / large) |
| **Scheduled Tasks** | Task scheduling interface *(UI ready, backend integration in progress)* |

## Template Presets

Five ready-to-use extraction templates:

- **Blog List** — title, URL, date, cover image, category + detail: content, author
- **Article List** — title, URL, summary, date + detail: author, full content
- **Product List** — name, URL, price, image + detail: description
- **Minimal** — title, URL + detail: content
- **Generic List** — name, URL, metadata

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Chrome** 102+ (for Side Panel API)
- **LLM API** — Any OpenAI-compatible endpoint (e.g. [LM Studio](https://lmstudio.ai/), [Ollama](https://ollama.com/), or OpenAI)

### 1. Start the AI Backend

```bash
cd backend
cp .env.example .env
```

Configure `.env`:

```env
OPENAI_API_KEY=          # Leave blank for local servers
OPENAI_MODEL=qwen/qwen3.5-9b
OPENAI_BASE_URL=http://127.0.0.1:1234/v1
```

```bash
npm install
npm start                # Runs on http://127.0.0.1:3000
```

### 2. Build the Extension

```bash
cd extension
npm install
npm run build
```

### 3. Load in Chrome

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `extension/dist/`
4. Open the SmartScraper side panel from the toolbar

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Extension UI** | React 18 · TypeScript · Vite 5 · Zustand 5 |
| **Extension Platform** | Chrome Manifest V3 · Side Panel API · Service Workers |
| **Backend** | Node.js · Express 4 · OpenAI SDK |
| **Export** | SheetJS (xlsx) · CSV · Clipboard API |
| **i18n** | Chrome `_locales` (中文 / English) |

## Project Structure

```
SmartScraper/
├── extension/
│   ├── src/
│   │   ├── App.tsx                         # Main entry: wizard + tool pages
│   │   ├── components/
│   │   │   ├── layout/                     # SidebarShell, WizardShell
│   │   │   ├── modals/                     # Extraction optimization, runtime selector
│   │   │   ├── panels/                     # TaskRunnerPanel
│   │   │   ├── results/                    # ResultTable + export
│   │   │   ├── steps/                      # Wizard step components
│   │   │   └── tools/                      # Email, Phone, Image extractors
│   │   ├── store/useSidebarStore.ts        # Zustand state (persisted)
│   │   ├── services/                       # AI, backend API, browser runtime bridge
│   │   ├── data/                           # UI copy, template presets
│   │   ├── types/                          # TypeScript definitions
│   │   └── utils/                          # Export, file import, formatting
│   ├── assets/
│   │   ├── background.js                   # Service worker: task orchestration
│   │   └── content.js                      # Content script: DOM analysis & extraction
│   ├── _locales/                           # i18n (zh_CN, en)
│   ├── manifest.json                       # Chrome Extension Manifest V3
│   └── vite.config.js
├── backend/
│   └── src/index.js                        # Express LLM proxy (4 endpoints)
└── README.md
```

## Roadmap

- [x] Current page analysis & field extraction
- [x] AI-powered pagination detection
- [x] List + detail page crawling
- [x] Real-time task progress & state recovery
- [x] CSV export & clipboard copy
- [ ] Paste-URL batch source mode
- [ ] Cloud runtime execution
- [ ] Scheduled task persistence
- [ ] Vision-based extraction strategy
- [ ] Plugin / custom extractor API

## License

[MIT](LICENSE)

---

<p align="center">
  Built with ❤️ by the SmartScraper Team
</p>
