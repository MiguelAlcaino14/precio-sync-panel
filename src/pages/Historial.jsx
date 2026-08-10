import { useState, useEffect, useRef } from 'react';
import { C, F, shadow, table, btn } from '../theme';
import { apiFetch } from '../api';
import Paginacion from '../components/Paginacion';

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
  const [porPagina, setPorPagina]     = useState(20);
  const [filtroProv, setFiltroProv]   = useState(null);
  const [pollDelay, setPollDelay]     = useState(5_000);
  const pollTimerRef                  = useRef(null);

  async function cargar() {
    try {
      const res  = await apiFetch('/exportar/historial');
      const data = await res.json();
      setHistorial(Array.isArray(data) ? data : []);
      setPollDelay(5_000); // reset en éxito
    } catch {
      setPollDelay(d => Math.min(d * 2, 60_000)); // backoff hasta 60s
    } finally { setLoading(false); }
  }

  useEffect(() => {
    cargar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    pollTimerRef.current = setTimeout(cargar, pollDelay);
    return () => clearTimeout(pollTimerRef.current);
  }, [pollDelay]); // eslint-disable-line react-hooks/exhaustive-deps

  const proveedores   = [...new Set(historial.map(h => h.proveedor?.nombre).filter(Boolean))].sort();
  const historialFilt = filtroProv ? historial.filter(h => h.proveedor?.nombre === filtroProv) : historial;

  const totalPaginas = Math.ceil(historialFilt.length / porPagina) || 1;
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio       = (paginaActual - 1) * porPagina;
  const historialPag = historialFilt.slice(inicio, inicio + porPagina);

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

      <div className="scroll-x" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: shadow.sm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
          <thead>
            <tr>
              <th style={table.th}>Fecha</th>
              <th style={table.th}>Proveedor</th>
              <th style={table.th}>Archivo</th>
              <th style={table.th}>Estado</th>
              <th style={table.th}>Error</th>
              <th style={{ ...table.th, textAlign: 'right' }}>Total</th>
              <th style={{ ...table.th, textAlign: 'right' }}>Matches</th>
              <th style={{ ...table.th, textAlign: 'right' }}>Sin match</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} style={table.td}>
                      <div style={{ height: 13, background: C.border, borderRadius: 4, animation: 'shimmer 1.4s ease-in-out infinite', width: j === 2 ? '80%' : '60%' }} />
                    </td>
                  ))}
                </tr>
              ))
            )}
            {!loading && historialPag.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...table.td, textAlign: 'center', color: C.textMuted, padding: 40 }}>
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
                  <td style={{ ...table.td, fontSize: 11, color: C.red, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={h.errores || ''}>
                    {h.estado === 'error' && h.errores ? h.errores : '—'}
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

      <Paginacion
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        onChange={setPagina}
        porPagina={porPagina}
        onCambiarPorPagina={n => { setPorPagina(n); setPagina(1); }}
      />
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
