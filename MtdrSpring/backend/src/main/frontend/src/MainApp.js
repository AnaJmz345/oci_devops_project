import React, { useState, useEffect } from 'react';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Button } from '@mui/material';

import './vantage.css';
import './board.css';

import { useAuth } from './authenticator/AuthContext';
import AuthLanding from './authenticator/AuthLanding';
import CreateTaskModal from './task/CreateTaskModal';
import EditTaskModal from './task/EditTaskModal';
import CreateSprintModal from './sprint/CreateSprintModal';
import AnalyticsPage from './analytics/AnalyticsPage';

import OverviewTab from './task/OverviewTab';
import BacklogMainTab from './task/BacklogMainTab';
import DashboardMainTab from './task/DashboardMainTab';
import CalendarMainTab from './task/CalendarMainTab';

function MainApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('login');
  const [activePage, setActivePage] = useState('overview');
  const [activeSprintId, setActiveSprintId] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isProjectOpen, setIsProjectOpen] = useState(true);
  const [isTeamsOpen, setIsTeamsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [assignMode, setAssignMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [assignSprintId, setAssignSprintId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [backlogLoading, setBacklogLoading] = useState(false);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  const [taskAssignees, setTaskAssignees] = useState({});

  const isManager = user?.role === 'MANAGER';

  const fetchBacklogTasks = React.useCallback(() => {
    setBacklogLoading(true);
    fetch('/tasks')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setBacklogTasks(data); setBacklogLoading(false); })
      .catch(() => setBacklogLoading(false));
  }, []);

  const fetchSprints = React.useCallback(() => {
    fetch('/sprints')
      .then(r => r.ok ? r.json() : [])
      .then(data => setSprints(data))
      .catch(() => setSprints([]));
  }, []);

  const refreshAssignees = () => {
    fetch('/tasks/assignees/all')
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        const map = {};
        list.forEach(a => { map[a.taskId] = a; });
        setTaskAssignees(map);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (user) {
      setActivePage('overview');
      fetchSprints();
      fetch('/users')
        .then(r => r.ok ? r.json() : [])
        .then(setUsers)
        .catch(() => {});
    }
  }, [user, fetchSprints]);

  useEffect(() => {
    if (user && (activePage === 'backlog' || activePage === 'board')) {
      fetchSprints();
      fetchBacklogTasks();
      refreshAssignees();
    }
  }, [user, activePage, fetchBacklogTasks, fetchSprints]);

  if (!user) {
    return <AuthLanding mode={page} onModeChange={setPage} />;
  }

  const projectPages = [
    { id: 'overview',  label: 'OVERVIEW' },
    { id: 'backlog',   label: 'BACKLOG' },
    { id: 'board',     label: 'BOARD' },
    ...(isManager ? [{ id: 'analytics', label: 'ANALYTICS' }] : []),
    { id: 'calendar',  label: 'CALENDAR' },
  ];

  const activeProjectName = 'SIXTH SEMESTER';
  const activeTeamName = 'PLACEHOLDER TEAM';

  const sprintOptions = [
    { id: 'all', label: 'All sprints' },
    ...sprints.map(s => ({ id: String(s.sprintId), label: s.sprintName })),
  ];

  const activeSprintLabel =
    sprintOptions.find(s => s.id === activeSprintId)?.label || 'Sprint';

  const pageTitle = (
    {
      overview:  'Overview',
      backlog:   'Backlog',
      board:     'Board',
      analytics: 'Analytics',
      calendar:  'Calendar',
    }[activePage] || 'Overview'
  );

  // Shared props for tabs that need task/sprint data
  const sharedTaskProps = {
    activeProjectName,
    activeSprintLabel,
    activeSprintId,
    backlogTasks,
    setBacklogTasks,
    sprints,
    users,
    taskAssignees,
    isManager,
  };

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
            <div className="VantageSprintDropdown">
              <span className="VantageSprintBadge">SPRINT</span>
              <select
                id="vantage-sprint-select"
                className="VantageSprintSelect2"
                value={activeSprintId}
                onChange={(e) => setActiveSprintId(e.target.value)}
              >
                {sprintOptions.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <span className="VantageSprintChevron">▾</span>
            </div>
          </div>
        </header>

        <main className="VantageContent">
          {activePage === 'overview' && (
            <OverviewTab
              activeProjectName={activeProjectName}
              activeSprintLabel={activeSprintLabel}
            />
          )}
          {activePage === 'backlog' && (
            <BacklogMainTab
              {...sharedTaskProps}
              backlogLoading={backlogLoading}
              assignMode={assignMode}
              setAssignMode={setAssignMode}
              selectedTaskIds={selectedTaskIds}
              setSelectedTaskIds={setSelectedTaskIds}
              assignSprintId={assignSprintId}
              setAssignSprintId={setAssignSprintId}
              assigning={assigning}
              setAssigning={setAssigning}
              fetchBacklogTasks={fetchBacklogTasks}
              setIsCreateTaskOpen={setIsCreateTaskOpen}
              setIsCreateSprintOpen={setIsCreateSprintOpen}
              setEditingTask={setEditingTask}
            />
          )}
          {activePage === 'board' && (
            <DashboardMainTab
              activeSprintId={activeSprintId}
              backlogTasks={backlogTasks}
              setBacklogTasks={setBacklogTasks}
              sprints={sprints}
              users={users}
              taskAssignees={taskAssignees}
            />
          )}
          {activePage === 'analytics' && isManager && (
            <AnalyticsPage sprints={sprints} activeSprintId={activeSprintId} />
          )}
          {activePage === 'calendar' && (
            <CalendarMainTab
              activeProjectName={activeProjectName}
              activeSprintLabel={activeSprintLabel}
            />
          )}
        </main>
      </div>

      <CreateTaskModal
        open={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onTaskCreated={() => {
          setIsCreateTaskOpen(false);
          fetchBacklogTasks();
          refreshAssignees();
        }}
        sprintId={activeSprintId !== 'all' ? activeSprintId : null}
        createdBy={user?.oracle_id}
      />

      <CreateSprintModal
        open={isCreateSprintOpen}
        onClose={() => setIsCreateSprintOpen(false)}
        onSprintCreated={() => {
          setIsCreateSprintOpen(false);
          fetchSprints();
        }}
      />

      <EditTaskModal
        open={editingTask !== null}
        task={editingTask}
        sprints={sprints}
        users={users}
        onClose={() => setEditingTask(null)}
        onTaskUpdated={(updated) => {
          setBacklogTasks(prev => prev.map(t => t.taskId === updated.taskId ? updated : t));
          setEditingTask(null);
          refreshAssignees();
        }}
        onTaskDeleted={(taskId) => {
          setBacklogTasks(prev => prev.filter(t => t.taskId !== taskId));
          setTaskAssignees(prev => { const n = { ...prev }; delete n[taskId]; return n; });
          setEditingTask(null);
        }}
      />
    </div>
  );
}

export default MainApp;