import React from 'react';

function VantageTopbar({
  isSidebarOpen,
  setIsSidebarOpen,
  pageTitle,
  activeProjectName,
  activeTeamName,
  activeSprintLabel,
  activeSprintId,
  setActiveSprintId,
  sprintOptions,
  userName,
}) {
  return (
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
            {userName && <span> • 👤 {userName}</span>}
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
            aria-label="Sprint Filter"
            title="Filter by sprint"
            data-testid="sprint-filter"
          >
            {sprintOptions.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <span className="VantageSprintChevron">▾</span>
        </div>
      </div>
    </header>
  );
}

export default VantageTopbar;
