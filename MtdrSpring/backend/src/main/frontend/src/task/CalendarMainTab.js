import React from 'react';

function CalendarMainTab({ activeProjectName, activeSprintLabel }) {
  return (
    <div className="VantagePage">
      <div className="VantagePageHeader">
        <h1 className="VantageH1">Calendar</h1>
        <div className="VantageMuted">Placeholder calendar view (no events wired yet).</div>
        <div className="VantageMuted">Project: {activeProjectName} • Sprint: {activeSprintLabel}</div>
      </div>
      <div className="VantageCard">
        <div className="VantageCardTitle">Upcoming</div>
        <div className="VantageCardBody">Placeholder sprint ceremonies and deadlines.</div>
      </div>
    </div>
  );
}

export default CalendarMainTab;