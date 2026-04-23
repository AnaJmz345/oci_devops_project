import React, { useState } from 'react';

function RegisterTest() {
  const [form, setForm] = useState({
    mail: '',
    name: '',
    password: '',
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setMensaje('');
    setError('');
    try {
      const response = await fetch('/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (response.status === 201) {
        setMensaje('✅ Usuario registrado correctamente en la BD!');
      } else if (response.status === 409) {
        setError('⚠️ El correo ya está registrado.');
      } else {
        const text = await response.text();
        setError('❌ Error: ' + text);
      }
    } catch (e) {
      setError('❌ No se pudo conectar al servidor: ' + e.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h2>🧪 Test Registro VANTAGE_USER</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Nombre</label><br />
        <input name="name" value={form.name} onChange={handleChange}
          style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Mail</label><br />
        <input name="mail" value={form.mail} onChange={handleChange}
          style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Password</label><br />
        <input name="password" type="password" value={form.password} onChange={handleChange}
          style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>
      <button onClick={handleSubmit}
        style={{ width: '100%', padding: 10, background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontSize: 16 }}>
        Registrar
      </button>
      {mensaje && <p style={{ color: 'green', marginTop: 12 }}>{mensaje}</p>}
      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
    </div>
  );
}

export default RegisterTest;