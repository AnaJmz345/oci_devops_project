import React from 'react';

function OverviewTab({ activeProjectName, activeSprintLabel }) {
  return (
    <div className="VantagePage">
      <div className="VantagePageHeader">
        <h1 className="VantageH1">Overview</h1>
        <div className="VantageMuted">Placeholder manager dashboard (no data wired yet).</div>
        <div className="VantageMuted">Project: {activeProjectName} • Sprint: {activeSprintLabel}</div>
      </div>
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

export default OverviewTab;