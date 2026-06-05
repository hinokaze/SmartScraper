import type { ReactNode } from 'react'
import type { PageContext, SidebarView } from '../../types'

type TopBarShellProps = {
  activeView: SidebarView
  currentPage: PageContext
  onSelectView: (view: SidebarView) => void
  children: ReactNode
}

const navItems: Array<{ id: SidebarView; label: string; icon: string }> = [
  { id: 'crawler', label: '主流程', icon: '采' },
  { id: 'schedule', label: '定时', icon: '时' },
  { id: 'email', label: '邮箱', icon: '邮' },
  { id: 'phone', label: '电话', icon: '电' },
  { id: 'image', label: '图片', icon: '图' },
]

export default function SidebarShell({
  activeView,
  currentPage,
  onSelectView,
  children,
}: TopBarShellProps) {
  return (
    <div className="ss-shell">
      <header className="ss-topbar">
        <div className="ss-topbar__brand">
          <div className="ss-topbar__mark">SS</div>
          <span className="ss-topbar__name">SmartScraper</span>
        </div>

        <nav className="ss-tabs">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ss-tab ${item.id === activeView ? 'is-active' : ''}`}
              onClick={() => onSelectView(item.id)}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ss-topbar__site" title={currentPage.title}>
          <span className="ss-topbar__site-label">站点</span>
          <span className="ss-topbar__site-title">{currentPage.hostname}</span>
        </div>
      </header>

      <main className="ss-main">{children}</main>
    </div>
  )
}
