import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Activity, ArrowDownUp, Bell, CalendarDays, Check, ChevronDown, CircleHelp,
  Command, FileText, Flag, FolderKanban, LayoutGrid, ListTodo, MoreHorizontal,
  Plus, Search, Settings2, SlidersHorizontal, Sparkles, X,
} from 'lucide-react'
import './App.css'

type Status = 'todo' | 'in_progress' | 'done'
type Priority = 'low' | 'medium' | 'high'

type Task = {
  id: string
  title: string
  description: string
  status: Status
  priority: Priority
  dueDate: string | null
}

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
const storageKey = 'task-builder-tasks'
const columns: { id: Status; title: string; color: string }[] = [
  { id: 'todo', title: 'To do', color: 'slate' },
  { id: 'in_progress', title: 'In progress', color: 'blue' },
  { id: 'done', title: 'Done', color: 'green' },
]

const starterTasks: Task[] = [
  { id: 'sample-1', title: 'Map the onboarding journey', description: 'Sketch the first-run flow and identify the moments that need a little more delight.', status: 'todo', priority: 'high', dueDate: '2026-09-30' },
  { id: 'sample-2', title: 'Collect launch feedback', description: 'Pull notes from the last three customer calls into one place.', status: 'todo', priority: 'medium', dueDate: '2026-10-02' },
  { id: 'sample-3', title: 'Review the new dashboard', description: 'Check hierarchy, empty states, and responsive behavior before handoff.', status: 'todo', priority: 'low', dueDate: null },
  { id: 'sample-4', title: 'Write release notes', description: 'Keep it short, human, and focused on what changed for customers.', status: 'in_progress', priority: 'medium', dueDate: '2026-09-29' },
  { id: 'sample-5', title: 'Finalize visual direction', description: 'Share the color and type choices with the team for a final pass.', status: 'in_progress', priority: 'high', dueDate: '2026-09-30' },
  { id: 'sample-6', title: 'Set up project space', description: 'A tidy home for the launch work and the people making it happen.', status: 'done', priority: 'low', dueDate: null },
]

function readSavedTasks(): Task[] {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) as Task[] : starterTasks
  } catch {
    return starterTasks
  }
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(readSavedTasks)
  const [apiOnline, setApiOnline] = useState(false)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch(`${apiUrl}/tasks`)
      .then((response) => {
        if (!response.ok) throw new Error('API unavailable')
        return response.json() as Promise<Task[]>
      })
      .then((remoteTasks) => {
        if (active) {
          setTasks(remoteTasks)
          setApiOnline(true)
        }
      })
      .catch(() => {
        if (active) setApiOnline(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tasks))
  }, [tasks])

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (priorityFilter === 'all' || task.priority === priorityFilter)
  }), [tasks, search, priorityFilter])

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const payload = {
      title: String(data.get('title')).trim(),
      description: String(data.get('description') ?? '').trim(),
      status: String(data.get('status')) as Status,
      priority: String(data.get('priority')) as Priority,
      dueDate: String(data.get('dueDate') ?? '') || null,
    }

    if (apiOnline) {
      try {
        const response = await fetch(editingTask ? `${apiUrl}/tasks/${editingTask.id}` : `${apiUrl}/tasks`, {
          method: editingTask ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error('Could not save task')
        const savedTask = await response.json() as Task
        setTasks((current) => editingTask
          ? current.map((task) => task.id === savedTask.id ? savedTask : task)
          : [savedTask, ...current])
      } catch {
        setApiOnline(false)
        saveLocally(payload)
      }
    } else {
      saveLocally(payload)
    }
    closeDialog()
  }

  function saveLocally(payload: Omit<Task, 'id'>) {
    if (editingTask) {
      setTasks((current) => current.map((task) => task.id === editingTask.id ? { ...payload, id: task.id } : task))
    } else {
      setTasks((current) => [{ ...payload, id: `local-${Date.now()}` }, ...current])
    }
  }

  async function updateStatus(taskId: string, status: Status) {
    const task = tasks.find((item) => item.id === taskId)
    if (!task || task.status === status) return
    const updated = { ...task, status }
    setTasks((current) => current.map((item) => item.id === taskId ? updated : item))
    if (!apiOnline || taskId.startsWith('sample-') || taskId.startsWith('local-')) return
    try {
      const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Could not update task')
    } catch {
      setApiOnline(false)
    }
  }

  async function deleteTask(task: Task) {
    setTasks((current) => current.filter((item) => item.id !== task.id))
    if (!apiOnline || task.id.startsWith('sample-') || task.id.startsWith('local-')) return
    try {
      const response = await fetch(`${apiUrl}/tasks/${task.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete task')
    } catch {
      setApiOnline(false)
    }
  }

  function openCreateDialog() {
    setEditingTask(null)
    setDialogOpen(true)
  }

  function openEditDialog(task: Task) {
    setEditingTask(task)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingTask(null)
  }

  const completedCount = tasks.filter((task) => task.status === 'done').length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#board" aria-label="Taskwell home">
          <span className="brand-mark"><Check size={17} strokeWidth={3} /></span>
          <span>taskwell<span className="brand-period">.</span></span>
        </a>
        <button className="workspace-switcher" type="button">
          <span className="workspace-icon">S</span>
          <span className="workspace-copy"><strong>Studio North</strong><small>Free workspace</small></span>
          <ChevronDown size={15} />
        </button>

        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="nav-item" href="#board"><LayoutGrid size={17} /><span>Overview</span></a>
          <a className="nav-item active" href="#board"><ListTodo size={17} /><span>My tasks</span><span className="nav-count">{tasks.length}</span></a>
          <a className="nav-item" href="#board"><CalendarDays size={17} /><span>Calendar</span></a>
          <a className="nav-item" href="#board"><Activity size={17} /><span>Activity</span></a>
        </nav>

        <div className="nav-label projects-label">YOUR PROJECTS <button type="button" className="tiny-icon" title="Add project"><Plus size={14} /></button></div>
        <nav className="project-nav" aria-label="Projects">
          <a className="project-item selected" href="#board"><span className="project-dot coral" />Product launch</a>
          <a className="project-item" href="#board"><span className="project-dot blue-dot" />Website refresh</a>
          <a className="project-item" href="#board"><span className="project-dot green-dot" />Brand system</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-note"><div className="upgrade-icon"><Sparkles size={16} /></div><strong>Make room for good work.</strong><p>Invite your team to plan together.</p><button type="button">Invite teammates <Plus size={13} /></button></div>
          <a className="nav-item" href="#board"><CircleHelp size={17} /><span>Help center</span></a>
          <a className="nav-item" href="#board"><Settings2 size={17} /><span>Settings</span></a>
          <div className="profile-row"><span className="avatar avatar-profile">AM</span><span className="profile-copy"><strong>Alex Morgan</strong><small>Product designer</small></span><MoreHorizontal size={18} /></div>
        </div>
      </aside>

      <main className="main-content" id="board">
        <header className="topbar">
          <div className="breadcrumbs"><span>Projects</span><span className="crumb-slash">/</span><strong>Product launch</strong></div>
          <div className="topbar-actions">
            <div className={`connection-pill ${apiOnline ? 'connected' : ''}`}><span />{apiOnline ? 'Synced' : 'Local mode'}</div>
            <button className="icon-button notification-button" type="button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <span className="avatar avatar-top">AM</span>
          </div>
        </header>

        <section className="page-content">
          <div className="project-heading">
            <div className="project-heading-main">
              <div className="eyebrow"><span className="project-dot coral" /> PROJECT SPACE <span className="eyebrow-divider">/</span> SEPTEMBER 2026</div>
              <div className="title-line"><h1>Product launch</h1><button className="icon-button title-more" type="button" aria-label="Project options"><MoreHorizontal size={20} /></button></div>
              <p className="project-description">A thoughtful launch, from first sketch to first hello.</p>
            </div>
            <div className="project-meta"><div className="avatar-stack"><span className="avatar avatar-one">AM</span><span className="avatar avatar-two">JL</span><span className="avatar avatar-three">RK</span><button type="button" className="avatar avatar-add" aria-label="Add teammate"><Plus size={14} /></button></div><span className="meta-divider" /><button className="share-button" type="button"><Command size={14} /> Share</button></div>
          </div>

          <div className="progress-strip"><div className="progress-label"><span><Flag size={15} /> Launch progress</span><strong>{completedCount}<small> / {tasks.length} tasks</small></strong></div><div className="progress-track"><span style={{ width: `${tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%` }} /></div><span className="progress-percent">{tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%</span></div>

          <div className="board-toolbar">
            <div className="board-tabs"><button className="board-tab active" type="button"><LayoutGrid size={15} /> Board</button><button className="board-tab" type="button"><FileText size={15} /> List</button></div>
            <div className="toolbar-actions">
              <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" /><kbd>/</kbd></label>
              <label className="priority-filter" title="Filter by priority"><SlidersHorizontal size={16} /><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as 'all' | Priority)} aria-label="Filter by priority"><option value="all">Filter</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select><ChevronDown size={13} /></label>
              <button className="sort-button" type="button" title="Sort by due date"><ArrowDownUp size={15} /><span>Sort</span></button>
              <button className="add-task-button" type="button" onClick={openCreateDialog}><Plus size={17} /><span>Add task</span></button>
            </div>
          </div>

          <div className="board-grid">
            {columns.map((column) => {
              const columnTasks = visibleTasks.filter((task) => task.status === column.id)
              return <section className={`board-column ${draggedTask ? 'drag-active' : ''}`} key={column.id} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedTask) updateStatus(draggedTask, column.id); setDraggedTask(null) }}>
                <div className="column-heading"><div className="column-name"><span className={`status-dot ${column.color}`} /><h2>{column.title}</h2><span className="task-count">{columnTasks.length}</span></div><button type="button" className="tiny-icon" onClick={openCreateDialog} title={`Add task to ${column.title}`}><Plus size={16} /></button></div>
                <div className="task-list">
                  {columnTasks.map((task, index) => <article className="task-card" key={task.id} draggable onDragStart={() => setDraggedTask(task.id)} onDragEnd={() => setDraggedTask(null)} style={{ animationDelay: `${index * 45}ms` }}>
                    <div className="task-card-top"><span className={`priority-tag ${task.priority}`}><i />{task.priority}</span><div className="task-actions"><button type="button" title="Edit task" className="tiny-icon" onClick={() => openEditDialog(task)}><MoreHorizontal size={16} /></button><button type="button" title="Delete task" className="tiny-icon delete-task" onClick={() => deleteTask(task)}><X size={15} /></button></div></div>
                    <button type="button" className="task-title-button" onClick={() => openEditDialog(task)}><h3>{task.title}</h3></button>
                    {task.description && <p className="task-description">{task.description}</p>}
                    <div className="task-card-footer"><span className={task.dueDate ? 'task-due' : 'task-due no-date'}>{task.dueDate ? <><CalendarDays size={13} />{new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</> : 'No due date'}</span><span className="assignee-avatar">AM</span></div>
                  </article>)}
                  {columnTasks.length === 0 && <div className="column-empty">{search || priorityFilter !== 'all' ? 'No matching tasks' : 'Nothing here yet'}</div>}
                </div>
                <button className="column-add" type="button" onClick={openCreateDialog}><Plus size={15} /> Add a task</button>
              </section>
            })}
          </div>
          <footer className="board-footer"><span><FolderKanban size={14} /> {tasks.length} tasks in this project</span><span>Last updated just now</span></footer>
        </section>
      </main>

      {dialogOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog() }}><section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title"><header className="dialog-header"><div><span className="dialog-kicker">PRODUCT LAUNCH</span><h2 id="task-dialog-title">{editingTask ? 'Edit task' : 'Create a task'}</h2></div><button className="icon-button" type="button" onClick={closeDialog} aria-label="Close dialog"><X size={19} /></button></header><form onSubmit={saveTask}><label className="form-field"><span>Task name</span><input name="title" required maxLength={140} placeholder="What needs to get done?" defaultValue={editingTask?.title} autoFocus /></label><label className="form-field"><span>Description <small>Optional</small></span><textarea name="description" rows={3} maxLength={2000} placeholder="Add a few details to help your team" defaultValue={editingTask?.description} /></label><div className="form-row"><label className="form-field"><span>Status</span><select name="status" defaultValue={editingTask?.status ?? 'todo'}>{columns.map((column) => <option value={column.id} key={column.id}>{column.title}</option>)}</select></label><label className="form-field"><span>Priority</span><select name="priority" defaultValue={editingTask?.priority ?? 'medium'}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div><label className="form-field"><span>Due date <small>Optional</small></span><input name="dueDate" type="date" defaultValue={editingTask?.dueDate ?? ''} /></label><footer className="dialog-footer"><button type="button" className="cancel-button" onClick={closeDialog}>Cancel</button><button type="submit" className="add-task-button">{editingTask ? 'Save changes' : <><Plus size={16} /> Create task</>}</button></footer></form></section></div>}
    </div>
  )
}

export default App
