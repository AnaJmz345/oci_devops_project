import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SearchIcon from '@mui/icons-material/Search';

import { useAuth } from '../authenticator/AuthContext';
import SprintSelector from '../sprint/SprintSelector';

function SidebarLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `v-sidebar__link${isActive ? ' v-sidebar__link--active' : ''}`
      }
      end
    >
      {children}
    </NavLink>
  );
}

export default function VantageLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const projectName = 'SIXTH SEMESTER PROJECT';
  const teamName = 'TEAM 14';

  // If the user logs out while on an app route, push to login.
  React.useEffect(() => {
    if (!user) navigate('/login', { replace: true, state: { from: location.pathname } });
  }, [user, navigate, location.pathname]);

  return (
    <div className="v-layout">
      <aside className="v-sidebar">
        <div className="v-sidebar__brand">
          <div className="v-sidebar__logo">VANTAGE</div>
          <div className="v-sidebar__pill" title="Collapse placeholder">▮▮</div>
        </div>

        <div className="v-sidebar__search">
          <SearchIcon fontSize="small" />
          <input aria-label="Search" placeholder="Search for…" />
        </div>

        <div className="v-sidebar__section">
          <div className="v-sidebar__sectionTitle">PROJECTS</div>
          <div className="v-sidebar__project active">
            <span className="v-sidebar__projectBadge">14</span>
            <span className="v-sidebar__projectName">SIXTH SEMESTER…</span>
          </div>

          <nav className="v-sidebar__nav">
            <SidebarLink to="/app/overview">OVERVIEW</SidebarLink>
            <SidebarLink to="/app/backlog">BACKLOG</SidebarLink>
            <SidebarLink to="/app/board">BOARD</SidebarLink>
            <SidebarLink to="/app/calendar">CALENDAR</SidebarLink>
            <SidebarLink to="/app/chatbot">CHATBOT</SidebarLink>
          </nav>
        </div>

        <div className="v-sidebar__section" style={{ marginTop: 'auto' }}>
          <div className="v-sidebar__sectionTitle">TEAMS</div>
          <div className="v-sidebar__muted">(placeholder)</div>
        </div>

        <div className="v-sidebar__footer">
          <div className="v-sidebar__user" title={user?.mail || ''}>
            <div className="v-avatar">{(user?.name || 'U').slice(0, 1).toUpperCase()}</div>
            <div className="v-sidebar__userMeta">
              <div className="v-sidebar__userName">{user?.name || 'User'}</div>
              <div className="v-sidebar__userSub">{user?.role || 'Member'}</div>
            </div>
          </div>
          <button className="v-btn v-btn--danger" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="v-main">
        <header className="v-topbar">
          <div className="v-topbar__left">
            <div className="v-topbar__title">{projectName}</div>
            <span className="v-topbar__team">{teamName}</span>
          </div>

          <div className="v-topbar__right">
            <SprintSelector />
            <button className="v-iconBtn" aria-label="Notifications (placeholder)">
              <NotificationsNoneIcon />
            </button>
          </div>
        </header>

        <div className="v-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
