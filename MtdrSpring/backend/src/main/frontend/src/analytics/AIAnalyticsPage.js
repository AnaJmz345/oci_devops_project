import React, { useEffect, useState } from 'react';
import ProgressRing from './ProgressRing';
import BarChart from './BarChart';
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

function AIAnalyticsPage({ activeSprintId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/productivity-report?sprintId=${activeSprintId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [activeSprintId]);

  const members = report?.members || [];
  const recommendations = report?.recommendations || [];
  const patterns = report?.patterns || [];
  const kpis = report?.kpiExplanations || [];
  const team = report?.teamSummary;
  const savings = report?.savingsEstimate;

  const memberCompletion = members.map((member) => ({
    label: member.name.split(' ')[0],
    value: member.completionPct,
  }));

  const workloadShare = members.map((member) => ({
    label: member.name.split(' ')[0],
    value: member.workloadSharePct,
  }));

  if (loading) {
    return <div className="AN-loading">Loading AI analytics...</div>;
  }

  if (!report) {
    return (
      <div className="AN-root">
        <div className="AN-card">
          <div className="AN-card-label">AI REPORT</div>
          <div className="AN-card-title">No report available</div>
          <div className="AN-empty">The productivity report could not be loaded for this scope.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="AN-root">
      <div className="AN-header">
        <div>
          <div className="AN-kicker">AI REPORT</div>
          <h1 className="AN-title">AI Analytics</h1>
          <p className="AN-subtitle">Productivity analysis, delivery risks, recommendations, and business impact</p>
        </div>
      </div>

      <div className="AN-intel">
        <div className="AN-intel-main">
          <div className="AN-card-label">EXECUTIVE SUMMARY</div>
          <div className="AN-intel-title">
            <span>Productivity report</span>
          </div>
          <p className="AN-intel-copy">
            A focused operational report for delivery progress, estimation quality, workload distribution, product quality, and business impact.
          </p>
          <div className="AN-intel-score-row">
            <div className="AN-score-block">
              <span className="AN-score-value">{team?.teamProductivityScore || 0}</span>
              <span className="AN-score-label">Team score</span>
            </div>
            <div className="AN-score-block">
              <span className="AN-score-value">{formatMoney(savings?.estimatedMoneySaved)}</span>
              <span className="AN-score-label">Estimated savings</span>
            </div>
            <div className="AN-score-block">
              <span className="AN-score-value">{savings?.estimatedHoursSaved || 0}h</span>
              <span className="AN-score-label">Time saved</span>
            </div>
            <div className="AN-score-block">
              <span className="AN-score-value">{team?.progressPct || 0}%</span>
              <span className="AN-score-label">Delivery progress</span>
            </div>
          </div>
        </div>

        <div className="AN-intel-side">
          {patterns.slice(0, 2).map((item) => (
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

      <div className="AN-grid" style={{ gridTemplateColumns: '260px 1fr 1fr' }}>
        <div className="AN-card AN-card--ring">
          <div className="AN-card-label">TEAM PRODUCTIVITY</div>
          <div className="AN-card-title">{team?.scopeLabel || 'Selected Scope'}</div>
          <div className="AN-ring-wrap">
            <ProgressRing percent={team?.teamProductivityScore || 0} size={150} stroke={13} color="#C74634" />
          </div>
          <div className="AN-ring-meta">
            <span><strong>{team?.doneTasks || 0}</strong> done of <strong>{team?.totalTasks || 0}</strong> tasks</span>
          </div>
        </div>

        <div className="AN-card">
          <div className="AN-card-label">INDIVIDUAL OUTPUT</div>
          <div className="AN-card-title">COMPLETION RATE PER MEMBER</div>
          {memberCompletion.length === 0 ? (
            <div className="AN-empty">No member activity in this scope.</div>
          ) : (
            <BarChart data={memberCompletion} unit="%" color="#C74634" />
          )}
        </div>

        <div className="AN-card">
          <div className="AN-card-label">WORKLOAD BALANCE</div>
          <div className="AN-card-title">LOAD SHARE PER MEMBER</div>
          {workloadShare.length === 0 ? (
            <div className="AN-empty">No workload data available.</div>
          ) : (
            <BarChart data={workloadShare} unit="%" color="#4C825C" />
          )}
        </div>
      </div>

      <div className="AN-card AN-card--breakdown">
        <div className="AN-card-label">ACTIONABLE RECOMMENDATIONS</div>
        <div className="AN-card-title">NEXT BEST ACTIONS</div>
        {recommendations.length === 0 ? (
          <div className="AN-empty">No critical recommendations for the selected scope.</div>
        ) : (
          <div className="AN-recommendation-list">
            {recommendations.map((item) => (
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
          {members.length === 0 ? (
            <div className="AN-empty">No member activity in this scope.</div>
          ) : (
            <div className="AN-member-list">
              {members.slice(0, 8).map((member) => (
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
          <div className="AN-card-label">REPORT METRICS</div>
          <div className="AN-card-title">HOW THE REPORT IS CALCULATED</div>
          <div className="AN-kpi-list">
            {kpis.slice(0, 5).map((kpi) => (
              <div className="AN-kpi-row" key={kpi.key}>
                <div className="AN-kpi-title">{kpi.label}</div>
                <div className="AN-kpi-copy">{kpi.description}</div>
                <div className="AN-kpi-formula">{kpi.formula}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIAnalyticsPage;
