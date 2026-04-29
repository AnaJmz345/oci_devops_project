import React, { useState } from 'react';
import { useAuth } from './AuthContext';

function AuthLanding({ mode = 'login', onModeChange }) {
  const isRegister = mode === 'register';
  const { login } = useAuth();

  const [loginForm, setLoginForm] = useState({ mail: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', mail: '', password: '', confirmPassword: '' });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const goLogin = () => {
    setError('');
    if (onModeChange) onModeChange('login');
  };

  const goRegister = () => {
    setError('');
    if (onModeChange) onModeChange('register');
  };

  const handleLogin = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      if (response.ok) {
        const userData = await response.json();
        login(userData);
      } else if (response.status === 401) {
        setError('Credenciales incorrectas.');
      } else {
        setError('Error al iniciar sesión.');
      }
    } catch {
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setError('');

    if (!registerForm.name || !registerForm.mail || !registerForm.password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          mail: registerForm.mail,
          password: registerForm.password,
        }),
      });

      if (response.status === 201 || response.ok) {
        // Avoid persisting the (hashed) password returned by the register endpoint.
        const loginResponse = await fetch('/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mail: registerForm.mail, password: registerForm.password }),
        });

        if (loginResponse.ok) {
          const userData = await loginResponse.json();
          login(userData);
        } else {
          setError('Registro completado, pero no se pudo iniciar sesión.');
          goLogin();
        }
      } else if (response.status === 409) {
        setError('El correo ya está registrado.');
      } else {
        setError('Error al registrarse.');
      }
    } catch {
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`AuthRoot ${isRegister ? 'is-register' : ''}`}>
      <div className="AuthCard" role="region" aria-label="Authentication">
        <div className="AuthPane AuthPane--login" aria-hidden={isRegister ? 'true' : 'false'}>
          <p className="AuthKicker">WELCOME BACK TO</p>
          <p className="AuthBrand">VANTAGE</p>
          <h1 className="AuthTitle">SIGN IN</h1>

          <form className="AuthForm" onSubmit={handleLogin}>
            <label className="AuthLabel">
              <span className="AuthLabelText">Mail</span>
              <input
                className="AuthInput"
                name="mail"
                autoComplete="email"
                placeholder="MAIL..."
                value={loginForm.mail}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, mail: e.target.value }))}
              />
            </label>

            <label className="AuthLabel">
              <span className="AuthLabelText">Password</span>
              <input
                className="AuthInput"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="PASSWORD..."
                value={loginForm.password}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </label>

            <button className="AuthPrimaryButton" type="submit" disabled={loading}>
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>

            {error && !isRegister && <p className="AuthError">{error}</p>}
          </form>
        </div>

        <div className="AuthPane AuthPane--register" aria-hidden={!isRegister ? 'true' : 'false'}>
          <p className="AuthKicker">WELCOME TO</p>
          <p className="AuthBrand">VANTAGE</p>
          <h1 className="AuthTitle">SIGN UP</h1>

          <form className="AuthForm" onSubmit={handleRegister}>
            <label className="AuthLabel">
              <span className="AuthLabelText">Name</span>
              <input
                className="AuthInput"
                name="name"
                autoComplete="name"
                placeholder="NAME..."
                value={registerForm.name}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </label>

            <label className="AuthLabel">
              <span className="AuthLabelText">Mail</span>
              <input
                className="AuthInput"
                name="mail"
                autoComplete="email"
                placeholder="MAIL..."
                value={registerForm.mail}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, mail: e.target.value }))}
              />
            </label>

            <label className="AuthLabel">
              <span className="AuthLabelText">Password</span>
              <input
                className="AuthInput"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="PASSWORD..."
                value={registerForm.password}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </label>

            <label className="AuthLabel">
              <span className="AuthLabelText">Confirm password</span>
              <input
                className="AuthInput"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="CONFIRM PASSWORD..."
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </label>

            <button className="AuthPrimaryButton" type="submit" disabled={loading}>
              {loading ? 'SIGNING UP...' : 'SIGN UP'}
            </button>

            {error && isRegister && <p className="AuthError">{error}</p>}
          </form>
        </div>

        <div className="AuthOverlay">
          <div className="AuthOverlayInner">
            {isRegister ? (
              <>
                <h2 className="AuthOverlayTitle">
                  ALREADY PART OF<br />
                  <span className="AuthOverlayEm">VANTAGE?</span>
                </h2>
                <p className="AuthOverlaySubtitle">Sign in into your account!</p>
                <button className="AuthOverlayButton" type="button" onClick={goLogin} disabled={loading}>
                  SIGN IN
                </button>
              </>
            ) : (
              <>
                <h2 className="AuthOverlayTitle">
                  NEW TO<br />
                  <span className="AuthOverlayEm">VANTAGE?</span>
                </h2>
                <p className="AuthOverlaySubtitle">Sign up and start managing your project!</p>
                <button className="AuthOverlayButton" type="button" onClick={goRegister} disabled={loading}>
                  SIGN UP
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLanding;
