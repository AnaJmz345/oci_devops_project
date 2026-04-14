import React, { useState, useEffect } from 'react';
import NewItem from './NewItem';
import API_LIST from './API';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, TableBody, CircularProgress } from '@mui/material';

import { useAuth } from './authenticator/AuthContext';
import LoginPage from './authenticator/LoginPage';
import RegisterPage from './authenticator/RegisterPage';

function MainApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('login'); // 'login' o 'register'
  const [isLoading, setLoading] = useState(false);
  const [isInserting, setInserting] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState();

  // useEffect SIEMPRE antes de cualquier return condicional
  useEffect(() => {
    if (!user) return; // si no hay usuario no carga items
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
  }, [user]); // depende de user

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



  return (
    <div className="App">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '95%', alignItems: 'center' }}>
        <h1>MY TODO LIST</h1>
        <div>
          <span style={{ marginRight: '1rem', fontSize: '0.85rem' }}>👤 {user.name}</span>
          <Button variant="contained" className="DeleteButton" size="small" onClick={logout}>Logout</Button>
        </div>
      </div>
      <NewItem addItem={addItem} isInserting={isInserting}/>
      { error && <p>Error: {error.message}</p> }
      { isLoading && <CircularProgress /> }
      { !isLoading &&
        <div id="maincontent">
          <table id="itemlistNotDone" className="itemlist">
            <TableBody>
            {items.map(item => (
              !item.done || item.done === "TODO" ? (
              <tr key={item.id}>
                <td className="description">
                  <strong>{item.description}</strong>
                  {item.name && <div style={{fontSize:'0.85em', color:'#aaa'}}>{item.name}</div>}
                </td>
                <td className="date" style={{whiteSpace:'nowrap', color:'#aaa', fontSize:'0.85em'}}>
                  {item.storyPoints != null ? `⏱ ${item.storyPoints}h` : ''}
                </td>
                <td><Button variant="contained" className="DoneButton"
                      onClick={(event) => toggleDone(event, item.id, item.description, item.done)}
                      size="small">Done</Button></td>
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
                  {item.name && <div style={{fontSize:'0.85em', color:'#aaa'}}>{item.name}</div>}
                </td>
                <td className="date" style={{whiteSpace:'nowrap', color:'#aaa', fontSize:'0.85em'}}>
                  {item.storyPoints != null ? `⏱ ${item.storyPoints}h` : ''}
                </td>
                <td><Button variant="contained" className="DoneButton"
                      onClick={(event) => toggleDone(event, item.id, item.description, item.done)}
                      size="small">Undo</Button></td>
                <td><Button startIcon={<DeleteIcon />} variant="contained" className="DeleteButton"
                      onClick={() => deleteItem(item.id)} size="small">Delete</Button></td>
              </tr>
              ) : null
            ))}
            </TableBody>
          </table>
        </div>
      }
    </div>
  );
}


export default MainApp;