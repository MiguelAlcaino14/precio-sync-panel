import { useState, useEffect, useRef } from 'react';
import { C, F, shadow, table, btn } from '../theme';
import { apiFetch } from '../api';

const POR_PAGINA = 20;

const ESTADO_LABEL = { procesado: 'Procesado', procesando: 'Procesando', error: 'Error' };

const estadoBadge = {
  procesado:  { bg: C.greenBg,  color: C.green  },
  procesando: { bg: C.yellowBg, color: C.yellow },
  error:      { bg: C.redBg,    color: C.red    },
};

export default function Historial() {
  const [historial, setHistorial]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [pagina, setPagina]           = useState(1);
  const [filtroProv, setFiltroProv]   = useState(null);
  const pollRef                       = useRef(null);

  async function cargar() {
    try {
      const res  = await apiFetch('/exportar/historial');
      const data = await res.json();
      setHistorial(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => {
    cargar();
  }, []);

  // Polling 15s cuando hay items procesando
  useEffect(() => {
    const hasProcesando = historial.some(h => h.estado === 'procesando');
    if (hasProcesando) {
      pollRef.current = setInterval(cargar, 15_000);
    }
    return () => clearInterval(pollRef.current);
  }, [historial]);

  const proveedores   = [...new Set(historial.map(h => h.proveedor?.nombre).filter(Boolean))].sort();
  const historialFilt = filtroProv ? historial.filter(h => h.proveedor?.nombre === filtroProv) : historial;

  const totalPaginas = Math.ceil(historialFilt.length / POR_PAGINA) || 1;
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio       = (paginaActual - 1) * POR_PAGINA;
  const historialPag = historialFilt.slice(inicio, inicio + POR_PAGINA);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
            Historial de importaciones
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 13, color: C.textSec }}>
            {loading ? 'Cargando...' : `${historialFilt.length}${filtroProv ? ` de ${historial.length}` : ''} importaciones registradas`}
            {!loading && totalPaginas > 1 && (
              <> · página <strong style={{ color: C.text }}>{paginaActual}</strong> de {totalPaginas}</>
            )}
          </p>
        </div>
        <button onClick={cargar} style={{ ...btn.outline, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshIcon /> Actualizar
        </button>
      </div>

      {proveedores.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: F.sans, marginRight: 2 }}>
            PROVEEDOR
          </span>
          <button
            onClick={() => { setFiltroProv(null); setPagina(1); }}
            style={{
              ...btn.outline,
              padding: '5px 12px', fontSize: 12,
              fontWeight: filtroProv === null ? 700 : 500,
              background: filtroProv === null ? C.accent : C.surface,
              color: filtroProv === null ? '#fff' : C.text,
              border: filtroProv === null ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
            }}
          >
            Todos ({historial.length})
          </button>
          {proveedores.map(p => {
            const count  = historial.filter(h => h.proveedor?.nombre === p).length;
            const activo = filtroProv === p;
            return (
              <button
                key={p}
                onClick={() => { setFiltroProv(p); setPagina(1); }}
                style={{
                  ...btn.outline,
                  padding: '5px 12px', fontSize: 12,
                  fontWeight: activo ? 700 : 500,
                  background: activo ? C.accent : C.surface,
                  color: activo ? '#fff' : C.text,
                  border: activo ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                }}
              >
                {p} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: shadow.sm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
          <thead>
            <tr>
              <th style={table.th}>Fecha</th>
              <th style={table.th}>Proveedor</th>
              <th style={table.th}>Archivo</th>
              <th style={table.th}>Estado</th>
              <th style={{ ...table.th, textAlign: 'right' }}>Total</th>
              <th style={{ ...table.th, textAlign: 'right' }}>Matches</th>
              <th style={{ ...table.th, textAlign: 'right' }}>Sin match</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={table.td}>
                      <div style={{ height: 13, background: C.border, borderRadius: 4, animation: 'shimmer 1.4s ease-in-out infinite', width: j === 2 ? '80%' : '60%' }} />
                    </td>
                  ))}
                </tr>
              ))
            )}
            {!loading && historialPag.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...table.td, textAlign: 'center', color: C.textMuted, padding: 40 }}>
                  No se han procesado archivos todavía.
                </td>
              </tr>
            )}
            {!loading && historialPag.map(h => {
              const badge    = estadoBadge[h.estado] || { bg: '#f1f5f9', color: C.textSec };
              const matchPct = h.totalProductos > 0
                ? Math.round((h.matcheados / h.totalProductos) * 100)
                : null;

              return (
                <tr key={h.id} style={{ background: C.surface }}>
                  <td style={{ ...table.td, fontFamily: F.mono, fontSize: 11, color: C.textSec, whiteSpace: 'nowrap' }}>
                    {new Date(h.createdAt).toLocaleString('es-CL')}
                  </td>
                  <td style={{ ...table.td, fontWeight: 500 }}>{h.proveedor?.nombre}</td>
                  <td
                    title={h.nombre}
                    style={{ ...table.td, fontFamily: F.mono, fontSize: 11, color: C.textSec, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {h.nombre}
                  </td>
                  <td style={table.td}>
                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>
                      {ESTADO_LABEL[h.estado] ?? h.estado}
                    </span>
                  </td>
                  <td style={{ ...table.td, fontFamily: F.mono, textAlign: 'right' }}>
                    {h.totalProductos ?? '—'}
                  </td>
                  <td style={{ ...table.td, fontFamily: F.mono, textAlign: 'right' }}>
                    <span style={{ color: h.matcheados > 0 ? C.green : C.textMuted }}>
                      {h.matcheados ?? '—'}
                    </span>
                    {matchPct !== null && (
                      <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 4 }}>({matchPct}%)</span>
                    )}
                  </td>
                  <td style={{ ...table.td, fontFamily: F.mono, textAlign: 'right' }}>
                    <span style={{ color: h.sinMatch > 0 ? C.yellow : C.textMuted }}>
                      {h.sinMatch ?? '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Paginacion paginaActual={paginaActual} totalPaginas={totalPaginas} onChange={setPagina} />
    </div>
  );
}

function Paginacion({ paginaActual, totalPaginas, onChange }) {
  if (totalPaginas <= 1) return null;
  const pagesArr = Array.from({ length: totalPaginas }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPaginas || Math.abs(n - paginaActual) <= 2)
    .reduce((acc, n, i, arr) => {
      if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
      acc.push(n);
      return acc;
    }, []);
  const navBtn = (disabled) => ({
    ...btn.outline, padding: '6px 11px',
    opacity: disabled ? 0.4 : 1,
    ...(disabled && { cursor: 'default' }),
  });
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16 }}>
      <button onClick={() => onChange(1)} disabled={paginaActual === 1} style={{ ...navBtn(paginaActual === 1), padding: '6px 10px' }}>«</button>
      <button onClick={() => onChange(p => Math.max(1, p - 1))} disabled={paginaActual === 1} style={{ ...navBtn(paginaActual === 1), padding: '6px 12px' }}>‹</button>
      {pagesArr.map((n, i) =>
        n === '…' ? (
          <span key={`e-${i}`} style={{ padding: '0 4px', color: C.textMuted, fontSize: 13 }}>…</span>
        ) : (
          <button key={n} onClick={() => onChange(n)} style={{
            ...navBtn(false),
            fontWeight: n === paginaActual ? 700 : 500,
            background: n === paginaActual ? C.accent : C.surface,
            color: n === paginaActual ? '#fff' : C.text,
            border: n === paginaActual ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
          }}>{n}</button>
        )
      )}
      <button onClick={() => onChange(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} style={{ ...navBtn(paginaActual === totalPaginas), padding: '6px 12px' }}>›</button>
      <button onClick={() => onChange(totalPaginas)} disabled={paginaActual === totalPaginas} style={{ ...navBtn(paginaActual === totalPaginas), padding: '6px 10px' }}>»</button>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
    </svg>
  );
}
