import { useState, useEffect } from 'react';
import { C, F, shadow, fmt } from '../theme';
import { apiFetch } from '../api';

const ESTADOS = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobado',  label: 'Aprobados'  },
  { value: 'rechazado', label: 'Rechazados' },
  { value: 'publicado', label: 'Publicados' },
];

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
  letterSpacing: '0.02em',
};

const tdStyle = {
  padding: '11px 14px',
  fontSize: 13,
  borderBottom: `1px solid ${C.border}`,
  color: C.text,
  verticalAlign: 'middle',
};

const solidBtn = {
  cursor: 'pointer',
  border: 'none',
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 6,
  background: C.accent,
  color: '#ffffff',
  fontFamily: F.sans,
};

const outlineBtn = {
  cursor: 'pointer',
  padding: '7px 15px',
  fontSize: 13,
  fontWeight: 500,
  borderRadius: 6,
  border: `1px solid ${C.border}`,
  background: C.surface,
  color: C.text,
  fontFamily: F.sans,
};

const greenBtn = {
  cursor: 'pointer',
  border: 'none',
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 6,
  background: C.green,
  color: '#ffffff',
  fontFamily: F.sans,
};

export default function Cambios() {
  const [cambios, setCambios]           = useState([]);
  const [seleccion, setSeleccion]       = useState({});
  const [preciosEdit, setPreciosEdit]   = useState({});
  const [estado, setEstado]             = useState('pendiente');
  const [loading, setLoading]           = useState(false);
  const [resultPublicar, setResultPublicar] = useState(null);

  useEffect(() => {
    apiFetch(`/cambios?estado=${estado}`)
      .then(r => r.json())
      .then(data => { setCambios(Array.isArray(data) ? data : []); setSeleccion({}); setResultPublicar(null); })
      .catch(() => {});
  }, [estado]);

  function toggleAll(checked) {
    if (checked) setSeleccion(Object.fromEntries(cambios.map(c => [c.id, true])));
    else setSeleccion({});
  }

  function toggleOne(id) {
    setSeleccion(s => ({ ...s, [id]: !s[id] }));
  }

  async function aprobar(idsOverride) {
    const ids = idsOverride ?? Object.keys(seleccion).filter(id => seleccion[id]);
    if (!ids.length) return;
    setLoading(true);
    await apiFetch('/cambios/aprobar', {
      method: 'POST',
      body: JSON.stringify({ ids, preciosVenta: preciosEdit }),
    });
    setCambios(c => c.filter(x => !ids.includes(x.id)));
    setSeleccion({});
    setLoading(false);
  }

  async function aprobarTodo() {
    const ids = cambios.map(c => c.id);
    if (!ids.length) return;
    await aprobar(ids);
  }

  async function publicar() {
    const ids = Object.keys(seleccion).filter(id => seleccion[id]);
    if (!ids.length) return;
    setLoading(true);
    setResultPublicar(null);
    try {
      const res  = await apiFetch('/publicar', {
        method: 'POST',
        body:   JSON.stringify({ ids }),
      });
      const data = await res.json();
      setResultPublicar(data);
      // Remover publicados de la vista
      const idsPublicados = (data.resultados || []).filter(r => r.ok).map(r => r.id);
      setCambios(c => c.filter(x => !idsPublicados.includes(x.id)));
      setSeleccion({});
    } catch {
      setResultPublicar({ error: 'Error de conexión con la API' });
    } finally {
      setLoading(false);
    }
  }

  const selIds = Object.keys(seleccion).filter(id => seleccion[id]);
  const variacion = c => c.costoAnterior
    ? ((c.costoNuevo - c.costoAnterior) / c.costoAnterior * 100).toFixed(1)
    : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
            Cambios de precio
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 13, color: C.textSec }}>
            {cambios.length} registros · estado:{' '}
            <strong style={{ color: C.text }}>{ESTADOS.find(e => e.value === estado)?.label}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {estado === 'pendiente' && (
            <>
              <button onClick={() => window.open('/api/exportar', '_blank')} style={outlineBtn}>
                Exportar CSV
              </button>
              <button
                onClick={aprobar}
                disabled={!selIds.length || loading}
                style={{ ...solidBtn, opacity: (!selIds.length || loading) ? 0.45 : 1, cursor: (!selIds.length || loading) ? 'default' : 'pointer' }}
              >
                {loading ? 'Procesando...' : `Aprobar${selIds.length ? ` (${selIds.length})` : ''}`}
              </button>
              <button
                onClick={aprobarTodo}
                disabled={!cambios.length || loading}
                style={{ ...solidBtn, background: '#0f172a', opacity: (!cambios.length || loading) ? 0.45 : 1, cursor: (!cambios.length || loading) ? 'default' : 'pointer' }}
              >
                {loading ? 'Procesando...' : `Aprobar todo (${cambios.length})`}
              </button>
            </>
          )}
          {estado === 'aprobado' && (
            <button
              onClick={publicar}
              disabled={!selIds.length || loading}
              style={{ ...greenBtn, opacity: (!selIds.length || loading) ? 0.45 : 1, cursor: (!selIds.length || loading) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <JumpsellerIcon />
              {loading ? 'Publicando...' : `Publicar en JumpSeller${selIds.length ? ` (${selIds.length})` : ''}`}
            </button>
          )}
        </div>
      </div>

      {resultPublicar && (
        <ResultadoPublicacion resultado={resultPublicar} onClose={() => setResultPublicar(null)} />
      )}

      <div style={{ display: 'flex', gap: 1, marginBottom: 20, background: C.border, borderRadius: 6, overflow: 'hidden', width: 'fit-content' }}>
        {ESTADOS.map(e => (
          <button
            key={e.value}
            onClick={() => setEstado(e.value)}
            style={{
              cursor: 'pointer',
              border: 'none',
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: estado === e.value ? 600 : 500,
              fontFamily: F.sans,
              background: estado === e.value ? C.surface : '#f1f5f9',
              color: estado === e.value ? C.text : C.textSec,
              transition: 'all 0.1s',
              boxShadow: estado === e.value ? shadow.sm : 'none',
            }}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: shadow.sm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 40 }}>
                <input type="checkbox" onChange={e => toggleAll(e.target.checked)} style={{ accentColor: C.accent }} />
              </th>
              <th style={thStyle}>SKU</th>
              <th style={thStyle}>Producto</th>
              <th style={thStyle}>Proveedor</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Costo anterior</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Costo nuevo</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Variación</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Precio de venta</th>
            </tr>
          </thead>
          <tbody>
            {cambios.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: C.textMuted, padding: 40 }}>
                  No hay registros en este estado.
                </td>
              </tr>
            )}
            {cambios.map(c => {
              const pct  = variacion(c);
              const sube = pct > 0;
              const sel  = !!seleccion[c.id];

              return (
                <tr key={c.id} style={{ background: sel ? '#eff6ff' : C.surface }}>
                  <td style={tdStyle}>
                    <input type="checkbox" checked={sel} onChange={() => toggleOne(c.id)} style={{ accentColor: C.accent }} />
                  </td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 11, color: C.textSec }}>
                    {c.producto.sku}
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {c.producto.nombre}
                  </td>
                  <td style={{ ...tdStyle, color: C.textSec, fontSize: 12 }}>
                    {c.producto.proveedor?.nombre}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, textAlign: 'right', color: C.textSec }}>
                    {c.costoAnterior ? fmt(c.costoAnterior) : '—'}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, textAlign: 'right', fontWeight: 600 }}>
                    {fmt(c.costoNuevo)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {pct ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontSize: 12, fontWeight: 600, fontFamily: F.mono,
                        padding: '2px 7px', borderRadius: 4,
                        background: sube ? C.redBg : C.greenBg,
                        color: sube ? C.red : C.green,
                      }}>
                        {sube ? '▲' : '▼'} {Math.abs(pct)}%
                      </span>
                    ) : (
                      <span style={{ color: C.textMuted }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {estado === 'pendiente' ? (
                      <input
                        type="number"
                        defaultValue={c.precioSugerido ?? ''}
                        onChange={e => setPreciosEdit(p => ({ ...p, [c.id]: Number(e.target.value) }))}
                        style={{
                          width: 110, padding: '5px 8px',
                          background: '#f8fafc', border: `1px solid ${C.border}`,
                          borderRadius: 5, fontSize: 12, fontFamily: F.mono,
                          textAlign: 'right', color: C.text,
                        }}
                      />
                    ) : (
                      <span style={{ fontFamily: F.mono, fontSize: 12 }}>
                        {fmt(c.precioSugerido ?? c.precioActual ?? 0)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultadoPublicacion({ resultado, onClose }) {
  if (resultado.error) {
    return (
      <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: C.redBg, border: `1px solid ${C.red}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: C.red, fontWeight: 500 }}>
          Error: {resultado.error}
        </p>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.red, fontSize: 16 }}>×</button>
      </div>
    );
  }

  const errores = (resultado.resultados || []).filter(r => !r.ok);

  return (
    <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: C.greenBg, border: `1px solid ${C.green}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: C.green }}>
            ✓ {resultado.publicados} producto{resultado.publicados !== 1 ? 's' : ''} publicado{resultado.publicados !== 1 ? 's' : ''} en JumpSeller
          </p>
          {errores.length > 0 && (
            <p style={{ margin: 0, fontSize: 12, color: C.yellow }}>
              {errores.length} con error: {errores.map(e => e.sku).join(', ')}
            </p>
          )}
        </div>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.green, fontSize: 16, lineHeight: 1 }}>×</button>
      </div>
    </div>
  );
}

function JumpsellerIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6M10 14L21 3M21 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6"/>
    </svg>
  );
}
