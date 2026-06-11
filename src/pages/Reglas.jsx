import { useState, useEffect } from 'react';
import { C, F, shadow } from '../theme';

const vacioForm = { nombre: '', markupPct: '', categoria: '', costoMin: '', costoMax: '', prioridad: '0' };

const thStyle = {
  padding: '10px 14px',
  fontSize: 11,
  fontWeight: 600,
  color: C.textSec,
  textAlign: 'left',
  background: '#f8fafc',
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: 'nowrap',
  fontFamily: F.sans,
};

const tdStyle = {
  padding: '11px 14px',
  fontSize: 13,
  borderBottom: `1px solid ${C.border}`,
  color: C.text,
  verticalAlign: 'middle',
};

const inputStyle = {
  padding: '7px 10px',
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  fontSize: 13,
  width: 140,
  color: C.text,
  background: C.surface,
  fontFamily: F.sans,
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: C.textSec,
};

export default function Reglas() {
  const [reglas, setReglas] = useState([]);
  const [form, setForm]     = useState(vacioForm);

  useEffect(() => {
    fetch('/api/reglas').then(r => r.json()).then(setReglas);
  }, []);

  async function guardar() {
    if (!form.nombre || !form.markupPct) return;
    const body = {
      nombre:    form.nombre,
      markupPct: parseFloat(form.markupPct),
      categoria: form.categoria || null,
      costoMin:  form.costoMin  ? parseFloat(form.costoMin)  : null,
      costoMax:  form.costoMax  ? parseFloat(form.costoMax)  : null,
      prioridad: parseInt(form.prioridad) || 0,
    };
    const res  = await fetch('/api/reglas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setReglas(r => [...r, data]);
    setForm(vacioForm);
  }

  async function eliminar(id) {
    await fetch(`/api/reglas/${id}`, { method: 'DELETE' });
    setReglas(r => r.filter(x => x.id !== id));
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          Reglas de markup
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: 13, color: C.textSec }}>
          Define cómo se calcula el precio de venta a partir del costo. Se aplica la primera regla que coincida (mayor prioridad primero).
        </p>
      </div>

      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '20px 22px',
        marginBottom: 16,
        boxShadow: shadow.sm,
      }}>
        <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: C.text }}>Nueva regla</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Nombre</label>
            <input style={{ ...inputStyle, width: 200 }} value={form.nombre} placeholder="Ej: Bolígrafos"
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Markup %</label>
            <input style={{ ...inputStyle, width: 110 }} type="number" value={form.markupPct} placeholder="47"
              onChange={e => setForm(f => ({ ...f, markupPct: e.target.value }))} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Categoría</label>
            <input style={inputStyle} value={form.categoria} placeholder="Ej: LAVORO"
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Costo mín.</label>
            <input style={{ ...inputStyle, width: 120 }} type="number" value={form.costoMin} placeholder="0"
              onChange={e => setForm(f => ({ ...f, costoMin: e.target.value }))} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Costo máx.</label>
            <input style={{ ...inputStyle, width: 120 }} type="number" value={form.costoMax} placeholder="∞"
              onChange={e => setForm(f => ({ ...f, costoMax: e.target.value }))} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Prioridad</label>
            <input style={{ ...inputStyle, width: 80 }} type="number" value={form.prioridad} placeholder="0"
              onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))} />
          </div>
          <button
            onClick={guardar}
            style={{
              cursor: 'pointer',
              border: 'none',
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 6,
              background: C.accent,
              color: '#ffffff',
              fontFamily: F.sans,
              alignSelf: 'flex-end',
            }}
          >
            Agregar regla
          </button>
        </div>
      </div>

      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: shadow.sm,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
          <thead>
            <tr>
              <th style={thStyle}>Nombre</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Markup</th>
              <th style={thStyle}>Categoría</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Costo mín.</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Costo máx.</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Prioridad</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {reglas.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: C.textMuted, padding: 36 }}>
                  No hay reglas definidas. Agrega una para comenzar.
                </td>
              </tr>
            )}
            {reglas.map(r => (
              <tr key={r.id} style={{ background: C.surface }}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{r.nombre}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: C.accentLight,
                    color: C.accent,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: F.mono,
                  }}>
                    {r.markupPct}%
                  </span>
                </td>
                <td style={{ ...tdStyle, color: C.textSec, fontFamily: F.mono, fontSize: 12 }}>
                  {r.categoria || '—'}
                </td>
                <td style={{ ...tdStyle, fontFamily: F.mono, textAlign: 'right', fontSize: 12, color: C.textSec }}>
                  {r.costoMin ? `$${r.costoMin.toLocaleString('es-CL')}` : '—'}
                </td>
                <td style={{ ...tdStyle, fontFamily: F.mono, textAlign: 'right', fontSize: 12, color: C.textSec }}>
                  {r.costoMax ? `$${r.costoMax.toLocaleString('es-CL')}` : '—'}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', fontFamily: F.mono, fontSize: 12 }}>
                  {r.prioridad}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <button
                    onClick={() => eliminar(r.id)}
                    style={{
                      cursor: 'pointer',
                      border: `1px solid ${C.border}`,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 5,
                      background: 'transparent',
                      color: C.red,
                      fontFamily: F.sans,
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
