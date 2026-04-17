import React, { useEffect, useState } from 'react';
import ProgressRing from './ProgressRing';
import BarChart from './BarChart';
import './analytics.css';

function StatPill({ label, value, color }) {
  return (
    <div className="AN-stat-pill" style={{ borderColor: color + '30' }}>
      <span className="AN-stat-value" style={{ color }}>{value}</span>
      <span className="AN-stat-label">{label}</span>
    </div>
  );
}

function AnalyticsPage({ sprints, activeSprintId }) {
  const [allTasks, setAllTasks] = useState([]);
  const [allAssignees, setAllAssignees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAllSprints = activeSprintId === 'all';

  // Fetch data whenever activeSprintId changes
  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch('/tasks').then(r => r.ok ? r.json() : []),
      fetch('/tasks/assignees/all').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/users').then(r => r.ok ? r.json() : []),
    ]).then(([fetchedTasks, fetchedAssignees, fetchedUsers]) => {
      setAllTasks(fetchedTasks);
      setAllAssignees(fetchedAssignees);
      setUsers(fetchedUsers);
    }).finally(() => setLoading(false));
  }, [activeSprintId]);

  // ── Filter tasks based on sprint selection ────────────────
  // "All sprints" → ALL tasks that belong to ANY sprint (sprintId != null)
  // Specific sprint → only tasks for that sprint
  const tasks = isAllSprints
    ? allTasks.filter(t => t.sprintId != null)
    : allTasks.filter(t => String(t.sprintId) === String(activeSprintId));

  // Filter assignees to match the filtered tasks
  const sprintTaskIds = new Set(tasks.map(t => t.taskId));
  const assignees = allAssignees.filter(a => sprintTaskIds.has(a.taskId));

  // ── KPI calculations ─────────────────────────────────────
  const totalTasks   = tasks.length;
  const doneTasks    = tasks.filter(t => t.status === 'DONE').length;
  const inProgress   = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const todoTasks    = tasks.filter(t => t.status === 'TODO').length;
  const blockedTasks = tasks.filter(t => t.status === 'BLOCKED').length;
  const progressPct  = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // For header display
  const selectedSprint = !isAllSprints
    ? sprints.find(s => String(s.sprintId) === String(activeSprintId))
    : null;

  // Ring label: sprint name or "All Sprints"
  const ringLabel = isAllSprints ? 'All Sprints' : (selectedSprint?.sprintName || 'Sprint');
  const ringGoal  = isAllSprints ? null : selectedSprint?.goal;

  // Tasks completed per member
  const tasksByMember = users
    .filter(u => u.role === 'DEVELOPER')
    .map(u => {
      const userAssignees = assignees.filter(a =>
        String(a.oracleId) === String(u.oracleId)
      );
      const userTaskIds = new Set(userAssignees.map(a => a.taskId));
      const doneCnt = tasks.filter(t => userTaskIds.has(t.taskId) && t.status === 'DONE').length;
      const totalCnt = tasks.filter(t => userTaskIds.has(t.taskId)).length;
      return { label: u.name.split(' ')[0], value: doneCnt, total: totalCnt };
    })
    .filter(d => d.total > 0);

  // Hours per member (estimated_completion_time sum per developer)
  const hoursByMember = users
    .filter(u => u.role === 'DEVELOPER')
    .map(u => {
      const estimated = assignees
        .filter(a => String(a.oracleId) === String(u.oracleId))
        .reduce((sum, a) => sum + (a.estimatedCompletionTime || 0), 0);
      return { label: u.name.split(' ')[0], value: Math.round(estimated * 10) / 10 };
    })
    .filter(d => d.value > 0);

  return (
    <div className="AN-root">
      {/* Header */}
      <div className="AN-header">
        <div>
          <div className="AN-kicker">MANAGER VIEW</div>
          <h1 className="AN-title">Analytics</h1>
          <p className="AN-subtitle">Sprint KPI dashboard — track team performance and progress</p>
        </div>
      </div>

      {loading ? (
        <div className="AN-loading">Loading analytics…</div>
      ) : (
        <>
          {/* Stat pills row */}
          <div className="AN-pills-row">
            <StatPill label="Total Tasks"   value={totalTasks}    color="#1E3224" />
            <StatPill label="Done"          value={doneTasks}     color="#4C825C" />
            <StatPill label="In Progress"   value={inProgress}    color="#F1B13F" />
            <StatPill label="To Do"         value={todoTasks}     color="#2b2dbf" />
            <StatPill label="Blocked"       value={blockedTasks}  color="#C74634" />
          </div>

          {/* Main grid */}
          <div className="AN-grid">

            {/* Progress ring card */}
            <div className="AN-card AN-card--ring">
              <div className="AN-card-label">SPRINT PROGRESS</div>
              <div className="AN-card-title">{ringLabel}</div>
              {ringGoal && (
                <p className="AN-goal">"{ringGoal}"</p>
              )}
              <div className="AN-ring-wrap">
                <ProgressRing
                  percent={progressPct}
                  size={160}
                  stroke={14}
                  color="#C74634"
                />
              </div>
              <div className="AN-ring-meta">
                <span><strong>{doneTasks}</strong> done of <strong>{totalTasks}</strong> tasks</span>
              </div>
            </div>

            {/* Tasks per member bar chart */}
            <div className="AN-card">
              <div className="AN-card-label">TASKS COMPLETED</div>
              <div className="AN-card-title">TASK PER MEMBER</div>
              {tasksByMember.length === 0 ? (
                <div className="AN-empty">No completed tasks yet for this sprint.</div>
              ) : (
                <BarChart
                  data={tasksByMember}
                  unit=" tasks"
                  color="#C74634"
                />
              )}
            </div>

            {/* Hours per member bar chart */}
            <div className="AN-card">
              <div className="AN-card-label">TIME WORKED</div>
              <div className="AN-card-title">HOURS PER MEMBER</div>
              {hoursByMember.length === 0 ? (
                <div className="AN-empty">No time logged yet for this sprint.</div>
              ) : (
                <BarChart
                  data={hoursByMember}
                  unit="h"
                  color="#4C825C"
                />
              )}
            </div>

          </div>

          {/* Status breakdown */}
          <div className="AN-card AN-card--breakdown">
            <div className="AN-card-label">STATUS BREAKDOWN</div>
            <div className="AN-card-title">TASK BY STATUS</div>
            <div className="AN-breakdown-bars">
              {[
                { label: 'Done',        value: doneTasks,    color: '#4C825C' },
                { label: 'In Progress', value: inProgress,   color: '#F1B13F' },
                { label: 'To Do',       value: todoTasks,    color: '#2b2dbf' },
                { label: 'Blocked',     value: blockedTasks, color: '#C74634' },
              ].map(item => (
                <div key={item.label} className="AN-breakdown-row">
                  <span className="AN-breakdown-label" style={{ color: item.color }}>{item.label}</span>
                  <div className="AN-breakdown-track">
                    <div
                      className="AN-breakdown-fill"
                      style={{
                        width: totalTasks > 0 ? `${(item.value / totalTasks) * 100}%` : '0%',
                        background: item.color,
                      }}
                    />
                  </div>
                  <span className="AN-breakdown-count">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AnalyticsPage;