import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "campuscare-leaves-v3";

// Start with an empty list: no sample students or fake applications.
function readLeaves() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysBetween(start, end) {
  if (!start || !end) return 1;
  return Math.max(1, Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000) + 1);
}

function Badge({ status }) {
  return <span className={`badge badge-${status.toLowerCase()}`}><i />{status}</span>;
}

export default function App() {
  const [leaves, setLeaves] = useState(readLeaves);
  const [role, setRole] = useState("Student");
  const [page, setPage] = useState("Overview");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ name: "", department: "", year: "", type: "Medical Leave", reason: "", date: "", endDate: "" });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(leaves)); } catch { /* storage is optional */ }
  }, [leaves]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const myLeaves = useMemo(() => leaves.filter((item) => role === "Admin" || item.name.toLowerCase() === form.name.trim().toLowerCase()), [leaves, role, form.name]);
  const visibleLeaves = useMemo(() => myLeaves.filter((item) => {
    const text = `${item.name} ${item.department} ${item.type} ${item.reason}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (filter === "All" || item.status === filter);
  }).sort((a, b) => b.submittedAt - a.submittedAt), [myLeaves, search, filter]);
  const pending = myLeaves.filter((x) => x.status === "Pending").length;
  const approved = myLeaves.filter((x) => x.status === "Approved").length;
  const rejected = myLeaves.filter((x) => x.status === "Rejected").length;

  function updateForm(event) { setForm((old) => ({ ...old, [event.target.name]: event.target.value })); }
  function submitLeave(event) {
    event.preventDefault();
    if (form.endDate < form.date) { setToast("End date cannot be earlier than start date."); return; }
    const item = { ...form, id: Date.now(), name: form.name.trim(), reason: form.reason.trim(), status: "Pending", submittedAt: Date.now() };
    setLeaves((old) => [item, ...old]);
    setForm((old) => ({ ...old, reason: "", date: "", endDate: "" }));
    setPage("My Leaves"); setToast("Leave request submitted.");
  }
  function setStatus(id, status) { setLeaves((old) => old.map((x) => x.id === id ? { ...x, status } : x)); setToast(`Request ${status.toLowerCase()}.`); }
  function removeLeave(id) { setLeaves((old) => old.filter((x) => x.id !== id)); setToast("Request deleted."); }
  function clearAll() {
    if (!window.confirm("Delete all saved leave requests from this browser? This cannot be undone.")) return;
    setLeaves([]); setToast("All saved requests cleared.");
  }

  const nav = ["Overview", "Apply Leave", "My Leaves", "Calendar"];
  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setPage("Overview")}><span className="brand-mark">✦</span><span>Campus<span className="brand-accent">Care</span><small>STUDENT PORTAL</small></span></button>
      <p className="nav-caption">WORKSPACE</p>
      <nav>{nav.map((item, i) => <button key={item} className={`nav-item ${page === item ? "active" : ""}`} onClick={() => setPage(item)}><span className="nav-symbol">{["⌂", "＋", "▤", "▦"][i]}</span>{item}{page === item && <span className="nav-chevron">›</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-flower">✧</div><strong>Make room for what matters.</strong><p>Clear requests. Calmer campus days.</p><label htmlFor="role">Preview role</label><select id="role" value={role} onChange={(e) => { setRole(e.target.value); setPage("Overview"); }}><option>Student</option><option>Admin</option></select><small className="demo-note">Role switch is a UI preview, not secure authentication.</small></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><span className="muted">Workspace</span><span className="slash">/</span><strong>{page}</strong></div><div className="topbar-right"><span className="role-pill"><i />{role} mode</span><span className="avatar">{role === "Admin" ? "A" : (form.name.trim()[0] || "S").toUpperCase()}</span></div></header>
      <div className="page-content">
        {page === "Overview" && <>
          <section className="hero"><div className="hero-copy"><span className="eyebrow">YOUR CAMPUS, SIMPLIFIED</span><h1>{role === "Admin" ? "Welcome to your workspace." : `Hello${form.name.trim() ? `, ${form.name.trim().split(" ")[0]}` : " there"}.`}<span> ✦</span></h1><p>{role === "Admin" ? "Review real requests submitted through this browser." : "Take care of your time. Keep your leave requests organised."}</p><button className="primary-btn" onClick={() => setPage(role === "Admin" ? "My Leaves" : "Apply Leave")}>{role === "Admin" ? "Review requests" : "Apply for leave"} <span>↗</span></button></div><div className="hero-illustration"><div className="sun-disc">✦</div><div className="paper-card"><span className="paper-check">✓</span><i/><i/><i/></div><span className="spark spark-a">✧</span><span className="spark spark-b">✦</span></div></section>
          <div className="section-heading"><div><span className="eyebrow">YOUR OVERVIEW</span><h2>Dashboard at a glance</h2></div><span className="live-label"><i/> Live browser data</span></div>
          <section className="stats-grid"><Stat label="Total requests" value={myLeaves.length} note="Saved applications" icon="▤"/><Stat label="Awaiting review" value={pending} note="Needs attention" icon="◷"/><Stat label="Approved" value={approved} note="Accepted requests" icon="✓"/><Stat label="Rejected" value={rejected} note="Declined requests" icon="×"/></section>
          <section className="dashboard-grid"><div className="panel"><div className="panel-head"><div><h2>Recent activity</h2><p>Your latest leave applications</p></div><button className="text-btn" onClick={() => setPage("My Leaves")}>View all ↗</button></div>{myLeaves.length ? <div className="activity-list">{myLeaves.slice().sort((a,b)=>b.submittedAt-a.submittedAt).slice(0,5).map((x)=><div className="activity-row" key={x.id}><span className="activity-icon">{x.type === "Medical Leave" ? "✚" : "✦"}</span><div className="activity-copy"><strong>{x.type}</strong><p>{role === "Admin" ? x.name : x.reason}</p><small>{formatDate(x.date)}{x.date !== x.endDate ? ` – ${formatDate(x.endDate)}` : ""}</small></div><Badge status={x.status}/></div>)}</div> : <Empty title="No leave requests yet" text={role === "Admin" ? "Student applications will appear here after they are submitted." : "Submit your first application to see it here."} action={role === "Student" ? <button className="primary-btn" onClick={() => setPage("Apply Leave")}>Create request</button> : null}/>}</div>
          <div className="panel quick-panel"><div className="panel-head"><div><h2>Quick actions</h2><p>Jump straight into your tasks</p></div><span className="quick-star">✦</span></div><button className="quick-link" onClick={() => setPage("Apply Leave")}><span className="quick-icon">＋</span><span><strong>New leave request</strong><small>Fill in your application</small></span><b>↗</b></button><button className="quick-link" onClick={() => setPage("My Leaves")}><span className="quick-icon">▤</span><span><strong>Track applications</strong><small>Check request status</small></span><b>↗</b></button><button className="quick-link" onClick={() => setPage("Calendar")}><span className="quick-icon">▦</span><span><strong>Leave calendar</strong><small>View dates and requests</small></span><b>↗</b></button><div className="quote-card">“<p>Rest is part of the journey, not a pause from it.</p></div></div></section>
        </>}
        {page === "Apply Leave" && <><div className="page-intro"><span className="eyebrow">TAKE A BREATHER</span><h1>Apply for leave <span>✦</span></h1><p>Fill in your details accurately before submitting.</p></div><div className="form-layout"><form className="panel leave-form" onSubmit={submitLeave}><div className="form-heading"><span>01</span><div><h2>Your details</h2><p>Tell us who is applying.</p></div></div><div className="form-grid"><label>Full name<input name="name" value={form.name} onChange={updateForm} placeholder="Enter your full name" required/></label><label>Department<select name="department" value={form.department} onChange={updateForm} required><option value="">Select department</option>{["Computer Science","Information Technology","Electronics and Communication","Electrical Engineering","Mechanical Engineering","Civil Engineering","Business Administration","Arts and Science","Other Department"].map(x=><option key={x}>{x}</option>)}</select></label><label>Academic year<select name="year" value={form.year} onChange={updateForm} required><option value="">Select year</option>{["I Year","II Year","III Year","IV Year","Postgraduate"].map(x=><option key={x}>{x}</option>)}</select></label><label>Leave type<select name="type" value={form.type} onChange={updateForm}>{["Medical Leave","Casual Leave","Personal Leave","On-Duty Leave","Other"].map(x=><option key={x}>{x}</option>)}</select></label></div><div className="form-divider"/><div className="form-heading"><span>02</span><div><h2>Leave details</h2><p>Choose your dates and explain the reason.</p></div></div><div className="form-grid"><label>Start date<input type="date" name="date" value={form.date} min={new Date().toLocaleDateString("en-CA")} onChange={updateForm} required/></label><label>End date<input type="date" name="endDate" value={form.endDate} min={form.date || new Date().toLocaleDateString("en-CA")} onChange={updateForm} required/></label><label className="full-field">Reason for leave<textarea name="reason" value={form.reason} onChange={updateForm} placeholder="Briefly explain why you need leave..." rows="4" maxLength="500" required/><small className="char-count">{form.reason.length}/500 characters</small></label></div>{form.date && form.endDate >= form.date && <div className="duration-box"><strong>{daysBetween(form.date,form.endDate)} {daysBetween(form.date,form.endDate) === 1 ? "day" : "days"}</strong><span>{formatDate(form.date)}{form.date !== form.endDate ? ` – ${formatDate(form.endDate)}` : ""}</span></div>}<div className="form-actions"><button type="button" className="secondary-btn" onClick={() => setForm({name:"",department:"",year:"",type:"Medical Leave",reason:"",date:"",endDate:""})}>Clear details</button><button className="primary-btn" type="submit">Submit request ↗</button></div><p className="form-note">✦ Your request will be saved in this browser for review.</p></form><aside className="form-aside"><div className="tip-card"><span>✧</span><h2>Take the time you need.</h2><p>Clear details and accurate dates help keep your application organised.</p></div><div className="panel checklist"><h3>Before you submit</h3><p>Quick checklist</p><div>✓ &nbsp; Student details are correct</div><div>✓ &nbsp; Leave dates are accurate</div><div>✓ &nbsp; Reason is clearly explained</div></div></aside></div></>}
        {page === "My Leaves" && <><div className="page-intro"><span className="eyebrow">{role === "Admin" ? "ADMIN WORKSPACE" : "YOUR APPLICATIONS"}</span><h1>{role === "Admin" ? "Leave requests" : "My leave requests"} <span>✦</span></h1><p>{role === "Admin" ? "Review applications submitted in this browser." : "Track the status of your submitted applications."}</p></div><section className="stats-grid compact"><Stat label="Total requests" value={myLeaves.length} note="Saved applications" icon="▤"/><Stat label="Pending" value={pending} note="Awaiting review" icon="◷"/><Stat label="Approved" value={approved} note="Accepted requests" icon="✓"/><Stat label="Rejected" value={rejected} note="Declined requests" icon="×"/></section><div className="panel table-panel"><div className="panel-head table-head"><div><h2>All applications</h2><p>{visibleLeaves.length} matching request(s)</p></div><div className="filters"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search requests..."/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div></div>{visibleLeaves.length ? <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>LEAVE TYPE / REASON</th><th>DATES</th><th>DURATION</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{visibleLeaves.map(x=><tr key={x.id}><td><strong>{x.name}</strong><small>{x.department} · {x.year}</small></td><td><strong>{x.type}</strong><small>{x.reason}</small></td><td>{formatDate(x.date)}<small>to {formatDate(x.endDate)}</small></td><td>{daysBetween(x.date,x.endDate)} day(s)</td><td><Badge status={x.status}/></td><td><div className="row-actions">{role === "Admin" && x.status === "Pending" ? <><button className="approve" onClick={()=>setStatus(x.id,"Approved")} aria-label="Approve">✓</button><button className="reject" onClick={()=>setStatus(x.id,"Rejected")} aria-label="Reject">×</button></> : null}<button className="delete" onClick={()=>removeLeave(x.id)} aria-label="Delete request">⌫</button></div></td></tr>)}</tbody></table></div> : <Empty title="No requests found" text={search || filter !== "All" ? "Try changing your search or filter." : role === "Admin" ? "No student has submitted a request in this browser yet." : "You have not submitted any requests yet."} action={<button className="secondary-btn" onClick={()=>{setSearch("");setFilter("All");if(role === "Student")setPage("Apply Leave");}}> {role === "Student" ? "Apply for leave" : "Clear filters"}</button>}/>}</div>{role === "Admin" && <button className="danger-text" onClick={clearAll}>Clear all browser-saved requests</button>}</>}
        {page === "Calendar" && <Calendar leaves={myLeaves} onApply={() => setPage("Apply Leave")}/>}
        <footer className="footer"><strong>✦ CampusCare</strong><span>Made for a calmer campus experience.</span><span>© {new Date().getFullYear()}</span></footer>
      </div>
    </main>
    {toast && <div className="toast" role="status">✓ &nbsp;{toast}<button onClick={()=>setToast("")}>×</button></div>}
  </div>;
}

function Stat({label,value,note,icon}) { return <article className="stat-card"><div className="stat-icon">{icon}</div><p>{label}</p><strong>{value}</strong><small>{note}</small></article>; }
function Empty({title,text,action}) { return <div className="empty-state"><span>✧</span><h3>{title}</h3><p>{text}</p>{action}</div>; }
function Calendar({leaves,onApply}) {
  const [date,setDate] = useState(new Date());
  const year=date.getFullYear(), month=date.getMonth();
  const title=date.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const cells=[...Array(new Date(year,month,1).getDay()).fill(null),...Array.from({length:new Date(year,month+1,0).getDate()},(_,i)=>i+1)];
  const eventsFor=(day)=>{if(!day)return[];const d=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;return leaves.filter(x=>d>=x.date&&d<=x.endDate);};
  return <><div className="page-intro"><span className="eyebrow">PLAN AHEAD</span><h1>Leave calendar <span>✦</span></h1><p>Browse the leave dates from saved requests.</p></div><div className="panel calendar-panel"><div className="calendar-toolbar"><div><h2>{title}</h2><p>Leave schedule and requests</p></div><div className="month-controls"><button onClick={()=>setDate(new Date(year,month-1,1))}>‹</button><button onClick={()=>setDate(new Date())}>Today</button><button onClick={()=>setDate(new Date(year,month+1,1))}>›</button></div></div><div className="calendar-grid">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=><div className="weekday" key={x}>{x}</div>)}{cells.map((day,i)=><div className={`calendar-day ${day ? "" : "blank"}`} key={`${month}-${i}`}><span>{day||""}</span>{eventsFor(day).slice(0,2).map(x=><small className={`event event-${x.status.toLowerCase()}`} key={x.id}>{x.type.replace(" Leave","")}</small>)}</div>)}</div><div className="calendar-footer"><span><i className="dot-pending"/> Pending</span><span><i className="dot-approved"/> Approved</span><span><i className="dot-rejected"/> Rejected</span><button className="primary-btn" onClick={onApply}>＋ Apply for leave</button></div></div></>;
}
