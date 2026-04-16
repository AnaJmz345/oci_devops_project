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
  const [tasks, setTasks] = useState([]);
  const [assignees, setAssignees] = useState([]); // { taskId, oracleId, realTimeSpent }
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSprintId, setSelectedSprintId] = useState(activeSprintId !== 'all' ? activeSprintId : (sprints[0]?.sprintId ?? ''));

  useEffect(() => {
    if (sprints.length > 0 && !selectedSprintId) {
      setSelectedSprintId(String(sprints[0].sprintId));
    }
  }, [sprints, selectedSprintId]);

  useEffect(() => {
    if (!selectedSprintId) return;
    setLoading(true);

    Promise.all([
      fetch('/tasks').then(r => r.ok ? r.json() : []),
      fetch('/tasks/assignees/all').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/users').then(r => r.ok ? r.json() : []),
    ]).then(([allTasks, allAssignees, allUsers]) => {
      const sprintTasks = allTasks.filter(t => String(t.sprintId) === String(selectedSprintId));
      setTasks(sprintTasks);
      const sprintTaskIds = new Set(sprintTasks.map(t => t.taskId));
      setAssignees(allAssignees.filter(a => sprintTaskIds.has(a.taskId)));
      setUsers(allUsers);
    }).finally(() => setLoading(false));
  }, [selectedSprintId]);

  // ── KPI calculations ─────────────────────────────────────
  const totalTasks  = tasks.length;
  const doneTasks   = tasks.filter(t => t.status === 'DONE').length;
  const inProgress  = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const todoTasks   = tasks.filter(t => t.status === 'TODO').length;
  const blockedTasks = tasks.filter(t => t.status === 'BLOCKED').length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const selectedSprint = sprints.find(s => String(s.sprintId) === String(selectedSprintId));

  // Tasks completed per member
  const tasksByMember = users
    .filter(u => u.role === 'DEVELOPER')
    .map(u => {
      const userAssignees = assignees.filter(a => a.oracleId === u.oracleId);
      const userTaskIds = new Set(userAssignees.map(a => a.taskId));
      const doneCnt = tasks.filter(t => userTaskIds.has(t.taskId) && t.status === 'DONE').length;
      return { label: u.name.split(' ')[0], value: doneCnt };
    })
    .filter(d => d.value > 0 || assignees.some(a => {
      const u = users.find(u => u.oracleId === a.oracleId);
      return u && u.name.split(' ')[0] === d.label;
    }));

  // Hours per member (from realTimeSpent in task_assignees)
  const hoursByMember = users
    .filter(u => u.role === 'DEVELOPER')
    .map(u => {
      const spent = assignees
        .filter(a => a.oracleId === u.oracleId)
        .reduce((sum, a) => sum + (a.realTimeSpent || 0), 0);
      return { label: u.name.split(' ')[0], value: Math.round(spent * 10) / 10 };
    })
    .filter(d => {
      const u = users.find(u => u.name.split(' ')[0] === d.label);
      return assignees.some(a => a.oracleId === u?.oracleId);
    });

  const sprintOptions = sprints.map(s => ({ id: String(s.sprintId), label: s.sprintName }));

  return (
    <div className="AN-root">
      {/* Header */}
      <div className="AN-header">
        <div>
          <div className="AN-kicker">MANAGER VIEW</div>
          <h1 className="AN-title">Analytics</h1>
          <p className="AN-subtitle">Sprint KPI dashboard — track team performance and progress</p>
        </div>
        <div className="AN-sprint-picker">
          <label className="AN-sprint-label">Sprint</label>
          <select
            className="AN-sprint-select"
            value={selectedSprintId}
            onChange={e => setSelectedSprintId(e.target.value)}
          >
            <option value="">— Select sprint —</option>
            {sprintOptions.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="AN-loading">Loading analytics…</div>
      ) : !selectedSprintId ? (
        <div className="AN-loading">Select a sprint to view analytics.</div>
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
              <div className="AN-card-title">{selectedSprint?.sprintName || 'Sprint'}</div>
              {selectedSprint?.goal && (
                <p className="AN-goal">"{selectedSprint.goal}"</p>
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
              <div className="AN-card-label">TIME SPENT</div>
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
            <div className="AN-card-title">Tasks by Status</div>
            <div className="AN-breakdown-bars">
              {[
                { label: 'Done',        value: doneTasks,    color: '#4C825C', bg: 'rgba(76,130,92,0.12)' },
                { label: 'In Progress', value: inProgress,   color: '#F1B13F', bg: 'rgba(241,177,63,0.15)' },
                { label: 'To Do',       value: todoTasks,    color: '#2b2dbf', bg: 'rgba(43,45,191,0.10)' },
                { label: 'Blocked',     value: blockedTasks, color: '#C74634', bg: 'rgba(199,70,52,0.10)' },
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