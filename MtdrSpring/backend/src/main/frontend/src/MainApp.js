import React, { useState, useEffect } from 'react';
import NewItem from './NewItem';
import API_LIST from './API';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Button, TableBody, CircularProgress } from '@mui/material';

import './vantage.css';

import { useAuth } from './authenticator/AuthContext';
import AuthLanding from './authenticator/AuthLanding';
import CreateTaskModal from './task/CreateTaskModal';
import CreateSprintModal from './sprint/CreateSprintModal';

function MainApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('login'); // 'login' o 'register'
  const [activePage, setActivePage] = useState('overview'); // overview | backlog | board | calendar | chatbot | tasks
  const [activeSprintId, setActiveSprintId] = useState('sprint2');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isProjectOpen, setIsProjectOpen] = useState(true);
  const [isTeamsOpen, setIsTeamsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [isInserting, setInserting] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [backlogLoading, setBacklogLoading] = useState(false);

  const isManager = user?.role === 'MANAGER';

  // Función estable con useCallback para poder usarla en useEffect y en onTaskCreated
  const fetchBacklogTasks = React.useCallback(() => {
    setBacklogLoading(true);
    fetch('/tasks')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setBacklogTasks(data); setBacklogLoading(false); })
      .catch(() => setBacklogLoading(false));
  }, []); // sin dependencias: fetch y setters son estables

  useEffect(() => {
    if (user) setActivePage('overview');
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (activePage !== 'tasks') return;

    setLoading(true);
    fetch(API_LIST)
      .then(response => {
        if (response.ok) return response.json();
        else throw new Error('Something went wrong ...');
      })
      .then(
        (result) => { setLoading(false); setItems(result); },
        (error) => { setLoading(false); setError(error); }
      );
  }, [user, activePage]);

  useEffect(() => {
    if (user && activePage === 'backlog') fetchBacklogTasks();
  }, [user, activePage, fetchBacklogTasks]);

  // Si no hay usuario loggeado, mostrar AuthLanding (login/register con animación)
  if (!user) {
    return (
      <AuthLanding
        mode={page}
        onModeChange={setPage}
      />
    );
  }

  function deleteItem(deleteId) {
    fetch(API_LIST + "/" + deleteId, { method: 'DELETE' })
      .then(response => {
        if (response.ok) return response;
        else throw new Error('Something went wrong ...');
      })
      .then(
        () => { setItems(items.filter(item => item.id !== deleteId)); },
        (error) => { setError(error); }
      );
  }

  function toggleDone(event, id, description, currentDone) {
    event.preventDefault();
    const newDone = currentDone === "DONE" ? "TODO" : "DONE";
    modifyItem(id, description, newDone).then(
      () => { reloadOneItem(id); },
      (error) => { setError(error); }
    );
  }

  function reloadOneItem(id) {
    fetch(API_LIST + "/" + id)
      .then(response => {
        if (response.ok) return response.json();
        else throw new Error('Something went wrong ...');
      })
      .then(
        (result) => {
          const items2 = items.map(x =>
            x.id === id ? { ...x, description: result.description, done: result.done } : x
          );
          setItems(items2);
        },
        (error) => { setError(error); }
      );
  }

  function modifyItem(id, description, done) {
    var data = { "description": description, "done": done };
    return fetch(API_LIST + "/" + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) return response;
        else throw new Error('Something went wrong ...');
      });
  }

  function addItem(taskName, description, storyPoints) {
    setInserting(true);
    var data = { description: taskName, name: description, storyPoints, done: "TODO" };
    fetch(API_LIST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(response => {
        if (response.ok) return response;
        else throw new Error('Something went wrong ...');
      })
      .then(
        (result) => {
          var id = result.headers.get('location');
          var newItem = { id, description: taskName, name: description, storyPoints, done: "TODO" };
          setItems([newItem, ...items]);
          setInserting(false);
        },
        (error) => { setInserting(false); setError(error); }
      );
  }

  const projectPages = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'backlog', label: 'BACKLOG' },
    { id: 'board', label: 'BOARD' },
    { id: 'calendar', label: 'CALENDAR' },
    { id: 'chatbot', label: 'CHATBOT' },
    { id: 'tasks', label: 'TASKS (LEGACY)' },
  ];

  const activeProjectName = 'SIXTH SEMESTER';
  const activeTeamName = 'PLACEHOLDER TEAM';

  const sprintOptions = [
    { id: 'all', label: 'All sprints' },
    { id: 'sprint2', label: 'Sprint 2' },
    { id: 'sprint1', label: 'Sprint 1' },
  ];

  const activeSprintLabel = (
    sprintOptions.find(s => s.id === activeSprintId)?.label || 'Sprint'
  );

  const pageTitle = (
    {
      overview: 'Overview',
      backlog: 'Backlog',
      board: 'Board',
      calendar: 'Calendar',
      chatbot: 'Chatbot',
      tasks: 'Tasks (legacy)',
    }[activePage] || 'Overview'
  );

  function PlaceholderHeader({ title, subtitle }) {
    return (
      <div className="VantagePageHeader">
        <h1 className="VantageH1">{title}</h1>
        <div className="VantageMuted">{subtitle}</div>
        <div className="VantageMuted">Project: {activeProjectName} • Sprint: {activeSprintLabel}</div>
      </div>
    );
  }

  function OverviewPage() {
    return (
      <div className="VantagePage">
        <PlaceholderHeader
          title="Overview"
          subtitle="Placeholder manager dashboard (no data wired yet)."
        />
        <div className="VantageGrid">
          <div className="VantageCard">
            <div className="VantageCardTitle">Sprint status</div>
            <div className="VantageCardBody">Placeholder metrics and burn-down.</div>
          </div>
          <div className="VantageCard">
            <div className="VantageCardTitle">Work in progress</div>
            <div className="VantageCardBody">Placeholder WIP / blockers.</div>
          </div>
          <div className="VantageCard">
            <div className="VantageCardTitle">Team notes</div>
            <div className="VantageCardBody">Placeholder announcements and links.</div>
          </div>
        </div>
        <div className="VantageCard" style={{ marginTop: 14 }}>
          <div className="VantageCardTitle">Recent activity</div>
          <div className="VantageCardBody">Placeholder activity feed.</div>
        </div>
      </div>
    );
  }

  function BacklogPage() {
    const STATUS_COLORS = {
      'TODO':        { background: 'rgba(30,50,36,0.08)', color: '#1E3224' },
      'IN_PROGRESS': { background: 'rgba(241,177,63,0.18)', color: '#9a6c00' },
      'DONE':        { background: 'rgba(76,130,92,0.18)', color: '#2d6b3f' },
      'BLOCKED':     { background: 'rgba(199,70,52,0.15)', color: '#C74634' },
    };

    return (
      <div className="VantagePage">
        <div className="VantagePageHeader">
          <h1 className="VantageH1">Backlog</h1>
          <div className="VantageMuted">Project: {activeProjectName} • Sprint: {activeSprintLabel}</div>
        </div>
        <div className="VantageCard">
          <div className="VantageCardTitle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Backlog items {backlogTasks.length > 0 && <span style={{ fontWeight: 500, color: 'rgba(30,50,36,0.5)', fontSize: 13 }}>({backlogTasks.length})</span>}</span>
            {isManager && (
              <button
                type="button"
                onClick={() => setIsCreateTaskOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  appearance: 'none', border: 'none', background: '#C74634',
                  color: '#fff', borderRadius: 10, padding: '7px 16px',
                  fontSize: 12, fontWeight: 900, letterSpacing: '0.5px', cursor: 'pointer',
                }}
              >
                + Create Task
              </button>
            )}
          </div>
          <div className="VantageCardBody">
            {backlogLoading ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(30,50,36,0.45)', fontSize: 13 }}>Loading tasks…</div>
            ) : backlogTasks.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(30,50,36,0.45)', fontSize: 13 }}>No tasks yet. {isManager ? 'Click "+ Create Task" to add one.' : ''}</div>
            ) : (
              <table className="VantageTable">
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: 'right' }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {backlogTasks.map(task => {
                    const sc = STATUS_COLORS[task.status] || STATUS_COLORS['TODO'];
                    return (
                      <tr key={task.taskId}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{task.taskName}</div>
                          {task.description && <div style={{ fontSize: 12, color: 'rgba(30,50,36,0.55)', marginTop: 2 }}>{task.description}</div>}
                        </td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.4px', color: 'rgba(30,50,36,0.65)' }}>
                            {task.category || '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ ...sc, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 900, letterSpacing: '0.4px' }}>
                            {task.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'rgba(30,50,36,0.65)' }}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {task.storyPoints ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Botón CREATE NEW SPRINT — solo manager */}
        {isManager && (
          <button
            type="button"
            className="SM-create-sprint-btn"
            onClick={() => setIsCreateSprintOpen(true)}
          >
            <span style={{ fontSize: 16 }}>⊕</span> CREATE NEW SPRINT
          </button>
        )}
      </div>
    );
  }

  function BoardPage() {
    return (
      <div className="VantagePage">
        <PlaceholderHeader
          title="Board"
          subtitle="Placeholder kanban board (no drag/drop yet)."
        />
        <div className="VantageBoard">
          <div className="VantageBoardCol">
            <div className="VantageBoardColTitle">TODO</div>
            <div className="VantageBoardCard">Placeholder ticket A</div>
            <div className="VantageBoardCard">Placeholder ticket B</div>
          </div>
          <div className="VantageBoardCol">
            <div className="VantageBoardColTitle">IN PROGRESS</div>
            <div className="VantageBoardCard">Placeholder ticket C</div>
          </div>
          <div className="VantageBoardCol">
            <div className="VantageBoardColTitle">DONE</div>
            <div className="VantageBoardCard">Placeholder ticket D</div>
          </div>
        </div>
      </div>
    );
  }

  function CalendarPage() {
    return (
      <div className="VantagePage">
        <PlaceholderHeader
          title="Calendar"
          subtitle="Placeholder calendar view (no events wired yet)."
        />
        <div className="VantageCard">
          <div className="VantageCardTitle">Upcoming</div>
          <div className="VantageCardBody">Placeholder sprint ceremonies and deadlines.</div>
        </div>
      </div>
    );
  }

  function ChatbotPage() {
    return (
      <div className="VantagePage">
        <PlaceholderHeader
          title="Chatbot"
          subtitle="Placeholder chatbot screen (no AI calls yet)."
        />
        <div className="VantageCard">
          <div className="VantageCardTitle">Assistant</div>
          <div className="VantageCardBody">This area will later host the chat UI.</div>
        </div>
      </div>
    );
  }

  function TasksLegacyPage() {
    return (
      <div className="VantagePage">
        <PlaceholderHeader
          title="Tasks (legacy)"
          subtitle="Original todo list screen kept as-is (useful for quick API smoke-tests)."
        />
        <div className="VantageCard">
          <div className="VantageCardBody">
            <NewItem addItem={addItem} isInserting={isInserting} />
            {error && <p>Error: {error.message}</p>}
            {isLoading && <CircularProgress />}
            {!isLoading &&
              <div id="maincontent">
                <table id="itemlistNotDone" className="itemlist">
                  <TableBody>
                    {items.map(item => (
                      !item.done || item.done === "TODO" ? (
                        <tr key={item.id}>
                          <td className="description">
                            <strong>{item.description}</strong>
                            {item.name && <div style={{ fontSize: '0.85em', color: '#aaa' }}>{item.name}</div>}
                          </td>
                          <td className="date" style={{ whiteSpace: 'nowrap', color: '#aaa', fontSize: '0.85em' }}>
                            {item.storyPoints != null ? `⏱ ${item.storyPoints}h` : ''}
                          </td>
                          <td>
                            <Button variant="contained" className="DoneButton"
                              onClick={(event) => toggleDone(event, item.id, item.description, item.done)}
                              size="small">Done</Button>
                          </td>
                        </tr>
                      ) : null
                    ))}
                  </TableBody>
                </table>

                <h2 id="donelist">Done items</h2>

                <table id="itemlistDone" className="itemlist">
                  <TableBody>
                    {items.map(item => (
                      item.done === "DONE" ? (
                        <tr key={item.id}>
                          <td className="description">
                            <strong>{item.description}</strong>
                            {item.name && <div style={{ fontSize: '0.85em', color: '#aaa' }}>{item.name}</div>}
                          </td>
                          <td className="date" style={{ whiteSpace: 'nowrap', color: '#aaa', fontSize: '0.85em' }}>
                            {item.storyPoints != null ? `⏱ ${item.storyPoints}h` : ''}
                          </td>
                          <td>
                            <Button variant="contained" className="DoneButton"
                              onClick={(event) => toggleDone(event, item.id, item.description, item.done)}
                              size="small">Undo</Button>
                          </td>
                          <td>
                            <Button startIcon={<DeleteIcon />} variant="contained" className="DeleteButton"
                              onClick={() => deleteItem(item.id)} size="small">Delete</Button>
                          </td>
                        </tr>
                      ) : null
                    ))}
                  </TableBody>
                </table>
              </div>
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="VantageShell">
      {isSidebarOpen && (
        <aside className="VantageSidebar">
          <div className="VantageSidebarHeader">
            <div className="VantageBrandName">VANTAGE</div>
            <button
              type="button"
              className="VantageIconButton"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Hide sidebar"
              title="Hide sidebar"
            >
              ⟨
            </button>
          </div>

          <div className="VantageSearchWrap">
            <input
              className="VantageSearch"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for projects or teams…"
              aria-label="Search for projects or teams"
            />
          </div>

          <div className="VantageSection">
            <button
              type="button"
              className="VantageSectionHeader"
              onClick={() => setIsProjectsOpen(v => !v)}
              aria-expanded={isProjectsOpen}
            >
              <span className="VantageSectionTitle">PROJECTS</span>
              <span className="VantageBadge VantageBadgeRed">1</span>
              <span className="VantageChevron">{isProjectsOpen ? '▾' : '▸'}</span>
            </button>

            {isProjectsOpen && (
              <div className="VantageSectionBody">
                <button
                  type="button"
                  className="VantageRowButton"
                  onClick={() => setIsProjectOpen(v => !v)}
                  aria-expanded={isProjectOpen}
                >
                  <span className="VantageBadgeMini VantageBadgePurple">01</span>
                  <span className="VantageRowText">{activeProjectName}</span>
                  <span className="VantageChevron">{isProjectOpen ? '▾' : '▸'}</span>
                </button>

                {isProjectOpen && (
                  <div className="VantageNested">
                    {projectPages.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={`VantagePageLink ${activePage === p.id ? 'is-active' : ''}`}
                        onClick={() => setActivePage(p.id)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="VantageSection">
            <button
              type="button"
              className="VantageSectionHeader"
              onClick={() => setIsTeamsOpen(v => !v)}
              aria-expanded={isTeamsOpen}
            >
              <span className="VantageSectionTitle">TEAMS</span>
              <span className="VantageBadge VantageBadgeGreen">1</span>
              <span className="VantageChevron">{isTeamsOpen ? '▾' : '▸'}</span>
            </button>

            {isTeamsOpen && (
              <div className="VantageSectionBody">
                <button type="button" className="VantageRowButton" onClick={() => setActivePage('overview')}>
                  <span className="VantageBadgeMini VantageBadgeAmber">01</span>
                  <span className="VantageRowText">{activeTeamName}</span>
                </button>
                <div className="VantageTeamHint">Team screens coming later (placeholder).</div>
              </div>
            )}
          </div>

          <div className="VantageSidebarBottom">
            <button
              type="button"
              className="VantageIconButton"
              title={user?.name || 'Profile'}
              aria-label="Profile"
            >
              <AccountCircleOutlinedIcon fontSize="small" />
            </button>

            <Button variant="contained" size="small" className="VantageLogout" onClick={logout}>
              Logout
            </Button>

            <button
              type="button"
              className="VantageIconButton is-disabled"
              title="Settings (coming soon)"
              aria-label="Settings"
              disabled
            >
              <SettingsOutlinedIcon fontSize="small" />
            </button>
          </div>
        </aside>
      )}

      <div className="VantageMain">
        <header className="VantageTopbar">
          <div className="VantageTopbarLeft">
            <button
              type="button"
              className="VantageIconButton"
              onClick={() => setIsSidebarOpen(v => !v)}
              aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              ☰
            </button>

            <div>
              <div className="VantageTopbarTitle">{pageTitle}</div>
              <div className="VantageTopbarMeta">
                Project: {activeProjectName} • Team: {activeTeamName} • Sprint: {activeSprintLabel}
                {user?.name && <span> • 👤 {user.name}</span>}
              </div>
            </div>
          </div>

          <div className="VantageTopbarRight">
            <label className="VantageSprintLabel" htmlFor="vantage-sprint-select">Sprint</label>
            <select
              id="vantage-sprint-select"
              className="VantageSprintSelect"
              value={activeSprintId}
              onChange={(e) => setActiveSprintId(e.target.value)}
            >
              {sprintOptions.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </header>

        <main className="VantageContent">
          {activePage === 'overview' && <OverviewPage />}
          {activePage === 'backlog' && <BacklogPage />}
          {activePage === 'board' && <BoardPage />}
          {activePage === 'calendar' && <CalendarPage />}
          {activePage === 'chatbot' && <ChatbotPage />}
          {activePage === 'tasks' && <TasksLegacyPage />}
        </main>
      </div>

      <CreateTaskModal
        open={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onTaskCreated={(task) => {
          setIsCreateTaskOpen(false);
          fetchBacklogTasks();
        }}
        sprintId={activeSprintId !== 'all' ? activeSprintId : null}
        createdBy={user?.oracle_id}
      />

      <CreateSprintModal
        open={isCreateSprintOpen}
        onClose={() => setIsCreateSprintOpen(false)}
        onSprintCreated={() => {
          setIsCreateSprintOpen(false);
        }}
      />
    </div>
  );
}

export default MainApp;