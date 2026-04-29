import React, { useState, useEffect } from 'react';

import './vantage.css';
import './board.css';

import { useAuth } from './authenticator/AuthContext';
import AuthLanding from './authenticator/AuthLanding';
import CreateTaskModal from './task/CreateTaskModal';
import EditTaskModal from './task/EditTaskModal';
import CreateSprintModal from './sprint/CreateSprintModal';
import ReportBugModal from './bug/ReportBugModal';
import ViewBugsModal from './bug/ViewBugsModal';
import AnalyticsPage from './analytics/AnalyticsPage';

import VantageSidebar from './VantageSidebar';
import VantageTopbar from './VantageTopbar';
import OverviewTab from './task/OverviewTab';
import BacklogMainTab from './task/BacklogMainTab';
import DashboardMainTab from './task/DashboardMainTab';
import CalendarMainTab from './task/CalendarMainTab';

function MainApp() {
  const { user } = useAuth();
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
  const [reportBugTask, setReportBugTask] = useState(null);
  const [viewBugsTask, setViewBugsTask] = useState(null);
  const [taskBugCounts, setTaskBugCounts] = useState({});

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

  const fetchBugCounts = () => {
    fetch('/bugs')
      .then(r => r.ok ? r.json() : [])
      .then(bugs => {
        const counts = {};
        bugs.forEach(b => {
          counts[b.taskId] = (counts[b.taskId] || 0) + 1;
        });
        setTaskBugCounts(counts);
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
      fetchBugCounts();
    }
  }, [user, activePage, fetchBacklogTasks, fetchSprints]);

  if (!user) {
    return <AuthLanding mode={page} onModeChange={setPage} />;
  }

  const activeProjectName = 'SIXTH SEMESTER';
  const activeTeamName = 'PLACEHOLDER TEAM';

  const projectPages = [
    { id: 'overview',  label: 'OVERVIEW' },
    { id: 'backlog',   label: 'BACKLOG' },
    { id: 'board',     label: 'BOARD' },
    ...(isManager ? [{ id: 'analytics', label: 'ANALYTICS' }] : []),
    { id: 'calendar',  label: 'CALENDAR' },
  ];

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

  const sharedTaskProps = {
    activeProjectName,
    activeSprintLabel,
    activeSprintId,
    backlogTasks,
    setBacklogTasks,
    sprints,
    users,
    taskAssignees,
    setTaskAssignees,
    isManager,
  };

  return (
    <div className="VantageShell">
      {isSidebarOpen && (
        <VantageSidebar
          activePage={activePage}
          setActivePage={setActivePage}
          setIsSidebarOpen={setIsSidebarOpen}
          isProjectsOpen={isProjectsOpen}
          setIsProjectsOpen={setIsProjectsOpen}
          isProjectOpen={isProjectOpen}
          setIsProjectOpen={setIsProjectOpen}
          isTeamsOpen={isTeamsOpen}
          setIsTeamsOpen={setIsTeamsOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          projectPages={projectPages}
          activeProjectName={activeProjectName}
          activeTeamName={activeTeamName}
        />
      )}

      <div className="VantageMain">
        <VantageTopbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          pageTitle={pageTitle}
          activeProjectName={activeProjectName}
          activeTeamName={activeTeamName}
          activeSprintLabel={activeSprintLabel}
          activeSprintId={activeSprintId}
          setActiveSprintId={setActiveSprintId}
          sprintOptions={sprintOptions}
          userName={user?.name}
        />

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
              taskBugCounts={taskBugCounts}
              onReportBug={task => setReportBugTask(task)}
              onViewBugs={task => setViewBugsTask(task)}
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
              setTaskAssignees={setTaskAssignees}
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

      <ReportBugModal
        open={reportBugTask !== null}
        onClose={() => setReportBugTask(null)}
        task={reportBugTask}
        userId={user?.oracle_id}
        onBugCreated={() => {
          setReportBugTask(null);
          fetchBugCounts();
        }}
      />

      <ViewBugsModal
        open={viewBugsTask !== null}
        onClose={() => setViewBugsTask(null)}
        task={viewBugsTask}
        userId={user?.oracle_id}
        isManager={isManager}
        onBugsChanged={fetchBugCounts}
      />
    </div>
  );
}

export default MainApp;