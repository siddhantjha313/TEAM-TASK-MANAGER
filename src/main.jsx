import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Briefcase, CheckCircle2, Clock3, FolderKanban, LayoutDashboard, LogOut, Plus,
  Shield, UserPlus, Users, AlertCircle, Search, TrendingUp, Calendar, User, Menu, X
} from 'lucide-react';
import './styles.css';

const api = {
  async request(path, options = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
  }
};

const emptyProject = { name: '', description: '', dueDate: '', memberIds: [] };
const emptyTask = { projectId: '', title: '', description: '', assigneeId: '', status: 'todo', priority: 'medium', dueDate: '' };

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  async function loadApp() {
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      const [dashboardData, usersData, projectsData, tasksData] = await Promise.all([
        api.request('/dashboard'),
        user.role === 'admin' ? api.request('/users') : Promise.resolve([]),
        api.request('/projects'),
        api.request('/tasks')
      ]);
      setDashboard(dashboardData);
      setUsers(usersData);
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApp();
  }, [user?.id]);

  const visibleMembers = useMemo(() => users.filter((item) => item.role === 'member'), [users]);
  const availableAssignees = useMemo(() => {
    const project = projects.find((item) => String(item.id) === String(taskForm.projectId));
    return project?.members?.length ? project.members : users;
  }, [projects, taskForm.projectId, users]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  async function handleAuth(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authForm;
      const data = await api.request(`/auth/${authMode}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setDashboard(null);
    setProjects([]);
    setTasks([]);
  }

  async function createProject(event) {
    event.preventDefault();
    try {
      await api.request('/projects', {
        method: 'POST',
        body: JSON.stringify({
          ...projectForm,
          memberIds: projectForm.memberIds.map(Number)
        })
      });
      setProjectForm(emptyProject);
      await loadApp();
      setMessage('Project created successfully!');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createTask(event) {
    event.preventDefault();
    try {
      await api.request('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...taskForm,
          projectId: Number(taskForm.projectId),
          assigneeId: taskForm.assigneeId ? Number(taskForm.assigneeId) : null
        })
      });
      setTaskForm(emptyTask);
      await loadApp();
      setMessage('Task created successfully!');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateStatus(taskId, status) {
    try {
      await api.request(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await loadApp();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div className="auth-content">
            <div className="brand-row">
              <FolderKanban size={32} />
              <span>Workboard</span>
            </div>
            <h1>Manage projects with clarity</h1>
            <p>Organize teams, assign tasks, and track progress in one beautiful dashboard.</p>
            <div className="auth-features">
              <div className="feature"><CheckCircle2 size={20} /><span>Real-time collaboration</span></div>
              <div className="feature"><Users size={20} /><span>Team management</span></div>
              <div className="feature"><TrendingUp size={20} /><span>Progress tracking</span></div>
            </div>
          </div>

          <form className="auth-card" onSubmit={handleAuth}>
            <div className="mode-switch">
              <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
              <button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Sign up</button>
            </div>

            {authMode === 'signup' && (
              <>
                <label>Full Name<input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required /></label>
                <label>Role<select value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}><option value="member">Team Member</option><option value="admin">Administrator</option></select></label>
              </>
            )}

            <label>Email Address<input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required /></label>
            <label>Password<input type="password" minLength="6" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required /></label>
            <button className="primary" disabled={loading}>{loading ? 'Processing...' : authMode === 'login' ? 'Sign in' : 'Create account'}</button>
            {message && <p className="notice error">{message}</p>}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-row compact"><FolderKanban size={24} /><span>Workboard</span></div>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav>
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}><LayoutDashboard size={18} /><span>Dashboard</span></button>
          <button className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => { setActiveTab('projects'); setSidebarOpen(false); }}><Briefcase size={18} /><span>Projects</span></button>
          <button className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => { setActiveTab('tasks'); setSidebarOpen(false); }}><CheckCircle2 size={18} /><span>Tasks</span></button>
          {isAdmin && <button className={`nav-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => { setActiveTab('team'); setSidebarOpen(false); }}><Users size={18} /><span>Team</span></button>}
        </nav>
        <div className="profile">
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <div><strong>{user.name}</strong><small>{user.role}</small></div>
          <button className="icon-button" onClick={logout} title="Logout"><LogOut size={18} /></button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={24} /></button>
            <div>
              <h1>{activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'projects' ? 'Projects' : activeTab === 'tasks' ? 'Tasks' : 'Team'}</h1>
              <p>{isAdmin ? 'Manage your workspace' : 'Track your work'}</p>
            </div>
          </div>
          <button className="ghost" onClick={loadApp} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
        </header>

        {message && <div className={`banner ${message.includes('error') ? 'error' : 'success'}`}>{message}</div>}

        {activeTab === 'dashboard' && (
          <>
            <section className="stats-grid">
              <Metric icon={<Briefcase />} label="Projects" value={dashboard?.projects ?? 0} />
              <Metric icon={<CheckCircle2 />} label="Total Tasks" value={dashboard?.tasks?.total ?? 0} />
              <Metric icon={<Clock3 />} label="In Progress" value={dashboard?.tasks?.in_progress ?? 0} />
              <Metric icon={<AlertCircle />} label="Overdue" value={dashboard?.tasks?.overdue ?? 0} tone="danger" />
            </section>

            {isAdmin && (
              <section className="admin-grid">
                <form className="panel" onSubmit={createProject}>
                  <h2><Plus size={20} />New Project</h2>
                  <label>Project Name<input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required /></label>
                  <label>Description<textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="What is this project about?" /></label>
                  <label>Due Date<input type="date" value={projectForm.dueDate} onChange={(e) => setProjectForm({ ...projectForm, dueDate: e.target.value })} /></label>
                  <label>Team Members<select multiple value={projectForm.memberIds} onChange={(e) => setProjectForm({ ...projectForm, memberIds: [...e.target.selectedOptions].map((option) => option.value) })}>{visibleMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
                  <button className="primary">Create Project</button>
                </form>

                <form className="panel" onSubmit={createTask}>
                  <h2><UserPlus size={20} />New Task</h2>
                  <label>Project<select value={taskForm.projectId} onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value, assigneeId: '' })} required><option value="">Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
                  <label>Task Title<input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required /></label>
                  <label>Description<textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Task details..." /></label>
                  <div className="split">
                    <label>Assign To<select value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}><option value="">Unassigned</option>{availableAssignees.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
                    <label>Priority<select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
                  </div>
                  <label>Due Date<input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></label>
                  <button className="primary">Create Task</button>
                </form>
              </section>
            )}
          </>
        )}

        {activeTab === 'projects' && (
          <section className="section-block">
            <div className="section-header"><h2>All Projects</h2><span className="badge">{projects.length}</span></div>
            {projects.length === 0 ? (
              <div className="empty-state"><Briefcase size={48} /><h3>No projects yet</h3><p>Create your first project to get started</p></div>
            ) : (
              <div className="project-grid">
                {projects.map((project) => {
                  const pct = project.task_count ? Math.round((project.done_count / project.task_count) * 100) : 0;
                  return (
                    <article className="project-card" key={project.id}>
                      <div className="card-header"><h3>{project.name}</h3><span className="progress-badge">{pct}%</span></div>
                      <p>{project.description || 'No description'}</p>
                      <div className="progress-line"><span style={{ width: `${pct}%` }} /></div>
                      <div className="card-meta">
                        <span><Users size={14} />{project.members?.length || 0} members</span>
                        <span><Calendar size={14} />{project.due_date ? formatDate(project.due_date) : 'No date'}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'tasks' && (
          <section className="section-block">
            <div className="section-header">
              <div className="search-box"><Search size={18} /><input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
              <span className="badge">{filteredTasks.length}</span>
            </div>
            {filteredTasks.length === 0 ? (
              <div className="empty-state"><CheckCircle2 size={48} /><h3>No tasks found</h3><p>{searchQuery ? 'Try a different search' : 'Create your first task to get started'}</p></div>
            ) : (
              <div className="task-list">
                {filteredTasks.map((task) => (
                  <article className={`task-row ${isOverdue(task) ? 'overdue' : ''} ${task.status === 'done' ? 'completed' : ''}`} key={task.id}>
                    <div className="task-content">
                      <div className="task-header"><strong>{task.title}</strong><span className={`priority ${task.priority}`}>{task.priority}</span></div>
                      <p>{task.project_name} • {task.assignee_name || 'Unassigned'}</p>
                      <small>{task.due_date ? formatDate(task.due_date) : 'No due date'}</small>
                    </div>
                    <select value={task.status} onChange={(e) => updateStatus(task.id, e.target.value)} className="status-select">
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'team' && isAdmin && (
          <section className="section-block">
            <div className="section-header"><h2>Team Members</h2><span className="badge">{users.length}</span></div>
            <div className="team-grid">
              {users.map((member) => (
                <article className="team-card" key={member.id}>
                  <span className="avatar">{member.name.slice(0, 1).toUpperCase()}</span>
                  <div className="team-info"><strong>{member.name}</strong><p>{member.email}</p><small className={`role-badge ${member.role}`}>{member.role}</small></div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function Metric({ icon, label, value, tone = '' }) {
  return (
    <article className={`metric ${tone}`}>
      <span>{icon}</span>
      <div><strong>{value}</strong><p>{label}</p></div>
    </article>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function isOverdue(task) {
  return task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date(new Date().toDateString());
}

createRoot(document.getElementById('root')).render(<App />);
