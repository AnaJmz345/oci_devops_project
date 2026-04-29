import React, { useState } from 'react';
import { useAuth } from './AuthContext';


function LoginPage({ onGoRegister }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ mail: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
      } else if (response.status === 401) {
        setError('Credenciales incorrectas.');
      } else {
        setError('Error al iniciar sesión.');
      }
    } catch (e) {
      setError('No se pudo conectar al servidor.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      {/* Panel izquierdo - Login */}
      <div style={styles.leftPanel}>
        <p style={styles.welcomeSmall}>WELCOME BACK TO TU PERDICIOOOONNN</p>
        <p style={styles.brandRed}>VANTAGE</p>
        <h1 style={styles.title}>SIGN IN</h1>
        <input style={styles.input} name="mail" placeholder="MAIL..."
          value={form.mail} onChange={handleChange} />
        <input style={styles.input} name="password" type="password" placeholder="PASSWORD..."
          value={form.password} onChange={handleChange}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        <p style={styles.forgotLink}>Forgot password?</p>
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.btnDark} onClick={handleLogin} disabled={loading}>
          {loading ? 'SIGNING IN...' : 'SIGN IN'}
        </button>
      </div>

      {/* Panel derecho - Ir a registro */}
      <div style={styles.rightPanel}>
        <h2 style={styles.rightTitle}>NEW TO<br /><span style={styles.brandWhite}>VANTAGE?</span></h2>
        <p style={styles.rightSubtitle}>Sign up and start managing your project!</p>
        <button style={styles.btnOutline} onClick={onGoRegister}>SIGN UP</button>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', width: '100vw', height: '100vh', fontFamily: 'sans-serif' },
  leftPanel: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', background: '#fff', padding: '2rem' },
  rightPanel: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', background: '#C0392B', padding: '2rem', color: '#fff' },
  welcomeSmall: { margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: '#333' },
  brandRed: { margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#C0392B' },
  title: { fontSize: '3rem', fontWeight: 'bold', margin: '0.5rem 0 1.5rem', color: '#222' },
  input: { width: '70%', padding: '12px 16px', margin: '6px 0', background: '#eee',
    border: 'none', borderRadius: 4, fontSize: '0.9rem', outline: 'none' },
  forgotLink: { fontSize: '0.8rem', color: '#888', cursor: 'pointer', marginBottom: '1rem' },
  btnDark: { width: '70%', padding: '12px', background: '#C0392B', color: '#fff',
    border: 'none', borderRadius: 4, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  btnOutline: { padding: '12px 32px', background: 'transparent', color: '#fff',
    border: '2px solid #fff', borderRadius: 4, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  rightTitle: { fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', margin: '0 0 1rem' },
  brandWhite: { color: '#fff' },
  rightSubtitle: { marginBottom: '2rem', textAlign: 'center' },
  error: { color: 'red', fontSize: '0.85rem', margin: '0.5rem 0' },
};

export default LoginPage;