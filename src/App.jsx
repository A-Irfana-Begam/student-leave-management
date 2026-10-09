
import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'pastel-campus-leaves-v1'
const NOTICE_KEY = 'pastel-campus-notices-v1'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const initialLeaves = []

function App() {
  const [role, setRole] = useState('student')
  const [leaves, setLeaves] = useState(() => readStorage(STORAGE_KEY, initialLeaves))
  const [notices, setNotices] = useState(() => readStorage(NOTICE_KEY, []))
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState('Overview')
  const [month, setMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(today())
  const [studentName, setStudentName] = useState('')
  const [regNo, setRegNo] = useState('')
  const [leaveDate, setLeaveDate] = useState(today())
  const [reason, setReason] = useState('')
  const [formMessage, setFormMessage] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leaves))
  }, [leaves])

  useEffect(() => {
    localStorage.setItem(NOTICE_KEY, JSON.stringify(notices))
  }, [notices])

  const addNotice = (message, type = 'info') => {
    setNotices((old) => [
      { id: Date.now() + Math.random(), message, type, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), unread: true },
      ...old,
    ].slice(0, 30))
  }

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter((l) => l.status === 'Pending').length,
    approved: leaves.filter((l) => l.status === 'Approved').length,
    rejected: leaves.filter((l) => l.status === 'Rejected').length,
  }), [leaves])

  const visibleLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const matchesSearch = `${leave.name} ${leave.regNo} ${leave.reason}`.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = filter === 'All' || leave.status === filter
      return matchesSearch && matchesFilter
    }).sort((a, b) => b.createdAt - a.createdAt)
  }, [leaves, search, filter])

  const calendarLeaves = leaves.filter((l) => l.date === selectedDate)
  const unreadCount = notices.filter((n) => n.unread).length

  function submitLeave(event) {
    event.preventDefault()
    const newLeave = {
      id: Date.now(),
      name: studentName.trim(),
      regNo: regNo.trim(),
      date: leaveDate,
      reason: reason.trim(),
      status: 'Pending',
      createdAt: Date.now(),
    }

    setLeaves((old) => [newLeave, ...old])
    addNotice(`Leave request submitted for ${newLeave.name}.`, 'success')
    setStudentName('')
    setRegNo('')
    setLeaveDate(today())
    setReason('')
    setFormMessage('Request submitted successfully!')
    setPage('My Requests')
  }

  function updateStatus(id, status) {
    const item = leaves.find((l) => l.id === id)
    if (!item) return
    setLeaves((old) => old.map((l) => l.id === id ? { ...l, status } : l))
    addNotice(`${item.name}'s request was ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'warning')
  }

  function deleteLeave(id) {
    const item = leaves.find((l) => l.id === id)
    setLeaves((old) => old.filter((l) => l.id !== id))
    if (item) addNotice(`Request for ${item.name} was deleted.`, 'warning')
  }

  function changeMonth(amount) {
    setMonth((old) => new Date(old.getFullYear(), old.getMonth() + amount, 1))
  }

  function renderCalendar() {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const firstDay = new Date(year, monthIndex, 1).getDay()
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const cells = Array(firstDay).fill(null)
    for (let day = 1; day <= daysInMonth; day++) cells.push(day)

    return (
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div className="calendar-weekday" key={day}>{day}</div>
        ))}
        {cells.map((day, index) => {
          if (!day) return <div className="calendar-empty" key={`empty-${index}`} />
          const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayLeaves = leaves.filter((l) => l.date === date)
          return (
            <button
              type="button"
              key={date}
              className={`calendar-day ${selectedDate === date ? 'selected' : ''} ${date === today() ? 'today' : ''}`}
              onClick={() => setSelectedDate(date)}
              aria-label={`${date}, ${dayLeaves.length} requests`}
            >
              <span>{day}</span>
              {dayLeaves.length > 0 && <i className="day-dot">{dayLeaves.length}</i>}
            </button>
          )
        })}
      </div>
    )
  }

  const navItems = role === 'student'
    ? [{ name: 'Overview', icon: '⌂' }, { name: 'Apply for Leave', icon: '＋' }, { name: 'My Requests', icon: '▤' }, { name: 'Calendar', icon: '▦' }]
    : [{ name: 'Overview', icon: '⌂' }, { name: 'All Requests', icon: '▤' }, { name: 'Calendar', icon: '▦' }]

  function switchRole(nextRole) {
    setRole(nextRole)
    setPage('Overview')
    setSearch('')
    setFilter('All')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); setPage('Overview') }}>
          <span className="brand-mark">✿</span>
          <span>campus<span className="brand-light">care</span><small>STUDENT PORTAL</small></span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav">
          {navItems.map((item) => (
            <button key={item.name} className={page === item.name ? 'nav-item active' : 'nav-item'} onClick={() => { setPage(item.name); setFormMessage('') }}>
              <span className="nav-icon">{item.icon}</span>{item.name}
              {item.name === 'My Requests' && <span className="nav-count">{leaves.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-spark">✦</span>
            <strong>Need a hand?</strong>
            <p>Keep your requests and dates in one place.</p>
            <button onClick={() => { setPage('Calendar'); setSelectedDate(today()) }}>Open calendar ↗</button>
          </div>
          <div className="profile-mini">
            <div className="avatar">{role === 'admin' ? 'A' : 'S'}</div>
            <div><strong>{role === 'admin' ? 'Administrator' : 'Student portal'}</strong><small>{role === 'admin' ? 'Request manager' : 'Campus member'}</small></div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div>
          <div className="top-actions">
            <div className="role-switch" aria-label="Switch portal view">
              <button className={role === 'student' ? 'role-active' : ''} onClick={() => switchRole('student')}>Student</button>
              <button className={role === 'admin' ? 'role-active' : ''} onClick={() => switchRole('admin')}>Admin</button>
            </div>
            <div className="notice-wrap">
              <button className="icon-button" aria-label="Notifications" onClick={() => { setNoticeOpen(!noticeOpen); setNotices((old) => old.map((n) => ({ ...n, unread: false }))) }}>
                ♧{unreadCount > 0 && <i className="notification-badge">{unreadCount}</i>}
              </button>
              {noticeOpen && (
                <div className="notice-popover">
                  <div className="popover-heading"><strong>Notifications</strong><button onClick={() => setNotices([])}>Clear all</button></div>
                  {notices.length === 0 ? <p className="empty-text">You're all caught up ✨</p> : notices.map((n) => (
                    <div className="notice-item" key={n.id}><span className={`notice-dot ${n.type}`} /><div><p>{n.message}</p><small>{n.time}</small></div></div>
                  ))}
                </div>
              )}
            </div>
            <div className="top-avatar">{role === 'admin' ? 'A' : 'S'}</div>
          </div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> YOUR CAMPUS, YOUR SPACE</div>
              <h1>{role === 'admin' ? 'Hello, Administrator ' : 'A little space to breathe ' }<span className="wave">{role === 'admin' ? '✦' : '✿'}</span></h1>
              <p>{role === 'admin' ? 'Review student requests and keep everything running smoothly.' : 'Manage your leave requests without the paperwork.'}</p>
            </div>
            {role === 'student' && <button className="primary-button" onClick={() => { setPage('Apply for Leave'); setFormMessage('') }}>＋ Apply for leave</button>}
          </section>

          <section className="stat-grid">
            <StatCard title="Total requests" value={stats.total} icon="▤" tone="lilac" note="All submissions" />
            <StatCard title="Pending review" value={stats.pending} icon="◷" tone="peach" note="Awaiting a decision" />
            <StatCard title="Approved" value={stats.approved} icon="✓" tone="mint" note="Good to go!" />
            <StatCard title="Needs attention" value={stats.rejected} icon="↗" tone="rose" note="Rejected requests" />
          </section>

          {page === 'Apply for Leave' && role === 'student' && (
            <section className="panel form-panel">
              <div className="panel-heading"><div><span className="section-kicker">NEW REQUEST</span><h2>Let's plan your time off</h2><p>Fill in the details below to submit a leave request.</p></div><span className="panel-emoji">🌷</span></div>
              {formMessage && <div className="success-banner">✓ {formMessage}</div>}
              <form className="leave-form" onSubmit={submitLeave}>
                <label>Full name<input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="e.g. Ananya Kumar" required maxLength={80} /></label>
                <label>Register number<input value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="e.g. 23CSE001" required maxLength={30} /></label>
                <label>Leave date<input type="date" min={today()} value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} required /></label>
                <label>Reason for leave<select value={reason} onChange={(e) => setReason(e.target.value)} required><option value="">Choose a reason</option><option>Medical appointment</option><option>Family function</option><option>Personal reasons</option><option>Travel</option><option>Other</option></select></label>
                <div className="form-footer"><span>✦ Your request will be marked as Pending.</span><button className="primary-button" type="submit">Submit request ↗</button></div>
              </form>
            </section>
          )}

          {(page === 'Overview' || page === 'My Requests' || page === 'All Requests') && (
            <div className="dashboard-grid">
              <section className="panel requests-panel">
                <div className="panel-heading compact">
                  <div><span className="section-kicker">{role === 'admin' ? 'REQUEST MANAGEMENT' : 'YOUR ACTIVITY'}</span><h2>{role === 'admin' ? 'Leave requests' : page === 'My Requests' ? 'My leave requests' : 'Recent requests'}</h2></div>
                  <button className="text-button" onClick={() => setPage(role === 'admin' ? 'All Requests' : 'My Requests')}>View all ↗</button>
                </div>
                <div className="filter-row">
                  <div className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, register no..." /></div>
                  <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status"><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select>
                </div>
                {visibleLeaves.length === 0 ? (
                  <div className="empty-state"><span>🌱</span><h3>{leaves.length === 0 ? 'A fresh start!' : 'No matching requests'}</h3><p>{leaves.length === 0 ? 'Your leave requests will bloom here once you add one.' : 'Try changing your search or status filter.'}</p>{role === 'student' && <button className="soft-button" onClick={() => setPage('Apply for Leave')}>Create first request ＋</button>}</div>
                ) : (
                  <div className="request-list">
                    {visibleLeaves.slice(0, page === 'Overview' ? 5 : undefined).map((leave) => (
                      <article className="request-card" key={leave.id}>
                        <div className="request-date"><strong>{new Date(`${leave.date}T12:00:00`).getDate()}</strong><span>{new Date(`${leave.date}T12:00:00`).toLocaleDateString('en', { month: 'short' })}</span></div>
                        <div className="request-details"><strong>{leave.name}</strong><small>{leave.regNo} · {leave.reason}</small><span className="date-caption">{new Date(`${leave.date}T12:00:00`).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                        <div className="request-actions"><span className={`status-pill ${leave.status.toLowerCase()}`}><i />{leave.status}</span>
                          {role === 'admin' && leave.status === 'Pending' && <div className="decision-buttons"><button className="approve-btn" title="Approve" onClick={() => updateStatus(leave.id, 'Approved')}>✓</button><button className="reject-btn" title="Reject" onClick={() => updateStatus(leave.id, 'Rejected')}>×</button></div>}
                          {role === 'admin' && <button className="delete-link" onClick={() => deleteLeave(leave.id)}>Delete</button>}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel calendar-panel">
                <div className="panel-heading compact"><div><span className="section-kicker">PLAN AHEAD</span><h2>Leave calendar</h2></div><span className="calendar-icon">▦</span></div>
                <div className="month-row"><button onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button><strong>{month.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</strong><button onClick={() => changeMonth(1)} aria-label="Next month">›</button></div>
                {renderCalendar()}
                <div className="selected-day-title"><strong>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</strong><span>{calendarLeaves.length} request{calendarLeaves.length === 1 ? '' : 's'}</span></div>
                {calendarLeaves.length === 0 ? <p className="calendar-empty-note">No requests for this date.</p> : calendarLeaves.map((l) => <div className="calendar-event" key={l.id}><span className={`event-marker ${l.status.toLowerCase()}`} /><div><strong>{l.name}</strong><small>{l.reason}</small></div><span className={`mini-status ${l.status.toLowerCase()}`}>{l.status}</span></div>)}
              </section>
            </div>
          )}

          {page === 'Calendar' && (
            <section className="panel full-calendar"><div className="panel-heading"><div><span className="section-kicker">MONTHLY VIEW</span><h2>Your leave calendar</h2><p>Select a date to see its requests.</p></div></div><div className="month-row"><button onClick={() => changeMonth(-1)}>‹ Previous</button><strong>{month.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</strong><button onClick={() => changeMonth(1)}>Next ›</button></div>{renderCalendar()}<h3 className="calendar-result-title">Requests for {selectedDate}</h3>{calendarLeaves.length === 0 ? <p className="empty-text">Nothing scheduled for this date.</p> : calendarLeaves.map((l) => <div className="calendar-event" key={l.id}><span className={`event-marker ${l.status.toLowerCase()}`} /><div><strong>{l.name}</strong><small>{l.regNo} · {l.reason}</small></div><span className={`status-pill ${l.status.toLowerCase()}`}>{l.status}</span>{role === 'admin' && l.status === 'Pending' && <button className="soft-button" onClick={() => updateStatus(l.id, 'Approved')}>Approve</button>}</div>)}</section>
          )}

          <footer className="app-footer"><span>✿ Made for a calmer campus day</span><span>CampusCare · Student Leave Portal</span></footer>
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon, tone, note }) {
  const [displayValue, setDisplayValue] = useState(0)
  useEffect(() => {
    let frame
    const start = performance.now()
    const duration = 500
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      setDisplayValue(Math.round(value * progress))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return <article className={`stat-card ${tone}`}><div className="stat-top"><span>{title}</span><i>{icon}</i></div><strong className="stat-number">{displayValue}</strong><small>{note}</small><div className="stat-decoration" /></article>
}

export default App