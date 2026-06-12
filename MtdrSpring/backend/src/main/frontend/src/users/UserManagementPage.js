import React, { useEffect, useState } from 'react';

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    mail: '',
    role: 'DEVELOPER',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchUsers = () => {
    fetch('/users', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then(setUsers)
      .catch(() => setUsers([]));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!form.name || !form.mail || !form.role) {
      setMessage('Complete all fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const text = await response.text();

      if (response.ok) {
        setMessage('User created successfully.');
        setForm({
          name: '',
          mail: '',
          role: 'DEVELOPER',
        });
        fetchUsers();
      } else {
        setMessage(text || 'Could not create user.');
      }
    } catch {
      setMessage('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="UsersPage">
      <div className="UsersHeader">
        <div>
          <h2 className="UsersTitle">Users</h2>
          <p className="UsersSubtitle">Create internal Vantage accounts and assign app roles.</p>
        </div>
      </div>

      <div className="UsersLayout">
        <form className="UsersForm" onSubmit={handleCreateUser}>
          <h3 className="UsersPanelTitle">Create account</h3>

          <label className="UsersField">
            <span>Name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
            />
          </label>

          <label className="UsersField">
            <span>Mail</span>
            <input
              name="mail"
              value={form.mail}
              onChange={handleChange}
              placeholder="user@tec.mx"
            />
          </label>

          <label className="UsersField">
            <span>Role</span>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="DEVELOPER">Developer</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <button className="UsersPrimaryButton" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create user'}
          </button>

          {message && <p className="UsersMessage">{message}</p>}
        </form>

        <div className="UsersTablePanel">
          <h3 className="UsersPanelTitle">Current users</h3>

          <div className="UsersTable">
            <div className="UsersTableHead">
              <span>ID</span>
              <span>Name</span>
              <span>Mail</span>
              <span>Role</span>
            </div>

            {users.map((u) => (
              <div className="UsersTableRow" key={u.oracleId || u.oracle_id}>
                <span>{u.oracleId || u.oracle_id}</span>
                <span>{u.name}</span>
                <span>{u.mail}</span>
                <span>{u.role}</span>
              </div>
            ))}

            {users.length === 0 && (
              <div className="UsersEmpty">No users found.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default UserManagementPage;