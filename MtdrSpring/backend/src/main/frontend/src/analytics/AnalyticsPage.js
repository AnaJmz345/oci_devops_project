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
  const [allBugs, setAllBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAllSprints = activeSprintId === 'all';

  // Fetch data whenever activeSprintId changes
  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch('/tasks').then(r => r.ok ? r.json() : []),
      fetch('/tasks/assignees/all').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/users').then(r => r.ok ? r.json() : []),
      fetch('/bugs').then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([fetchedTasks, fetchedAssignees, fetchedUsers, fetchedBugs]) => {
      setAllTasks(fetchedTasks);
      setAllAssignees(fetchedAssignees);
      setUsers(fetchedUsers);
      setAllBugs(fetchedBugs);
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

  // ── REQUIREMENT: % of tasks completed before due date, per developer ──
  const onTimeByMember = users
    .filter(u => u.role === 'DEVELOPER')
    .map(u => {
      const userAssignees = assignees.filter(a =>
        String(a.oracleId) === String(u.oracleId)
      );
      const userTaskIds = new Set(userAssignees.map(a => a.taskId));

      // Only consider DONE tasks that have a due date
      const doneTasks_ = tasks.filter(t =>
        userTaskIds.has(t.taskId) && t.status === 'DONE' && t.dueDate
      );

      if (doneTasks_.length === 0) return null;

      const onTimeCnt = doneTasks_.filter(t => {
        // updatedAt is the completion timestamp; dueDate is the deadline
        const dueDate = new Date(t.dueDate + 'T23:59:59');
        const completedDate = t.updatedAt ? new Date(t.updatedAt) : new Date();
        return completedDate <= dueDate;
      }).length;

      const pct = Math.round((onTimeCnt / doneTasks_.length) * 100);
      return {
        label: u.name.split(' ')[0],
        value: pct,
        onTime: onTimeCnt,
        total: doneTasks_.length,
      };
    })
    .filter(Boolean);

  // Global on-time percentage
  const allDoneWithDue = tasks.filter(t => t.status === 'DONE' && t.dueDate);
  const allOnTime = allDoneWithDue.filter(t => {
    const dueDate = new Date(t.dueDate + 'T23:59:59');
    const completedDate = t.updatedAt ? new Date(t.updatedAt) : new Date();
    return completedDate <= dueDate;
  }).length;
  const globalOnTimePct = allDoneWithDue.length > 0
    ? Math.round((allOnTime / allDoneWithDue.length) * 100)
    : 0;

  // ── REQUIREMENT: Bugs created vs resolved (from bugs table) ──
  // Filter bugs to only those associated with tasks in the current sprint
  const bugs = allBugs.filter(b => sprintTaskIds.has(b.taskId));
  const bugsCreated  = bugs.length;
  const bugsResolved = bugs.filter(b => b.solvedBy != null).length;
  const bugsOpen     = bugs.filter(b => b.solvedBy == null).length;
  const bugResolvePct = bugsCreated > 0
    ? Math.round((bugsResolved / bugsCreated) * 100)
    : 0;

  // Defect density: bugs per finished task
  const finishedTasks = tasks.filter(t => t.status === 'DONE').length;
  const defectDensity = finishedTasks > 0
    ? Math.round((bugsCreated / finishedTasks) * 100) / 100
    : 0;

  // Bugs reported per developer (who reported them)
  const bugsReportedByMember = users
    .filter(u => u.role === 'DEVELOPER')
    .map(u => {
      const reported = bugs.filter(b => String(b.reportedBy) === String(u.oracleId)).length;
      const solved = bugs.filter(b => String(b.solvedBy) === String(u.oracleId)).length;
      return {
        label: u.name.split(' ')[0],
        reported,
        solved,
      };
    })
    .filter(d => d.reported > 0 || d.solved > 0);

  // Bugs per task (for the tasks that have bugs — defect density view)
  const bugsPerTask = tasks
    .filter(t => t.status === 'DONE')
    .map(t => {
      const count = bugs.filter(b => b.taskId === t.taskId).length;
      return { label: t.taskName.length > 20 ? t.taskName.slice(0, 20) + '…' : t.taskName, value: count };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

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

          {/* ── ON-TIME COMPLETION (Luisa requirement 1) ──────────── */}
          <div className="AN-grid" style={{ gridTemplateColumns: '260px 1fr' }}>

            {/* Global on-time ring */}
            <div className="AN-card AN-card--ring">
              <div className="AN-card-label">ON-TIME DELIVERY</div>
              <div className="AN-card-title">Completed Before Due Date</div>
              <div className="AN-ring-wrap">
                <ProgressRing
                  percent={globalOnTimePct}
                  size={150}
                  stroke={13}
                  color="#4C825C"
                />
              </div>
              <div className="AN-ring-meta">
                <span><strong>{allOnTime}</strong> of <strong>{allDoneWithDue.length}</strong> tasks on time</span>
              </div>
            </div>

            {/* Per-developer on-time bar chart */}
            <div className="AN-card">
              <div className="AN-card-label">ON-TIME RATE</div>
              <div className="AN-card-title">% ON TIME PER DEVELOPER</div>
              {onTimeByMember.length === 0 ? (
                <div className="AN-empty">No completed tasks with due dates yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  {onTimeByMember.map((dev, i) => (
                    <div key={i} className="AN-breakdown-row">
                      <span className="AN-breakdown-label" style={{ color: '#1E3224', width: 70 }}>
                        {dev.label}
                      </span>
                      <div className="AN-breakdown-track" style={{ height: 14 }}>
                        <div
                          className="AN-breakdown-fill"
                          style={{
                            width: `${dev.value}%`,
                            background: dev.value >= 75 ? '#4C825C' : dev.value >= 50 ? '#F1B13F' : '#C74634',
                            borderRadius: 999,
                          }}
                        />
                      </div>
                      <span style={{
                        width: 70, textAlign: 'right', fontSize: 12, fontWeight: 900, flexShrink: 0,
                        color: dev.value >= 75 ? '#4C825C' : dev.value >= 50 ? '#F1B13F' : '#C74634',
                      }}>
                        {dev.value}%
                      </span>
                      <span style={{
                        fontSize: 11, color: 'rgba(30,50,36,0.45)', whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        ({dev.onTime}/{dev.total})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── BUGS CREATED vs RESOLVED (from bugs table) ──── */}
          <div className="AN-grid" style={{ gridTemplateColumns: '260px 1fr' }}>

            {/* Bug resolution ring + defect density */}
            <div className="AN-card AN-card--ring">
              <div className="AN-card-label">BUG RESOLUTION</div>
              <div className="AN-card-title">Bugs Resolved Rate</div>
              <div className="AN-ring-wrap">
                <ProgressRing
                  percent={bugResolvePct}
                  size={150}
                  stroke={13}
                  color="#C74634"
                />
              </div>
              <div className="AN-ring-meta" style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                <span><strong>{bugsResolved}</strong> resolved of <strong>{bugsCreated}</strong> bugs</span>
                {bugsOpen > 0 && (
                  <span style={{ color: '#C74634', fontWeight: 700 }}>
                    {bugsOpen} still open
                  </span>
                )}
              </div>
              {/* Defect density pill */}
              <div style={{
                marginTop: 10, padding: '8px 14px',
                background: 'rgba(199,70,52,0.06)',
                border: '1px solid rgba(199,70,52,0.15)',
                borderRadius: 10, textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.8px', color: 'rgba(30,50,36,0.5)', textTransform: 'uppercase' }}>
                  Defect Density
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#C74634', marginTop: 2 }}>
                  {defectDensity}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(30,50,36,0.45)', fontWeight: 700 }}>
                  bugs per finished task
                </div>
              </div>
            </div>

            {/* Bugs reported vs solved per developer */}
            <div className="AN-card">
              <div className="AN-card-label">BUG TRACKING</div>
              <div className="AN-card-title">BUGS REPORTED VS SOLVED PER DEVELOPER</div>
              {bugsReportedByMember.length === 0 ? (
                <div className="AN-empty">
                  {bugsCreated === 0
                    ? 'No bugs reported in this sprint.'
                    : 'No developer activity on bugs yet.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                  {bugsReportedByMember.map((dev, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1E3224' }}>{dev.label}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Reported bar */}
                        <div className="AN-breakdown-row">
                          <span className="AN-breakdown-label" style={{ width: 65, fontSize: 10, color: '#C74634' }}>
                            Reported
                          </span>
                          <div className="AN-breakdown-track" style={{ height: 12 }}>
                            <div className="AN-breakdown-fill" style={{
                              width: bugsCreated > 0 ? `${(dev.reported / bugsCreated) * 100}%` : '0%',
                              background: '#C74634',
                              minWidth: dev.reported > 0 ? 6 : 0,
                            }} />
                          </div>
                          <span className="AN-breakdown-count" style={{ color: '#C74634' }}>{dev.reported}</span>
                        </div>
                        {/* Solved bar */}
                        <div className="AN-breakdown-row">
                          <span className="AN-breakdown-label" style={{ width: 65, fontSize: 10, color: '#4C825C' }}>
                            Solved
                          </span>
                          <div className="AN-breakdown-track" style={{ height: 12 }}>
                            <div className="AN-breakdown-fill" style={{
                              width: bugsCreated > 0 ? `${(dev.solved / bugsCreated) * 100}%` : '0%',
                              background: '#4C825C',
                              minWidth: dev.solved > 0 ? 6 : 0,
                            }} />
                          </div>
                          <span className="AN-breakdown-count" style={{ color: '#4C825C' }}>{dev.solved}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Summary legend */}
                  <div style={{
                    display: 'flex', gap: 18, justifyContent: 'flex-end',
                    paddingTop: 6, borderTop: '1px solid rgba(30,50,36,0.08)',
                    fontSize: 11, fontWeight: 800,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: '#C74634', display: 'inline-block' }} />
                      <span style={{ color: 'rgba(30,50,36,0.55)' }}>Reported ({bugsCreated})</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: '#4C825C', display: 'inline-block' }} />
                      <span style={{ color: 'rgba(30,50,36,0.55)' }}>Solved ({bugsResolved})</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── DEFECTS PER TASK ──── */}
          {bugsPerTask.length > 0 && (
            <div className="AN-card AN-card--breakdown">
              <div className="AN-card-label">DEFECT DENSITY</div>
              <div className="AN-card-title">BUGS PER FINISHED TASK</div>
              <div className="AN-breakdown-bars">
                {bugsPerTask.map((item, i) => (
                  <div key={i} className="AN-breakdown-row">
                    <span className="AN-breakdown-label" style={{ color: '#1E3224', width: 160, fontSize: 11 }}>{item.label}</span>
                    <div className="AN-breakdown-track">
                      <div
                        className="AN-breakdown-fill"
                        style={{
                          width: `${(item.value / Math.max(...bugsPerTask.map(d => d.value))) * 100}%`,
                          background: '#C74634',
                          minWidth: 6,
                        }}
                      />
                    </div>
                    <span className="AN-breakdown-count" style={{ color: '#C74634' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AnalyticsPage;