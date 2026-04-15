import React, { useState, useEffect } from 'react';
import NewItem from './NewItem';
import API_LIST from './API';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, TableBody, CircularProgress } from '@mui/material';

import './vantage.css';

import { useAuth } from './authenticator/AuthContext';
import LoginPage from './authenticator/LoginPage';
import RegisterPage from './authenticator/RegisterPage';

function MainApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('login'); // 'login' o 'register'
  const [activePage, setActivePage] = useState('overview'); // overview | backlog | board | calendar | chatbot | tasks
  const [isLoading, setLoading] = useState(false);
  const [isInserting, setInserting] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState();

  // useEffect SIEMPRE antes de cualquier return condicional
  useEffect(() => {
    if (user) setActivePage('overview');
  }, [user]);

  useEffect(() => {
    if (!user) return; // si no hay usuario no carga items
    if (activePage !== 'tasks') return; // solo cargar tasks en la pantalla legacy

    setLoading(true);
    fetch(API_LIST)
      .then(response => {
        if (response.ok) return response.json();
        else throw new Error('Something went wrong ...');
      })
      .then(
        (result) => { setLoading(false); setItems(result); },
        (error) => { setLoading(false); setError(error); }
      );
  }, [user, activePage]);

  // Si no hay usuario loggeado, mostrar login o registro
  if (!user) {
    if (page === 'register') {
      return <RegisterPage onGoLogin={() => setPage('login')} />;
    }
    return <LoginPage onGoRegister={() => setPage('register')} />;
  }

  // ... resto de funciones igual que antes
  function deleteItem(deleteId) {
    fetch(API_LIST+"/"+deleteId, { method: 'DELETE' })
    .then(response => {
      if (response.ok) return response;
      else throw new Error('Something went wrong ...');
    })
    .then(
      () => { setItems(items.filter(item => item.id !== deleteId)); },
      (error) => { setError(error); }
    );
  }

  function toggleDone(event, id, description, currentDone) {
    event.preventDefault();
    const newDone = currentDone === "DONE" ? "TODO" : "DONE";
    modifyItem(id, description, newDone).then(
      () => { reloadOneItem(id); },
      (error) => { setError(error); }
    );
  }

  function reloadOneItem(id) {
    fetch(API_LIST+"/"+id)
      .then(response => {
        if (response.ok) return response.json();
        else throw new Error('Something went wrong ...');
      })
      .then(
        (result) => {
          const items2 = items.map(x =>
            x.id === id ? { ...x, description: result.description, done: result.done } : x
          );
          setItems(items2);
        },
        (error) => { setError(error); }
      );
  }

  function modifyItem(id, description, done) {
    var data = { "description": description, "done": done };
    return fetch(API_LIST+"/"+id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (response.ok) return response;
      else throw new Error('Something went wrong ...');
    });
  }

  function addItem(taskName, description, storyPoints) {
    setInserting(true);
    var data = { description: taskName, name: description, storyPoints, done: "TODO" };
    fetch(API_LIST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    .then(response => {
      if (response.ok) return response;
      else throw new Error('Something went wrong ...');
    })
    .then(
      (result) => {
        var id = result.headers.get('location');
        var newItem = { id, description: taskName, name: description, storyPoints, done: "TODO" };
        setItems([newItem, ...items]);
        setInserting(false);
      },
      (error) => { setInserting(false); setError(error); }
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'backlog', label: 'Backlog' },
    { id: 'board', label: 'Board' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'chatbot', label: 'Chatbot' },
    { id: 'tasks', label: 'Tasks (legacy)' },
  ];

  const pageTitle = (
    {
      overview: 'Overview',
      backlog: 'Backlog',
      board: 'Board',
      calendar: 'Calendar',
      chatbot: 'Chatbot',
      tasks: 'Tasks (legacy)',
    }[activePage] || 'Overview'
  );

  function PlaceholderHeader({ title, subtitle }) {
    return (
      <div className="VantagePageHeader">
        <h1 className="VantageH1">{title}</h1>
        <div className="VantageMuted">{subtitle}</div>
      </div>
    );
  }

  function OverviewPage() {
    return (
      <div className="VantagePage">
        <PlaceholderHeader
          title="Overview"
          subtitle="Placeholder manager dashboard (no data wired yet)."
        />

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

  function BacklogPage() {
    return (
      <div className="VantagePage">
        <PlaceholderHeader
          title="Backlog"
          subtitle="Placeholder backlog table (no CRUD yet)."
        />

        <div className="VantageCard">
          <div className="VantageCardTitle">Backlog items</div>
          <div className="VantageCardBody">
            <table className="VantageTable">
              <thead>
                <tr>
                  <th style={{ width: '55%' }}>Title</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Points</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Placeholder: Define release scope</td>
                  <td>—</td>
                  <td>TODO</td>
                  <td style={{ textAlign: 'right' }}>—</td>
                </tr>
                <tr>
                  <td>Placeholder: UX review</td>
                  <td>—</td>
                  <td>TODO</td>
                  <td style={{ textAlign: 'right' }}>—</td>
                </tr>
                <tr>
                  <td>Placeholder: API contract</td>
                  <td>—</td>
                  <td>TODO</td>
                  <td style={{ textAlign: 'right' }}>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function BoardPage() {
    return (
      <div className="VantagePage">
        <PlaceholderHeader
          title="Board"
          subtitle="Placeholder kanban board (no drag/drop yet)."
        />

        <div className="VantageBoard">
          <div className="VantageBoardCol">
            <div className="VantageBoardColTitle">TODO</div>
            <div className="VantageBoardCard">Placeholder ticket A</div>
            <div className="VantageBoardCard">Placeholder ticket B</div>
          </div>
          <div className="VantageBoardCol">
            <div className="VantageBoardColTitle">IN PROGRESS</div>
            <div className="VantageBoardCard">Placeholder ticket C</div>
          </div>
          <div className="VantageBoardCol">
            <div className="VantageBoardColTitle">DONE</div>
            <div className="VantageBoardCard">Placeholder ticket D</div>
          </div>
        </div>
      </div>
    );
  }

  function CalendarPage() {
    return (
      <div className="VantagePage">
        <PlaceholderHeader
          title="Calendar"
          subtitle="Placeholder calendar view (no events wired yet)."
        />

        <div className="VantageCard">
          <div className="VantageCardTitle">Upcoming</div>
          <div className="VantageCardBody">Placeholder sprint ceremonies and deadlines.</div>
        </div>
      </div>
    );
  }

  function ChatbotPage() {
    return (
      <div className="VantagePage">
        <PlaceholderHeader
          title="Chatbot"
          subtitle="Placeholder chatbot screen (no AI calls yet)."
        />

        <div className="VantageCard">
          <div className="VantageCardTitle">Assistant</div>
          <div className="VantageCardBody">This area will later host the chat UI.</div>
        </div>
      </div>
    );
  }

  function TasksLegacyPage() {
    return (
      <div className="VantagePage">
        <PlaceholderHeader
          title="Tasks (legacy)"
          subtitle="Original todo list screen kept as-is (useful for quick API smoke-tests)."
        />

        <div className="VantageCard">
          <div className="VantageCardBody">
            <NewItem addItem={addItem} isInserting={isInserting} />
            {error && <p>Error: {error.message}</p>}
            {isLoading && <CircularProgress />}
            {!isLoading &&
              <div id="maincontent">
                <table id="itemlistNotDone" className="itemlist">
                  <TableBody>
                    {items.map(item => (
                      !item.done || item.done === "TODO" ? (
                        <tr key={item.id}>
                          <td className="description">
                            <strong>{item.description}</strong>
                            {item.name && <div style={{ fontSize: '0.85em', color: '#aaa' }}>{item.name}</div>}
                          </td>
                          <td className="date" style={{ whiteSpace: 'nowrap', color: '#aaa', fontSize: '0.85em' }}>
                            {item.storyPoints != null ? `⏱ ${item.storyPoints}h` : ''}
                          </td>
                          <td>
                            <Button
                              variant="contained"
                              className="DoneButton"
                              onClick={(event) => toggleDone(event, item.id, item.description, item.done)}
                              size="small"
                            >
                              Done
                            </Button>
                          </td>
                        </tr>
                      ) : null
                    ))}
                  </TableBody>
                </table>

                <h2 id="donelist">Done items</h2>

                <table id="itemlistDone" className="itemlist">
                  <TableBody>
                    {items.map(item => (
                      item.done === "DONE" ? (
                        <tr key={item.id}>
                          <td className="description">
                            <strong>{item.description}</strong>
                            {item.name && <div style={{ fontSize: '0.85em', color: '#aaa' }}>{item.name}</div>}
                          </td>
                          <td className="date" style={{ whiteSpace: 'nowrap', color: '#aaa', fontSize: '0.85em' }}>
                            {item.storyPoints != null ? `⏱ ${item.storyPoints}h` : ''}
                          </td>
                          <td>
                            <Button
                              variant="contained"
                              className="DoneButton"
                              onClick={(event) => toggleDone(event, item.id, item.description, item.done)}
                              size="small"
                            >
                              Undo
                            </Button>
                          </td>
                          <td>
                            <Button
                              startIcon={<DeleteIcon />}
                              variant="contained"
                              className="DeleteButton"
                              onClick={() => deleteItem(item.id)}
                              size="small"
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ) : null
                    ))}
                  </TableBody>
                </table>
              </div>
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="VantageShell">
      <aside className="VantageSidebar">
        <div className="VantageBrand">
          <div className="VantageBrandName">Vantage</div>
          <div className="VantageBrandTag">Placeholder UI</div>
        </div>

        <nav className="VantageNav">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={
                `VantageNavItem ${activePage === item.id ? 'is-active' : ''}`
              }
              onClick={() => setActivePage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="VantageSidebarFooter">
          <div className="VantageMuted">Signed in as</div>
          <div className="VantageSidebarUser">{user.name}</div>
        </div>
      </aside>

      <div className="VantageMain">
        <header className="VantageTopbar">
          <div>
            <div className="VantageTopbarTitle">{pageTitle}</div>
            <div className="VantageTopbarMeta">Project: Placeholder • Sprint: Placeholder</div>
          </div>
          <div className="VantageTopbarActions">
            <Button variant="contained" size="small" onClick={logout}>Logout</Button>
          </div>
        </header>

        <main className="VantageContent">
          {activePage === 'overview' && <OverviewPage />}
          {activePage === 'backlog' && <BacklogPage />}
          {activePage === 'board' && <BoardPage />}
          {activePage === 'calendar' && <CalendarPage />}
          {activePage === 'chatbot' && <ChatbotPage />}
          {activePage === 'tasks' && <TasksLegacyPage />}
        </main>
      </div>
    </div>
  );
}


export default MainApp;