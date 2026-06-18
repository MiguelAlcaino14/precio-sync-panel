import { useState } from 'react';
import { setToken } from '../api';
import { C, F, shadow } from '../theme';

export default function Login({ onLogin }) {
  const [usuario,  setUsuario]  = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL || '';
      const res  = await fetch(`${base}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ usuario, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al iniciar sesión'); return; }
      setToken(data.token);
      onLogin();
    } catch {
      setError('Error de conexión con la API');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
    }}>
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '40px 44px',
        width: 360,
        boxShadow: shadow.sm,
      }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text, fontFamily: F.sans, letterSpacing: '-0.02em' }}>
            Precio Sync
          </p>
          <p style={{ margin: '5px 0 0', fontSize: 13, color: C.textSec, fontFamily: F.sans }}>
            Ingresa con tu cuenta de operador
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: F.sans }}>
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              autoComplete="username"
              required
              style={{
                padding: '9px 12px',
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontSize: 13,
                color: C.text,
                background: '#f8fafc',
                fontFamily: F.sans,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: F.sans }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{
                padding: '9px 12px',
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontSize: 13,
                color: C.text,
                background: '#f8fafc',
                fontFamily: F.sans,
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 12, color: C.red, fontFamily: F.sans }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              cursor: loading ? 'default' : 'pointer',
              border: 'none',
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 6,
              background: loading ? C.border : C.accent,
              color: loading ? C.textMuted : '#ffffff',
              fontFamily: F.sans,
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
