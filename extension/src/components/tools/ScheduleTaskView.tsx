import type { ScheduleTask } from '../../types'

type ScheduleTaskViewProps = {
  tasks: ScheduleTask[]
  onAddTask: () => void
  onToggleTask: (taskId: string) => void
}

export default function ScheduleTaskView({ tasks, onAddTask, onToggleTask }: ScheduleTaskViewProps) {
  return (
    <div className="ss-panel">
      <header className="ss-panel__header">
        <div>
          <div className="ss-overline">独立工具页</div>
          <h1>定时任务</h1>
          <p>展示已有任务、空状态和添加入口，后续可继续接入自动化执行。</p>
        </div>
        <button type="button" className="ss-btn ss-btn--primary" onClick={onAddTask}>
          添加任务
        </button>
      </header>

      <div className="ss-panel__body">
        {tasks.length ? (
          <div className="ss-stack">
            {tasks.map((task) => (
              <div key={task.id} className="ss-card ss-subsection">
                <div>
                  <h3>{task.name}</h3>
                  <p>
                    {task.sourceLabel} / {task.scheduleLabel}
                  </p>
                  <small>下次运行：{task.nextRunAt}</small>
                </div>
                <button type="button" className="ss-btn ss-btn--ghost" onClick={() => onToggleTask(task.id)}>
                  {task.status === 'active' ? '暂停' : '启用'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="ss-empty">还没有定时任务，点击右上角按钮创建第一个任务。</div>
        )}
      </div>
    </div>
  )
}
