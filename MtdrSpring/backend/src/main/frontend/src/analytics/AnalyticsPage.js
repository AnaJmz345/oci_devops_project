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

  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch('/tasks').then((r) => (r.ok ? r.json() : [])),
      fetch('/tasks/assignees/all').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/users').then((r) => (r.ok ? r.json() : [])),
      fetch('/bugs').then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([fetchedTasks, fetchedAssignees, fetchedUsers, fetchedBugs]) => {
      setAllTasks(fetchedTasks);
      setAllAssignees(fetchedAssignees);
      setUsers(fetchedUsers);
      setAllBugs(fetchedBugs);
    }).finally(() => setLoading(false));
  }, [activeSprintId]);

  const tasks = isAllSprints
    ? allTasks.filter((t) => t.sprintId != null)
    : allTasks.filter((t) => String(t.sprintId) === String(activeSprintId));

  const sprintTaskIds = new Set(tasks.map((t) => t.taskId));
  const assignees = allAssignees.filter((a) => sprintTaskIds.has(a.taskId));

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED').length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const selectedSprint = !isAllSprints
    ? sprints.find((s) => String(s.sprintId) === String(activeSprintId))
    : null;

  const ringLabel = isAllSprints ? 'All Sprints' : (selectedSprint?.sprintName || 'Sprint');
  const ringGoal = isAllSprints ? null : selectedSprint?.goal;

  const tasksByMember = users
    .filter((u) => u.role === 'DEVELOPER')
    .map((u) => {
      const userAssignees = assignees.filter((a) => String(a.oracleId) === String(u.oracleId));
      const userTaskIds = new Set(userAssignees.map((a) => a.taskId));
      const doneCount = tasks.filter((t) => userTaskIds.has(t.taskId) && t.status === 'DONE').length;
      const totalCount = tasks.filter((t) => userTaskIds.has(t.taskId)).length;
      return { label: u.name.split(' ')[0], value: doneCount, total: totalCount };
    })
    .filter((d) => d.total > 0);

  const actualHoursByMember = users
    .filter((u) => u.role === 'DEVELOPER')
    .map((u) => {
      const actual = assignees
        .filter((a) => String(a.oracleId) === String(u.oracleId))
        .reduce((sum, a) => sum + (a.realTimeSpent || 0), 0);
      return { label: u.name.split(' ')[0], value: Math.round(actual * 10) / 10 };
    })
    .filter((d) => d.value > 0);

  const doneTaskIds = new Set(tasks.filter((t) => t.status === 'DONE').map((t) => t.taskId));
  const completedAssignees = assignees.filter((a) =>
    doneTaskIds.has(a.taskId)
    && a.estimatedCompletionTime != null
    && a.estimatedCompletionTime > 0
    && a.realTimeSpent != null
  );

  const totalEstimatedHours = Math.round(
    completedAssignees.reduce((sum, a) => sum + (a.estimatedCompletionTime || 0), 0) * 10
  ) / 10;
  const totalActualHours = Math.round(
    completedAssignees.reduce((sum, a) => sum + (a.realTimeSpent || 0), 0) * 10
  ) / 10;
  const estimateAccuracyPct = totalEstimatedHours > 0
    ? Math.round((totalActualHours / totalEstimatedHours) * 100)
    : 0;
  const estimateDeltaHours = Math.round((totalActualHours - totalEstimatedHours) * 10) / 10;

  const estimatedVsActualByMember = users
    .filter((u) => u.role === 'DEVELOPER')
    .map((u) => {
      const userAssignees = completedAssignees.filter((a) => String(a.oracleId) === String(u.oracleId));
      if (userAssignees.length === 0) return null;

      const estimated = Math.round(
        userAssignees.reduce((sum, a) => sum + (a.estimatedCompletionTime || 0), 0) * 10
      ) / 10;
      const actual = Math.round(
        userAssignees.reduce((sum, a) => sum + (a.realTimeSpent || 0), 0) * 10
      ) / 10;

      return {
        label: u.name.split(' ')[0],
        estimated,
        actual,
        variance: Math.round((actual - estimated) * 10) / 10,
      };
    })
    .filter(Boolean);

  const onTimeByMember = users
    .filter((u) => u.role === 'DEVELOPER')
    .map((u) => {
      const userAssignees = completedAssignees.filter((a) => String(a.oracleId) === String(u.oracleId));
      if (userAssignees.length === 0) return null;

      const withinEstimateCount = userAssignees.filter((a) =>
        (a.realTimeSpent || 0) <= (a.estimatedCompletionTime || 0)
      ).length;

      return {
        label: u.name.split(' ')[0],
        value: Math.round((withinEstimateCount / userAssignees.length) * 100),
        onTime: withinEstimateCount,
        total: userAssignees.length,
      };
    })
    .filter(Boolean);

  const tasksWithinEstimate = completedAssignees.filter((a) =>
    (a.realTimeSpent || 0) <= (a.estimatedCompletionTime || 0)
  ).length;
  const globalOnTimePct = completedAssignees.length > 0
    ? Math.round((tasksWithinEstimate / completedAssignees.length) * 100)
    : 0;

  const bugs = allBugs.filter((b) => sprintTaskIds.has(b.taskId));
  const bugsCreated = bugs.length;
  const bugsResolved = bugs.filter((b) => b.solvedBy != null).length;
  const bugsOpen = bugs.filter((b) => b.solvedBy == null).length;
  const bugResolvePct = bugsCreated > 0
    ? Math.round((bugsResolved / bugsCreated) * 100)
    : 0;

  const finishedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const defectDensity = finishedTasks > 0
    ? Math.round((bugsCreated / finishedTasks) * 100) / 100
    : 0;

  const bugsReportedByMember = users
    .filter((u) => u.role === 'DEVELOPER')
    .map((u) => {
      const reported = bugs.filter((b) => String(b.reportedBy) === String(u.oracleId)).length;
      const solved = bugs.filter((b) => String(b.solvedBy) === String(u.oracleId)).length;
      return {
        label: u.name.split(' ')[0],
        reported,
        solved,
      };
    })
    .filter((d) => d.reported > 0 || d.solved > 0);

  const bugsPerTask = tasks
    .filter((t) => t.status === 'DONE')
    .map((t) => {
      const count = bugs.filter((b) => b.taskId === t.taskId).length;
      return {
        label: t.taskName.length > 20 ? t.taskName.slice(0, 20) + '...' : t.taskName,
        value: count,
      };
    })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const maxMemberHours = Math.max(
    1,
    ...estimatedVsActualByMember.flatMap((item) => [item.estimated, item.actual])
  );

  return (
    <div className="AN-root">
      <div className="AN-header">
        <div>
          <div className="AN-kicker">MANAGER VIEW</div>
          <h1 className="AN-title">Analytics</h1>
          <p className="AN-subtitle">Sprint KPI dashboard - track team performance and progress</p>
        </div>
      </div>

      {loading ? (
        <div className="AN-loading">Loading analytics...</div>
      ) : (
        <>
          <div className="AN-pills-row">
            <StatPill label="Total Tasks" value={totalTasks} color="#1E3224" />
            <StatPill label="Done" value={doneTasks} color="#4C825C" />
            <StatPill label="In Progress" value={inProgress} color="#F1B13F" />
            <StatPill label="To Do" value={todoTasks} color="#2b2dbf" />
            <StatPill label="Blocked" value={blockedTasks} color="#C74634" />
          </div>

          <div className="AN-grid">
            <div className="AN-card AN-card--ring">
              <div className="AN-card-label">SPRINT PROGRESS</div>
              <div className="AN-card-title">{ringLabel}</div>
              {ringGoal && <p className="AN-goal">"{ringGoal}"</p>}
              <div className="AN-ring-wrap">
                <ProgressRing percent={progressPct} size={160} stroke={14} color="#C74634" />
              </div>
              <div className="AN-ring-meta">
                <span><strong>{doneTasks}</strong> done of <strong>{totalTasks}</strong> tasks</span>
              </div>
            </div>

            <div className="AN-card">
              <div className="AN-card-label">TASKS COMPLETED</div>
              <div className="AN-card-title">TASK PER MEMBER</div>
              {tasksByMember.length === 0 ? (
                <div className="AN-empty">No completed tasks yet for this sprint.</div>
              ) : (
                <BarChart data={tasksByMember} unit=" tasks" color="#C74634" />
              )}
            </div>

            <div className="AN-card">
              <div className="AN-card-label">TIME WORKED</div>
              <div className="AN-card-title">ACTUAL HOURS PER MEMBER</div>
              {actualHoursByMember.length === 0 ? (
                <div className="AN-empty">No time logged yet for this sprint.</div>
              ) : (
                <BarChart data={actualHoursByMember} unit="h" color="#4C825C" />
              )}
            </div>
          </div>

          <div className="AN-card AN-card--breakdown">
            <div className="AN-card-label">STATUS BREAKDOWN</div>
            <div className="AN-card-title">TASK BY STATUS</div>
            <div className="AN-breakdown-bars">
              {[
                { label: 'Done', value: doneTasks, color: '#4C825C' },
                { label: 'In Progress', value: inProgress, color: '#F1B13F' },
                { label: 'To Do', value: todoTasks, color: '#2b2dbf' },
                { label: 'Blocked', value: blockedTasks, color: '#C74634' },
              ].map((item) => (
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

          <div className="AN-grid" style={{ gridTemplateColumns: '260px 1fr' }}>
            <div className="AN-card AN-card--ring">
              <div className="AN-card-label">ESTIMATION ACCURACY</div>
              <div className="AN-card-title">Actual vs Estimated</div>
              <div className="AN-ring-wrap">
                <ProgressRing percent={estimateAccuracyPct} size={150} stroke={13} color="#4C825C" />
              </div>
              <div className="AN-ring-meta" style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                <span><strong>{totalActualHours}h</strong> actual vs <strong>{totalEstimatedHours}h</strong> estimated</span>
                <span style={{ color: estimateDeltaHours <= 0 ? '#4C825C' : '#C74634', fontWeight: 700 }}>
                  {estimateDeltaHours <= 0 ? `${Math.abs(estimateDeltaHours)}h under estimate` : `${estimateDeltaHours}h over estimate`}
                </span>
              </div>
            </div>

            <div className="AN-card">
              <div className="AN-card-label">ESTIMATED VS REAL</div>
              <div className="AN-card-title">HOURS PER DEVELOPER</div>
              {estimatedVsActualByMember.length === 0 ? (
                <div className="AN-empty">No completed tasks with estimated and actual hours yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                  {estimatedVsActualByMember.map((dev) => (
                    <div key={dev.label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#1E3224' }}>{dev.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: dev.variance <= 0 ? '#4C825C' : '#C74634' }}>
                          {dev.variance <= 0 ? `${Math.abs(dev.variance)}h under` : `${dev.variance}h over`}
                        </span>
                      </div>
                      <div className="AN-breakdown-row">
                        <span className="AN-breakdown-label" style={{ width: 70, fontSize: 10, color: '#1E3224' }}>
                          Estimated
                        </span>
                        <div className="AN-breakdown-track" style={{ height: 12 }}>
                          <div
                            className="AN-breakdown-fill"
                            style={{
                              width: `${(dev.estimated / maxMemberHours) * 100}%`,
                              background: '#1E3224',
                              minWidth: dev.estimated > 0 ? 6 : 0,
                            }}
                          />
                        </div>
                        <span className="AN-breakdown-count" style={{ color: '#1E3224' }}>{dev.estimated}h</span>
                      </div>
                      <div className="AN-breakdown-row">
                        <span className="AN-breakdown-label" style={{ width: 70, fontSize: 10, color: '#4C825C' }}>
                          Actual
                        </span>
                        <div className="AN-breakdown-track" style={{ height: 12 }}>
                          <div
                            className="AN-breakdown-fill"
                            style={{
                              width: `${(dev.actual / maxMemberHours) * 100}%`,
                              background: '#4C825C',
                              minWidth: dev.actual > 0 ? 6 : 0,
                            }}
                          />
                        </div>
                        <span className="AN-breakdown-count" style={{ color: '#4C825C' }}>{dev.actual}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="AN-grid" style={{ gridTemplateColumns: '260px 1fr' }}>
            <div className="AN-card AN-card--ring">
              <div className="AN-card-label">WITHIN ESTIMATE</div>
              <div className="AN-card-title">Tasks Finished On Time</div>
              <div className="AN-ring-wrap">
                <ProgressRing percent={globalOnTimePct} size={150} stroke={13} color="#4C825C" />
              </div>
              <div className="AN-ring-meta">
                <span><strong>{tasksWithinEstimate}</strong> of <strong>{completedAssignees.length}</strong> tasks within estimate</span>
              </div>
            </div>

            <div className="AN-card">
              <div className="AN-card-label">ESTIMATE HIT RATE</div>
              <div className="AN-card-title">% WITHIN ESTIMATE PER DEVELOPER</div>
              {onTimeByMember.length === 0 ? (
                <div className="AN-empty">No completed tasks with estimated and actual hours yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  {onTimeByMember.map((dev) => (
                    <div key={dev.label} className="AN-breakdown-row">
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
                      <span
                        style={{
                          width: 70,
                          textAlign: 'right',
                          fontSize: 12,
                          fontWeight: 900,
                          flexShrink: 0,
                          color: dev.value >= 75 ? '#4C825C' : dev.value >= 50 ? '#F1B13F' : '#C74634',
                        }}
                      >
                        {dev.value}%
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'rgba(30,50,36,0.45)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        ({dev.onTime}/{dev.total})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="AN-grid" style={{ gridTemplateColumns: '260px 1fr' }}>
            <div className="AN-card AN-card--ring">
              <div className="AN-card-label">BUG RESOLUTION</div>
              <div className="AN-card-title">Bugs Resolved Rate</div>
              <div className="AN-ring-wrap">
                <ProgressRing percent={bugResolvePct} size={150} stroke={13} color="#C74634" />
              </div>
              <div className="AN-ring-meta" style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                <span><strong>{bugsResolved}</strong> resolved of <strong>{bugsCreated}</strong> bugs</span>
                {bugsOpen > 0 && (
                  <span style={{ color: '#C74634', fontWeight: 700 }}>
                    {bugsOpen} still open
                  </span>
                )}
              </div>
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 14px',
                  background: 'rgba(199,70,52,0.06)',
                  border: '1px solid rgba(199,70,52,0.15)',
                  borderRadius: 10,
                  textAlign: 'center',
                }}
              >
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
                  {bugsReportedByMember.map((dev) => (
                    <div key={dev.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1E3224' }}>{dev.label}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div className="AN-breakdown-row">
                          <span className="AN-breakdown-label" style={{ width: 65, fontSize: 10, color: '#C74634' }}>
                            Reported
                          </span>
                          <div className="AN-breakdown-track" style={{ height: 12 }}>
                            <div
                              className="AN-breakdown-fill"
                              style={{
                                width: bugsCreated > 0 ? `${(dev.reported / bugsCreated) * 100}%` : '0%',
                                background: '#C74634',
                                minWidth: dev.reported > 0 ? 6 : 0,
                              }}
                            />
                          </div>
                          <span className="AN-breakdown-count" style={{ color: '#C74634' }}>{dev.reported}</span>
                        </div>
                        <div className="AN-breakdown-row">
                          <span className="AN-breakdown-label" style={{ width: 65, fontSize: 10, color: '#4C825C' }}>
                            Solved
                          </span>
                          <div className="AN-breakdown-track" style={{ height: 12 }}>
                            <div
                              className="AN-breakdown-fill"
                              style={{
                                width: bugsCreated > 0 ? `${(dev.solved / bugsCreated) * 100}%` : '0%',
                                background: '#4C825C',
                                minWidth: dev.solved > 0 ? 6 : 0,
                              }}
                            />
                          </div>
                          <span className="AN-breakdown-count" style={{ color: '#4C825C' }}>{dev.solved}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div
                    style={{
                      display: 'flex',
                      gap: 18,
                      justifyContent: 'flex-end',
                      paddingTop: 6,
                      borderTop: '1px solid rgba(30,50,36,0.08)',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
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

          {bugsPerTask.length > 0 && (
            <div className="AN-card AN-card--breakdown">
              <div className="AN-card-label">DEFECT DENSITY</div>
              <div className="AN-card-title">BUGS PER FINISHED TASK</div>
              <div className="AN-breakdown-bars">
                {bugsPerTask.map((item) => (
                  <div key={item.label} className="AN-breakdown-row">
                    <span className="AN-breakdown-label" style={{ color: '#1E3224', width: 160, fontSize: 11 }}>{item.label}</span>
                    <div className="AN-breakdown-track">
                      <div
                        className="AN-breakdown-fill"
                        style={{
                          width: `${(item.value / Math.max(...bugsPerTask.map((d) => d.value))) * 100}%`,
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
