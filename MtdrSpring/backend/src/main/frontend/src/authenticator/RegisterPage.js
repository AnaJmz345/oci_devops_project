import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function RegisterPage({ onGoLogin }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', mail: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const goLogin = onGoLogin || (() => navigate('/login'));

  const handleRegister = async () => {
    setError('');

    if (!form.name || !form.mail || !form.password) {
      setError('All fields are required.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, mail: form.mail, password: form.password }),
      });

      if (response.status === 201) {
        const userData = await response.json();
        login(userData);
        navigate('/app/overview', { replace: true });
      } else if (response.status === 409) {
        setError('That email is already registered.');
      } else {
        setError('Registration failed.');
      }
    } catch (e) {
      setError('Could not reach the server.');
    }
    setLoading(false);
  };

  return (
    <div className="v-auth">
      <div className="v-auth__panel v-auth__panel--brand">
        <div className="v-auth__card v-auth__card--center">
          <div className="v-auth__sideTitle">ALREADY PART OF<br />VANTAGE?</div>
          <div className="v-auth__sideSubtitle">Sign in into your account!</div>
          <button className="v-btn v-btn--outline" type="button" onClick={goLogin}>
            SIGN IN
          </button>
        </div>
      </div>

      <div className="v-auth__panel v-auth__panel--form">
        <div className="v-auth__card">
          <div className="v-auth__welcome">WELCOME TO</div>
          <div className="v-auth__brand v-auth__brand--red">VANTAGE</div>
          <h1 className="v-auth__title">SIGN UP</h1>

          <div className="v-auth__fields">
            <input
              className="v-input"
              name="name"
              placeholder="NAME..."
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
            />
            <input
              className="v-input"
              name="mail"
              placeholder="ORACLE ID / MAIL..."
              value={form.mail}
              onChange={handleChange}
              autoComplete="email"
            />
            <input
              className="v-input"
              name="password"
              type="password"
              placeholder="PASSWORD..."
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            <input
              className="v-input"
              name="confirmPassword"
              type="password"
              placeholder="CONFIRM PASSWORD..."
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            />
          </div>

          {error ? <div className="v-auth__error">{error}</div> : null}

          <button className="v-btn v-btn--primary" type="button" onClick={handleRegister} disabled={loading}>
            {loading ? 'SIGNING UP…' : 'SIGN UP'}
          </button>

          <div className="v-auth__hint">
            Oracle ID not working? <button className="v-linkBtn" type="button">Contact admin</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
