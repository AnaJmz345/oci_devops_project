import React, { useState } from 'react';
import { useAuth } from './AuthContext';

function RegisterPage({ onGoLogin }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', mail: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    setError('');
    if (!form.name || !form.mail || !form.password) {
      setError('Todos los campos son obligatorios.'); return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.'); return;
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
        login(userData); // login automático después de registrarse
      } else if (response.status === 409) {
        setError('El correo ya está registrado.');
      } else {
        setError('Error al registrarse.');
      }
    } catch (e) {
      setError('No se pudo conectar al servidor.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      {/* Panel izquierdo - Ir a login */}
      <div style={styles.leftPanel}>
        <h2 style={styles.leftTitle}>ALREADY PART OF<br /><span style={styles.brandWhite}>VANTAGE?</span></h2>
        <p style={styles.leftSubtitle}>Sign in into your account!</p>
        <button style={styles.btnOutline} onClick={onGoLogin}>SIGN IN</button>
      </div>

      {/* Panel derecho - Registro */}
      <div style={styles.rightPanel}>
        <p style={styles.welcomeSmall}>WELCOME TO</p>
        <p style={styles.brandRed}>VANTAGE</p>
        <h1 style={styles.title}>SIGN UP</h1>
        <input style={styles.input} name="name" placeholder="NAME..."
          value={form.name} onChange={handleChange} />
        <input style={styles.input} name="mail" placeholder="MAIL..."
          value={form.mail} onChange={handleChange} />
        <input style={styles.input} name="password" type="password" placeholder="PASSWORD..."
          value={form.password} onChange={handleChange} />
        <input style={styles.input} name="confirmPassword" type="password" placeholder="CONFIRM PASSWORD..."
          value={form.confirmPassword} onChange={handleChange} />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.btnDark} onClick={handleRegister} disabled={loading}>
          {loading ? 'SIGNING UP...' : 'SIGN UP'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', width: '100vw', height: '100vh', fontFamily: 'sans-serif' },
  leftPanel: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', background: '#C0392B', padding: '2rem', color: '#fff' },
  rightPanel: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', background: '#fff', padding: '2rem' },
  leftTitle: { fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', margin: '0 0 1rem' },
  brandWhite: { color: '#fff' },
  leftSubtitle: { marginBottom: '2rem', textAlign: 'center' },
  btnOutline: { padding: '12px 32px', background: 'transparent', color: '#fff',
    border: '2px solid #fff', borderRadius: 4, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  welcomeSmall: { margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: '#333' },
  brandRed: { margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#C0392B' },
  title: { fontSize: '3rem', fontWeight: 'bold', margin: '0.5rem 0 1.5rem', color: '#222' },
  input: { width: '70%', padding: '12px 16px', margin: '6px 0', background: '#eee',
    border: 'none', borderRadius: 4, fontSize: '0.9rem', outline: 'none' },
  btnDark: { width: '70%', padding: '12px', background: '#C0392B', color: '#fff',
    border: 'none', borderRadius: 4, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' },
  error: { color: 'red', fontSize: '0.85rem', margin: '0.5rem 0' },
};

export default RegisterPage;