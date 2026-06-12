import React from 'react';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Button } from '@mui/material';
import { useAuth } from './authenticator/AuthContext';

function VantageSidebar({
  activePage,
  setActivePage,
  setIsSidebarOpen,
  isProjectsOpen,
  setIsProjectsOpen,
  isProjectOpen,
  setIsProjectOpen,
  isTeamsOpen,
  setIsTeamsOpen,
  searchQuery,
  setSearchQuery,
  projectPages,
  activeProjectName,
  activeTeamName,
}) {
  const { user, logout } = useAuth();

  return (
    <aside className="VantageSidebar" data-testid="vantage-sidebar">
      <div className="VantageSidebarHeader">
        <div className="VantageBrandName">VANTAGE</div>
        <button
          type="button"
          className="VantageIconButton"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Hide sidebar"
          title="Hide sidebar"
        >
          ⟨
        </button>
      </div>

      <div className="VantageSearchWrap">
        <input
          className="VantageSearch"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for projects or teams…"
          aria-label="Search for projects or teams"
        />
      </div>

      <div className="VantageSection">
        <button
          type="button"
          className="VantageSectionHeader"
          onClick={() => setIsProjectsOpen(v => !v)}
          aria-expanded={isProjectsOpen}
        >
          <span className="VantageSectionTitle">PROJECTS</span>
          <span className="VantageBadge VantageBadgeRed">1</span>
          <span className="VantageChevron">{isProjectsOpen ? '▾' : '▸'}</span>
        </button>

        {isProjectsOpen && (
          <div className="VantageSectionBody">
            <button
              type="button"
              className="VantageRowButton"
              onClick={() => setIsProjectOpen(v => !v)}
              aria-expanded={isProjectOpen}
            >
              <span className="VantageBadgeMini VantageBadgePurple">01</span>
              <span className="VantageRowText">{activeProjectName}</span>
              <span className="VantageChevron">{isProjectOpen ? '▾' : '▸'}</span>
            </button>

            {isProjectOpen && (
              <div className="VantageNested">
                {projectPages.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`VantagePageLink ${activePage === p.id ? 'is-active' : ''}`}
                    onClick={() => setActivePage(p.id)}
                    title={`Open ${p.label}`}
                    data-testid={`sidebar-link-${p.id}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="VantageSection">
        <button
          type="button"
          className="VantageSectionHeader"
          onClick={() => setIsTeamsOpen(v => !v)}
          aria-expanded={isTeamsOpen}
        >
          <span className="VantageSectionTitle">TEAMS</span>
          <span className="VantageBadge VantageBadgeGreen">1</span>
          <span className="VantageChevron">{isTeamsOpen ? '▾' : '▸'}</span>
        </button>

        {isTeamsOpen && (
          <div className="VantageSectionBody">
            <button type="button" className="VantageRowButton" onClick={() => setActivePage('backlog')}>
              <span className="VantageBadgeMini VantageBadgeAmber">01</span>
              <span className="VantageRowText">{activeTeamName}</span>
            </button>
            <div className="VantageTeamHint">Team screens coming later (placeholder).</div>
          </div>
        )}
      </div>

      <div className="VantageSidebarBottom">
        <button
          type="button"
          className="VantageIconButton"
          title={user?.name || 'Profile'}
          aria-label="Profile"
        >
          <AccountCircleOutlinedIcon fontSize="small" />
        </button>

        <Button variant="contained" size="small" className="VantageLogout" onClick={logout}>
          Logout
        </Button>

        <button
          type="button"
          className="VantageIconButton is-disabled"
          title="Settings (coming soon)"
          aria-label="Settings"
          disabled
        >
          <SettingsOutlinedIcon fontSize="small" />
        </button>
      </div>
    </aside>
  );
}

export default VantageSidebar;
