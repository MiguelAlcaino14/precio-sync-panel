import { useState, useEffect } from 'react';
import { C, F, shadow } from '../theme';
import { apiFetch } from '../api';

const thStyle = {
  padding: '10px 14px', fontSize: 11, fontWeight: 600, color: C.textSec,
  textAlign: 'left', background: '#f8fafc', borderBottom: `1px solid ${C.border}`,
  whiteSpace: 'nowrap', fontFamily: F.sans,
};
const tdStyle = {
  padding: '12px 14px', fontSize: 13, borderBottom: `1px solid ${C.border}`,
  color: C.text, verticalAlign: 'middle',
};
const solidBtn = {
  cursor: 'pointer', border: 'none', padding: '8px 16px', fontSize: 13,
  fontWeight: 600, borderRadius: 6, background: C.accent, color: '#fff', fontFamily: F.sans,
};
const outlineBtn = {
  cursor: 'pointer', padding: '6px 12px', fontSize: 12, fontWeight: 500,
  borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface,
  color: C.text, fontFamily: F.sans,
};

const ROL_BADGE = {
  admin:    { bg: '#ede9fe', color: '#6d28d9' },
  operador: { bg: '#f0f9ff', color: '#0369a1' },
};

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: C.surface, borderRadius: 12, padding: '28px 32px',
        width: 420, boxShadow: shadow.sm, border: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text, fontFamily: F.sans }}>{title}</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: C.textMuted, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: F.sans }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6,
  fontSize: 13, color: C.text, background: '#f8fafc', fontFamily: F.sans, outline: 'none',
};

export default function Usuarios() {
  const [usuarios, setUsuarios]         = useState([]);
  const [loadingTabla, setLoadingTabla] = useState(true);
  const [modalCrear, setModalCrear]     = useState(false);
  const [modalPass, setModalPass]       = useState(null);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  const [form, setForm] = useState({ nombre: '', email: '', usuario: '', password: '', rol: 'operador' });
  const [newPass, setNewPass] = useState('');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoadingTabla(true);
    try {
      const res  = await apiFetch('/usuarios');
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoadingTabla(false); }
  }

  async function crearUsuario(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUsuarios(u => [...u, data]);
      setModalCrear(false);
      setForm({ nombre: '', email: '', usuario: '', password: '', rol: 'operador' });
    } finally {
      setLoading(false);
    }
  }

  async function cambiarPassword(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await apiFetch(`/usuarios/${modalPass.id}/password`, { method: 'PATCH', body: JSON.stringify({ password: newPass }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setModalPass(null);
      setNewPass('');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActivo(u) {
    const res  = await apiFetch(`/usuarios/${u.id}`, { method: 'PATCH', body: JSON.stringify({ activo: !u.activo }) });
    const data = await res.json();
    if (res.ok) setUsuarios(prev => prev.map(x => x.id === u.id ? data : x));
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
            Usuarios
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 13, color: C.textSec }}>
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => { setError(''); setModalCrear(true); }} style={solidBtn}>
          + Nuevo usuario
        </button>
      </div>

      <div className="scroll-x" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: shadow.sm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
          <thead>
            <tr>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Usuario</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Rol</th>
              <th style={thStyle}>Estado</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loadingTabla && (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={tdStyle}>
                      <div style={{ height: 13, background: C.border, borderRadius: 4, animation: 'shimmer 1.4s ease-in-out infinite', width: j === 0 ? '70%' : '55%' }} />
                    </td>
                  ))}
                </tr>
              ))
            )}
            {!loadingTabla && usuarios.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: C.textMuted, padding: 40 }}>
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
            {!loadingTabla && usuarios.map(u => {
              const badge = ROL_BADGE[u.rol] || ROL_BADGE.operador;
              return (
                <tr key={u.id} style={{ background: u.activo ? C.surface : C.redBg, opacity: u.activo ? 1 : 0.75 }}>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{u.nombre}</td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 12, color: C.textSec }}>{u.usuario}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: C.textSec }}>{u.email}</td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block', padding: '3px 8px', borderRadius: 4,
                      fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color,
                    }}>
                      {u.rol}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: u.activo ? C.greenBg : '#f1f5f9',
                      color: u.activo ? C.green : C.textMuted,
                    }}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => { setError(''); setNewPass(''); setModalPass({ id: u.id, nombre: u.nombre }); }}
                        style={outlineBtn}
                      >
                        Cambiar contraseña
                      </button>
                      <button
                        onClick={() => toggleActivo(u)}
                        style={{
                          ...outlineBtn,
                          color: u.activo ? C.red : C.green,
                          border: `1px solid ${u.activo ? C.red : C.green}`,
                        }}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal crear usuario */}
      {modalCrear && (
        <Modal title="Nuevo usuario" onClose={() => setModalCrear(false)}>
          <form onSubmit={crearUsuario}>
            <Campo label="Nombre completo">
              <input style={inputStyle} required value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </Campo>
            <Campo label="Email">
              <input style={inputStyle} type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </Campo>
            <Campo label="Nombre de usuario">
              <input style={inputStyle} required value={form.usuario}
                onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))} />
            </Campo>
            <Campo label="Contraseña (mínimo 6 caracteres)">
              <input style={inputStyle} type="password" required minLength={6} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </Campo>
            <Campo label="Rol">
              <select style={inputStyle} value={form.rol}
                onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
                <option value="operador">Operador</option>
                <option value="admin">Admin</option>
              </select>
            </Campo>
            {error && <p style={{ margin: '0 0 12px', fontSize: 12, color: C.red }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" onClick={() => setModalCrear(false)} style={outlineBtn}>Cancelar</button>
              <button type="submit" disabled={loading} style={{ ...solidBtn, opacity: loading ? 0.5 : 1 }}>
                {loading ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal cambiar contraseña */}
      {modalPass && (
        <Modal title={`Cambiar contraseña — ${modalPass.nombre}`} onClose={() => setModalPass(null)}>
          <form onSubmit={cambiarPassword}>
            <Campo label="Nueva contraseña (mínimo 6 caracteres)">
              <input style={inputStyle} type="password" required minLength={6} value={newPass}
                onChange={e => setNewPass(e.target.value)} autoFocus />
            </Campo>
            {error && <p style={{ margin: '0 0 12px', fontSize: 12, color: C.red }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" onClick={() => setModalPass(null)} style={outlineBtn}>Cancelar</button>
              <button type="submit" disabled={loading} style={{ ...solidBtn, opacity: loading ? 0.5 : 1 }}>
                {loading ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
