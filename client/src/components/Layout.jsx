import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, ListTodo, LibraryBig, Timer, ChartNoAxesColumn, CalendarDays, LogOut, Menu, Search, Bell, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
const links = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/app/subjects', label: 'Subjects', icon: LibraryBig },
  { to: '/app/exams', label: 'Exams', icon: CalendarDays },
  { to: '/app/goals', label: 'Daily goals', icon: Target },
  { to: '/app/timer', label: 'Focus timer', icon: Timer },
  { to: '/app/analytics', label: 'Analytics', icon: ChartNoAxesColumn }
];
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  function signOut() { logout(); navigate('/'); }

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    let active = true;
    setNotificationsLoading(true);
    setNotificationError('');
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    Promise.all([api.get('/tasks'), api.get('/exams'), api.get('/daily-goals', { params: { dateKey } })])
      .then(([taskResponse, examResponse, goalResponse]) => {
        if (!active) return;
        const items = [];
        const weekEnd = new Date(`${dateKey}T00:00:00`);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const endOfWeekKey = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
        const tasks = taskResponse.data?.tasks || [];
        for (const task of tasks) {
          if (task.completed || !task.dueDate) continue;
          const dueKey = new Date(task.dueDate).toISOString().slice(0, 10);
          if (dueKey <= endOfWeekKey) items.push({ id: `task-${task._id}`, title: task.title, detail: dueKey < dateKey ? 'Overdue task' : 'Task due this week', to: '/app/tasks' });
        }
        const exams = examResponse.data?.exams || [];
        for (const exam of exams) {
          const examDateKey = new Date(exam.examDate).toISOString().slice(0, 10);
          const days = Math.round((new Date(`${examDateKey}T00:00:00`).getTime() - new Date(`${dateKey}T00:00:00`).getTime()) / 86400000);
          if (days >= 0 && days <= 7) items.push({ id: `exam-${exam._id}`, title: exam.title, detail: days === 0 ? 'Exam today' : `Exam in ${days} ${days === 1 ? 'day' : 'days'}`, to: '/app/exams' });
        }
        const goals = goalResponse.data?.goals || [];
        for (const goal of goals) {
          if (goal.progress < goal.target) items.push({ id: `goal-${goal._id}`, title: goal.title, detail: 'Daily goal in progress', to: '/app/goals' });
        }
        setNotifications(items.slice(0, 8));
      })
      .catch((err) => {
        if (active) setNotificationError(err.response?.data?.message || 'Could not load reminders.');
      })
      .finally(() => { if (active) setNotificationsLoading(false); });
    return () => { active = false; };
  }, [notificationsOpen]);

  useEffect(() => {
    const term = globalSearch.trim();
    if (!term) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [taskResponse, subjectResponse, examResponse] = await Promise.all([
          api.get('/tasks'),
          api.get('/subjects'),
          api.get('/exams'),
        ]);
        if (!active) return;
        const normalized = term.toLocaleLowerCase();
        const matches = (value) => String(value || '').toLocaleLowerCase().includes(normalized);
        const resultItems = [
          ...(taskResponse.data?.tasks || []).filter((task) => matches(task.title) || matches(task.notes)).map((task) => ({ id: `task-${task._id}`, type: 'Task', title: task.title, detail: task.subject?.name || 'Study task', to: '/app/tasks' })),
          ...(subjectResponse.data?.subjects || []).filter((subject) => matches(subject.name) || matches(subject.description)).map((subject) => ({ id: `subject-${subject._id}`, type: 'Subject', title: subject.name, detail: subject.description || 'Subject', to: '/app/subjects' })),
          ...(examResponse.data?.exams || []).filter((exam) => matches(exam.title) || matches(exam.subject?.name)).map((exam) => ({ id: `exam-${exam._id}`, type: 'Exam', title: exam.title, detail: exam.subject?.name || 'Exam plan', to: '/app/exams' })),
        ];
        setSearchResults(resultItems.slice(0, 8));
      } catch {
        if (active) setSearchResults([]);
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [globalSearch]);

  function handleSearchKeyDown(event) {
    if (event.key === 'Escape') setSearchOpen(false);
    if (event.key === 'Enter' && searchResults[0]) {
      navigate(searchResults[0].to);
      setSearchOpen(false);
    }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <NavLink to="/app" className="brand"><span className="brand-mark"><BookOpen size={20}/></span><span>StudyNest</span></NavLink>
      <div className="nav-caption">WORKSPACE</div>
      <nav>{links.map(({to,label,icon:Icon,end}) => <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="avatar">{user?.name?.[0]?.toUpperCase() || 'S'}</div><div className="user-meta"><strong>{user?.name}</strong><span>Personal workspace</span></div><button className="icon-button" onClick={signOut} aria-label="Log out" title="Log out"><LogOut size={17}/></button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={20}/></button><div className="global-search"><Search size={16}/><input aria-label="Search StudyNest" placeholder="Search notes, tasks, subjects, exams…" value={globalSearch} onFocus={() => setSearchOpen(true)} onChange={(event) => { setGlobalSearch(event.target.value); setSearchOpen(true); }} onKeyDown={handleSearchKeyDown}/>{globalSearch && <button type="button" className="global-search-clear" aria-label="Clear search" onClick={() => { setGlobalSearch(''); setSearchResults([]); setSearchOpen(false); }}>×</button>}{searchOpen && globalSearch.trim() && <div className="global-search-results" role="listbox" aria-label="Search results">{searchLoading ? <div className="global-search-empty">Searching…</div> : searchResults.length ? searchResults.map((result) => <Link role="option" aria-selected="false" key={result.id} to={result.to} className="global-search-result" onClick={() => { setSearchOpen(false); setGlobalSearch(''); }}><span className="global-result-type">{result.type}</span><span className="global-result-copy"><strong>{result.title}</strong><small>{result.detail}</small></span></Link>) : <div className="global-search-empty">No matching notes, tasks, subjects, or exams.</div>}</div>}</div><div className="topbar-right"><div className="notification-anchor"><button className={`icon-button notification-trigger ${notificationsOpen ? 'active' : ''}`} onClick={() => setNotificationsOpen((open) => !open)} aria-label={`Notifications${notifications.length ? `, ${notifications.length} reminders` : ''}`} aria-expanded={notificationsOpen} aria-haspopup="dialog" title="Notifications"><Bell size={18}/>{notifications.length > 0 && <span className="notification-count">{notifications.length > 9 ? '9+' : notifications.length}</span>}</button>{notificationsOpen && <section className="notification-popover" role="dialog" aria-label="Study reminders"><div className="notification-heading"><div><strong>Study reminders</strong><span>Upcoming tasks and plans</span></div><button type="button" className="notification-close" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">×</button></div>{notificationsLoading ? <div className="notification-empty">Checking your reminders…</div> : notificationError ? <div className="notification-empty notification-error">{notificationError}</div> : notifications.length === 0 ? <div className="notification-empty">You’re all caught up.</div> : <div className="notification-list">{notifications.map((item) => <Link key={item.id} to={item.to} className="notification-item" onClick={() => setNotificationsOpen(false)}><span className="notification-dot"/><span><strong>{item.title}</strong><small>{item.detail}</small></span></Link>)}</div>}</section>}</div><div className="avatar small">{user?.name?.[0]?.toUpperCase() || 'S'}</div><span className="user-name">{user?.name}</span></div></header>
      <div className="page-content"><Outlet /></div>
    </main>
  </div>;
}
