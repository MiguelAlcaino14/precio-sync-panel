import { useState, useEffect } from 'react';
import { C, F, shadow, table, btn, form as formStyles } from '../theme';
import { apiFetch } from '../api';

const vacioForm = { nombre: '', markupPct: '', marca: '', categoria: '', costoMin: '', costoMax: '', prioridad: '0' };

export default function Reglas() {
  const [reglas, setReglas]       = useState([]);
  const [form, setForm]           = useState(vacioForm);
  const [editandoId, setEditandoId] = useState(null);
  const [feedback, setFeedback]   = useState(null); // { ok, texto }

  useEffect(() => {
    apiFetch('/reglas').then(r => r.json()).then(data => setReglas(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  function abrirEditar(r) {
    setForm({
      nombre:    r.nombre,
      markupPct: String(r.markupPct),
      marca:     r.marca     || '',
      categoria: r.categoria || '',
      costoMin:  r.costoMin  != null ? String(r.costoMin)  : '',
      costoMax:  r.costoMax  != null ? String(r.costoMax)  : '',
      prioridad: String(r.prioridad ?? 0),
    });
    setEditandoId(r.id);
    setFeedback(null);
  }

  function cancelarEdicion() {
    setForm(vacioForm);
    setEditandoId(null);
    setFeedback(null);
  }

  async function guardar() {
    if (!form.nombre || !form.markupPct) {
      setFeedback({ ok: false, texto: 'Nombre y margen son obligatorios.' });
      return;
    }
    const body = {
      nombre:    form.nombre,
      markupPct: parseFloat(form.markupPct),
      marca:     form.marca     || null,
      categoria: form.categoria || null,
      costoMin:  form.costoMin  ? parseFloat(form.costoMin)  : null,
      costoMax:  form.costoMax  ? parseFloat(form.costoMax)  : null,
      prioridad: parseInt(form.prioridad) || 0,
    };
    try {
      if (editandoId) {
        const res  = await apiFetch(`/reglas/${editandoId}`, { method: 'PUT', body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) { setFeedback({ ok: false, texto: data.error || 'Error al actualizar.' }); return; }
        setReglas(rs => rs.map(r => r.id === editandoId ? data : r));
        setFeedback({ ok: true, texto: 'Regla actualizada correctamente.' });
        cancelarEdicion();
      } else {
        const res  = await apiFetch('/reglas', { method: 'POST', body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) { setFeedback({ ok: false, texto: data.error || 'Error al crear.' }); return; }
        setReglas(r => [...r, data]);
        setForm(vacioForm);
        setFeedback({ ok: true, texto: 'Regla agregada correctamente.' });
      }
    } catch {
      setFeedback({ ok: false, texto: 'Error de conexión. Intenta de nuevo.' });
    }
  }

  async function eliminar(id) {
    const regla = reglas.find(r => r.id === id);
    const nombre = regla?.nombre || 'esta regla';
    if (!window.confirm(`¿Eliminar "${nombre}"? Los productos que usan esta regla pasarán a la regla por defecto.`)) return;
    try {
      await apiFetch(`/reglas/${id}`, { method: 'DELETE' });
      setReglas(r => r.filter(x => x.id !== id));
      setFeedback({ ok: true, texto: 'Regla eliminada.' });
    } catch {
      setFeedback({ ok: false, texto: 'Error al eliminar. Intenta de nuevo.' });
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          Reglas de precio de venta
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: 13, color: C.textSec }}>
          Define cómo se calcula el precio de venta a partir del costo. Se aplica la primera regla que coincida (mayor prioridad primero).
        </p>
      </div>

      {feedback && (
        <div style={{
          marginBottom: 12,
          padding: '10px 14px',
          borderRadius: 6,
          background: feedback.ok ? C.greenBg : C.redBg,
          border: `1px solid ${feedback.ok ? C.green : C.red}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: feedback.ok ? C.green : C.red, fontWeight: 500 }}>
            {feedback.texto}
          </span>
          <button onClick={() => setFeedback(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: feedback.ok ? C.green : C.red, fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '20px 22px',
        marginBottom: 16,
        boxShadow: shadow.sm,
      }}>
        <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: C.text }}>
          {editandoId ? 'Editar regla' : 'Nueva regla'}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Nombre</label>
            <input style={{ ...formStyles.input, width: 200 }} value={form.nombre} placeholder="Ej: Bolígrafos"
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Margen de ganancia %</label>
            <input style={{ ...formStyles.input, width: 110 }} type="number" value={form.markupPct} placeholder="47"
              onChange={e => setForm(f => ({ ...f, markupPct: e.target.value }))} />
          </div>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Marca</label>
            <input style={formStyles.input} value={form.marca} placeholder="Ej: Torre"
              onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} />
          </div>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Categoría</label>
            <input style={formStyles.input} value={form.categoria} placeholder="Ej: LAVORO"
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
          </div>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Desde $</label>
            <input style={{ ...formStyles.input, width: 120 }} type="number" value={form.costoMin} placeholder="0"
              onChange={e => setForm(f => ({ ...f, costoMin: e.target.value }))} />
          </div>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Hasta $</label>
            <input style={{ ...formStyles.input, width: 120 }} type="number" value={form.costoMax} placeholder="∞"
              onChange={e => setForm(f => ({ ...f, costoMax: e.target.value }))} />
          </div>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Prioridad</label>
            <input style={{ ...formStyles.input, width: 80 }} type="number" value={form.prioridad} placeholder="0"
              onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
            <button onClick={guardar} style={btn.solid}>
              {editandoId ? 'Guardar cambios' : 'Agregar regla'}
            </button>
            {editandoId && (
              <button onClick={cancelarEdicion} style={btn.outline}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="scroll-x" style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: shadow.sm,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
          <thead>
            <tr>
              <th style={table.th}>Nombre</th>
              <th style={{ ...table.th, textAlign: 'right' }}>Margen de ganancia %</th>
              <th style={table.th}>Marca</th>
              <th style={table.th}>Categoría</th>
              <th style={{ ...table.th, textAlign: 'right' }}>Desde $</th>
              <th style={{ ...table.th, textAlign: 'right' }}>Hasta $</th>
              <th style={{ ...table.th, textAlign: 'center' }}>Prioridad</th>
              <th style={table.th}></th>
            </tr>
          </thead>
          <tbody>
            {reglas.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...table.td, textAlign: 'center', color: C.textMuted, padding: 36 }}>
                  No hay reglas definidas. Agrega una para comenzar.
                </td>
              </tr>
            )}
            {reglas.map(r => (
              <tr key={r.id} style={{ background: editandoId === r.id ? C.rowSelected : C.surface }}>
                <td style={{ ...table.td, fontWeight: 500 }}>{r.nombre}</td>
                <td style={{ ...table.td, textAlign: 'right' }}>
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
                <td style={{ ...table.td, color: C.textSec, fontSize: 12 }}>{r.marca || '—'}</td>
                <td style={{ ...table.td, color: C.textSec, fontFamily: F.mono, fontSize: 12 }}>{r.categoria || '—'}</td>
                <td style={{ ...table.td, fontFamily: F.mono, textAlign: 'right', fontSize: 12, color: C.textSec }}>
                  {r.costoMin ? `$${r.costoMin.toLocaleString('es-CL')}` : '—'}
                </td>
                <td style={{ ...table.td, fontFamily: F.mono, textAlign: 'right', fontSize: 12, color: C.textSec }}>
                  {r.costoMax ? `$${r.costoMax.toLocaleString('es-CL')}` : '—'}
                </td>
                <td style={{ ...table.td, textAlign: 'center', fontFamily: F.mono, fontSize: 12 }}>{r.prioridad}</td>
                <td style={{ ...table.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => abrirEditar(r)}
                    style={{
                      cursor: 'pointer',
                      border: `1px solid ${C.border}`,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 5,
                      background: 'transparent',
                      color: C.textSec,
                      fontFamily: F.sans,
                      marginRight: 6,
                    }}
                  >
                    Editar
                  </button>
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
