import type { ReactNode } from 'react'
import type { PageContext, SidebarView } from '../../types'

type SidebarShellProps = {
  activeView: SidebarView
  currentPage: PageContext
  onSelectView: (view: SidebarView) => void
  children: ReactNode
}

const navItems: Array<{ id: SidebarView; label: string; caption: string; icon: string }> = [
  { id: 'crawler', label: '主流程', caption: 'AI 爬虫', icon: '采' },
  { id: 'schedule', label: '定时', caption: '任务', icon: '时' },
  { id: 'email', label: '邮箱', caption: '提取', icon: '邮' },
  { id: 'phone', label: '电话', caption: '提取', icon: '电' },
  { id: 'image', label: '图片', caption: '提取', icon: '图' },
]

export default function SidebarShell({
  activeView,
  currentPage,
  onSelectView,
  children,
}: SidebarShellProps) {
  return (
    <div className="ss-shell">
      <main className="ss-main">{children}</main>

      <aside className="ss-rail" aria-label="侧边工具栏">
        <div className="ss-brand">
          <div className="ss-brand__mark">SS</div>
          <div className="ss-brand__stack">
            <div className="ss-brand__title">SmartScraper</div>
            <div className="ss-brand__subtitle">Browser Agent</div>
          </div>
        </div>

        <div className="ss-page-chip">
          <div className="ss-page-chip__label">当前站点</div>
          <div className="ss-page-chip__title" title={currentPage.title}>
            {currentPage.title}
          </div>
          <div className="ss-page-chip__url" title={currentPage.hostname}>
            {currentPage.hostname}
          </div>
        </div>

        <nav className="ss-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ss-nav__item ${item.id === activeView ? 'is-active' : ''}`}
              onClick={() => onSelectView(item.id)}
            >
              <span className="ss-nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="ss-nav__label">{item.label}</span>
              <small>{item.caption}</small>
            </button>
          ))}
        </nav>
      </aside>
    </div>
  )
}
