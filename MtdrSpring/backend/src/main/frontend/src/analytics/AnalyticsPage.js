import React, { useEffect, useState } from 'react';
import ProgressRing from './ProgressRing';
import BarChart from './BarChart';
import GroupedBarChart from './GroupedBarChart';
import './analytics.css';

function SeverityBadge({ severity }) {
  const label = {
    critical: 'Critical',
    warning: 'Watch',
    positive: 'Healthy',
  }[severity] || 'Info';

  return <span className={`AN-severity AN-severity--${severity || 'info'}`}>{label}</span>;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function getOracleId(record) {
  return record?.oracleId ?? record?.oracle_id;
}

function getFirstName(name) {
  return (name || 'Unknown').split(' ')[0];
}

function getSprintNumber(label, id) {
  const labelMatch = String(label || '').match(/sprint\s*#?\s*(\d+)/i);
  if (labelMatch) return Number(labelMatch[1]);

  const idNumber = Number(id);
  return Number.isFinite(idNumber) ? idNumber : Number.MAX_SAFE_INTEGER;
}

function formatSprintLabel(label, id) {
  const sprintNumber = getSprintNumber(label, id);
  return sprintNumber !== Number.MAX_SAFE_INTEGER ? `Sprint ${sprintNumber}` : (label || `Sprint ${id}`);
}

function AnalyticsPage({ sprints, activeSprintId }) {
  const [allTasks, setAllTasks] = useState([]);
  const [allAssignees, setAllAssignees] = useState([]);
  const [users, setUsers] = useState([]);
  const [allBugs, setAllBugs] = useState([]);
  const [productivityReport, setProductivityReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAllSprints = activeSprintId === 'all';

  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch('/tasks').then((r) => (r.ok ? r.json() : [])),
      fetch('/tasks/assignees/all').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/users').then((r) => (r.ok ? r.json() : [])),
      fetch('/bugs').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch(`/productivity-report?sprintId=${activeSprintId}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([fetchedTasks, fetchedAssignees, fetchedUsers, fetchedBugs, fetchedReport]) => {
      setAllTasks(fetchedTasks);
      setAllAssignees(fetchedAssignees);
      setUsers(fetchedUsers);
      setAllBugs(fetchedBugs);
      setProductivityReport(fetchedReport);
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

  const developers = users
    .filter((u) => u.role === 'DEVELOPER')
    .map((u) => ({
      id: String(getOracleId(u)),
      label: getFirstName(u.name),
    }))
    .filter((u) => u.id !== 'undefined' && u.id !== 'null');

  const developerSeries = developers.filter((developer) =>
    assignees.some((a) => String(getOracleId(a)) === developer.id)
  );

  const tasksByMember = developers
    .map((u) => {
      const userAssignees = assignees.filter((a) => String(getOracleId(a)) === u.id);
      const userTaskIds = new Set(userAssignees.map((a) => a.taskId));
      const doneCount = tasks.filter((t) => userTaskIds.has(t.taskId) && t.status === 'DONE').length;
      const totalCount = tasks.filter((t) => userTaskIds.has(t.taskId)).length;
      return { label: u.label, value: doneCount, total: totalCount };
    })
    .filter((d) => d.total > 0);

  const actualHoursByMember = developers
    .map((u) => {
      const actual = assignees
        .filter((a) => String(getOracleId(a)) === u.id)
        .reduce((sum, a) => sum + (a.realTimeSpent || 0), 0);
      return { label: u.label, value: Math.round(actual * 10) / 10 };
    })
    .filter((d) => d.value > 0);

  const sprintIdsWithTasks = new Set(
    tasks
      .map((t) => t.sprintId)
      .filter((id) => id != null)
      .map((id) => String(id))
  );
  const knownSprintGroups = (sprints || [])
    .map((s) => {
      const id = String(s.sprintId ?? s.sprint_id);
      const rawLabel = s.sprintName ?? s.sprint_name ?? `Sprint ${id}`;

      return {
        id,
        label: formatSprintLabel(rawLabel, id),
        sortOrder: getSprintNumber(rawLabel, id),
      };
    })
    .filter((s) => s.id !== 'undefined' && s.id !== 'null');
  const knownSprintIds = new Set(knownSprintGroups.map((s) => s.id));
  const missingSprintGroups = Array.from(sprintIdsWithTasks)
    .filter((id) => !knownSprintIds.has(id))
    .map((id) => ({
      id,
      label: formatSprintLabel(null, id),
      sortOrder: getSprintNumber(null, id),
    }));
  const sprintGroups = [...knownSprintGroups, ...missingSprintGroups]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

  const tasksBySprintAndMember = sprintGroups.map((sprint) => {
    const sprintTasks = tasks.filter((t) => String(t.sprintId) === sprint.id);
    const sprintTaskIdsForGroup = new Set(sprintTasks.map((t) => t.taskId));
    const doneTaskIdsForGroup = new Set(
      sprintTasks.filter((t) => t.status === 'DONE').map((t) => t.taskId)
    );
    const sprintAssignees = assignees.filter((a) => sprintTaskIdsForGroup.has(a.taskId));

    return {
      ...sprint,
      values: developerSeries.map((developer) => ({
        seriesId: developer.id,
        value: sprintAssignees.filter((a) =>
          String(getOracleId(a)) === developer.id && doneTaskIdsForGroup.has(a.taskId)
        ).length,
      })),
    };
  });

  const hoursBySprintAndMember = sprintGroups.map((sprint) => {
    const sprintTasks = tasks.filter((t) => String(t.sprintId) === sprint.id);
    const sprintTaskIdsForGroup = new Set(sprintTasks.map((t) => t.taskId));
    const sprintAssignees = assignees.filter((a) => sprintTaskIdsForGroup.has(a.taskId));

    return {
      ...sprint,
      values: developerSeries.map((developer) => {
        const actual = sprintAssignees
          .filter((a) => String(getOracleId(a)) === developer.id)
          .reduce((sum, a) => sum + (a.realTimeSpent || 0), 0);

        return {
          seriesId: developer.id,
          value: Math.round(actual * 10) / 10,
        };
      }),
    };
  });

  const hasGroupedTaskData = tasksBySprintAndMember.some((group) =>
    group.values.some((item) => item.value > 0)
  );
  const hasGroupedHourData = hoursBySprintAndMember.some((group) =>
    group.values.some((item) => item.value > 0)
  );

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

  const renderProgressCard = () => (
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
  );

  const renderTasksChartCard = () => (
    <div className="AN-card AN-card--grouped-chart">
      <div className="AN-card-label">TASKS COMPLETED</div>
      <div className="AN-card-title">
        {isAllSprints ? 'TASKS PER DEVELOPER / SPRINT' : 'TASKS PER MEMBER'}
      </div>
      {isAllSprints ? (
        hasGroupedTaskData ? (
          <GroupedBarChart
            groups={tasksBySprintAndMember}
            series={developerSeries}
            unit=" tasks"
            yAxisLabel="Tasks"
          />
        ) : (
          <div className="AN-empty">No completed tasks yet for these sprints.</div>
        )
      ) : tasksByMember.length === 0 ? (
        <div className="AN-empty">No completed tasks yet for this sprint.</div>
      ) : (
        <BarChart data={tasksByMember} unit=" tasks" color="#C74634" />
      )}
    </div>
  );

  const renderHoursChartCard = () => (
    <div className="AN-card AN-card--grouped-chart">
      <div className="AN-card-label">TIME WORKED</div>
      <div className="AN-card-title">
        {isAllSprints ? 'ACTUAL HOURS PER DEVELOPER / SPRINT' : 'ACTUAL HOURS PER MEMBER'}
      </div>
      {isAllSprints ? (
        hasGroupedHourData ? (
          <GroupedBarChart
            groups={hoursBySprintAndMember}
            series={developerSeries}
            unit="h"
            yAxisLabel="Hours"
          />
        ) : (
          <div className="AN-empty">No time logged yet for these sprints.</div>
        )
      ) : actualHoursByMember.length === 0 ? (
        <div className="AN-empty">No time logged yet for this sprint.</div>
      ) : (
        <BarChart data={actualHoursByMember} unit="h" color="#4C825C" />
      )}
    </div>
  );

  return (
    <div className="AN-root">
      <div className="AN-header">
        <div>
          <div className="AN-kicker">REPORTS</div>
          <h1 className="AN-title">Productivity Analytics</h1>
          <p className="AN-subtitle">Team performance, delivery quality, workload balance, and savings analysis</p>
        </div>
      </div>

      {loading ? (
        <div className="AN-loading">Loading analytics...</div>
      ) : (
        <>
          {productivityReport && (
            <div className="AN-intel">
              <div className="AN-intel-main">
                <div className="AN-card-label">PRODUCTIVITY REPORT</div>
                <div className="AN-intel-title">
                  <span>Executive performance summary</span>
                </div>
                <p className="AN-intel-copy">
                  A focused operational report for delivery progress, estimation quality, workload distribution, product quality, and business impact.
                </p>
                <div className="AN-intel-score-row">
                  <div className="AN-score-block">
                    <span className="AN-score-value">{productivityReport.teamSummary?.teamProductivityScore || 0}</span>
                    <span className="AN-score-label">Team score</span>
                  </div>
                  <div className="AN-score-block">
                    <span className="AN-score-value">{formatMoney(productivityReport.savingsEstimate?.estimatedMoneySaved)}</span>
                    <span className="AN-score-label">Estimated savings</span>
                  </div>
                  <div className="AN-score-block">
                    <span className="AN-score-value">{productivityReport.savingsEstimate?.estimatedHoursSaved || 0}h</span>
                    <span className="AN-score-label">Time saved</span>
                  </div>
                  <div className="AN-score-block">
                    <span className="AN-score-value">{productivityReport.teamSummary?.progressPct || progressPct}%</span>
                    <span className="AN-score-label">Delivery progress</span>
                  </div>
                </div>
              </div>

              <div className="AN-intel-side">
                {(productivityReport.patterns || []).slice(0, 2).map((item) => (
                  <div className="AN-insight" key={item.type}>
                    <div className="AN-insight-head">
                      <SeverityBadge severity={item.severity} />
                    </div>
                    <div className="AN-insight-title">{item.title}</div>
                    <div className="AN-insight-copy">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAllSprints ? (
            <div className="AN-sprint-summary-grid">
              {renderProgressCard()}
              <div className="AN-sprint-summary-charts">
                {renderTasksChartCard()}
                {renderHoursChartCard()}
              </div>
            </div>
          ) : (
            <div className="AN-grid">
              {renderProgressCard()}
              {renderTasksChartCard()}
              {renderHoursChartCard()}
            </div>
          )}

          <div className="AN-card AN-card--breakdown">
            <div className="AN-card-label">DELIVERY MIX</div>
            <div className="AN-card-title">WORK STATUS DISTRIBUTION</div>
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

          {productivityReport && (
            <>
              <div className="AN-card AN-card--breakdown">
                <div className="AN-card-label">ACTIONABLE RECOMMENDATIONS</div>
                <div className="AN-card-title">NEXT BEST ACTIONS</div>
                {(productivityReport.recommendations || []).length === 0 ? (
                <div className="AN-empty">No critical recommendations for the selected scope.</div>
                ) : (
                  <div className="AN-recommendation-list">
                    {productivityReport.recommendations.map((item) => (
                      <div className="AN-recommendation" key={item.type}>
                        <SeverityBadge severity={item.severity} />
                        <div>
                          <div className="AN-recommendation-title">{item.title}</div>
                          <div className="AN-recommendation-copy">{item.recommendation}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="AN-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="AN-card">
                  <div className="AN-card-label">INDIVIDUAL ANALYSIS</div>
                  <div className="AN-card-title">MEMBER PRODUCTIVITY</div>
                  {(productivityReport.members || []).length === 0 ? (
                    <div className="AN-empty">No member activity in this scope.</div>
                  ) : (
                    <div className="AN-member-list">
                      {productivityReport.members.slice(0, 6).map((member) => (
                        <div className="AN-member-row" key={member.oracleId}>
                          <div>
                            <div className="AN-member-name">{member.name}</div>
                            <div className="AN-member-summary">{member.summary}</div>
                          </div>
                          <div className="AN-member-metrics">
                            <span>{member.doneTasks}/{member.assignedTasks} done</span>
                            <span>{member.workloadSharePct}% load</span>
                            <span className={member.varianceHours <= 0 ? 'AN-good' : 'AN-risk'}>
                              {member.varianceHours}h delta
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="AN-card">
                  <div className="AN-card-label">KPI EXPLANATION</div>
                  <div className="AN-card-title">REPORT METRICS</div>
                  <div className="AN-kpi-list">
                    {(productivityReport.kpiExplanations || []).slice(0, 5).map((kpi) => (
                      <div className="AN-kpi-row" key={kpi.key}>
                        <div className="AN-kpi-title">{kpi.label}</div>
                        <div className="AN-kpi-copy">{kpi.description}</div>
                        <div className="AN-kpi-formula">{kpi.formula}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default AnalyticsPage;
