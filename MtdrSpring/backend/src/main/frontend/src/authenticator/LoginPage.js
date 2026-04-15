import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function LoginPage({ onGoRegister }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ mail: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const goRegister = onGoRegister || (() => navigate('/register'));

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        const userData = await response.json();
        login(userData);
        navigate('/app/overview', { replace: true });
      } else if (response.status === 401) {
        setError('Invalid credentials.');
      } else {
        setError('Login failed.');
      }
    } catch (e) {
      setError('Could not reach the server.');
    }
    setLoading(false);
  };

  return (
    <div className="v-auth">
      <div className="v-auth__panel v-auth__panel--form">
        <div className="v-auth__card">
          <div className="v-auth__welcome">WELCOME BACK TO</div>
          <div className="v-auth__brand v-auth__brand--red">VANTAGE</div>
          <h1 className="v-auth__title">SIGN IN</h1>

          <div className="v-auth__fields">
            <input
              className="v-input"
              name="mail"
              placeholder="ORACLE ID / MAIL..."
              value={form.mail}
              onChange={handleChange}
              autoComplete="username"
            />
            <input
              className="v-input"
              name="password"
              type="password"
              placeholder="PASSWORD..."
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <button className="v-linkBtn" type="button" onClick={() => {}}>
            Forgot password?
          </button>

          {error ? <div className="v-auth__error">{error}</div> : null}

          <button className="v-btn v-btn--primary" type="button" onClick={handleLogin} disabled={loading}>
            {loading ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </div>
      </div>

      <div className="v-auth__panel v-auth__panel--brand">
        <div className="v-auth__card v-auth__card--center">
          <div className="v-auth__sideTitle">NEW TO<br />VANTAGE?</div>
          <div className="v-auth__sideSubtitle">Sign up and start managing your project!</div>
          <button className="v-btn v-btn--outline" type="button" onClick={goRegister}>
            SIGN UP
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
